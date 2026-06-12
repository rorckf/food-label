<template>
  <div class="rec-page">
    <!-- Hero -->
    <header class="rec-hero">
      <div class="rec-hero__eyebrow">
        <span class="rec-hero__line"></span>
        <span class="rec-hero__tiny">RECOMMEND · 为你定制</span>
        <span class="rec-hero__line"></span>
      </div>
      <h1 class="rec-hero__title">为你推荐</h1>
      <p class="rec-hero__sub" v-if="profileSummary">{{ profileSummary }}</p>
    </header>

    <!-- 用户画像摘要 chips -->
    <div v-if="profile && (profile.healthGoal || profile.chronicDiseases)"
         class="profile-chips">
      <button
        class="rec-refresh"
        :disabled="loading"
        @click="refresh"
        type="button"
      >
        <RefreshCw :size="14" :class="{ spin: loading }" />
        <span>{{ loading ? '正在刷新…' : '换一批' }}</span>
      </button>
      <span v-if="profile.healthGoal" class="p-chip p-chip--goal">
        <Target :size="13" /> 目标 · {{ profile.healthGoal }}
      </span>
      <span v-if="profile.chronicDiseases" class="p-chip p-chip--avoid">
        <Activity :size="13" /> 禁忌 · {{ profile.chronicDiseases }}
      </span>
      <router-link to="/onboarding" class="p-chip p-chip--edit">
        <Pencil :size="12" /> 修改
      </router-link>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="rec-state">
      <Loader :size="18" class="spin" />
      <span>正在为你挑选合适的食品…</span>
    </div>

    <!-- 空态 -->
    <div v-else-if="items.length === 0" class="rec-state rec-state--empty">
      <span class="emoji">🍃</span>
      <p>未找到符合你画像的食品。可尝试在「个人偏好」放宽限制。</p>
    </div>

    <!-- 分类推荐：站在货架前不知道买什么时翻这页 -->
    <template v-else>
      <section v-for="bucket in buckets" :key="bucket.key" class="rec-bucket">
        <header class="bucket-head">
          <component :is="bucket.icon" :size="18" class="bucket-head__icon" />
          <h2 class="bucket-head__title">{{ bucket.title }}</h2>
          <span class="bucket-head__sub">{{ bucket.subtitle }}</span>
          <span class="bucket-head__count">{{ bucket.items.length }} 款</span>
        </header>

        <div class="rec-grid">
          <article v-for="(item, idx) in bucket.items" :key="item.id" class="rec-card">
            <div class="rec-card__rank">{{ idx + 1 }}</div>

            <header class="rec-card__head">
              <div class="rec-card__title-wrap">
                <h3 class="rec-card__name">{{ item.name }}</h3>
                <p class="rec-card__meta">
                  <span v-if="item.brand">{{ item.brand }}</span>
                  <span v-if="item.brand && item.category" class="dot">·</span>
                  <span v-if="item.category">{{ item.category }}</span>
                </p>
              </div>
              <div class="score-badge" :class="scoreBadgeClass(item.healthScore)">
                <span class="score-badge__num">{{ item.healthScore }}</span>
                <span class="score-badge__label">健康分</span>
              </div>
            </header>

            <!-- 货架推荐语：一句话告诉你为什么值得拿这一件 -->
            <p class="tagline">{{ buildTagline(item, bucket.key) }}</p>

            <!-- 营养小条（每 100g） -->
            <ul class="nutri">
              <li><em>能量</em><b>{{ item.energy }}</b><span>kJ</span></li>
              <li><em>蛋白</em><b>{{ formatNum(item.protein) }}</b><span>g</span></li>
              <li><em>脂肪</em><b>{{ formatNum(item.fat) }}</b><span>g</span></li>
              <li><em>碳水</em><b>{{ formatNum(item.carb) }}</b><span>g</span></li>
              <li><em>钠</em><b>{{ item.sodium }}</b><span>mg</span></li>
            </ul>

            <!-- 推荐理由 chips -->
            <div v-if="item.reasons && item.reasons.length" class="reasons">
              <span v-for="r in item.reasons" :key="r" class="reason-chip">✓ {{ r }}</span>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Target, Activity, Pencil, Loader, RefreshCw,
         CupSoda, Cookie, Milk, UtensilsCrossed } from 'lucide-vue-next'
import { recommendAPI } from '@/utils/api'

const loading = ref(true)
const items = ref([])
const profile = ref(null)

const profileSummary = computed(() => {
  if (!profile.value || !profile.value.healthGoal) return ''
  const parts = [`基于你的${profile.value.healthGoal}目标`]
  if (profile.value.chronicDiseases) parts.push(`${profile.value.chronicDiseases.split(',').length} 项疾病禁忌`)
  return parts.join(' · ')
})

const formatNum = (v) => {
  if (v === null || v === undefined) return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return '-'
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

const scoreBadgeClass = (s) => {
  if (s == null) return 'score-badge--mid'
  if (s >= 80) return 'score-badge--good'
  if (s >= 60) return 'score-badge--mid'
  return 'score-badge--low'
}

const shuffle = (arr) => {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ───────── 分类分桶：货架视角 ─────────
   每个 bucket 用 keyword 列表与 category / name 做子串匹配；
   命中第一个就归类，避免一个商品被重复分进多桶。 */
const BUCKETS = [
  {
    key: 'drink',
    title: '推荐喝的',
    subtitle: '饮料 · 茶饮 · 即饮咖啡',
    icon: CupSoda,
    keys: ['饮料', '饮品', '茶', '水', '咖啡', '奶茶', '果汁', '汽水', '可乐', '气泡', '豆浆', '椰']
  },
  {
    key: 'snack',
    title: '推荐吃的零食',
    subtitle: '薯片 · 饼干 · 糖果 · 巧克力 · 坚果',
    icon: Cookie,
    keys: ['零食', '薯片', '饼干', '糖果', '巧克力', '坚果', '膨化', '糕点', '蜜饯', '果脯', '能量棒', '威化', '锅巴', '海苔']
  },
  {
    key: 'dairy',
    title: '推荐乳制品',
    subtitle: '酸奶 · 牛奶 · 奶酪',
    icon: Milk,
    keys: ['乳', '奶', '酸奶', '酪', '芝士']
  },
  {
    key: 'staple',
    title: '推荐主食与速食',
    subtitle: '方便面 · 速冻 · 米面 · 罐头',
    icon: UtensilsCrossed,
    keys: ['面', '米', '粉', '方便', '即食', '速食', '罐头', '速冻', '麦片', '燕麦', '饭']
  }
]

const matchBucket = (item) => {
  const hay = `${item.category || ''}${item.name || ''}`
  for (const b of BUCKETS) {
    if (b.keys.some(k => hay.includes(k))) return b.key
  }
  return null
}

const PER_BUCKET = 2
const MAX_BUCKETS = 4
const buckets = computed(() => {
  const grouped = Object.fromEntries(BUCKETS.map(b => [b.key, []]))
  for (const it of items.value) {
    const k = matchBucket(it)
    if (k) grouped[k].push(it)
  }
  return BUCKETS
    .map(b => ({ ...b, items: grouped[b.key].slice(0, PER_BUCKET) }))
    .filter(b => b.items.length)
    .slice(0, MAX_BUCKETS)
})

/* ───────── 货架推荐语 ─────────
   单句口语化提示，结合 tags / 钠 / 蛋白 / 配料表深度，
   再带一点品牌+品类锚点，方便用户站在货架前迅速决策。 */
const buildTagline = (item, bucketKey) => {
  const tags = Array.isArray(item.tags) ? item.tags : []
  const has = (t) => tags.includes(t)
  const brand = item.brand ? `${item.brand} ` : ''
  const noun =
    bucketKey === 'drink'  ? '这款饮料' :
    bucketKey === 'snack'  ? '这款零食' :
    bucketKey === 'dairy'  ? '这款乳品' :
    bucketKey === 'staple' ? '这款主食' :
                             '这款产品'

  // 1) 优先输出最显眼的"卖点"
  const highlights = []
  if (has('无糖')) highlights.push('零糖配方，控糖期也能放心拿一瓶')
  else if (has('低糖')) highlights.push('糖分明显低于同类，喝起来不齁')
  if (has('低钠')) highlights.push('钠含量较低，长期喝更友好')
  if (has('低脂')) highlights.push('脂肪压得较低，热量负担小')
  if (has('高蛋白')) {
    const p = Number(item.protein)
    highlights.push(Number.isFinite(p) && p > 0
      ? `蛋白质 ${p % 1 === 0 ? p : p.toFixed(1)} g/100g，加餐也能补一点`
      : '蛋白质含量更高，加餐顶饱')
  }
  if (has('高纤维')) highlights.push('膳食纤维更高，饱腹感更持久')
  if (has('高钙')) highlights.push('钙含量更高，给骨头多一点支持')

  // 2) 没有明显标签时，用配料/评分给出一个理由
  if (highlights.length === 0) {
    const addCount = (item.additives || '').split(',').map(s => s.trim()).filter(Boolean).length
    if (addCount > 0 && addCount <= 3) highlights.push(`配料表干净，仅 ${addCount} 项添加剂`)
    else if ((item.healthScore ?? 0) >= 85) highlights.push(`健康评分 ${item.healthScore}，整体配比很均衡`)
    else if ((item.healthScore ?? 0) >= 70) highlights.push('整体配比尚可，作为日常选择不踩雷')
    else highlights.push('一个值得尝试的新选择，可作日常换换口味')
  }

  // 3) 拼一句"品牌 + 品类 + 卖点"的货架文案
  const lead = `${brand}${noun}`
  return `${lead}：${highlights.slice(0, 2).join('；')}。`
}

const load = async () => {
  loading.value = true
  try {
    const res = await recommendAPI.list(50)
    if (res.code === 200 && res.data) {
      items.value = shuffle(res.data.items || [])
      profile.value = res.data.userProfile || null
    } else {
      items.value = []
    }
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  if (loading.value) return
  load()
}

onMounted(load)
</script>

<style scoped>
.rec-page {
  max-width: var(--w-content-max);
  margin: 0 auto;
  padding: var(--w-space-5) var(--w-space-6) var(--w-space-7);
}

/* Hero */
.rec-hero { text-align: center; padding: var(--w-space-3) 0 var(--w-space-4); }
.rec-hero__eyebrow {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; color: var(--w-amber);
  margin-bottom: var(--w-space-3);
}
.rec-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.rec-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }
.rec-hero__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.1em;
  margin: 0 0 8px;
}
.rec-hero__sub {
  color: var(--w-ink-mid);
  font-size: 13.5px;
  letter-spacing: 0.04em;
  margin: 0;
}
.rec-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--w-primary);
  background: var(--w-surface);
  border: 1px solid var(--w-primary-soft);
  border-radius: var(--w-radius-full);
  cursor: pointer;
  transition: background 0.18s var(--w-ease), color 0.18s var(--w-ease), transform 0.18s var(--w-ease);
}
.rec-refresh:hover:not(:disabled) {
  background: var(--w-primary-pale, #FFF4E0);
  transform: translateY(-1px);
}
.rec-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 画像 chips */
.profile-chips {
  display: flex; flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: var(--w-space-5);
}
.p-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  letter-spacing: 0.04em;
  border-radius: var(--w-radius-full);
  background: var(--w-surface-2);
  color: var(--w-ink-mid);
  border: 1px solid var(--w-border-soft);
}
.p-chip--goal     { color: var(--w-primary); border-color: var(--w-primary-soft); }
.p-chip--avoid    { color: var(--w-terracotta, #b5632a); border-color: rgba(181, 99, 42, 0.3); }
.p-chip--edit     { color: var(--w-ink-soft); cursor: pointer; }
.p-chip--edit:hover { color: var(--w-primary); border-color: var(--w-primary-soft); }

/* 状态 */
.rec-state {
  display: flex; align-items: center; justify-content: center;
  gap: 10px;
  padding: var(--w-space-7) 0;
  color: var(--w-ink-mid);
  font-size: 14px;
  letter-spacing: 0.06em;
}
.rec-state--empty { flex-direction: column; gap: var(--w-space-3); }
.rec-state--empty .emoji { font-size: 36px; }
.spin { animation: w-spin 0.8s linear infinite; }
@keyframes w-spin { to { transform: rotate(360deg); } }

/* 分桶 */
.rec-bucket {
  margin-bottom: var(--w-space-6);
}
.bucket-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 0 0 var(--w-space-3);
  margin-bottom: var(--w-space-4);
  border-bottom: 1px solid var(--w-divider);
}
.bucket-head__icon {
  color: var(--w-amber, #c0883a);
  align-self: center;
  flex-shrink: 0;
}
.bucket-head__title {
  font-family: var(--w-font-serif);
  font-size: 18px;
  font-weight: 600;
  color: var(--w-ink);
  letter-spacing: 0.08em;
  margin: 0;
}
.bucket-head__sub {
  flex: 1;
  font-size: 12px;
  color: var(--w-ink-mute);
  letter-spacing: 0.06em;
}
.bucket-head__count {
  font-size: 11.5px;
  color: var(--w-ink-soft);
  letter-spacing: 0.08em;
  padding: 2px 10px;
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-full);
  background: var(--w-surface);
}

/* 网格 */
.rec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--w-space-4);
}
@media (max-width: 768px) {
  .rec-grid { grid-template-columns: 1fr; }
}

/* 货架推荐语 */
.tagline {
  position: relative;
  z-index: 1;
  margin: 0 0 var(--w-space-3);
  padding: 10px 12px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--w-ink-mid);
  letter-spacing: 0.02em;
  background: var(--w-primary-pale, #FFF4E0);
  border-left: 2px solid var(--w-primary-soft, #E9C9A1);
  border-radius: 4px;
}

/* 卡片 */
.rec-card {
  position: relative;
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  padding: var(--w-space-5);
  box-shadow: var(--w-shadow-sm);
  transition: transform 0.2s var(--w-ease), box-shadow 0.2s var(--w-ease);
}
.rec-card::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px dashed var(--w-divider);
  border-radius: calc(var(--w-radius-lg) - 6px);
  pointer-events: none;
}
.rec-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--w-shadow-md);
}

.rec-card__rank {
  position: absolute;
  top: 12px; left: 12px;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--w-font-serif);
  font-size: 13px;
  font-weight: 600;
  background: var(--w-amber, #c0883a);
  color: #FFFBF2;
  border-radius: 50%;
  z-index: 2;
}

.rec-card__head {
  display: flex;
  align-items: flex-start;
  gap: var(--w-space-3);
  padding-left: 36px; /* 让出 rank 圆 */
  margin-bottom: var(--w-space-3);
  position: relative;
  z-index: 1;
}
.rec-card__title-wrap { flex: 1; min-width: 0; }
.rec-card__name {
  font-family: var(--w-font-serif);
  font-size: 16px;
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.04em;
  margin: 0 0 4px;
  word-break: break-word;
}
.rec-card__meta {
  font-size: 12px;
  color: var(--w-ink-mute);
  margin: 0;
  letter-spacing: 0.04em;
}
.rec-card__meta .dot { margin: 0 6px; opacity: 0.5; }

/* 健康评分徽章 */
.score-badge {
  display: flex; flex-direction: column; align-items: center;
  min-width: 52px;
  padding: 6px 10px;
  border-radius: var(--w-radius-md);
  border: 1px solid;
  flex-shrink: 0;
}
.score-badge__num {
  font-family: var(--w-font-serif);
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}
.score-badge__label {
  font-size: 10px;
  margin-top: 2px;
  letter-spacing: 0.1em;
  opacity: 0.75;
}
.score-badge--good { color: var(--w-sage, #5b8d6c); border-color: rgba(91, 141, 108, 0.35); background: rgba(91, 141, 108, 0.08); }
.score-badge--mid  { color: var(--w-amber, #c0883a); border-color: rgba(192, 136, 58, 0.35); background: rgba(192, 136, 58, 0.08); }
.score-badge--low  { color: var(--w-terracotta, #b5632a); border-color: rgba(181, 99, 42, 0.35); background: rgba(181, 99, 42, 0.08); }

/* 营养小条 */
.nutri {
  display: flex;
  list-style: none;
  margin: 0 0 var(--w-space-3);
  padding: var(--w-space-2) 0;
  border-top: 1px solid var(--w-divider);
  border-bottom: 1px solid var(--w-divider);
  position: relative;
  z-index: 1;
}
.nutri li {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--w-ink-mute);
  border-right: 1px dashed var(--w-divider);
}
.nutri li:last-child { border-right: 0; }
.nutri em {
  font-style: normal;
  font-size: 10.5px;
  letter-spacing: 0.06em;
}
.nutri b {
  font-weight: 500;
  color: var(--w-ink);
  font-size: 14px;
}
.nutri span { font-size: 9.5px; opacity: 0.7; }

/* 推荐理由 */
.reasons {
  display: flex; flex-wrap: wrap; gap: 6px;
  position: relative;
  z-index: 1;
}
.reason-chip {
  display: inline-flex; align-items: center;
  padding: 4px 10px;
  font-size: 11.5px;
  background: var(--w-primary-pale, #FFF4E0);
  color: var(--w-primary);
  border-radius: var(--w-radius-full);
  letter-spacing: 0.04em;
  border: 1px solid var(--w-primary-soft);
}
</style>
