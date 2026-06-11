<template>
  <div class="progress-bar">
    <div class="progress-bar__track" :style="{ height: height + 'px' }">
      <div
        class="progress-bar__fill"
        :style="{
          width: percent + '%',
          height: height + 'px',
          backgroundColor: progressColor
        }"
      ></div>
    </div>
    <div v-if="showLabel" class="progress-bar__label">
      {{ percent }}%
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  percent: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 100
  },
  height: {
    type: [String, Number],
    default: 6
  },
  color: {
    type: String,
    default: ''
  },
  showLabel: {
    type: Boolean,
    default: false
  }
})

// 根据百分比计算颜色
const progressColor = computed(() => {
  if (props.color) return props.color
  
  if (props.percent < 60) return 'var(--success)'
  if (props.percent < 80) return 'var(--warning)'
  return 'var(--danger)'
})
</script>

<style scoped>
.progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.progress-bar__track {
  flex: 1;
  background-color: var(--divider);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-bar__fill {
  border-radius: 3px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-bar__fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.2) 100%
  );
  animation: shimmer 2s infinite;
}

.progress-bar__label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>