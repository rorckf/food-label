/**
 * 致敏原结构化提取(本地版) —— 1:1 移植自后端 AllergenService.java
 * 依据 GB 7718-2011 八大类 + 麸质单列;关键词保守,宁缺毋滥。
 */

const ALLERGEN_KEYWORDS = [
  ['麸质', ['麸质', '小麦', '大麦', '黑麦', '燕麦', '面粉', '麦片', '麦芽', '麦胚']],
  ['蛋', ['鸡蛋', '蛋液', '蛋白', '蛋黄', '蛋粉', '全蛋', '蛋类']],
  ['乳', ['牛奶', '鲜奶', '奶粉', '乳粉', '乳清', '奶油', '黄油', '奶酪', '干酪',
    '炼乳', '乳脂', '乳制品', '乳球', '巴氏杀菌乳']],
  ['大豆', ['大豆', '黄豆', '豆粉', '豆浆', '豆制品', '腐竹', '大豆蛋白', '大豆油',
    '豆瓣', '酱油']],
  ['花生', ['花生']],
  ['坚果', ['核桃', '杏仁', '腰果', '榛子', '开心果', '夏威夷果', '碧根果', '巴旦木',
    '松子', '栗子', '山核桃', '树坚果']],
  ['甲壳类', ['虾', '蟹', '龙虾', '蟹黄', '蟹肉', '甲壳']],
  ['鱼', ['鱼肉', '鱼粉', '鳕鱼', '三文鱼', '金枪鱼', '带鱼', '银鲈鱼',
    '沙丁鱼', '鱼类', '鱼皮', '鱼油']],
  ['芝麻', ['芝麻', '芝麻油', '芝麻酱']],
]

const CROSS_CONTAM_HINTS = ['本产品线', '同生产线', '本生产线', '可能含', '也加工']

function scan(text, sink) {
  if (!text || !text.trim()) return
  for (const [label, keywords] of ALLERGEN_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) sink.add(label)
  }
}

/**
 * 抽取致敏原集合。
 * @param {string[]} ingredients 配料列表(可空)
 * @param {string|null} allergenText 标签致敏原段落原文(可空)
 * @returns {{contains: string[], mayContain: string[]}}
 */
export function extractAllergens(ingredients, allergenText) {
  const contains = new Set()
  const mayContain = new Set()

  if (ingredients && ingredients.length) {
    scan(ingredients.join(' '), contains)
  }

  if (allergenText && allergenText.trim()) {
    let splitIdx = -1
    for (const hint of CROSS_CONTAM_HINTS) {
      const i = allergenText.indexOf(hint)
      if (i >= 0 && (splitIdx === -1 || i < splitIdx)) splitIdx = i
    }
    if (splitIdx === -1) {
      scan(allergenText, contains)
    } else {
      scan(allergenText.slice(0, splitIdx), contains)
      scan(allergenText.slice(splitIdx), mayContain)
    }
  }

  for (const x of contains) mayContain.delete(x)
  return { contains: [...contains], mayContain: [...mayContain] }
}
