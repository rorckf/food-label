/**
 * 单机模式识别总装配 —— 复刻后端 RecognizeService.recognize() 的完整流水线:
 *   压缩图片 → BYOK直连识别 → 营养校验修正 → 添加剂匹配 → 健康提示
 *   → 标准码反查品类 → 保质期解析 → 致敏原提取 → 健康评分 → 本地历史持久化
 * 返回值结构与后端 RecognitionResultVO 完全一致。
 */
import { effectiveLlmConfig } from './byok'
import { recognizeLabel, dashscopeTextCall, fileToBase64 } from './recognize'
import { batchMatchAdditives } from './additiveDb'
import { calcHealthScore } from './healthScore'
import { generateHealthTips, generateAdditiveTips, validateAndFixNutrition, parseGrams } from './nutritionTips'
import { extractAllergens } from './allergens'
import { evaluateShelfLife } from './shelfLife'
import { lookupStandardCategory } from './standardCodeMap'
import { saveLocalHistory } from './history'

/** 压缩图片:最长边 1280px、JPEG q0.8 —— 同时服务于传输提速和本地存储 */
async function compressImage(file, maxEdge = 1280, quality = 0.8) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = dataUrl
  })
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  if (scale === 1 && file.type === 'image/jpeg') {
    return { dataUrl, base64: dataUrl.split(',')[1] }
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  const out = canvas.toDataURL('image/jpeg', quality)
  return { dataUrl: out, base64: out.split(',')[1] }
}

/** 非食品标签图片的专用错误,UI 层据此给友好提示 */
export class NotFoodLabelError extends Error {
  constructor(reason) {
    super(reason || '图片不是食品标签')
    this.name = 'NotFoodLabelError'
  }
}

/**
 * 单机识别入口。
 * @param {File|Blob} file 用户拍摄/选择的图片
 * @returns {object} RecognitionResultVO 结构(含 id,已存入本地历史)
 * @throws {NotFoodLabelError} 图片不是食品标签
 * @throws {Error} Key 未配置 / 网络与鉴权错误
 */
export async function localRecognize(file) {
  const cfg = effectiveLlmConfig()
  if (!cfg.apiKey) {
    const e = new Error('尚未配置 API Key')
    e.name = 'NoApiKeyError'
    throw e
  }

  // 1. 压缩(本地存储用 dataUrl,识别用 base64)
  const { dataUrl, base64 } = await compressImage(file)

  // 2. BYOK 直连识别(提示词 v2,自带 isFoodLabel 防御与每100g换算)
  const aiJson = await recognizeLabel(base64, cfg)
  if (aiJson.isFoodLabel === false) {
    throw new NotFoodLabelError(aiJson.reason)
  }

  // 3. 基本字段
  const productName = aiJson.productName ?? null
  let category = aiJson.category ?? null
  const netContent = aiJson.netContent ?? null
  const nutJson = aiJson.nutrition || {}
  const ingredients = Array.isArray(aiJson.ingredients) ? aiJson.ingredients.filter(Boolean) : []

  // 4. 营养构造 + NRV%反推/能量交叉校验修正
  const nutrition = {
    energy: nutJson.energy ?? null,
    protein: nutJson.protein ?? null,
    fat: nutJson.fat ?? null,
    carbohydrate: nutJson.carbohydrate ?? null,
    sodium: nutJson.sodium ?? null,
  }
  const fixFlag = validateAndFixNutrition(nutrition, nutJson)

  // 5. 添加剂匹配(本地 GB 2760 知识库)
  const additiveMap = batchMatchAdditives(ingredients)

  // 6. 健康提示(整份口径 + 添加剂禁忌)
  const netG = parseGrams(netContent)
  const healthTips = [
    ...generateHealthTips(nutrition, netG),
    ...generateAdditiveTips(additiveMap),
  ]

  // 7. 标准码反查品类(命中覆盖 LLM 结果)
  const standardRaw = aiJson.standard ?? null
  const categoryFromStandard = lookupStandardCategory(standardRaw)
  if (categoryFromStandard) category = categoryFromStandard

  // 8. 保质期 + 致敏原
  const productionRaw = aiJson.productionDate ?? null
  const shelfLifeRaw = aiJson.shelfLife ?? null
  const allergenText = aiJson.allergenText ?? null
  const shelfLifeStatus = evaluateShelfLife(productionRaw, shelfLifeRaw)
  const allergens = extractAllergens(ingredients, allergenText)

  const vo = {
    userId: null,
    imageUrl: dataUrl,
    productName,
    category,
    netContent,
    manufacturer: aiJson.manufacturer ?? null,
    licenseNumber: aiJson.licenseNumber ?? null,
    standard: standardRaw,
    origin: aiJson.origin ?? null,
    productionDate: productionRaw,
    shelfLife: shelfLifeRaw,
    storage: aiJson.storage ?? null,
    contact: aiJson.contact ?? null,
    nutritionBasis: aiJson.nutritionBasis ?? null,
    nutrition,
    ingredients,
    additiveMap,
    healthTips,
    fixFlag,
    shelfLifeStatus,
    allergenText,
    allergens,
    categoryFromStandard,
  }

  // 9. 健康评分 + 本地历史持久化
  const healthScore = calcHealthScore(nutrition, Object.keys(additiveMap).length)
  vo.healthScore = healthScore
  const id = saveLocalHistory({ productName, category, imageUrl: dataUrl, healthScore, detail: vo })
  vo.id = id
  return vo
}

// ─── 配料翻译成人话(本地版,与后端 EXPLAIN_SYSTEM_PROMPT 一致) ───

const EXPLAIN_PROMPT =
  '你是一个亲切的食品健康科普助手。请用通俗易懂的大白话，给普通消费者点评下面这款食品的配料和营养，' +
  '帮他们一眼看懂这东西到底是什么、值不值得买。要求：\n' +
  '1) 先一句话说清这东西本质上主要是什么（例如“说白了就是糖水加香精色素”）；\n' +
  '2) 点出值得注意的添加剂或营养问题（高糖/高钠/防腐剂/色素等），配料干净就如实夸；\n' +
  '3) 给一句接地气的建议（能不能吃、适合谁、怎么吃）。\n' +
  '整体控制在 150 字以内，语气亲切口语化，可以适当用 emoji，' +
  '写成连贯的两三句话，不要分点编号，不要客套开场白，直接说结论。'

export async function localExplain(payload) {
  const cfg = effectiveLlmConfig()
  if (!cfg.apiKey) {
    const e = new Error('尚未配置 API Key')
    e.name = 'NoApiKeyError'
    throw e
  }
  const lines = [EXPLAIN_PROMPT, '', '=== 待点评食品信息 ===']
  lines.push(`产品名称：${payload.productName || '未知'}`)
  lines.push(`食品品类：${payload.category || '未知'}`)
  if (payload.ingredients?.length) lines.push(`配料表：${payload.ingredients.join('、')}`)
  if (payload.additives?.length) lines.push(`已识别添加剂：${payload.additives.join('、')}`)
  const nut = []
  if (payload.energy != null) nut.push(`能量 ${payload.energy}`)
  if (payload.protein != null) nut.push(`蛋白质 ${payload.protein}g`)
  if (payload.fat != null) nut.push(`脂肪 ${payload.fat}g`)
  if (payload.carbohydrate != null) nut.push(`碳水 ${payload.carbohydrate}g`)
  if (payload.sodium != null) nut.push(`钠 ${payload.sodium}mg`)
  if (nut.length) lines.push(`每100g营养：${nut.join('，')}`)
  return dashscopeTextCall(lines.join('\n'), cfg)
}
