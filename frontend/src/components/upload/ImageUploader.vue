<template>
  <div class="image-uploader">
    <!-- 圆形上传区域 -->
    <div
      class="upload-area"
      :class="{ 
        'upload-area--dragover': isDragover,
        'upload-area--has-image': hasImage,
        'upload-area--uploading': uploading
      }"
      @click="handleAreaClick"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <!-- 上传状态 -->
      <div v-if="uploading" class="upload-status">
        <ProgressRing :percent="uploadProgress" size="120" :show-text="false" />
        <span class="upload-text">识别中...</span>
      </div>
      
      <!-- 图片预览 -->
      <div v-else-if="hasImage" class="image-preview">
        <img :src="imagePreviewUrl" alt="预览图片" class="preview-image" />
        <div class="reupload-btn" @click.stop="handleReupload">
          <el-icon><Refresh /></el-icon>
        </div>
      </div>
      
      <!-- 默认状态 -->
      <div v-else class="default-state">
        <div class="upload-icon">
          <el-icon><Upload /></el-icon>
        </div>
        <span class="upload-text">点击或拖拽上传</span>
        <span class="upload-hint">支持 JPG、PNG、WEBP</span>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      @change="handleFileSelect"
      style="display: none"
    />

    <!-- 辅助按钮 -->
    <div class="upload-actions">
      <BaseButton 
        type="secondary" 
        size="small" 
        :disabled="uploading"
        @click="handleCamera"
      >
        <el-icon><Camera /></el-icon>
        拍照
      </BaseButton>
      <BaseButton 
        type="secondary" 
        size="small" 
        :disabled="uploading"
        @click="handleGallery"
      >
        <el-icon><Picture /></el-icon>
        相册
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Camera, Picture, Refresh } from '@element-plus/icons-vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ProgressRing from '@/components/ui/ProgressRing.vue'

// Props
const props = defineProps({
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  maxWidth: {
    type: Number,
    default: 1024
  },
  quality: {
    type: Number,
    default: 0.8
  }
})

// Emits
const emit = defineEmits(['upload-success', 'upload-error', 'upload-start'])

// Refs
const fileInputRef = ref(null)
const imagePreviewUrl = ref('')
const uploadProgress = ref(0)
const uploading = ref(false)
const isDragover = ref(false)
const originalFile = ref(null)

// Computed
const hasImage = computed(() => !!imagePreviewUrl.value)

// 处理区域点击
const handleAreaClick = () => {
  if (!uploading.value && !hasImage.value) {
    fileInputRef.value?.click()
  }
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
  // 清空input，允许重复选择同一文件
  event.target.value = ''
}

// 处理拖拽
const handleDragOver = (e) => {
  e.preventDefault()
  isDragover.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  isDragover.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragover.value = false
  
  const files = e.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

// 处理重新上传
const handleReupload = () => {
  resetUploader()
  fileInputRef.value?.click()
}

// 处理拍照
const handleCamera = async () => {
  try {
    // 模拟拍照功能
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      ElMessage.info('拍照功能需要设备支持，请使用文件上传')
    } else {
      ElMessage.info('当前设备不支持拍照，请使用文件上传')
    }
  } catch (error) {
    ElMessage.error('拍照功能暂不可用')
  }
}

// 处理相册
const handleGallery = () => {
  fileInputRef.value?.click()
}

// 处理文件
const processFile = async (file) => {
  // 验证文件类型和大小
  if (!validateFile(file)) {
    return
  }

  try {
    emit('upload-start')
    uploading.value = true
    originalFile.value = file

    // 压缩图片
    const compressedFile = await compressImage(file)
    
    // 生成预览URL
    imagePreviewUrl.value = URL.createObjectURL(compressedFile)
    
    // 模拟上传进度
    simulateUploadProgress()
    
    // 上传到后端
    await uploadToServer(compressedFile)
    
  } catch (error) {
    console.error('文件处理失败:', error)
    ElMessage.error('文件处理失败，请重试')
    emit('upload-error', error)
    resetUploader()
  }
}

// 验证文件
const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  
  if (!validTypes.includes(file.type)) {
    ElMessage.error('请上传 JPG、PNG 或 WEBP 格式的图片')
    return false
  }
  
  if (file.size > props.maxSize) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  
  return true
}

// 压缩图片
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    img.onload = () => {
      // 计算压缩尺寸
      let { width, height } = img
      if (width > props.maxWidth || height > props.maxWidth) {
        if (width > height) {
          height = Math.round(height * props.maxWidth / width)
          width = props.maxWidth
        } else {
          width = Math.round(width * props.maxWidth / height)
          height = props.maxWidth
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }))
          } else {
            reject(new Error('图片压缩失败'))
          }
        },
        file.type,
        props.quality
      )
    }
    
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

// 模拟上传进度
const simulateUploadProgress = () => {
  uploadProgress.value = 0
  const interval = setInterval(() => {
    uploadProgress.value += Math.random() * 15
    if (uploadProgress.value >= 100) {
      uploadProgress.value = 100
      clearInterval(interval)
    }
  }, 200)
}

// 上传到服务器
const uploadToServer = async (file) => {
  try {
    // 这里调用实际的API
    // const result = await uploadImage(file)
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟成功响应
    const mockResult = {
      productName: '示例食品',
      healthScore: 75,
      nutrition: { sodium: 420, sugar: 15, energy: 150 },
      ingredients: '小麦粉,水,白砂糖,食用盐,食品添加剂',
      additives: [{ name: '食品添加剂', function: '防腐', riskLevel: '低' }]
    }
    
    emit('upload-success', mockResult)
    
  } catch (error) {
    throw new Error('上传失败: ' + error.message)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// 重置上传器
const resetUploader = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imagePreviewUrl.value = ''
  uploading.value = false
  uploadProgress.value = 0
  originalFile.value = null
}

// 暴露方法给父组件
defineExpose({
  reset: resetUploader
})
</script>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.upload-area {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: var(--primary-light);
  border: 2px dashed var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-area:hover:not(.upload-area--uploading):not(.upload-area--has-image) {
  border-color: var(--primary);
  background: rgba(42, 157, 143, 0.1);
  transform: scale(1.05);
}

.upload-area--dragover {
  border-color: var(--primary) !important;
  background: rgba(42, 157, 143, 0.2) !important;
  transform: scale(1.1);
}

.upload-area--has-image {
  border: none;
  background: transparent;
}

.upload-area--uploading {
  cursor: not-allowed;
}

/* 默认状态样式 */
.default-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--primary);
}

.upload-icon {
  font-size: 48px;
  opacity: 0.8;
}

.upload-text {
  font-size: 16px;
  font-weight: 600;
}

.upload-hint {
  font-size: 12px;
  opacity: 0.7;
}

/* 上传状态样式 */
.upload-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* 图片预览样式 */
.image-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.reupload-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.reupload-btn:hover {
  background: var(--primary-light);
  transform: scale(1.1);
}

/* 辅助按钮样式 */
.upload-actions {
  display: flex;
  gap: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .upload-area {
    width: 150px;
    height: 150px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
  
  .upload-text {
    font-size: 14px;
  }
  
  .upload-hint {
    font-size: 11px;
  }
  
  .upload-actions {
    flex-direction: column;
  }
}
</style>