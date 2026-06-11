package com.example.vo;

import lombok.Data;
import lombok.EqualsAndHashCode;

/** 历史记录详情 VO：继承列表字段，附加完整识别结果 */
@Data
@EqualsAndHashCode(callSuper = true)
public class HistoryRecordDetailVO extends HistoryRecordVO {

    /** 完整识别结果（与实时识别 RecognitionResultVO 结构一致） */
    private RecognitionResultVO detail;
}
