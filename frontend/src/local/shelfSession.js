/**
 * 货架 PK 会话 —— "站在货架前连扫几款,实时排名"的临时购物清单。
 * 存 localStorage,刷新不丢;与历史记录独立(只存排名要用的精简字段)。
 */
import { calcHealthScore } from './healthScore'

const KEY = 'shelfSession'
const MAX = 8

const NRV = { carbohydrate: 300, fat: 60, sodium: 2000 }

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function getShelfSession() {
  return read()
}

export function clearShelf() {
  localStorage.removeItem(KEY)
}

export function removeFromShelf(id) {
  write(read().filter((e) => String(e.id) !== String(id)))
  return read()
}

/**
 * 把一条识别结果 VO 加入货架会话(按 id 去重,重复扫描覆盖)。
 * @param {object} vo RecognitionResultVO(含 id/productName/nutrition/additiveMap/healthScore)
 */
export function addToShelf(vo) {
  if (!vo || vo.id == null) return read()
  const nutrition = vo.nutrition || {}
  const additiveCount = vo.additiveMap ? Object.keys(vo.additiveMap).length : 0
  const healthScore = vo.healthScore != null ? vo.healthScore : calcHealthScore(nutrition, additiveCount)
  const entry = {
    id: String(vo.id),
    name: vo.productName || '未命名产品',
    imageUrl: vo.imageUrl || null,
    category: vo.category || null,
    healthScore,
    additiveCount,
    nutrition: {
      energy: nutrition.energy ?? null,
      carbohydrate: nutrition.carbohydrate ?? null,
      fat: nutrition.fat ?? null,
      sodium: nutrition.sodium ?? null,
    },
    addedAt: Date.now(),
  }
  const list = read().filter((e) => e.id !== entry.id)
  list.push(entry)
  // 超出上限时丢弃最早加入的
  const trimmed = list.length > MAX ? list.slice(list.length - MAX) : list
  write(trimmed)
  return trimmed
}

/**
 * 一句话判决:从营养/添加剂数据直接推断,无需额外 AI 调用。
 * @returns {{ text: string, tone: 'good'|'warn'|'bad' }}
 */
export function verdictLine(entry) {
  const n = entry.nutrition || {}
  // 找出相对 NRV/100g 最突出的"负担"指标
  const burdens = [
    { name: '高糖', tone: 'bad', ratio: n.carbohydrate != null ? n.carbohydrate / NRV.carbohydrate : 0 },
    { name: '高钠', tone: 'bad', ratio: n.sodium != null ? n.sodium / NRV.sodium : 0 },
    { name: '高脂', tone: 'bad', ratio: n.fat != null ? n.fat / NRV.fat : 0 },
  ].sort((a, b) => b.ratio - a.ratio)
  const top = burdens[0]

  if (entry.healthScore >= 85 && entry.additiveCount === 0) {
    return { text: '配料干净,放心选', tone: 'good' }
  }
  if (top && top.ratio > 0.3) {
    const extra = entry.additiveCount >= 5 ? ` · 添加剂 ${entry.additiveCount} 种` : ''
    return { text: `${top.name}${extra}`, tone: 'bad' }
  }
  if (entry.additiveCount >= 6) {
    return { text: `添加剂偏多(${entry.additiveCount} 种)`, tone: 'warn' }
  }
  if (entry.healthScore >= 70) {
    return { text: '整体均衡', tone: 'good' }
  }
  return { text: '一般,看需求', tone: 'warn' }
}

/** 按健康评分降序排名,平手时添加剂少者优先,再次比钠 */
export function rankShelf(list) {
  return [...list].sort((a, b) => {
    if (b.healthScore !== a.healthScore) return b.healthScore - a.healthScore
    if (a.additiveCount !== b.additiveCount) return a.additiveCount - b.additiveCount
    return (a.nutrition?.sodium ?? 0) - (b.nutrition?.sodium ?? 0)
  })
}
