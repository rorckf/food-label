<template>
  <div class="result-page">
    <!-- 浮动返回按钮 -->
    <button class="home-fab" @click="goToUpload" aria-label="返回首页">
      <Home :size="18" />
    </button>

    <!-- 操作栏（不进入截图） -->
    <div v-if="result" class="action-bar">
      <!-- 保质期状态 -->
      <span
        v-if="shelfLife && shelfLife.status !== 'UNKNOWN'"
        class="status-chip"
        :class="`status-chip--${shelfLifeLevel}`"
        :title="shelfLife.expiryDate ? `到期日 ${shelfLife.expiryDate}` : ''"
      >
        <Clock3 :size="13" /> {{ shelfLife.message }}
      </span>
      <!-- 用户过敏原命中告警 -->
      <button
        v-if="userAllergenHits.length"
        class="status-chip status-chip--danger status-chip--btn"
        :title="`点击修改你的过敏原偏好`"
        @click="navigateToPreferences"
      >
        <ShieldAlert :size="13" /> 含 {{ userAllergenHits.join('、') }}
      </button>
      <span class="action-bar__spacer"></span>
      <button
        class="fav-btn"
        :class="{ 'fav-btn--active': isFavorite }"
        :disabled="favBusy"
        @click="toggleFavorite"
        :title="isFavorite ? '取消收藏' : '加入收藏'"
      >
        <Star :size="14" :fill="isFavorite ? 'currentColor' : 'none'" />
        {{ isFavorite ? '已收藏' : '收藏' }}
      </button>
      <button
        v-if="dbRecordId"
        class="fav-btn fav-btn--danger"
        :disabled="deleteBusy"
        @click="deleteRecord"
        title="删除该记录"
      >
        <Trash2 :size="14" /> 删除
      </button>
      <ShareActions :result="result" :get-target="() => shareTargetEl" />
      <button
        class="fav-btn"
        @click="shareModalVisible = true"
        title="分享给家人"
      >
        <Send :size="14" /> 分享给家人
      </button>
    </div>

    <!-- 社交分享卡（含寄语 / 判决 / 证据 / 品牌 + 二维码） -->
    <ShareCardModal
      v-model:visible="shareModalVisible"
      :card-props="shareCardProps"
      :sender-name="sharerName"
    />

    <!-- 截图区：包含产品标题 + 全部解读卡片 -->
    <div class="share-frame" ref="shareTargetEl">
      <header class="share-frame__hero">
        <h2 class="share-frame__brand">食安慧眼 · 食品标签解读</h2>
        <p class="share-frame__product">{{ result?.productName || '未知产品' }}</p>
        <p class="share-frame__time">{{ formatScanTime(result?.scanTime) }}</p>
      </header>

      <main class="result-main">
      <div class="cards-grid" :class="{ squeezing: isSqueezing }">
        <!-- 原始标签卡 -->
        <article v-if="result?.imageUrl" class="parch-card label-card">
          <header class="parch-card__head">
            <span class="parch-card__ornament">❖</span>
            <h3 class="parch-card__title">原始标签</h3>
          </header>
          <div class="parch-card__body label-card__body">
            <el-image
              :src="result.imageUrl"
              :preview-src-list="[result.imageUrl]"
              :preview-teleported="true"
              fit="contain"
              class="label-card__img"
              alt="原始标签照片"
            >
              <template #error>
                <div class="label-card__fallback">图片加载失败</div>
              </template>
            </el-image>
          </div>
        </article>

        <!-- 产品速览卡 -->
        <article class="parch-card">
          <header class="parch-card__head">
            <span class="parch-card__ornament">❖</span>
            <h3 class="parch-card__title">产品速览</h3>
          </header>
          <div class="parch-card__body">
            <div class="kv-row">
              <span class="kv-label">品名</span>
              <span class="kv-value">{{ result?.productName || '—' }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-label">净含量</span>
              <span class="kv-value">{{ cleanField(result?.netContent ?? result?.netWeight) }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-label">产品类型</span>
              <span class="kv-value">
                {{ cleanCategory(result?.category ?? result?.foodCategory) }}
                <span v-if="categoryFromStandard" class="kv-mark" title="由执行标准代号反查">标准码</span>
              </span>
            </div>
            <div v-if="shelfLife && shelfLife.status !== 'UNKNOWN'" class="kv-row">
              <span class="kv-label">保质期</span>
              <span class="kv-value">
                <span class="status-chip" :class="`status-chip--${shelfLifeLevel}`">
                  {{ shelfLife.message }}
                </span>
                <span v-if="shelfLife.expiryDate" class="kv-sub">到期 {{ shelfLife.expiryDate }}</span>
              </span>
            </div>
            <div class="more-link">
              <button class="link-btn" @click="navigateToProductDetails">
                <Info :size="14" /> 了解更多（厂商 · 合规） →
              </button>
            </div>
          </div>
        </article>

        <!-- 配料透明卡 -->
        <article class="parch-card">
          <header class="parch-card__head">
            <span class="parch-card__ornament">❖</span>
            <h3 class="parch-card__title">配料透明</h3>
          </header>
          <div class="parch-card__body">
            <div v-if="classifyLoading" class="muted">配料分析中…</div>
            <div v-else-if="classification.mainIngredients.length || classification.auxiliaryIngredients.length || classification.additives.length">
              <el-tabs v-model="activeIngredientTab" class="ing-tabs">
                <el-tab-pane label="主料" name="main">
                  <ul class="ing-list">
                    <li v-for="(n, i) in classification.mainIngredients" :key="'m'+i">{{ n }}</li>
                    <li v-if="!classification.mainIngredients.length" class="muted">—</li>
                  </ul>
                </el-tab-pane>
                <el-tab-pane :label="`辅料 (${classification.auxiliaryIngredients.length})`" name="aux">
                  <ul class="ing-list">
                    <li v-for="(n, i) in classification.auxiliaryIngredients" :key="'a'+i">{{ n }}</li>
                    <li v-if="!classification.auxiliaryIngredients.length" class="muted">—</li>
                  </ul>
                </el-tab-pane>
                <el-tab-pane :label="`添加剂 (${classification.additives.length})`" name="add">
                  <div class="add-tags">
                    <button
                      v-for="(a, i) in classification.additives"
                      :key="'x'+i"
                      class="chip chip--additive chip--clickable"
                      @click="openAdditive(a)"
                    >{{ a.name }}</button>
                    <span v-if="!classification.additives.length" class="muted">未检测到添加剂</span>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
            <div v-else-if="result?.ingredientsText" class="ingredients-text">
              {{ result.ingredientsText }}
            </div>
            <ul v-else class="ingredients-list">
              <li
                v-for="(ingredient, index) in (result?.ingredientsList || result?.ingredients || result?.batching || [])"
                :key="index"
                class="ingredient-item"
              >
                <span class="ingredient-name">{{ ingredient.name || ingredient.raw_material || ingredient }}</span>
              </li>
            </ul>

            <!-- 致敏原（结构化：明确含 / 可能含；命中用户偏好用红框） -->
            <div v-if="hasAllergenInfo" class="allergen-block">
              <div v-if="allergens.contains.length" class="allergen-line">
                <span class="chip chip--warn">⚠ 含</span>
                <span class="allergen-tags">
                  <span
                    v-for="t in allergens.contains"
                    :key="'c'+t"
                    class="atag"
                    :class="{ 'atag--hit': userAllergenHits.includes(t) }"
                  >{{ t }}</span>
                </span>
              </div>
              <div v-if="allergens.mayContain.length" class="allergen-line">
                <span class="chip chip--mute">同线加工</span>
                <span class="allergen-tags">
                  <span
                    v-for="t in allergens.mayContain"
                    :key="'m'+t"
                    class="atag atag--mute"
                    :class="{ 'atag--hit': userMayContainHits.includes(t) }"
                  >{{ t }}</span>
                </span>
              </div>
              <button
                v-if="!userAllergens.length"
                class="allergen-cta"
                @click="navigateToPreferences"
              >设置我的过敏原 →</button>
            </div>

            <div class="analysis-link">
              <button class="link-btn" @click="navigateToIngredientsAnalysis">
                <List :size="14" /> 查看 GB 2760 限量明细 →
              </button>
            </div>
          </div>
        </article>

        <AdditiveDetailDialog
          v-model:visible="additiveDialogVisible"
          :additive-info="selectedAdditive"
        />

        <!-- 大白话点评卡（AI 翻译） -->
        <article class="parch-card">
          <header class="parch-card__head">
            <span class="parch-card__ornament">❖</span>
            <h3 class="parch-card__title">大白话点评</h3>
          </header>
          <div class="parch-card__body">
            <transition name="nutri-fade" mode="out-in">
              <div v-if="plainTalkLoading" key="loading" class="plain-talk plain-talk--loading">
                <Sparkles :size="15" class="plain-talk__spark" /> AI 正在用大白话点评中…
              </div>
              <div v-else-if="plainTalk" key="text" class="plain-talk">{{ plainTalk }}</div>
              <p v-else key="empty" class="muted plain-talk__hint">
                让 AI 把这一长串配料和营养，用一句大白话给你讲明白 👇
              </p>
            </transition>
            <div class="plain-talk__actions">
              <button class="link-btn" :disabled="plainTalkLoading" @click="generatePlainTalk">
                <Sparkles :size="14" />
                {{ plainTalkLoading ? 'AI 思考中…' : (plainTalk ? '重新生成' : '一键翻译成人话') }}
              </button>
            </div>
          </div>
        </article>

        <!-- 营养事实卡 -->
        <article class="parch-card">
          <header class="parch-card__head">
            <span class="parch-card__ornament">❖</span>
            <h3 class="parch-card__title">营养事实</h3>
          </header>
          <div class="parch-card__body">
            <div class="nutrition-block">
              <!-- 左右切换：每100g / 每份 -->
              <div class="nutri-switch" role="tablist">
                <button
                  type="button"
                  role="tab"
                  :aria-selected="nutritionMode === 'per100g'"
                  class="nutri-switch__btn"
                  :class="{ 'is-active': nutritionMode === 'per100g' }"
                  @click="nutritionMode = 'per100g'"
                >
                  <ChevronLeft :size="14" /> 每 100g
                </button>
                <button
                  type="button"
                  role="tab"
                  :aria-selected="nutritionMode === 'perServing'"
                  class="nutri-switch__btn"
                  :class="{ 'is-active': nutritionMode === 'perServing' }"
                  :disabled="!servingWeight"
                  :title="servingWeight ? '' : '净含量未识别，无法计算每份'"
                  @click="nutritionMode = 'perServing'"
                >
                  每份{{ servingWeight ? `（${servingWeight}g）` : '' }} <ChevronRight :size="14" />
                </button>
              </div>

              <transition name="nutri-fade" mode="out-in">
                <div class="nutri-table" :class="{ 'nutri-table--no-nrv': nutritionMode === 'perServing' }" :key="nutritionMode">
                  <div v-for="n in nutrientDefs" :key="n.key" class="nutri-row">
                    <span class="nutri-name">{{ n.label }}</span>
                    <span class="nutri-value">{{ getDisplayedValue(n.key) }}</span>
                    <span class="nutri-unit">{{ n.unit }}</span>
                    <span v-if="nutritionMode === 'per100g'" class="nutri-nrv">NRV {{ getNRVPercentage(n.key) }}%</span>
                  </div>
                </div>
              </transition>

              <div ref="radarChartEl" class="nutri-radar"></div>
            </div>
          </div>
        </article>

        <!-- 健康评估卡 -->
        <article v-if="hasHealthTips" class="parch-card health-card">
          <header class="parch-card__head">
            <span class="parch-card__ornament">❖</span>
            <h3 class="parch-card__title">健康评估</h3>
          </header>
          <div class="parch-card__body">
            <!-- NRV 三级评级 -->
            <div v-if="nutritionTips.length" class="health-block">
              <h4 class="block-title">营养摄入评级（GB 28050-2025 NRV）</h4>
              <div class="rating-table">
                <div
                  v-for="t in nutritionTips"
                  :key="t.name"
                  class="rating-row"
                  :class="`rating-row--${levelKey(t.level)}`"
                >
                  <span class="rating-name">{{ t.name }}</span>
                  <span class="rating-pct">{{ t.percentage != null ? t.percentage + '%' : '—' }}</span>
                  <span class="rating-badge" :class="`rating-badge--${levelKey(t.level)}`">{{ t.level }}</span>
                  <span class="rating-text">{{ t.text }}</span>
                </div>
              </div>
            </div>

            <!-- 添加剂疾病禁忌风险卡片 -->
            <div v-if="additiveRiskTips.length" class="health-block">
              <h4 class="block-title">添加剂风险提示</h4>
              <ul class="risk-list">
                <li v-for="(t, i) in additiveRiskTips" :key="'r'+i" class="risk-card">
                  <span class="risk-icon">⚠</span>
                  <span class="risk-text">{{ t.text }}</span>
                </li>
              </ul>
            </div>
          </div>
        </article>

      </div>
    </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Home, List, Star, ChevronLeft, ChevronRight, Info, ShieldAlert, Clock3, Trash2, Send, Sparkles } from 'lucide-vue-next'
import * as echarts from 'echarts'
import { additiveAPI, historyAPI, recognizeAPI } from '@/utils/api'
import AdditiveDetailDialog from '@/components/dialogs/AdditiveDetailDialog.vue'
import ShareActions from '@/components/ShareActions.vue'
import ShareCardModal from '@/components/ShareCardModal.vue'

const router = useRouter()
const route = useRoute()

const resultId = route.params.id
const result = ref(null)
const isSqueezing = ref(false)
const shareTargetEl = ref(null)
const radarChartEl = ref(null)
let radarChart = null

/* ── 收藏 ── */
const isFavorite = ref(false)
const favBusy = ref(false)
const dbRecordId = computed(() => {
  // resultId 优先取后端返回的 id（数字字符串），无效时不可收藏
  const n = Number(resultId)
  return Number.isFinite(n) && n > 0 ? n : null
})

/* ── 删除当前记录 ── */
const deleteBusy = ref(false)
const deleteRecord = async () => {
  if (!dbRecordId.value) return
  try {
    await ElMessageBox.confirm(
      `确定要删除「${result.value?.productName || '该记录'}」吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch { return /* 用户取消 */ }

  deleteBusy.value = true
  try {
    const res = await historyAPI.deleteHistory(dbRecordId.value)
    if (res.code === 200) {
      // 同步清掉本地缓存，避免列表刷新时回填
      try {
        const stored = JSON.parse(localStorage.getItem('scanResults') || '{}')
        delete stored[resultId]
        localStorage.setItem('scanResults', JSON.stringify(stored))
      } catch { /* 忽略 */ }
      ElMessage.success('删除成功')
      router.push('/history')
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) { /* 拦截器已弹错 */ }
  finally { deleteBusy.value = false }
}

const toggleFavorite = async () => {
  if (!dbRecordId.value) {
    ElMessage.warning('当前结果未关联到历史记录，无法收藏')
    return
  }
  favBusy.value = true
  try {
    const res = await historyAPI.toggleFavorite(dbRecordId.value)
    if (res.code === 200) {
      isFavorite.value = res.data?.isFavorite === 1
      ElMessage.success(isFavorite.value ? '已加入收藏' : '已取消收藏')
    }
  } catch (e) { /* 拦截器 */ }
  finally { favBusy.value = false }
}

/* ── 营养雷达图 ── */
const renderRadar = () => {
  if (!radarChartEl.value || !result.value) return
  if (!radarChart) radarChart = echarts.init(radarChartEl.value)
  const pct = (k) => Number(getNRVPercentage(k)) || 0
  radarChart.setOption({
    color: ['#B5632A'],
    tooltip: { trigger: 'item', formatter: (p) => p.value.map((v, i) => `${p.name}: ${nutrientDefs[i].label} ${v}%`).join('<br>') },
    radar: {
      indicator: nutrientDefs.map((n) => ({ name: `${n.label}\nNRV%`, max: 100 })),
      axisName: { color: '#7B6E5B', fontSize: 11 },
      splitArea: {
        show: true,
        areaStyle: { color: ['rgba(127,159,127,0.06)', 'rgba(200,134,58,0.08)', 'rgba(193,86,55,0.10)'] }
      },
      splitLine: { lineStyle: { color: '#E5DCC8' } },
      axisLine: { lineStyle: { color: '#E5DCC8' } }
    },
    series: [{
      type: 'radar',
      name: 'NRV 百分比',
      areaStyle: { opacity: 0.35 },
      lineStyle: { width: 2 },
      symbol: 'circle',
      symbolSize: 6,
      data: [{
        value: nutrientDefs.map((n) => pct(n.key)),
        name: result.value?.productName || '本产品'
      }]
    }]
  })
}

const handleResize = () => radarChart && radarChart.resize()
watch(() => result.value?.nutrition, () => nextTick(renderRadar), { deep: true })
onUnmounted(() => {
  radarChart?.dispose()
  window.removeEventListener('resize', handleResize)
})

const nrvStandards = {
  energy: 8400, protein: 60, fat: 60, carb: 300, sodium: 2000
}

const nutrientDefs = [
  { key: 'energy',  label: '能量',       unit: 'kcal' },
  { key: 'protein', label: '蛋白质',     unit: 'g' },
  { key: 'fat',     label: '脂肪',       unit: 'g' },
  { key: 'carb',    label: '碳水化合物', unit: 'g' },
  { key: 'sodium',  label: '钠',         unit: 'mg' },
]

const formatScanTime = (s) => {
  if (!s) return new Date().toISOString().slice(0, 10).replace(/-/g, '/')
  return String(s).replace('T', ' ').slice(0, 16).replace(/-/g, '/')
}

const cleanField = (v) => {
  if (!v) return '—'
  if (v.includes && (v.includes('见背面') || v.includes('空白处'))) return '—'
  return v
}

const cleanCategory = (v) => {
  const c = cleanField(v)
  return c === '食品类别' ? '—' : c
}

const hasAdditives = computed(() => {
  const ingredients = result.value?.ingredientsList || result.value?.ingredients || result.value?.batching || []
  return ingredients.some(i => i.isAdditive || i.additive || i.is_additive)
})

const getAdditiveTypes = () => {
  const ingredients = result.value?.ingredientsList || result.value?.ingredients || result.value?.batching || []
  const types = new Set()
  ingredients.forEach(i => {
    if (i.isAdditive || i.additive || i.is_additive) {
      types.add(i.function || i.type || i.role || '其他')
    }
  })
  return Array.from(types).join('、') || '无'
}

const getNutrientValue = (k) => {
  const n = result.value?.nutrition
  if (!n) return 0
  const map = {
    energy:  n.energy  ?? n.energyPer100g  ?? 0,
    protein: n.protein ?? n.proteinPer100g ?? 0,
    fat:     n.fat     ?? n.fatPer100g     ?? 0,
    carb:    n.carb    ?? n.carbPer100g    ?? 0,
    sodium:  n.sodium  ?? n.sodiumPer100g  ?? 0,
  }
  return map[k] ?? 0
}

const getNRVPercentage = (k) => {
  const v = getNutrientValue(k)
  const s = nrvStandards[k] || 1
  const p = (v / s) * 100
  return p > 0 ? p.toFixed(1) : 0
}

const calculatePackageNutrient = (k) => {
  const w = servingWeight.value
  if (!w) return 0
  const per100 = getNutrientValue(k)
  return ((per100 * w) / 100).toFixed(1)
}

/* ── 营养事实左右切换：每100g / 每份 ── */
const nutritionMode = ref('per100g')

const servingWeight = computed(() => {
  const raw = result.value?.netContent ?? result.value?.netWeight
  if (!raw || String(raw).includes('见背面') || String(raw).includes('空白处')) return 0
  const m = String(raw).match(/(\d+(\.\d+)?)\s*(g|克|ml|毫升)/i)
  return m ? parseFloat(m[1]) : 0
})

const getDisplayedValue = (k) => {
  return nutritionMode.value === 'perServing'
    ? calculatePackageNutrient(k)
    : getNutrientValue(k)
}

watch(servingWeight, (w) => {
  if (!w && nutritionMode.value === 'perServing') nutritionMode.value = 'per100g'
})

const goToUpload = () => router.push('/')
const navigateToIngredientsAnalysis = () => router.push(`/ingredients-analysis/${resultId}`)
const navigateToProductDetails = () => router.push(`/product-details/${resultId}`)
const navigateToPreferences = () => router.push('/preferences')

/* ── 保质期 / 致敏原 / 标准码品类（后端 #1/#3/#5） ── */
const userAllergens = ref([])
try {
  userAllergens.value = JSON.parse(localStorage.getItem('userAllergens') || '[]')
} catch { userAllergens.value = [] }

const shelfLife = computed(() => result.value?.shelfLifeStatus || null)
const shelfLifeLevel = computed(() => {
  const s = shelfLife.value?.status
  if (s === 'EXPIRED')  return 'danger'
  if (s === 'EXPIRING') return 'warn'
  if (s === 'VALID')    return 'safe'
  return 'unknown'
})

const allergens = computed(() => {
  const a = result.value?.allergens || {}
  return {
    contains:   Array.isArray(a.contains)   ? a.contains   : [],
    mayContain: Array.isArray(a.mayContain) ? a.mayContain : [],
  }
})
const userAllergenHits = computed(() => {
  const set = new Set(userAllergens.value)
  return allergens.value.contains.filter(t => set.has(t))
})
const userMayContainHits = computed(() => {
  const set = new Set(userAllergens.value)
  return allergens.value.mayContain.filter(t => set.has(t))
})
const hasAllergenInfo = computed(() =>
  allergens.value.contains.length > 0 || allergens.value.mayContain.length > 0
)

const categoryFromStandard = computed(() => result.value?.categoryFromStandard || null)

const triggerSqueeze = () => {
  isSqueezing.value = true
  setTimeout(() => { isSqueezing.value = false }, 200)
}

/* ── 健康评估（NRV 评级 + 添加剂风险） ── */
const NUTRIENT_NAMES = new Set(['能量', '蛋白质', '脂肪', '碳水化合物', '钠'])

const nutritionTips = computed(() => {
  const tips = result.value?.healthTips || []
  return tips.filter((t) => NUTRIENT_NAMES.has(t.name))
})

const additiveRiskTips = computed(() => {
  const tips = result.value?.healthTips || []
  return tips.filter((t) => !NUTRIENT_NAMES.has(t.name))
})

const hasHealthTips = computed(
  () => nutritionTips.value.length > 0 || additiveRiskTips.value.length > 0
)

const levelKey = (level) => {
  if (level === '偏高') return 'high'
  if (level === '适中') return 'mid'
  if (level === '偏低') return 'low'
  return 'mid'
}

/* ── 社交分享卡（ShareCardModal）的入参派生 ── */
const shareModalVisible = ref(false)

const sharerName = computed(() => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}')
    return u.username || '我'
  } catch (e) { return '我' }
})

const shareCardLevel = computed(() => {
  const high = nutritionTips.value.filter(t => t.level === '偏高').length
  const risk = additiveRiskTips.value.length
  if (high >= 2 || risk >= 3) return 'avoid'
  if (high >= 1 || risk >= 1) return 'caution'
  return 'safe'
})

const shareCardEvidence = computed(() => {
  const n = result.value?.nutrition || {}
  const all = [
    { key: '能量',     name: '能量',   value: n.energy ?? '-',                 unit: 'kcal' },
    { key: '蛋白质',   name: '蛋白质', value: n.protein ?? '-',                unit: 'g' },
    { key: '脂肪',     name: '脂肪',   value: n.fat ?? '-',                    unit: 'g' },
    { key: '碳水化合物', name: '碳水', value: n.carbohydrate ?? n.carb ?? '-', unit: 'g' },
    { key: '钠',       name: '钠',     value: n.sodium ?? '-',                 unit: 'mg' },
  ]
  // 优先选有评级的 3 项；不足时按默认顺序补齐
  const ranked = [...all].sort((a, b) => {
    const ta = nutritionTips.value.find(t => t.name === a.key)
    const tb = nutritionTips.value.find(t => t.name === b.key)
    const w = (lv) => (lv === '偏高' ? 0 : lv === '偏低' ? 1 : lv === '适中' ? 2 : 3)
    return w(ta?.level) - w(tb?.level)
  })
  return ranked.slice(0, 3).map(it => {
    const tip = nutritionTips.value.find(t => t.name === it.key)
    const tone = tip?.level === '偏高' ? 'high' : tip?.level === '偏低' ? 'low' : 'mid'
    const hint = tip?.level ? `${tip.level} · NRV ${tip.percentage ?? '-'}%` : '每 100g'
    return { name: it.name, value: it.value, unit: it.unit, hint, tone }
  })
})

const shareCardReason = computed(() => {
  const t = nutritionTips.value.find(x => x.level === '偏高')
         || additiveRiskTips.value[0]
         || nutritionTips.value[0]
  return t?.text || '整体配比尚可，按需选择即可。'
})

const shareCardProps = computed(() => ({
  mode: 'verdict',
  level: shareCardLevel.value,
  productName: result.value?.productName || '未知产品',
  productSub: result.value?.brand || result.value?.category || '',
  reason: shareCardReason.value,
  evidence: shareCardEvidence.value,
}))

/* ── 配料三分类 + 添加剂弹窗 ── */
const classification = reactive({
  mainIngredients: [],
  auxiliaryIngredients: [],
  additives: []
})
const classifyLoading = ref(false)
const activeIngredientTab = ref('main')
const additiveDialogVisible = ref(false)
const selectedAdditive = ref(null)

const openAdditive = (a) => {
  selectedAdditive.value = a
  additiveDialogVisible.value = true
}

const extractIngredientNames = (r) => {
  if (!r) return []
  const cands = r.ingredientsList || r.ingredients || r.batching || []
  return cands
    .map((x) => typeof x === 'string' ? x : (x?.name || x?.raw_material || x?.ingredient || x?.text || ''))
    .filter(Boolean)
}

const runClassify = async () => {
  const ingredients = extractIngredientNames(result.value)
  if (!ingredients.length) return
  classifyLoading.value = true
  try {
    const res = await additiveAPI.classify(ingredients)
    if (res.code === 200 && res.data) {
      classification.mainIngredients = res.data.mainIngredients || []
      classification.auxiliaryIngredients = res.data.auxiliaryIngredients || []
      classification.additives = res.data.additives || []
    }
  } catch (e) { /* 拦截器已弹错 */ }
  finally { classifyLoading.value = false }
}

/* ── 大白话点评（AI 翻译配料表）── */
const plainTalk = ref('')
const plainTalkLoading = ref(false)

const generatePlainTalk = async () => {
  if (plainTalkLoading.value || !result.value) return
  plainTalkLoading.value = true
  try {
    const r = result.value
    const n = r.nutrition || {}
    const payload = {
      productName: r.productName || '',
      category: r.category || r.foodCategory || '',
      ingredients: extractIngredientNames(r),
      additives: (classification.additives || []).map(a => a.name).filter(Boolean),
      energy: n.energy ?? null,
      protein: n.protein ?? null,
      fat: n.fat ?? null,
      carbohydrate: n.carbohydrate ?? n.carb ?? null,
      sodium: n.sodium ?? null,
    }
    const res = await recognizeAPI.explain(payload)
    if (res.code === 200 && res.data) {
      plainTalk.value = res.data
    } else {
      ElMessage.error(res.message || '翻译失败，请稍后重试')
    }
  } catch (e) { /* 拦截器已弹错 */ }
  finally { plainTalkLoading.value = false }
}

const fetchFromHistory = async () => {
  if (!dbRecordId.value) return null
  try {
    const res = await historyAPI.getHistoryDetail(dbRecordId.value)
    if (res.code === 200 && res.data) {
      const d = res.data
      // 扁平化：把 detail（RecognitionResultVO）里的字段提到外层，与 Upload 写入 scanResults 的结构对齐
      return {
        ...(d.detail || {}),
        id: d.id,
        productName: d.productName || d.detail?.productName,
        imageUrl: d.imageUrl || d.detail?.imageUrl,
        scanTime: typeof d.createTime === 'string' ? d.createTime : new Date().toISOString(),
        isFavoriteFromServer: d.isFavorite === 1
      }
    }
  } catch (e) { /* 拦截器 */ }
  return null
}

onMounted(async () => {
  const storedResults = JSON.parse(localStorage.getItem('scanResults') || '{}')
  result.value = storedResults[resultId] || null

  // 缓存未命中（典型场景：从历史/收藏跳进来），从后端拉
  if (!result.value) {
    result.value = await fetchFromHistory()
    if (result.value) {
      // 写回 localStorage，下次免拉
      storedResults[resultId] = result.value
      localStorage.setItem('scanResults', JSON.stringify(storedResults))
      if (result.value.isFavoriteFromServer) isFavorite.value = true
    }
  }

  if (!result.value) {
    ElMessage.error('未找到识读结果')
    router.push('/')
    return
  }
  triggerSqueeze()
  runClassify()
  await nextTick()
  renderRadar()
  window.addEventListener('resize', handleResize)

  // 同步收藏状态：从历史列表里查这条 id
  if (dbRecordId.value) {
    try {
      const res = await historyAPI.getHistoryList()
      if (res.code === 200) {
        const rec = (res.data || []).find((r) => r.id === dbRecordId.value)
        if (rec) isFavorite.value = rec.isFavorite === 1
      }
    } catch (e) { /* 拦截器 */ }
  }
})
</script>

<style scoped>
.result-page {
  max-width: var(--w-content-max);
  margin: 0 auto;
  padding: var(--w-space-4) var(--w-space-5) var(--w-space-7);
}

/* ── 浮动返回 ── */
.home-fab {
  position: fixed;
  bottom: 32px; right: 32px;
  width: 52px; height: 52px;
  border-radius: 50%;
  background: var(--w-primary);
  color: var(--w-surface);
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--w-shadow-md);
  transition: all 0.25s var(--w-ease);
  z-index: 900;
}
.home-fab:hover {
  background: var(--w-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--w-shadow-lg);
}

/* ── 卡片网格 ── */
.result-main { margin-top: var(--w-space-3); }

.cards-grid {
  display: grid;
  /* 自动列数：每列最少 320px，宽屏自然变 3 列、窄屏 1 列 */
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--w-space-3);
}

.cards-grid.squeezing .parch-card { transform: scale(0.98); }

/* ── 羊皮纸卡（紧凑） ── */
.parch-card {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  padding: var(--w-space-3) var(--w-space-4);
  box-shadow: var(--w-shadow-sm);
  opacity: 0;
  transform: translateY(14px);
  animation: w-fade-up 0.55s var(--w-ease-out) forwards;
  transition: transform 0.25s var(--w-ease), box-shadow 0.25s var(--w-ease);
  display: flex;
  flex-direction: column;
  position: relative;
}
.parch-card::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px dashed var(--w-divider);
  border-radius: calc(var(--w-radius-lg) - 6px);
  pointer-events: none;
}
.parch-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--w-shadow-md);
}
.parch-card:nth-child(1) { animation-delay: 0s; }
.parch-card:nth-child(2) { animation-delay: 0.08s; }
.parch-card:nth-child(3) { animation-delay: 0.16s; }
.parch-card:nth-child(4) { animation-delay: 0.24s; }

@keyframes w-fade-up {
  to { opacity: 1; transform: translateY(0); }
}

.parch-card__head {
  display: flex; align-items: center; gap: 8px;
  padding-bottom: 8px;
  margin-bottom: var(--w-space-2);
  border-bottom: 1px solid var(--w-divider);
  position: relative;
  z-index: 1;
}
.parch-card__ornament {
  color: var(--w-amber);
  font-size: 13px;
}
.parch-card__title {
  font-family: var(--w-font-serif);
  font-size: 16px;
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.08em;
  margin: 0;
}

.parch-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--w-space-2);
  position: relative;
  z-index: 1;
}

/* ── KV 行 ── */
.kv-row {
  display: flex;
  justify-content: space-between;
  gap: var(--w-space-3);
  align-items: baseline;
  padding: 6px 0;
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

/* ── 配料 ── */
.ingredients-text {
  font-size: 14px;
  color: var(--w-ink);
  line-height: 1.9;
  letter-spacing: 0.03em;
  background: var(--w-primary-pale);
  border-radius: var(--w-radius-sm);
  padding: var(--w-space-3) var(--w-space-4);
}
.ingredients-list {
  list-style: none;
  padding: 0; margin: 0;
  display: flex; flex-direction: column;
  max-height: 260px;
  overflow-y: auto;
}
.ingredient-item {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 0;
  border-bottom: 1px dotted var(--w-divider);
  font-size: 13.5px;
  color: var(--w-ink);
}
.ingredient-item:last-child { border-bottom: 0; }
.ingredient-name { flex: 1; }
.ingredient-pct {
  font-size: 12px;
  color: var(--w-ink-mid);
  background: var(--w-bg-soft);
  padding: 2px 8px;
  border-radius: var(--w-radius-full);
}

.chip {
  display: inline-flex; align-items: center;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: var(--w-radius-full);
  letter-spacing: 0.08em;
}
.chip--additive { background: var(--w-primary-pale); color: var(--w-primary); }
.chip--warn     { background: var(--w-warn-bg);      color: var(--w-warn-text); }

.allergen-note {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--w-warn-bg);
  border-left: 3px solid var(--w-warn-text);
  border-radius: var(--w-radius-sm);
  font-size: 13px;
  color: var(--w-ink);
}

.summary-line {
  display: flex; gap: 8px;
  padding: 10px 0;
  border-top: 1px dashed var(--w-divider);
  font-size: 13px;
}
.summary-line__label { color: var(--w-ink-soft); }
.summary-line__value { color: var(--w-ink); font-weight: 500; }

.action-bar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: var(--w-space-2);
  flex-wrap: wrap;
}
.action-bar__spacer { flex: 1; }

/* 状态 chip：保质期 / 过敏原命中 */
.status-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: var(--w-radius-full);
  border: 1px solid transparent;
  white-space: nowrap;
}
.status-chip--btn { cursor: pointer; transition: filter 0.18s var(--w-ease); }
.status-chip--btn:hover { filter: brightness(1.05); }
.status-chip--safe    { background: rgba(127, 159, 127, 0.15); color: var(--w-sage, #5b8d5b); border-color: rgba(127, 159, 127, 0.35); }
.status-chip--warn    { background: rgba(200, 134, 58, 0.15); color: var(--w-amber);          border-color: rgba(200, 134, 58, 0.40); }
.status-chip--danger  { background: rgba(193, 86, 55, 0.13);  color: var(--w-terracotta, #c15637); border-color: rgba(193, 86, 55, 0.40); }
.status-chip--unknown { background: var(--w-bg-soft, #f5f1e8); color: var(--w-ink-mute);      border-color: var(--w-border-soft); }

/* 标准码标记 */
.kv-mark {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.1em;
  padding: 1px 6px;
  margin-left: 6px;
  border-radius: var(--w-radius-sm);
  background: var(--w-primary-pale);
  color: var(--w-primary);
  vertical-align: middle;
}
.kv-sub {
  display: block;
  font-size: 11px;
  color: var(--w-ink-mute);
  font-family: ui-monospace, Menlo, Consolas, monospace;
  margin-top: 2px;
}

/* 致敏原结构化区块（替换旧 allergen-note） */
.allergen-block {
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px 12px;
  background: var(--w-warn-bg, #FFF4E0);
  border-left: 3px solid var(--w-warn-text, #B5632A);
  border-radius: var(--w-radius-sm);
  font-size: 12.5px;
}
.allergen-line { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.allergen-tags { display: inline-flex; flex-wrap: wrap; gap: 4px; }
.atag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 11.5px;
  border-radius: var(--w-radius-full);
  background: rgba(0,0,0,0.04);
  color: var(--w-ink);
}
.atag--mute { color: var(--w-ink-mid); background: rgba(0,0,0,0.025); }
.atag--hit {
  background: rgba(193, 86, 55, 0.18);
  color: var(--w-terracotta, #c15637);
  border: 1px solid var(--w-terracotta, #c15637);
  font-weight: 600;
}
.chip--mute { background: rgba(0,0,0,0.06); color: var(--w-ink-mid); }
.allergen-cta {
  align-self: flex-start;
  margin-top: 2px;
  background: transparent; border: 0; cursor: pointer;
  color: var(--w-primary); font-size: 11.5px;
  letter-spacing: 0.04em;
}
.allergen-cta:hover { text-decoration: underline; }

/* 截图区：包含产品标题 + 全部解读卡片 */
.share-frame {
  background: var(--w-bg);
  border-radius: var(--w-radius-xl);
}
.share-frame__hero {
  text-align: center;
  padding: var(--w-space-3) var(--w-space-4) var(--w-space-3);
  border-bottom: 1px dashed var(--w-divider);
  margin-bottom: var(--w-space-3);
}
.share-frame__brand {
  font-family: var(--w-font-serif);
  font-size: 11px; letter-spacing: 0.3em;
  color: var(--w-amber); font-weight: 500;
  margin: 0 0 6px;
}
.share-frame__product {
  font-family: var(--w-font-serif);
  font-size: 20px; letter-spacing: 0.06em;
  color: var(--w-ink); margin: 0 0 4px;
}
.share-frame__time {
  font-size: 12px; color: var(--w-ink-mute);
  font-family: ui-monospace, Menlo, Consolas, monospace;
  margin: 0;
}
.fav-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px;
  background: transparent; color: var(--w-ink-mid);
  border: 1px solid var(--w-border-soft); border-radius: var(--w-radius-full);
  font-size: 12.5px; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.18s var(--w-ease);
}
.fav-btn:hover:not(:disabled) { color: var(--w-amber); border-color: var(--w-amber); }
.fav-btn--active { background: var(--w-amber); color: #FFFBF2; border-color: var(--w-amber); }
.fav-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.fav-btn--danger:hover:not(:disabled) {
  color: var(--w-terracotta, #c15637);
  border-color: var(--w-terracotta, #c15637);
}

.nutri-radar { width: 100%; height: 220px; margin-top: var(--w-space-3); }

/* ── 营养事实左右切换 ── */
.nutri-switch {
  display: flex;
  background: var(--w-bg-soft, var(--w-primary-pale));
  border-radius: var(--w-radius-full);
  padding: 3px;
  margin: 0 auto var(--w-space-2);
  max-width: 300px;
  border: 1px solid var(--w-border-soft);
}
.nutri-switch__btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  border-radius: var(--w-radius-full);
  color: var(--w-ink-mid);
  font-size: 12.5px;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.2s var(--w-ease);
}
.nutri-switch__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.nutri-switch__btn:hover:not(:disabled):not(.is-active) {
  color: var(--w-primary);
}
.nutri-switch__btn.is-active {
  background: var(--w-surface);
  color: var(--w-primary);
  font-weight: 600;
  box-shadow: var(--w-shadow-sm);
}

.nutri-fade-enter-active,
.nutri-fade-leave-active { transition: opacity 0.18s var(--w-ease), transform 0.18s var(--w-ease); }
.nutri-fade-enter-from { opacity: 0; transform: translateX(8px); }
.nutri-fade-leave-to   { opacity: 0; transform: translateX(-8px); }

/* ── 原始标签卡 ── */
.label-card__body {
  align-items: center;
  justify-content: center;
}
.label-card__img {
  width: 100%;
  max-height: 240px;
  border-radius: var(--w-radius-md);
  background: var(--w-bg-soft, var(--w-primary-pale));
  cursor: zoom-in;
}
.label-card__img :deep(img) {
  border-radius: var(--w-radius-md);
}
.label-card__fallback {
  padding: var(--w-space-5);
  color: var(--w-ink-mute);
  font-size: 13px;
  text-align: center;
}

/* ── 健康评估卡 ── */
/* 健康评估内容较多，宽屏下让它跨两列；窄屏自动回单列 */
@media (min-width: 1080px) {
  .health-card { grid-column: span 2; }
}
.health-block + .health-block { margin-top: var(--w-space-3); padding-top: var(--w-space-3); border-top: 1px dashed var(--w-divider); }
.block-title { font-family: var(--w-font-serif); font-size: 13px; letter-spacing: 0.08em; color: var(--w-ink-mid); margin-bottom: var(--w-space-2); }

.rating-table { display: flex; flex-direction: column; border: 1px solid var(--w-border-soft); border-radius: var(--w-radius-sm); overflow: hidden; }
.rating-row {
  display: grid;
  grid-template-columns: 5em 4em 4.5em 1fr;
  gap: 10px; padding: 6px 12px; font-size: 12.5px;
  align-items: center; border-bottom: 1px dashed var(--w-divider);
}
.rating-row:last-child { border-bottom: none; }
.rating-row--high { background: rgba(193, 86, 55, 0.06); }
.rating-name { color: var(--w-ink); font-weight: 500; }
.rating-pct { font-family: ui-monospace, Menlo, Consolas, monospace; color: var(--w-ink-mid); text-align: right; }
.rating-badge { display: inline-block; text-align: center; padding: 2px 0; border-radius: var(--w-radius-full); font-size: 11px; letter-spacing: 0.1em; }
.rating-badge--high { background: rgba(193, 86, 55, 0.18); color: var(--w-terracotta); }
.rating-badge--mid  { background: rgba(127, 159, 127, 0.18); color: var(--w-sage); }
.rating-badge--low  { background: rgba(200, 134, 58, 0.18); color: var(--w-amber); }
.rating-text { color: var(--w-ink-mid); font-size: 12.5px; line-height: 1.6; }

.risk-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.risk-card {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 8px 12px;
  background: rgba(200, 134, 58, 0.10);
  border-left: 3px solid var(--w-amber);
  border-radius: var(--w-radius-sm);
  font-size: 12.5px;
  color: var(--w-ink);
  line-height: 1.55;
}
.risk-icon { color: var(--w-amber); flex-shrink: 0; font-weight: 600; }
.risk-text { flex: 1; }

@media (max-width: 600px) {
  .rating-row { grid-template-columns: 1fr; gap: 4px; }
  .rating-pct, .rating-badge { text-align: left; }
}

/* ── 配料三分类 Tab ── */
.ing-tabs :deep(.el-tabs__nav-wrap::after) { background-color: var(--w-divider); }
.ing-tabs :deep(.el-tabs__item) { font-family: var(--w-font-serif); letter-spacing: 0.08em; color: var(--w-ink-mid); }
.ing-tabs :deep(.el-tabs__item.is-active) { color: var(--w-primary); }
.ing-tabs :deep(.el-tabs__active-bar) { background-color: var(--w-primary); }
.ing-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.ing-list li { font-size: 13.5px; color: var(--w-ink); line-height: 1.7; padding-left: 12px; position: relative; }
.ing-list li::before { content: '·'; position: absolute; left: 0; color: var(--w-amber); }
.ing-list li.muted::before { content: ''; }
.add-tags { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0; }
.chip--clickable {
  background: rgba(56, 117, 178, 0.12);
  color: #2d6dad; border: 1px solid rgba(56, 117, 178, 0.3);
  padding: 4px 12px; border-radius: var(--w-radius-full);
  font-size: 12.5px; cursor: pointer; transition: all 0.15s var(--w-ease);
}
.chip--clickable:hover { background: #2d6dad; color: #fff; border-color: #2d6dad; }
.muted { color: var(--w-ink-mute); font-size: 13px; }

.analysis-link { margin-top: auto; padding-top: var(--w-space-3); }
.more-link { margin-top: auto; padding-top: var(--w-space-3); border-top: 1px dashed var(--w-divider); }
.link-btn {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--w-primary);
  font-size: 13px;
  letter-spacing: 0.06em;
  padding: 8px 0;
  transition: color 0.2s var(--w-ease);
}
.link-btn:hover { color: var(--w-primary-hover); }

/* ── 营养表 ── */
.nutrition-block { padding: 0; }
.nutrition-block--dashed { border-top: 1px dashed var(--w-divider); padding-top: var(--w-space-3); margin-top: var(--w-space-2); }

.block-title {
  font-family: var(--w-font-serif);
  font-size: 14px;
  color: var(--w-ink-mid);
  letter-spacing: 0.12em;
  text-align: center;
  margin-bottom: var(--w-space-3);
}

.nutri-table { display: flex; flex-direction: column; }
.nutri-row {
  display: grid;
  grid-template-columns: 1fr auto auto 64px;
  gap: 8px;
  align-items: baseline;
  padding: 5px 0;
  font-size: 12.5px;
  border-bottom: 1px dotted var(--w-divider);
}
.nutri-row:last-child { border-bottom: 0; }
.nutri-row--pkg { grid-template-columns: 1fr auto auto; }
.nutri-table--no-nrv .nutri-row { grid-template-columns: 1fr auto auto; }
.nutri-name  { color: var(--w-ink-mid); }
.nutri-value { color: var(--w-ink); font-weight: 600; text-align: right; }
.nutri-unit  { color: var(--w-ink-soft); font-size: 12px; }
.nutri-nrv   { color: var(--w-amber); font-size: 12px; text-align: right; letter-spacing: 0.04em; }

@media (max-width: 560px) {
  .result-page { padding: var(--w-space-3) var(--w-space-3) var(--w-space-5); }
  .parch-card { padding: var(--w-space-3) var(--w-space-4); }
  .nutri-radar { height: 200px; }
  .label-card__img { max-height: 200px; }
}

/* ── 大白话点评卡 ── */
.plain-talk {
  font-size: 14px;
  line-height: 1.95;
  letter-spacing: 0.02em;
  color: var(--w-ink);
  background: var(--w-primary-pale);
  border-radius: var(--w-radius-sm);
  padding: var(--w-space-3) var(--w-space-4);
  border-left: 3px solid var(--w-amber);
}
.plain-talk--loading {
  display: flex; align-items: center; gap: 8px;
  color: var(--w-ink-mid);
  font-size: 13px;
}
.plain-talk__spark {
  color: var(--w-amber);
  animation: plain-talk-pulse 1.2s ease-in-out infinite;
}
@keyframes plain-talk-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.92); }
  50%      { opacity: 1;   transform: scale(1.08); }
}
.plain-talk__hint { line-height: 1.8; }
.plain-talk__actions { margin-top: auto; padding-top: var(--w-space-2); }
</style>
