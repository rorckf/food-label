package com.example.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台管理用户列表项 VO —— 不含密码字段
 */
@Data
public class AdminUserVO {
    private Long          id;
    private String        username;
    private LocalDateTime createTime;
    private String        healthGoal;
    private String        chronicDiseases;
    private String        allergens;
    private String        role;
    private Integer       status;
}
