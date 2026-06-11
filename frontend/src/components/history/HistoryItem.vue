<template>
  <div
    class="history-item"
    :class="{ 'history-item--deleting': isDeleting }"
    @click="handleClick"
  >
    <!-- 收藏按钮 -->
    <div
      class="favorite-btn"
      :class="{ 'is-favorite': localFavorite }"
      @click.stop="handleToggleFavorite"
      :title="localFavorite ? '取消收藏' : '加入收藏'"
    >
      <el-icon><Star /></el-icon>
    </div>

    <!-- 删除按钮（始终可见，避免 hover/长按发现性问题） -->
    <button
      type="button"
      class="delete-btn"
      :disabled="deleting"
      @click.stop="handleDelete"
      title="删除该记录"
      aria-label="删除"
    >
      <el-icon><Close /></el-icon>
    </button>

    <!-- 缩略图 -->
    <div class="item-thumbnail">
      <img 
        :src="item.thumbnailUrl || '/placeholder-image.jpg'" 
        :alt="item.productName"
        class="thumbnail-image"
        @error="handleImageError"
      />
    </div>

    <!-- 内容信息 -->
    <div class="item-content">
      <h3 class="product-name" :title="item.productName">
        {{ item.productName }}
      </h3>
      <p class="scan-time">{{ formatTime(item.scanTime) }}</p>
      <div v-if="item.healthScore != null" class="health-score">
        <ProgressRing
          :percent="item.healthScore"
          size="40"
          :color="getHealthColor(item.healthScore)"
          :show-text="false"
        />
        <span class="score-text">{{ item.healthScore }}分</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProgressRing from '@/components/ui/ProgressRing.vue'
import { historyAPI } from '@/utils/api'

const props = defineProps({
  item: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      productName: '',
      thumbnailUrl: '',
      scanTime: '',
      healthScore: 0,
      isFavorite: 0
    })
  }
})

const emit = defineEmits(['deleted'])

const router = useRouter()

// 响应式状态
const deleting = ref(false)
const isDeleting = ref(false)
const localFavorite = ref(props.item.isFavorite === 1)

// 方法
const handleClick = () => {
  if (!deleting.value && !isDeleting.value) {
    router.push(`/result/${props.item.id}`)
  }
}

const handleToggleFavorite = async () => {
  try {
    const res = await historyAPI.toggleFavorite(props.item.id)
    if (res.code === 200) {
      localFavorite.value = res.data.isFavorite === 1
    }
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  }
}

const handleDelete = async () => {
  // 用 ElMessageBox 替代之前内嵌的 el-dialog——更轻量，移动端也能正常呼出
  try {
    await ElMessageBox.confirm(
      `确定要删除「${props.item.productName || '该记录'}」吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return // 用户取消
  }

  try {
    deleting.value = true
    isDeleting.value = true
    const res = await historyAPI.deleteHistory(props.item.id)
    if (res.code === 200) {
      // 不在这里弹 toast——交给父组件统一处理，避免重复提示
      emit('deleted', props.item.id)
    } else {
      ElMessage.error(res.message || '删除失败')
      isDeleting.value = false
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败，请重试')
    isDeleting.value = false
  } finally {
    deleting.value = false
  }
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  
  const date = new Date(timeString)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${month}-${day} ${hours}:${minutes}`
}

const getHealthColor = (score) => {
  if (score >= 70) return 'var(--success)'
  if (score >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-image.jpg'
}
</script>

<style scoped>
.history-item {
  position: relative;
  width: 180px;
  flex-shrink: 0;
  background: var(--surface);
  border-radius: 20px;
  padding: 12px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.history-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.history-item--deleting {
  background: var(--warning-light);
  border: 2px solid var(--warning);
}

/* 收藏按钮 */
.favorite-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.favorite-btn.is-favorite {
  color: #f5a623;
}

.favorite-btn:hover {
  transform: scale(1.2);
  color: #f5a623;
}

/* 删除按钮（始终可见的小 ×；hover 加深背景） */
.delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  padding: 0;
  background: rgba(0, 0, 0, 0.32);
  border: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.18s ease, background 0.18s ease, transform 0.18s ease;
  z-index: 10;
}

.history-item:hover .delete-btn,
.delete-btn:focus-visible {
  opacity: 1;
}

.delete-btn:hover:not(:disabled) {
  background: var(--danger, #d32f2f);
  transform: scale(1.1);
}

.delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* 缩略图 */
.item-thumbnail {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 auto 12px;
  background: var(--divider);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 内容信息 */
.item-content {
  text-align: center;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 8px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 36px;
}

.scan-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.health-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.score-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .history-item {
    width: 150px;
    padding: 10px;
  }
  
  .item-thumbnail {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    margin-bottom: 10px;
  }
  
  .product-name {
    font-size: 13px;
    min-height: 32px;
  }
  
  .scan-time {
    font-size: 11px;
  }
  
  .health-score {
    gap: 6px;
  }
  
  .score-text {
    font-size: 11px;
  }
}

/* 滚动条样式 */
.history-item::-webkit-scrollbar {
  display: none;
}
</style>