<template>
  <div class="cmp-page">
    <header class="cmp-hero">
      <div class="cmp-hero__eyebrow">
        <span class="cmp-hero__line"></span>
        <span class="cmp-hero__tiny">COMPARE · 同品类对比</span>
        <span class="cmp-hero__line"></span>
      </div>
      <h1 class="cmp-hero__title">两款产品 · 一目了然</h1>
      <p class="cmp-hero__sub">从历史记录中勾选两款同品类产品，系统将在 7 个维度逐项比较并给出推荐。</p>
    </header>

    <main class="cmp-main">
      <!-- Step 1: 选择 -->
      <section class="parch-card">
        <h2 class="card-title">① 从历史记录中勾选两款</h2>
        <p class="card-sub">已选 {{ selectedIds.length }} / 2 款</p>

        <div v-if="loading" class="muted">加载中…</div>
        <div v-else-if="!records.length" class="muted">
          暂无历史记录，去 <router-link to="/" class="text-link">上传识别</router-link> 一些产品再来吧。
        </div>
        <div v-else class="rec-grid">
          <label
            v-for="r in records"
            :key="r.id"
            class="rec-card"
            :class="{ checked: selectedIds.includes(r.id), disabled: !canSelect(r.id) }"
          >
            <input
              type="checkbox"
              :value="r.id"
              :checked="selectedIds.includes(r.id)"
              :disabled="!canSelect(r.id)"
              @change="toggleSelect(r.id)"
            />
            <div class="rec-card__img">
              <img v-if="r.imageUrl" :src="r.imageUrl" alt="" />
              <span v-else class="placeholder">无图</span>
            </div>
            <div class="rec-card__info">
              <div class="rec-card__name">{{ r.productName || '未命名产品' }}</div>
              <div class="rec-card__meta">{{ formatTime(r.createTime) }}</div>
            </div>
          </label>
        </div>

        <div class="action-bar">
          <button class="primary-btn" :disabled="selectedIds.length !== 2 || comparing" @click="runCompare">
            <Loader v-if="comparing" :size="14" class="spin" />
            {{ comparing ? '对比中…' : '开始对比' }}
          </button>
          <button v-if="result" class="ghost-btn" @click="clearAll">重新选择</button>
        </div>
      </section>

      <!-- Step 2: 结果 -->
      <section v-if="result" class="parch-card cmp-result">
        <h2 class="card-title">② 对比明细</h2>

        <!-- 两款产品摘要 -->
        <div class="summary-row">
          <div class="summary-card summary-card--a">
            <span class="summary-tag">A</span>
            <div class="summary-name">{{ result.productA.productName }}</div>
            <div class="summary-score">
              <span class="score-num">{{ result.productA.healthScore ?? '—' }}</span>
              <span class="score-unit">健康评分</span>
            </div>
          </div>
          <div class="vs">VS</div>
          <div class="summary-card summary-card--b">
            <span class="summary-tag">B</span>
            <div class="summary-name">{{ result.productB.productName }}</div>
            <div class="summary-score">
              <span class="score-num">{{ result.productB.healthScore ?? '—' }}</span>
              <span class="score-unit">健康评分</span>
            </div>
          </div>
        </div>

        <!-- 7 维度对比 -->
        <div class="metrics">
          <div class="metric-row metric-row--head">
            <span class="metric-name">维度</span>
            <span class="metric-val">A</span>
            <span class="metric-vs">vs</span>
            <span class="metric-val">B</span>
            <span class="metric-winner">优势方</span>
          </div>
          <div v-for="(m, name) in result.metrics" :key="name" class="metric-row">
            <span class="metric-name">{{ name }}</span>
            <span class="metric-val" :class="cellClass(m, 'A')">{{ formatVal(m.a, name) }}</span>
            <span class="metric-vs">vs</span>
            <span class="metric-val" :class="cellClass(m, 'B')">{{ formatVal(m.b, name) }}</span>
            <span class="metric-winner">
              <span v-if="m.winner === 'A'" class="badge badge--a">A 优</span>
              <span v-else-if="m.winner === 'B'" class="badge badge--b">B 优</span>
              <span v-else class="badge badge--tie">持平</span>
            </span>
          </div>
        </div>

        <!-- 推荐结论 -->
        <div class="reco-card">
          <span class="reco-icon">★</span>
          <p class="reco-text">{{ result.recommendation }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loader } from 'lucide-vue-next'
import { historyAPI, compareAPI } from '@/utils/api'

const records = ref([])
const loading = ref(true)
const selectedIds = ref([])
const comparing = ref(false)
const result = ref(null)

const canSelect = (id) => selectedIds.value.includes(id) || selectedIds.value.length < 2

const toggleSelect = (id) => {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) {
    selectedIds.value.splice(i, 1)
  } else if (selectedIds.value.length < 2) {
    selectedIds.value.push(id)
  }
}

const clearAll = () => {
  selectedIds.value = []
  result.value = null
}

const runCompare = async () => {
  if (selectedIds.value.length !== 2) return
  comparing.value = true
  result.value = null
  try {
    const res = await compareAPI.compare(selectedIds.value)
    if (res.code === 200) {
      result.value = res.data
    } else {
      ElMessage.error(res.message || '对比失败')
    }
  } catch (e) {
    /* 拦截器已弹错误提示 */
  } finally {
    comparing.value = false
  }
}

const formatVal = (v, metric) => {
  if (v === null || v === undefined) return '—'
  // 添加剂数量是整数；其余指标保留 1 位小数
  if (metric === '添加剂数量') return Math.round(v)
  return Number(v).toFixed(1)
}

const cellClass = (m, side) => {
  if (m.winner === 'TIE') return ''
  return m.winner === side ? 'win' : 'lose'
}

const formatTime = (s) => {
  if (!s) return ''
  return s.replace('T', ' ').slice(0, 16)
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await historyAPI.getHistoryList()
    if (res.code === 200) {
      records.value = res.data || []
    }
  } catch (e) { /* 拦截器已弹 */ }
  finally {
    loading.value = false
  }
})
</script>

<style scoped>
.cmp-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--w-space-7) var(--w-space-6) var(--w-space-9);
}

.cmp-hero { text-align: center; padding: var(--w-space-3) 0 var(--w-space-6); }
.cmp-hero__eyebrow { display: flex; align-items: center; justify-content: center; gap: 14px; color: var(--w-amber); margin-bottom: var(--w-space-4); }
.cmp-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.cmp-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }
.cmp-hero__title { font-family: var(--w-font-serif); font-size: var(--w-fs-h1); font-weight: 500; color: var(--w-ink); letter-spacing: 0.1em; margin-bottom: var(--w-space-3); }
.cmp-hero__sub { color: var(--w-ink-mid); font-size: 14px; line-height: 1.8; letter-spacing: 0.05em; }

.cmp-main { display: flex; flex-direction: column; gap: var(--w-space-6); }

.parch-card {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-xl);
  padding: var(--w-space-6) var(--w-space-7);
  box-shadow: var(--w-shadow-sm);
}
.card-title { font-family: var(--w-font-serif); font-size: 22px; color: var(--w-ink); letter-spacing: 0.08em; margin-bottom: 6px; }
.card-sub { color: var(--w-ink-mid); font-size: 13px; margin-bottom: var(--w-space-4); letter-spacing: 0.04em; }

.rec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--w-space-3); margin-bottom: var(--w-space-4); }
.rec-card {
  display: flex; gap: 10px; padding: 10px;
  border: 1px solid var(--w-border-soft); border-radius: var(--w-radius-md);
  background: var(--w-surface-2); cursor: pointer;
  transition: all 0.18s var(--w-ease); position: relative;
}
.rec-card:hover { border-color: var(--w-primary); }
.rec-card.checked { border-color: var(--w-primary); background: var(--w-primary-pale); box-shadow: 0 0 0 3px var(--w-primary-pale); }
.rec-card.disabled { opacity: 0.45; cursor: not-allowed; }
.rec-card input { position: absolute; top: 8px; right: 8px; }

.rec-card__img { width: 56px; height: 56px; flex-shrink: 0; border-radius: var(--w-radius-sm); overflow: hidden; background: var(--w-divider); display: flex; align-items: center; justify-content: center; }
.rec-card__img img { width: 100%; height: 100%; object-fit: cover; }
.placeholder { font-size: 11px; color: var(--w-ink-mute); }

.rec-card__info { flex: 1; min-width: 0; }
.rec-card__name { font-size: 13.5px; color: var(--w-ink); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.rec-card__meta { font-size: 11.5px; color: var(--w-ink-mute); font-family: ui-monospace, Menlo, Consolas, monospace; }

.action-bar { display: flex; gap: var(--w-space-3); align-items: center; }
.primary-btn {
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 22px; background: var(--w-primary); color: #FFFBF2;
  border-radius: var(--w-radius-full); font-family: var(--w-font-serif);
  font-size: 14px; letter-spacing: 0.2em;
  box-shadow: var(--w-shadow-sm); transition: all 0.2s var(--w-ease);
}
.primary-btn:hover:not(:disabled) { background: var(--w-primary-hover); transform: translateY(-1px); }
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ghost-btn {
  height: 40px; padding: 0 18px; border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-full); color: var(--w-ink-mid); font-size: 13px;
  background: transparent; transition: all 0.2s var(--w-ease);
}
.ghost-btn:hover { color: var(--w-primary); border-color: var(--w-primary); }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 对比结果 */
.cmp-result { animation: fadeIn 0.3s var(--w-ease); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.summary-row { display: grid; grid-template-columns: 1fr auto 1fr; gap: var(--w-space-4); align-items: stretch; margin-bottom: var(--w-space-5); }
.summary-card {
  position: relative; padding: var(--w-space-4) var(--w-space-4); border-radius: var(--w-radius-md);
  background: var(--w-surface-2); border: 1px solid var(--w-border-soft);
  display: flex; flex-direction: column; gap: 8px;
}
.summary-card--a { border-left: 4px solid var(--w-sage); }
.summary-card--b { border-left: 4px solid var(--w-amber); }
.summary-tag { position: absolute; top: 10px; right: 12px; font-family: var(--w-font-serif); font-size: 18px; color: var(--w-ink-mute); letter-spacing: 0.05em; }
.summary-name { font-family: var(--w-font-serif); font-size: 16px; color: var(--w-ink); padding-right: 24px; }
.summary-score { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; }
.score-num { font-size: 32px; font-weight: 600; color: var(--w-primary); font-family: ui-monospace, Menlo, Consolas, monospace; }
.score-unit { font-size: 12px; color: var(--w-ink-mid); letter-spacing: 0.1em; }
.vs { display: flex; align-items: center; justify-content: center; font-family: var(--w-font-serif); font-size: 14px; color: var(--w-amber); letter-spacing: 0.2em; }

.metrics { display: flex; flex-direction: column; border: 1px solid var(--w-border-soft); border-radius: var(--w-radius-sm); overflow: hidden; margin-bottom: var(--w-space-5); }
.metric-row { display: grid; grid-template-columns: 1.4fr 1fr 40px 1fr 90px; gap: 12px; padding: 10px 16px; align-items: center; border-bottom: 1px dashed var(--w-divider); font-size: 13.5px; }
.metric-row:last-child { border-bottom: none; }
.metric-row--head { background: var(--w-surface-2); font-family: var(--w-font-serif); font-size: 12px; letter-spacing: 0.12em; color: var(--w-ink-mid); }
.metric-name { color: var(--w-ink); }
.metric-val { text-align: center; font-family: ui-monospace, Menlo, Consolas, monospace; }
.metric-val.win { color: var(--w-sage); font-weight: 600; }
.metric-val.lose { color: var(--w-terracotta); }
.metric-vs { text-align: center; color: var(--w-ink-mute); font-size: 11px; letter-spacing: 0.1em; }
.metric-winner { text-align: right; }
.badge { display: inline-block; padding: 2px 10px; border-radius: var(--w-radius-full); font-size: 11px; letter-spacing: 0.1em; }
.badge--a { background: rgba(127, 159, 127, 0.18); color: var(--w-sage); }
.badge--b { background: rgba(200, 134, 58, 0.18); color: var(--w-amber); }
.badge--tie { background: var(--w-divider); color: var(--w-ink-mid); }

.reco-card {
  display: flex; gap: 12px; align-items: flex-start;
  padding: var(--w-space-4); background: var(--w-primary-pale);
  border-left: 3px solid var(--w-primary); border-radius: var(--w-radius-sm);
}
.reco-icon { color: var(--w-amber); font-size: 20px; line-height: 1; }
.reco-text { color: var(--w-ink); font-size: 14px; line-height: 1.85; flex: 1; }

.muted { color: var(--w-ink-mute); font-size: 13px; padding: 12px 0; }
.text-link { color: var(--w-primary); text-decoration: underline dotted; }
</style>
