package com.example.service;

import com.example.entity.FoodLibrary;
import com.example.entity.User;
import com.example.mapper.FoodLibraryMapper;
import com.example.mapper.UserMapper;
import com.example.vo.RecommendItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 健康食品推荐服务（论文第 4 章 个性化推荐模块）
 *
 * 算法链路：
 * 1) 召回 — 全量 food_library
 * 2) 硬过滤 — 知识规则：剔除命中过敏原 / 命中慢性病禁忌的食品
 * 3) 内容打分 — 基于用户健康目标与食品标签的契合度
 * 4) 加权排序 — final = 0.6 * health_score + 0.4 * tag_score
 * 5) 推荐理由生成 — 至多 3 条，提升可解释性
 */
@Service
@RequiredArgsConstructor
public class RecommendService {

    private final FoodLibraryMapper foodLibraryMapper;
    private final UserMapper userMapper;

    /** 过敏原 → 食品名/配料中可能出现的关键词（用于子串匹配硬过滤） */
    private static final Map<String, List<String>> ALLERGEN_KEYWORDS = Map.of(
            "乳",     List.of("乳", "奶", "酪"),
            "蛋",     List.of("蛋"),
            "大豆",   List.of("大豆", "豆"),
            "花生",   List.of("花生"),
            "坚果",   List.of("坚果", "杏仁", "核桃", "腰果", "榛子", "开心果"),
            "甲壳类", List.of("虾", "蟹"),
            "鱼",     List.of("鱼"),
            "芝麻",   List.of("芝麻"),
            "麸质",   List.of("小麦", "麦", "面", "麸")
    );

    /** 慢性病 → 必须排除的负面标签（命中即剔除） */
    private static final Map<String, String> DISEASE_AVOID_TAG = Map.of(
            "高血压", "高钠",
            "糖尿病", "高糖",
            "高血脂", "高脂"
            // 痛风暂无 tag 层硬过滤，依赖前端展示提示
    );

    /** 慢性病 → 友好正向标签（用于推荐理由展示） */
    private static final Map<String, String> DISEASE_FRIENDLY_TAG = Map.of(
            "高血压", "低钠",
            "糖尿病", "无糖",
            "高血脂", "低脂"
    );

    /** 健康目标 → 偏好正向标签 */
    private static final Map<String, List<String>> GOAL_PREFER_TAGS = Map.of(
            "减脂", List.of("低糖", "低脂", "高蛋白", "高纤维"),
            "增肌", List.of("高蛋白", "高钙"),
            "控糖", List.of("无糖", "低糖"),
            "控压", List.of("低钠"),
            "通用", List.of("低糖", "低脂", "低钠")
    );

    /** 健康目标 → 反向标签（出现则扣分；不一定排除，硬过滤已由慢性病兜底） */
    private static final Map<String, List<String>> GOAL_AVOID_TAGS = Map.of(
            "减脂", List.of("高糖", "高脂"),
            "增肌", List.of(),
            "控糖", List.of("高糖"),
            "控压", List.of("高钠"),
            "通用", List.of()
    );

    /**
     * 推荐主入口
     * @param userId 当前用户
     * @param limit  返回条数（默认 10）
     */
    public List<RecommendItemVO> recommend(Long userId, int limit) {
        User user = userMapper.selectById(userId);
        // 拆分用户画像，缺省值容错
        String goal = user != null && user.getHealthGoal() != null ? user.getHealthGoal() : "通用";
        Set<String> userAllergens = splitToSet(user != null ? user.getAllergens() : null);
        Set<String> userDiseases  = splitToSet(user != null ? user.getChronicDiseases() : null);

        List<FoodLibrary> all = foodLibraryMapper.selectList(null);

        List<RecommendItemVO> ranked = new ArrayList<>();
        for (FoodLibrary f : all) {
            if (hitAllergen(f, userAllergens))   continue;   // 硬过滤 1
            if (hitDiseaseAvoid(f, userDiseases)) continue;  // 硬过滤 2

            List<String> foodTags = splitToList(f.getTags());
            int tagScore  = computeTagScore(goal, foodTags);
            int healthSc  = f.getHealthScore() == null ? 50 : f.getHealthScore();
            double finalScore = 0.6 * healthSc + 0.4 * tagScore;

            RecommendItemVO vo = toVO(f, foodTags, finalScore);
            vo.setReasons(buildReasons(goal, userDiseases, foodTags, healthSc));
            ranked.add(vo);
        }

        ranked.sort(Comparator.comparingDouble(RecommendItemVO::getScore).reversed());
        return ranked.size() > limit ? ranked.subList(0, limit) : ranked;
    }

    // ─────────────── 过滤 ───────────────

    /** 任一过敏原关键词出现在食品名或添加剂字段 → 命中 */
    private boolean hitAllergen(FoodLibrary f, Set<String> userAllergens) {
        if (userAllergens.isEmpty()) return false;
        String haystack = (safe(f.getName()) + "|" + safe(f.getAdditives()));
        for (String a : userAllergens) {
            List<String> kws = ALLERGEN_KEYWORDS.getOrDefault(a, List.of(a));
            for (String kw : kws) {
                if (haystack.contains(kw)) return true;
            }
        }
        return false;
    }

    /** 食品标签命中"慢性病禁忌标签" → 命中 */
    private boolean hitDiseaseAvoid(FoodLibrary f, Set<String> userDiseases) {
        if (userDiseases.isEmpty()) return false;
        List<String> tags = splitToList(f.getTags());
        for (String d : userDiseases) {
            String avoidTag = DISEASE_AVOID_TAG.get(d);
            if (avoidTag != null && tags.contains(avoidTag)) return true;
        }
        return false;
    }

    // ─────────────── 打分 ───────────────

    /** tag_score ∈ [0,100]：基础 50 ± 命中标签数 × 10 */
    private int computeTagScore(String goal, List<String> foodTags) {
        int score = 50;
        for (String t : GOAL_PREFER_TAGS.getOrDefault(goal, List.of())) {
            if (foodTags.contains(t)) score += 10;
        }
        for (String t : GOAL_AVOID_TAGS.getOrDefault(goal, List.of())) {
            if (foodTags.contains(t)) score -= 10;
        }
        return Math.max(0, Math.min(100, score));
    }

    // ─────────────── 推荐理由（最多 3 条） ───────────────

    private List<String> buildReasons(String goal, Set<String> userDiseases,
                                      List<String> foodTags, int healthScore) {
        List<String> reasons = new ArrayList<>(3);

        // (1) 与目标契合
        List<String> matched = new ArrayList<>();
        for (String t : GOAL_PREFER_TAGS.getOrDefault(goal, List.of())) {
            if (foodTags.contains(t)) matched.add(t);
        }
        if (!matched.isEmpty() && reasons.size() < 3) {
            reasons.add("符合" + goal + "目标·" + String.join("+", matched));
        }

        // (2) 慢性病友好（食品具备对应正向标签）
        for (String d : userDiseases) {
            if (reasons.size() >= 3) break;
            String friendly = DISEASE_FRIENDLY_TAG.get(d);
            if (friendly != null && foodTags.contains(friendly)) {
                reasons.add("适合" + d + "人群·" + friendly);
            }
        }

        // (3) 健康评分兜底
        if (reasons.size() < 3) {
            String tier = healthScore >= 85 ? "（优）"
                    : healthScore >= 70 ? "（良）"
                    : healthScore >= 50 ? "（中）" : "";
            reasons.add("健康评分 " + healthScore + tier);
        }
        return reasons;
    }

    // ─────────────── 工具 ───────────────

    private RecommendItemVO toVO(FoodLibrary f, List<String> tags, double finalScore) {
        RecommendItemVO vo = new RecommendItemVO();
        vo.setId(f.getId());
        vo.setName(f.getName());
        vo.setCategory(f.getCategory());
        vo.setBrand(f.getBrand());
        vo.setImageUrl(f.getImageUrl());
        vo.setEnergy(f.getEnergy());
        vo.setProtein(f.getProtein());
        vo.setFat(f.getFat());
        vo.setCarb(f.getCarb());
        vo.setSodium(f.getSodium());
        vo.setAdditives(f.getAdditives());
        vo.setTags(tags);
        vo.setHealthScore(f.getHealthScore());
        // 保留 1 位小数避免前端浮点尾噪
        vo.setScore(Math.round(finalScore * 10.0) / 10.0);
        return vo;
    }

    private static Set<String> splitToSet(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        Set<String> set = new HashSet<>();
        for (String p : csv.split(",")) {
            String t = p.trim();
            if (!t.isEmpty()) set.add(t);
        }
        return set;
    }

    private static List<String> splitToList(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        List<String> list = new ArrayList<>();
        for (String p : csv.split(",")) {
            String t = p.trim();
            if (!t.isEmpty()) list.add(t);
        }
        return list;
    }

    private static String safe(String s) { return s == null ? "" : s; }
}
