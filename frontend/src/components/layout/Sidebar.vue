<template>
  <aside class="sidebar" :aria-label="'主导航'">
    <nav class="sidebar__nav">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="sidebar__item"
        :class="{ 'is-active': isActive(item) }"
      >
        <component :is="item.icon" :size="20" class="sidebar__icon" />
        <span class="sidebar__label">{{ item.label }}</span>
        <span class="sidebar__dot" aria-hidden="true"></span>
      </router-link>
    </nav>

    <div class="sidebar__foot">
      <p class="sidebar__quote">“食在知而后行”</p>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { UploadCloud, Clock, Scale, Settings2, Sparkles } from 'lucide-vue-next'

const route = useRoute()

const items = [
  { to: '/',            label: '上传识别', icon: UploadCloud, match: ['/'] },
  { to: '/recommend',   label: '为你推荐', icon: Sparkles,    match: ['/recommend'] },
  { to: '/history',     label: '历史记录', icon: Clock,       match: ['/history'] },
  { to: '/compare',     label: '成分对比', icon: Scale,       match: ['/compare'] },
  { to: '/preferences', label: '个人偏好', icon: Settings2,   match: ['/preferences'] },
]

const isActive = (item) => {
  const p = route.path
  if (item.to === '/') return p === '/'
  return item.match.some(m => p === m || p.startsWith(m + '/'))
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: var(--w-brandbar-h);
  left: 0;
  bottom: 0;
  width: var(--w-sidebar-w);
  padding: var(--w-space-6) var(--w-space-4);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: transparent;
  border-right: 1px solid var(--w-border-soft);
  z-index: 10;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--w-space-2);
}

.sidebar__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: var(--w-radius-full);
  color: var(--w-ink-mid);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.06em;
  transition: all 0.25s var(--w-ease);
}

.sidebar__item:hover {
  color: var(--w-primary);
  background: var(--w-primary-pale);
}

.sidebar__item.is-active {
  color: var(--w-primary-hover);
  background: var(--w-surface);
  box-shadow: var(--w-shadow-sm);
}

.sidebar__icon { flex-shrink: 0; }

.sidebar__dot {
  position: absolute;
  left: -4px;
  top: 50%;
  width: 4px;
  height: 22px;
  border-radius: 0 4px 4px 0;
  background: var(--w-primary);
  transform: translateY(-50%) scaleY(0);
  transform-origin: center;
  transition: transform 0.3s var(--w-ease-out);
}
.sidebar__item.is-active .sidebar__dot { transform: translateY(-50%) scaleY(1); }

.sidebar__foot {
  padding: var(--w-space-3) var(--w-space-4);
  border-top: 1px dashed var(--w-divider);
}

.sidebar__quote {
  font-family: var(--w-font-serif);
  font-style: italic;
  font-size: 13px;
  color: var(--w-ink-soft);
  text-align: center;
  letter-spacing: 0.1em;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 1024px) {
  .sidebar { padding: var(--w-space-5) 10px; }
  .sidebar__label, .sidebar__foot { display: none; }
  .sidebar__item { justify-content: center; padding: 12px; }
}
@media (max-width: 720px) {
  .sidebar { display: none; }
}
</style>
