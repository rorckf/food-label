<template>
  <section class="intent">
    <!-- 健康档案条：让用户感到"系统记得我" -->
    <div class="intent__profile">
      <UserCircle2 :size="16" />
      <span class="intent__profile-greet">{{ greeting }}，</span>
      <template v-if="profileTags.length">
        <span class="intent__profile-text">今天为你按以下偏好推荐</span>
        <span v-for="(t, i) in profileTags" :key="i" class="intent__chip">{{ t }}</span>
      </template>
      <template v-else>
        <span class="intent__profile-text">完善健康档案后推荐更精准</span>
        <button class="intent__profile-link" @click="$emit('edit-profile')">去设置 →</button>
      </template>
    </div>

    <!-- 主问句 -->
    <h1 class="intent__title">今天想让我帮你做什么？</h1>
    <p class="intent__sub">三种推荐方式，选一种开始</p>

    <!-- 三入口意图卡 -->
    <div class="intent__grid">
      <button
        v-for="card in cards"
        :key="card.key"
        class="ic"
        :class="`ic--${card.tone}`"
        @click="onPick(card)"
      >
        <div class="ic__icon"><component :is="card.icon" :size="28" :stroke-width="1.6" /></div>
        <div class="ic__layer">{{ card.layer }}</div>
        <h3 class="ic__title">{{ card.title }}</h3>
        <p class="ic__desc">{{ card.desc }}</p>

        <ul class="ic__cases">
          <li v-for="(c, i) in card.cases" :key="i">· {{ c }}</li>
        </ul>

        <span class="ic__cta">
          {{ card.cta }} <ArrowRight :size="14" />
        </span>
      </button>
    </div>

    <!-- 最近推荐流：体现"推荐系统"在持续输出 -->
    <div v-if="recentRecommendations.length" class="intent__feed">
      <header class="intent__feed-head">
        <Sparkles :size="14" />
        <span>为你最近的扫描推荐</span>
      </header>
      <ul class="intent__feed-list">
        <li
          v-for="(r, i) in recentRecommendations"
          :key="i"
          class="rec"
          @click="$emit('open-recommendation', r)"
        >
          <span class="rec__dot" :class="`rec__dot--${r.level}`"></span>
          <span class="rec__name">{{ r.name }}</span>
          <span class="rec__verdict">{{ r.verdictText }}</span>
          <ChevronRight :size="14" class="rec__arrow" />
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import {
  Filter, Scale, Share2, ArrowRight, ChevronRight,
  UserCircle2, Sparkles,
} from 'lucide-vue-next'

const props = defineProps({
  profileTags: { type: Array, default: () => [] },
  userName: { type: String, default: '' },
  recentRecommendations: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'pick-filter',      // 第一层：上传单品筛选
  'pick-compare',     // 第二层：择优对比
  'pick-shared',      // 第三层：传播 / 朋友推荐
  'edit-profile',
  'open-recommendation',
])

const greeting = computed(() => {
  const h = new Date().getHours()
  const tod = h < 6 ? '凌晨好' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好'
  return props.userName ? `${tod}，${props.userName}` : tod
})

const cards = [
  {
    key: 'filter', tone: 'sage', icon: Filter, layer: '第 1 层 · 过滤推荐',
    title: '帮我筛一下',
    desc: '上传一款食品，系统结合你的健康档案告诉你能不能吃。',
    cases: ['这款薯片我能吃吗？', '宝宝能不能喝这款酸奶？'],
    cta: '上传标签',
  },
  {
    key: 'compare', tone: 'amber', icon: Scale, layer: '第 2 层 · 择优推荐',
    title: '帮我选一个',
    desc: '同品类两款对比，六维度自动给出明确推荐结论。',
    cases: ['两款牛奶选哪个？', '哪款饼干更适合老人？'],
    cta: '开始对比',
  },
  {
    key: 'shared', tone: 'terra', icon: Share2, layer: '第 3 层 · 传播推荐',
    title: '看看大家在推什么',
    desc: '查看家人朋友分享给你的推荐卡片，或回顾你推荐过的。',
    cases: ['妈妈给我推荐的低糖食品', '我上周推荐给同事的'],
    cta: '查看推荐流',
  },
]

const onPick = (card) => {
  if (card.key === 'filter') emit('pick-filter')
  else if (card.key === 'compare') emit('pick-compare')
  else emit('pick-shared')
}
</script>

<style scoped>
.intent {
  max-width: var(--w-content-max);
  margin: 0 auto;
  padding: var(--w-space-7) var(--w-space-6) var(--w-space-5);
}

/* ── 健康档案条 ── */
.intent__profile {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px;
  background: var(--w-primary-pale);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-full);
  color: var(--w-ink-mid);
  font-size: 12.5px;
  letter-spacing: 0.04em;
  margin-bottom: var(--w-space-5);
}
.intent__profile-greet { color: var(--w-ink); font-weight: 500; }
.intent__profile-text { color: var(--w-ink-soft); }
.intent__chip {
  display: inline-block;
  padding: 1px 8px;
  border-radius: var(--w-radius-full);
  background: var(--w-surface);
  color: var(--w-primary);
  font-size: 11px;
  font-weight: 500;
}
.intent__profile-link {
  background: transparent; border: 0; padding: 0;
  color: var(--w-primary); font-size: 12px;
  cursor: pointer; letter-spacing: 0.04em;
}
.intent__profile-link:hover { color: var(--w-primary-hover); }

/* ── 主问句 ── */
.intent__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.06em;
  margin: 0 0 var(--w-space-2);
  line-height: 1.4;
}
.intent__sub {
  color: var(--w-ink-soft);
  font-size: 14px; letter-spacing: 0.06em;
  margin: 0 0 var(--w-space-6);
}

/* ── 三入口卡片 ── */
.intent__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--w-space-5);
}
.ic {
  position: relative;
  display: flex; flex-direction: column;
  text-align: left;
  padding: var(--w-space-5) var(--w-space-5) var(--w-space-4);
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  cursor: pointer;
  transition: all 0.25s var(--w-ease);
  overflow: hidden;
  min-height: 280px;
}
.ic::before {
  content: '';
  position: absolute; inset: 0 0 auto 0; height: 4px;
  transition: height 0.25s var(--w-ease);
}
.ic--sage::before  { background: var(--w-sage); }
.ic--amber::before { background: var(--w-amber); }
.ic--terra::before { background: var(--w-terracotta); }

.ic:hover {
  transform: translateY(-4px);
  box-shadow: var(--w-shadow-lg);
}
.ic:hover::before { height: 6px; }

.ic__icon {
  width: 52px; height: 52px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--w-radius-md);
  margin-bottom: var(--w-space-4);
}
.ic--sage  .ic__icon { background: var(--w-sage-soft); color: var(--w-sage); }
.ic--amber .ic__icon { background: rgba(200, 134, 58, 0.18); color: var(--w-amber); }
.ic--terra .ic__icon { background: rgba(179, 79, 58, 0.12); color: var(--w-terracotta); }

.ic__layer {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--w-ink-soft);
  margin-bottom: 6px;
  font-weight: 500;
}
.ic__title {
  font-family: var(--w-font-serif);
  font-size: 22px;
  color: var(--w-ink);
  margin: 0 0 var(--w-space-2);
  letter-spacing: 0.04em;
  font-weight: 500;
}
.ic__desc {
  font-size: 13px;
  color: var(--w-ink-mid);
  line-height: 1.7;
  margin: 0 0 var(--w-space-3);
}
.ic__cases {
  list-style: none; padding: 0; margin: 0 0 var(--w-space-4);
  display: flex; flex-direction: column; gap: 4px;
  border-top: 1px dashed var(--w-divider);
  padding-top: var(--w-space-3);
}
.ic__cases li {
  font-size: 12px;
  color: var(--w-ink-soft);
  line-height: 1.6;
  letter-spacing: 0.02em;
}
.ic__cta {
  margin-top: auto;
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--w-primary);
  font-weight: 500;
  transition: gap 0.2s var(--w-ease);
}
.ic:hover .ic__cta { gap: 10px; }
.ic--sage  .ic__cta { color: var(--w-sage); }
.ic--amber .ic__cta { color: var(--w-amber); }
.ic--terra .ic__cta { color: var(--w-terracotta); }

/* ── 最近推荐流 ── */
.intent__feed {
  margin-top: var(--w-space-6);
  padding: var(--w-space-4) var(--w-space-5);
  background: var(--w-bg-soft);
  border-radius: var(--w-radius-md);
}
.intent__feed-head {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--w-amber);
  font-weight: 500;
  margin-bottom: var(--w-space-3);
}
.intent__feed-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column;
}
.rec {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dotted var(--w-divider);
  cursor: pointer;
  transition: padding 0.2s var(--w-ease);
}
.rec:last-child { border-bottom: 0; }
.rec:hover { padding-left: 6px; }

.rec__dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0;
}
.rec__dot--safe    { background: var(--w-sage); }
.rec__dot--caution { background: var(--w-amber); }
.rec__dot--avoid   { background: var(--w-terracotta); }

.rec__name {
  font-size: 13.5px;
  color: var(--w-ink);
  font-weight: 500;
  flex-shrink: 0;
}
.rec__verdict {
  flex: 1;
  font-size: 12.5px;
  color: var(--w-ink-mid);
  letter-spacing: 0.02em;
}
.rec__arrow {
  color: var(--w-ink-mute);
  flex-shrink: 0;
}

@media (max-width: 880px) {
  .intent__grid { grid-template-columns: 1fr; }
  .ic { min-height: auto; }
}
</style>
