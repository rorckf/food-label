<template>
  <nav v-if="showBottomNav" class="bottom-nav">
    <div class="nav-container">
      <!-- 首页 -->
      <router-link 
        to="/" 
        class="nav-item"
        :class="{ active: $route.path === '/' }"
        @click="handleNavClick"
      >
        <div class="nav-icon">
          <el-icon v-if="$route.path === '/'"><HomeFilled /></el-icon>
          <el-icon v-else><House /></el-icon>
        </div>
        <span class="nav-label">首页</span>
      </router-link>

      <!-- 历史记录 -->
      <router-link 
        to="/history" 
        class="nav-item"
        :class="{ active: $route.path === '/history' }"
        @click="handleNavClick"
      >
        <div class="nav-icon">
          <el-icon v-if="$route.path === '/history'"><DocumentChecked /></el-icon>
          <el-icon v-else><Document /></el-icon>
        </div>
        <span class="nav-label">历史</span>
      </router-link>

      <!-- 对比 -->
      <router-link
        to="/compare"
        class="nav-item"
        :class="{ active: $route.path === '/compare' }"
        @click="handleNavClick"
      >
        <div class="nav-icon">
          <el-icon v-if="$route.path === '/compare'"><Sort /></el-icon>
          <el-icon v-else><Operation /></el-icon>
        </div>
        <span class="nav-label">对比</span>
      </router-link>

      <!-- 偏好（过敏原 / 健康标签） -->
      <router-link
        to="/preferences"
        class="nav-item"
        :class="{ active: $route.path === '/preferences' }"
        @click="handleNavClick"
      >
        <div class="nav-icon">
          <el-icon v-if="$route.path === '/preferences'"><Setting /></el-icon>
          <el-icon v-else><Tools /></el-icon>
        </div>
        <span class="nav-label">偏好</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 响应式状态
const windowWidth = ref(window.innerWidth)

// 计算属性
const showBottomNav = computed(() => {
  // 移动端显示，桌面端隐藏
  return windowWidth.value <= 768
})

// 方法
const handleNavClick = () => {
  // 添加点击反馈动画
  const navItems = document.querySelectorAll('.nav-item')
  navItems.forEach(item => {
    item.classList.add('nav-item--active')
    setTimeout(() => {
      item.classList.remove('nav-item--active')
    }, 200)
  })
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--glass-border);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0;
  max-width: 500px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 16px;
  transition: all 0.3s ease;
  min-width: 60px;
  min-height: 44px;
  justify-content: center;
  touch-action: manipulation;
}

.nav-item:active {
  transform: scale(0.95);
  transition-duration: 0.1s;
}

.nav-item--active {
  transform: scale(0.95);
}

.nav-item.active {
  background: var(--primary-light);
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.nav-item.active .nav-icon {
  color: var(--primary);
  transform: scale(1.1);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.nav-item.active .nav-label {
  color: var(--primary);
  font-weight: 600;
}

/* 桌面端隐藏 */
@media (min-width: 769px) {
  .bottom-nav {
    display: none;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .nav-container {
    padding: 8px 12px;
  }
  
  .nav-item {
    padding: 8px 12px;
  }
  
  .nav-label {
    font-size: 10px;
  }
}

/* 小屏幕手机 */
@media (max-width: 375px) {
  .nav-container {
    padding: 6px 8px;
  }
  
  .nav-item {
    padding: 6px 10px;
    min-width: 50px;
  }
  
  .nav-icon {
    font-size: 18px;
  }
  
  .nav-label {
    font-size: 9px;
  }
}

/* 深色模式适配 */
[data-theme="dark"] .bottom-nav {
  background: rgba(30, 30, 30, 0.9);
  border-top-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .nav-item.active {
  background: rgba(42, 157, 143, 0.2);
}

/* 性能优化 */
.nav-item {
  will-change: transform;
}

/* 动画效果 */
@keyframes navItemBounce {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.nav-item--active {
  animation: navItemBounce 0.2s ease;
}
</style>