<template>
  <div class="preview-container">
    <div class="image-preview-wrapper" :style="{ paddingBottom: `${100 / aspectRatio}%` }">
      <el-image 
        :src="imageUrl" 
        fit="contain" 
        class="preview-image"
        :style="{ transform: `rotate(${rotation}deg)` }"
        :preview-src-list="[imageUrl]"
        preview-teleported
      />
      <div class="image-overlay">
        <div class="image-info">
          <span>{{ fileName }}</span>
          <span>{{ fileSize }}</span>
        </div>
        <div class="image-actions">
          <el-button 
            size="small" 
            circle 
            @click="rotateImage"
          >
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button 
            size="small" 
            circle 
            type="danger" 
            @click="$emit('changeImage')"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
    <el-button
      type="default"
      style="margin-top: 10px;"
      @click="$emit('changeImage')"
    >
      换图片
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Refresh, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  imageUrl: String,
  fileName: String,
  fileSize: String
})

const emit = defineEmits(['changeImage'])

const rotation = ref(0)
const aspectRatio = ref(4/3)

const rotateImage = () => {
  rotation.value = (rotation.value + 90) % 360
  
  // 重新计算旋转后的宽高比
  const img = new Image()
  img.onload = () => {
    if (rotation.value % 180 === 90) {
      aspectRatio.value = img.height / img.width
    } else {
      aspectRatio.value = img.width / img.height
    }
  }
  img.src = props.imageUrl
}
</script>

<style scoped>
.preview-container {
  margin-top: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-preview-wrapper {
  position: relative;
  width: 100%;
  background-color: #F5F5F5;
  border: 2px solid #409eff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.image-preview-wrapper:hover {
  box-shadow: 0 0 20px rgba(64, 158, 255, 0.5);
}

.image-preview-wrapper.uploading {
  animation: glow 1.5s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(64, 158, 255, 0.8);
  }
}

.preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: all 0.3s ease;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-preview-wrapper:hover .image-overlay {
  opacity: 1;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-info span {
  font-size: 12px;
  line-height: 1.2;
}

.image-actions {
  display: flex;
  gap: 8px;
}

.image-actions .el-button {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.image-actions .el-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}
</style>