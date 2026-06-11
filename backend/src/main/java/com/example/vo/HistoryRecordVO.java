package com.example.vo;

import lombok.Data;

import java.time.LocalDateTime;

/** 历史记录列表项 VO */
@Data
public class HistoryRecordVO {
    private Long          id;
    private String        productName;
    private String        imageUrl;
    private Integer       isFavorite;
    private Integer       healthScore;
    private LocalDateTime createTime;
}
