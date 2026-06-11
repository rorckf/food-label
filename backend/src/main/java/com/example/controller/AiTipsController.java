package com.example.controller;

import com.example.vo.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai-tips")
public class AiTipsController {

    private static final Map<String, List<String>> TIPS = Map.of(
        "nutrition", List.of(
            "膳食纤维有助于维持肠道健康，建议每天摄入足够的蔬菜水果。",
            "蛋白质是身体的重要组成部分，优先选择优质蛋白来源，如鱼、豆类、蛋类。",
            "减少精制糖摄入，选择天然食品代替含糖饮料和零食。",
            "控制钠盐摄入，成人每日钠摄入量建议不超过2000毫克。",
            "健康的脂肪来源包括坚果、橄榄油和深海鱼类，有益于心血管健康。"
        ),
        "safety", List.of(
            "购买食品时注意查看SC生产许可证编号，确保产品来源正规可靠。",
            "食品包装应完好无损，避免购买包装破损或变形的产品。",
            "注意查看生产日期和保质期，选择新鲜度高的食品。",
            "储存食品时应遵循标签指示的温度条件，确保食品安全。",
            "生熟食品分开存放，避免交叉污染，保障饮食卫生。"
        ),
        "additive", List.of(
            "苯甲酸钠是常见防腐剂，在国家标准范围内使用不会危害健康。",
            "天然色素（如红曲红、焦糖色）比合成色素更受消费者青睐。",
            "阿斯巴甜是常用甜味剂，适量摄入对健康人群无害，苯丙酮尿症患者应避免。",
            "卡拉胶作为增稠剂广泛用于乳制品，在正常使用量下是安全的。",
            "柠檬酸是天然有机酸，常用作调味剂和防腐剂，安全性高。"
        )
    );

    @GetMapping("/health-tips")
    public Result<Map<String, Object>> getHealthTips(@RequestParam(required = false) String type) {
        List<String> tips = type != null ? TIPS.getOrDefault(type, TIPS.get("nutrition")) : TIPS.get("nutrition");
        return Result.success(Map.of("tips", tips));
    }
}
