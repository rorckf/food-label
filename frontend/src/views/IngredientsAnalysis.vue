<template>
  <div class="ia-page">
    <header class="ia-hero">
      <div class="ia-hero__eyebrow">
        <span class="ia-hero__line"></span>
        <span class="ia-hero__tiny">DEEP ANALYSIS · 配料深度解析</span>
        <span class="ia-hero__line"></span>
      </div>
      <h1 class="ia-hero__title">{{ result?.productName || '配料深度解析' }}</h1>
      <p class="ia-hero__sub">基于 GB 2760-2024，配料三分类与添加剂×食品类别限量明细。</p>
      <button class="back-btn" @click="goBack">← 返回识读结果</button>
    </header>

    <main class="ia-main" v-if="result">
      <!-- 三分类总览 -->
      <section class="parch-card">
        <h2 class="card-title">配料三分类</h2>
        <p class="card-sub">来源：当前识读结果的配料表，按 GB 2760 知识库 + 关键词规则分桶。</p>

        <div class="bucket-grid">
          <div class="bucket bucket--main">
            <div class="bucket__head">
              <span class="bucket__label">食品主料</span>
              <span class="bucket__count">{{ classification.mainIngredients.length }}</span>
            </div>
            <ul class="bucket__list">
              <li v-for="(name, i) in classification.mainIngredients" :key="'m'+i">{{ name }}</li>
              <li v-if="!classification.mainIngredients.length" class="empty">—</li>
            </ul>
          </div>

          <div class="bucket bucket--aux">
            <div class="bucket__head">
              <span class="bucket__label">食品辅料</span>
              <span class="bucket__count">{{ classification.auxiliaryIngredients.length }}</span>
            </div>
            <ul class="bucket__list">
              <li v-for="(name, i) in classification.auxiliaryIngredients" :key="'a'+i">{{ name }}</li>
              <li v-if="!classification.auxiliaryIngredients.length" class="empty">—</li>
            </ul>
          </div>

          <div class="bucket bucket--add">
            <div class="bucket__head">
              <span class="bucket__label">食品添加剂</span>
              <span class="bucket__count">{{ classification.additives.length }}</span>
            </div>
            <ul class="bucket__list">
              <li v-for="(a, i) in classification.additives" :key="'x'+i">
                <button class="addi-tag" @click="selectAdditive(a)" :class="{ active: selected?.name === a.name }">
                  {{ a.name }}
                </button>
              </li>
              <li v-if="!classification.additives.length" class="empty">—</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 选中添加剂详情 + GB 限量明细 -->
      <section v-if="selected" class="parch-card">
        <h2 class="card-title">{{ selected.name }}</h2>
        <div class="kv-grid">
          <div class="kv-row"><span class="kv-label">功能类别</span><span class="kv-value">{{ selected.category || '—' }}</span></div>
          <div class="kv-row"><span class="kv-label">使用范围</span><span class="kv-value">{{ selected.usageScope || '—' }}</span></div>
          <div class="kv-row"><span class="kv-label">最大添加量</span><span class="kv-value">{{ selected.maxDosage || '—' }}</span></div>
          <div class="kv-row"><span class="kv-label">疾病禁忌</span><span class="kv-value risk" v-if="selected.diseaseContraindication">{{ selected.diseaseContraindication }}</span><span class="kv-value" v-else>—</span></div>
        </div>
        <p class="safety-desc" v-if="selected.description">{{ selected.description }}</p>

        <h3 class="sub-title">GB 2760-2024 食品×限量明细</h3>
        <div v-if="limitsLoading" class="muted">加载中…</div>
        <div v-else-if="!limits.length" class="muted">该添加剂在 GB 2760-2024 中无独立限量条目。</div>
        <div v-else class="limit-table">
          <div class="limit-row limit-row--head">
            <span>分类号</span><span>食品类别</span><span>最大使用量</span><span>用途</span><span>备注</span>
          </div>
          <div class="limit-row" v-for="row in limits" :key="row.id">
            <span class="mono">{{ row.foodCategoryCode || '—' }}</span>
            <span>{{ row.foodCategoryName || '—' }}</span>
            <span>{{ row.maxDosage || '—' }}</span>
            <span>{{ row.functionInUse || '—' }}</span>
            <span class="muted">{{ row.note || row.remark || '' }}</span>
          </div>
        </div>
      </section>

      <p v-else-if="classification.additives.length" class="hint">点击上方任一添加剂查看 GB 限量明细。</p>
    </main>

    <main v-else class="ia-main">
      <p class="muted">未找到识读结果，可能已过期。<button class="link-btn" @click="goHome">回到上传页</button></p>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { additiveAPI } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const resultId = route.params.id

const result = ref(null)
const classification = reactive({
  mainIngredients: [],
  auxiliaryIngredients: [],
  additives: []
})
const selected = ref(null)
const limits = ref([])
const limitsLoading = ref(false)

const goBack = () => router.push(`/result/${resultId}`)
const goHome = () => router.push('/')

/** 从识读结果中尽可能提取配料字符串数组 */
const extractIngredients = (r) => {
  if (!r) return []
  const cands = r.ingredientsList || r.ingredients || r.batching || []
  return cands
    .map((x) => typeof x === 'string' ? x : (x?.name || x?.ingredient || x?.text || ''))
    .filter(Boolean)
}

const selectAdditive = async (a) => {
  selected.value = a
  limits.value = []
  limitsLoading.value = true
  try {
    const res = await additiveAPI.getLimits(a.name)
    if (res.code === 200) {
      limits.value = res.data || []
    } else {
      ElMessage.error(res.message || '查询限量明细失败')
    }
  } catch (e) {
    // axios 拦截器已弹错误，这里只清状态
  } finally {
    limitsLoading.value = false
  }
}

onMounted(async () => {
  const store = JSON.parse(localStorage.getItem('scanResults') || '{}')
  result.value = store[resultId] || null
  if (!result.value) return

  const ingredients = extractIngredients(result.value)
  if (!ingredients.length) {
    ElMessage.warning('当前识读结果未包含配料表')
    return
  }

  try {
    const res = await additiveAPI.classify(ingredients)
    if (res.code === 200 && res.data) {
      classification.mainIngredients = res.data.mainIngredients || []
      classification.auxiliaryIngredients = res.data.auxiliaryIngredients || []
      classification.additives = res.data.additives || []
    }
  } catch (e) {
    /* 拦截器已弹 */
  }
})
</script>

<style scoped>
.ia-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--w-space-7) var(--w-space-6) var(--w-space-9);
}

.ia-hero { text-align: center; padding: var(--w-space-3) 0 var(--w-space-6); position: relative; }
.ia-hero__eyebrow { display: flex; align-items: center; justify-content: center; gap: 14px; color: var(--w-amber); margin-bottom: var(--w-space-4); }
.ia-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.ia-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }
.ia-hero__title { font-family: var(--w-font-serif); font-size: var(--w-fs-h1); font-weight: 500; color: var(--w-ink); letter-spacing: 0.1em; margin-bottom: var(--w-space-3); }
.ia-hero__sub { color: var(--w-ink-mid); font-size: 14px; line-height: 1.8; letter-spacing: 0.05em; }

.back-btn {
  position: absolute; top: 0; left: 0;
  font-family: var(--w-font-serif); font-size: 13px;
  color: var(--w-ink-mid); padding: 6px 14px;
  border: 1px solid var(--w-border-soft); border-radius: var(--w-radius-full);
  background: transparent; transition: all 0.2s var(--w-ease);
}
.back-btn:hover { color: var(--w-primary); border-color: var(--w-primary); }

.ia-main { display: flex; flex-direction: column; gap: var(--w-space-6); }

.parch-card {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-xl);
  padding: var(--w-space-6) var(--w-space-7);
  box-shadow: var(--w-shadow-sm);
}

.card-title { font-family: var(--w-font-serif); font-size: 22px; color: var(--w-ink); letter-spacing: 0.08em; margin-bottom: 6px; }
.card-sub { color: var(--w-ink-mid); font-size: 13px; margin-bottom: var(--w-space-5); letter-spacing: 0.04em; }

.bucket-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: var(--w-space-4);
}
@media (max-width: 720px) { .bucket-grid { grid-template-columns: 1fr; } }

.bucket {
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-md);
  padding: var(--w-space-4); background: var(--w-surface-2);
}
.bucket__head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--w-space-3); padding-bottom: 8px; border-bottom: 1px dashed var(--w-divider); }
.bucket__label { font-family: var(--w-font-serif); font-size: 15px; letter-spacing: 0.12em; color: var(--w-ink); }
.bucket__count { color: var(--w-amber); font-weight: 500; }
.bucket--main .bucket__label { color: var(--w-sage); }
.bucket--aux  .bucket__label { color: var(--w-amber); }
.bucket--add  .bucket__label { color: var(--w-terracotta); }

.bucket__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.bucket__list li { font-size: 13.5px; color: var(--w-ink); line-height: 1.6; }
.bucket__list .empty { color: var(--w-ink-mute); font-style: italic; }

.addi-tag {
  background: transparent; border: 1px solid var(--w-border-soft);
  padding: 4px 10px; border-radius: var(--w-radius-sm);
  font-size: 13px; color: var(--w-ink); cursor: pointer;
  transition: all 0.15s var(--w-ease);
}
.addi-tag:hover { border-color: var(--w-terracotta); color: var(--w-terracotta); }
.addi-tag.active { background: var(--w-terracotta); color: #fff; border-color: var(--w-terracotta); }

.kv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px var(--w-space-5); margin-bottom: var(--w-space-3); }
@media (max-width: 600px) { .kv-grid { grid-template-columns: 1fr; } }
.kv-row { display: flex; gap: 10px; padding: 4px 0; border-bottom: 1px dashed var(--w-divider); }
.kv-label { color: var(--w-ink-mid); font-size: 13px; min-width: 5em; }
.kv-value { color: var(--w-ink); font-size: 13.5px; flex: 1; }
.kv-value.risk { color: var(--w-terracotta); font-weight: 500; }

.safety-desc { color: var(--w-ink-mid); font-size: 13px; line-height: 1.85; margin: var(--w-space-3) 0 var(--w-space-5); padding: 12px; background: var(--w-surface-2); border-left: 3px solid var(--w-amber); border-radius: var(--w-radius-sm); }

.sub-title { font-family: var(--w-font-serif); font-size: 16px; letter-spacing: 0.1em; color: var(--w-ink); margin: var(--w-space-4) 0 var(--w-space-3); }

.limit-table { display: flex; flex-direction: column; border: 1px solid var(--w-border-soft); border-radius: var(--w-radius-sm); overflow: hidden; }
.limit-row { display: grid; grid-template-columns: 90px 1.6fr 1fr 1.2fr 1.2fr; gap: 12px; padding: 8px 12px; font-size: 12.5px; align-items: start; border-bottom: 1px dashed var(--w-divider); }
.limit-row:last-child { border-bottom: none; }
.limit-row--head { background: var(--w-surface-2); font-family: var(--w-font-serif); font-size: 12px; letter-spacing: 0.12em; color: var(--w-ink-mid); border-bottom: 1px solid var(--w-border-soft); }
.mono { font-family: ui-monospace, Menlo, Consolas, monospace; color: var(--w-ink-mid); }

.muted { color: var(--w-ink-mute); font-size: 13px; padding: 8px 0; }
.hint { color: var(--w-ink-mid); font-size: 13px; text-align: center; padding: var(--w-space-3) 0; }
.link-btn { color: var(--w-primary); text-decoration: underline dotted; font-size: 13px; padding: 0 4px; }
</style>
