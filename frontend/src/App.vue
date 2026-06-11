<template>
  <div id="app" class="shell" :class="{ 'shell--auth': isAuthRoute }">
    <template v-if="!isAuthRoute">
      <BrandBar />
      <Sidebar />
    </template>

    <main class="shell__main" :class="{ 'shell__main--auth': isAuthRoute }">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BrandBar from '@/components/layout/BrandBar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'

const route = useRoute()
const isAuthRoute = computed(() => ['Login', 'Register'].includes(route.name))

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
</style>
