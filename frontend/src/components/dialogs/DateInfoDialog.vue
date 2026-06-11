<template>
  <div class="date-info-dialog">
    <el-form :model="formData" label-width="120px">
      <el-form-item label="生产日期">
        <el-date-picker 
          v-model="formData.productionDate" 
          type="date" 
          placeholder="选择生产日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="保质期">
        <el-input v-model="formData.shelfLife" placeholder="请输入保质期" />
      </el-form-item>
      <el-form-item label="贮藏方法">
        <el-input v-model="formData.storageMethod" placeholder="请输入贮藏方法" />
      </el-form-item>
      <el-form-item label="食用方法">
        <el-input v-model="formData.consumptionMethod" placeholder="请输入食用方法" />
      </el-form-item>
    </el-form>
    
    <div class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      productionDate: '',
      shelfLife: '',
      storageMethod: '',
      consumptionMethod: ''
    })
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const formData = ref({ ...props.data })

// 监听props变化
watch(() => props.data, (newData) => {
  formData.value = { ...newData }
}, { immediate: true })

const handleConfirm = () => {
  emit('confirm', formData.value)
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.dialog-footer {
  text-align: right;
  margin-top: 20px;
}
</style>