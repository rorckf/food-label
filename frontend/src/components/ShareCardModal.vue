<template>
  <transition name="sc-fade">
    <div v-if="visible" class="scm" @click.self="close">
      <div class="scm__panel">
        <header class="scm__head">
          <h3>分享给家人</h3>
          <button class="scm__close" @click="close" aria-label="关闭"><X :size="18" /></button>
        </header>

        <!-- 卡片预览（截图源） -->
        <div class="scm__stage">
          <div ref="cardEl">
            <ShareCard v-bind="cardProps" :custom-quote="quote" :sender-name="senderName" />
          </div>
        </div>

        <!-- 编辑：寄语 -->
        <div class="scm__edit">
          <label class="scm__label">给家人的话</label>
          <textarea
            v-model="quote"
            rows="2"
            maxlength="40"
            class="scm__textarea"
            :placeholder="defaultQuote"
          />
          <div class="scm__counter">{{ quote.length }} / 40</div>
        </div>

        <!-- 动作 -->
        <div class="scm__actions">
          <button class="btn btn--primary" :disabled="busy" @click="saveImage">
            <ImageDown :size="16" /> {{ busy ? '生成中…' : '保存图片' }}
          </button>
          <button class="btn btn--ghost" @click="copyText">
            <Copy :size="16" /> 复制文案
          </button>
          <button v-if="canShare" class="btn btn--ghost" @click="systemShare">
            <Share2 :size="16" /> 系统分享
          </button>
        </div>

        <p class="scm__tip">
          <Sparkles :size="12" />
          保存后可发到微信、朋友圈或家庭群
        </p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import html2canvas from 'html2canvas'
import { X, ImageDown, Copy, Share2, Sparkles } from 'lucide-vue-next'
import ShareCard from './ShareCard.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  cardProps: { type: Object, default: () => ({}) },
  senderName: { type: String, default: '我' },
})

const emit = defineEmits(['update:visible', 'shared'])

const cardEl = ref(null)
const busy = ref(false)
const quote = ref('')

const defaultQuote = computed(() => {
  if (props.cardProps.mode === 'compare') return '我帮你比过了，选这个就对了～'
  return ({
    safe: '这款我看过了，可以放心买。',
    caution: '这款偶尔吃可以，别太频繁哦。',
    avoid: '这款不太合适，建议别买。',
  })[props.cardProps.level] || ''
})

watch(() => props.visible, (v) => {
  if (v) quote.value = ''
})

const close = () => emit('update:visible', false)

const injectFreezeStyle = () => {
  const style = document.createElement('style')
  style.setAttribute('data-screenshot-freeze', 'true')
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      animation-play-state: paused !important;
      transition: none !important;
      transform: none !important;
      opacity: 1 !important;
      filter: none !important;
      backdrop-filter: none !important;
      caret-color: transparent !important;
    }
  `
  document.head.appendChild(style)
  return style
}

const saveImage = async () => {
  if (!cardEl.value) return
  busy.value = true
  let freezeStyle = null
  try {
    await nextTick()
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready } catch (_) { /* ignore */ }
    }
    freezeStyle = injectFreezeStyle()
    void cardEl.value.getBoundingClientRect()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const canvas = await html2canvas(cardEl.value, {
      useCORS: true,
      allowTaint: true,
      scale: 3,
      backgroundColor: null,
      logging: false,
      onclone: (doc) => {
        const css = doc.createElement('style')
        css.textContent = `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
            filter: none !important;
            backdrop-filter: none !important;
          }
          canvas { transform: none !important; }
        `
        doc.head.appendChild(css)
      },
    })
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    const name = props.cardProps.productName || '推荐'
    a.download = `推荐_${name}_${Date.now()}.png`
    a.href = url
    a.click()
    emit('shared', 'image')
  } catch (e) {
    console.error(e)
  } finally {
    if (freezeStyle && freezeStyle.parentNode) freezeStyle.parentNode.removeChild(freezeStyle)
    busy.value = false
  }
}

const buildText = () => {
  const c = props.cardProps
  const q = quote.value || defaultQuote.value
  const lines = [q]
  if (c.mode === 'compare') {
    const winner = c.winnerSide === 'A' ? c.productA : c.productB
    lines.push(`【${c.productA}】vs【${c.productB}】 → 推荐 ${winner}`)
  } else {
    lines.push(`【${c.productName}】${({ safe: '✓ 可放心', caution: '⚠ 适量', avoid: '✗ 不建议' })[c.level] || ''}`)
  }
  if (c.reason) lines.push(c.reason)
  lines.push('—— 食安慧眼')
  return lines.join('\n')
}

const copyText = async () => {
  try {
    await navigator.clipboard.writeText(buildText())
    emit('shared', 'text')
  } catch (e) { /* noop */ }
}

const canShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)
const systemShare = async () => {
  try {
    await navigator.share({ title: '食安慧眼 · 推荐', text: buildText() })
    emit('shared', 'system')
  } catch (e) { /* 用户取消或不支持 */ }
}
</script>

<style scoped>
.scm {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(58, 36, 16, 0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  overflow-y: auto;
}
.scm__panel {
  width: 100%; max-width: 460px;
  background: var(--w-bg);
  border-radius: 24px;
  padding: 20px 22px 22px;
  box-shadow: var(--w-shadow-lg);
  position: relative;
  max-height: 92vh;
  display: flex; flex-direction: column;
}
.scm__head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.scm__head h3 {
  margin: 0; font-family: var(--w-font-serif);
  font-size: 17px; color: var(--w-ink); letter-spacing: 0.1em; font-weight: 500;
}
.scm__close {
  width: 32px; height: 32px;
  border: 0; background: transparent; border-radius: 50%;
  color: var(--w-ink-soft); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.scm__close:hover { background: var(--w-bg-soft); color: var(--w-ink); }

.scm__stage {
  display: flex; justify-content: center;
  padding: 12px 0 18px;
  overflow-y: auto;
}

.scm__edit { margin-bottom: 14px; }
.scm__label {
  display: block; font-size: 12px; color: var(--w-ink-soft);
  letter-spacing: 0.06em; margin-bottom: 6px;
}
.scm__textarea {
  width: 100%; padding: 10px 12px;
  border: 1px solid var(--w-border-soft);
  border-radius: 10px;
  background: var(--w-surface);
  font-size: 13.5px; color: var(--w-ink);
  font-family: var(--w-font-sans);
  resize: none; outline: none;
  transition: border-color 0.15s;
}
.scm__textarea:focus { border-color: var(--w-primary); }
.scm__counter {
  text-align: right; font-size: 10.5px; color: var(--w-ink-mute);
  font-family: ui-monospace, Menlo, Consolas, monospace;
  margin-top: 4px;
}

.scm__actions {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-bottom: 10px;
}
.btn {
  flex: 1; min-width: 110px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 40px; padding: 0 16px;
  border-radius: var(--w-radius-full);
  font-size: 13px; letter-spacing: 0.06em;
  cursor: pointer; transition: all 0.18s var(--w-ease);
  border: 1px solid transparent;
}
.btn--primary {
  background: var(--w-primary); color: var(--w-surface);
  box-shadow: var(--w-shadow-sm);
}
.btn--primary:hover:not(:disabled) {
  background: var(--w-primary-hover); transform: translateY(-1px);
}
.btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--ghost {
  background: var(--w-surface); color: var(--w-ink-mid);
  border-color: var(--w-border-soft);
}
.btn--ghost:hover { color: var(--w-primary); border-color: var(--w-primary); }

.scm__tip {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  font-size: 11.5px; color: var(--w-ink-soft);
  margin: 0;
}
.scm__tip svg { color: var(--w-amber); }

/* ── 动效 ── */
.sc-fade-enter-active, .sc-fade-leave-active { transition: opacity 0.22s var(--w-ease); }
.sc-fade-enter-from, .sc-fade-leave-to { opacity: 0; }
.sc-fade-enter-active .scm__panel { animation: sc-pop 0.28s var(--w-ease-out); }
@keyframes sc-pop {
  from { transform: scale(0.92) translateY(20px); opacity: 0; }
  to   { transform: scale(1)    translateY(0);    opacity: 1; }
}
</style>
