<template>
  <div class="pd-page">
    <header class="pd-hero">
      <div class="pd-hero__eyebrow">
        <span class="pd-hero__line"></span>
        <span class="pd-hero__tiny">PRODUCT DETAILS · 厂商与合规</span>
        <span class="pd-hero__line"></span>
      </div>
      <h1 class="pd-hero__title">{{ result?.productName || '未知产品' }}</h1>
      <p class="pd-hero__sub">来自标签的厂商信息、合规标识与生产细节。</p>
    </header>

    <button class="pd-back" @click="goBack" aria-label="返回识读结果">
      <ChevronLeft :size="16" /> 返回识读结果
    </button>

    <main class="pd-main">
      <section class="pd-card">
        <h3 class="pd-card__title">厂商 · 合规</h3>
        <div class="kv-list">
          <div v-for="row in rows" :key="row.label" class="kv-row">
            <span class="kv-label">{{ row.label }}</span>
            <span class="kv-value" :class="{ 'kv-value--empty': !row.value }">{{ row.value || '—' }}</span>
          </div>
        </div>
        <p v-if="emptyCount === rows.length" class="pd-empty-tip">
          标签上未识别到厂商与合规信息，可重新拍摄更清晰的包装背面。
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChevronLeft } from 'lucide-vue-next'
import { historyAPI } from '@/utils/api'

const router = useRouter()
const route = useRoute()

const resultId = route.params.id
const result = ref(null)

const dbRecordId = computed(() => {
  const n = Number(resultId)
  return Number.isFinite(n) && n > 0 ? n : null
})

const rows = computed(() => [
  { label: '生产商 / 委托商', value: result.value?.manufacturer },
  { label: '生产许可证',     value: result.value?.licenseNumber },
  { label: '执行标准',       value: result.value?.standard },
  { label: '产地',           value: result.value?.origin },
  { label: '生产日期',       value: result.value?.productionDate },
  { label: '保质期',         value: result.value?.shelfLife },
  { label: '贮存条件',       value: result.value?.storage ?? result.value?.usageInfo?.storage },
  { label: '联系方式',       value: result.value?.contact },
])

const emptyCount = computed(() => rows.value.filter(r => !r.value).length)

const goBack = () => router.push(`/result/${resultId}`)

const fetchFromHistory = async () => {
  if (!dbRecordId.value) return null
  try {
    const res = await historyAPI.getHistoryDetail(dbRecordId.value)
    if (res.code === 200 && res.data) {
      const d = res.data
      return { ...(d.detail || {}), id: d.id, productName: d.productName }
    }
  } catch (e) { /* 拦截器 */ }
  return null
}

onMounted(async () => {
  const stored = JSON.parse(localStorage.getItem('scanResults') || '{}')
  result.value = stored[resultId] || await fetchFromHistory()
  if (!result.value) {
    ElMessage.error('未找到识读结果')
    router.push('/')
  }
})
</script>

<style scoped>
.pd-page {
  max-width: var(--w-content-max);
  margin: 0 auto;
  padding: var(--w-space-7) var(--w-space-6) var(--w-space-9);
}

.pd-hero { text-align: center; padding: var(--w-space-5) 0 var(--w-space-6); }
.pd-hero__eyebrow {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; color: var(--w-amber);
  margin-bottom: var(--w-space-4);
}
.pd-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.pd-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }
.pd-hero__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.06em;
  margin-bottom: var(--w-space-3);
  line-height: 1.4;
}
.pd-hero__sub {
  max-width: 520px; margin: 0 auto;
  color: var(--w-ink-mid);
  font-size: 14px; line-height: 1.8;
  letter-spacing: 0.05em;
}

.pd-back {
  display: inline-flex; align-items: center; gap: 6px;
  margin-bottom: var(--w-space-4);
  padding: 8px 14px;
  background: transparent;
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-full);
  color: var(--w-ink-mid);
  font-size: 13px; letter-spacing: 0.06em;
  cursor: pointer; transition: all 0.18s var(--w-ease);
}
.pd-back:hover {
  color: var(--w-primary);
  border-color: var(--w-primary);
  background: var(--w-primary-pale);
}

.pd-main { margin-top: var(--w-space-4); }

.pd-card {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  padding: var(--w-space-6) var(--w-space-7);
  box-shadow: var(--w-shadow-sm);
}
.pd-card__title {
  font-family: var(--w-font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.1em;
  margin: 0 0 var(--w-space-4);
  padding-bottom: var(--w-space-3);
  border-bottom: 1px solid var(--w-divider);
}

.kv-list { display: flex; flex-direction: column; }
.kv-row {
  display: flex;
  justify-content: space-between;
  gap: var(--w-space-4);
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px dotted var(--w-divider);
}
.kv-row:last-child { border-bottom: 0; }
.kv-label {
  font-size: 13px;
  color: var(--w-ink-soft);
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
.kv-value {
  font-size: 14px;
  color: var(--w-ink);
  text-align: right;
  font-weight: 500;
  word-break: break-all;
}
.kv-value--empty { color: var(--w-ink-mute); font-weight: 400; }

.pd-empty-tip {
  margin-top: var(--w-space-4);
  padding: var(--w-space-3) var(--w-space-4);
  background: var(--w-primary-pale);
  border-left: 3px solid var(--w-amber);
  border-radius: var(--w-radius-sm);
  font-size: 13px;
  color: var(--w-ink-mid);
  line-height: 1.6;
}

@media (max-width: 560px) {
  .pd-page { padding: var(--w-space-5) var(--w-space-4) var(--w-space-7); }
  .pd-hero__title { font-size: 26px; }
  .pd-card { padding: var(--w-space-4) var(--w-space-5); }
}
</style>
