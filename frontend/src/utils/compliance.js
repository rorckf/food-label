// GB 7718-2025 食品标签合规性校验模块

/**
 * 校验配料表是否符合GB 7718的标注要求
 * @param {Object} labelData - 标签数据
 * @returns {Object} 合规性报告
 */
export function validateIngredientsCompliance(labelData) {
  const report = {
    compliant: [],
    nonCompliant: [],
    suggestions: []
  }
  
  const { ingredientsText, productName, netWeight, productionDate, shelfLife, manufacturer } = labelData
  
  // 1. 检查配料表是否存在
  if (!ingredientsText || ingredientsText.trim() === '') {
    report.nonCompliant.push('缺少配料表')
    report.suggestions.push('添加完整的配料表')
  } else {
    report.compliant.push('配料表存在')
    
    // 2. 检查配料排序
    const sortingCompliance = checkIngredientSorting(ingredientsText)
    if (sortingCompliance.compliant) {
      report.compliant.push('配料排序符合要求')
    } else {
      report.nonCompliant.push('配料排序不符合要求')
      report.suggestions.push('按加入量递减顺序排列配料')
    }
    
    // 3. 检查复合配料标注
    const compositeCompliance = checkCompositeIngredients(ingredientsText)
    if (compositeCompliance.compliant) {
      report.compliant.push('复合配料标注符合要求')
    } else {
      report.nonCompliant.push('复合配料标注不符合要求')
      report.suggestions.push('复合配料中加入量超过25%的原始配料应标注')
    }
    
    // 4. 检查添加剂标注
    const additiveCompliance = checkAdditiveLabeling(ingredientsText)
    if (additiveCompliance.compliant) {
      report.compliant.push('添加剂标注符合要求')
    } else {
      report.nonCompliant.push('添加剂标注不符合要求')
      report.suggestions.push('添加剂应按功能类别标注')
    }
  }
  
  // 5. 检查其他必要信息
  if (!productName || productName.trim() === '') {
    report.nonCompliant.push('缺少产品名称')
    report.suggestions.push('添加产品名称')
  } else {
    report.compliant.push('产品名称存在')
  }
  
  if (!netWeight || netWeight.trim() === '') {
    report.nonCompliant.push('缺少净含量')
    report.suggestions.push('添加净含量')
  } else {
    report.compliant.push('净含量存在')
  }
  
  if (!productionDate || productionDate.trim() === '') {
    report.nonCompliant.push('缺少生产日期')
    report.suggestions.push('添加生产日期')
  } else {
    report.compliant.push('生产日期存在')
  }
  
  if (!shelfLife || shelfLife.trim() === '') {
    report.nonCompliant.push('缺少保质期')
    report.suggestions.push('添加保质期')
  } else {
    report.compliant.push('保质期存在')
  }
  
  if (!manufacturer || manufacturer.trim() === '') {
    report.nonCompliant.push('缺少生产者信息')
    report.suggestions.push('添加生产者信息')
  } else {
    report.compliant.push('生产者信息存在')
  }
  
  return report
}

/**
 * 检查配料排序是否符合GB 7718要求
 * @param {string} ingredientsText - 配料表文本
 * @returns {Object} 排序检查结果
 */
function checkIngredientSorting(ingredientsText) {
  // 简化检查：主要配料是否在前
  const mainIngredients = ['水', '面粉', '小麦粉', '大米', '白砂糖', '植物油']
  const ingredients = ingredientsText.split(/[，、；,;]/).filter(item => item.trim())
  
  // 检查前3位是否包含主要配料
  const firstThree = ingredients.slice(0, 3)
  const mainInFirstThree = firstThree.some(item => 
    mainIngredients.some(main => item.includes(main))
  )
  
  return {
    compliant: mainInFirstThree,
    details: {
      firstThree: firstThree,
      mainIngredients: mainIngredients
    }
  }
}

/**
 * 检查复合配料标注是否符合GB 7718要求
 * @param {string} ingredientsText - 配料表文本
 * @returns {Object} 复合配料检查结果
 */
function checkCompositeIngredients(ingredientsText) {
  // 检查是否有复合配料标注
  const hasComposite = ingredientsText.includes('【') || ingredientsText.includes('(') || ingredientsText.includes('[')
  
  return {
    compliant: hasComposite,
    details: {
      hasComposite: hasComposite
    }
  }
}

/**
 * 检查添加剂标注是否符合GB 7718要求
 * @param {string} ingredientsText - 配料表文本
 * @returns {Object} 添加剂标注检查结果
 */
function checkAdditiveLabeling(ingredientsText) {
  // 检查是否标注了食品添加剂
  const hasAdditivesLabel = ingredientsText.includes('食品添加剂')
  
  return {
    compliant: hasAdditivesLabel,
    details: {
      hasAdditivesLabel: hasAdditivesLabel
    }
  }
}

/**
 * 生成完整的合规性报告
 * @param {Object} labelData - 标签数据
 * @param {Array} additives - 检测到的添加剂
 * @returns {Object} 完整的合规性报告
 */
export function generateComplianceReport(labelData, additives) {
  const basicCompliance = validateIngredientsCompliance(labelData)
  
  // 添加剂合规性
  const additiveCompliance = {
    total: additives.length,
    compliant: 0,
    nonCompliant: 0,
    details: []
  }
  
  additives.forEach(additive => {
    const isCompliant = additive.usageScope.some(scope => scope.includes('糕点')) && 
                      !additive.禁忌?.includes('糕点类食品禁用')
    
    if (isCompliant) {
      additiveCompliance.compliant++
    } else {
      additiveCompliance.nonCompliant++
    }
    
    additiveCompliance.details.push({
      name: additive.name,
      function: additive.function,
      compliant: isCompliant,
      reason: isCompliant ? '符合要求' : '不符合糕点类食品使用要求'
    })
  })
  
  return {
    basic: basicCompliance,
    additives: additiveCompliance,
    overall: {
      compliant: basicCompliance.compliant.length + additiveCompliance.compliant,
      nonCompliant: basicCompliance.nonCompliant.length + additiveCompliance.nonCompliant,
      complianceRate: ((basicCompliance.compliant.length + additiveCompliance.compliant) / 
                     (basicCompliance.compliant.length + basicCompliance.nonCompliant.length + 
                      additiveCompliance.total)) * 100
    }
  }
}