<template>
  <div class="shelf">
    <header class="shelf__head">
      <h1 class="shelf__title">货架 PK</h1>
      <p class="shelf__sub">站在货架前连扫几款,当场排出高下</p>
    </header>

    <!-- Key 未配置引导 -->
    <button v-if="!keyReady" class="shelf__keybar" @click="$router.push('/preferences')">
      <KeyRound :size="16" />
      <span>还差一步:配置免费 API Key 才能扫描</span>
      <ChevronRight :size="16" />
    </button>

    <!-- 冠军卡 -->
    <section v-if="ranked.length >= 2" class="champion">
      <div class="champion__crown">🏆 本轮最优</div>
      <div class="champion__name">{{ ranked[0].name }}</div>
      <div class="champion__meta">
        健康评分 <strong>{{ ranked[0].healthScore }}</strong>
        <span class="champion__verdict">{{ verdictOf(ranked[0]).text }}</span>
      </div>
    </section>

    <!-- 排行榜 -->
    <section v-if="ranked.length" class="board">
      <div
        v-for="(e, i) in ranked"
        :key="e.id"
        class="rank-row"
        :class="{ 'rank-row--top': i === 0 }"
        @click="$router.push(`/result/${e.id}`)"
      >
        <span class="rank-medal" :class="`rank-medal--${i}`">{{ medal(i) }}</span>
        <img v-if="e.imageUrl" :src="e.imageUrl" class="rank-thumb" alt="" />
        <div v-else class="rank-thumb rank-thumb--empty"><ImageOff :size="16" /></div>
        <div class="rank-body">
          <span class="rank-name">{{ e.name }}</span>
          <span class="rank-verdict" :class="`rank-verdict--${verdictOf(e).tone}`">
            {{ verdictOf(e).text }}
          </span>
        </div>
        <span class="rank-score" :class="scoreClass(e.healthScore)">{{ e.healthScore }}</span>
        <button class="rank-del" @click.stop="remove(e.id)" aria-label="移除"><X :size="15" /></button>
      </div>
    </section>

    <!-- 空状态 -->
    <section v-else class="shelf__empty">
      <div class="shelf__empty-icon"><Trophy :size="42" /></div>
      <p class="shelf__empty-title">扫第一款产品开始 PK</p>
      <p class="shelf__empty-sub">连扫同类的 2~5 款,自动按健康评分排名</p>
    </section>

    <div v-if="ranked.length" class="shelf__tools">
      <button class="shelf__clear" @click="clearAll"><Trash2 :size="14" /> 清空本轮</button>
      <span class="shelf__count">已扫 {{ ranked.length }} 款</span>
    </div>

    <!-- 扫描 FAB -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="shelf__file"
      @change="onFile"
    />
    <button class="fab" :disabled="scanning" @click="pickPhoto">
      <Camera :size="24" />
      <span>{{ ranked.length ? '再扫一款' : '扫一款' }}</span>
    </button>

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
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera, KeyRound, ChevronRight, ImageOff, X, Trophy, Trash2 } from 'lucide-vue-next'
import { recognizeAPI } from '@/utils/api'
import { hasApiKey } from '@/local/byok'
import { getShelfSession, addToShelf, removeFromShelf, clearShelf, rankShelf, verdictLine } from '@/local/shelfSession'

const router = useRouter()
const keyReady = ref(true)
const session = ref([])
const scanning = ref(false)
const scanHint = ref('正在识别标签…')
const fileInput = ref(null)

const ranked = computed(() => rankShelf(session.value))
const verdictOf = (e) => verdictLine(e)

const load = () => {
  keyReady.value = hasApiKey()
  session.value = getShelfSession()
}

const pickPhoto = () => {
  if (!hasApiKey()) {
    ElMessage.warning('请先到「偏好」页配置 API Key(有免费额度)')
    router.push('/preferences')
    return
  }
  fileInput.value?.click()
}

const onFile = async (e) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  scanning.value = true
  scanHint.value = '正在识别标签…'
  const slowTimer = setTimeout(() => { scanHint.value = 'AI 正在仔细看配料表…' }, 6000)
  try {
    const res = await recognizeAPI.uploadImage(file)
    if (res.code === 200 && res.data?.id) {
      // 结果也写入 scanResults,点排行项可跳到完整结果页
      const resultId = String(res.data.id)
      try {
        const store = JSON.parse(localStorage.getItem('scanResults') || '{}')
        store[resultId] = { ...res.data, id: resultId, scanTime: new Date().toISOString() }
        localStorage.setItem('scanResults', JSON.stringify(store))
      } catch { /* 容量满则跳过缓存 */ }
      session.value = addToShelf(res.data)
      ElMessage.success(`已加入:${res.data.productName || '该产品'}`)
    }
  } finally {
    clearTimeout(slowTimer)
    scanning.value = false
  }
}

const remove = (id) => { session.value = removeFromShelf(id) }
const clearAll = () => { clearShelf(); session.value = [] }

const medal = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`)

const scoreClass = (s) => {
  if (s == null) return 'sc--na'
  if (s >= 85) return 'sc--good'
  if (s >= 70) return 'sc--fair'
  if (s >= 50) return 'sc--mid'
  return 'sc--bad'
}

onMounted(load)
onActivated(load)
</script>

<style scoped>
.shelf {
  max-width: 560px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top, 0px) + 18px) 16px 140px;
  min-height: 100vh;
}
.shelf__head { margin-bottom: 16px; }
.shelf__title {
  font-family: var(--w-font-serif, serif);
  font-size: 22px; font-weight: 600;
  color: var(--w-ink, #2b2018); letter-spacing: 0.06em; margin: 0 0 4px;
}
.shelf__sub { font-size: 13px; color: var(--w-ink-mid, #8a7a66); margin: 0; }

.shelf__keybar {
  display: flex; align-items: center; gap: 8px; width: 100%;
  border: 1px solid #FCD34D; background: #FEF9C3; color: #92400E;
  border-radius: 12px; padding: 12px 14px; font-size: 13px;
  margin-bottom: 16px; text-align: left;
}
.shelf__keybar span { flex: 1; }

/* 冠军卡 */
.champion {
  background: linear-gradient(135deg, #34D399, #047857);
  color: #fff; border-radius: 16px; padding: 16px 18px; margin-bottom: 14px;
  box-shadow: 0 8px 22px rgba(4, 120, 87, 0.28);
}
.champion__crown { font-size: 12.5px; letter-spacing: 0.08em; opacity: 0.92; }
.champion__name { font-size: 19px; font-weight: 700; margin: 4px 0 6px; }
.champion__meta { font-size: 13px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.champion__meta strong { font-size: 16px; }
.champion__verdict {
  background: rgba(255, 255, 255, 0.22); border-radius: 999px;
  padding: 2px 10px; font-size: 12px;
}

/* 排行榜 */
.board { display: flex; flex-direction: column; gap: 8px; }
.rank-row {
  display: flex; align-items: center; gap: 11px;
  background: var(--w-surface, #fffdf6);
  border: 1px solid var(--w-border-soft, #e8dcc8);
  border-radius: 14px; padding: 9px 11px; cursor: pointer;
  transition: transform 0.12s;
}
.rank-row:active { transform: scale(0.99); }
.rank-row--top { border-color: rgba(4, 120, 87, 0.4); background: rgba(52, 211, 153, 0.06); }
.rank-medal { font-size: 18px; width: 26px; text-align: center; flex-shrink: 0; }
.rank-medal--3, .rank-medal:not(.rank-medal--0):not(.rank-medal--1):not(.rank-medal--2) {
  font-size: 14px; color: var(--w-ink-mid, #8a7a66); font-weight: 600;
}
.rank-thumb {
  width: 42px; height: 42px; border-radius: 9px; object-fit: cover; flex-shrink: 0;
}
.rank-thumb--empty {
  display: flex; align-items: center; justify-content: center;
  background: var(--w-primary-pale, #f4ecdc); color: var(--w-ink-mid, #8a7a66);
}
.rank-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.rank-name {
  font-size: 14px; font-weight: 500; color: var(--w-ink, #2b2018);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.rank-verdict { font-size: 11.5px; }
.rank-verdict--good { color: #15803D; }
.rank-verdict--warn { color: #B45309; }
.rank-verdict--bad { color: #B91C1C; }

.rank-score {
  flex-shrink: 0; min-width: 34px; height: 26px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px; font-size: 14px; font-weight: 700; padding: 0 6px;
}
.sc--good { background: #DCFCE7; color: #15803D; }
.sc--fair { background: #ECFCCB; color: #4D7C0F; }
.sc--mid  { background: #FEF3C7; color: #B45309; }
.sc--bad  { background: #FEE2E2; color: #B91C1C; }
.sc--na   { background: #F1F5F9; color: #64748B; }

.rank-del {
  flex-shrink: 0; width: 26px; height: 26px; border: 0; background: transparent;
  color: var(--w-ink-mute, #b3a892); display: flex; align-items: center; justify-content: center;
  border-radius: 7px;
}
.rank-del:active { background: rgba(0, 0, 0, 0.06); }

/* 空状态 */
.shelf__empty { text-align: center; padding: 48px 20px 36px; color: var(--w-ink-mid, #8a7a66); }
.shelf__empty-icon { margin-bottom: 12px; opacity: 0.6; }
.shelf__empty-title { font-size: 16px; font-weight: 600; color: var(--w-ink, #2b2018); margin: 0 0 6px; }
.shelf__empty-sub { font-size: 13px; margin: 0; }

.shelf__tools {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 14px;
}
.shelf__clear {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12.5px; color: var(--w-ink-mid, #8a7a66);
  background: none; border: 0; padding: 6px 0;
}
.shelf__clear:active { color: var(--w-terracotta, #c15637); }
.shelf__count { font-size: 12px; color: var(--w-ink-mute, #b3a892); }

/* FAB + 遮罩(与首页一致) */
.shelf__file { display: none; }
.fab {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: calc(env(safe-area-inset-bottom, 0px) + 78px);
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #2A9D8F, #1F7A6E);
  color: #fff; border: 0; border-radius: 999px; padding: 14px 26px;
  font-size: 16px; font-weight: 600; letter-spacing: 0.08em;
  box-shadow: 0 8px 22px rgba(42, 157, 143, 0.4); z-index: 900;
}
.fab:active { transform: translateX(-50%) scale(0.94); }
.fab:disabled { opacity: 0.6; }

.scan-mask {
  position: fixed; inset: 0; background: rgba(20, 16, 12, 0.72);
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  z-index: 2000; display: flex; align-items: center; justify-content: center;
}
.scan-mask__box { text-align: center; color: #fff; }
.scan-mask__ring {
  width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.25); border-top-color: #2A9D8F;
  animation: shelf-spin 0.9s linear infinite;
}
.scan-mask__text { font-size: 14px; letter-spacing: 0.08em; }
@keyframes shelf-spin { to { transform: rotate(360deg); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
