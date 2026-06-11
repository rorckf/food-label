package com.example.service;

import com.example.entity.Additive;
import com.example.entity.AdditiveFoodLimit;
import com.example.mapper.AdditiveFoodLimitMapper;
import com.example.mapper.AdditiveMapper;
import com.example.vo.AdditiveInfoVO;
import com.example.vo.IngredientClassificationVO;
import com.example.vo.IngredientClassificationVO.ClassifiedItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/* 第一波优化（基于真实标签样本）：
 *   1) 括号类型扩展为 () （） [] 【】 〔〕，并在 normalize 中迭代剥离以正确处理嵌套
 *   2) 复配判定从单一 "复配" 扩展为 复配/复合/改良剂/调和；
 *      "食品添加剂(...)" / "添加剂(...)" 前缀块直接下钻
 *   3) 新增 INS/E 数字代码映射表，命中后等价为对应中文名再查库
 */

/**
 * 添加剂匹配 + 配料三分类服务。
 * 数据源：additive_knowledge 表（GB 2760-2024）
 */
@Service
@RequiredArgsConstructor
public class AdditiveService {

    private static final String DEFAULT_DESC =
            "暂无详细说明，建议参考 GB 2760-2024 国家食品安全标准";

    /**
     * 辅料关键词库（覆盖水/糖/油/盐/粉/液汁酱/发酵/香精香料等常见辅料）。
     * 集中维护，方便后续扩充。匹配方式：标准化后的配料名包含其中任一关键词。
     */
    private static final List<String> AUXILIARY_KEYWORDS = List.of(
            // 水类
            "水", "饮用水", "纯净水", "矿泉水",
            // 糖类
            "白砂糖", "蔗糖", "冰糖", "红糖", "麦芽糖", "果葡糖浆", "葡萄糖浆", "糖霜",
            // 油类
            "植物油", "菜籽油", "大豆油", "棕榈油", "花生油", "色拉油",
            "玉米油", "葵花籽油", "食用植物油",
            // 盐类
            "食用盐", "食盐", "海盐",
            // 粉类
            "小麦粉", "玉米淀粉", "马铃薯淀粉", "全脂奶粉", "脱脂奶粉", "可可粉", "抹茶粉",
            // 液汁酱类
            "酱油", "食醋", "蚝油", "料酒", "番茄酱", "芝麻酱", "豆瓣酱",
            // 发酵类
            "酵母", "食用酵母", "高活性干酵母", "酶制剂",
            // 其他
            "食用香精", "食用香料"
    );

    /** 疑似添加剂关键词（用于 batchMatchAdditives 在知识库未命中时的兜底判断） */
    private static final Set<String> ADDITIVE_KEYWORDS = Set.of(
            "酸", "胶", "酯", "甜", "色", "素", "钠", "钾",
            "磷", "钙", "镁", "铁", "锌", "铜", "锰", "硒",
            "维生素", "防腐", "增稠", "乳化", "着色", "甜味", "香料"
    );

    /**
     * 括号匹配（覆盖中英文圆括号、方括号、中文方头括号、六角括号）。
     * 用于剥离括号备注 / 提取复配子项。括号内不允许再出现任意一种开/闭括号，
     * 这样配合 iterativelyStripBrackets() 由内向外多轮剥离即可正确处理嵌套结构。
     */
    private static final Pattern BRACKET_PATTERN =
            Pattern.compile("[（(\\[【〔]([^（()\\[【〔）)\\]】〕]*)[）)\\]】〕]");

    /** 复配添加剂内部子项的分隔符 */
    private static final Pattern COMPOUND_SPLIT = Pattern.compile("[、,，;；/]");

    /** "复合添加剂"判定关键词：触发括号下钻 + 子项匹配 */
    private static final List<String> COMPOUND_KEYWORDS = List.of(
            "复配", "复合", "改良剂", "调和"
    );

    /** 添加剂前缀块：见到这些前缀直接对其括号内子项做添加剂匹配 */
    private static final List<String> ADDITIVE_PREFIXES = List.of(
            "食品添加剂", "添加剂"
    );

    /**
     * GB 2760 / INS 数字代码 → 中文标准名（仅收录在真实配料表中可独立出现的常见项）。
     * 命中后等价替换为中文名再走知识库精确/模糊查询。
     */
    private static final Map<String, String> INS_CODE_MAP = Map.ofEntries(
            Map.entry("100", "姜黄素"),
            Map.entry("160a", "β-胡萝卜素"),
            Map.entry("160b", "胭脂树橙"),
            Map.entry("160c", "辣椒红"),
            Map.entry("260", "冰乙酸"),
            Map.entry("270", "乳酸"),
            Map.entry("296", "苹果酸"),
            Map.entry("300", "维生素C"),
            Map.entry("322", "卵磷脂"),
            Map.entry("330", "柠檬酸"),
            Map.entry("331", "柠檬酸钠"),
            Map.entry("339", "磷酸钠"),
            Map.entry("340", "磷酸钾"),
            Map.entry("407", "卡拉胶"),
            Map.entry("410", "刺槐豆胶"),
            Map.entry("412", "瓜尔胶"),
            Map.entry("415", "黄原胶"),
            Map.entry("418", "结冷胶"),
            Map.entry("440", "果胶"),
            Map.entry("450", "焦磷酸钠"),
            Map.entry("450i", "焦磷酸二氢二钠"),
            Map.entry("451", "三聚磷酸钠"),
            Map.entry("452", "六偏磷酸钠"),
            Map.entry("466", "羧甲基纤维素钠"),
            Map.entry("471", "单双甘油脂肪酸酯"),
            Map.entry("472e", "双乙酰酒石酸单双甘油酯"),
            Map.entry("481", "硬脂酰乳酸钠"),
            Map.entry("482", "硬脂酰乳酸钙"),
            Map.entry("500", "碳酸钠"),
            Map.entry("500ii", "碳酸氢钠"),
            Map.entry("501", "碳酸钾"),
            Map.entry("509", "氯化钙"),
            Map.entry("541", "酸式磷酸铝钠"),
            Map.entry("621", "谷氨酸钠"),
            Map.entry("627", "5'-鸟苷酸二钠"),
            Map.entry("631", "5'-肌苷酸二钠"),
            Map.entry("635", "5'-呈味核苷酸二钠"),
            Map.entry("951", "阿斯巴甜"),
            Map.entry("952", "环己基氨基磺酸钠"),
            Map.entry("954", "糖精钠"),
            Map.entry("955", "三氯蔗糖"),
            Map.entry("960", "甜菊糖苷"),
            Map.entry("1400", "糊精"),
            Map.entry("1442", "羟丙基二淀粉磷酸酯"),
            Map.entry("1450", "辛烯基琥珀酸淀粉钠"),
            Map.entry("1520", "丙二醇")
    );

    /** 纯数字 / 数字+小写罗马尾缀（如 450i、500ii、160b）的 INS 代码识别 */
    private static final Pattern INS_CODE_PATTERN = Pattern.compile("^\\d{2,4}[a-z]{0,3}$");

    private final AdditiveMapper additiveMapper;
    private final AdditiveFoodLimitMapper limitMapper;

    /** 查询单个添加剂详情（模块4.2 速查弹窗用） */
    public AdditiveInfoVO getAdditiveInfo(String additiveName) {
        String normalized = normalize(additiveName);
        Additive additive = lookup(normalized);
        if (additive != null) {
            return toVO(additive);
        }
        return new AdditiveInfoVO(normalized, "未知", DEFAULT_DESC, null, null, null);
    }

    /**
     * 按添加剂名称查 GB 2760-2024 食品×限量明细列表（深度解析用，模块4扩展）。
     * 名称模糊命中后走 additive_id 关联查询；找不到返回空列表。
     */
    public List<AdditiveFoodLimit> getLimitsByName(String additiveName) {
        Additive hit = lookup(normalize(additiveName));
        if (hit == null || hit.getId() == null) return List.of();
        return limitMapper.selectByAdditiveId(hit.getId());
    }

    /** 先精确再模糊：解决 GB 2760 名称含括号别名的问题；INS 数字代码先转中文名 */
    private Additive lookup(String name) {
        if (name == null || name.isBlank()) return null;
        String resolved = resolveInsCode(name);
        Additive hit = additiveMapper.selectByName(resolved);
        if (hit != null) return hit;
        return additiveMapper.selectByFuzzyName(resolved);
    }

    /** 若是 INS 数字代码（如 1442、450i、160b），返回对应中文名，否则原样返回 */
    private String resolveInsCode(String name) {
        if (name == null) return null;
        String key = name.trim().toLowerCase();
        if (INS_CODE_PATTERN.matcher(key).matches()) {
            String mapped = INS_CODE_MAP.get(key);
            if (mapped != null) return mapped;
        }
        return name;
    }

    /** 批量匹配配料中的添加剂，返回 Map<名称, 详情> */
    public Map<String, AdditiveInfoVO> batchMatchAdditives(List<String> ingredients) {
        Map<String, AdditiveInfoVO> result = new LinkedHashMap<>();
        if (ingredients == null || ingredients.isEmpty()) return result;

        for (String ingredient : ingredients) {
            String normalized = normalize(ingredient);
            if (normalized.isBlank()) continue;

            Additive found = lookup(normalized);
            if (found != null) {
                result.put(normalized, toVO(found));
                continue;
            }
            if (looksLikeAdditive(normalized)) {
                result.put(normalized,
                        new AdditiveInfoVO(normalized, "未知", DEFAULT_DESC, null, null, null));
            }
        }
        return result;
    }

    /**
     * 配料三分类（模块4.1）。严格按以下优先级执行：
     *   优先级 1：标准化后名称在 additive_knowledge 命中 → 添加剂
     *   优先级 2：包含"复配"关键词 → 复合添加剂（尝试拆解括号内子项）
     *   优先级 3：命中关键词库（水/糖/油/盐/粉/液汁酱…）→ 主料
     *   优先级 4：兜底 → 辅料（包含天然食材，以及 rank ≤ 3 与 rank > 3 但未命中任何库的情况）
     *
     * 入参的 List 顺序即配料表声明顺序，rank = index + 1（"配料表按含量降序排列"）。
     */
    public IngredientClassificationVO classify(List<String> ingredients) {
        IngredientClassificationVO vo = new IngredientClassificationVO();
        if (ingredients == null) return vo;

        for (int i = 0; i < ingredients.size(); i++) {
            String raw = ingredients.get(i);
            if (raw == null) continue;
            int rank = i + 1;

            String preNormalized = normalize(raw);
            if (preNormalized.isBlank()) continue;

            // 优先级 2 前置：复配 / 食品添加剂(...) 等复合形态按整体处理（不预先拆分）
            // 走 resolveCompoundSubItems 从括号中拆出 OCR 原文子项，再各自挂分类
            if (isCompoundAdditive(raw, preNormalized) || hasAdditivePrefix(raw)) {
                List<AdditiveInfoVO> subItems = resolveCompoundSubItems(raw);
                if (subItems.isEmpty()) {
                    AdditiveInfoVO placeholder = new AdditiveInfoVO(
                            preNormalized, "复合添加剂", DEFAULT_DESC, null, null, null);
                    vo.getAdditives().add(placeholder);
                    vo.getItems().add(new ClassifiedItem(raw, preNormalized, "ADDITIVE", rank));
                } else {
                    for (AdditiveInfoVO sub : subItems) {
                        vo.getAdditives().add(sub);
                        vo.getItems().add(new ClassifiedItem(raw, sub.getName(), "ADDITIVE", rank));
                    }
                }
                continue;
            }

            // 其余配料：按 OCR 原文先拆成原子物质（保留 OCR 名作为展示名），再逐个分类
            for (String atom : splitRawIntoAtoms(raw)) {
                classifyAtom(vo, raw, atom, rank);
            }
        }
        deduplicate(vo);
        return vo;
    }

    /**
     * 同一物质在配料表里被多次提及（例：复配中再次出现 / OCR 重复段）会产生重复 tag，
     * 在此按 dedupKey 做组内去重，保留首次出现以维持 rank 顺序。
     */
    private void deduplicate(IngredientClassificationVO vo) {
        Set<String> seenAdd = new java.util.HashSet<>();
        List<AdditiveInfoVO> uniqAdd = new ArrayList<>(vo.getAdditives().size());
        for (AdditiveInfoVO a : vo.getAdditives()) {
            if (seenAdd.add(dedupKey(a.getName()))) uniqAdd.add(a);
        }
        vo.setAdditives(uniqAdd);

        Set<String> seenAux = new java.util.HashSet<>();
        List<String> uniqAux = new ArrayList<>(vo.getAuxiliaryIngredients().size());
        for (String s : vo.getAuxiliaryIngredients()) {
            if (seenAux.add(dedupKey(s))) uniqAux.add(s);
        }
        vo.setAuxiliaryIngredients(uniqAux);

        Set<String> seenMain = new java.util.HashSet<>();
        List<String> uniqMain = new ArrayList<>(vo.getMainIngredients().size());
        for (String s : vo.getMainIngredients()) {
            if (seenMain.add(dedupKey(s))) uniqMain.add(s);
        }
        vo.setMainIngredients(uniqMain);

        Set<String> seenItem = new java.util.HashSet<>();
        List<ClassifiedItem> uniqItems = new ArrayList<>(vo.getItems().size());
        for (ClassifiedItem it : vo.getItems()) {
            String k = it.getGroup() + "|" + dedupKey(it.getNormalizedName());
            if (seenItem.add(k)) uniqItems.add(it);
        }
        vo.setItems(uniqItems);
    }

    /** 去重键：标准化名 + 去除内部空白 + 转小写 */
    private String dedupKey(String s) {
        if (s == null) return "";
        return s.replaceAll("\\s+", "").toLowerCase();
    }

    /**
     * 对单个原子物质名（直接来自 OCR 拆分结果）按优先级 1/3/4 分类。
     * 展示用的名称始终是 OCR 原子名（去括号、全半角统一），不会被替换为 DB 名。
     */
    private void classifyAtom(IngredientClassificationVO vo, String raw, String atom, int rank) {
        String normalized = normalize(atom);
        if (normalized.isBlank()) return;

        // 优先级 1：添加剂知识库命中 → 名字用 OCR 原子，类别/限量从 DB 继承
        Additive found = lookup(normalized);
        if (found != null) {
            String desc = found.getSafetyDesc() != null ? found.getSafetyDesc() : DEFAULT_DESC;
            vo.getAdditives().add(new AdditiveInfoVO(
                    normalized,
                    found.getFunctionCategory(),
                    desc,
                    found.getUsageScope(),
                    found.getMaxDosage(),
                    found.getDiseaseContraindication()));
            vo.getItems().add(new ClassifiedItem(raw, normalized, "ADDITIVE", rank));
            return;
        }

        // 优先级 3：命中关键词库（水/糖/油/盐/粉/液汁酱…）→ 主料
        if (matchesAuxiliary(normalized)) {
            vo.getMainIngredients().add(normalized);
            vo.getItems().add(new ClassifiedItem(raw, normalized, "MAIN", rank));
            return;
        }

        // 优先级 4：兜底 → 辅料
        vo.getAuxiliaryIngredients().add(normalized);
        vo.getItems().add(new ClassifiedItem(raw, normalized, "AUXILIARY", rank));
    }

    /**
     * 把一条 OCR 原始配料字符串按"原子物质"维度拆分（每个原子保留 OCR 原文）。
     *   1. 任一括号含「包括 X、Y、Z」 → 取 X、Y、Z
     *   2. 否则剥离括号后按 顿号/中英文逗号/分号/斜杠 切
     *   3. 否则单原子
     */
    private List<String> splitRawIntoAtoms(String raw) {
        if (raw == null) return List.of();
        String h = toHalfWidth(raw);

        Matcher m = BRACKET_PATTERN.matcher(h);
        while (m.find()) {
            String content = m.group(1);
            if (content == null) continue;
            int idx = content.indexOf("包括");
            if (idx >= 0) {
                List<String> atoms = splitAtoms(content.substring(idx + "包括".length()));
                if (!atoms.isEmpty()) return atoms;
            }
        }

        String stripped = iterativelyStripBrackets(h).trim();
        if (stripped.isEmpty()) return List.of();
        if (COMPOUND_SPLIT.matcher(stripped).find()) {
            List<String> atoms = splitAtoms(stripped);
            if (!atoms.isEmpty()) return atoms;
        }
        return List.of(stripped);
    }

    // ─── 私有辅助 ───────────────────────────────────────────────────────────

    private AdditiveInfoVO toVO(Additive a) {
        return new AdditiveInfoVO(
                a.getAdditiveName(),
                a.getFunctionCategory(),
                a.getSafetyDesc() != null ? a.getSafetyDesc() : DEFAULT_DESC,
                a.getUsageScope(),
                a.getMaxDosage(),
                a.getDiseaseContraindication()
        );
    }

    /**
     * 标准化配料名：
     *   1. 迭代剥离所有中英文括号 / 方括号 / 中文方头括号 / 六角括号及其中内容（由内向外）
     *   2. 全角字符 → 半角（数字/字母/常用标点/空格）
     *   3. 去除首尾空白
     */
    private String normalize(String raw) {
        if (raw == null) return "";
        String s = iterativelyStripBrackets(raw);
        s = toHalfWidth(s);
        return s.trim();
    }

    /** 由内向外多轮剥离括号，处理任意深度嵌套。最多 8 轮，防御异常文本。 */
    private String iterativelyStripBrackets(String s) {
        for (int i = 0; i < 8; i++) {
            String next = BRACKET_PATTERN.matcher(s).replaceAll("");
            if (next.equals(s)) return next;
            s = next;
        }
        return s;
    }

    private boolean isCompoundAdditive(String raw, String normalized) {
        for (String kw : COMPOUND_KEYWORDS) {
            if ((raw != null && raw.contains(kw)) || normalized.contains(kw)) return true;
        }
        return false;
    }

    /** 是否以 "食品添加剂(" / "添加剂(" 开头（兼容全角及方头/六角括号变体） */
    private boolean hasAdditivePrefix(String raw) {
        if (raw == null) return false;
        String trimmed = raw.trim();
        for (String prefix : ADDITIVE_PREFIXES) {
            for (char open : new char[]{'(', '（', '[', '【', '〔'}) {
                if (trimmed.startsWith(prefix + open)) return true;
            }
        }
        return false;
    }

    /** 全角 → 半角（覆盖 ASCII 可见字符与全角空格） */
    private String toHalfWidth(String s) {
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == 0x3000) {                          // 全角空格
                sb.append(' ');
            } else if (c >= 0xFF01 && c <= 0xFF5E) {    // 全角 ! ~ → 半角
                sb.append((char) (c - 0xFEE0));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * 从原始配料名（含括号）中提取复配添加剂的子项，并尝试在知识库中匹配。
     * 例：复配膨松剂(碳酸氢钠,焦磷酸二氢二钠) → [碳酸氢钠, 焦磷酸二氢二钠]
     */
    private List<AdditiveInfoVO> resolveCompoundSubItems(String raw) {
        List<AdditiveInfoVO> subs = new ArrayList<>();
        if (raw == null) return subs;

        Matcher m = BRACKET_PATTERN.matcher(toHalfWidth(raw));
        while (m.find()) {
            String content = m.group(1);
            if (content == null || content.isBlank()) continue;
            int incl = content.indexOf("包括");
            if (incl >= 0) content = content.substring(incl + "包括".length());
            for (String part : COMPOUND_SPLIT.split(content)) {
                String pn = part == null ? "" : part.trim();
                if (pn.isEmpty()) continue;
                Additive sub = lookup(pn);
                if (sub != null) {
                    String desc = sub.getSafetyDesc() != null ? sub.getSafetyDesc() : DEFAULT_DESC;
                    subs.add(new AdditiveInfoVO(
                            pn,
                            sub.getFunctionCategory(),
                            desc,
                            sub.getUsageScope(),
                            sub.getMaxDosage(),
                            sub.getDiseaseContraindication()));
                } else {
                    subs.add(new AdditiveInfoVO(pn, "未知", DEFAULT_DESC, null, null, null));
                }
            }
        }
        return subs;
    }

    private List<String> splitAtoms(String s) {
        List<String> out = new ArrayList<>();
        if (s == null) return out;
        for (String p : COMPOUND_SPLIT.split(s)) {
            String t = p == null ? "" : p.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    private boolean matchesAuxiliary(String normalized) {
        for (String kw : AUXILIARY_KEYWORDS) {
            if (normalized.contains(kw)) return true;
        }
        return false;
    }

    private boolean looksLikeAdditive(String name) {
        return ADDITIVE_KEYWORDS.stream().anyMatch(name::contains);
    }
}
