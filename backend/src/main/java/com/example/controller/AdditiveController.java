package com.example.controller;

import com.example.entity.AdditiveFoodLimit;
import com.example.service.AdditiveService;
import com.example.vo.AdditiveInfoVO;
import com.example.vo.IngredientClassificationVO;
import com.example.vo.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 添加剂查询 / 配料三分类 接口（模块四）
 */
@RestController
@RequestMapping("/additive")
@RequiredArgsConstructor
public class AdditiveController {

    private final AdditiveService additiveService;

    /** GET /api/additive/detail?name=苯甲酸钠 — 速查弹窗 */
    @GetMapping("/detail")
    public Result<AdditiveInfoVO> detail(@RequestParam String name) {
        if (name == null || name.isBlank()) {
            return Result.error(400, "添加剂名称不能为空");
        }
        return Result.success(additiveService.getAdditiveInfo(name));
    }

    /** POST /api/additive/classify — 三分类（主料/辅料/添加剂） */
    @PostMapping("/classify")
    public Result<IngredientClassificationVO> classify(@RequestBody Map<String, List<String>> body) {
        List<String> ingredients = body.getOrDefault("ingredients", List.of());
        return Result.success(additiveService.classify(ingredients));
    }

    /** GET /api/additive/limits?name=X — 食品×限量明细（GB 2760-2024 32673 行） */
    @GetMapping("/limits")
    public Result<List<AdditiveFoodLimit>> limits(@RequestParam String name) {
        if (name == null || name.isBlank()) {
            return Result.error(400, "添加剂名称不能为空");
        }
        return Result.success(additiveService.getLimitsByName(name));
    }
}
