package com.example.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthTip {
    /** 指标名称，如"钠"、"脂肪" */
    private String name;
    /** 占 NRV 百分比（0-100） */
    private Double percentage;
    /** 级别：偏低 / 适中 / 偏高 */
    private String level;
    /** 通俗化提示文本 */
    private String text;
}
