<template>
  <button
    :class="[
      'base-button',
      `base-button--${type}`,
      `base-button--${size}`,
      { 'base-button--block': block },
      { 'base-button--loading': loading },
      { 'base-button--disabled': disabled }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="base-button__loading">
      <el-icon><Loading /></el-icon>
    </span>
    <span class="base-button__content" :class="{ 'base-button__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'text', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])
</script>

<style scoped>
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 40px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  font-family: inherit;
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
  will-change: transform, box-shadow;
}

/* 按钮类型样式 */
.base-button--primary {
  background: var(--primary-grad);
  color: white;
  box-shadow: var(--shadow-sm);
}

@media (hover: hover) {
  .base-button--primary:hover:not(.base-button--disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.base-button--primary:active:not(.base-button--disabled) {
  transform: translateY(0);
  transition-duration: 0.1s;
}

.base-button--secondary {
  background: var(--surface);
  color: var(--primary);
  border: 1px solid var(--border-light);
}

@media (hover: hover) {
  .base-button--secondary:hover:not(.base-button--disabled) {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
  }
}

.base-button--secondary:active:not(.base-button--disabled) {
  transform: translateY(0);
  transition-duration: 0.1s;
}

.base-button--text {
  background: transparent;
  color: var(--primary);
}

@media (hover: hover) {
  .base-button--text:hover:not(.base-button--disabled) {
    background: var(--primary-light);
    transform: translateY(-1px);
  }
}

.base-button--text:active:not(.base-button--disabled) {
  transform: translateY(0);
  transition-duration: 0.1s;
}

.base-button--danger {
  background: var(--danger);
  color: white;
}

@media (hover: hover) {
  .base-button--danger:hover:not(.base-button--disabled) {
    background: #d32f2f;
    box-shadow: var(--shadow-sm);
    transform: translateY(-2px);
  }
}

.base-button--danger:active:not(.base-button--disabled) {
  transform: translateY(0);
  transition-duration: 0.1s;
}

/* 按钮尺寸 */
.base-button--small {
  padding: 8px 20px;
  font-size: 13px;
}

.base-button--medium {
  padding: 12px 28px;
  font-size: 15px;
}

.base-button--large {
  padding: 14px 36px;
  font-size: 16px;
}

/* 块级按钮 */
.base-button--block {
  width: 100%;
}

/* 禁用状态 */
.base-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.base-button--disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}

/* 加载状态 */
.base-button--loading {
  pointer-events: none;
}

.base-button__loading {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.base-button__loading-dot {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.base-button__content--hidden {
  opacity: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>