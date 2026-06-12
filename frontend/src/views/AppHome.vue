<template>
  <div class="ahome">
    <!-- 顶部:品牌 + 隐私徽章 -->
    <header class="ahome__head">
      <h1 class="ahome__brand">食安扫一扫</h1>
      <span class="ahome__privacy"><Lock :size="12" /> 数据不出手机</span>
    </header>

    <!-- Key 未配置引导条 -->
    <button v-if="!keyReady" class="ahome__keybar" @click="$router.push('/preferences')">
      <KeyRound :size="16" />
      <span>还差一步:配置你的免费 API Key 才能开始识别</span>
      <ChevronRight :size="16" />
    </button>

    <!-- 最近扫描 -->
    <section v-if="history.length" class="ahome__section">
      <div class="ahome__sec-head">
        <h2 class="ahome__sec-title">最近扫描</h2>
        <button class="ahome__more" @click="$router.push('/history')">全部 <ChevronRight :size="13" /></button>
      </div>
      <div class="scan-list">
        <button
          v-for="r in history"
          :key="r.id"
          class="scan-row"
          @click="$router.push(`/result/${r.id}`)"
        >
          <img v-if="r.imageUrl" :src="r.imageUrl" class="scan-row__thumb" alt="" />
          <div v-else class="scan-row__thumb scan-row__thumb--empty"><ImageOff :size="18" /></div>
          <div class="scan-row__body">
            <span class="scan-row__name">{{ r.productName || '未命名产品' }}</span>
            <span class="scan-row__meta">{{ r.category || '—' }} · {{ shortTime(r.createTime) }}</span>
          </div>
          <span class="score-chip" :class="scoreClass(r.healthScore)">
            {{ r.healthScore ?? '—' }}
          </span>
        </button>
      </div>
    </section>

    <!-- 空状态:还没扫描过 -->
    <section v-else class="ahome__empty">
      <div class="ahome__empty-icon"><ScanLine :size="44" /></div>
      <p class="ahome__empty-title">拍下你的第一张食品标签</p>
      <p class="ahome__empty-sub">配料表、添加剂、营养成分,拍一下全看懂</p>
    </section>

    <!-- 拍照 FAB -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="ahome__file"
      @change="onFile"
    />
    <button class="fab" :disabled="scanning" @click="pickPhoto">
      <Camera :size="26" />
      <span>拍标签</span>
    </button>

    <!-- 多图确认面板:同一包装可补拍配料表/营养成分表 -->
    <Transition name="fade">
      <div v-if="shots.length && !scanning" class="shot-sheet" @click.self="clearShots">
        <div class="shot-sheet__panel">
          <p class="shot-sheet__title">已拍 {{ shots.length }}/3 张</p>
          <p class="shot-sheet__hint">一张拍不全?可补拍配料表、营养成分表(同一包装)</p>
          <div class="shot-sheet__thumbs">
            <div v-for="(s, i) in shots" :key="s.url" class="shot-thumb">
              <img :src="s.url" alt="" />
              <button class="shot-thumb__del" @click="removeShot(i)"><X :size="13" /></button>
            </div>
            <button v-if="shots.length < 3" class="shot-add" @click="fileInput?.click()">
              <Plus :size="20" />
              <span>补拍</span>
            </button>
          </div>
          <div class="shot-sheet__actions">
            <button class="shot-btn shot-btn--ghost" @click="clearShots">取消</button>
            <button class="shot-btn shot-btn--primary" @click="startRecognize">
              开始识别({{ shots.length }}张)
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 识别中遮罩 -->
    <Transition name="fade">
      <div v-if="scanning" class="scan-mask">
        <div class="scan-mask__box">
          <div class="scan-mask__ring"></div>
          <p class="scan-mask__text">{{ scanHint }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera, Lock, KeyRound, ChevronRight, ScanLine, ImageOff, X, Plus } from 'lucide-vue-next'
import { recognizeAPI, historyAPI } from '@/utils/api'
import { hasApiKey } from '@/local/byok'

const router = useRouter()

const keyReady = ref(true)
const history = ref([])
const scanning = ref(false)
const scanHint = ref('正在识别标签…')
const fileInput = ref(null)

/** 待识别照片队列(同一包装最多 3 张) */
const shots = ref([])

const load = async () => {
  keyReady.value = hasApiKey()
  try {
    const h = await historyAPI.getHistoryList()
    if (h.code === 200) history.value = (h.data || []).slice(0, 5)
  } catch { /* 忽略 */ }
}

const pickPhoto = () => {
  if (!hasApiKey()) {
    ElMessage.warning('请先到「偏好」页配置 API Key(有免费额度)')
    router.push('/preferences')
    return
  }
  fileInput.value?.click()
}

/** 拍完一张进入确认面板,可补拍或开始识别 */
const onFile = (e) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (shots.value.length >= 3) return
  shots.value.push({ file, url: URL.createObjectURL(file) })
}

const removeShot = (i) => {
  URL.revokeObjectURL(shots.value[i].url)
  shots.value.splice(i, 1)
}

const clearShots = () => {
  shots.value.forEach((s) => URL.revokeObjectURL(s.url))
  shots.value = []
}

const startRecognize = async () => {
  if (!shots.value.length) return
  const files = shots.value.map((s) => s.file)

  scanning.value = true
  scanHint.value = files.length > 1 ? `正在综合识别 ${files.length} 张照片…` : '正在识别标签…'
  const slowTimer = setTimeout(() => { scanHint.value = 'AI 正在仔细看配料表…' }, 6000)
  try {
    const res = await recognizeAPI.uploadImage(files.length === 1 ? files[0] : files)
    if (res.code === 200 && res.data?.id) {
      const resultId = String(res.data.id)
      // 与 Upload.vue 一致:结果缓存进 scanResults,Result 页直接读
      const payload = { ...res.data, id: resultId, scanTime: new Date().toISOString() }
      try {
        const store = JSON.parse(localStorage.getItem('scanResults') || '{}')
        store[resultId] = payload
        localStorage.setItem('scanResults', JSON.stringify(store))
      } catch { /* 容量满则跳过缓存,Result 会回落到历史记录 */ }
      clearShots()
      router.push(`/result/${resultId}`)
    }
    // 失败提示已由 api 层 localErr 弹出,保留照片让用户重试或取消
  } finally {
    clearTimeout(slowTimer)
    scanning.value = false
  }
}

onBeforeUnmount(clearShots)

const scoreClass = (s) => {
  if (s == null) return 'score-chip--na'
  if (s >= 85) return 'score-chip--good'
  if (s >= 70) return 'score-chip--fair'
  if (s >= 50) return 'score-chip--mid'
  return 'score-chip--bad'
}

const shortTime = (t) => {
  if (!t) return ''
  const s = String(t)
  return s.length >= 16 ? s.slice(5, 16) : s
}

onMounted(load)
onActivated(load)
</script>

<style scoped>
.ahome {
  max-width: 560px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top, 0px) + 18px) 16px 140px;
  min-height: 100vh;
}

/* ── 顶部 ── */
.ahome__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.ahome__brand {
  font-family: var(--w-font-serif, serif);
  font-size: 22px;
  font-weight: 600;
  color: var(--w-ink, #2b2018);
  letter-spacing: 0.06em;
  margin: 0;
}
.ahome__privacy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: #16A34A;
  background: #DCFCE7;
  padding: 4px 10px;
  border-radius: 999px;
}

/* ── Key 引导条 ── */
.ahome__keybar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 1px solid #FCD34D;
  background: #FEF9C3;
  color: #92400E;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: left;
}
.ahome__keybar span { flex: 1; }
.ahome__keybar:active { transform: scale(0.98); }

/* ── 区块 ── */
.ahome__section { margin-bottom: 22px; }
.ahome__sec-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}
.ahome__sec-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--w-ink, #2b2018);
  letter-spacing: 0.04em;
  margin: 0;
}
.ahome__more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--w-ink-mid, #8a7a66);
  background: none;
  border: 0;
  padding: 4px;
}

/* ── 最近扫描列表 ── */
.scan-list { display: flex; flex-direction: column; gap: 8px; }
.scan-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: var(--w-surface, #fffdf6);
  border: 1px solid var(--w-border-soft, #e8dcc8);
  border-radius: 14px;
  padding: 10px 12px;
  text-align: left;
}
.scan-row:active { transform: scale(0.98); }
.scan-row__thumb {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}
.scan-row__thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-primary-pale, #f4ecdc);
  color: var(--w-ink-mid, #8a7a66);
}
.scan-row__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.scan-row__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--w-ink, #2b2018);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.scan-row__meta { font-size: 11.5px; color: var(--w-ink-mid, #8a7a66); }

/* ── 评分徽章(红绿灯) ── */
.score-chip {
  flex-shrink: 0;
  min-width: 34px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  padding: 0 6px;
}
.score-chip--good { background: #DCFCE7; color: #15803D; }
.score-chip--fair { background: #ECFCCB; color: #4D7C0F; }
.score-chip--mid  { background: #FEF3C7; color: #B45309; }
.score-chip--bad  { background: #FEE2E2; color: #B91C1C; }
.score-chip--na   { background: #F1F5F9; color: #64748B; }

/* ── 空状态 ── */
.ahome__empty {
  text-align: center;
  padding: 44px 20px 36px;
  color: var(--w-ink-mid, #8a7a66);
}
.ahome__empty-icon { margin-bottom: 12px; opacity: 0.7; }
.ahome__empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--w-ink, #2b2018);
  margin: 0 0 6px;
}
.ahome__empty-sub { font-size: 13px; margin: 0; }

/* ── 多图确认面板 ── */
.shot-sheet {
  position: fixed;
  inset: 0;
  background: rgba(20, 16, 12, 0.5);
  z-index: 1500;
  display: flex;
  align-items: flex-end;
}
.shot-sheet__panel {
  width: 100%;
  background: var(--w-surface, #fffdf6);
  border-radius: 20px 20px 0 0;
  padding: 18px 18px calc(env(safe-area-inset-bottom, 0px) + 18px);
}
.shot-sheet__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--w-ink, #2b2018);
  margin: 0 0 4px;
}
.shot-sheet__hint {
  font-size: 12.5px;
  color: var(--w-ink-mid, #8a7a66);
  margin: 0 0 14px;
}
.shot-sheet__thumbs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.shot-thumb {
  position: relative;
  width: 84px;
  height: 84px;
}
.shot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}
.shot-thumb__del {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 0;
  background: #1f2937;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shot-add {
  width: 84px;
  height: 84px;
  border: 1.5px dashed var(--w-border-soft, #d9c9ab);
  border-radius: 12px;
  background: none;
  color: var(--w-ink-mid, #8a7a66);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
}
.shot-add:active { transform: scale(0.95); }
.shot-sheet__actions {
  display: flex;
  gap: 10px;
}
.shot-btn {
  flex: 1;
  height: 46px;
  border-radius: 12px;
  border: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.shot-btn--ghost {
  background: var(--w-primary-pale, #f4ecdc);
  color: var(--w-ink-mid, #6b5d4c);
}
.shot-btn--primary {
  flex: 2;
  background: linear-gradient(135deg, #2A9D8F, #1F7A6E);
  color: #fff;
}
.shot-btn:active { transform: scale(0.97); }

/* ── 拍照 FAB ── */
.ahome__file { display: none; }
.fab {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(env(safe-area-inset-bottom, 0px) + 78px);
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #2A9D8F, #1F7A6E);
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 14px 26px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.08em;
  box-shadow: 0 8px 22px rgba(42, 157, 143, 0.4);
  z-index: 900;
}
.fab:active { transform: translateX(-50%) scale(0.94); }
.fab:disabled { opacity: 0.6; }

/* ── 识别中遮罩 ── */
.scan-mask {
  position: fixed;
  inset: 0;
  background: rgba(20, 16, 12, 0.72);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.scan-mask__box { text-align: center; color: #fff; }
.scan-mask__ring {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.25);
  border-top-color: #2A9D8F;
  animation: ahome-spin 0.9s linear infinite;
}
.scan-mask__text { font-size: 14px; letter-spacing: 0.08em; }
@keyframes ahome-spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
