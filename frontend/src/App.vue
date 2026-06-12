<template>
  <div id="app" class="shell" :class="{ 'shell--auth': isAuthRoute, 'shell--local': localMode }">
    <!-- 网页版:品牌栏 + 侧边栏;单机App:全部隐藏,导航交给底部 Tab -->
    <template v-if="!isAuthRoute && !localMode">
      <BrandBar />
      <Sidebar />
    </template>

    <main
      class="shell__main"
      :class="{ 'shell__main--auth': isAuthRoute, 'shell__main--local': localMode }"
    >
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部导航:单机App常驻;网页版仅窄屏显示(组件内部自适应) -->
    <BottomNav v-if="!isAuthRoute" :force="localMode" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BrandBar from '@/components/layout/BrandBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import { isLocalMode } from '@/local/appMode'

const route = useRoute()
const isAuthRoute = computed(() => ['Login', 'Register'].includes(route.name))
const localMode = isLocalMode()

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('visible'))
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el))
})
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.shell__main {
  flex: 1;
  padding-left: var(--w-sidebar-w);
  transition: padding-left 0.3s var(--w-ease);
}

.shell__main--auth {
  padding-left: 0;
}

/* 单机App:无侧边栏,底部给 Tab 导航留出空间(含手势条) */
.shell__main--local {
  padding-left: 0;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 64px);
}
</style>
