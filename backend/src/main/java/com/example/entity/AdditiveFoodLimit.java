package com.example.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;

/**
 * 添加剂×食品分类 限量明细（GB 2760-2024 核心数据，32673 行）
 */
@Data
@TableName("additive_food_limit")
public class AdditiveFoodLimit implements Serializable {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("additive_id")
    private Long additiveId;

    @TableField("food_category_code")
    private String foodCategoryCode;

    @TableField("food_category_name")
    private String foodCategoryName;

    @TableField("max_dosage")
    private String maxDosage;

    @TableField("function_in_use")
    private String functionInUse;

    @TableField("is_inherited")
    private Integer isInherited;

    @TableField("remark")
    private String remark;

    @TableField("note")
    private String note;
}
