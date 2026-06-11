package com.example.controller;

import com.example.entity.User;
import com.example.service.RecommendService;
import com.example.service.UserService;
import com.example.vo.RecommendItemVO;
import com.example.vo.Result;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 健康食品推荐接口（个性化推荐模块） */
@RestController
@RequestMapping("/recommend")
@RequiredArgsConstructor
public class RecommendController {

    private final RecommendService recommendService;
    private final UserService userService;

    /**
     * GET /api/recommend?limit=10
     * 返回当前用户的 Top-N 健康食品推荐 + 用户画像摘要（用于前端 Banner）
     */
    @GetMapping
    public Result<Map<String, Object>> recommend(
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");

        // 限幅，防御性
        if (limit < 1)  limit = 1;
        if (limit > 50) limit = 50;

        List<RecommendItemVO> items = recommendService.recommend(userId, limit);

        Map<String, String> profile = new HashMap<>();
        User user = userService.getUserById(userId);
        if (user != null) {
            profile.put("healthGoal",       user.getHealthGoal());
            profile.put("chronicDiseases",  user.getChronicDiseases());
            profile.put("allergens",        user.getAllergens());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("userProfile", profile);
        body.put("items", items);
        return Result.success(body);
    }
}
