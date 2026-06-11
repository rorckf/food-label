<template>
  <div class="base-input">
    <div class="base-input__wrapper" :class="{ 'base-input__wrapper--error': error }">
      <div v-if="icon" class="base-input__icon">
        <!-- 使用Element Plus图标 -->
        <el-icon v-if="icon === 'User'"><User /></el-icon>
        <el-icon v-else-if="icon === 'Lock'"><Lock /></el-icon>
        <el-icon v-else-if="icon === 'Phone'"><Iphone /></el-icon>
        <el-icon v-else-if="icon === 'Search'"><Search /></el-icon>
        <span v-else>{{ icon }}</span>
      </div>
      <div class="base-input__field">
        <input
          :type="showPassword ? 'text' : type"
          :value="modelValue"
          :placeholder="placeholder"
          @input="$emit('update:modelValue', $event.target.value)"
          @focus="isFocused = true"
          @blur="isFocused = false"
          class="base-input__input"
          :class="{ 'base-input__input--with-icon': icon }"
        />
        <label v-if="label" class="base-input__label" :class="{ 'base-input__label--focused': isFocused || modelValue }">
          {{ label }}
        </label>
      </div>
      <div v-if="type === 'password'" class="base-input__password-toggle" @click="showPassword = !showPassword">
        <el-icon v-if="showPassword"><View /></el-icon>
        <el-icon v-else><Hide /></el-icon>
      </div>
    </div>
    <div v-if="error" class="base-input__error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  User,
  Lock,
  Iphone,
  Search,
  View,
  Hide
} from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'password', 'email', 'tel'].includes(value)
  },
  error: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)
const showPassword = ref(false)
</script>

<style scoped>
.base-input {
  width: 100%;
}

.base-input__wrapper {
  position: relative;
  border-bottom: 2px solid var(--divider);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.base-input__wrapper:focus-within {
  border-bottom-color: var(--primary);
  box-shadow: 0 2px 0 0 rgba(42, 157, 143, 0.3);
}

.base-input__wrapper--error {
  border-bottom-color: var(--danger) !important;
}

.base-input__icon {
  display: flex;
  align-items: center;
  margin-right: 8px;
  color: var(--text-secondary);
}

.base-input__field {
  position: relative;
  flex: 1;
  padding: 12px 0;
}

.base-input__input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--text-main);
  padding: 0;
}

.base-input__input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.base-input__input--with-icon {
  padding-left: 0;
}

.base-input__label {
  position: absolute;
  top: 12px;
  left: 0;
  font-size: 15px;
  color: var(--text-secondary);
  pointer-events: none;
  transition: all 0.2s ease;
  transform-origin: left center;
}

.base-input__label--focused {
  top: -8px;
  font-size: 12px;
  color: var(--primary);
  transform: translateY(-100%);
}

.base-input__password-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  margin-left: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.base-input__password-toggle:hover {
  background: var(--primary-light);
  color: var(--primary);
}

.base-input__error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--danger);
  min-height: 16px;
}
</style>