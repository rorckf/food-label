package com.example.vo;

import lombok.Data;

@Data
public class NutritionInfo {
    /** 能量（kJ/100g） */
    private Double energy;
    /** 蛋白质（g/100g） */
    private Double protein;
    /** 脂肪（g/100g） */
    private Double fat;
    /** 碳水化合物（g/100g） */
    private Double carbohydrate;
    /** 钠（mg/100g） */
    private Double sodium;
}
