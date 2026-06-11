<template>
  <div class="ingredients-dialog">
    <el-form label-width="100px">
      <el-form-item label="配料表">
        <el-input
          v-model="ingredientsText"
          type="textarea"
          :rows="6"
          placeholder="每行输入一种配料，按回车分隔"
        />
        <div class="tips">提示：每行输入一种配料，系统会自动识别过敏原</div>
      </el-form-item>
      <el-form-item label="过敏原提示">
        <el-input
          v-model="formData.allergens"
          placeholder="请输入过敏原提示信息"
        />
      </el-form-item>
    </el-form>
    
    <div class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      ingredients: [],
      allergens: ''
    })
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const formData = ref({ ...props.data })

const ingredientsText = computed({
  get: () => formData.value.ingredients?.join('\n') || '',
  set: (value) => {
    formData.value.ingredients = value.split('\n').filter(item => item.trim())
  }
})

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
.tips {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}
</style>