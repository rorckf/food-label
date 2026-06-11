<template>
  <div class="basic-info-dialog">
    <el-form :model="formData" label-width="100px">
      <el-form-item label="产品名称">
        <el-input v-model="formData.productName" placeholder="请输入产品名称" />
      </el-form-item>
      <el-form-item label="品牌">
        <el-input v-model="formData.brand" placeholder="请输入品牌" />
      </el-form-item>
      <el-form-item label="净含量">
        <el-input v-model="formData.netContent" placeholder="请输入净含量" />
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
      productName: '',
      brand: '',
      netContent: ''
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