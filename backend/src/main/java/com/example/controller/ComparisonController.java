package com.example.controller;

import com.example.service.ComparisonService;
import com.example.vo.ComparisonResultVO;
import com.example.vo.Result;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 同品类对比接口（模块六）
 */
@RestController
@RequestMapping("/compare")
@RequiredArgsConstructor
public class ComparisonController {

    private final ComparisonService comparisonService;

    /**
     * POST /api/compare
     * Body: { "ids": [1, 2] }
     */
    @PostMapping
    public Result<ComparisonResultVO> compare(@RequestBody Map<String, List<Long>> body,
                                              HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) return Result.error(401, "请先登录");

        List<Long> ids = body == null ? null : body.get("ids");
        if (ids == null || ids.size() != 2) {
            return Result.error(400, "请选择两款产品进行对比");
        }
        try {
            return Result.success(comparisonService.compare(ids.get(0), ids.get(1), userId));
        } catch (SecurityException e) {
            return Result.error(403, e.getMessage());
        } catch (RuntimeException e) {
            return Result.error(400, e.getMessage());
        }
    }
}
