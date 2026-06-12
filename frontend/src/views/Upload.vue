<template>
  <div class="upload-page">
    <!-- ── 主工作区：上传识别 ── -->
    <header class="upload-hero">
      <div class="upload-hero__eyebrow">
        <span class="upload-hero__line"></span>
        <span class="upload-hero__tiny">SCAN · 标签识读</span>
        <span class="upload-hero__line"></span>
      </div>
      <h1 class="upload-hero__title">一图读懂食品标签</h1>
      <p class="upload-hero__sub">上传任一预包装食品标签图片，系统将自动解析营养、配料和健康风险。</p>
    </header>

    <section class="workspace">
      <div class="workspace__upload">
        <div
          v-if="!imageUrl"
          class="dropzone"
          :class="{ 'is-dragover': isDragover }"
          @click="pickFile"
          @dragover.prevent="isDragover = true"
          @dragleave.prevent="isDragover = false"
          @drop.prevent="onDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="dropzone__input"
            @change="onPick"
          />
          <div class="dropzone__icon"><UploadCloud :size="36" :stroke-width="1.4" /></div>
          <p class="dropzone__title">将食品标签拖至此处</p>
          <p class="dropzone__hint">或 <em>点击此处选择图片</em></p>
          <div class="dropzone__meta">
            <ImageIcon :size="13" :stroke-width="1.6" />
            <span>支持 JPG / PNG / WEBP · 最大 5MB</span>
          </div>
        </div>

        <p v-if="!imageUrl" class="demo-line">
          手头没有标签照片?<a class="demo-line__link" @click.stop="openDemo">看一份示例报告 →</a>
        </p>

        <div v-else class="preview">
          <div class="preview__frame">
            <img :src="imageUrl" :alt="fileName" />
          </div>
          <div class="preview__meta">
            <h3 class="preview__name">{{ fileName }}</h3>
            <p class="preview__info">{{ fileSize }}</p>
            <div class="preview__actions">
              <WButton variant="ghost" size="md" @click="changeImage">
                <RotateCcw :size="15" /> 重新选择
              </WButton>
              <WButton variant="primary" size="md" :loading="uploading" @click="handleUpload">
                <Sparkles :size="15" v-if="!uploading" /> {{ uploading ? '正在识别…' : '开始分析' }}
              </WButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 最近扫描 ── -->
    <section v-if="recentScans.length" class="home-sec">
      <div class="home-sec__head">
        <h2 class="home-sec__title">最近扫描</h2>
        <router-link to="/history" class="home-sec__more">全部 ›</router-link>
      </div>
      <div class="scan-list">
        <button
          v-for="r in recentScans"
          :key="r.id"
          class="scan-row"
          @click="$router.push(`/result/${r.id}`)"
        >
          <img v-if="r.imageUrl" :src="r.imageUrl" class="scan-row__thumb" alt="" />
          <div v-else class="scan-row__thumb scan-row__thumb--empty"><ImageIcon :size="16" /></div>
          <div class="scan-row__body">
            <span class="scan-row__name">{{ r.productName || '未命名产品' }}</span>
            <span class="scan-row__meta">{{ r.category || '—' }} · {{ shortTime(r.createTime) }}</span>
          </div>
          <span class="score-chip" :class="scoreClass(r.healthScore)">{{ r.healthScore ?? '—' }}</span>
        </button>
      </div>
    </section>

    <!-- ── 为你推荐 ── -->
    <section v-if="recommends.length" class="home-sec">
      <div class="home-sec__head">
        <h2 class="home-sec__title">为你推荐</h2>
        <router-link to="/recommend" class="home-sec__more">更多 ›</router-link>
      </div>
      <div class="rec-scroll">
        <div v-for="it in recommends" :key="it.id" class="rec-card">
          <div class="rec-card__top">
            <span class="score-chip" :class="scoreClass(it.healthScore)">{{ it.healthScore ?? '—' }}</span>
            <span class="rec-card__cat">{{ it.category }}</span>
          </div>
          <p class="rec-card__name">{{ it.name }}</p>
          <p class="rec-card__reason">{{ it.reasons?.[0] || '' }}</p>
        </div>
      </div>
    </section>

    <!-- ── 加载遮罩 ── -->
    <transition name="fade">
      <div v-if="uploading" class="scan-overlay">
        <div class="scan-box">
          <div class="scan-ring"></div>
          <h3 class="scan-title">AI 正在细读标签</h3>
          <p class="scan-hint">识别营养信息 · 配料 · 生产信息…</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadCloud, Image as ImageIcon, RotateCcw, Sparkles } from 'lucide-vue-next'
import WButton from '@/components/ui/WButton.vue'
import { recognizeAPI, historyAPI, recommendAPI } from '@/utils/api'
import { formatFileSize } from '@/utils/parser'
import { seedDemoResult } from '@/data/demoResult'

const router = useRouter()

/* ── 登录后首屏信息流:最近扫描 + 为你推荐 ── */
const recentScans = ref([])
const recommends = ref([])

const loadFeed = async () => {
  try {
    const h = await historyAPI.getHistoryList()
    if (h.code === 200) recentScans.value = (h.data || []).slice(0, 4)
  } catch { /* 静默 */ }
  try {
    const r = await recommendAPI.list(6)
    if (r.code === 200) recommends.value = r.data?.items || []
  } catch { /* 静默 */ }
}

const openDemo = () => router.push(seedDemoResult())

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

onMounted(loadFeed)

const fileInput = ref(null)
const file = ref(null)
const imageUrl = ref('')
const fileName = ref('')
const fileSize = ref('')
const uploading = ref(false)
const isDragover = ref(false)

/* ── 文件处理 ── */
const pickFile = () => fileInput.value?.click()

const onPick = (e) => {
  const f = e.target.files?.[0]
  if (f) acceptFile(f)
}

const onDrop = (e) => {
  isDragover.value = false
  const f = e.dataTransfer.files?.[0]
  if (f) acceptFile(f)
}

const acceptFile = (f) => {
  if (!f.type.startsWith('image/')) return alert('只能上传图片')
  if (f.size / 1024 / 1024 > 5) return alert('图片不能超过 5MB')
  file.value = f
  imageUrl.value = URL.createObjectURL(f)
  fileName.value = f.name
  fileSize.value = formatFileSize(f.size)
}

const changeImage = () => {
  file.value = null
  imageUrl.value = ''
  fileName.value = ''
  fileSize.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const handleUpload = async () => {
  if (!file.value) return
  uploading.value = true
  try {
    const res = await recognizeAPI.uploadImage(file.value)
    // 优先用后端返回的 history_record.id（收藏/对比依赖真实 DB id），失败时退化为时间戳
    const resultId = res.code === 200 && res.data?.id
      ? String(res.data.id)
      : Date.now().toString()
    const payload = {
      ...(res.code === 200 ? res.data : { riskReason: res.message || '识别失败', riskLevel: 1 }),
      id: resultId,
      imageUrl: res.code === 200 ? res.data.imageUrl : imageUrl.value,
      fileName: fileName.value,
      fileSize: fileSize.value,
      scanTime: new Date().toISOString(),
    }
    const store = JSON.parse(localStorage.getItem('scanResults') || '{}')
    store[resultId] = payload
    localStorage.setItem('scanResults', JSON.stringify(store))
    router.push(`/result/${resultId}`)
  } catch (err) {
    console.error(err)
    ElMessage.error(err.response?.data?.message || '识别失败,请稍后重试')
  } finally {
    uploading.value = false
  }
}

</script>

<style scoped>
/* ── 页面容器 ── */
.upload-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: var(--w-space-7) var(--w-space-6) var(--w-space-9);
}

/* ── 页首 ── */
.upload-hero { text-align: center; padding: var(--w-space-3) 0 var(--w-space-6); }
.upload-hero__eyebrow {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; color: var(--w-amber);
  margin-bottom: var(--w-space-4);
}
.upload-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.upload-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }
.upload-hero__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.08em;
  margin-bottom: var(--w-space-3);
}
.upload-hero__sub {
  max-width: 520px; margin: 0 auto;
  color: var(--w-ink-mid);
  font-size: 14px; line-height: 1.8;
  letter-spacing: 0.05em;
}

/* ── 主工作区：单列居中上传 ── */
.workspace { display: flex; justify-content: center; }
.workspace__upload {
  width: 100%; max-width: 720px;
  /* 统一上传前后外壳尺寸，避免选图后页面抖动 */
  display: flex;
  flex-direction: column;
  min-height: 460px;
}
.workspace__upload > * { flex: 1; min-height: 460px; }

.dropzone {
  position: relative;
  border: 1.5px dashed var(--w-border);
  border-radius: var(--w-radius-xl);
  background: var(--w-surface);
  padding: var(--w-space-6);
  text-align: center;
  cursor: pointer;
  transition: all 0.35s var(--w-ease-out);
  box-shadow: var(--w-shadow-xs);
  /* 与 preview 撑同样高 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dropzone::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid var(--w-border-soft);
  border-radius: calc(var(--w-radius-xl) - 8px);
  pointer-events: none;
  transition: inherit;
}

.dropzone:hover,
.dropzone.is-dragover {
  border-color: var(--w-primary);
  background: var(--w-primary-pale);
  box-shadow: var(--w-shadow-md);
  transform: translateY(-2px);
}
.dropzone:hover::before,
.dropzone.is-dragover::before { border-color: var(--w-primary-soft); }

.dropzone__input { display: none; }

.dropzone__icon {
  width: 78px;
  height: 78px;
  margin: 0 auto var(--w-space-5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--w-primary);
  background: var(--w-primary-pale);
  border: 1px solid var(--w-border-soft);
}

.dropzone__title {
  font-family: var(--w-font-serif);
  font-size: 22px;
  color: var(--w-ink);
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.dropzone__hint {
  font-size: 14px;
  color: var(--w-ink-mid);
  margin-bottom: var(--w-space-5);
}
.dropzone__hint em {
  font-style: normal;
  color: var(--w-primary);
  text-decoration: underline dotted;
  text-underline-offset: 4px;
}

.dropzone__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--w-ink-soft);
  letter-spacing: 0.06em;
}

/* ── 预览 ── */
.preview {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-xl);
  box-shadow: var(--w-shadow-md);
  padding: var(--w-space-5);
  display: grid;
  grid-template-columns: minmax(260px, 44%) 1fr;
  gap: var(--w-space-6);
  align-items: center;
  /* 与 dropzone 同尺寸（避免选图后抖动） */
  box-sizing: border-box;
}
@media (max-width: 680px) {
  .preview { grid-template-columns: 1fr; }
}

.preview__frame {
  background: var(--w-bg-soft);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  overflow: hidden;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview__frame img { max-width: 100%; max-height: 100%; object-fit: contain; }

.preview__name {
  font-family: var(--w-font-serif);
  font-size: 18px;
  color: var(--w-ink);
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  word-break: break-all;
}
.preview__info {
  font-size: 13px;
  color: var(--w-ink-soft);
  margin-bottom: var(--w-space-5);
}

.preview__actions {
  display: flex;
  gap: var(--w-space-3);
  flex-wrap: wrap;
}

/* ── 扫描遮罩 ── */
.scan-overlay {
  position: fixed;
  inset: 0;
  background: rgba(251, 244, 230, 0.78);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.scan-box {
  text-align: center;
  padding: var(--w-space-7) var(--w-space-8);
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-xl);
  box-shadow: var(--w-shadow-lg);
  min-width: 320px;
}

.scan-ring {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--w-space-5);
  border: 3px solid var(--w-border-soft);
  border-top-color: var(--w-primary);
  border-radius: 50%;
  animation: w-spin 0.85s linear infinite;
}

.scan-title {
  font-family: var(--w-font-serif);
  font-size: 20px;
  color: var(--w-ink);
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.scan-hint {
  font-size: 13px;
  color: var(--w-ink-mid);
  letter-spacing: 0.06em;
}

/* ── 示例报告入口 ── */
.demo-line {
  text-align: center;
  font-size: 13px;
  color: var(--w-ink-mid);
  margin: 14px 0 0;
  letter-spacing: 0.04em;
}
.demo-line__link {
  color: var(--w-primary, #2A9D8F);
  cursor: pointer;
  margin-left: 4px;
}
.demo-line__link:hover { text-decoration: underline; }

/* ── 登录后信息流(最近扫描/为你推荐) ── */
.home-sec {
  max-width: 720px;
  margin: 28px auto 0;
}
.home-sec__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.home-sec__title {
  font-family: var(--w-font-serif);
  font-size: 16px;
  font-weight: 600;
  color: var(--w-ink);
  letter-spacing: 0.06em;
  margin: 0;
}
.home-sec__more {
  font-size: 12.5px;
  color: var(--w-ink-mid);
  text-decoration: none;
}
.home-sec__more:hover { color: var(--w-primary, #2A9D8F); }

.scan-list { display: flex; flex-direction: column; gap: 8px; }
.scan-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: 14px;
  padding: 10px 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
}
.scan-row:hover { border-color: var(--w-primary, #2A9D8F); }
.scan-row:active { transform: scale(0.99); }
.scan-row__thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}
.scan-row__thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--w-primary-pale, #f4ecdc);
  color: var(--w-ink-mid);
}
.scan-row__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.scan-row__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--w-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.scan-row__meta { font-size: 11.5px; color: var(--w-ink-mid); }

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

.rec-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.rec-scroll::-webkit-scrollbar { display: none; }
.rec-card {
  flex: 0 0 160px;
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: 14px;
  padding: 12px;
}
.rec-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.rec-card__cat { font-size: 11px; color: var(--w-ink-mid); }
.rec-card__name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--w-ink);
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rec-card__reason {
  font-size: 11px;
  color: #4D7C0F;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>