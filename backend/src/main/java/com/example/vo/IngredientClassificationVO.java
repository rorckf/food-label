package com.example.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 配料三分类结果：主料 / 辅料 / 添加剂。
 * <p>
 * mainIngredients/auxiliaryIngredients/additives 保持旧版字段以兼容前端；
 * items 提供包含原始名 + 标准化名 + 分组的明细列表。
 */
@Data
public class IngredientClassificationVO {
    private List<String> mainIngredients      = new ArrayList<>();
    private List<String> auxiliaryIngredients = new ArrayList<>();
    private List<AdditiveInfoVO> additives    = new ArrayList<>();

    /** 详细分类项（含原始名/标准化名/分组/排位） */
    private List<ClassifiedItem> items        = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassifiedItem {
        /** 原始配料名（含括号备注、可能的全角符号） */
        private String rawName;
        /** 标准化后的名称 */
        private String normalizedName;
        /** 分组：MAIN / AUXILIARY / ADDITIVE */
        private String group;
        /** 在配料表中的排位（1 起） */
        private Integer rank;
    }
}
