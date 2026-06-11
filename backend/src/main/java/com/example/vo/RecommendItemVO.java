package com.example.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** 推荐结果中的单条食品 */
@Data
public class RecommendItemVO {
    private Long id;
    private String name;
    private String category;
    private String brand;
    private String imageUrl;

    private Integer energy;
    private BigDecimal protein;
    private BigDecimal fat;
    private BigDecimal carb;
    private Integer sodium;

    /** 添加剂逗号字符串，前端可自行 split */
    private String additives;
    /** 标签数组，前端用于 chip 展示 */
    private List<String> tags;

    private Integer healthScore;

    /** 最终排序分（debug/可解释性） */
    private Double score;

    /** 推荐理由数组，最多 3 条 */
    private List<String> reasons;
}
