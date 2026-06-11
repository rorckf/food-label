// GB 2760-2024 食品添加剂数据库
export const additiveDatabase = {
  // 防腐剂
  '山梨酸钾': {
    insNumber: '202',
    cnsNumber: '17.003',
    function: '防腐剂',
    usageScope: ['糕点', '面包', '饼干', '糖果', '饮料等'],
    maxUsage: '1.0g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '苯甲酸钠': {
    insNumber: '211',
    cnsNumber: '17.001',
    function: '防腐剂',
    usageScope: ['糕点', '面包', '饼干', '饮料等'],
    maxUsage: '0.5g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '丙酸钙': {
    insNumber: '282',
    cnsNumber: '17.005',
    function: '防腐剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '2.5g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '脱氢乙酸钠': {
    insNumber: '265',
    cnsNumber: '17.009',
    function: '防腐剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '0.5g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '对羟基苯甲酸酯类': {
    insNumber: '214-219',
    cnsNumber: '17.030',
    function: '防腐剂',
    usageScope: ['糕点', '饮料', '调味品'],
    maxUsage: '0.25g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '亚硝酸钠': {
    insNumber: '250',
    cnsNumber: '17.002',
    function: '防腐剂',
    usageScope: ['肉制品'],
    maxUsage: '0.15g/kg',
    riskLevel: '高风险',
    禁忌: '糕点类食品禁用'
  },
  '硝酸钠': {
    insNumber: '251',
    cnsNumber: '17.004',
    function: '防腐剂',
    usageScope: ['肉制品'],
    maxUsage: '0.5g/kg',
    riskLevel: '高风险',
    禁忌: '糕点类食品禁用'
  },
  
  // 甜味剂
  '阿斯巴甜': {
    insNumber: '951',
    cnsNumber: '19.004',
    function: '甜味剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.6g/kg',
    riskLevel: '需注意',
    禁忌: '苯丙酮尿症患者禁用'
  },
  '糖精钠': {
    insNumber: '954',
    cnsNumber: '19.001',
    function: '甜味剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.15g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '安赛蜜': {
    insNumber: '950',
    cnsNumber: '19.003',
    function: '甜味剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.3g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '三氯蔗糖': {
    insNumber: '955',
    cnsNumber: '19.016',
    function: '甜味剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.25g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '甜蜜素': {
    insNumber: '952',
    cnsNumber: '19.002',
    function: '甜味剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.65g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '纽甜': {
    insNumber: '961',
    cnsNumber: '19.013',
    function: '甜味剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.015g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  
  // 着色剂
  '柠檬黄': {
    insNumber: '102',
    cnsNumber: '08.005',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.1g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  '日落黄': {
    insNumber: '110',
    cnsNumber: '08.006',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.1g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  '胭脂红': {
    insNumber: '124',
    cnsNumber: '08.002',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.05g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  '诱惑红': {
    insNumber: '129',
    cnsNumber: '08.012',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.1g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  '亮蓝': {
    insNumber: '133',
    cnsNumber: '08.011',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.025g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  '靛蓝': {
    insNumber: '132',
    cnsNumber: '08.007',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '0.1g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  '焦糖色': {
    insNumber: '150a-d',
    cnsNumber: '08.103',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  'β-胡萝卜素': {
    insNumber: '160a',
    cnsNumber: '08.010',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  
  // 增味剂
  '谷氨酸钠': {
    insNumber: '621',
    cnsNumber: '12.001',
    function: '增味剂',
    usageScope: ['糕点', '调味品', '方便食品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  "5'-呈味核苷酸二钠": {
    insNumber: '631',
    cnsNumber: '12.003',
    function: '增味剂',
    usageScope: ['糕点', '调味品', '方便食品'],
    maxUsage: '0.5g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '琥珀酸二钠': {
    insNumber: '623',
    cnsNumber: '12.005',
    function: '增味剂',
    usageScope: ['糕点', '调味品', '方便食品'],
    maxUsage: '0.6g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '甘氨酸': {
    insNumber: '640',
    cnsNumber: '12.007',
    function: '增味剂',
    usageScope: ['糕点', '调味品', '方便食品'],
    maxUsage: '1.0g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  
  // 酸度调节剂
  '柠檬酸': {
    insNumber: '330',
    cnsNumber: '01.101',
    function: '酸度调节剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '乳酸': {
    insNumber: '270',
    cnsNumber: '01.102',
    function: '酸度调节剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '苹果酸': {
    insNumber: '334',
    cnsNumber: '01.104',
    function: '酸度调节剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '磷酸': {
    insNumber: '338',
    cnsNumber: '01.106',
    function: '酸度调节剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '需注意',
    禁忌: '过量使用可能影响钙吸收'
  },
  '酒石酸': {
    insNumber: '334',
    cnsNumber: '01.103',
    function: '酸度调节剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '碳酸钠': {
    insNumber: '500i',
    cnsNumber: '01.301',
    function: '酸度调节剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '碳酸氢钠': {
    insNumber: '500ii',
    cnsNumber: '01.302',
    function: '酸度调节剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  
  // 抗氧化剂
  '丁基羟基茴香醚': {
    insNumber: '320',
    cnsNumber: '04.001',
    function: '抗氧化剂',
    usageScope: ['油脂', '油炸食品', '方便食品'],
    maxUsage: '0.2g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '二丁基羟基甲苯': {
    insNumber: '321',
    cnsNumber: '04.002',
    function: '抗氧化剂',
    usageScope: ['油脂', '油炸食品', '方便食品'],
    maxUsage: '0.2g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '没食子酸丙酯': {
    insNumber: '310',
    cnsNumber: '04.003',
    function: '抗氧化剂',
    usageScope: ['油脂', '油炸食品', '方便食品'],
    maxUsage: '0.1g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '特丁基对苯二酚': {
    insNumber: '319',
    cnsNumber: '04.007',
    function: '抗氧化剂',
    usageScope: ['油脂', '油炸食品', '方便食品'],
    maxUsage: '0.2g/kg',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品禁用'
  },
  '抗坏血酸': {
    insNumber: '300',
    cnsNumber: '04.014',
    function: '抗氧化剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  
  // 乳化剂
  '单硬脂酸甘油酯': {
    insNumber: '471',
    cnsNumber: '10.006',
    function: '乳化剂',
    usageScope: ['糕点', '面包', '乳制品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '蔗糖脂肪酸酯': {
    insNumber: '473',
    cnsNumber: '10.001',
    function: '乳化剂',
    usageScope: ['糕点', '面包', '乳制品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '山梨醇酐单硬脂酸酯': {
    insNumber: '491',
    cnsNumber: '10.003',
    function: '乳化剂',
    usageScope: ['糕点', '面包', '乳制品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '聚甘油脂肪酸酯': {
    insNumber: '475',
    cnsNumber: '10.024',
    function: '乳化剂',
    usageScope: ['糕点', '面包', '乳制品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  
  // 增稠剂
  '羧甲基纤维素钠': {
    insNumber: '466',
    cnsNumber: '20.003',
    function: '增稠剂',
    usageScope: ['糕点', '饮料', '酱料'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '黄原胶': {
    insNumber: '415',
    cnsNumber: '20.009',
    function: '增稠剂',
    usageScope: ['糕点', '饮料', '酱料'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '卡拉胶': {
    insNumber: '407',
    cnsNumber: '20.008',
    function: '增稠剂',
    usageScope: ['糕点', '饮料', '酱料'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '果胶': {
    insNumber: '440',
    cnsNumber: '20.006',
    function: '增稠剂',
    usageScope: ['糕点', '饮料', '酱料'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '阿拉伯胶': {
    insNumber: '414',
    cnsNumber: '20.005',
    function: '增稠剂',
    usageScope: ['糕点', '饮料', '酱料'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '明胶': {
    insNumber: '428',
    cnsNumber: '20.007',
    function: '增稠剂',
    usageScope: ['糕点', '糖果', '乳制品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  
  // 膨松剂
  '碳酸氢钠': {
    insNumber: '500ii',
    cnsNumber: '06.001',
    function: '膨松剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '碳酸氢铵': {
    insNumber: '503ii',
    cnsNumber: '06.002',
    function: '膨松剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '泡打粉': {
    insNumber: '500ii+541+450i',
    cnsNumber: '06.003',
    function: '膨松剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '明矾': {
    insNumber: '523',
    cnsNumber: '06.005',
    function: '膨松剂',
    usageScope: ['油炸面制品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '高风险',
    禁忌: '糕点类食品禁用'
  },
  
  // 稳定剂
  '三聚磷酸钠': {
    insNumber: '451i',
    cnsNumber: '15.003',
    function: '稳定剂',
    usageScope: ['饮料', '乳制品', '肉制品'],
    maxUsage: '5.0g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  '六偏磷酸钠': {
    insNumber: '452i',
    cnsNumber: '15.002',
    function: '稳定剂',
    usageScope: ['饮料', '乳制品', '肉制品'],
    maxUsage: '5.0g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  '焦磷酸钠': {
    insNumber: '450i',
    cnsNumber: '15.001',
    function: '稳定剂',
    usageScope: ['饮料', '乳制品', '肉制品'],
    maxUsage: '5.0g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  
  // 其他添加剂
  '乙基麦芽酚': {
    insNumber: '637',
    cnsNumber: '12.010',
    function: '增味剂',
    usageScope: ['糕点', '肉制品', '调味品'],
    maxUsage: '0.05g/kg',
    riskLevel: '需注意',
    禁忌: '无特殊禁忌'
  },
  'D-异抗坏血酸钠': {
    insNumber: '316',
    cnsNumber: '04.004',
    function: '抗氧化剂',
    usageScope: ['糕点', '饮料', '肉制品'],
    maxUsage: '0.5g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '天然胡萝卜素': {
    insNumber: '160a',
    cnsNumber: '08.010',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '辣椒红': {
    insNumber: '160c',
    cnsNumber: '08.106',
    function: '着色剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '双乙酸钠': {
    insNumber: '262ii',
    cnsNumber: '17.013',
    function: '防腐剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '4.0g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '食品用香精': {
    insNumber: '1500',
    cnsNumber: '14.001',
    function: '食用香料',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },

  // ─── 第二波补充（基于 35 张真实标签样本归纳） ───
  // 磷酸盐 / 膨松 / 水分保持
  '焦磷酸二氢二钠': {
    insNumber: '450i',
    cnsNumber: '01.106',
    function: '膨松剂/水分保持剂',
    usageScope: ['糕点', '面包', '饼干', '速冻面米'],
    maxUsage: '5.0g/kg（以磷酸根计）',
    riskLevel: '需注意',
    禁忌: '婴幼儿食品慎用，过量摄入磷酸盐影响钙吸收'
  },
  '磷酸二氢钙': {
    insNumber: '341i',
    cnsNumber: '06.005',
    function: '膨松剂/酸度调节剂',
    usageScope: ['糕点', '面包', '饼干'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '磷酸氢二钠': {
    insNumber: '339ii',
    cnsNumber: '15.002',
    function: '水分保持剂/酸度调节剂',
    usageScope: ['糕点', '乳制品', '肉制品'],
    maxUsage: '5.0g/kg（以磷酸根计）',
    riskLevel: '需注意',
    禁忌: '过量摄入磷酸盐影响钙吸收'
  },
  '磷酸三钠': {
    insNumber: '339iii',
    cnsNumber: '15.003',
    function: '水分保持剂/乳化剂',
    usageScope: ['糕点', '乳制品', '肉制品'],
    maxUsage: '5.0g/kg（以磷酸根计）',
    riskLevel: '需注意',
    禁忌: '过量摄入磷酸盐影响钙吸收'
  },
  // 着色剂
  '红曲红': {
    insNumber: '-',
    cnsNumber: '08.119',
    function: '着色剂',
    usageScope: ['糕点', '肉制品', '调味品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '胭脂树橙': {
    insNumber: '160b',
    cnsNumber: '08.011',
    function: '着色剂',
    usageScope: ['糕点', '糖果', '乳制品'],
    maxUsage: '0.6g/kg',
    riskLevel: '需注意',
    禁忌: '部分人群可能过敏'
  },
  // 乳化剂（吐温系列 / DATEM / 硬脂酰乳酸盐）
  '聚氧乙烯山梨醇酐单油酸酯': {
    insNumber: '433',
    cnsNumber: '10.015',
    function: '乳化剂',
    usageScope: ['饮料', '糕点', '冷饮'],
    maxUsage: '1.5g/kg',
    riskLevel: '需注意',
    禁忌: '俗称吐温80，婴幼儿食品慎用'
  },
  '聚氧乙烯山梨醇酐单硬脂酸酯': {
    insNumber: '435',
    cnsNumber: '10.016',
    function: '乳化剂',
    usageScope: ['饮料', '糕点', '冷饮'],
    maxUsage: '1.5g/kg',
    riskLevel: '需注意',
    禁忌: '俗称吐温60'
  },
  '双乙酰酒石酸单双甘油酯': {
    insNumber: '472e',
    cnsNumber: '10.025',
    function: '乳化剂',
    usageScope: ['面包', '糕点'],
    maxUsage: '20g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '硬脂酰乳酸钠': {
    insNumber: '481',
    cnsNumber: '10.022',
    function: '乳化剂',
    usageScope: ['面包', '糕点', '饼干'],
    maxUsage: '2.0g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '硬脂酰乳酸钙': {
    insNumber: '482',
    cnsNumber: '10.023',
    function: '乳化剂/面粉处理剂',
    usageScope: ['面包', '糕点', '饼干'],
    maxUsage: '2.0g/kg',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  // 增稠剂 / 胶体
  '瓜尔胶': {
    insNumber: '412',
    cnsNumber: '20.025',
    function: '增稠剂',
    usageScope: ['冰淇淋', '糕点', '饮料'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '刺槐豆胶': {
    insNumber: '410',
    cnsNumber: '20.022',
    function: '增稠剂/稳定剂',
    usageScope: ['冰淇淋', '糕点', '乳制品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '海藻酸钠': {
    insNumber: '401',
    cnsNumber: '20.004',
    function: '增稠剂/稳定剂',
    usageScope: ['糕点', '冰淇淋', '调味品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  // 变性淀粉
  '羟丙基二淀粉磷酸酯': {
    insNumber: '1442',
    cnsNumber: '-',
    function: '增稠剂/稳定剂',
    usageScope: ['糕点', '面包', '速冻面米', '调味品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '乙酰化二淀粉磷酸酯': {
    insNumber: '1414',
    cnsNumber: '-',
    function: '增稠剂/稳定剂',
    usageScope: ['糕点', '调味品', '冷冻食品'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  // 防腐 / 增味
  '乳酸链球菌素': {
    insNumber: '234',
    cnsNumber: '17.019',
    function: '防腐剂',
    usageScope: ['乳制品', '熟肉制品', '罐头'],
    maxUsage: '0.5g/kg',
    riskLevel: '安全',
    禁忌: '婴幼儿食品禁用'
  },
  "5'-呈味核苷酸二钠": {
    insNumber: '635',
    cnsNumber: '12.004',
    function: '增味剂',
    usageScope: ['调味品', '方便食品', '糕点'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '婴幼儿食品慎用'
  },
  // 凝固剂 / 矿物
  '硫酸钙': {
    insNumber: '516',
    cnsNumber: '18.001',
    function: '凝固剂/酸度调节剂',
    usageScope: ['面包', '豆制品', '糕点'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  // 甜味剂 / 糖醇（无糖食品常见）
  '山梨糖醇': {
    insNumber: '420',
    cnsNumber: '19.006',
    function: '甜味剂/水分保持剂',
    usageScope: ['糕点', '糖果', '饮料'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '过量摄入可能引起腹泻'
  },
  '麦芽糖醇': {
    insNumber: '965',
    cnsNumber: '19.005',
    function: '甜味剂/水分保持剂',
    usageScope: ['糕点', '糖果', '巧克力'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '过量摄入可能引起腹泻'
  },
  '罗汉果甜苷': {
    insNumber: '-',
    cnsNumber: '19.019',
    function: '甜味剂',
    usageScope: ['糕点', '饮料', '糖果'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '无特殊禁忌'
  },
  '木糖醇': {
    insNumber: '967',
    cnsNumber: '19.007',
    function: '甜味剂',
    usageScope: ['糕点', '糖果', '口香糖'],
    maxUsage: '按生产需要适量使用',
    riskLevel: '安全',
    禁忌: '过量摄入可能引起腹泻；犬类禁食'
  }
}

// 添加剂别名映射
export const additiveAliases = {
  '山梨酸钾': ['山梨酸', '202', 'INS202'],
  '苯甲酸钠': ['苯甲酸', '211', 'INS211'],
  '丙酸钙': ['丙酸', '282', 'INS282'],
  '脱氢乙酸钠': ['脱氢乙酸', '265', 'INS265'],
  '阿斯巴甜': ['阿司帕坦', '951', 'INS951'],
  '糖精钠': ['糖精', '954', 'INS954'],
  '安赛蜜': ['乙酰磺胺酸钾', '950', 'INS950'],
  '三氯蔗糖': ['蔗糖素', '955', 'INS955'],
  '甜蜜素': ['环己基氨基磺酸钠', '952', 'INS952'],
  '柠檬黄': ['102', 'INS102'],
  '日落黄': ['110', 'INS110'],
  '胭脂红': ['124', 'INS124'],
  '诱惑红': ['129', 'INS129'],
  '亮蓝': ['133', 'INS133'],
  '靛蓝': ['132', 'INS132'],
  '焦糖色': ['150', 'INS150'],
  'β-胡萝卜素': ['160a', 'INS160a'],
  '谷氨酸钠': ['味精', '621', 'INS621'],
  '柠檬酸': ['330', 'INS330'],
  '乳酸': ['270', 'INS270'],
  '苹果酸': ['334', 'INS334'],
  '抗坏血酸': ['维生素C', '300', 'INS300'],
  '单硬脂酸甘油酯': ['单甘酯', '471', 'INS471'],
  '羧甲基纤维素钠': ['CMC', '466', 'INS466'],
  '黄原胶': ['415', 'INS415'],
  '卡拉胶': ['407', 'INS407'],
  '碳酸氢钠': ['小苏打', '500ii', 'INS500ii'],
  '碳酸氢铵': ['503ii', 'INS503ii'],
  'D-异抗坏血酸钠': ['异Vc钠', '316', 'INS316'],

  // ─── 第二波补充别名 ───
  '焦磷酸二氢二钠': ['焦磷酸氢二钠', '450i', 'INS450i'],
  '磷酸二氢钙': ['341i', 'INS341i'],
  '磷酸氢二钠': ['339ii', 'INS339ii'],
  '磷酸三钠': ['339iii', 'INS339iii'],
  '红曲红': ['红曲红色素', '红曲色素'],
  '胭脂树橙': ['红木素', '胭脂木素', 'B-160b', '160b', 'INS160b'],
  '聚氧乙烯山梨醇酐单油酸酯': ['吐温80', '吐温八十', '聚山梨酯80', '433', 'INS433'],
  '聚氧乙烯山梨醇酐单硬脂酸酯': ['吐温60', '吐温六十', '聚山梨酯60', '435', 'INS435'],
  '双乙酰酒石酸单双甘油酯': ['DATEM', '双乙酰酒石酸甘油酯', '472e', 'INS472e'],
  '硬脂酰乳酸钠': ['SSL', '481', 'INS481'],
  '硬脂酰乳酸钙': ['CSL', '482', 'INS482'],
  '瓜尔胶': ['瓜尔豆胶', '412', 'INS412'],
  '刺槐豆胶': ['角豆胶', '槐豆胶', '410', 'INS410'],
  '海藻酸钠': ['褐藻酸钠', '401', 'INS401'],
  '羟丙基二淀粉磷酸酯': ['1442', 'INS1442'],
  '乙酰化二淀粉磷酸酯': ['1414', 'INS1414', '1422'],
  '乳酸链球菌素': ['Nisin', '尼生素', '234', 'INS234'],
  "5'-呈味核苷酸二钠": ['呈味核苷酸二钠', 'IMP+GMP', '635', 'INS635'],
  '硫酸钙': ['食用石膏', '516', 'INS516'],
  '山梨糖醇': ['山梨醇', '山梨糖醇液', '420', 'INS420'],
  '麦芽糖醇': ['麦芽糖醇液', '965', 'INS965'],
  '罗汉果甜苷': ['罗汉果甜', '罗汉果苷'],
  '木糖醇': ['967', 'INS967']
}

// 有争议的添加剂（中国消费者关注度高的）
export const controversialAdditives = [
  '阿斯巴甜', '苯甲酸钠', '糖精钠', '亚硝酸钠', '硝酸钠', '焦糖色', '明矾', '丁基羟基茴香醚', '二丁基羟基甲苯'
]

/**
 * 标准化添加剂名称
 * @param {string} name - 添加剂名称
 * @returns {string} - 标准名称
 */
export function normalizeAdditiveName(name) {
  if (!name) return name
  
  const normalized = name.trim()
  
  // 检查别名映射
  for (const [standardName, aliases] of Object.entries(additiveAliases)) {
    if (aliases.includes(normalized) || normalized.includes(standardName)) {
      return standardName
    }
  }
  
  return normalized
}

/**
 * 解析配料表，提取所有添加剂（包括复合配料中的添加剂）
 * @param {string} ingredientsText - 配料表文本
 * @returns {Array} - 添加剂列表
 */
export function parseAdditivesFromIngredients(ingredientsText) {
  if (!ingredientsText) return []
  
  const additives = []
  const foundAdditives = new Set()
  
  // 处理复合配料，提取括号内的内容
  const processText = (text) => {
    // 提取括号内的内容
    const bracketContent = text.match(/【([^】]+)】|\(([^)]+)\)|\[([^\]]+)\]/g)
    if (bracketContent) {
      bracketContent.forEach(content => {
        // 移除括号
        const innerContent = content.replace(/[【】()\[\]]/g, '')
        processText(innerContent)
      })
    }
    
    // 检测添加剂
    for (const [additiveName, info] of Object.entries(additiveDatabase)) {
      // 检查标准名称
      if (text.includes(additiveName) && !foundAdditives.has(additiveName)) {
        foundAdditives.add(additiveName)
        additives.push({
          name: additiveName,
          insNumber: info.insNumber,
          cnsNumber: info.cnsNumber,
          function: info.function,
          usageScope: info.usageScope,
          maxUsage: info.maxUsage,
          riskLevel: info.riskLevel,
          禁忌: info.禁忌,
          isControversial: controversialAdditives.includes(additiveName),
          originalText: text
        })
      }
    }
    
    // 检查别名
    for (const [standardName, aliases] of Object.entries(additiveAliases)) {
      for (const alias of aliases) {
        if (text.includes(alias) && !foundAdditives.has(standardName)) {
          const info = additiveDatabase[standardName]
          if (info) {
            foundAdditives.add(standardName)
            additives.push({
              name: standardName,
              insNumber: info.insNumber,
              cnsNumber: info.cnsNumber,
              function: info.function,
              usageScope: info.usageScope,
              maxUsage: info.maxUsage,
              riskLevel: info.riskLevel,
              禁忌: info.禁忌,
              isControversial: controversialAdditives.includes(standardName),
              originalText: text,
              alias: alias
            })
          }
        }
      }
    }
  }
  
  processText(ingredientsText)
  return additives
}

/**
 * 按功能类别对添加剂进行分类
 * @param {Array} additives - 添加剂列表
 * @returns {Object} - 分类后的添加剂
 */
export function categorizeAdditives(additives) {
  const categorized = {}
  
  additives.forEach(additive => {
    if (!categorized[additive.function]) {
      categorized[additive.function] = []
    }
    categorized[additive.function].push(additive)
  })
  
  return categorized
}

/**
 * 校验添加剂在糕点类食品中的合规性
 * @param {Array} additives - 添加剂列表
 * @returns {Object} - 合规和不合规的添加剂
 */
export function validateAdditivesForPastry(additives) {
  const compliant = []
  const nonCompliant = []
  
  additives.forEach(additive => {
    // 检查是否允许在糕点中使用
    const isAllowed = additive.usageScope.some(scope => scope.includes('糕点'))
    const isForbidden = additive.禁忌 && additive.禁忌.includes('糕点类食品禁用')
    
    if (isAllowed && !isForbidden) {
      compliant.push(additive)
    } else {
      nonCompliant.push({
        ...additive,
        violationReason: isForbidden ? '糕点类食品禁用' : '未允许在糕点中使用'
      })
    }
  })
  
  return {
    compliant,
    nonCompliant
  }
}

/**
 * 检测配料中的添加剂（兼容旧接口）
 * @param {string} ingredientsText - 配料表文本
 * @returns {Array} - 添加剂列表
 */
export function detectAdditives(ingredientsText) {
  const additives = parseAdditivesFromIngredients(ingredientsText)
  return additives.map(additive => ({
    name: additive.name,
    function: additive.function,
    isControversial: additive.isControversial,
    originalText: additive.originalText
  }))
}

/**
 * 格式化配料文本，标注添加剂
 * @param {string} ingredientsText - 配料表文本
 * @returns {string} - 格式化后的文本
 */
export function formatIngredientsWithAdditives(ingredientsText) {
  if (!ingredientsText) return ''
  
  const additives = parseAdditivesFromIngredients(ingredientsText)
  let formattedText = ingredientsText
  
  // 为每个添加剂添加标注
  additives.forEach(additive => {
    const regex = new RegExp(additive.name, 'g')
    formattedText = formattedText.replace(regex, 
      `<span class="additive-tag" data-function="${additive.function}" data-controversial="${additive.isControversial}" data-risk="${additive.riskLevel}">${additive.name}</span>`
    )
    
    // 处理别名
    if (additive.alias) {
      const aliasRegex = new RegExp(additive.alias, 'g')
      formattedText = formattedText.replace(aliasRegex, 
        `<span class="additive-tag" data-function="${additive.function}" data-controversial="${additive.isControversial}" data-risk="${additive.riskLevel}">${additive.alias}<span class="alias-hint">(${additive.name})</span></span>`
      )
    }
  })
  
  return formattedText
}

/**
 * 获取添加剂风险等级对应的颜色
 * @param {string} riskLevel - 风险等级
 * @returns {string} - 颜色代码
 */
export function getAdditiveRiskColor(riskLevel) {
  const colorMap = {
    '安全': '#67C23A',
    '需注意': '#E6A23C',
    '高风险': '#F56C6C'
  }
  return colorMap[riskLevel] || '#909399'
}

/**
 * 搜索添加剂
 * @param {string} keyword - 搜索关键词
 * @returns {Array} - 匹配的添加剂
 */
export function searchAdditives(keyword) {
  if (!keyword) return []
  
  const results = []
  const lowerKeyword = keyword.toLowerCase()
  
  // 搜索标准名称
  for (const [name, info] of Object.entries(additiveDatabase)) {
    if (name.toLowerCase().includes(lowerKeyword)) {
      results.push({
        name,
        ...info
      })
    }
  }
  
  // 搜索别名
  for (const [name, aliases] of Object.entries(additiveAliases)) {
    for (const alias of aliases) {
      if (alias.toLowerCase().includes(lowerKeyword)) {
        const info = additiveDatabase[name]
        if (info && !results.some(r => r.name === name)) {
          results.push({
            name,
            ...info,
            matchedAlias: alias
          })
        }
      }
    }
  }
  
  return results
}