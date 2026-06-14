/**
 * 代价换算 —— 把抽象的营养数字翻译成身体能感知的代价。
 * 纯函数,无依赖,网页/单机双形态通用。
 *
 * 口径:默认按"吃/喝完整份(整个包装)"计,从净含量推总量;
 *       净含量无法解析时回退到"每 100g/份"口径,并在 basis 标明。
 *
 * 依据:
 *   能量单位 kJ(GB 28050),1 kcal = 4.184 kJ
 *   食盐≈钠 × 2.5(NaCl 中钠占比 39.3%)
 *   方糖 1 块 ≈ 4.5g
 *   运动消耗按 60kg 成人:慢跑 ≈ 10 kcal/min,快走 ≈ 4.5 kcal/min
 */

const CUBE_GRAMS = 4.5        // 一块方糖
const SALT_PER_SODIUM = 2.5   // 盐 = 钠 × 2.5
const KJ_PER_KCAL = 4.184
const JOG_KCAL_MIN = 10       // 60kg 慢跑
const WALK_KCAL_MIN = 4.5     // 60kg 快走
const WHO_SALT_DAILY = 5      // WHO 建议每日食盐上限 g

/** 解析净含量为总克(毫升)数;无法解析返回 null(区别于"解析成 100") */
function parseTotal(netContent) {
  if (!netContent || !String(netContent).trim()) return null
  const s = String(netContent)
  const nums = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => n > 0)
  if (!nums.length) return null
  if (/[×xX*]/.test(s) && nums.length >= 2) return nums[0] * nums[1]
  return nums[0]
}

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const round1 = (v) => Math.round(v * 10) / 10

/**
 * @param {object} nutrition 每 100g/份 营养 { energy(kJ), carbohydrate, fat, sodium, ... }
 * @param {string} netContent 净含量字符串
 * @returns {null | { basis, scale, items: Array }}
 *   basis: 'package' | 'per100'  scale: 总量/100 的倍数
 *   items: [{ key, icon, label, value, unit, note?, cubes? }]
 */
export function computeFoodCost(nutrition, netContent) {
  if (!nutrition) return null

  const total = parseTotal(netContent)
  const basis = total != null ? 'package' : 'per100'
  const scale = total != null ? total / 100 : 1

  const carb = num(nutrition.carbohydrate)
  const sodium = num(nutrition.sodium)
  const energy = num(nutrition.energy)

  const items = []

  // 糖 → 方糖(按碳水换算,标注口径)
  if (carb != null && carb > 0) {
    const grams = round1(carb * scale)
    const cubes = grams / CUBE_GRAMS
    items.push({
      key: 'sugar',
      icon: '🧊',
      label: '碳水',
      value: round1(cubes),
      unit: '块方糖',
      detail: `${grams}g 碳水化合物`,
      cubes: Math.min(Math.round(cubes), 16),
      cubesMore: cubes > 16,
      note: '按碳水化合物折算,其中含淀粉等,非全是糖',
    })
  }

  // 钠 → 盐
  if (sodium != null && sodium > 0) {
    const saltG = round1((sodium * scale * SALT_PER_SODIUM) / 1000)
    const pctDaily = Math.round((saltG / WHO_SALT_DAILY) * 100)
    items.push({
      key: 'salt',
      icon: '🧂',
      label: '钠',
      value: saltG,
      unit: 'g 盐',
      detail: `约占 WHO 每日上限的 ${pctDaily}%`,
    })
  }

  // 能量 → 运动
  if (energy != null && energy > 0) {
    const kcal = (energy * scale) / KJ_PER_KCAL
    items.push({
      key: 'energy',
      icon: '🏃',
      label: '能量',
      value: Math.round(kcal),
      unit: 'kcal',
      detail: `慢跑 ${Math.round(kcal / JOG_KCAL_MIN)} 分钟,或快走 ${Math.round(kcal / WALK_KCAL_MIN)} 分钟`,
    })
  }

  if (!items.length) return null
  return { basis, scale: round1(scale), items }
}
