package com.example.vo;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class AdditiveInfoVO {
    private String name;
    private String category;
    private String description;
    private String usageScope;
    private String maxDosage;
    /** 疾病禁忌标签，逗号分隔 */
    private String diseaseContraindication;
    /** 复合添加剂的拆解子项；普通添加剂为 null */
    private List<AdditiveInfoVO> subItems;

    public AdditiveInfoVO(String name, String category, String description) {
        this.name = name;
        this.category = category;
        this.description = description;
    }

    public AdditiveInfoVO(String name, String category, String description,
                          String usageScope, String maxDosage, String diseaseContraindication) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.usageScope = usageScope;
        this.maxDosage = maxDosage;
        this.diseaseContraindication = diseaseContraindication;
    }
}
