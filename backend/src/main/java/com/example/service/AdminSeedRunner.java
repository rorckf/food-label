package com.example.service;

import com.example.entity.User;
import com.example.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 启动时确保默认管理员存在：
 *   username = admin
 *   password = 环境变量 ADMIN_SEED_PASSWORD（未设置时为 Admin@123，仅限本地开发）
 *   role     = admin
 *   status   = 1
 * 已存在则不动，幂等。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeedRunner implements ApplicationRunner {

    private static final String DEFAULT_USERNAME = "admin";
    private static final String DEV_FALLBACK_PASSWORD = "Admin@123";

    @Value("${ADMIN_SEED_PASSWORD:" + DEV_FALLBACK_PASSWORD + "}")
    private String seedPassword;

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        User existing = userMapper.selectByUsername(DEFAULT_USERNAME);
        if (existing != null) {
            // 已存在但不是 admin 角色（极端情况），提升为管理员避免误锁
            if (!"admin".equals(existing.getRole())) {
                existing.setRole("admin");
                existing.setStatus(1);
                userMapper.updateById(existing);
                log.info("[AdminSeed] 已将 username={} 提升为 admin", DEFAULT_USERNAME);
            }
            return;
        }

        User admin = new User();
        admin.setUsername(DEFAULT_USERNAME);
        admin.setPassword(passwordEncoder.encode(seedPassword));
        admin.setRole("admin");
        admin.setStatus(1);
        admin.setHealthGoal("通用");      // 跳过引导页强制
        admin.setChronicDiseases("");
        admin.setAllergens("");
        userMapper.insert(admin);
        if (DEV_FALLBACK_PASSWORD.equals(seedPassword)) {
            log.warn("[AdminSeed] 默认管理员已创建：username={}，使用开发兜底密码。"
                    + "公网部署务必设置环境变量 ADMIN_SEED_PASSWORD！", DEFAULT_USERNAME);
        } else {
            log.info("[AdminSeed] 默认管理员已创建：username={}（密码来自 ADMIN_SEED_PASSWORD）", DEFAULT_USERNAME);
        }
    }
}
