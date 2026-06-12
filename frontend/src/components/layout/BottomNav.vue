<template>
  <nav v-if="showBottomNav" class="bottom-nav">
    <div class="nav-container">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="nav-item"
        :class="{ active: isActive(tab.path) }"
      >
        <component :is="tab.icon" :size="22" :stroke-width="isActive(tab.path) ? 2.4 : 1.8" class="nav-icon" />
        <span class="nav-label">{{ tab.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Home, History, Scale, SlidersHorizontal } from 'lucide-vue-next'

const props = defineProps({
  /** 单机App模式:无视窗口宽度,始终显示 */
  force: { type: Boolean, default: false }
})

const route = useRoute()

const tabs = [
  { path: '/', label: '首页', icon: Home },
  { path: '/history', label: '历史', icon: History },
  { path: '/compare', label: '对比', icon: Scale },
  { path: '/preferences', label: '偏好', icon: SlidersHorizontal },
]

const isActive = (path) =>
  path === '/' ? route.path === '/' : route.path.startsWith(path)

const windowWidth = ref(window.innerWidth)
const showBottomNav = computed(() => props.force || windowWidth.value <= 768)

const handleResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 253, 246, 0.92);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  border-top: 1px solid var(--w-border-soft, #e8dcc8);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 6px 8px;
  max-width: 520px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 14px;
  min-width: 60px;
  min-height: 48px;
  color: var(--w-ink-mid, #8a7a66);
  transition: color 0.2s, background 0.2s, transform 0.12s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.nav-item:active { transform: scale(0.92); }

.nav-item.active {
  color: var(--w-primary, #2A9D8F);
  background: rgba(42, 157, 143, 0.10);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

/* 桌面端(非 force)隐藏由 JS 控制,此处兜底 */
@media (min-width: 1200px) {
  .bottom-nav:not(.bottom-nav--force) { }
}

[data-theme="dark"] .bottom-nav {
  background: rgba(30, 30, 30, 0.92);
  border-top-color: rgba(255, 255, 255, 0.1);
}
</style>
