/**
 * 营养健康提示 + 营养数据校验修正(本地版)
 * 1:1 移植自后端 NutritionService.java 与 RecognizeService.validateAndFixNutrition
 * 依据 GB 28050-2025 NRV 参考值。
 */

const NRV = { energy: 8400, protein: 60, fat: 60, carbohydrate: 300, sodium: 2000 }
const LOW_THRESHOLD = 15
const HIGH_THRESHOLD = 30
const DEVIATION_THRESHOLD = 0.2

const round2 = (v) => Math.round(v * 100) / 100

/** 从净含量字符串提取克数,例如 "250ml"→250, "500g"→500;失败回退 100 */
export function parseGrams(netContent) {
  if (!netContent || !String(netContent).trim()) return 100
  const digits = String(netContent).replace(/[^0-9.]/g, '')
  const val = parseFloat(digits)
  return val > 0 ? val : 100
}

/**
 * 生成营养健康提示列表(整份口径)。
 * @param {object} nutrition  每100g营养 { energy, protein, fat, carbohydrate, sodium }
 * @param {number} netContentG 净含量(克)
 * @returns {Array<{name, percentage, level, text}>}
 */
export function generateHealthTips(nutrition, netContentG) {
  const tips = []
  if (!nutrition || netContentG <= 0) return tips
  const ratio = netContentG / 100

  const add = (name, per100g, nrv, highText, midText, lowText) => {
    if (per100g == null || per100g <= 0) return
    const pct = Math.round((per100g * ratio) / nrv * 1000) / 10
    let level, text
    if (pct > HIGH_THRESHOLD) { level = '偏高'; text = highText }
    else if (pct >= LOW_THRESHOLD) { level = '适中'; text = midText }
    else { level = '偏低'; text = lowText }
    tips.push({ name, percentage: pct, level, text })
  }

  add('能量', nutrition.energy, NRV.energy,
    '能量偏高，建议控制每日摄入总量', '能量适中，正常食用即可', '能量偏低，可作为低卡零食选择')
  add('蛋白质', nutrition.protein, NRV.protein,
    '蛋白质含量较高，适合运动后补充', '蛋白质含量适中', '蛋白质含量较低，可搭配高蛋白食物一同食用')
  add('脂肪', nutrition.fat, NRV.fat,
    '脂肪含量偏高，建议适量食用，避免增加心血管负担', '脂肪含量适中，正常食用无需担心', '脂肪含量较低，适合控脂人群')
  add('碳水化合物', nutrition.carbohydrate, NRV.carbohydrate,
    '碳水化合物偏高，糖尿病患者请注意控制食用量', '碳水化合物含量适中', '碳水化合物含量较低，适合低碳饮食人群')
  add('钠', nutrition.sodium, NRV.sodium,
    '钠含量偏高，建议控制食用量，高血压及肾病患者尤需注意', '钠含量适中，正常食用无需担心', '钠含量较低，适合低钠饮食人群')
  return tips
}

/** 添加剂疾病禁忌提示:含X，Y人群不建议食用 */
export function generateAdditiveTips(additiveMap) {
  const tips = []
  if (!additiveMap) return tips
  for (const info of Object.values(additiveMap)) {
    const contra = info.diseaseContraindication
    if (!contra || !contra.trim()) continue
    tips.push({
      name: '添加剂禁忌', percentage: null, level: '偏高',
      text: `含${info.name}，${contra}人群不建议食用`,
    })
  }
  return tips
}

/**
 * NRV% 反推 + 能量交叉校验,修正大模型识别误差(原地修改 nutrition)。
 * @param {object} nutrition 每100g { energy, protein, fat, carbohydrate, sodium }
 * @param {object} nutJson   模型返回的 nutrition 节点(含 xxxNRV 字段)
 * @returns {object} 各指标来源标记 raw / nrv / energyCalc
 */
export function validateAndFixNutrition(nutrition, nutJson) {
  const flag = {}
  const fixByNrv = (key, rawValue, nrvPercent, nrvBase) => {
    const hasValue = rawValue != null && !isNaN(rawValue)
    const hasNrv = nrvPercent != null && nrvPercent > 0
    if (!hasValue && hasNrv) {
      flag[key] = 'nrv'
      return round2((nrvPercent / 100) * nrvBase)
    }
    if (hasValue && hasNrv) {
      const back = (nrvPercent / 100) * nrvBase
      if (back > 0 && Math.abs(rawValue - back) / back > DEVIATION_THRESHOLD) {
        flag[key] = 'nrv'
        return round2(back)
      }
      flag[key] = 'raw'
      return rawValue
    }
    if (hasValue) {
      flag[key] = 'raw'
      return rawValue
    }
    return null
  }

  let energy = fixByNrv('energy', nutrition.energy, nutJson?.energyNRV, NRV.energy)
  const protein = fixByNrv('protein', nutrition.protein, nutJson?.proteinNRV, NRV.protein)
  const fat = fixByNrv('fat', nutrition.fat, nutJson?.fatNRV, NRV.fat)
  let carbohydrate = fixByNrv('carbohydrate', nutrition.carbohydrate, nutJson?.carbohydrateNRV, NRV.carbohydrate)
  const sodium = fixByNrv('sodium', nutrition.sodium, nutJson?.sodiumNRV, NRV.sodium)

  // 能量与三大营养素交叉校验(kJ:蛋白×17 + 脂肪×37 + 碳水×17)
  if (protein != null && fat != null && carbohydrate != null) {
    const calcEnergy = protein * 17 + fat * 37 + carbohydrate * 17
    if (calcEnergy > 0) {
      if (energy == null) {
        energy = round2(calcEnergy)
        flag.energy = 'energyCalc'
      } else if (Math.abs(energy - calcEnergy) / calcEnergy > DEVIATION_THRESHOLD) {
        energy = round2(calcEnergy)
        flag.energy = 'energyCalc'
      }
    }
  }

  // 碳水兜底:能量明显偏大但碳水缺失/为 0
  if ((carbohydrate == null || carbohydrate === 0) && energy != null && energy > 0) {
    const p = protein ?? 0
    const f = fat ?? 0
    const estCarb = (energy - p * 17 - f * 37) / 17
    if (estCarb > 0) {
      carbohydrate = round2(estCarb)
      flag.carbohydrate = 'energyCalc'
    } else {
      carbohydrate = 0
      flag.carbohydrate = 'raw'
    }
  }

  nutrition.energy = energy
  nutrition.protein = protein
  nutrition.fat = fat
  nutrition.carbohydrate = carbohydrate
  nutrition.sodium = sodium
  return flag
}
