<template>
  <article class="sc" :class="`sc--${tone}`">
    <!-- 顶部气泡引语 -->
    <div class="sc__bubble">
      <div class="sc__avatar">{{ avatarChar }}</div>
      <div class="sc__bubble-text">
        <p class="sc__bubble-quote">{{ quote }}</p>
        <p class="sc__bubble-meta">{{ senderName }} · {{ today }}</p>
      </div>
    </div>

    <!-- 主体：判决色块 -->
    <div class="sc__body">
      <div class="sc__badge">
        <span class="sc__badge-dot"></span>
        {{ badge }}
      </div>

      <h1 class="sc__product">{{ productName }}</h1>
      <p v-if="productSub" class="sc__product-sub">{{ productSub }}</p>

      <p class="sc__reason">{{ reason }}</p>

      <!-- 三条证据芯片 -->
      <div v-if="evidence.length" class="sc__evi">
        <div
          v-for="(e, i) in evidence"
          :key="i"
          class="sc__evi-item"
          :class="`sc__evi-item--${e.tone}`"
        >
          <div class="sc__evi-name">{{ e.name }}</div>
          <div class="sc__evi-val">{{ e.value }}<span>{{ e.unit }}</span></div>
          <div class="sc__evi-hint">{{ e.hint }}</div>
        </div>
      </div>

      <!-- 对比模式：A vs B -->
      <div v-if="mode === 'compare'" class="sc__vs">
        <div class="sc__vs-side" :class="{ 'is-win': winnerSide === 'A' }">
          <span class="sc__vs-tag">A</span>
          <span class="sc__vs-name">{{ productA }}</span>
        </div>
        <div class="sc__vs-divider">VS</div>
        <div class="sc__vs-side" :class="{ 'is-win': winnerSide === 'B' }">
          <span class="sc__vs-tag">B</span>
          <span class="sc__vs-name">{{ productB }}</span>
        </div>
      </div>
    </div>

    <!-- 页脚：品牌 + 二维码占位 -->
    <footer class="sc__foot">
      <div class="sc__brand">
        <div class="sc__logo">食</div>
        <div>
          <p class="sc__brand-name">食安慧眼</p>
          <p class="sc__brand-slug">为你的健康，多看一眼</p>
        </div>
      </div>
      <div class="sc__qr">
        <div class="sc__qr-box">
          <img v-if="qrUrl" :src="qrUrl" alt="扫码查看" crossorigin="anonymous" />
          <span v-else class="sc__qr-ph">QR</span>
        </div>
        <p class="sc__qr-hint">扫码看完整推荐</p>
      </div>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 'verdict' 单品判决卡 / 'compare' 对比择优卡
  mode:        { type: String, default: 'verdict' },
  // safe / caution / avoid
  level:       { type: String, default: 'safe' },
  productName: { type: String, default: '' },
  productSub:  { type: String, default: '' },
  reason:      { type: String, default: '' },
  evidence:    { type: Array,  default: () => [] }, // [{ name, value, unit, hint, tone }]
  // 对比模式
  productA:    { type: String, default: '' },
  productB:    { type: String, default: '' },
  winnerSide:  { type: String, default: 'A' },
  // 发件人
  senderName:  { type: String, default: '我' },
  customQuote: { type: String, default: '' },
  qrUrl:       { type: String, default: '' },
})

const tone = computed(() => {
  if (props.mode === 'compare') return 'pick'
  return props.level
})

const badge = computed(() => {
  if (props.mode === 'compare') return '择优推荐'
  return { safe: '✓ 可以放心吃', caution: '⚠ 偶尔可以', avoid: '✗ 不建议食用' }[props.level] || '健康提示'
})

const quote = computed(() => {
  if (props.customQuote) return props.customQuote
  if (props.mode === 'compare') return `这两款我比过了，推荐选 ${props.winnerSide === 'A' ? props.productA : props.productB}~`
  return ({
    safe: '这款我看过了，可以放心买。',
    caution: '这款偶尔吃可以，别太频繁。',
    avoid: '这款不太合适，建议别买。',
  })[props.level] || '看看这个推荐'
})

const avatarChar = computed(() => (props.senderName || '我').slice(0, 1))

const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
</script>

<style scoped>
/* ── 卡片整体（9:16 适合手机分享） ── */
.sc {
  width: 360px;
  min-height: 640px;
  border-radius: 28px;
  background: var(--w-surface);
  display: flex; flex-direction: column;
  overflow: hidden;
  font-family: var(--w-font-sans);
  color: var(--w-ink);
  box-shadow: var(--w-shadow-lg);
  position: relative;
}

/* 顶部色彩条 */
.sc::before {
  content: ''; position: absolute; inset: 0 0 auto 0; height: 8px;
}
.sc--safe::before    { background: var(--w-sage); }
.sc--caution::before { background: var(--w-amber); }
.sc--avoid::before   { background: var(--w-terracotta); }
.sc--pick::before    { background: linear-gradient(90deg, var(--w-sage), var(--w-amber)); }

/* 顶部留白 */
.sc { padding-top: 24px; }

/* ── 气泡引语 ── */
.sc__bubble {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 12px 20px 18px;
}
.sc__avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--w-primary); color: var(--w-surface);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--w-font-serif); font-weight: 600; font-size: 15px;
  flex-shrink: 0;
}
.sc__bubble-text { flex: 1; min-width: 0; }
.sc__bubble-quote {
  display: inline-block;
  background: var(--w-bg-soft);
  border-radius: 4px 14px 14px 14px;
  padding: 8px 12px;
  font-size: 13.5px; line-height: 1.55;
  color: var(--w-ink); margin: 0 0 4px;
  max-width: 100%;
  word-break: break-word;
}
.sc__bubble-meta {
  font-size: 11px; color: var(--w-ink-soft);
  margin: 0; letter-spacing: 0.04em;
}

/* ── 主体 ── */
.sc__body {
  flex: 1;
  margin: 0 16px;
  padding: 22px 20px 24px;
  border-radius: 22px;
  background: var(--w-surface-2);
  display: flex; flex-direction: column;
  position: relative;
}
.sc--safe    .sc__body { background: linear-gradient(180deg, var(--w-sage-soft) 0%, var(--w-surface-2) 60%); }
.sc--caution .sc__body { background: linear-gradient(180deg, rgba(200,134,58,0.18) 0%, var(--w-surface-2) 60%); }
.sc--avoid   .sc__body { background: linear-gradient(180deg, rgba(179,79,58,0.14) 0%, var(--w-surface-2) 60%); }
.sc--pick    .sc__body { background: linear-gradient(180deg, var(--w-sage-soft) 0%, rgba(200,134,58,0.12) 100%); }

.sc__badge {
  display: inline-flex; align-items: center; gap: 6px;
  align-self: flex-start;
  padding: 4px 12px; border-radius: 999px;
  background: var(--w-surface);
  font-size: 11px; letter-spacing: 0.12em;
  color: var(--w-ink-mid);
  margin-bottom: 14px;
  font-weight: 500;
}
.sc__badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
}
.sc--safe    .sc__badge-dot { background: var(--w-sage); }
.sc--caution .sc__badge-dot { background: var(--w-amber); }
.sc--avoid   .sc__badge-dot { background: var(--w-terracotta); }
.sc--pick    .sc__badge-dot { background: var(--w-primary); }

.sc__product {
  font-family: var(--w-font-serif);
  font-size: 24px; font-weight: 500;
  line-height: 1.35;
  color: var(--w-ink);
  margin: 0 0 4px;
  letter-spacing: 0.02em;
}
.sc__product-sub {
  font-size: 12px; color: var(--w-ink-soft);
  margin: 0 0 14px;
}
.sc__reason {
  font-size: 14px; line-height: 1.75;
  color: var(--w-ink); margin: 0 0 18px;
  letter-spacing: 0.02em;
}

/* ── 三条证据 ── */
.sc__evi {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: auto;
}
.sc__evi-item {
  background: var(--w-surface);
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
  border-top: 2px solid var(--w-divider);
}
.sc__evi-item--good { border-top-color: var(--w-sage); }
.sc__evi-item--bad  { border-top-color: var(--w-terracotta); }
.sc__evi-item--warn { border-top-color: var(--w-amber); }

.sc__evi-name {
  font-size: 10.5px; color: var(--w-ink-soft);
  letter-spacing: 0.04em; margin-bottom: 4px;
}
.sc__evi-val {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 18px; font-weight: 600; color: var(--w-ink);
  line-height: 1.1;
}
.sc__evi-val span {
  font-size: 9px; color: var(--w-ink-soft); margin-left: 2px; font-weight: 400;
}
.sc__evi-hint {
  font-size: 10px; margin-top: 4px;
  letter-spacing: 0.04em;
}
.sc__evi-item--good .sc__evi-hint { color: var(--w-sage); }
.sc__evi-item--bad  .sc__evi-hint { color: var(--w-terracotta); }
.sc__evi-item--warn .sc__evi-hint { color: var(--w-amber); }

/* ── 对比模式 ── */
.sc__vs {
  display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center; gap: 10px;
  margin-top: auto;
  padding: 14px 12px;
  background: var(--w-surface);
  border-radius: 14px;
}
.sc__vs-side {
  display: flex; align-items: center; gap: 8px;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.sc__vs-side.is-win {
  opacity: 1;
}
.sc__vs-tag {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--w-bg-soft); color: var(--w-ink-mid);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--w-font-serif); font-weight: 600; font-size: 11px;
  flex-shrink: 0;
}
.sc__vs-side.is-win .sc__vs-tag { background: var(--w-amber); color: var(--w-surface); }
.sc__vs-name {
  font-size: 12.5px; color: var(--w-ink); font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sc__vs-divider {
  font-family: var(--w-font-serif); font-size: 11px;
  color: var(--w-amber); letter-spacing: 0.2em;
}

/* ── 页脚 ── */
.sc__foot {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 24px 24px;
  gap: 14px;
}
.sc__brand { display: flex; align-items: center; gap: 10px; }
.sc__logo {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--w-primary); color: var(--w-surface);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--w-font-serif); font-weight: 600;
}
.sc__brand-name {
  margin: 0; font-family: var(--w-font-serif);
  font-size: 13px; color: var(--w-ink); font-weight: 500;
  letter-spacing: 0.06em;
}
.sc__brand-slug {
  margin: 2px 0 0; font-size: 10px;
  color: var(--w-ink-soft); letter-spacing: 0.04em;
}
.sc__qr { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.sc__qr-box {
  width: 48px; height: 48px; border-radius: 8px;
  background: var(--w-bg-soft);
  border: 1px solid var(--w-border-soft);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.sc__qr-box img { width: 100%; height: 100%; }
.sc__qr-ph {
  font-size: 10px; color: var(--w-ink-mute);
  letter-spacing: 0.1em;
}
.sc__qr-hint {
  margin: 0; font-size: 9px; color: var(--w-ink-soft);
  letter-spacing: 0.04em;
}
</style>
