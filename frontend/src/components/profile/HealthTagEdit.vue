<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="dialogWidth"
    :before-close="handleClose"
    :fullscreen="isMobile"
    class="health-tag-dialog"
    :class="{ 'mobile-dialog': isMobile }"
  >
    <!-- 搜索框 -->
    <div class="search-section" v-if="showSearch">
      <BaseInput
        v-model="searchKeyword"
        placeholder="搜索..."
        :icon="'Search'"
        @input="handleSearch"
      />
    </div>

    <!-- 选项列表 -->
    <div class="options-section">
      <div 
        v-for="option in filteredOptions" 
        :key="option.value"
        class="option-item"
        :class="{ 'option-item--selected': selectedValues.includes(option.value) }"
        @click="toggleOption(option.value)"
      >
        <div class="option-checkbox">
          <el-icon v-if="selectedValues.includes(option.value)">
            <Check />
          </el-icon>
        </div>
        <span class="option-label">{{ option.label }}</span>
        <span v-if="option.description" class="option-description">
          {{ option.description }}
        </span>
      </div>
    </div>

    <!-- 自定义输入 -->
    <div v-if="allowCustom" class="custom-section">
      <div class="custom-input">
        <BaseInput
          v-model="customValue"
          placeholder="输入其他内容"
          @keyup.enter="addCustomValue"
        />
        <BaseButton 
          type="primary" 
          size="small" 
          @click="addCustomValue"
          :disabled="!customValue.trim()"
        >
          添加
        </BaseButton>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <template #footer>
      <div class="dialog-footer">
        <BaseButton type="secondary" @click="handleClose">
          取消
        </BaseButton>
        <BaseButton type="primary" @click="handleConfirm" :loading="saving">
          确认
        </BaseButton>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Search } from '@element-plus/icons-vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: '编辑标签'
  },
  options: {
    type: Array,
    default: () => []
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  allowCustom: {
    type: Boolean,
    default: false
  },
  maxSelections: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'close'])

// 响应式状态
const dialogVisible = ref(false)
const selectedValues = ref([])
const searchKeyword = ref('')
const customValue = ref('')
const saving = ref(false)

// 计算属性
const isMobile = computed(() => window.innerWidth <= 768)
const dialogWidth = computed(() => isMobile.value ? '100%' : '500px')

const filteredOptions = computed(() => {
  if (!searchKeyword.value) {
    return props.options
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return props.options.filter(option => 
    option.label.toLowerCase().includes(keyword) ||
    (option.description && option.description.toLowerCase().includes(keyword))
  )
})

// 方法
const open = () => {
  selectedValues.value = [...props.modelValue]
  dialogVisible.value = true
  searchKeyword.value = ''
  customValue.value = ''
}

const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

const toggleOption = (value) => {
  const index = selectedValues.value.indexOf(value)
  
  if (index > -1) {
    selectedValues.value.splice(index, 1)
  } else {
    if (selectedValues.value.length >= props.maxSelections) {
      ElMessage.warning(`最多只能选择 ${props.maxSelections} 项`)
      return
    }
    selectedValues.value.push(value)
  }
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const addCustomValue = () => {
  if (!customValue.value.trim()) return
  
  const value = customValue.value.trim()
  if (!selectedValues.value.includes(value)) {
    if (selectedValues.value.length >= props.maxSelections) {
      ElMessage.warning(`最多只能选择 ${props.maxSelections} 项`)
      return
    }
    selectedValues.value.push(value)
    customValue.value = ''
  }
}

const handleConfirm = async () => {
  try {
    saving.value = true
    
    emit('update:modelValue', [...selectedValues.value])
    emit('confirm', selectedValues.value)
    
    dialogVisible.value = false
    ElMessage.success('保存成功')
    
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  selectedValues.value = [...newValue]
})

// 暴露方法给父组件
defineExpose({
  open
})
</script>

<style scoped>
.health-tag-dialog {
  --dialog-radius: 24px;
}

.health-tag-dialog.mobile-dialog {
  --dialog-radius: 0;
}

:deep(.el-dialog) {
  border-radius: var(--dialog-radius);
}

:deep(.el-dialog__header) {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-light);
  margin: 0;
}

:deep(.el-dialog__body) {
  padding: 0;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-light);
}

/* 搜索区域 */
.search-section {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light);
}

/* 选项列表 */
.options-section {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px 0;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  gap: 12px;
}

.option-item:hover {
  background: var(--primary-light);
}

.option-item--selected {
  background: rgba(42, 157, 143, 0.1);
}

.option-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--divider);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.option-item--selected .option-checkbox {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
  flex: 1;
}

.option-description {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.8;
}

/* 自定义输入 */
.custom-section {
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
}

.custom-input {
  display: flex;
  gap: 12px;
  align-items: center;
}

.custom-input :deep(.base-input) {
  flex: 1;
}

/* 底部操作栏 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .options-section {
    max-height: 50vh;
  }
  
  .option-item {
    padding: 16px 24px;
  }
  
  :deep(.el-dialog__header) {
    padding: 20px 20px 16px;
  }
  
  .search-section {
    padding: 16px 20px;
  }
  
  .custom-section {
    padding: 16px 20px;
  }
  
  :deep(.el-dialog__footer) {
    padding: 16px 20px 20px;
  }
}

/* 滚动条样式 */
.options-section::-webkit-scrollbar {
  width: 6px;
}

.options-section::-webkit-scrollbar-track {
  background: var(--divider);
  border-radius: 3px;
}

.options-section::-webkit-scrollbar-thumb {
  background: var(--text-secondary);
  border-radius: 3px;
}

.options-section::-webkit-scrollbar-thumb:hover {
  background: var(--text-main);
}
</style>