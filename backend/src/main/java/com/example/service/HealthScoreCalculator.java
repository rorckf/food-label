package com.example.service;

import com.example.vo.AdditiveInfoVO;
import com.example.vo.NutritionInfo;
import com.example.vo.RecognitionResultVO;

import java.util.Map;

/**
 * 健康评分算法（满分 100，整数）：
 *   基础分 100；
 *   每条偏高 NRV 的营养指标扣 8 分；
 *   每个添加剂扣 3 分。最低 0 分。
 *
 * 识别入库与同品类对比共用此算法。
 */
public final class HealthScoreCalculator {

    private HealthScoreCalculator() {}

    public static int calc(RecognitionResultVO vo) {
        if (vo == null) return 0;
        double score = 100;
        NutritionInfo n = vo.getNutrition();
        if (n != null) {
            score -= overNrv(n.getEnergy(),       8400) * 8;
            score -= overNrv(n.getFat(),          60)   * 8;
            score -= overNrv(n.getCarbohydrate(), 300)  * 8;
            score -= overNrv(n.getSodium(),       2000) * 8;
        }
        score -= additiveCount(vo) * 3;
        return (int) Math.max(0, Math.round(score));
    }

    private static int overNrv(Double value, double nrv) {
        if (value == null) return 0;
        return value / nrv > 0.30 ? 1 : 0;
    }

    private static int additiveCount(RecognitionResultVO vo) {
        Map<String, AdditiveInfoVO> map = vo.getAdditiveMap();
        return map == null ? 0 : map.size();
    }
}
