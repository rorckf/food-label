package com.example.vo;

import lombok.Data;

import java.util.List;

/**
 * 「配料表翻译成人话」请求体。
 * 前端把识别结果中的关键字段发来，后端据此拼 prompt 调大模型生成大白话点评。
 */
@Data
public class ExplainRequest {

    private String productName;
    private String category;

    /** 配料列表（原始名称） */
    private List<String> ingredients;

    /** 命中的添加剂名称 */
    private List<String> additives;

    /** 每 100g 营养（可空） */
    private Double energy;        // kJ 或 kcal，前端怎么传都行，仅作参考
    private Double protein;       // g
    private Double fat;           // g
    private Double carbohydrate;  // g
    private Double sodium;        // mg
}
