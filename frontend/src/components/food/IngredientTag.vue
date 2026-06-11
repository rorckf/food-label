<template>
  <span 
    class="ingredient-tag" 
    :class="`ingredient-tag--${type}`"
    @click="handleClick"
  >
    <span v-if="type === 'additive'" class="additive-dot"></span>
    {{ name }}
  </span>
</template>

<script setup>
import { ElPopover } from 'element-plus'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'main',
    validator: (value) => ['main', 'auxiliary', 'additive'].includes(value)
  },
  additiveInfo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click', props)
}

// 配料类型映射
const typeConfig = {
  main: {
    bgColor: 'var(--success)',
    textColor: 'white'
  },
  auxiliary: {
    bgColor: 'var(--info)',
    textColor: 'white'
  },
  additive: {
    bgColor: 'transparent',
    textColor: 'var(--warning)',
    borderColor: 'var(--warning)'
  }
}
</script>

<style scoped>
.ingredient-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  margin: 4px;
  cursor: default;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.ingredient-tag--main {
  background: var(--success);
  color: white;
}

.ingredient-tag--auxiliary {
  background: var(--info);
  color: white;
}

.ingredient-tag--additive {
  background: transparent;
  color: var(--warning);
  border-color: var(--warning);
  padding-left: 8px;
}

.additive-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning);
  margin-right: 6px;
}

/* 可点击的添加剂标签 */
.ingredient-tag--additive:has(.additive-popover-trigger) {
  cursor: pointer;
}

.ingredient-tag--additive:has(.additive-popover-trigger):hover {
  background: rgba(231, 111, 81, 0.1);
}
</style>