<template>
  <div class="manufacturer-dialog">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="委托商" name="distributor">
        <el-form :model="formData.distributor" label-width="100px">
          <el-form-item label="名称">
            <el-input v-model="formData.distributor.name" placeholder="请输入委托商名称" />
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="formData.distributor.address" placeholder="请输入委托商地址" />
          </el-form-item>
          <el-form-item label="联系方式">
            <el-input v-model="formData.distributor.contact" placeholder="请输入委托商联系方式" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="生产商" name="manufacturer">
        <el-form :model="formData.manufacturer" label-width="100px">
          <el-form-item label="名称">
            <el-input v-model="formData.manufacturer.name" placeholder="请输入生产商名称" />
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="formData.manufacturer.address" placeholder="请输入生产商地址" />
          </el-form-item>
          <el-form-item label="联系方式">
            <el-input v-model="formData.manufacturer.contact" placeholder="请输入生产商联系方式" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    
    <div class="additional-info">
      <h4>其他信息</h4>
      <el-form :model="formData" label-width="100px">
        <el-form-item label="许可证号">
          <el-input v-model="formData.licenseNumber" placeholder="请输入许可证号" />
        </el-form-item>
        <el-form-item label="产品标准号">
          <el-input v-model="formData.standardCode" placeholder="请输入产品标准号" />
        </el-form-item>
        <el-form-item label="产地">
          <el-input v-model="formData.origin" placeholder="请输入产地" />
        </el-form-item>
      </el-form>
    </div>
    
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
      distributor: {
        name: '',
        address: '',
        contact: ''
      },
      manufacturer: {
        name: '',
        address: '',
        contact: ''
      },
      licenseNumber: '',
      standardCode: '',
      origin: ''
    })
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const activeTab = ref('distributor')
const formData = ref({ 
  distributor: { ...props.data.distributor },
  manufacturer: { ...props.data.manufacturer },
  licenseNumber: props.data.licenseNumber,
  standardCode: props.data.standardCode,
  origin: props.data.origin
})

// 监听props变化
watch(() => props.data, (newData) => {
  formData.value = { 
    distributor: { ...newData.distributor },
    manufacturer: { ...newData.manufacturer },
    licenseNumber: newData.licenseNumber,
    standardCode: newData.standardCode,
    origin: newData.origin
  }
}, { immediate: true, deep: true })

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

.additional-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.additional-info h4 {
  margin-bottom: 16px;
  color: #303133;
}
</style>