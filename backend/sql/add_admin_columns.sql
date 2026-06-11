-- 在权威 schema (db/health_food_db.sql) 之后执行
-- 为 user 表补 role + status 两列，支撑后台管理（UC-8）
-- 默认 admin 账号由 AdminSeedRunner 在 Spring Boot 启动时插入（使用真实 BCrypt 加密）
USE `health_food`;

ALTER TABLE `user`
  ADD COLUMN `role`   VARCHAR(20) NOT NULL DEFAULT 'user'
    COMMENT '角色：user=普通用户 / admin=管理员'
    AFTER `allergens`,
  ADD COLUMN `status` TINYINT(1)  NOT NULL DEFAULT 1
    COMMENT '账号状态：1=启用 / 0=禁用'
    AFTER `role`;

ALTER TABLE `user` ADD INDEX `idx_role` (`role`);
