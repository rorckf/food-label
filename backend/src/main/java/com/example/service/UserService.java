package com.example.service;

import com.example.entity.User;
import com.example.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    /**
     * 注册用户
     * 校验用户名长度（3-20位）、密码长度（6-20位）、用户名唯一性，
     * 通过后对密码进行 BCrypt 加密并持久化。
     *
     * @throws IllegalArgumentException 当任意校验不通过时
     */
    public void registerUser(String username, String password) {
        if (username == null || username.length() < 3 || username.length() > 20) {
            throw new IllegalArgumentException("用户名长度须在 3-20 个字符之间");
        }
        if (password == null || password.length() < 6 || password.length() > 20) {
            throw new IllegalArgumentException("密码长度须在 6-20 个字符之间");
        }
        if (userMapper.selectByUsername(username) != null) {
            throw new IllegalArgumentException("用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        userMapper.insert(user);
    }

    public User getUserById(Long userId) {
        return userMapper.selectById(userId);
    }

    /** 合法健康目标取值，与前端引导页选项保持一致 */
    private static final Set<String> VALID_HEALTH_GOALS =
            Set.of("减脂", "增肌", "控糖", "控压", "通用");

    /**
     * 查询用户健康档案（健康目标/慢性病/过敏原）。
     * 字段未填时返回 null 或空字符串，由前端判断"档案是否完善"。
     */
    public Map<String, String> getHealthProfile(Long userId) {
        User user = userMapper.selectById(userId);
        Map<String, String> map = new HashMap<>();
        if (user == null) {
            map.put("healthGoal", null);
            map.put("chronicDiseases", null);
            map.put("allergens", null);
            return map;
        }
        map.put("healthGoal", user.getHealthGoal());
        map.put("chronicDiseases", user.getChronicDiseases());
        map.put("allergens", user.getAllergens());
        return map;
    }

    /**
     * 保存或更新用户健康档案。
     * 仅校验 healthGoal 必须在合法集合中；慢性病和过敏原由前端约束词表，后端只做长度兜底。
     */
    public void updateHealthProfile(Long userId, String healthGoal,
                                     String chronicDiseases, String allergens) {
        if (healthGoal == null || !VALID_HEALTH_GOALS.contains(healthGoal)) {
            throw new IllegalArgumentException("健康目标不合法");
        }
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        user.setHealthGoal(healthGoal);
        user.setChronicDiseases(chronicDiseases == null ? "" : chronicDiseases.trim());
        user.setAllergens(allergens == null ? "" : allergens.trim());
        userMapper.updateById(user);
    }

    /**
     * 验证登录
     *
     * @return 验证通过返回 User 对象，否则返回 null
     */
    public User validateLogin(String username, String password) {
        if (username == null || password == null) {
            return null;
        }
        User user = userMapper.selectByUsername(username);
        if (user == null) {
            return null;
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }
        return user;
    }
}
