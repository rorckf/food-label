package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("additive_knowledge")
public class Additive implements Serializable {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("additive_name")
    private String additiveName;

    @TableField("function_category")
    private String functionCategory;

    @TableField("safety_desc")
    private String safetyDesc;

    @TableField("usage_scope")
    private String usageScope;

    @TableField("max_dosage")
    private String maxDosage;

    /** 疾病禁忌标签，逗号分隔，如"高血压,糖尿病" */
    @TableField("disease_contraindication")
    private String diseaseContraindication;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
