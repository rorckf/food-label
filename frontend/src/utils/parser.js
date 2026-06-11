/**
 * 解析净含量，提取数值
 * @param {string} netWeight - 净含量文本
 * @returns {number} - 每100g的比例
 */
export const parseNetWeight = (netWeight) => {
  if (!netWeight || netWeight === '无法识别净含量') return 0.3
  
  // 尝试提取数字和单位
  const match = netWeight.match(/(\d+(?:\.\d+)?)\s*(g|克|kg|千克|ml|毫升|L|升)/)
  if (match) {
    const value = parseFloat(match[1])
    const unit = match[2]
    
    // 转换为克
    if (unit === 'g' || unit === '克') {
      return value / 100 // 转换为每100g的比例
    } else if (unit === 'kg' || unit === '千克') {
      return value * 10 // 转换为每100g的比例
    } else if (unit === 'ml' || unit === '毫升') {
      return value / 100 // 假设密度为1g/ml
    } else if (unit === 'L' || unit === '升') {
      return value * 10 // 假设密度为1g/ml
    }
  }
  
  // 默认值
  return 0.3
}

/**
 * 文本预处理，清理OCR识别错误
 * @param {string} text - 原始文本
 * @returns {string} - 清理后的文本
 */
export const preprocessText = (text) => {
  if (!text) return ''
  
  let cleanedText = text
  
  // 1. 清理重复的标点符号
  cleanedText = cleanedText.replace(/([、，；,;])\1+/g, '$1')
  
  // 2. 清理空格和换行
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim()
  
  // 3. 修复常见的OCR错误
  const ocrFixes = {
    '\u00a0': ' ', // 不间断空格
    '\u3000': ' ', // 全角空格
    '。': '', // 移除多余的句号
    '．': '.', // 全角点号
    '，': '，', // 确保中文逗号
    '、': '、', // 确保中文顿号
    '；': '；', // 确保中文分号
  }
  
  for (const [oldChar, newChar] of Object.entries(ocrFixes)) {
    cleanedText = cleanedText.replace(new RegExp(oldChar, 'g'), newChar)
  }

  // 3.5 词级 OCR 错字修正表（基于真实标签样本归纳）。
  //     主要纠正"油"被识别成"抽"、添加剂别名归一等高频错误。
  //     放在单字 fix 之后避免互相干扰，按声明顺序应用。
  const wordFixes = [
    // "油" 被识别为 "抽" 系列（黄油/含油/调味油/食用油/植物油等）
    [/黄抽/g, '黄油'],
    [/含抽/g, '含油'],
    [/调味抽/g, '调味油'],
    [/食用抽/g, '食用油'],
    [/植物抽/g, '植物油'],
    [/酱抽/g, '酱油'],
    [/起酥抽/g, '起酥油'],
    [/精炼抽/g, '精炼油'],
    [/猪抽/g, '猪油'],
    [/奶抽/g, '奶油'],
    [/稀奶抽/g, '稀奶油'],
    // 全脂/脱脂 形近误识
    [/全胎/g, '全脂'],
    [/脱胎/g, '脱脂'],
    // 添加剂别名归一（吐温 → 聚山梨酯，便于后端知识库命中）
    [/吐温八十/g, '聚氧乙烯山梨醇酐单油酸酯（吐温80）'],
    [/吐温六十/g, '聚氧乙烯山梨醇酐单硬脂酸酯（吐温60）'],
    [/吐温二十/g, '聚氧乙烯山梨醇酐单月桂酸酯（吐温20）'],
    // 明胶/吉利丁互通
    [/吉利丁片?/g, '明胶'],
    // 配料表常见印刷分隔符
    [/[•·]/g, '、'],
  ]

  for (const [pattern, replacement] of wordFixes) {
    cleanedText = cleanedText.replace(pattern, replacement)
  }

  // 4. 清理重复的配料名称前缀
  cleanedText = cleanedText.replace(/配料：|配料表：|成分：/g, '')
  
  return cleanedText
}

/**
 * 解析复合配料
 * @param {string} text - 配料文本
 * @returns {Array} - 解析后的配料结构
 */
export const parseCompoundIngredients = (text) => {
  if (!text) return []
  
  const ingredients = []
  let currentPosition = 0
  const length = text.length
  
  while (currentPosition < length) {
    // 查找复合配料的开始
    const bracketStart = text.indexOf('（', currentPosition)
    
    if (bracketStart === -1) {
      // 没有更多复合配料，处理剩余文本
      const remainingText = text.substring(currentPosition).trim()
      if (remainingText) {
        ingredients.push({ name: remainingText, children: [] })
      }
      break
    }
    
    // 提取主配料名称
    const mainIngredient = text.substring(currentPosition, bracketStart).trim()
    if (mainIngredient) {
      // 找到匹配的闭合括号
      let bracketCount = 1
      let bracketEnd = bracketStart + 1
      
      while (bracketEnd < length && bracketCount > 0) {
        if (text[bracketEnd] === '（') bracketCount++
        if (text[bracketEnd] === '）') bracketCount--
        bracketEnd++
      }
      
      if (bracketCount === 0) {
        // 提取括号内的内容
        const innerContent = text.substring(bracketStart + 1, bracketEnd - 1).trim()
        
        // 递归解析括号内的内容
        const children = parseCompoundIngredients(innerContent)
        
        ingredients.push({ name: mainIngredient, children })
        currentPosition = bracketEnd
      } else {
        // 括号不匹配，作为普通配料处理
        ingredients.push({ name: text.substring(currentPosition).trim(), children: [] })
        break
      }
    } else {
      currentPosition = bracketStart + 1
    }
  }
  
  return ingredients
}

/**
 * 合并重复配料
 * @param {Array} ingredients - 配料列表
 * @returns {Array} - 合并后的配料列表
 */
export const mergeDuplicateIngredients = (ingredients) => {
  if (!ingredients || ingredients.length === 0) return []
  
  // 配料别名映射
  const ingredientAliases = {
    '白砂糖': ['白糖', '砂糖', '蔗糖'],
    '食用盐': ['盐', '精盐', '食盐'],
    '水': ['生活饮用水', '纯净水', '饮用水'],
    '小麦粉': ['面粉', '小麦面粉'],
    '鸡蛋': ['鲜鸡蛋', '鸡蛋液'],
    '牛奶': ['全脂牛奶', '鲜牛奶', '纯牛奶'],
  }
  
  const merged = new Map()
  
  ingredients.forEach(ingredient => {
    let normalizedName = ingredient.name
    
    // 查找标准名称
    for (const [standardName, aliases] of Object.entries(ingredientAliases)) {
      if (aliases.includes(ingredient.name) || ingredient.name.includes(standardName)) {
        normalizedName = standardName
        break
      }
    }
    
    if (merged.has(normalizedName)) {
      // 合并已存在的配料
      const existing = merged.get(normalizedName)
      // 保留更详细的信息
      if (ingredient.children && ingredient.children.length > 0) {
        existing.children = ingredient.children
      }
      if (ingredient.percentage) {
        existing.percentage = ingredient.percentage
      }
    } else {
      merged.set(normalizedName, { ...ingredient, name: normalizedName })
    }
  })
  
  return Array.from(merged.values())
}

/**
 * 解析配料表文本
 * @param {string} ingredientsText - 配料表文本
 * @returns {Array} - 解析后的配料列表
 */
export const parseIngredientsText = (ingredientsText) => {
  if (!ingredientsText) return []
  
  // 1. 文本预处理
  let cleanedText = preprocessText(ingredientsText)
  
  // 2. 按顿号、逗号或分号分割
  const separators = /[、，；,;]/
  const items = cleanedText.split(separators).filter(item => item.trim())
  
  // 3. 解析每个配料项
  const parsedItems = items.map(item => {
    const trimmedItem = item.trim()
    
    // 尝试提取占比信息
    let name = trimmedItem
    let percentage = ''
    let isAdditive = false
    
    // 检查是否包含添加剂关键词
    const additiveKeywords = ['食品添加剂', '防腐剂', '增稠剂', '色素', '甜味剂', '酸度调节剂', '抗氧化剂', '乳化剂', '增味剂']
    isAdditive = additiveKeywords.some(keyword => trimmedItem.includes(keyword))
    
    // 尝试提取百分比或占比信息
    const percentageMatch = trimmedItem.match(/([≥≤<>≈]?\s*\d+(?:\.\d+)?\s*%)/)
    if (percentageMatch) {
      percentage = percentageMatch[1]
      name = trimmedItem.replace(percentageMatch[0], '').trim()
    }
    
    // 4. 解析复合配料
    const compoundParts = parseCompoundIngredients(name)
    
    return {
      name: name || trimmedItem,
      percentage: percentage,
      isAdditive: isAdditive,
      children: compoundParts.length > 0 ? compoundParts : []
    }
  })
  
  // 5. 合并重复配料
  const mergedItems = mergeDuplicateIngredients(parsedItems)
  
  return mergedItems
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} - 格式化后的文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取风险类型
 * @param {number} level - 风险等级
 * @returns {string} - 风险类型
 */
export const getRiskType = (level) => {
  const types = ['success', 'warning', 'danger']
  return types[level] || 'info'
}

/**
 * 获取风险文本
 * @param {number} level - 风险等级
 * @returns {string} - 风险文本
 */
export const getRiskText = (level) => {
  const texts = ['安全', '注意', '避免']
  return texts[level] || '未知'
}

/**
 * 评估OCR文本质量
 * @param {string} text - OCR文本
 * @returns {object} - 质量评估结果
 */
export const evaluateOcrQuality = (text) => {
  if (!text) {
    return { score: 0, level: 'poor', message: '未识别到文本，请上传更清晰的图片' }
  }
  
  const length = text.length
  const hasValidContent = text.includes('配料') || text.includes('成分') || text.includes('添加剂')
  const hasSufficientLength = length > 20
  
  let score = 0
  if (hasValidContent) score += 50
  if (hasSufficientLength) score += 30
  if (length > 50) score += 20
  
  let level = 'good'
  let message = '文本质量良好'
  
  if (score < 30) {
    level = 'poor'
    message = '文本质量较差，可能影响解析效果，请上传更清晰的图片'
  } else if (score < 70) {
    level = 'fair'
    message = '文本质量一般，可能存在解析误差'
  }
  
  return { score, level, message }
}

/**
 * 生成解析说明
 * @param {Array} ingredients - 解析后的配料列表
 * @returns {Array} - 解析说明列表
 */
export const generateParsingExplanations = (ingredients) => {
  const explanations = []
  
  // 统计复合配料数量
  const compoundIngredients = ingredients.filter(item => item.children && item.children.length > 0)
  if (compoundIngredients.length > 0) {
    explanations.push({
      type: 'compound',
      title: '复合配料说明',
      content: `共识别到 ${compoundIngredients.length} 种复合配料，如 ${compoundIngredients.slice(0, 2).map(item => item.name).join('、')} 等。复合配料是指由多种原料组成的配料，点击展开可查看详细成分。`
    })
  }
  
  // 统计添加剂数量
  const additives = ingredients.filter(item => item.isAdditive)
  if (additives.length > 0) {
    explanations.push({
      type: 'additive',
      title: '添加剂说明',
      content: `共识别到 ${additives.length} 种添加剂，已按风险等级进行标记。点击添加剂名称可查看国标详细信息。`
    })
  }
  
  // 统计重复配料合并
  const duplicateCount = ingredients.filter(item => item.originalName && item.originalName !== item.name).length
  if (duplicateCount > 0) {
    explanations.push({
      type: 'duplicate',
      title: '重复配料合并',
      content: `系统自动合并了 ${duplicateCount} 组重复配料，如将"白糖"和"白砂糖"合并为"白砂糖"，提高了配料表的可读性。`
    })
  }
  
  return explanations
}