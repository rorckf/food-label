<template>
  <transition
    :name="name"
    @enter="enter"
    @after-enter="afterEnter"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <slot />
  </transition>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: 'expand'
  }
})

const enter = (el) => {
  el.style.height = 'auto'
  const height = getComputedStyle(el).height
  el.style.height = '0'
  el.offsetHeight // 触发重排
  el.style.height = height
}

const afterEnter = (el) => {
  el.style.height = 'auto'
}

const leave = (el) => {
  el.style.height = getComputedStyle(el).height
  el.offsetHeight // 触发重排
  el.style.height = '0'
}

const afterLeave = (el) => {
  el.style.height = 'auto'
}
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: height 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  height: 0;
}
</style>