package com.example.config;

import com.alibaba.fastjson2.JSON;
import com.example.entity.User;
import com.example.mapper.UserMapper;
import com.example.vo.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

/**
 * /api/admin/** 守门：要求 JWT 已认证 + 用户 role=admin + status=1。
 * JWT 解析在 JwtAuthenticationFilter 已完成，这里只查 role/status。
 */
@Component
@RequiredArgsConstructor
public class AdminAuthInterceptor implements HandlerInterceptor {

    private final UserMapper userMapper;

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws Exception {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return reject(response, 401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        if (user == null) {
            return reject(response, 401, "用户不存在或已删除");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            return reject(response, 403, "账号已被禁用");
        }
        if (!"admin".equals(user.getRole())) {
            return reject(response, 403, "无管理员权限");
        }
        return true;
    }

    private boolean reject(HttpServletResponse response, int code, String message) throws Exception {
        response.setStatus(code);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(JSON.toJSONString(Result.error(code, message)));
        return false;
    }
}
