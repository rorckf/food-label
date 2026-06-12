package com.example.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.example.entity.HistoryRecord;
import com.example.vo.AdditiveInfoVO;
import com.example.vo.ExplainRequest;
import com.example.vo.HealthTip;
import com.example.vo.NutritionInfo;
import com.example.vo.RecognitionResultVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 识别解析核心业务逻辑：
 *   接收图片 → 保存文件 → 调用 AI → 解析结果
 *   → 匹配添加剂 → 生成健康提示 → 保存记录 → 返回 VO
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecognizeService {

    private final FileService      fileService;
    private final QwenService      qwenService;
    private final AdditiveService  additiveService;
    private final NutritionService nutritionService;
    private final HistoryService   historyService;
    private final ShelfLifeService shelfLifeService;
    private final AllergenService  allergenService;

    public RecognitionResultVO analyzeLabel(MultipartFile file, Long userId) throws IOException {
        return analyzeLabel(file, userId, null, null, null);
    }

    /**
     * 识别解析（支持前端覆盖大模型配置）。
     * apiKey / model / endpoint 为空时回退到 application.yml 默认配置。
     */
    public RecognitionResultVO analyzeLabel(MultipartFile file, Long userId,
                                            String apiKey, String model, String endpoint) throws IOException {

        // 1. 保存图片
        String imageUrl = fileService.saveImage(file);
        log.info("图片已保存，url={}", imageUrl);

        // 2. 调用 Qwen-VL（前端可覆盖 Key / 模型 / 接口地址）
        JSONObject aiJson = qwenService.callVisionAPI(imageUrl, apiKey, model, endpoint);
        log.info("AI 识别完成，productName={}", aiJson.getString("productName"));

        // 3. 解析基本字段
        String     productName = aiJson.getString("productName");
        String     category    = aiJson.getString("category");
        String     netContent  = aiJson.getString("netContent");
        JSONObject nutJson     = aiJson.getJSONObject("nutrition");
        JSONArray  ingArray    = aiJson.getJSONArray("ingredients");

        // 4. 构造营养信息（先取原始值，再按 NRV% 与能量交叉校验修正）
        NutritionInfo nutrition = new NutritionInfo();
        Map<String, String> fixFlag = new HashMap<>();
        if (nutJson != null) {
            nutrition.setEnergy(nutJson.getDouble("energy"));
            nutrition.setProtein(nutJson.getDouble("protein"));
            nutrition.setFat(nutJson.getDouble("fat"));
            nutrition.setCarbohydrate(nutJson.getDouble("carbohydrate"));
            nutrition.setSodium(nutJson.getDouble("sodium"));
            fixFlag = validateAndFixNutrition(nutrition, nutJson);
        }

        // 5. 解析配料列表
        List<String> ingredients = new ArrayList<>();
        if (ingArray != null) {
            for (int i = 0; i < ingArray.size(); i++) {
                ingredients.add(ingArray.getString(i));
            }
        }

        // 6. 批量匹配添加剂
        Map<String, AdditiveInfoVO> additiveMap =
                additiveService.batchMatchAdditives(ingredients);
        log.info("添加剂匹配完成，命中数={}", additiveMap.size());

        // 7. 生成健康提示（解析净含量数值，无法解析时默认 100g）
        double netG = parseGrams(netContent);
        List<HealthTip> healthTips = nutritionService.generateHealthTips(nutrition, netG);
        healthTips.addAll(nutritionService.generateAdditiveTips(additiveMap));

        // 8. 装配 VO
        String standardRaw   = aiJson.getString("standard");
        String productionRaw = aiJson.getString("productionDate");
        String shelfLifeRaw  = aiJson.getString("shelfLife");
        String allergenText  = aiJson.getString("allergenText");

        // 8.1 执行标准码反查品类（命中即覆盖 LLM 的 category，未命中保持原值）
        String categoryFromStandard = StandardCodeMap.lookup(standardRaw);
        if (categoryFromStandard != null) {
            log.info("category 由 LLM[{}] 修正为标准码反查值[{}]，standard={}",
                    category, categoryFromStandard, standardRaw);
            category = categoryFromStandard;
        }

        // 8.2 保质期解析（生产日期 + 保质期 / 保质期至）
        var shelfLifeStatus = shelfLifeService.evaluate(productionRaw, shelfLifeRaw);
        log.info("保质期解析：status={}, expiry={}, daysRemaining={}",
                shelfLifeStatus.getStatus(), shelfLifeStatus.getExpiryDate(),
                shelfLifeStatus.getDaysRemaining());

        // 8.3 致敏原结构化（配料 + 标签致敏原段落）
        var allergens = allergenService.extract(ingredients, allergenText);
        log.info("致敏原识别：contains={}, mayContain={}",
                allergens.get("contains"), allergens.get("mayContain"));

        RecognitionResultVO vo = new RecognitionResultVO();
        vo.setUserId(userId);
        vo.setImageUrl(imageUrl);
        vo.setProductName(productName);
        vo.setCategory(category);
        vo.setNetContent(netContent);
        vo.setManufacturer(aiJson.getString("manufacturer"));
        vo.setLicenseNumber(aiJson.getString("licenseNumber"));
        vo.setStandard(standardRaw);
        vo.setOrigin(aiJson.getString("origin"));
        vo.setProductionDate(productionRaw);
        vo.setShelfLife(shelfLifeRaw);
        vo.setStorage(aiJson.getString("storage"));
        vo.setContact(aiJson.getString("contact"));
        vo.setNutrition(nutrition);
        vo.setIngredients(ingredients);
        vo.setAdditiveMap(additiveMap);
        vo.setHealthTips(healthTips);
        vo.setFixFlag(fixFlag);
        vo.setShelfLifeStatus(shelfLifeStatus);
        vo.setAllergenText(allergenText);
        vo.setAllergens(allergens);
        vo.setCategoryFromStandard(categoryFromStandard);

        // 9. 计算健康评分（与对比模块共用算法）
        int healthScore = HealthScoreCalculator.calc(vo);

        // 10. 持久化（完整结果序列化进 result_json，category/healthScore 单列存便于检索）
        HistoryRecord record = historyService.saveHistory(
                userId, productName, category, imageUrl, JSON.toJSONString(vo), healthScore);
        log.info("识别记录已保存，id={}, healthScore={}", record.getId(), healthScore);

        vo.setId(record.getId());
        return vo;
    }

    // ─── 配料表「翻译成人话」 ────────────────────────────────────────────────

    private static final String EXPLAIN_SYSTEM_PROMPT =
            "你是一个亲切的食品健康科普助手。请用通俗易懂的大白话，给普通消费者点评下面这款食品的配料和营养，" +
            "帮他们一眼看懂这东西到底是什么、值不值得买。要求：\n" +
            "1) 先一句话说清这东西本质上主要是什么（例如“说白了就是糖水加香精色素”）；\n" +
            "2) 点出值得注意的添加剂或营养问题（高糖/高钠/防腐剂/色素等），配料干净就如实夸；\n" +
            "3) 给一句接地气的建议（能不能吃、适合谁、怎么吃）。\n" +
            "整体控制在 150 字以内，语气亲切口语化，可以适当用 emoji，" +
            "写成连贯的两三句话，不要分点编号，不要客套开场白，直接说结论。";

    /**
     * 「配料翻译成人话」：拼 prompt 调大模型生成大白话点评。
     * apiKey / model / endpoint 为空时回退默认配置。
     *
     * @return 大白话点评文本；失败返回 null
     */
    public String explainIngredients(ExplainRequest req, String apiKey, String model, String endpoint) {
        StringBuilder sb = new StringBuilder();
        sb.append(EXPLAIN_SYSTEM_PROMPT).append("\n\n=== 待点评食品信息 ===\n");
        sb.append("产品名称：").append(orDash(req.getProductName())).append('\n');
        sb.append("食品品类：").append(orDash(req.getCategory())).append('\n');

        if (req.getIngredients() != null && !req.getIngredients().isEmpty()) {
            sb.append("配料表：").append(String.join("、", req.getIngredients())).append('\n');
        }
        if (req.getAdditives() != null && !req.getAdditives().isEmpty()) {
            sb.append("已识别添加剂：").append(String.join("、", req.getAdditives())).append('\n');
        }

        StringBuilder nut = new StringBuilder();
        appendIfPresent(nut, "能量", req.getEnergy(), "");
        appendIfPresent(nut, "蛋白质", req.getProtein(), "g");
        appendIfPresent(nut, "脂肪", req.getFat(), "g");
        appendIfPresent(nut, "碳水", req.getCarbohydrate(), "g");
        appendIfPresent(nut, "钠", req.getSodium(), "mg");
        if (nut.length() > 0) {
            sb.append("每100g营养：").append(nut).append('\n');
        }

        String prompt = sb.toString();
        log.info("配料翻译请求，product={}", req.getProductName());
        return qwenService.callTextModel(prompt, apiKey, model, endpoint);
    }

    private static String orDash(String s) {
        return (s == null || s.isBlank()) ? "未知" : s;
    }

    private static void appendIfPresent(StringBuilder sb, String name, Double value, String unit) {
        if (value == null) return;
        if (sb.length() > 0) sb.append("，");
        sb.append(name).append(' ').append(value).append(unit);
    }

    // ─── 营养数据校验与修正 ────────────────────────────────────────────────

    /** GB 28050-2025 成人每日 NRV 基准值 */
    private static final double NRV_ENERGY  = 8400.0; // kJ
    private static final double NRV_PROTEIN = 60.0;   // g
    private static final double NRV_FAT     = 60.0;   // g
    private static final double NRV_CARB    = 300.0;  // g
    private static final double NRV_SODIUM  = 2000.0; // mg

    /** NRV% 反推与原始值的允许偏差阈值 */
    private static final double DEVIATION_THRESHOLD = 0.20;

    /**
     * 利用 NRV% 反推 + 能量-三大营养素交叉校验，修正大模型识别误差。
     *
     * @param nutrition 已经从 JSON 中取出的原始营养数据（会被原地修改）
     * @param nutJson   大模型返回的 nutrition 节点，包含 xxxNRV 字段
     * @return 每个指标的来源标记 raw / nrv / energyCalc
     */
    private Map<String, String> validateAndFixNutrition(NutritionInfo nutrition, JSONObject nutJson) {
        Map<String, String> flag = new HashMap<>();

        // 步骤 2：逐项按 NRV% 校验
        Double energy = fixByNrv("energy", nutrition.getEnergy(),
                nutJson.getDouble("energyNRV"), NRV_ENERGY, flag);
        Double protein = fixByNrv("protein", nutrition.getProtein(),
                nutJson.getDouble("proteinNRV"), NRV_PROTEIN, flag);
        Double fat = fixByNrv("fat", nutrition.getFat(),
                nutJson.getDouble("fatNRV"), NRV_FAT, flag);
        Double carbohydrate = fixByNrv("carbohydrate", nutrition.getCarbohydrate(),
                nutJson.getDouble("carbohydrateNRV"), NRV_CARB, flag);
        Double sodium = fixByNrv("sodium", nutrition.getSodium(),
                nutJson.getDouble("sodiumNRV"), NRV_SODIUM, flag);

        // 步骤 3：能量与三大营养素交叉校验（kJ：蛋白×17 + 脂肪×37 + 碳水×17）
        if (protein != null && fat != null && carbohydrate != null) {
            double calcEnergy = protein * 17 + fat * 37 + carbohydrate * 17;
            if (calcEnergy > 0) {
                if (energy == null) {
                    energy = calcEnergy;
                    flag.put("energy", "energyCalc");
                    log.info("能量缺失，由三大营养素估算={} kJ", round(calcEnergy));
                } else {
                    double dev = Math.abs(energy - calcEnergy) / calcEnergy;
                    if (dev > DEVIATION_THRESHOLD) {
                        log.info("能量值与营养素不匹配（原值={}, 推算={}），按推算值修正",
                                energy, round(calcEnergy));
                        energy = calcEnergy;
                        flag.put("energy", "energyCalc");
                    }
                }
            }
        }

        // 步骤 4：碳水化合物兜底——能量明显偏大但碳水缺失/为 0
        if ((carbohydrate == null || carbohydrate == 0.0) && energy != null && energy > 0) {
            double p = protein == null ? 0 : protein;
            double f = fat == null ? 0 : fat;
            double estCarb = (energy - p * 17 - f * 37) / 17.0;
            if (estCarb > 0) {
                log.info("碳水缺失/为 0，由能量差值估算={} g", round(estCarb));
                carbohydrate = estCarb;
                flag.put("carbohydrate", "energyCalc");
            } else {
                log.info("碳水数据无法推算，保留 0");
                carbohydrate = 0.0;
                flag.put("carbohydrate", "raw");
            }
        }

        nutrition.setEnergy(energy);
        nutrition.setProtein(protein);
        nutrition.setFat(fat);
        nutrition.setCarbohydrate(carbohydrate);
        nutrition.setSodium(sodium);
        return flag;
    }

    /**
     * 单项指标按 NRV% 校验：
     * A) 有 NRV% 无数值 → 反推；
     * B) 两者皆有但矛盾（偏差 > 20%）→ 取反推值；
     * C) 有数值无 NRV% → 保留原始值。
     */
    private Double fixByNrv(String key, Double rawValue, Double nrvPercent,
                            double nrvBase, Map<String, String> flag) {
        boolean hasValue = rawValue != null;
        boolean hasNrv   = nrvPercent != null && nrvPercent > 0;

        if (!hasValue && hasNrv) {
            double back = nrvPercent.doubleValue() / 100.0 * nrvBase;
            log.info("[{}] 数值缺失，由 NRV%={} 反推={}", key, nrvPercent, round(back));
            flag.put(key, "nrv");
            return round(back);
        }
        if (hasValue && hasNrv) {
            double raw = rawValue.doubleValue();
            double back = nrvPercent.doubleValue() / 100.0 * nrvBase;
            if (back > 0) {
                double dev = Math.abs(raw - back) / back;
                if (dev > DEVIATION_THRESHOLD) {
                    log.info("[{}] 原值={} 与 NRV% 反推={} 偏差 {}%，按 NRV% 修正",
                            key, raw, round(back), Math.round(dev * 100));
                    flag.put(key, "nrv");
                    return round(back);
                }
            }
            flag.put(key, "raw");
            return rawValue;
        }
        if (hasValue) {
            flag.put(key, "raw");
            return rawValue;
        }
        return null;
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    /**
     * 从净含量字符串中提取总克数。
     *   "250ml"→250, "500g"→500;
     *   多件装 "100g×5"→500、"2×100g"→200(取前两个数字相乘)。
     * 旧实现把所有数字字符拼接("100g×5"→1005),已修复。
     */
    private double parseGrams(String netContent) {
        if (netContent == null || netContent.isBlank()) return 100.0;
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\\d+(?:\\.\\d+)?").matcher(netContent);
        java.util.List<Double> nums = new java.util.ArrayList<>();
        while (m.find()) {
            double v = Double.parseDouble(m.group());
            if (v > 0) nums.add(v);
        }
        if (nums.isEmpty()) return 100.0;
        // 含乘号(×/x/*)的多件装:前两个数字相乘
        if (netContent.matches(".*[×xX*].*") && nums.size() >= 2) {
            return nums.get(0) * nums.get(1);
        }
        return nums.get(0);
    }
}
