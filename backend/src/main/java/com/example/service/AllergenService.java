package com.example.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 致敏原结构化提取（依据 GB 7718-2011 八大类 + 麸质单列）。
 *
 * <p>输入：配料表原文 + 标签上的"致敏原信息/致敏物质提示"原文（任一可缺）。</p>
 * <p>输出：标准化集合，前端可直接与用户过敏标签做交集匹配并红框告警。</p>
 *
 * <p>策略：仅做关键词包含匹配；为避免误伤，关键词列表保守，宁缺毋滥。
 * 例如不把 "椰子" 归入坚果（GB 标注体系里椰子不属于树坚果）。</p>
 */
@Service
public class AllergenService {

    /** 标准化致敏原标签 → 关键词（按声明顺序检测） */
    private static final Map<String, List<String>> ALLERGEN_KEYWORDS = new LinkedHashMap<>();
    static {
        // 含麸质的谷物：小麦/大麦/燕麦/黑麦/麸 等
        ALLERGEN_KEYWORDS.put("麸质", List.of(
                "麸质", "小麦", "大麦", "黑麦", "燕麦", "面粉", "麦片", "麦芽", "麦胚"
        ));
        // 蛋
        ALLERGEN_KEYWORDS.put("蛋", List.of(
                "鸡蛋", "蛋液", "蛋白", "蛋黄", "蛋粉", "全蛋", "蛋类"
        ));
        // 乳
        ALLERGEN_KEYWORDS.put("乳", List.of(
                "牛奶", "鲜奶", "奶粉", "乳粉", "乳清", "奶油", "黄油", "奶酪", "干酪",
                "炼乳", "乳脂", "乳制品", "乳球", "巴氏杀菌乳"
        ));
        // 大豆
        ALLERGEN_KEYWORDS.put("大豆", List.of(
                "大豆", "黄豆", "豆粉", "豆浆", "豆制品", "腐竹", "大豆蛋白", "大豆油",
                "豆瓣", "酱油"  // 多数酿造酱油以大豆为原料
        ));
        // 花生
        ALLERGEN_KEYWORDS.put("花生", List.of("花生"));
        // 树坚果（保守列表，不含椰子）
        ALLERGEN_KEYWORDS.put("坚果", List.of(
                "核桃", "杏仁", "腰果", "榛子", "开心果", "夏威夷果", "碧根果", "巴旦木",
                "松子", "栗子", "山核桃", "树坚果"
        ));
        // 甲壳类
        ALLERGEN_KEYWORDS.put("甲壳类", List.of(
                "虾", "蟹", "龙虾", "蟹黄", "蟹肉", "甲壳"
        ));
        // 鱼
        ALLERGEN_KEYWORDS.put("鱼", List.of(
                "鱼肉", "鱼粉", "鳕鱼", "三文鱼", "金枪鱼", "带鱼", "银鲈鱼",
                "沙丁鱼", "鱼类", "鱼皮", "鱼油"
        ));
        // 芝麻
        ALLERGEN_KEYWORDS.put("芝麻", List.of("芝麻", "芝麻油", "芝麻酱"));
    }

    /** 交叉污染提示关键词，命中即在结果上额外打 "可能含" 前缀 */
    private static final List<String> CROSS_CONTAM_HINTS = List.of(
            "本产品线", "同生产线", "本生产线", "可能含", "也加工"
    );

    /**
     * 抽取致敏原集合。
     *
     * @param ingredients   配料列表（已结构化的原始字符串列表，可为空）
     * @param allergenText  标签上致敏原段落原文（可为 null）
     * @return 含两个键：{@code "contains"} → 明确含；{@code "mayContain"} → 可能含（交叉污染）。
     *         任一集合可能为空但不为 null。
     */
    public Map<String, Set<String>> extract(List<String> ingredients, String allergenText) {
        Set<String> contains   = new LinkedHashSet<>();
        Set<String> mayContain = new LinkedHashSet<>();

        // 1. 配料表本体扫描 → 明确含
        if (ingredients != null) {
            String joined = String.join(" ", ingredients);
            scan(joined, contains);
        }

        // 2. 致敏原段落：先按交叉污染关键词切分，前段为 contains，后段为 mayContain
        if (allergenText != null && !allergenText.isBlank()) {
            int splitIdx = -1;
            for (String hint : CROSS_CONTAM_HINTS) {
                int i = allergenText.indexOf(hint);
                if (i >= 0 && (splitIdx == -1 || i < splitIdx)) splitIdx = i;
            }
            if (splitIdx == -1) {
                scan(allergenText, contains);
            } else {
                scan(allergenText.substring(0, splitIdx), contains);
                scan(allergenText.substring(splitIdx), mayContain);
            }
        }

        // 3. 去重：mayContain 已在 contains 里的剔除
        mayContain.removeAll(contains);

        return Map.of("contains", contains, "mayContain", mayContain);
    }

    private void scan(String text, Set<String> sink) {
        if (text == null || text.isBlank()) return;
        for (Map.Entry<String, List<String>> e : ALLERGEN_KEYWORDS.entrySet()) {
            for (String kw : e.getValue()) {
                if (text.contains(kw)) {
                    sink.add(e.getKey());
                    break;
                }
            }
        }
    }
}
