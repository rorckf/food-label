/**
 * 添加剂匹配 + 配料三分类(本地版) —— 1:1 移植自后端 AdditiveService.java
 * 数据源:./data/additives.json(GB 2760-2024,289 条,构建期打包)
 * 限量明细 additiveLimits.json 体积较大(3.4MB),按需动态加载。
 */
import ADDITIVES from './data/additives.json'

const DEFAULT_DESC = '暂无详细说明，建议参考 GB 2760-2024 国家食品安全标准'

/** 辅料关键词库(与后端 AUXILIARY_KEYWORDS 一致) */
const AUXILIARY_KEYWORDS = [
  '水', '饮用水', '纯净水', '矿泉水',
  '白砂糖', '蔗糖', '冰糖', '红糖', '麦芽糖', '果葡糖浆', '葡萄糖浆', '糖霜',
  '植物油', '菜籽油', '大豆油', '棕榈油', '花生油', '色拉油',
  '玉米油', '葵花籽油', '食用植物油',
  '食用盐', '食盐', '海盐',
  '小麦粉', '玉米淀粉', '马铃薯淀粉', '全脂奶粉', '脱脂奶粉', '可可粉', '抹茶粉',
  '酱油', '食醋', '蚝油', '料酒', '番茄酱', '芝麻酱', '豆瓣酱',
  '酵母', '食用酵母', '高活性干酵母', '酶制剂',
  '食用香精', '食用香料',
]

/** 疑似添加剂关键词(知识库未命中时的兜底判断) */
const ADDITIVE_KEYWORDS = [
  '酸', '胶', '酯', '甜', '色', '素', '钠', '钾',
  '磷', '钙', '镁', '铁', '锌', '铜', '锰', '硒',
  '维生素', '防腐', '增稠', '乳化', '着色', '甜味', '香料',
]

const BRACKET_PATTERN = /[（(\[【〔]([^（()\[【〔）)\]】〕]*)[）)\]】〕]/g
const COMPOUND_SPLIT = /[、,，;；/]/
const COMPOUND_KEYWORDS = ['复配', '复合', '改良剂', '调和']
const ADDITIVE_PREFIXES = ['食品添加剂', '添加剂']

/** INS/E 数字代码 → 中文标准名(与后端 INS_CODE_MAP 一致) */
const INS_CODE_MAP = {
  '100': '姜黄素', '160a': 'β-胡萝卜素', '160b': '胭脂树橙', '160c': '辣椒红',
  '260': '冰乙酸', '270': '乳酸', '296': '苹果酸', '300': '维生素C',
  '322': '卵磷脂', '330': '柠檬酸', '331': '柠檬酸钠', '339': '磷酸钠',
  '340': '磷酸钾', '407': '卡拉胶', '410': '刺槐豆胶', '412': '瓜尔胶',
  '415': '黄原胶', '418': '结冷胶', '440': '果胶', '450': '焦磷酸钠',
  '450i': '焦磷酸二氢二钠', '451': '三聚磷酸钠', '452': '六偏磷酸钠',
  '466': '羧甲基纤维素钠', '471': '单双甘油脂肪酸酯', '472e': '双乙酰酒石酸单双甘油酯',
  '481': '硬脂酰乳酸钠', '482': '硬脂酰乳酸钙', '500': '碳酸钠', '500ii': '碳酸氢钠',
  '501': '碳酸钾', '509': '氯化钙', '541': '酸式磷酸铝钠', '621': '谷氨酸钠',
  '627': "5'-鸟苷酸二钠", '631': "5'-肌苷酸二钠", '635': "5'-呈味核苷酸二钠",
  '951': '阿斯巴甜', '952': '环己基氨基磺酸钠', '954': '糖精钠', '955': '三氯蔗糖',
  '960': '甜菊糖苷', '1400': '糊精', '1442': '羟丙基二淀粉磷酸酯',
  '1450': '辛烯基琥珀酸淀粉钠', '1520': '丙二醇',
}
const INS_CODE_PATTERN = /^\d{2,4}[a-z]{0,3}$/

// ─── 基础工具 ───────────────────────────────────────────────

function toHalfWidth(s) {
  let out = ''
  for (const ch of s) {
    const code = ch.charCodeAt(0)
    if (code === 0x3000) out += ' '
    else if (code >= 0xff01 && code <= 0xff5e) out += String.fromCharCode(code - 0xfee0)
    else out += ch
  }
  return out
}

/** 由内向外多轮剥离括号(最多 8 轮,防御异常文本) */
function iterativelyStripBrackets(s) {
  for (let i = 0; i < 8; i++) {
    const next = s.replace(BRACKET_PATTERN, '')
    if (next === s) return next
    s = next
  }
  return s
}

export function normalize(raw) {
  if (raw == null) return ''
  return toHalfWidth(iterativelyStripBrackets(String(raw))).trim()
}

function resolveInsCode(name) {
  const key = name.trim().toLowerCase()
  if (INS_CODE_PATTERN.test(key) && INS_CODE_MAP[key]) return INS_CODE_MAP[key]
  return name
}

/** 先精确再模糊(模糊 = additive_name 包含关键词,取名称最短者),与后端 SQL 语义一致 */
function lookup(name) {
  if (!name || !name.trim()) return null
  const resolved = resolveInsCode(name)
  const exact = ADDITIVES.find((a) => a.name === resolved)
  if (exact) return exact
  const fuzzy = ADDITIVES.filter((a) => a.name.includes(resolved))
  if (fuzzy.length === 0) return null
  fuzzy.sort((x, y) => x.name.length - y.name.length)
  return fuzzy[0]
}

function toVO(a, displayName) {
  return {
    name: displayName || a.name,
    category: a.func || '未知',
    description: a.safety || DEFAULT_DESC,
    usageScope: a.scope || null,
    maxDosage: a.dosage || null,
    diseaseContraindication: a.disease || null,
  }
}

function unknownVO(name, category = '未知') {
  return {
    name, category, description: DEFAULT_DESC,
    usageScope: null, maxDosage: null, diseaseContraindication: null,
  }
}

function looksLikeAdditive(name) {
  return ADDITIVE_KEYWORDS.some((kw) => name.includes(kw))
}

function matchesAuxiliary(normalized) {
  return AUXILIARY_KEYWORDS.some((kw) => normalized.includes(kw))
}

function isCompoundAdditive(raw, normalized) {
  return COMPOUND_KEYWORDS.some((kw) => (raw && raw.includes(kw)) || normalized.includes(kw))
}

function hasAdditivePrefix(raw) {
  if (!raw) return false
  const trimmed = raw.trim()
  return ADDITIVE_PREFIXES.some((prefix) =>
    ['(', '（', '[', '【', '〔'].some((open) => trimmed.startsWith(prefix + open))
  )
}

function splitAtoms(s) {
  if (!s) return []
  return s.split(COMPOUND_SPLIT).map((p) => p.trim()).filter(Boolean)
}

function bracketContents(half) {
  const out = []
  const re = new RegExp(BRACKET_PATTERN.source, 'g')
  let m
  while ((m = re.exec(half)) !== null) {
    if (m[1]) out.push(m[1])
  }
  return out
}

/** 复配添加剂括号子项提取(例:复配膨松剂(碳酸氢钠,焦磷酸二氢二钠)) */
function resolveCompoundSubItems(raw) {
  const subs = []
  if (!raw) return subs
  for (let content of bracketContents(toHalfWidth(raw))) {
    if (!content.trim()) continue
    const incl = content.indexOf('包括')
    if (incl >= 0) content = content.slice(incl + 2)
    for (const part of splitAtoms(content)) {
      const sub = lookup(part)
      subs.push(sub ? toVO(sub, part) : unknownVO(part))
    }
  }
  return subs
}

/** OCR 原始配料 → 原子物质列表 */
function splitRawIntoAtoms(raw) {
  if (!raw) return []
  const h = toHalfWidth(raw)
  for (const content of bracketContents(h)) {
    const idx = content.indexOf('包括')
    if (idx >= 0) {
      const atoms = splitAtoms(content.slice(idx + 2))
      if (atoms.length) return atoms
    }
  }
  const stripped = iterativelyStripBrackets(h).trim()
  if (!stripped) return []
  if (COMPOUND_SPLIT.test(stripped)) {
    const atoms = splitAtoms(stripped)
    if (atoms.length) return atoms
  }
  return [stripped]
}

// ─── 对外 API(与后端接口语义一致) ─────────────────────────

/** 单个添加剂详情(速查弹窗用) */
export function getAdditiveInfo(additiveName) {
  const normalized = normalize(additiveName)
  const hit = lookup(normalized)
  return hit ? toVO(hit, normalized) : unknownVO(normalized)
}

/** 批量匹配配料中的添加剂,返回 { 名称: 详情 } */
export function batchMatchAdditives(ingredients) {
  const result = {}
  if (!ingredients || !ingredients.length) return result
  for (const ingredient of ingredients) {
    const normalized = normalize(ingredient)
    if (!normalized) continue
    const found = lookup(normalized)
    if (found) {
      result[normalized] = toVO(found, normalized)
      continue
    }
    if (looksLikeAdditive(normalized)) {
      result[normalized] = unknownVO(normalized)
    }
  }
  return result
}

/** 配料三分类:主料 / 辅料 / 添加剂(与后端 classify 优先级一致) */
export function classifyIngredients(ingredients) {
  const vo = { mainIngredients: [], auxiliaryIngredients: [], additives: [], items: [] }
  if (!ingredients) return vo

  ingredients.forEach((raw, i) => {
    if (raw == null) return
    const rank = i + 1
    const preNormalized = normalize(raw)
    if (!preNormalized) return

    if (isCompoundAdditive(raw, preNormalized) || hasAdditivePrefix(raw)) {
      const subItems = resolveCompoundSubItems(raw)
      if (!subItems.length) {
        vo.additives.push(unknownVO(preNormalized, '复合添加剂'))
        vo.items.push({ raw, normalizedName: preNormalized, group: 'ADDITIVE', rank })
      } else {
        for (const sub of subItems) {
          vo.additives.push(sub)
          vo.items.push({ raw, normalizedName: sub.name, group: 'ADDITIVE', rank })
        }
      }
      return
    }

    for (const atom of splitRawIntoAtoms(raw)) {
      classifyAtom(vo, raw, atom, rank)
    }
  })
  deduplicate(vo)
  return vo
}

function classifyAtom(vo, raw, atom, rank) {
  const normalized = normalize(atom)
  if (!normalized) return

  const found = lookup(normalized)
  if (found) {
    vo.additives.push(toVO(found, normalized))
    vo.items.push({ raw, normalizedName: normalized, group: 'ADDITIVE', rank })
    return
  }
  if (matchesAuxiliary(normalized)) {
    vo.mainIngredients.push(normalized)
    vo.items.push({ raw, normalizedName: normalized, group: 'MAIN', rank })
    return
  }
  vo.auxiliaryIngredients.push(normalized)
  vo.items.push({ raw, normalizedName: normalized, group: 'AUXILIARY', rank })
}

const dedupKey = (s) => (s || '').replace(/\s+/g, '').toLowerCase()

function deduplicate(vo) {
  const dedupBy = (arr, keyFn) => {
    const seen = new Set()
    return arr.filter((x) => {
      const k = keyFn(x)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }
  vo.additives = dedupBy(vo.additives, (a) => dedupKey(a.name))
  vo.auxiliaryIngredients = dedupBy(vo.auxiliaryIngredients, dedupKey)
  vo.mainIngredients = dedupBy(vo.mainIngredients, dedupKey)
  vo.items = dedupBy(vo.items, (it) => it.group + '|' + dedupKey(it.normalizedName))
}

/** GB 2760 限量明细(3.4MB 数据按需加载,首次调用约 1-2 秒) */
let _limitsPromise = null
export async function getLimitsByName(additiveName) {
  const hit = lookup(normalize(additiveName))
  if (!hit) return []
  if (!_limitsPromise) {
    _limitsPromise = import('./data/additiveLimits.json').then((m) => m.default)
  }
  const limits = await _limitsPromise
  return limits
    .filter((l) => l.a === hit.id)
    .map((l) => ({
      foodCategoryCode: l.c,
      foodCategoryName: l.n,
      maxDosage: l.d,
      functionInUse: l.f,
    }))
}
