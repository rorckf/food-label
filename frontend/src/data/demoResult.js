/**
 * 示例识别报告:给"还没有标签照片"的新用户预览产品能力。
 * 结构与 RecognitionResultVO 完全一致;id 为非数字,Result 页自动隐藏收藏/删除。
 */
export const DEMO_RESULT_ID = 'demo-sample'

export const DEMO_RESULT = {
  id: DEMO_RESULT_ID,
  productName: '草莓味夹心饼干(示例)',
  category: '烘焙',
  netContent: '100g',
  manufacturer: '某某食品有限公司',
  licenseNumber: 'SC11331021500000',
  standard: 'GB/T 20980',
  origin: '浙江省 杭州市',
  productionDate: '2026-06-01',
  shelfLife: '12个月',
  storage: '常温避光,开封后尽快食用',
  contact: '400-000-0000',
  imageUrl: null,
  nutrition: {
    energy: 2100,
    protein: 5.5,
    fat: 22,
    carbohydrate: 68,
    sodium: 280,
  },
  nutritionBasis: '每100g',
  ingredients: [
    '小麦粉', '白砂糖', '精炼植物油', '草莓果酱(25%)', '鸡蛋', '食用盐',
    '复配膨松剂(碳酸氢钠、焦磷酸二氢二钠)', '山梨酸钾', '柠檬酸', '食用香精',
  ],
  additiveMap: {
    '山梨酸钾': {
      name: '山梨酸钾',
      category: '防腐剂、抗氧化剂',
      description: '广谱防腐剂,安全性较高,可被人体代谢为二氧化碳和水,被认为是较安全的防腐剂之一。',
      usageScope: '—、茶、酱油、糕点、食醋、蜜饯、月饼、果冻等',
      maxDosage: '0.075~1.5 g/kg',
      diseaseContraindication: '无明显禁忌人群,过敏体质慎用',
    },
    '柠檬酸': {
      name: '柠檬酸',
      category: '酸度调节剂、抗氧化剂',
      description: '广泛存在于柑橘类水果中,是人体三羧酸循环的中间产物,可被完全代谢为二氧化碳和水。JECFA认定ADI\'无需规定\',合规剂量下安全。长期大量摄入可能腐蚀牙釉质或刺激胃黏膜。',
      usageScope: '—、茶、酒类、皮蛋、月饼、花粉、水果、果泥等',
      maxDosage: '部分类别按生产需要适量使用',
      diseaseContraindication: '胃溃疡、胃酸过多、龋齿患者慎用',
    },
    '碳酸氢钠': {
      name: '碳酸氢钠',
      category: '膨松剂',
      description: '即小苏打,常用膨松剂,受热分解为碳酸钠、二氧化碳和水,常规用量下安全性高。',
      usageScope: '糕点、饼干、面包等焙烤食品',
      maxDosage: '部分类别按生产需要适量使用',
      diseaseContraindication: '高血压、限钠饮食者慎用',
    },
  },
  healthTips: [
    { name: '能量', percentage: 25, level: '适中', text: '能量适中，正常食用即可' },
    { name: '蛋白质', percentage: 9.2, level: '偏低', text: '蛋白质含量较低，可搭配高蛋白食物一同食用' },
    { name: '脂肪', percentage: 36.7, level: '偏高', text: '脂肪含量偏高，建议适量食用，避免增加心血管负担' },
    { name: '碳水化合物', percentage: 22.7, level: '适中', text: '碳水化合物含量适中' },
    { name: '钠', percentage: 14, level: '偏低', text: '钠含量较低，适合低钠饮食人群' },
    { name: '添加剂禁忌', percentage: null, level: '偏高', text: '含柠檬酸，胃溃疡、胃酸过多、龋齿患者慎用人群不建议食用' },
  ],
  fixFlag: { energy: 'raw', protein: 'raw', fat: 'raw', carbohydrate: 'raw', sodium: 'raw' },
  shelfLifeStatus: {
    status: 'VALID',
    productionDate: '2026-06-01',
    expiryDate: '2027-06-01',
    daysRemaining: 354,
    message: '还有 354 天到期',
  },
  allergenText: '含小麦、鸡蛋。本生产线也加工含花生、大豆的产品。',
  allergens: { contains: ['麸质', '蛋'], mayContain: ['花生', '大豆'] },
  categoryFromStandard: '烘焙',
  healthScore: 83,
}

/** 写入 scanResults 缓存并返回可跳转的路由路径 */
export function seedDemoResult() {
  try {
    const store = JSON.parse(localStorage.getItem('scanResults') || '{}')
    store[DEMO_RESULT_ID] = { ...DEMO_RESULT, scanTime: new Date().toISOString() }
    localStorage.setItem('scanResults', JSON.stringify(store))
  } catch { /* 容量异常时忽略 */ }
  return `/result/${DEMO_RESULT_ID}`
}
