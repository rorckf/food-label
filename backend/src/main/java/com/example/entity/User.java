package com.example.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("user")
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("username")
    private String username;

    @TableField("password")
    private String password;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /** 健康目标:减脂/增肌/控糖/控压/通用，引导页填写后非空 */
    @TableField("health_goal")
    private String healthGoal;

    /** 慢性病(逗号分隔):高血压,糖尿病,高血脂,痛风；空字符串表示无 */
    @TableField("chronic_diseases")
    private String chronicDiseases;

    /** 过敏原(逗号分隔):乳,蛋,大豆,花生,坚果,甲壳类,鱼,芝麻,麸质；空字符串表示无 */
    @TableField("allergens")
    private String allergens;

    /** 角色：user=普通用户 / admin=管理员（默认 user） */
    @TableField("role")
    private String role;

    /** 账号状态：1=启用 / 0=禁用（默认 1） */
    @TableField("status")
    private Integer status;
}
