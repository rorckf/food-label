/**
 * 本地健康档案(单机模式):{ healthGoal, chronicDiseases, allergens }
 * 与后端 user 表的健康档案三字段语义一致(csv 字符串,空串表示无)。
 */

const KEY = 'localHealthProfile'

export function getLocalProfile() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveLocalProfile(profile) {
  const current = getLocalProfile() || {}
  const next = {
    healthGoal: profile.healthGoal ?? current.healthGoal ?? null,
    chronicDiseases: profile.chronicDiseases ?? current.chronicDiseases ?? '',
    allergens: profile.allergens ?? current.allergens ?? '',
  }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function hasLocalProfile() {
  const p = getLocalProfile()
  return !!(p && p.healthGoal)
}
