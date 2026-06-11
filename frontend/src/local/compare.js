/**
 * 同品类对比(本地版) —— 1:1 移植自后端 ComparisonService.java
 * 取两条本地历史记录,7 维度逐项比较并产出推荐结论。
 */
import { getLocalHistoryDetail } from './history'
import { calcHealthScore } from './healthScore'

/** true=越低越好(钠/添加剂数量等),false=越高越好(蛋白质/健康评分) */
const LOWER_IS_BETTER = {
  '能量': true, '蛋白质': false, '脂肪': true, '碳水化合物': true,
  '钠': true, '添加剂数量': true, '健康评分': false,
}

function decideWinner(metric, a, b) {
  if (a == null && b == null) return 'TIE'
  if (a == null) return 'B'
  if (b == null) return 'A'
  if (a === b) return 'TIE'
  const lowerBetter = LOWER_IS_BETTER[metric] ?? false
  return (lowerBetter ? a < b : a > b) ? 'A' : 'B'
}

function buildRecommendation(metrics, nameA, nameB) {
  let aWins = 0
  let bWins = 0
  const aAdv = []
  const bAdv = []
  for (const [name, m] of Object.entries(metrics)) {
    if (m.winner === 'A') { aWins++; aAdv.push(`${name}更优`) }
    else if (m.winner === 'B') { bWins++; bAdv.push(`${name}更优`) }
  }
  if (Math.abs(aWins - bWins) <= 1) return '两款产品整体相近，建议参考价格因素选择'
  if (aWins > bWins) return `${nameA || '该产品'} ${aAdv.join('、')}，推荐选择 A`
  return `${nameB || '该产品'} ${bAdv.join('、')}，推荐选择 B`
}

/**
 * @param {Array} ids 两条本地历史记录 id
 * @returns ComparisonResultVO 结构 { productA, productB, metrics, recommendation }
 * @throws Error 记录缺失 / 品类不一致
 */
export function localCompare(ids) {
  if (!ids || ids.length < 2 || ids[0] == null || ids[1] == null) {
    throw new Error('请选择两款产品进行对比')
  }
  const recA = getLocalHistoryDetail(ids[0])
  const recB = getLocalHistoryDetail(ids[1])
  if (!recA || !recB) throw new Error('记录不存在')
  const voA = recA.detail
  const voB = recB.detail
  if (!voA || !voB) throw new Error('部分产品数据缺失，无法完成对比')

  const catA = recA.category ?? voA.category
  const catB = recB.category ?? voB.category
  if (catA != null && catB != null && catA !== catB) {
    throw new Error('仅支持同品类产品对比')
  }

  const additiveCount = (vo) => (vo.additiveMap ? Object.keys(vo.additiveMap).length : 0)
  const summary = (rec, vo) => ({
    id: rec.id,
    productName: rec.productName,
    imageUrl: rec.imageUrl,
    healthScore: calcHealthScore(vo.nutrition, additiveCount(vo)),
  })

  const productA = summary(recA, voA)
  const productB = summary(recB, voB)

  const metrics = {}
  const put = (name, a, b) => {
    metrics[name] = { a: a ?? null, b: b ?? null, winner: decideWinner(name, a ?? null, b ?? null) }
  }
  const nA = voA.nutrition
  const nB = voB.nutrition
  if (nA && nB) {
    put('能量', nA.energy, nB.energy)
    put('蛋白质', nA.protein, nB.protein)
    put('脂肪', nA.fat, nB.fat)
    put('碳水化合物', nA.carbohydrate, nB.carbohydrate)
    put('钠', nA.sodium, nB.sodium)
  }
  put('添加剂数量', additiveCount(voA), additiveCount(voB))
  put('健康评分', productA.healthScore, productB.healthScore)

  return {
    productA,
    productB,
    metrics,
    recommendation: buildRecommendation(metrics, voA.productName, voB.productName),
  }
}
