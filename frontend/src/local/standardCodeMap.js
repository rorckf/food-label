/**
 * GB / SB 执行标准代号 → 食品品类(本地版) —— 1:1 移植自后端 StandardCodeMap.java
 * 命中即覆盖 LLM 的 category;企业标准(Q/*)返回 null 由 LLM 兜底。
 */

const CODE_TO_CATEGORY = {
  'GB7099': '烘焙', 'GB/T20977': '烘焙', 'GB/T20981': '烘焙', 'GB/T20980': '烘焙', 'GB/T23823': '烘焙',
  'GB19295': '方便食品', 'SB/T10423': '方便食品',
  'GB/T23969': '肉制品', 'GB2726': '肉制品', 'GB2730': '肉制品',
  'GB10136': '其他', 'GB2733': '其他', 'GB2712': '其他', 'GB/T22106': '其他',
  'GB19644': '乳制品', 'GB19645': '乳制品', 'GB25192': '乳制品', 'GB5420': '乳制品',
  'GB7101': '饮料', 'GB/T10789': '饮料', 'GB/T21733': '饮料',
  'SB/T10018': '糖果零食', 'GB/T20978': '糖果零食',
  'GB2717': '调味品', 'GB2719': '调味品',
  'GB/T14456': '茶叶',
  'GB/T10781': '酒类', 'GB/T15037': '酒类',
}

const CODE_PATTERN = /(GB|SB)\s*(\/\s*T)?\s*(\d{3,5})/i

export function lookupStandardCategory(standard) {
  if (!standard || !String(standard).trim()) return null
  const m = String(standard).match(CODE_PATTERN)
  if (!m) return null
  const key = m[1].toUpperCase() + (m[2] ? '/T' : '') + m[3]
  return CODE_TO_CATEGORY[key] || null
}
