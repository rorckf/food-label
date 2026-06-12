/**
 * 标签体检(打假模式)规则引擎 —— 纯函数,网页版/单机版通用。
 * 对识别出的 RecognitionResultVO 做三组核查:
 *   A. GB 7718 强制标注项完整性
 *   B. 宣称话术核查(GB 28050 营养声称门槛 + "零添加"类新规)
 *   C. 品类身份核查(执行标准 vs 产品名称的"冒充"识别)
 * 体检基于照片可识别内容:拍不全会出现"未识别到",措辞上与"未标注"区分。
 */

const LEVELS = ['pass', 'info', 'warn', 'fail']

/** 配料表兼容取值(与 Result.vue 的 extractIngredientNames 同口径) */
function getIngredients(r) {
  const cands = r.ingredientsList || r.ingredients || r.batching || []
  return (Array.isArray(cands) ? cands : [])
    .map((x) => (typeof x === 'string' ? x : x?.name || x?.raw_material || x?.ingredient || x?.text || ''))
    .filter(Boolean)
}

/** 添加剂 VO 列表(additiveMap: { 原文 → {name, category, ...} }) */
function getAdditives(r) {
  const m = r.additiveMap
  if (!m || typeof m !== 'object') return []
  return Object.values(m).filter(Boolean)
}

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** 是否液态食品(净含量带 ml,或品类为饮料/酒类)—— 影响营养声称门槛 */
function isLiquid(r) {
  if (/ml|毫升|L|升/i.test(String(r.netContent || ''))) return true
  return /饮料|酒|乳/.test(String(r.category || ''))
}

const item = (level, title, detail, basis) => ({ level, title, detail: detail || '', basis: basis || '' })

// ─── A. GB 7718 强制标注项 ───────────────────────────────

function checkMandatory(r) {
  const items = []
  const missing = (name, note) =>
    item('fail', `${name}:未识别到`,
      `照片中没有识别到「${name}」。若标签上确实未标注,属于 GB 7718 强制标注项缺失;也可能是拍摄角度未覆盖,可补拍背面/侧面验证。${note || ''}`,
      'GB 7718《预包装食品标签通则》')
  const ok = (name) => item('pass', name)

  const fields = [
    ['食品名称', r.productName],
    ['配料表', getIngredients(r).length > 0],
    ['净含量', r.netContent],
    ['生产者名称及地址', r.manufacturer],
    ['生产日期', r.productionDate],
  ]
  for (const [name, val] of fields) {
    items.push(val ? ok(name) : missing(name))
  }

  // 保质期:酒精饮料(≥10%vol)、食醋、食盐、固态糖类可免标
  if (r.shelfLife) {
    items.push(ok('保质期'))
  } else if (/酒|醋|盐|糖$/.test(String(r.category || '') + String(r.productName || ''))) {
    items.push(item('info', '保质期:未识别到',
      '本品可能属于可免标保质期的品类(酒精度≥10%的饮品、食醋、食用盐、固态糖等)。',
      'GB 7718 4.3.1'))
  } else {
    items.push(missing('保质期'))
  }

  items.push(r.storage
    ? ok('贮存条件')
    : item('warn', '贮存条件:未识别到', '贮存条件是强制标注项,未拍到或未标注。', 'GB 7718'))

  // 生产许可证:SC + 14 位数字;QS 标志已废止
  const lic = String(r.licenseNumber || '').replace(/\s/g, '').toUpperCase()
  if (!lic) {
    items.push(missing('生产许可证编号', '注意:进口预包装食品无国产 SC 编号,以原产国信息+中文标签为准。'))
  } else if (lic.startsWith('QS')) {
    items.push(item('fail', '生产许可证:QS 编号已废止',
      `识别到「${lic}」。QS 标志自 2018 年 10 月起停止使用,在售产品应标注 SC 编号——若这是近期生产的产品,值得警惕。`,
      '《食品生产许可管理办法》'))
  } else if (/^SC\d{14}$/.test(lic)) {
    items.push(ok('生产许可证编号(SC)'))
  } else {
    items.push(item('warn', '生产许可证:格式存疑',
      `识别到「${lic}」,标准格式应为 SC + 14 位数字。可能是识别误差,也可能是编造的号码,可在"市场监管总局食品生产许可查询"核验。`,
      '《食品生产许可管理办法》'))
  }

  items.push(r.standard
    ? ok('产品标准代号')
    : item('warn', '产品标准代号:未识别到',
      '国产预包装食品应标注执行标准(GB/QB/DB/Q 等开头)。没有它就无法核对产品"身份"。', 'GB 7718'))

  // 营养成分表 "1+4"
  const n = r.nutrition || {}
  const required = [['能量', n.energy], ['蛋白质', n.protein], ['脂肪', n.fat], ['碳水化合物', n.carbohydrate], ['钠', n.sodium]]
  const lost = required.filter(([, v]) => v == null || v === '').map(([k]) => k)
  if (lost.length === 0) {
    items.push(ok('营养成分表(1+4 齐全)'))
  } else if (lost.length === required.length) {
    items.push(item('fail', '营养成分表:未识别到',
      '未拍到或未标注营养成分表。除豁免品类(生鲜、现制现售、酒、包装饮用水等)外属强制标注项。',
      'GB 28050《预包装食品营养标签通则》'))
  } else {
    items.push(item('warn', `营养成分表:缺少${lost.join('、')}`,
      '营养成分表必须至少标示能量和蛋白质、脂肪、碳水化合物、钠("1+4"),缺项可能是识别误差,也可能是标签不合规。',
      'GB 28050'))
  }

  return items
}

// ─── B. 宣称话术核查 ─────────────────────────────────────

const OTHER_SUGARS = ['果葡糖浆', '葡萄糖浆', '麦芽糖浆', '玉米糖浆', '糖浆', '果糖', '葡萄糖', '蜂蜜', '麦芽糖', '乳糖', '红糖', '黑糖', '冰糖', '炼乳']
const PRESERVATIVE_NAMES = ['山梨酸', '苯甲酸', '脱氢乙酸', '丙酸', '双乙酸钠', '乳酸链球菌素', '纳他霉素', '亚硝酸', '硝酸钠', '硝酸钾', '对羟基苯甲酸']

function checkClaims(r) {
  const items = []
  const text = String(r.productName || '')
  const ingredients = getIngredients(r)
  const additives = getAdditives(r)
  const liquid = isLiquid(r)
  const n = r.nutrition || {}

  // "零添加/不添加" 类用语:新国标直接禁止
  if (/零添加|0\s*添加|无添加|不添加/.test(text)) {
    const cnt = additives.length
    items.push(cnt > 0
      ? item('fail', `宣称"零添加",但识别出 ${cnt} 种添加剂`,
          `配料表中识别到:${additives.slice(0, 5).map((a) => a.name).join('、')}${cnt > 5 ? ' 等' : ''}。宣称与事实不符。`,
          'GB 7718-2025(禁止"零添加""不添加"类用语)')
      : item('warn', '使用了"零添加"类宣传用语',
          '即使配料确实干净,GB 7718-2025 也已明确禁止使用"零添加""不添加"等词语误导消费者(2027 年 3 月起强制)。',
          'GB 7718-2025'))
  }

  // "0蔗糖" ≠ 无糖
  if (/[0零无]\s*蔗糖/.test(text)) {
    const hit = ingredients.filter((i) => OTHER_SUGARS.some((s) => i.includes(s)))
    if (hit.length) {
      items.push(item('fail', '宣称"0蔗糖",但配料含其他糖',
        `配料表中识别到:${hit.join('、')}。"0蔗糖"只是不加蔗糖,这些糖照样升血糖——典型话术。`,
        'GB 28050(无糖要求:糖 ≤0.5g/100g(mL),指所有糖)'))
    } else {
      items.push(item('info', '宣称"0蔗糖"', '"0蔗糖"不等于"无糖",注意营养成分表中的碳水化合物量。', 'GB 28050'))
    }
  }

  // "无糖/0糖"
  if (/无糖|[0零]\s*糖(?!浆)/.test(text)) {
    const carb = num(n.carbohydrate)
    const sweet = additives.filter((a) => String(a.category || '').includes('甜味'))
    if (carb != null && carb > 0.5) {
      items.push(item('warn', `宣称"无糖",碳水化合物 ${carb}g/100${liquid ? 'mL' : 'g'}`,
        '"无糖"要求糖 ≤0.5g/100g(mL)。碳水不全是糖(可能含淀粉/糖醇),但数值明显偏高时值得核对糖的单列值。',
        'GB 28050 营养声称门槛'))
    }
    if (sweet.length) {
      items.push(item('info', '无糖,但使用了甜味剂',
        `甜味来自:${sweet.map((a) => a.name).join('、')}。合规做法,但"无糖"≠"不甜",对照自己对代糖的接受度。`))
    }
  }

  // 低脂 / 脱脂
  const fat = num(n.fat)
  if (/低脂/.test(text) && fat != null && fat > (liquid ? 1.5 : 3)) {
    items.push(item('fail', `宣称"低脂",脂肪 ${fat}g/100${liquid ? 'mL' : 'g'}`,
      `低脂门槛:固体 ≤3g/100g,液体 ≤1.5g/100mL,本品超标。`, 'GB 28050'))
  }
  if (/脱脂/.test(text) && fat != null && fat > 0.5) {
    items.push(item('warn', `宣称"脱脂",脂肪 ${fat}g/100g`, '脱脂要求 ≤0.5g/100g。', 'GB 28050'))
  }

  // 低盐/低钠
  const sodium = num(n.sodium)
  if (/低[盐钠]|淡盐/.test(text) && sodium != null && sodium > 120) {
    items.push(item('fail', `宣称"低盐/低钠",钠 ${sodium}mg/100g`, '低钠门槛:≤120mg/100g(mL),本品超标。', 'GB 28050'))
  }

  // 高蛋白
  const protein = num(n.protein)
  if (/高蛋白|富含蛋白/.test(text) && protein != null && protein < (liquid ? 6 : 12)) {
    items.push(item('warn', `宣称"高蛋白",蛋白质 ${protein}g/100${liquid ? 'mL' : 'g'}`,
      `高蛋白门槛:固体 ≥12g/100g,液体 ≥6g/100mL,本品未达到。`, 'GB 28050'))
  }

  // 无防腐剂
  if (/[无不][含加]?防腐/.test(text)) {
    const hit = additives.filter((a) =>
      String(a.category || '').includes('防腐') || PRESERVATIVE_NAMES.some((p) => String(a.name || '').includes(p)))
    if (hit.length) {
      items.push(item('fail', '宣称"无防腐剂",但识别出防腐剂',
        `配料表中识别到:${hit.map((a) => a.name).join('、')}。`, 'GB 7718(标签不得虚假)'))
    } else {
      items.push(item('info', '宣称"无防腐剂"',
        '本身高糖/高盐/真空/灭菌的食品天然不需要防腐剂,这类宣称多为营销话术而非品质优势。'))
    }
  }

  // 纯天然 / 儿童概念
  if (/纯天然|天然无公害/.test(text)) {
    items.push(item('info', '宣称"纯天然"', '我国食品标准中没有"纯天然"的定义和门槛,属于无依据的营销用语。'))
  }
  if (/儿童|宝宝|幼儿/.test(text) && !/婴幼儿配方|辅食/.test(text)) {
    items.push(item('info', '"儿童食品"概念提示',
      '除婴幼儿配方食品和辅食外,我国没有"儿童食品"标准——"儿童"二字往往只是溢价理由,按普通食品的配料表判断即可。'))
  }

  if (items.length === 0) {
    items.push(item('pass', '产品名称未发现营销宣称用语', '未检测到"零添加/无糖/低脂"等需要核查门槛的宣称。'))
  }
  return items
}

// ─── C. 品类身份核查 ─────────────────────────────────────

function checkIdentity(r) {
  const items = []
  const name = String(r.productName || '')
  const std = String(r.standard || '').replace(/\s/g, '').toUpperCase()
  const ingredients = getIngredients(r)

  // 固体饮料冒充蛋白粉/配方粉/代餐
  if (/29602/.test(std) && /蛋白粉|配方|奶粉|特医|营养粉|代餐|骆驼奶|羊奶粉/.test(name)) {
    items.push(item('fail', '执行标准是「固体饮料」,名称却像专业营养品',
      `执行标准 ${r.standard} 对应固体饮料(冲调饮品),不是特医食品/婴幼儿配方/保健食品。把固体饮料包装成"配方粉""蛋白粉"销售是市场监管重点打击的冒充手法。`,
      'GB/T 29602《固体饮料》'))
  }

  // 含乳饮料冒充奶
  if (/21732|11673/.test(std) && /[奶乳]/.test(name) && !/饮料|饮品/.test(name)) {
    items.push(item('warn', '执行标准是「含乳饮料」,不是奶',
      `执行标准 ${r.standard} 属于含乳饮料——主要成分是水和糖,蛋白质含量门槛仅 1g/100g(纯牛奶约 3g)。名称里的"奶/乳"容易让人当成牛奶买。`,
      'GB/T 21732《含乳饮料》'))
  }

  // 名称 vs 第一位配料(配料按用量降序是 GB 7718 的硬规定)
  const first = ingredients[0] || ''
  if (first) {
    if (/果汁/.test(name) && /^饮?用?水$|^纯净水$/.test(first.trim())) {
      items.push(item('warn', '名称含"果汁",但第一位配料是水',
        '配料表按用量降序排列,本品主体是水(+糖),属果汁饮料而非果汁。看"果汁含量≥xx%"标注更真实。',
        'GB 7718 4.1.3(配料降序)'))
    }
    if (/燕窝|阿胶|人参|虫草/.test(name)) {
      const hero = name.match(/燕窝|阿胶|人参|虫草/)[0]
      if (!first.includes(hero)) {
        items.push(item('warn', `名称主打"${hero}",但第一位配料是「${first}」`,
          `配料按用量降序,排第一的才是主体。"${hero}"在配料表中的位置越靠后,实际含量越少——贵价噱头成分尤其值得看排位。`,
          'GB 7718 4.1.3'))
      }
    }
  }

  if (items.length === 0) {
    items.push(item('pass', '未发现执行标准与名称不符的迹象',
      std ? `执行标准 ${r.standard} 与产品名称没有触发已知的冒充模式。` : '缺少执行标准代号,无法做完整比对。'))
  }
  return items
}

// ─── 总装 ────────────────────────────────────────────────

/**
 * @param {object} r RecognitionResultVO(本地或后端,字段同名)
 * @returns {{ summary: {pass:number,info:number,warn:number,fail:number}, groups: Array }}
 */
export function runLabelCheck(r) {
  if (!r) return null
  const groups = [
    { key: 'mandatory', title: '强制标注项(GB 7718)', items: checkMandatory(r) },
    { key: 'claim', title: '宣称话术核查', items: checkClaims(r) },
    { key: 'identity', title: '品类身份核查', items: checkIdentity(r) },
  ]
  const summary = { pass: 0, info: 0, warn: 0, fail: 0 }
  for (const g of groups) for (const it of g.items) summary[it.level]++
  // 按严重度排序组内条目,fail 在前
  for (const g of groups) g.items.sort((a, b) => LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level))
  return { summary, groups }
}
