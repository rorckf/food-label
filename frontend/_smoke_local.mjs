// 本地模块冒烟测试:esbuild 打包后用 node 运行(npm run 不涉及,仅开发自检)
import { batchMatchAdditives, classifyIngredients, getAdditiveInfo, normalize, getLimitsByName } from './src/local/additiveDb.js'
import { calcHealthScore, healthTier } from './src/local/healthScore.js'
import { generateHealthTips, validateAndFixNutrition, parseGrams } from './src/local/nutritionTips.js'
import { extractAllergens } from './src/local/allergens.js'
import { evaluateShelfLife } from './src/local/shelfLife.js'
import { lookupStandardCategory } from './src/local/standardCodeMap.js'

let failed = 0
const check = (name, actual, expectFn) => {
  const pass = expectFn(actual)
  if (!pass) failed++
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}:`, JSON.stringify(actual).slice(0, 160))
}

// 1. normalize:括号剥离 + 全角转半角
check('normalize 嵌套括号', normalize('酱油（酿造酱油（含小麦））'), (v) => v === '酱油')

// 2. 精确命中
check('精确匹配 柠檬酸', getAdditiveInfo('柠檬酸'), (v) => v.category.includes('酸度调节剂') && v.description.includes('三羧酸循环'))

// 3. 模糊命中(库内全名为"苯甲酸及其钠盐（包括苯甲酸，苯甲酸钠）")
check('模糊匹配 苯甲酸钠', getAdditiveInfo('苯甲酸钠'), (v) => v.category === '防腐剂')

// 4. INS 代码
check('INS 330 → 柠檬酸', getAdditiveInfo('330'), (v) => v.description.includes('三羧酸') || v.category.includes('酸度'))

// 5. 批量匹配 + 兜底
const matched = batchMatchAdditives(['水', '白砂糖', '柠檬酸', '山梨酸钾', '神秘成分X胶'])
check('批量匹配命中数', Object.keys(matched).length, (n) => n === 3) // 柠檬酸+山梨酸钾+兜底"胶"

// 6. 复配下钻
const cls = classifyIngredients(['水', '白砂糖', '复配膨松剂(碳酸氢钠、焦磷酸二氢二钠)', '食用香精'])
check('复配拆解出子项', cls.additives.map((a) => a.name), (names) => names.includes('碳酸氢钠') && names.includes('焦磷酸二氢二钠'))
check('主料含水和糖', cls.mainIngredients, (m) => m.includes('水') && m.includes('白砂糖'))

// 7. 健康评分(高糖高钠饮料 + 3 添加剂:100-8-8-9=75? energy 2000/8400=23%不超,carb 90/300=30%边界不超…构造明确超标)
const score = calcHealthScore({ energy: 3000, fat: 25, carbohydrate: 95, sodium: 700 }, 3)
// energy 3000/8400=35.7%超 -8;fat 25/60=41.7%超 -8;carb 95/300=31.7%超 -8;sodium 700/2000=35%超 -8;添加剂 -9 → 100-41=59
check('健康评分=59', score, (v) => v === 59)
check('评级 中', healthTier(score), (v) => v === '中')

// 8. 营养修正:NRV%反推(能量缺失,NRV%=12 → 8400*0.12=1008)
const nut = { energy: null, protein: 5, fat: 10, carbohydrate: 20, sodium: 100 }
const flag = validateAndFixNutrition(nut, { energyNRV: 12 })
// 反推1008 vs 交叉验算 5*17+10*37+20*17=795,偏差(1008-795)/795=26.8%>20% → energyCalc 修正为795
check('能量交叉校验修正', { e: nut.energy, f: flag.energy }, (v) => v.e === 795 && v.f === 'energyCalc')

// 9. 营养提示(整份口径:500g 装,糖 12g/100g → 60g/份 = 20% NRV 适中)
const tips = generateHealthTips({ carbohydrate: 12 }, parseGrams('500g'))
check('碳水提示适中', tips.find((t) => t.name === '碳水化合物'), (t) => t && t.level === '适中')

// 10. 过敏原:配料含明确项 + 交叉污染段落
const alg = extractAllergens(['小麦粉', '鸡蛋', '白砂糖'], '含麸质。本生产线也加工含花生、芝麻的产品。')
check('过敏原 contains', alg.contains, (c) => c.includes('麸质') && c.includes('蛋'))
check('过敏原 mayContain', alg.mayContain, (c) => c.includes('花生') && c.includes('芝麻') && !c.includes('麸质'))

// 11. 保质期:2026-01-01 产 + 12个月 → 2027-01-01,今天 2026-06-11 → VALID 204 天
const sl = evaluateShelfLife('2026年1月1日', '12个月', new Date(2026, 5, 11))
check('保质期 VALID', sl, (v) => v.status === 'VALID' && v.expiryDate === '2027-01-01' && v.daysRemaining === 204)
const sl2 = evaluateShelfLife('2026-06-01', '2天', new Date(2026, 5, 11))
check('保质期 EXPIRED', sl2, (v) => v.status === 'EXPIRED' && v.message.includes('已过期 8 天'))
const sl3 = evaluateShelfLife(null, '保质期至2026/06/15', new Date(2026, 5, 11))
check('直接到期日 EXPIRING', sl3, (v) => v.status === 'EXPIRING' && v.daysRemaining === 4)

// 12. 标准码反查
check('GB/T 20977 → 烘焙', lookupStandardCategory('GB/T 20977-2007'), (v) => v === '烘焙')
check('Q/企标 → null', lookupStandardCategory('Q/HLSSP 0004S'), (v) => v === null)

// 13. 限量表懒加载
const limits = await getLimitsByName('山梨酸钾')
check('山梨酸钾限量条数>50', limits.length, (n) => n > 50)
check('限量字段形状', limits[0], (l) => l.foodCategoryCode && l.maxDosage !== undefined)

// 14. 推荐(需 mock localStorage 环境)
globalThis.localStorage = {
  _m: new Map(),
  getItem(k) { return this._m.has(k) ? this._m.get(k) : null },
  setItem(k, v) { this._m.set(k, String(v)) },
  removeItem(k) { this._m.delete(k) },
}
const { localRecommend } = await import('./src/local/recommend.js')
const { saveLocalProfile } = await import('./src/local/profile.js')

// 无档案:通用目标,全量排序
const rec0 = localRecommend(10)
check('推荐默认通用', rec0, (r) => r.items.length === 10 && r.userProfile.healthGoal === null)
check('推荐按分降序', rec0.items, (it) => it.every((x, i) => i === 0 || it[i - 1].score >= x.score))

// 乳过敏 + 糖尿病:含奶产品被硬过滤,高糖被剔除
saveLocalProfile({ healthGoal: '控糖', chronicDiseases: '糖尿病', allergens: '乳' })
const rec1 = localRecommend(50)
check('过敏硬过滤(无奶字)', rec1.items, (it) => it.every((x) => !x.name.includes('奶') && !x.name.includes('乳')))
check('慢性病过滤(无高糖tag)', rec1.items, (it) => it.every((x) => !x.tags.includes('高糖')))
check('推荐理由非空', rec1.items[0].reasons, (r) => r.length >= 1 && r.length <= 3)

// 15. 对比(基于本地历史)
const { saveLocalHistory } = await import('./src/local/history.js')
const { localCompare } = await import('./src/local/compare.js')
const mk = (name, category, nutrition, additiveCount) => {
  const additiveMap = {}
  for (let i = 0; i < additiveCount; i++) additiveMap[`添加剂${i}`] = { name: `添加剂${i}` }
  return saveLocalHistory({
    productName: name, category, imageUrl: null,
    healthScore: 0,
    detail: { productName: name, category, nutrition, additiveMap },
  })
}
const idA = mk('饮料A', '饮料', { energy: 100, protein: 1, fat: 0, carbohydrate: 5, sodium: 20 }, 1)
await new Promise((r) => setTimeout(r, 5)) // 保证 Date.now() id 不同
const idB = mk('饮料B', '饮料', { energy: 2900, protein: 0.5, fat: 30, carbohydrate: 95, sodium: 900 }, 6)
const cmp = localCompare([idA, idB])
check('对比 A 获胜项', cmp.metrics['能量'].winner, (w) => w === 'A')
check('对比健康评分', cmp.metrics['健康评分'], (m) => m.a === 97 && m.b === 50 && m.winner === 'A')
check('推荐结论指向 A', cmp.recommendation, (r) => r.includes('推荐选择 A'))
// 品类不一致防御
await new Promise((r) => setTimeout(r, 5))
const idC = mk('饼干C', '烘焙', { energy: 100 }, 0)
let threw = false
try { localCompare([idA, idC]) } catch (e) { threw = e.message.includes('同品类') }
check('跨品类对比被拒', threw, (v) => v === true)

console.log(failed === 0 ? '\n=== 全部通过 ===' : `\n=== ${failed} 项失败 ===`)
process.exit(failed === 0 ? 0 : 1)
