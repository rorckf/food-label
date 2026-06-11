package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 历史记录实体，映射 history_record 表
 */
@Data
@TableName("history_record")
public class HistoryRecord implements Serializable {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("product_name")
    private String productName;

    /** 食品品类，用于同品类对比 */
    @TableField("category")
    private String category;

    @TableField("image_url")
    private String imageUrl;

    /** 完整识别结果 JSON（含添加剂、健康提示） */
    @TableField("result_json")
    private String resultJson;

    @TableField("is_favorite")
    private Integer isFavorite;

    /** 健康评分 0-100，由 HealthScoreCalculator 在识别入库时计算 */
    @TableField("health_score")
    private Integer healthScore;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
