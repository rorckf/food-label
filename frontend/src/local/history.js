/**
 * 本地历史记录(单机模式):localStorage 存储,接口形状与后端 /history/* 一致。
 * 图片以 dataURL 形式内联保存(压缩后约几十 KB/张);
 * localStorage 总容量约 5MB,超限时自动淘汰最旧的非收藏记录。
 */

const STORE_KEY = 'localHistory'
const MAX_RECORDS = 60

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(records) {
  // 超量/超容截断:优先淘汰最旧的非收藏记录
  let list = [...records]
  const evict = () => {
    const idx = list.map((r, i) => ({ r, i })).reverse().find((x) => x.r.isFavorite !== 1)
    if (idx) list.splice(idx.i, 1)
    else list.pop()
  }
  while (list.length > MAX_RECORDS) evict()
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(list))
      return list
    } catch {
      if (!list.length) return list
      evict()
    }
  }
  return list
}

const nowStr = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function toListVO(r) {
  return {
    id: r.id,
    productName: r.productName,
    category: r.category,
    imageUrl: r.imageUrl,
    isFavorite: r.isFavorite,
    healthScore: r.healthScore,
    createTime: r.createTime,
  }
}

/** 保存一条识别记录,返回生成的 id */
export function saveLocalHistory({ productName, category, imageUrl, healthScore, detail }) {
  const records = load()
  const id = Date.now()
  records.unshift({
    id,
    productName: productName ?? null,
    category: category ?? null,
    imageUrl: imageUrl ?? null,
    isFavorite: 0,
    healthScore: healthScore ?? null,
    createTime: nowStr(),
    detail,
  })
  persist(records)
  return id
}

export function listLocalHistory() {
  return load().map(toListVO)
}

export function getLocalHistoryDetail(id) {
  const r = load().find((x) => String(x.id) === String(id))
  if (!r) return null
  return { ...toListVO(r), detail: r.detail }
}

export function deleteLocalHistory(id) {
  const records = load()
  const next = records.filter((x) => String(x.id) !== String(id))
  persist(next)
  return next.length < records.length
}

/** 返回切换后的 isFavorite(0/1);记录不存在返回 null */
export function toggleLocalFavorite(id) {
  const records = load()
  const r = records.find((x) => String(x.id) === String(id))
  if (!r) return null
  r.isFavorite = r.isFavorite === 1 ? 0 : 1
  persist(records)
  return r.isFavorite
}
