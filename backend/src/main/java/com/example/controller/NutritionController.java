package com.example.controller;

import com.example.vo.Result;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    /** GET /api/nutrition/monthly */
    @GetMapping("/monthly")
    public Result<Map<String, Object>> getMonthlyIntake(@RequestParam(required = false) String yearMonth,
                                                         HttpServletRequest request) {
        if (currentUserId(request) == null) return Result.error(401, "请先登录");
        String ym = yearMonth != null ? yearMonth
                : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        return Result.success(Map.of("sodium", 0, "sugar", 0, "energy", 0, "yearMonth", ym));
    }

    /** GET /api/nutrition/daily */
    @GetMapping("/daily")
    public Result<Map<String, Object>> getDailyIntake(@RequestParam(required = false) String date,
                                                       HttpServletRequest request) {
        if (currentUserId(request) == null) return Result.error(401, "请先登录");
        String d = date != null ? date : LocalDate.now().toString();
        return Result.success(Map.of("sodium", 0, "sugar", 0, "energy", 0, "date", d));
    }

    /** POST /api/nutrition/add */
    @PostMapping("/add")
    public Result<Void> addIntake(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        if (currentUserId(request) == null) return Result.error(401, "请先登录");
        return Result.success();
    }

    /** POST /api/nutrition/reset/{type} */
    @PostMapping("/reset/{type}")
    public Result<Void> resetIntake(@PathVariable String type, HttpServletRequest request) {
        if (currentUserId(request) == null) return Result.error(401, "请先登录");
        return Result.success();
    }

    private Long currentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }
}
