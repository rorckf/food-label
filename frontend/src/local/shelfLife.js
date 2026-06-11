/**
 * 保质期解析与到期校验(本地版) —— 1:1 移植自后端 ShelfLifeService.java
 */

const EXPIRING_THRESHOLD = 7

const DATE_CN = /(\d{4})\s*[年./\-]\s*(\d{1,2})\s*[月./\-]\s*(\d{1,2})/
const EXPIRY_DIRECT = /(?:保质期至|至|到期日|有效期至)\s*[:：]?\s*(\d{4})\s*[年./\-]\s*(\d{1,2})\s*[月./\-]\s*(\d{1,2})/
const DURATION = /(\d{1,3})\s*(天|日|个月|月|年)/
const DURATION_CN = /([一二两三四五六七八九十]{1,3})\s*(天|日|个月|月|年)/
const SEASONAL = /\d{1,2}\s*月.*\d{1,2}\s*天.*\d{1,2}\s*月/

const CN_DIGITS = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }

const fmt = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function safeBuild(y, mo, d) {
  const date = new Date(Number(y), Number(mo) - 1, Number(d))
  // 防御非法日期(如 2月30日 会被 Date 滚动)
  if (date.getMonth() !== Number(mo) - 1) return null
  return isNaN(date.getTime()) ? null : date
}

function parseDate(text) {
  if (!text || !String(text).trim()) return null
  const s = String(text)
  if (s.includes('见包装') || s.includes('见标签') || s.includes('见喷码')) return null
  const m = s.match(DATE_CN)
  return m ? safeBuild(m[1], m[2], m[3]) : null
}

function parseExpiryDate(shelfLife) {
  if (!shelfLife) return null
  const m = String(shelfLife).match(EXPIRY_DIRECT)
  return m ? safeBuild(m[1], m[2], m[3]) : null
}

function parseChineseNumber(s) {
  if (!s) return 0
  if (s.length === 1) return CN_DIGITS[s] || 0
  const idx = s.indexOf('十')
  if (idx >= 0) {
    const tens = idx === 0 ? 1 : CN_DIGITS[s[idx - 1]] || 0
    const ones = idx === s.length - 1 ? 0 : CN_DIGITS[s[idx + 1]] || 0
    return tens * 10 + ones
  }
  return 0
}

function addDuration(prod, n, unit) {
  const d = new Date(prod)
  if (unit === '天' || unit === '日') d.setDate(d.getDate() + n)
  else if (unit === '月' || unit === '个月') d.setMonth(d.getMonth() + n)
  else if (unit === '年') d.setFullYear(d.getFullYear() + n)
  else return null
  return d
}

function applyDuration(prod, shelfLife) {
  if (!shelfLife) return null
  const s = String(shelfLife)
  if (SEASONAL.test(s)) return null
  let m = s.match(DURATION)
  if (m) return addDuration(prod, parseInt(m[1], 10), m[2])
  m = s.match(DURATION_CN)
  if (m) {
    const n = parseChineseNumber(m[1])
    if (n > 0) return addDuration(prod, n, m[2])
  }
  return null
}

/**
 * 解析"生产日期 + 保质期",结合当天计算状态。
 * @returns {{status, productionDate, expiryDate, daysRemaining, message}}
 */
export function evaluateShelfLife(productionDate, shelfLife, today = new Date()) {
  const vo = { status: 'UNKNOWN', productionDate: null, expiryDate: null, daysRemaining: null, message: null }

  const prod = parseDate(productionDate)
  let expiry = parseExpiryDate(shelfLife)
  if (prod) vo.productionDate = fmt(prod)

  if (!expiry && prod) expiry = applyDuration(prod, shelfLife)
  if (!expiry) {
    vo.message = '无法解析保质期'
    return vo
  }

  vo.expiryDate = fmt(expiry)
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((expiry - t0) / 86400000)
  vo.daysRemaining = days

  if (days < 0) {
    vo.status = 'EXPIRED'
    vo.message = `已过期 ${-days} 天`
  } else if (days <= EXPIRING_THRESHOLD) {
    vo.status = 'EXPIRING'
    vo.message = `还有 ${days} 天到期`
  } else {
    vo.status = 'VALID'
    vo.message = `还有 ${days} 天到期`
  }
  return vo
}
