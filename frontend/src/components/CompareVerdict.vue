<template>
  <section class="cv">
    <!-- ① 推荐结论横幅 ── 全屏宽，色彩驱动 -->
    <header class="cv__banner" :class="`cv__banner--${winnerSide.toLowerCase()}`">
      <div class="cv__banner-eyebrow">
        <Sparkles :size="14" />
        <span>系统推荐结论</span>
      </div>
      <h2 class="cv__banner-title">
        <Trophy :size="24" :stroke-width="2" />
        <template v-if="winnerSide === 'TIE'">两款各有所长</template>
        <template v-else>
          推荐 <span class="cv__banner-pick">{{ winnerName }}</span>
        </template>
      </h2>
      <p class="cv__banner-reason">{{ verdictReason }}</p>

      <!-- 胜负计分 -->
      <div class="cv__score">
        <div class="cv__score-side cv__score-side--a" :class="{ 'is-win': winnerSide === 'A' }">
          <span class="cv__score-tag">A</span>
          <span class="cv__score-name">{{ result.productA.productName }}</span>
          <span class="cv__score-wins">{{ counts.A }} <em>项胜出</em></span>
        </div>
        <div class="cv__score-vs">
          <div class="cv__score-bar">
            <div class="cv__score-fill cv__score-fill--a" :style="{ flex: counts.A || 0.001 }"></div>
            <div class="cv__score-fill cv__score-fill--tie" :style="{ flex: counts.TIE || 0.001 }"></div>
            <div class="cv__score-fill cv__score-fill--b" :style="{ flex: counts.B || 0.001 }"></div>
          </div>
        </div>
        <div class="cv__score-side cv__score-side--b" :class="{ 'is-win': winnerSide === 'B' }">
          <span class="cv__score-name">{{ result.productB.productName }}</span>
          <span class="cv__score-tag">B</span>
          <span class="cv__score-wins">{{ counts.B }} <em>项胜出</em></span>
        </div>
      </div>
    </header>

    <!-- ② 雷达图叠加 -->
    <div class="cv__radar-wrap">
      <h3 class="cv__sec-title">六维全景</h3>
      <div ref="radarEl" class="cv__radar"></div>
      <div class="cv__legend">
        <span class="cv__legend-item cv__legend-item--a">
          <i></i>{{ result.productA.productName }}
        </span>
        <span class="cv__legend-item cv__legend-item--b">
          <i></i>{{ result.productB.productName }}
        </span>
      </div>
    </div>

    <!-- ③ 逐维度对比条 -->
    <div class="cv__bars">
      <h3 class="cv__sec-title">逐项对比</h3>
      <div v-for="(m, name) in result.metrics" :key="name" class="bar">
        <div class="bar__name">{{ name }}</div>
        <div class="bar__row">
          <!-- A 侧（向左生长） -->
          <div class="bar__side bar__side--a" :class="m.winner === 'A' ? 'is-win' : (m.winner === 'TIE' ? 'is-tie' : 'is-lose')">
            <span class="bar__val">{{ formatVal(m.a, name) }}</span>
            <div class="bar__track">
              <div class="bar__fill bar__fill--a" :style="{ width: pct(m.a, m, name) + '%' }">
                <CheckCircle2 v-if="m.winner === 'A'" :size="12" class="bar__check" />
              </div>
            </div>
          </div>
          <!-- 中线 -->
          <div class="bar__center">vs</div>
          <!-- B 侧（向右生长） -->
          <div class="bar__side bar__side--b" :class="m.winner === 'B' ? 'is-win' : (m.winner === 'TIE' ? 'is-tie' : 'is-lose')">
            <div class="bar__track">
              <div class="bar__fill bar__fill--b" :style="{ width: pct(m.b, m, name) + '%' }">
                <CheckCircle2 v-if="m.winner === 'B'" :size="12" class="bar__check" />
              </div>
            </div>
            <span class="bar__val">{{ formatVal(m.b, name) }}</span>
          </div>
        </div>
        <div class="bar__hint" v-if="metricHint(name, m)">{{ metricHint(name, m) }}</div>
      </div>
    </div>

    <!-- ④ 行动栏：直通第三层 -->
    <footer class="cv__cta">
      <button class="btn btn--primary" @click="$emit('share-card')">
        <Share2 :size="16" /> 把这个推荐发给家人
      </button>
      <button class="btn btn--ghost" @click="$emit('see-detail', winnerSide)">
        <Eye :size="16" /> 查看 {{ winnerSide === 'TIE' ? '完整' : winnerName }} 详情
      </button>
      <button class="btn btn--ghost" @click="$emit('restart')">
        <RotateCcw :size="16" /> 换两款再比
      </button>
    </footer>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import {
  Sparkles, Trophy, CheckCircle2, Share2, Eye, RotateCcw,
} from 'lucide-vue-next'

const props = defineProps({
  result: { type: Object, required: true },
})

defineEmits(['share-card', 'see-detail', 'restart'])

/* ── 胜负统计 ── */
const counts = computed(() => {
  const c = { A: 0, B: 0, TIE: 0 }
  Object.values(props.result.metrics || {}).forEach(m => {
    c[m.winner] = (c[m.winner] || 0) + 1
  })
  return c
})

const winnerSide = computed(() => {
  if (counts.value.A > counts.value.B) return 'A'
  if (counts.value.B > counts.value.A) return 'B'
  return 'TIE'
})

const winnerName = computed(() =>
  winnerSide.value === 'A'
    ? props.result.productA.productName
    : props.result.productB.productName
)

const verdictReason = computed(() => {
  if (props.result.recommendation) return props.result.recommendation
  if (winnerSide.value === 'TIE') return '六维评分相当，可根据个人偏好选择。'
  const wins = Object.entries(props.result.metrics)
    .filter(([, m]) => m.winner === winnerSide.value)
    .slice(0, 3)
    .map(([n]) => n)
  return `${winnerName.value} 在 ${wins.join('、')} 等维度更优，推荐选择。`
})

/* ── 维度归一化（用于条形与雷达） ── */
const METRIC_AXES = {
  '能量':       { max: 600,  invert: true  },
  '蛋白质':     { max: 25,   invert: false },
  '脂肪':       { max: 40,   invert: true  },
  '碳水化合物': { max: 80,   invert: true  },
  '钠':         { max: 1000, invert: true  },
  '添加剂数量': { max: 15,   invert: true  },
}

const pct = (v, m, name) => {
  if (v == null) return 0
  const ax = METRIC_AXES[name] || { max: 100, invert: false }
  const ratio = Math.min(100, (Number(v) / ax.max) * 100)
  return Math.max(4, ratio)
}

const formatVal = (v, name) => {
  if (v == null) return '—'
  if (name === '添加剂数量') return Math.round(v)
  return Number(v).toFixed(1)
}

const metricHint = (name, m) => {
  const ax = METRIC_AXES[name]
  if (!ax || m.winner === 'TIE') return ''
  return ax.invert ? `（数值越低越优）` : `（数值越高越优）`
}

/* ── ECharts 雷达图叠加 ── */
const radarEl = ref(null)
let chart = null

const renderRadar = () => {
  if (!radarEl.value) return
  if (!chart) chart = echarts.init(radarEl.value)
  const indicators = Object.keys(METRIC_AXES)
    .filter(k => props.result.metrics[k] != null)
    .map(name => {
      const ax = METRIC_AXES[name]
      return { name: ax.invert ? `${name} ↓` : `${name} ↑`, max: 100 }
    })

  const score = (v, name) => {
    if (v == null) return 0
    const ax = METRIC_AXES[name]
    const r = Math.min(100, (Number(v) / ax.max) * 100)
    return ax.invert ? 100 - r : r
  }

  const dataA = indicators.map(ind => {
    const name = ind.name.replace(/ [↑↓]$/, '')
    return score(props.result.metrics[name]?.a, name)
  })
  const dataB = indicators.map(ind => {
    const name = ind.name.replace(/ [↑↓]$/, '')
    return score(props.result.metrics[name]?.b, name)
  })

  chart.setOption({
    color: ['#6B8E6F', '#C8863A'],
    tooltip: { trigger: 'item' },
    legend: { show: false },
    radar: {
      indicator: indicators,
      radius: '68%',
      axisName: { color: '#73573B', fontSize: 11, padding: [3, 6] },
      splitArea: {
        show: true,
        areaStyle: { color: ['rgba(127,159,127,0.04)', 'rgba(200,134,58,0.06)'] },
      },
      splitLine: { lineStyle: { color: '#EAD9B8' } },
      axisLine: { lineStyle: { color: '#EAD9B8' } },
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.28 },
      data: [
        { value: dataA, name: props.result.productA.productName },
        { value: dataB, name: props.result.productB.productName },
      ],
    }],
  })
}

const onResize = () => chart && chart.resize()
watch(() => props.result, () => nextTick(renderRadar), { deep: true })
onMounted(() => { nextTick(renderRadar); window.addEventListener('resize', onResize) })
onUnmounted(() => { chart?.dispose(); window.removeEventListener('resize', onResize) })
</script>

<style scoped>
.cv {
  display: flex; flex-direction: column;
  gap: var(--w-space-6);
}

/* ── ① 推荐结论横幅 ── */
.cv__banner {
  position: relative;
  padding: var(--w-space-6) var(--w-space-7);
  border-radius: var(--w-radius-xl);
  color: var(--w-ink);
  background: linear-gradient(135deg, var(--w-sage-soft), var(--w-surface) 80%);
  border: 1px solid var(--w-border-soft);
  box-shadow: var(--w-shadow-md);
  overflow: hidden;
}
.cv__banner--a { background: linear-gradient(135deg, var(--w-sage-soft) 0%, var(--w-surface) 70%); }
.cv__banner--b { background: linear-gradient(135deg, rgba(200,134,58,0.22) 0%, var(--w-surface) 70%); }
.cv__banner--tie { background: linear-gradient(135deg, var(--w-bg-soft), var(--w-surface) 70%); }

.cv__banner-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; letter-spacing: 0.2em;
  color: var(--w-amber); font-weight: 500;
  margin-bottom: var(--w-space-3);
}
.cv__banner-title {
  font-family: var(--w-font-serif);
  font-size: 32px;
  display: flex; align-items: center; gap: 12px;
  color: var(--w-ink); margin: 0 0 var(--w-space-3);
  letter-spacing: 0.06em; font-weight: 500;
}
.cv__banner-title svg { color: var(--w-amber); }
.cv__banner-pick {
  background: linear-gradient(180deg, transparent 60%, rgba(200,134,58,0.4) 60%);
  padding: 0 4px;
}
.cv__banner-reason {
  font-size: 15px; line-height: 1.8;
  color: var(--w-ink-mid);
  margin: 0 0 var(--w-space-5);
  letter-spacing: 0.03em;
  max-width: 720px;
}

/* 胜负计分条 */
.cv__score {
  display: grid;
  grid-template-columns: 1fr 1.6fr 1fr;
  gap: var(--w-space-4);
  align-items: center;
  padding-top: var(--w-space-4);
  border-top: 1px dashed var(--w-divider);
}
.cv__score-side {
  display: flex; align-items: center; gap: 10px;
  flex-wrap: wrap;
  font-size: 13px; color: var(--w-ink-mid);
  transition: opacity 0.2s var(--w-ease);
}
.cv__score-side--b { justify-content: flex-end; text-align: right; }
.cv__score-side:not(.is-win) { opacity: 0.55; }
.cv__score-tag {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--w-font-serif); font-weight: 600; font-size: 13px;
}
.cv__score-side--a .cv__score-tag { background: var(--w-sage); color: #FFFBF2; }
.cv__score-side--b .cv__score-tag { background: var(--w-amber); color: #FFFBF2; }
.cv__score-name {
  flex: 1; min-width: 0;
  font-weight: 500; color: var(--w-ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cv__score-wins {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 18px; font-weight: 600; color: var(--w-ink);
}
.cv__score-wins em { font-size: 11px; color: var(--w-ink-soft); font-style: normal; margin-left: 2px; }

.cv__score-bar {
  display: flex; height: 10px;
  border-radius: var(--w-radius-full);
  overflow: hidden;
  background: var(--w-divider);
}
.cv__score-fill { transition: flex 0.5s var(--w-ease); }
.cv__score-fill--a   { background: var(--w-sage); }
.cv__score-fill--tie { background: var(--w-ink-mute); }
.cv__score-fill--b   { background: var(--w-amber); }

/* ── ② 雷达图 ── */
.cv__radar-wrap {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  padding: var(--w-space-5);
}
.cv__sec-title {
  font-family: var(--w-font-serif);
  font-size: 16px; letter-spacing: 0.12em;
  color: var(--w-ink); margin: 0 0 var(--w-space-4);
  text-align: center; font-weight: 500;
}
.cv__radar { width: 100%; height: 360px; }
.cv__legend {
  display: flex; justify-content: center; gap: var(--w-space-5);
  margin-top: var(--w-space-3);
  font-size: 12.5px; color: var(--w-ink-mid);
}
.cv__legend-item { display: inline-flex; align-items: center; gap: 6px; }
.cv__legend-item i {
  width: 12px; height: 12px; border-radius: 3px; display: inline-block;
}
.cv__legend-item--a i { background: var(--w-sage); }
.cv__legend-item--b i { background: var(--w-amber); }

/* ── ③ 逐项对比条 ── */
.cv__bars {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  padding: var(--w-space-5) var(--w-space-6);
}
.bar {
  padding: var(--w-space-3) 0;
  border-bottom: 1px dashed var(--w-divider);
}
.bar:last-child { border-bottom: 0; }
.bar__name {
  font-size: 13px; color: var(--w-ink-soft);
  letter-spacing: 0.06em; margin-bottom: 6px;
  text-align: center;
}
.bar__row {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  gap: var(--w-space-3);
  align-items: center;
}
.bar__side {
  display: flex; align-items: center; gap: 10px;
}
.bar__side--a { flex-direction: row-reverse; } /* A 侧从右往左生长 */

.bar__val {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 14px; font-weight: 600;
  min-width: 48px;
  flex-shrink: 0;
  color: var(--w-ink);
}
.bar__side--a .bar__val { text-align: left; }
.bar__side--b .bar__val { text-align: right; }

.bar__track {
  flex: 1;
  height: 22px;
  border-radius: var(--w-radius-sm);
  background: var(--w-bg-soft);
  position: relative;
  overflow: hidden;
}
.bar__fill {
  height: 100%;
  display: flex; align-items: center; justify-content: flex-end;
  padding: 0 6px;
  border-radius: var(--w-radius-sm);
  transition: width 0.6s var(--w-ease-out);
  min-width: 4%;
}
.bar__fill--a {
  margin-left: auto; /* 贴右生长（视觉上从中线向左） */
}
.bar__check { color: #FFFBF2; }

.bar__side.is-win .bar__fill {
  background: var(--w-sage);
  box-shadow: 0 0 0 2px rgba(127, 159, 127, 0.3);
}
.bar__side--b.is-win .bar__fill { background: var(--w-amber); box-shadow: 0 0 0 2px rgba(200, 134, 58, 0.3); }
.bar__side.is-lose .bar__fill { background: rgba(179, 79, 58, 0.45); }
.bar__side.is-lose .bar__val  { color: var(--w-terracotta); opacity: 0.7; }
.bar__side.is-tie  .bar__fill { background: var(--w-ink-mute); }
.bar__side.is-win  .bar__val  { color: var(--w-ink); font-size: 16px; }

.bar__center {
  text-align: center;
  font-size: 10px; letter-spacing: 0.2em;
  color: var(--w-ink-mute);
}
.bar__hint {
  text-align: center;
  font-size: 11px; color: var(--w-ink-mute);
  margin-top: 4px;
}

/* ── ④ 行动栏 ── */
.cv__cta {
  display: flex; flex-wrap: wrap; gap: var(--w-space-3);
  justify-content: center;
  padding-top: var(--w-space-2);
}
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 44px; padding: 0 22px;
  border-radius: var(--w-radius-full);
  font-size: 13px; letter-spacing: 0.1em;
  cursor: pointer; transition: all 0.2s var(--w-ease);
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

@media (max-width: 720px) {
  .cv__banner { padding: var(--w-space-5); }
  .cv__banner-title { font-size: 24px; }
  .cv__score { grid-template-columns: 1fr; gap: var(--w-space-3); }
  .cv__score-side--b { justify-content: flex-start; text-align: left; }
  .cv__radar { height: 300px; }
  .bar__row { grid-template-columns: 1fr 30px 1fr; }
}
</style>
