package com.example.service;

import com.example.vo.AdditiveInfoVO;
import com.example.vo.HealthTip;
import com.example.vo.NutritionInfo;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 营养健康提示服务
 * 依据 GB 28050-2025 NRV 参考值，将每 100g 数据换算为整份，
 * 按比例划分"偏低 / 适中 / 偏高"并生成通俗化提示。
 */
@Service
public class NutritionService {

    // GB 28050-2025 每日参考摄入量（NRV）
    private static final double NRV_ENERGY      = 8400.0;  // kJ（GB 28050-2025）
    private static final double NRV_PROTEIN     = 60.0;    // g
    private static final double NRV_FAT         = 60.0;    // g
    private static final double NRV_CARB        = 300.0;   // g
    private static final double NRV_SODIUM      = 2000.0;  // mg

    private static final double LOW_THRESHOLD   = 15.0;    // < 15% → 偏低
    private static final double HIGH_THRESHOLD  = 30.0;    // > 30% → 偏高

    /**
     * 生成健康提示列表
     *
     * @param nutrition   每 100g 营养成分
     * @param netContentG 净含量（克）
     */
    public List<HealthTip> generateHealthTips(NutritionInfo nutrition, double netContentG) {
        List<HealthTip> tips = new ArrayList<>();
        if (nutrition == null || netContentG <= 0) return tips;

        double ratio = netContentG / 100.0;

        addTip(tips, "能量",     nutrition.getEnergy(),      ratio, NRV_ENERGY,
                "能量偏高，建议控制每日摄入总量",
                "能量适中，正常食用即可",
                "能量偏低，可作为低卡零食选择");

        addTip(tips, "蛋白质",   nutrition.getProtein(),     ratio, NRV_PROTEIN,
                "蛋白质含量较高，适合运动后补充",
                "蛋白质含量适中",
                "蛋白质含量较低，可搭配高蛋白食物一同食用");

        addTip(tips, "脂肪",     nutrition.getFat(),         ratio, NRV_FAT,
                "脂肪含量偏高，建议适量食用，避免增加心血管负担",
                "脂肪含量适中，正常食用无需担心",
                "脂肪含量较低，适合控脂人群");

        addTip(tips, "碳水化合物", nutrition.getCarbohydrate(), ratio, NRV_CARB,
                "碳水化合物偏高，糖尿病患者请注意控制食用量",
                "碳水化合物含量适中",
                "碳水化合物含量较低，适合低碳饮食人群");

        addTip(tips, "钠",       nutrition.getSodium(),      ratio, NRV_SODIUM,
                "钠含量偏高，建议控制食用量，高血压及肾病患者尤需注意",
                "钠含量适中，正常食用无需担心",
                "钠含量较低，适合低钠饮食人群");

        return tips;
    }

    /**
     * 添加剂疾病禁忌提示（模块5.1）
     * 遍历命中的添加剂，根据 disease_contraindication 字段生成形如
     * "含苯甲酸钠，高血压人群不建议食用" 的风险卡片。
     */
    public List<HealthTip> generateAdditiveTips(Map<String, AdditiveInfoVO> additiveMap) {
        List<HealthTip> tips = new ArrayList<>();
        if (additiveMap == null || additiveMap.isEmpty()) return tips;

        for (AdditiveInfoVO info : additiveMap.values()) {
            String contra = info.getDiseaseContraindication();
            if (contra == null || contra.isBlank()) continue;
            String text = String.format("含%s，%s人群不建议食用", info.getName(), contra);
            tips.add(new HealthTip("添加剂禁忌", null, "偏高", text));
        }
        return tips;
    }

    private void addTip(List<HealthTip> tips,
                        String name, Double per100g, double ratio, double nrv,
                        String highText, String midText, String lowText) {
        if (per100g == null || per100g <= 0) return;
        double perPortion = per100g * ratio;
        double pct = Math.round(perPortion / nrv * 1000.0) / 10.0; // 保留一位小数
        String level;
        String text;
        if (pct > HIGH_THRESHOLD) {
            level = "偏高";
            text  = highText;
        } else if (pct >= LOW_THRESHOLD) {
            level = "适中";
            text  = midText;
        } else {
            level = "偏低";
            text  = lowText;
        }
        tips.add(new HealthTip(name, pct, level, text));
    }
}
