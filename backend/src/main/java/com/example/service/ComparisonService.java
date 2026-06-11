package com.example.service;

import com.alibaba.fastjson2.JSON;
import com.example.entity.HistoryRecord;
import com.example.mapper.HistoryMapper;
import com.example.vo.AdditiveInfoVO;
import com.example.vo.ComparisonResultVO;
import com.example.vo.NutritionInfo;
import com.example.vo.RecognitionResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 同品类对比服务（模块六）：取两条历史记录的完整识别结果，
 * 在能量/蛋白质/脂肪/碳水/钠/添加剂数量/健康评分 7 个维度逐项比较，
 * 并产出推荐结论。
 */
@Service
@RequiredArgsConstructor
public class ComparisonService {

    /** 各项指标的"高低优劣"方向：true=越低越好（如钠/添加剂数量），false=越高越好（如蛋白质） */
    private static final Map<String, Boolean> LOWER_IS_BETTER = Map.ofEntries(
            Map.entry("能量",     true),
            Map.entry("蛋白质",   false),
            Map.entry("脂肪",     true),
            Map.entry("碳水化合物", true),
            Map.entry("钠",       true),
            Map.entry("添加剂数量", true),
            Map.entry("健康评分", false)
    );

    private final HistoryMapper historyMapper;

    public ComparisonResultVO compare(Long idA, Long idB, Long userId) {
        HistoryRecord recA = loadOwned(idA, userId);
        HistoryRecord recB = loadOwned(idB, userId);

        RecognitionResultVO voA = parse(recA);
        RecognitionResultVO voB = parse(recB);
        if (voA == null || voB == null) {
            throw new RuntimeException("部分产品数据缺失，无法完成对比");
        }

        // 品类一致性校验：优先用 history_record.category；为空则回落到 result_json 中
        String catA = recA.getCategory() != null ? recA.getCategory() : voA.getCategory();
        String catB = recB.getCategory() != null ? recB.getCategory() : voB.getCategory();
        if (catA != null && catB != null && !catA.equals(catB)) {
            throw new RuntimeException("仅支持同品类产品对比");
        }

        ComparisonResultVO result = new ComparisonResultVO();
        result.setProductA(buildSummary(recA, voA));
        result.setProductB(buildSummary(recB, voB));

        Map<String, ComparisonResultVO.MetricCompare> metrics = new LinkedHashMap<>();
        NutritionInfo nA = voA.getNutrition();
        NutritionInfo nB = voB.getNutrition();
        if (nA != null && nB != null) {
            putMetric(metrics, "能量",       nA.getEnergy(),      nB.getEnergy());
            putMetric(metrics, "蛋白质",     nA.getProtein(),     nB.getProtein());
            putMetric(metrics, "脂肪",       nA.getFat(),         nB.getFat());
            putMetric(metrics, "碳水化合物", nA.getCarbohydrate(), nB.getCarbohydrate());
            putMetric(metrics, "钠",         nA.getSodium(),      nB.getSodium());
        }
        putMetric(metrics, "添加剂数量",
                (double) additiveCount(voA), (double) additiveCount(voB));
        putMetric(metrics, "健康评分",
                result.getProductA().getHealthScore(),
                result.getProductB().getHealthScore());

        result.setMetrics(metrics);
        result.setRecommendation(buildRecommendation(metrics, voA, voB));
        return result;
    }

    // ─── 辅助：添加剂数量（对比维度需要） ─────────────────────────────────────

    private int additiveCount(RecognitionResultVO vo) {
        Map<String, AdditiveInfoVO> map = vo.getAdditiveMap();
        return map == null ? 0 : map.size();
    }

    // ─── 推荐结论 ────────────────────────────────────────────────────────────

    private String buildRecommendation(Map<String, ComparisonResultVO.MetricCompare> metrics,
                                       RecognitionResultVO voA, RecognitionResultVO voB) {
        int aWins = 0, bWins = 0;
        StringBuilder aAdvantages = new StringBuilder();
        StringBuilder bAdvantages = new StringBuilder();

        for (Map.Entry<String, ComparisonResultVO.MetricCompare> e : metrics.entrySet()) {
            String winner = e.getValue().getWinner();
            if ("A".equals(winner)) {
                aWins++;
                if (aAdvantages.length() > 0) aAdvantages.append("、");
                aAdvantages.append(e.getKey()).append("更优");
            } else if ("B".equals(winner)) {
                bWins++;
                if (bAdvantages.length() > 0) bAdvantages.append("、");
                bAdvantages.append(e.getKey()).append("更优");
            }
        }

        if (Math.abs(aWins - bWins) <= 1) {
            return "两款产品整体相近，建议参考价格因素选择";
        }
        if (aWins > bWins) {
            return String.format("%s %s，推荐选择 A",
                    safeName(voA), aAdvantages.toString());
        }
        return String.format("%s %s，推荐选择 B",
                safeName(voB), bAdvantages.toString());
    }

    // ─── 辅助 ────────────────────────────────────────────────────────────

    private HistoryRecord loadOwned(Long id, Long userId) {
        if (id == null) throw new RuntimeException("请选择两款产品进行对比");
        HistoryRecord rec = historyMapper.selectById(id);
        if (rec == null) {
            throw new RuntimeException("记录不存在");
        }
        if (userId != null && !userId.equals(rec.getUserId())) {
            throw new SecurityException("无权访问此记录");
        }
        return rec;
    }

    private RecognitionResultVO parse(HistoryRecord rec) {
        if (rec == null || rec.getResultJson() == null) return null;
        try {
            return JSON.parseObject(rec.getResultJson(), RecognitionResultVO.class);
        } catch (Exception e) {
            return null;
        }
    }

    private ComparisonResultVO.ProductSummary buildSummary(HistoryRecord rec,
                                                           RecognitionResultVO vo) {
        ComparisonResultVO.ProductSummary s = new ComparisonResultVO.ProductSummary();
        s.setId(rec.getId());
        s.setProductName(rec.getProductName());
        s.setImageUrl(rec.getImageUrl());
        s.setHealthScore((double) HealthScoreCalculator.calc(vo));
        return s;
    }

    private void putMetric(Map<String, ComparisonResultVO.MetricCompare> map,
                           String name, Double a, Double b) {
        ComparisonResultVO.MetricCompare m = new ComparisonResultVO.MetricCompare();
        m.setA(a);
        m.setB(b);
        m.setWinner(decideWinner(name, a, b));
        map.put(name, m);
    }

    private String decideWinner(String metric, Double a, Double b) {
        if (a == null && b == null) return "TIE";
        if (a == null) return "B";
        if (b == null) return "A";
        if (a.equals(b)) return "TIE";
        boolean lowerBetter = LOWER_IS_BETTER.getOrDefault(metric, false);
        boolean aBetter = lowerBetter ? a < b : a > b;
        return aBetter ? "A" : "B";
    }

    private String safeName(RecognitionResultVO vo) {
        return vo.getProductName() != null ? vo.getProductName() : "该产品";
    }
}
