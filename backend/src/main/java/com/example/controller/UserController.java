package com.example.controller;

import com.example.entity.User;
import com.example.util.JwtUtil;
import com.example.vo.Result;
import com.example.service.FileService;
import com.example.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FileService fileService;
    private final JwtUtil jwtUtil;

    /** POST /api/user/register */
    @PostMapping("/register")
    public Result<Void> register(@RequestBody Map<String, String> body) {
        try {
            userService.registerUser(body.get("username"), body.get("password"));
            return new Result<>(200, "注册成功", null);
        } catch (IllegalArgumentException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /** POST /api/user/login — 颁发 JWT */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        try {
            User user = userService.validateLogin(body.get("username"), body.get("password"));
            if (user == null) {
                return Result.error(401, "用户名或密码错误");
            }
            // 账号被禁用时拒绝登录（status 默认 1，老数据可能为 null 视为启用）
            if (user.getStatus() != null && user.getStatus() == 0) {
                return Result.error(403, "账号已被禁用，请联系管理员");
            }
            String token = jwtUtil.generateToken(user.getId(), user.getUsername());
            // user 子对象使用 HashMap：healthGoal 可能为 null（老用户/未完善档案），Map.of 不允许 null 值
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("username", user.getUsername());
            userMap.put("healthGoal", user.getHealthGoal());
            userMap.put("role", user.getRole() != null ? user.getRole() : "user");
            Map<String, Object> resp = new HashMap<>();
            resp.put("username", user.getUsername());
            resp.put("userId", user.getId());
            resp.put("token", token);
            resp.put("user", userMap);
            return Result.success(resp);
        } catch (Exception e) {
            return Result.error(500, "服务器内部错误，请稍后重试");
        }
    }

    /** POST /api/user/logout — 客户端丢弃 token 即可，服务端无状态 */
    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.success();
    }

    /** GET /api/user/profile */
    @GetMapping("/profile")
    public Result<Map<String, Object>> getProfile(HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        User user = userService.getUserById(userId);
        if (user == null) return Result.error(404, "用户不存在");
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("nickname", user.getUsername());
        profile.put("createTime", user.getCreateTime() != null ? user.getCreateTime().toString() : "");
        profile.put("role", user.getRole() != null ? user.getRole() : "user");
        profile.put("status", user.getStatus() != null ? user.getStatus() : 1);
        return Result.success(profile);
    }

    /** PUT /api/user/profile */
    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestBody Map<String, String> body,
                                       HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success();
    }

    /** POST /api/user/avatar */
    @PostMapping("/avatar")
    public Result<Map<String, String>> uploadAvatar(@RequestParam("file") MultipartFile file,
                                                     HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        try {
            String avatarUrl = fileService.saveImage(file);
            return Result.success(Map.of("avatarUrl", avatarUrl));
        } catch (IOException e) {
            return Result.error(500, "头像上传失败：" + e.getMessage());
        }
    }

    /** GET /api/user/health-profile — 查询当前用户健康档案 */
    @GetMapping("/health-profile")
    public Result<Map<String, String>> getHealthProfile(HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(userService.getHealthProfile(userId));
    }

    /** PUT /api/user/health-profile — 保存或更新健康档案（引导页提交） */
    @PutMapping("/health-profile")
    public Result<Void> updateHealthProfile(@RequestBody Map<String, String> body,
                                             HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        try {
            userService.updateHealthProfile(
                    userId,
                    body.get("healthGoal"),
                    body.get("chronicDiseases"),
                    body.get("allergens")
            );
            return Result.success();
        } catch (IllegalArgumentException e) {
            return Result.error(400, e.getMessage());
        }
    }

    private Long currentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }
}