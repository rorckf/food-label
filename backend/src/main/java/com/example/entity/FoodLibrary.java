package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 健康食品候选池实体，对应 food_library 表 */
@Data
@TableName("food_library")
public class FoodLibrary implements Serializable {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("name")
    private String name;

    @TableField("category")
    private String category;

    @TableField("brand")
    private String brand;

    @TableField("energy")
    private Integer energy;

    @TableField("protein")
    private BigDecimal protein;

    @TableField("fat")
    private BigDecimal fat;

    @TableField("carb")
    private BigDecimal carb;

    @TableField("sodium")
    private Integer sodium;

    /** 添加剂列表，逗号分隔；空字符串表示无 */
    @TableField("additives")
    private String additives;

    /** 标签列表，逗号分隔；词表见 build SQL 中的 COMMENT */
    @TableField("tags")
    private String tags;

    @TableField("health_score")
    private Integer healthScore;

    @TableField("image_url")
    private String imageUrl;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
