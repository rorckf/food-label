/**
 * 健康食品推荐(本地版) —— 1:1 移植自后端 RecommendService.java
 * 算法链路:召回(foodLibrary.json) → 硬过滤(慢性病) → 内容打分 → 加权排序 → 推荐理由
 */
import FOOD_LIBRARY from './data/foodLibrary.json'
import { getLocalProfile } from './profile'

/** 慢性病 → 必须排除的负面标签(命中即剔除) */
const DISEASE_AVOID_TAG = { '高血压': '高钠', '糖尿病': '高糖', '高血脂': '高脂' }

/** 慢性病 → 友好正向标签(推荐理由展示) */
const DISEASE_FRIENDLY_TAG = { '高血压': '低钠', '糖尿病': '无糖', '高血脂': '低脂' }

/** 健康目标 → 偏好正向标签 */
const GOAL_PREFER_TAGS = {
  '减脂': ['低糖', '低脂', '高蛋白', '高纤维'],
  '增肌': ['高蛋白', '高钙'],
  '控糖': ['无糖', '低糖'],
  '控压': ['低钠'],
  '通用': ['低糖', '低脂', '低钠'],
}

/** 健康目标 → 反向标签(出现则扣分) */
const GOAL_AVOID_TAGS = {
  '减脂': ['高糖', '高脂'],
  '增肌': [],
  '控糖': ['高糖'],
  '控压': ['高钠'],
  '通用': [],
}

const splitCsv = (csv) =>
  !csv || !csv.trim() ? [] : csv.split(',').map((s) => s.trim()).filter(Boolean)

function hitDiseaseAvoid(foodTags, userDiseases) {
  return userDiseases.some((d) => {
    const avoidTag = DISEASE_AVOID_TAG[d]
    return avoidTag && foodTags.includes(avoidTag)
  })
}

/** tag_score ∈ [0,100]:基础 50 ± 命中标签数 × 10 */
function computeTagScore(goal, foodTags) {
  let score = 50
  for (const t of GOAL_PREFER_TAGS[goal] || []) if (foodTags.includes(t)) score += 10
  for (const t of GOAL_AVOID_TAGS[goal] || []) if (foodTags.includes(t)) score -= 10
  return Math.max(0, Math.min(100, score))
}

function buildReasons(goal, userDiseases, foodTags, healthScore) {
  const reasons = []
  const matched = (GOAL_PREFER_TAGS[goal] || []).filter((t) => foodTags.includes(t))
  if (matched.length && reasons.length < 3) {
    reasons.push(`符合${goal}目标·${matched.join('+')}`)
  }
  for (const d of userDiseases) {
    if (reasons.length >= 3) break
    const friendly = DISEASE_FRIENDLY_TAG[d]
    if (friendly && foodTags.includes(friendly)) {
      reasons.push(`适合${d}人群·${friendly}`)
    }
  }
  if (reasons.length < 3) {
    const tier = healthScore >= 85 ? '（优）' : healthScore >= 70 ? '（良）' : healthScore >= 50 ? '（中）' : ''
    reasons.push(`健康评分 ${healthScore}${tier}`)
  }
  return reasons
}

/**
 * 推荐主入口(返回 { userProfile, items },与后端 /recommend 响应一致)
 */
export function localRecommend(limit = 10) {
  const profile = getLocalProfile() || {}
  const goal = profile.healthGoal || '通用'
  const userDiseases = splitCsv(profile.chronicDiseases)

  const ranked = []
  for (const f of FOOD_LIBRARY) {
    const foodTags = splitCsv(f.tags)
    if (hitDiseaseAvoid(foodTags, userDiseases)) continue

    const tagScore = computeTagScore(goal, foodTags)
    const healthSc = f.healthScore == null ? 50 : f.healthScore
    const finalScore = 0.6 * healthSc + 0.4 * tagScore

    ranked.push({
      id: f.id,
      name: f.name,
      category: f.category,
      brand: f.brand,
      imageUrl: f.imageUrl ?? null,
      energy: f.energy,
      protein: f.protein,
      fat: f.fat,
      carb: f.carb,
      sodium: f.sodium,
      additives: f.additives,
      tags: foodTags,
      healthScore: f.healthScore,
      score: Math.round(finalScore * 10) / 10,
      reasons: buildReasons(goal, userDiseases, foodTags, healthSc),
    })
  }

  ranked.sort((a, b) => b.score - a.score)
  const items = ranked.length > limit ? ranked.slice(0, limit) : ranked

  return {
    userProfile: {
      healthGoal: profile.healthGoal ?? null,
      chronicDiseases: profile.chronicDiseases ?? null,
    },
    items,
  }
}
