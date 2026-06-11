<template>
  <el-popover
    :visible="visible"
    :width="320"
    trigger="click"
    @show="handleShow"
    @hide="handleHide"
  >
    <template #reference>
      <span class="additive-popover-trigger">
        <slot></slot>
      </span>
    </template>

    <div class="additive-popup">
      <!-- 标题栏 -->
      <div class="popup-header">
        <h3 class="additive-name">{{ additive.name }}</h3>
        <el-tag 
          :type="riskLevelType" 
          size="small"
          class="risk-tag"
        >
          {{ riskLevelText }}
        </el-tag>
      </div>

      <!-- 功能描述 -->
      <div v-if="additive.function" class="popup-section">
        <h4 class="section-title">功能</h4>
        <p class="section-content">{{ additive.function }}</p>
      </div>

      <!-- 安全摄入量 -->
      <div v-if="additive.safeIntake" class="popup-section">
        <h4 class="section-title">安全摄入量</h4>
        <p class="section-content">{{ additive.safeIntake }}</p>
      </div>

      <!-- 政策对比 -->
      <div v-if="additive.policyComparison" class="popup-section">
        <h4 class="section-title">政策对比</h4>
        <div class="policy-comparison">
          <div 
            v-for="policy in additive.policyComparison" 
            :key="policy.region"
            class="policy-item"
          >
            <span class="region">{{ policy.region }}</span>
            <span class="status" :class="`status--${policy.status}`">
              {{ policy.status === 'allowed' ? '允许' : policy.status === 'restricted' ? '限制' : '禁止' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 健康影响 -->
      <div v-if="additive.healthImpact" class="popup-section">
        <h4 class="section-title">健康影响</h4>
        <p class="section-content">{{ additive.healthImpact }}</p>
      </div>

      <!-- 关闭按钮 -->
      <div class="popup-actions">
        <BaseButton type="text" size="small" @click="handleClose">
          关闭
        </BaseButton>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  additive: {
    type: Object,
    required: true,
    default: () => ({
      name: '',
      function: '',
      riskLevel: 'low',
      safeIntake: '',
      policyComparison: [],
      healthImpact: ''
    })
  }
})

const emit = defineEmits(['show', 'hide'])

const visible = ref(false)

// 风险等级映射
const riskLevelType = computed(() => {
  const map = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return map[props.additive.riskLevel] || 'info'
})

const riskLevelText = computed(() => {
  const map = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }
  return map[props.additive.riskLevel] || '未知'
})

const handleShow = () => {
  visible.value = true
  emit('show', props.additive)
}

const handleHide = () => {
  visible.value = false
  emit('hide', props.additive)
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.additive-popover-trigger {
  cursor: pointer;
}

.additive-popup {
  padding: 16px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.additive-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
}

.risk-tag {
  flex-shrink: 0;
}

.popup-section {
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.section-content {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.policy-comparison {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.policy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.region {
  font-size: 13px;
  color: var(--text-secondary);
}

.status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.status--allowed {
  background: var(--success);
  color: white;
}

.status--restricted {
  background: var(--warning);
  color: white;
}

.status--banned {
  background: var(--danger);
  color: white;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}
</style>