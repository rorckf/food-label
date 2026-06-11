package com.example.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * GB / SB 执行标准代号 → 食品品类。
 *
 * <p>用法：在 {@link RecognizeService} 拿到 LLM 返回的 standard 字段后，
 * 调用 {@link #lookup(String)} 反查可信品类。命中即覆盖 LLM 给出的 category，
 * 未命中（或 Q/* 企业标准）保留 LLM 结果。</p>
 *
 * <p>映射目标使用 {@code QwenService.SYSTEM_PROMPT} 里的同一套品类名，
 * 保证下游对比模块（同品类对比）不会出现新枚举。</p>
 */
public final class StandardCodeMap {

    private StandardCodeMap() {}

    /** 标准代号（不区分 GB / GB/T / SB / SB/T，去空格后比较）→ 标准品类 */
    private static final Map<String, String> CODE_TO_CATEGORY = new LinkedHashMap<>();
    static {
        // 烘焙糕点
        CODE_TO_CATEGORY.put("GB7099",   "烘焙");   // 糕点、面包通用
        CODE_TO_CATEGORY.put("GB/T20977","烘焙");   // 糕点
        CODE_TO_CATEGORY.put("GB/T20981","烘焙");   // 面包
        CODE_TO_CATEGORY.put("GB/T20980","烘焙");   // 饼干
        CODE_TO_CATEGORY.put("GB/T23823","烘焙");   // 月饼

        // 速冻
        CODE_TO_CATEGORY.put("GB19295",  "方便食品"); // 速冻面米食品
        CODE_TO_CATEGORY.put("SB/T10423","方便食品"); // 速冻汤圆

        // 肉制品
        CODE_TO_CATEGORY.put("GB/T23969","肉制品");   // 肉干
        CODE_TO_CATEGORY.put("GB2726",   "肉制品");   // 熟肉制品
        CODE_TO_CATEGORY.put("GB2730",   "肉制品");   // 腌腊肉制品

        // 水产
        CODE_TO_CATEGORY.put("GB10136",  "其他");     // 动物性水产
        CODE_TO_CATEGORY.put("GB2733",   "其他");     // 鲜冻动物性水产

        // 豆制品
        CODE_TO_CATEGORY.put("GB2712",   "其他");     // 豆制品（暂归其他，无对应枚举）
        CODE_TO_CATEGORY.put("GB/T22106","其他");     // 非发酵豆制品

        // 乳制品
        CODE_TO_CATEGORY.put("GB19644",  "乳制品");   // 乳粉
        CODE_TO_CATEGORY.put("GB19645",  "乳制品");   // 巴氏杀菌乳
        CODE_TO_CATEGORY.put("GB25192",  "乳制品");   // 再制干酪
        CODE_TO_CATEGORY.put("GB5420",   "乳制品");   // 干酪

        // 饮料
        CODE_TO_CATEGORY.put("GB7101",   "饮料");
        CODE_TO_CATEGORY.put("GB/T10789","饮料");
        CODE_TO_CATEGORY.put("GB/T21733","饮料");     // 茶饮料

        // 糖果零食（GB/T 23823 月饼归 烘焙，已在上面登记，此处不重复）
        CODE_TO_CATEGORY.put("SB/T10018","糖果零食"); // 沙琪玛
        CODE_TO_CATEGORY.put("GB/T20978","糖果零食");

        // 调味品
        CODE_TO_CATEGORY.put("GB2717",   "调味品");   // 酱油
        CODE_TO_CATEGORY.put("GB2719",   "调味品");   // 食醋

        // 茶
        CODE_TO_CATEGORY.put("GB/T14456","茶叶");

        // 酒
        CODE_TO_CATEGORY.put("GB/T10781","酒类");
        CODE_TO_CATEGORY.put("GB/T15037","酒类");
    }

    /** 抓取首个 GB / SB 编号；忽略字母大小写、空格、多种连字符 */
    private static final Pattern CODE_PATTERN = Pattern.compile(
            "(GB|SB)\\s*(/\\s*T)?\\s*(\\d{3,5})", Pattern.CASE_INSENSITIVE);

    /**
     * 从执行标准原文里反查品类；命中返回标准品类名，否则返回 null。
     * 入参形如 {@code "GB/T 20977"} / {@code "GB 7099"} / {@code "Q/HLSSP 0004S"}。
     * 企业标准（Q/*）始终返回 null，由 LLM 的 category 字段兜底。
     */
    public static String lookup(String standard) {
        if (standard == null || standard.isBlank()) return null;
        Matcher m = CODE_PATTERN.matcher(standard);
        if (!m.find()) return null;

        String prefix = m.group(1).toUpperCase();
        String slashT = m.group(2) != null ? "/T" : "";
        String num    = m.group(3);
        String key    = prefix + slashT + num;
        return CODE_TO_CATEGORY.get(key);
    }
}
