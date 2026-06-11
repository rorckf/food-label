package com.example.controller;

import com.example.vo.Result;
import com.example.service.HistoryService;
import com.example.vo.HistoryRecordDetailVO;
import com.example.vo.HistoryRecordVO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    /** GET /api/history/list */
    @GetMapping("/list")
    public Result<List<HistoryRecordVO>> list(HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        return Result.success(historyService.getHistoryList(userId));
    }

    /** GET /api/history/detail/{id} */
    @GetMapping("/detail/{id}")
    public Result<HistoryRecordDetailVO> detail(@PathVariable Long id, HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        try {
            return Result.success(historyService.getHistoryDetail(id, userId));
        } catch (SecurityException e) {
            return Result.error(403, e.getMessage());
        } catch (RuntimeException e) {
            return Result.error(404, e.getMessage());
        }
    }

    /** DELETE /api/history/delete/{id} */
    @DeleteMapping("/delete/{id}")
    public Result<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        try {
            historyService.deleteRecord(id, userId);
            return Result.success();
        } catch (SecurityException e) {
            return Result.error(403, e.getMessage());
        } catch (RuntimeException e) {
            return Result.error(404, e.getMessage());
        }
    }

    /** POST /api/history/favorite/{id} */
    @PostMapping("/favorite/{id}")
    public Result<Map<String, Object>> favorite(@PathVariable Long id, HttpServletRequest request) {
        Long userId = currentUserId(request);
        if (userId == null) return Result.error(401, "请先登录");
        try {
            boolean isFav = historyService.toggleFavorite(id, userId);
            return Result.success(Map.of("isFavorite", isFav ? 1 : 0));
        } catch (SecurityException e) {
            return Result.error(403, e.getMessage());
        } catch (RuntimeException e) {
            return Result.error(404, e.getMessage());
        }
    }

    private Long currentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }
}
