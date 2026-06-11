package com.example.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 保质期状态。{@link com.example.service.ShelfLifeService} 解析"生产日期 + 保质期"或
 * "保质期至"得到，前端可直接据此渲染过期角标。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShelfLifeStatus {

    /** UNKNOWN(无法解析) / VALID(在保) / EXPIRING(7 天内到期) / EXPIRED(已过期) */
    private String status;

    /** 距今剩余天数，负数表示已过期，UNKNOWN 时为 null */
    private Integer daysRemaining;

    /** 解析得到的到期日（ISO yyyy-MM-dd），UNKNOWN 时为 null */
    private LocalDate expiryDate;

    /** 解析得到的生产日期（ISO yyyy-MM-dd），缺失时为 null */
    private LocalDate productionDate;

    /** 给前端展示的简短消息，例如 "已过期 5 天"、"还有 12 天" */
    private String message;
}
