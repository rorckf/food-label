<template>
  <div class="progress-ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="progress-ring__svg">
      <!-- 背景圆环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        stroke="var(--divider)"
      />
      <!-- 前景圆环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        :stroke="progressColor"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        class="progress-ring__circle"
      />
    </svg>
    <div v-if="showText" class="progress-ring__text">
      <span class="progress-ring__percent">{{ percent }}%</span>
      <span v-if="label" class="progress-ring__label">{{ label }}</span>
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
  size: {
    type: [String, Number],
    default: 120
  },
  strokeWidth: {
    type: [String, Number],
    default: 8
  },
  color: {
    type: String,
    default: ''
  },
  showText: {
    type: Boolean,
    default: true
  },
  label: {
    type: String,
    default: ''
  }
})

// 计算属性
const center = computed(() => Number(props.size) / 2)
const radius = computed(() => (Number(props.size) - Number(props.strokeWidth)) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - props.percent / 100))

// 根据百分比计算颜色
const progressColor = computed(() => {
  if (props.color) return props.color
  
  if (props.percent < 60) return 'var(--success)'
  if (props.percent < 80) return 'var(--warning)'
  return 'var(--danger)'
})
</script>

<style scoped>
.progress-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring__svg {
  transform: rotate(-90deg);
}

.progress-ring__circle {
  transition: all 0.5s ease;
  animation: progress-animation 1s ease-out;
}

.progress-ring__text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-ring__percent {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1;
}

.progress-ring__label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

@keyframes progress-animation {
  from {
    stroke-dashoffset: v-bind('circumference');
  }
  to {
    stroke-dashoffset: v-bind('dashOffset');
  }
}
</style>