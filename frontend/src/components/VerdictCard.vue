<template>
  <section class="verdict" :class="`verdict--${verdict.level}`">
    <!-- 顶部判决条 -->
    <header class="verdict__head">
      <div class="verdict__badge">
        <component :is="verdict.icon" :size="22" :stroke-width="2.2" />
        <span class="verdict__badge-text">{{ verdict.label }}</span>
      </div>
      <p class="verdict__profile" v-if="profileTags.length">
        基于你的健康档案 ·
        <span v-for="(t, i) in profileTags" :key="i" class="verdict__tag">{{ t }}</span>
      </p>
    </header>

    <!-- 一句话理由 -->
    <h2 class="verdict__reason">{{ verdict.reason }}</h2>

    <!-- 关键证据：3 个最突出的指标 -->
    <ul class="verdict__evidence" v-if="topEvidence.length">
      <li
        v-for="(e, i) in topEvidence"
        :key="i"
        class="evi"
        :class="`evi--${e.tone}`"
      >
        <span class="evi__name">{{ e.name }}</span>
        <span class="evi__value">{{ e.value }}<span class="evi__unit">{{ e.unit }}</span></span>
        <span class="evi__hint">{{ e.hint }}</span>
      </li>
    </ul>

    <!-- 主要动作 -->
    <div class="verdict__actions">
      <button class="btn btn--primary" @click="$emit('find-alternative')">
        <Sparkles :size="16" /> 换一个更健康的
      </button>
      <button class="btn btn--ghost" @click="$emit('add-compare')">
        <GitCompareArrows :size="16" /> 加入对比
      </button>
      <button class="btn btn--ghost" @click="$emit('share')">
        <Share2 :size="16" /> 分享给家人
      </button>
    </div>

    <!-- 折叠：为什么这么推荐 -->
    <button class="verdict__toggle" @click="expanded = !expanded">
      <ChevronDown :size="14" :class="{ 'is-open': expanded }" />
      {{ expanded ? '收起依据' : '为什么这么推荐？查看完整数据' }}
    </button>

    <transition name="fold">
      <div v-if="expanded" class="verdict__detail">
        <slot name="detail">
          <p class="verdict__hint-text">在此处放置完整营养表与添加剂列表（沿用现有卡片即可）。</p>
        </slot>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  CircleCheck, CircleAlert, CircleX,
  ChevronDown, Sparkles, GitCompareArrows, Share2,
} from 'lucide-vue-next'

const props = defineProps({
  result: { type: Object, required: true },
  // 用户健康档案，例：['高血压', '糖尿病']
  profileTags: { type: Array, default: () => [] },
})

defineEmits(['find-alternative', 'add-compare', 'share'])

const expanded = ref(false)

/* ── 把后端 healthTips 折叠成一个判决 ── */
const verdict = computed(() => {
  const tips = props.result?.healthTips || []
  const highs = tips.filter(t => t.level === '偏高').map(t => t.name)
  const risks = tips.filter(t => !['能量', '蛋白质', '脂肪', '碳水化合物', '钠'].includes(t.name))

  // 命中疾病禁忌 / 多项偏高 → 不建议
  if (risks.length >= 1 && props.profileTags.length) {
    return {
      level: 'avoid',
      label: '不建议你食用',
      icon: CircleX,
      reason: `检出 ${risks.length} 项与「${props.profileTags.join('、')}」相关的风险成分，建议避开。`,
    }
  }
  if (highs.length >= 2) {
    return {
      level: 'avoid',
      label: '不建议常吃',
      icon: CircleX,
      reason: `${highs.join('、')} 同时偏高，长期摄入对健康不利。`,
    }
  }
  if (highs.length === 1 || risks.length) {
    return {
      level: 'caution',
      label: '偶尔可以',
      icon: CircleAlert,
      reason: highs.length
        ? `${highs[0]}偏高，控制频次和分量，单次不超过半包。`
        : '存在轻度风险成分，对一般人群影响有限。',
    }
  }
  return {
    level: 'safe',
    label: '可以放心吃',
    icon: CircleCheck,
    reason: '主要营养素摄入水平适中，未检出明显风险成分。',
  }
})

/* ── 抽 3 条最突出的证据 ── */
const topEvidence = computed(() => {
  const tips = props.result?.healthTips || []
  const tone = (lv) => lv === '偏高' ? 'bad' : lv === '偏低' ? 'warn' : 'good'
  const hint = (lv) => lv === '偏高' ? '↑ 偏高' : lv === '偏低' ? '↓ 偏低' : '✓ 适中'
  return tips
    .filter(t => ['能量', '蛋白质', '脂肪', '碳水化合物', '钠'].includes(t.name))
    .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
    .slice(0, 3)
    .map(t => ({
      name: t.name,
      value: t.percentage != null ? t.percentage : '—',
      unit: t.percentage != null ? '% NRV' : '',
      hint: hint(t.level),
      tone: tone(t.level),
    }))
})
</script>

<style scoped>
/* ── 判决卡外壳 ── */
.verdict {
  position: relative;
  border-radius: var(--w-radius-lg);
  padding: var(--w-space-6);
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  box-shadow: var(--w-shadow-md);
  overflow: hidden;
}
.verdict::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 6px;
}
.verdict--safe::before    { background: var(--w-sage); }
.verdict--caution::before { background: var(--w-amber); }
.verdict--avoid::before   { background: var(--w-terracotta); }

/* ── 判决徽章 ── */
.verdict__head {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--w-space-4); flex-wrap: wrap;
  margin-bottom: var(--w-space-4);
}
.verdict__badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: var(--w-radius-full);
  font-family: var(--w-font-serif);
  font-size: 15px; letter-spacing: 0.12em;
}
.verdict--safe    .verdict__badge { background: var(--w-sage-soft);            color: var(--w-sage); }
.verdict--caution .verdict__badge { background: rgba(200, 134, 58, 0.18);      color: var(--w-amber); }
.verdict--avoid   .verdict__badge { background: rgba(179, 79, 58, 0.15);       color: var(--w-terracotta); }

.verdict__profile {
  font-size: 12px; color: var(--w-ink-soft); margin: 0;
  letter-spacing: 0.04em;
}
.verdict__tag {
  display: inline-block;
  padding: 1px 8px; margin-left: 4px;
  border-radius: var(--w-radius-full);
  background: var(--w-primary-pale); color: var(--w-primary);
  font-size: 11px;
}

/* ── 一句话理由（主视觉） ── */
.verdict__reason {
  font-family: var(--w-font-serif);
  font-size: 22px; line-height: 1.55;
  color: var(--w-ink); font-weight: 500;
  letter-spacing: 0.04em;
  margin: 0 0 var(--w-space-5);
}

/* ── 三条证据 ── */
.verdict__evidence {
  list-style: none; padding: 0; margin: 0 0 var(--w-space-5);
  display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--w-space-3);
}
.evi {
  padding: var(--w-space-3) var(--w-space-4);
  border-radius: var(--w-radius-sm);
  background: var(--w-bg-soft);
  border-left: 3px solid var(--w-divider);
  display: flex; flex-direction: column; gap: 4px;
}
.evi--good { border-left-color: var(--w-sage);       background: var(--w-sage-soft); }
.evi--bad  { border-left-color: var(--w-terracotta); background: rgba(179, 79, 58, 0.08); }
.evi--warn { border-left-color: var(--w-amber);      background: rgba(200, 134, 58, 0.10); }

.evi__name  { font-size: 12px; color: var(--w-ink-soft); letter-spacing: 0.06em; }
.evi__value { font-size: 22px; color: var(--w-ink); font-weight: 600; font-family: ui-monospace, Menlo, Consolas, monospace; }
.evi__unit  { font-size: 11px; color: var(--w-ink-soft); margin-left: 4px; font-weight: 400; }
.evi__hint  { font-size: 12px; }
.evi--good .evi__hint { color: var(--w-sage); }
.evi--bad  .evi__hint { color: var(--w-terracotta); }
.evi--warn .evi__hint { color: var(--w-amber); }

/* ── 动作按钮 ── */
.verdict__actions {
  display: flex; gap: var(--w-space-3); flex-wrap: wrap;
  margin-bottom: var(--w-space-4);
}
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 40px; padding: 0 18px;
  border-radius: var(--w-radius-full);
  font-size: 13px; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.18s var(--w-ease);
  border: 1px solid transparent;
}
.btn--primary {
  background: var(--w-primary); color: var(--w-surface);
  box-shadow: var(--w-shadow-sm);
}
.btn--primary:hover { background: var(--w-primary-hover); transform: translateY(-1px); box-shadow: var(--w-shadow-md); }
.btn--ghost {
  background: transparent; color: var(--w-ink-mid);
  border-color: var(--w-border-soft);
}
.btn--ghost:hover { color: var(--w-primary); border-color: var(--w-primary); }

/* ── 折叠开关 ── */
.verdict__toggle {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; border: 0;
  color: var(--w-ink-soft); font-size: 12.5px;
  letter-spacing: 0.06em; cursor: pointer;
  padding: 8px 0;
}
.verdict__toggle:hover { color: var(--w-primary); }
.verdict__toggle .is-open { transform: rotate(180deg); }
.verdict__toggle svg { transition: transform 0.2s var(--w-ease); }

.verdict__detail {
  margin-top: var(--w-space-4);
  padding-top: var(--w-space-4);
  border-top: 1px dashed var(--w-divider);
}
.verdict__hint-text { color: var(--w-ink-mute); font-size: 13px; margin: 0; }

/* ── 折叠动画 ── */
.fold-enter-active, .fold-leave-active {
  transition: max-height 0.32s var(--w-ease), opacity 0.2s var(--w-ease);
  overflow: hidden;
}
.fold-enter-from, .fold-leave-to { max-height: 0; opacity: 0; }
.fold-enter-to, .fold-leave-from { max-height: 1200px; opacity: 1; }

/* ── 移动端 ── */
@media (max-width: 600px) {
  .verdict { padding: var(--w-space-5); }
  .verdict__reason { font-size: 18px; }
  .verdict__evidence { grid-template-columns: 1fr; }
  .btn { flex: 1; justify-content: center; }
}
</style>
