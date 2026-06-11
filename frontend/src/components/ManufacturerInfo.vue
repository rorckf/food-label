<template>
  <div class="manufacturer-info">
    <el-descriptions :column="1" border size="small">
      <el-descriptions-item label="名称">
        <template v-if="!isEditMode">
          {{ data?.name || '未识别' }}
        </template>
        <template v-else>
          <el-input v-model="editData.name" placeholder="请输入名称" />
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="地址">
        <template v-if="!isEditMode">
          {{ data?.address || '未识别' }}
        </template>
        <template v-else>
          <el-input v-model="editData.address" placeholder="请输入地址" />
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="电话">
        <template v-if="!isEditMode">
          {{ data?.phone || '未识别' }}
        </template>
        <template v-else>
          <el-input v-model="editData.phone" placeholder="请输入电话" />
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="传真">
        <template v-if="!isEditMode">
          {{ data?.fax || '未识别' }}
        </template>
        <template v-else>
          <el-input v-model="editData.fax" placeholder="请输入传真" />
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="邮编">
        <template v-if="!isEditMode">
          {{ data?.postalCode || '未识别' }}
        </template>
        <template v-else>
          <el-input v-model="editData.postalCode" placeholder="请输入邮编" />
        </template>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup>
import { watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  editData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:edit-data'])

// 监听数据变化，同步到编辑数据
watch(() => props.data, (newData) => {
  if (props.isEditMode) {
    Object.assign(props.editData, { ...newData })
  }
}, { immediate: true, deep: true })

// 监听编辑数据变化，通知父组件
watch(() => props.editData, (newData) => {
  emit('update:edit-data', newData)
}, { deep: true })
</script>

<style scoped>
.manufacturer-info {
  padding: 8px 0;
}
</style>