package com.example.vo;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 两款产品对比结果（模块六）
 */
@Data
public class ComparisonResultVO {

    /** 产品 A 摘要 */
    private ProductSummary productA;
    /** 产品 B 摘要 */
    private ProductSummary productB;

    /**
     * 各维度对比明细：
     *   key   = 维度名（"能量"/"蛋白质"/"脂肪"/"碳水化合物"/"钠"/"添加剂数量"/"健康评分"）
     *   value = { a: 数值, b: 数值, winner: "A"/"B"/"TIE" }
     */
    private Map<String, MetricCompare> metrics = new LinkedHashMap<>();

    /** 推荐结论文案 */
    private String recommendation;

    @Data
    public static class ProductSummary {
        private Long   id;
        private String productName;
        private String imageUrl;
        /** 0-100 综合健康评分 */
        private Double healthScore;
    }

    @Data
    public static class MetricCompare {
        private Double a;
        private Double b;
        /** "A" / "B" / "TIE"，胜者标记 */
        private String winner;
    }
}
