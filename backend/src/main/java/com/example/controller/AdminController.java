package com.example.controller;

import com.example.service.AdminService;
import com.example.vo.Result;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 后台管理（UC-8）—— 用户管理
 * 路径前缀 /api/admin（WebMvcConfig 全局加 /api；AdminAuthInterceptor 守门）
 * 仅 role=admin 可访问；非 admin 在拦截器层被拒。
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /**
     * GET /api/admin/users —— 用户列表
     * @param page   页码，默认 1
     * @param size   每页大小，默认 10
     * @param keyword 用户名模糊关键字，可空
     * @param status 状态筛选：all / enabled / disabled，默认 all
     */
    @GetMapping("/users")
    public Result<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "all") String status) {
        if (page < 1) page = 1;
        if (size < 1 || size > 100) size = 10;
        return Result.success(adminService.listUsers(page, size, keyword, status));
    }

    /** PUT /api/admin/users/{id}/status —— 切换启停 */
    @PutMapping("/users/{id}/status")
    public Result<Map<String, Object>> toggleStatus(@PathVariable Long id, HttpServletRequest request) {
        Long operatorId = currentUserId(request);
        try {
            int next = adminService.toggleStatus(id, operatorId);
            return Result.success(Map.of("status", next));
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        }
    }

    /** DELETE /api/admin/users/{id} —— 删除账号 */
    @DeleteMapping("/users/{id}")
    public Result<Void> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        Long operatorId = currentUserId(request);
        try {
            adminService.deleteUser(id, operatorId);
            return Result.success();
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        }
    }

    private Long currentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }
}
