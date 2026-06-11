/**
 * 健康评分算法(本地版) —— 1:1 移植自后端 HealthScoreCalculator.java
 *
 * 满分 100,整数:
 *   每条偏高 NRV 的营养指标扣 8 分(>30% NRV/100g 视为偏高);
 *   每个添加剂扣 3 分;最低 0 分。
 */

const NRV = {
  energy: 8400,        // kJ
  fat: 60,             // g
  carbohydrate: 300,   // g
  sodium: 2000,        // mg
}

function overNrv(value, nrv) {
  if (value == null || isNaN(value)) return 0
  return value / nrv > 0.3 ? 1 : 0
}

/**
 * @param {object|null} nutrition  { energy, fat, carbohydrate, sodium } 每100g数值
 * @param {number} additiveCount   命中的添加剂数量
 * @returns {number} 0-100 整数评分
 */
export function calcHealthScore(nutrition, additiveCount = 0) {
  let score = 100
  if (nutrition) {
    score -= overNrv(nutrition.energy, NRV.energy) * 8
    score -= overNrv(nutrition.fat, NRV.fat) * 8
    score -= overNrv(nutrition.carbohydrate, NRV.carbohydrate) * 8
    score -= overNrv(nutrition.sodium, NRV.sodium) * 8
  }
  score -= (additiveCount || 0) * 3
  return Math.max(0, Math.round(score))
}

/** 三级评级,与后端展示口径一致 */
export function healthTier(score) {
  if (score >= 85) return '优'
  if (score >= 70) return '良'
  if (score >= 50) return '中'
  return '差'
}
