<template>
  <div class="sidebar-container" @mousemove="handleSidebarHover">
    <header class="app-header" :class="{ 'sidebar-hidden': sidebarHidden }">
      <div class="header-content">
        <!-- 品牌 Logo -->
        <div class="brand-logo">
          <span class="brand-icon">🌾</span>
        </div>

        <!-- 垂直导航 -->
        <nav class="nav-icons-vertical">
          <el-tooltip content="首页" placement="right" :effect="'light'">
            <router-link to="/" class="nav-item" :class="{ active: currentPath === '/' }">
              <el-icon><HomeFilled v-if="currentPath === '/'" /><House v-else /></el-icon>
              <span class="nav-label">首页</span>
            </router-link>
          </el-tooltip>

          <el-tooltip content="历史记录" placement="right" :effect="'light'">
            <router-link to="/history" class="nav-item" :class="{ active: currentPath === '/history' }">
              <el-icon><DocumentChecked v-if="currentPath === '/history'" /><Document v-else /></el-icon>
              <span class="nav-label">记录</span>
            </router-link>
          </el-tooltip>
        </nav>

        <!-- 底部装饰 -->
        <div class="sidebar-footer">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </header>
    <div class="sidebar-trigger" @mousemove="handleTriggerHover"></div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  House, HomeFilled,
  Document, DocumentChecked,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const sidebarHidden = ref(false)
let hideTimer = null

const handleSidebarHover = () => {
  sidebarHidden.value = false
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { sidebarHidden.value = true }, 3000)
}

const handleTriggerHover = (event) => {
  if (event.clientX <= 10) {
    sidebarHidden.value = false
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => { sidebarHidden.value = true }, 3000)
  }
}

const currentPath = computed(() => route.path)
</script>

<style scoped>
.sidebar-container {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
}

.app-header {
  background: var(--warm-sidebar, #2B1A0D);
  border-right: 1px solid rgba(212, 136, 61, 0.2);
  position: relative;
  height: 100vh;
  width: 72px;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 3px 0 20px rgba(43, 26, 13, 0.3);
}

.app-header.sidebar-hidden {
  transform: translateX(-72px);
}

.sidebar-trigger {
  position: absolute;
  left: 72px;
  top: 0;
  height: 100vh;
  width: 12px;
  cursor: pointer;
  z-index: -1;
}

.header-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  gap: 0;
}

/* 品牌 Logo */
.brand-logo {
  width: 48px;
  height: 48px;
  background: rgba(212, 136, 61, 0.15);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  border: 1px solid rgba(212, 136, 61, 0.25);
}

.brand-icon {
  font-size: 22px;
  line-height: 1;
}

/* 导航 */
.nav-icons-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: rgba(212, 136, 61, 0.55);
  text-decoration: none;
  transition: all 0.25s ease;
  gap: 4px;
}

.nav-item .el-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 10px;
  letter-spacing: 0.02em;
  line-height: 1;
}

.nav-item:hover {
  background: rgba(212, 136, 61, 0.12);
  color: var(--warm-amber-soft, #E8A85C);
  transform: translateX(2px);
}

.nav-item.active {
  background: rgba(212, 136, 61, 0.18);
  color: var(--warm-amber, #D4883D);
  box-shadow: inset 2px 0 0 var(--warm-amber, #D4883D),
              0 0 12px rgba(212, 136, 61, 0.15);
}

/* 底部装饰点 */
.sidebar-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding-bottom: 24px;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(212, 136, 61, 0.25);
}

.dot:first-child { background: rgba(212, 136, 61, 0.45); }
.dot:nth-child(2) { background: rgba(212, 136, 61, 0.30); }

/* 响应式 */
@media (max-width: 768px) {
  .app-header { width: 60px; }
  .app-header.sidebar-hidden { transform: translateX(-60px); }
  .sidebar-trigger { left: 60px; }
  .nav-item { width: 44px; height: 44px; }
}

@media (max-width: 480px) {
  .app-header { width: 52px; }
  .app-header.sidebar-hidden { transform: translateX(-52px); }
  .sidebar-trigger { left: 52px; }
}
</style>
