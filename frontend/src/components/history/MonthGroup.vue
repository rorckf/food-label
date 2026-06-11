<template>
  <div class="month-group" v-if="groupItems.length > 0">
    <!-- 月份标题 -->
    <div class="month-header">
      <div class="month-line"></div>
      <h2 class="month-title">{{ formatMonthTitle(groupYearMonth) }}</h2>
    </div>

    <!-- 横向滚动容器 -->
    <div class="scroll-container" ref="scrollContainer" @scroll="handleScroll">
      <div class="items-container">
        <HistoryItem
          v-for="item in groupItems"
          :key="item.id"
          :item="item"
          @deleted="handleItemDeleted"
          class="history-item-wrapper"
        />
      </div>
      
      <!-- 滑动提示（当有更多内容时显示） -->
      <div v-if="showScrollHint" class="scroll-hint">
        <span>滑动查看更多</span>
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import HistoryItem from './HistoryItem.vue'

const props = defineProps({
  groupYearMonth: {
    type: String,
    required: true
  },
  groupItems: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['item-deleted'])

// 响应式状态
const showScrollHint = ref(false)
const scrollContainer = ref(null)

// 计算属性
const monthTitle = computed(() => {
  return formatMonthTitle(props.groupYearMonth)
})

// 方法
const formatMonthTitle = (yearMonth) => {
  if (!yearMonth) return ''
  
  const [year, month] = yearMonth.split('-')
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                     '7月', '8月', '9月', '10月', '11月', '12月']
  
  return `${year}年${monthNames[parseInt(month) - 1]}`
}

const handleItemDeleted = (itemId) => {
  emit('item-deleted', { yearMonth: props.groupYearMonth, itemId })
}

const checkScrollHint = () => {
  if (scrollContainer.value) {
    const container = scrollContainer.value
    showScrollHint.value = container.scrollWidth > container.clientWidth
  }
}

const handleScroll = () => {
  if (scrollContainer.value) {
    const container = scrollContainer.value
    // 当滚动到最右侧时隐藏提示
    const isScrolledToEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10
    showScrollHint.value = !isScrolledToEnd
  }
}

// 生命周期
onMounted(() => {
  // 延迟检查滚动提示，确保DOM已渲染
  setTimeout(() => {
    checkScrollHint()
  }, 100)
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkScrollHint)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScrollHint)
})

// 暴露方法给父组件
defineExpose({
  checkScrollHint
})
</script>

<style scoped>
.month-group {
  margin-bottom: 32px;
}

/* 月份标题 */
.month-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.month-line {
  width: 4px;
  height: 16px;
  background: var(--primary);
  border-radius: 2px;
  flex-shrink: 0;
}

.month-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

/* 横向滚动容器 */
.scroll-container {
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.scroll-container::-webkit-scrollbar {
  height: 6px;
}

.scroll-container::-webkit-scrollbar-track {
  background: var(--divider);
  border-radius: 3px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: var(--text-secondary);
  border-radius: 3px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-main);
}

/* 条目容器 */
.items-container {
  display: flex;
  gap: 16px;
  padding-right: 20px;
}

.history-item-wrapper {
  flex-shrink: 0;
}

/* 滑动提示 */
.scroll-hint {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(90deg, transparent, var(--bg-page) 70%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  pointer-events: none;
  color: var(--text-secondary);
  font-size: 12px;
  gap: 4px;
  animation: hint-pulse 2s infinite;
}

@keyframes hint-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .month-group {
    margin-bottom: 24px;
  }
  
  .month-header {
    gap: 10px;
    margin-bottom: 12px;
  }
  
  .month-title {
    font-size: 16px;
  }
  
  .items-container {
    gap: 12px;
    padding-right: 16px;
  }
  
  .scroll-hint {
    width: 50px;
    font-size: 11px;
  }
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .items-container {
    gap: 14px;
  }
}
</style>