<template>
  <div class="food-label-container">
    <!-- 头部操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="toggleEditMode" :icon="Edit">
        {{ isEditMode ? '退出编辑' : '编辑信息' }}
      </el-button>
      <el-button v-if="isEditMode" type="success" @click="submitCorrections" :icon="Check">
        提交修正
      </el-button>
      <el-button v-if="isEditMode" type="info" @click="submitForReview">
        提交审核
      </el-button>
    </div>

    <!-- 产品基本信息 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><Goods /></el-icon>
          产品信息
        </h3>
        <el-button v-if="isEditMode" type="primary" size="small" @click="editBasicInfo" :icon="Edit">
          编辑
        </el-button>
      </div>
      <el-card shadow="hover" class="info-card">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="产品名称">
            <template v-if="!isEditMode">
              {{ displayData.productName || '未识别' }}
            </template>
            <template v-else>
              <el-input v-model="editData.productName" placeholder="请输入产品名称" />
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="品牌">
            <template v-if="!isEditMode">
              {{ displayData.brand || '未识别' }}
            </template>
            <template v-else>
              <el-input v-model="editData.brand" placeholder="请输入品牌" />
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="净含量">
            <template v-if="!isEditMode">
              {{ displayData.netContent || '未识别' }}
            </template>
            <template v-else>
              <el-input v-model="editData.netContent" placeholder="请输入净含量" />
            </template>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- 配料表 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><List /></el-icon>
          配料表
        </h3>
        <el-button v-if="isEditMode" type="primary" size="small" @click="editIngredients" :icon="Edit">
          编辑
        </el-button>
      </div>
      <el-card shadow="hover" class="info-card">
        <div v-if="!isEditMode" class="ingredients-list">
          <div 
            v-for="(ingredient, index) in displayData.ingredients" 
            :key="index"
            class="ingredient-item"
            :class="{ 'allergen-highlight': containsAllergen(ingredient) }"
          >
            {{ ingredient }}
          </div>
        </div>
        <div v-else>
          <el-input
            v-model="editIngredientsText"
            type="textarea"
            :rows="4"
            placeholder="每行输入一种配料，按回车分隔"
          />
        </div>
        
        <!-- 过敏原提示 -->
        <div v-if="displayData.allergens" class="allergen-warning">
          <el-alert 
            :title="displayData.allergens" 
            type="warning" 
            :closable="false"
            show-icon
          />
        </div>
      </el-card>
    </div>

    <!-- 营养成分表 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><DataAnalysis /></el-icon>
          营养成分表（每100g）
        </h3>
        <div v-if="isEditMode">
          <el-button type="primary" size="small" @click="addNutritionItem" :icon="Plus">
            添加
          </el-button>
          <el-button type="danger" size="small" @click="removeNutritionItem" :icon="Minus">
            删除
          </el-button>
        </div>
      </div>
      <el-card shadow="hover" class="info-card">
        <el-table 
          :data="isEditMode ? editData.nutrition : displayData.nutrition" 
          size="small" 
          border
          :row-class-name="getNutritionRowClass"
        >
          <el-table-column prop="item" label="项目" width="120">
            <template v-if="isEditMode" #default="{ row }">
              <el-input v-model="row.item" placeholder="项目名称" />
            </template>
          </el-table-column>
          <el-table-column prop="per100g" label="含量">
            <template v-if="isEditMode" #default="{ row }">
              <el-input-number 
                v-model="row.per100g" 
                :min="0" 
                :precision="1" 
                controls-position="right"
                style="width: 100%"
              />
            </template>
            <template v-else #default="{ row }">
              <span :class="{ 'highlight-value': isKeyNutrient(row.item) }">
                {{ row.per100g }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="80">
            <template v-if="isEditMode" #default="{ row }">
              <el-select v-model="row.unit" placeholder="单位" style="width: 100%">
                <el-option label="kJ" value="kJ" />
                <el-option label="kcal" value="kcal" />
                <el-option label="g" value="g" />
                <el-option label="mg" value="mg" />
                <el-option label="μg" value="μg" />
              </el-select>
            </template>
            <template v-else #default="{ row }">
              <span v-if="row.item === '能量' && row.unit === 'kcal'" class="unit-warning">
                {{ row.unit }} (可能应为kJ)
              </span>
              <span v-else>{{ row.unit }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="nrvPercent" label="NRV%" width="100">
            <template v-if="isEditMode" #default="{ row }">
              <el-input-number 
                v-model="row.nrvPercent" 
                :min="0" 
                :max="999" 
                :precision="0" 
                controls-position="right"
                style="width: 100%"
              />
            </template>
            <template v-else #default="{ row }">
              <span :class="{ 'nrv-warning': isInvalidNRV(row) }">
                {{ row.nrvPercent || '未识别' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column v-if="isEditMode" label="操作" width="60">
            <template #default="{ $index }">
              <el-button 
                type="danger" 
                size="small" 
                :icon="Delete" 
                @click="removeNutritionRow($index)"
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 日期与贮存信息 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><Calendar /></el-icon>
          日期与贮存
        </h3>
        <el-button v-if="isEditMode" type="primary" size="small" @click="editDateInfo" :icon="Edit">
          编辑
        </el-button>
      </div>
      <el-card shadow="hover" class="info-card">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="生产日期">
            <template v-if="!isEditMode">
              {{ displayData.productionDate || '未识别' }}
            </template>
            <template v-else>
              <el-date-picker 
                v-model="editData.productionDate" 
                type="date" 
                placeholder="选择生产日期"
                style="width: 100%"
              />
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="保质期">
            <template v-if="!isEditMode">
              {{ displayData.shelfLife || '未识别' }}
            </template>
            <template v-else>
              <el-input v-model="editData.shelfLife" placeholder="请输入保质期" />
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="贮藏方法" :span="2">
            <template v-if="!isEditMode">
              {{ displayData.storageMethod || '未识别' }}
            </template>
            <template v-else>
              <el-input v-model="editData.storageMethod" placeholder="请输入贮藏方法" />
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="食用方法" :span="2">
            <template v-if="!isEditMode">
              {{ displayData.consumptionMethod || '未识别' }}
            </template>
            <template v-else>
              <el-input v-model="editData.consumptionMethod" placeholder="请输入食用方法" />
            </template>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- 厂商信息 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><OfficeBuilding /></el-icon>
          厂商信息
        </h3>
        <el-button v-if="isEditMode" type="primary" size="small" @click="editManufacturerInfo" :icon="Edit">
          编辑
        </el-button>
      </div>
      <el-card shadow="hover" class="info-card">
        <el-tabs v-model="activeManufacturerTab" type="border-card">
          <el-tab-pane label="委托商" name="distributor">
            <ManufacturerInfo 
              :data="displayData.distributor" 
              :is-edit-mode="isEditMode"
              :edit-data="editData.distributor"
              @update:edit-data="updateDistributorData"
            />
          </el-tab-pane>
          <el-tab-pane label="生产商" name="manufacturer">
            <ManufacturerInfo 
              :data="displayData.manufacturer" 
              :is-edit-mode="isEditMode"
              :edit-data="editData.manufacturer"
              @update:edit-data="updateManufacturerData"
            />
          </el-tab-pane>
        </el-tabs>
        
        <div class="additional-info">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="许可证号">
              <template v-if="!isEditMode">
                {{ displayData.licenseNumber || '未识别' }}
              </template>
              <template v-else>
                <el-input v-model="editData.licenseNumber" placeholder="请输入许可证号" />
              </template>
            </el-descriptions-item>
            <el-descriptions-item label="产品标准号">
              <template v-if="!isEditMode">
                {{ displayData.standardCode || '未识别' }}
              </template>
              <template v-else>
                <el-input v-model="editData.standardCode" placeholder="请输入产品标准号" />
              </template>
            </el-descriptions-item>
            <el-descriptions-item label="产地">
              <template v-if="!isEditMode">
                {{ displayData.origin || '未识别' }}
              </template>
              <template v-else>
                <el-input v-model="editData.origin" placeholder="请输入产地" />
              </template>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>
    </div>

    <!-- 温馨提示 -->
    <div class="section" v-if="displayData.tips">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon><InfoFilled /></el-icon>
          温馨提示
        </h3>
      </div>
      <el-card shadow="hover" class="info-card">
        <div class="tips-content">
          {{ displayData.tips }}
        </div>
      </el-card>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px"
      :before-close="handleDialogClose"
    >
      <!-- 对话框内容会根据编辑类型动态渲染 -->
      <component 
        :is="currentDialogComponent" 
        :data="currentEditData"
        @confirm="handleDialogConfirm"
        @cancel="handleDialogCancel"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Edit, Check, Plus, Minus, Delete, Goods, List, DataAnalysis, 
  Calendar, OfficeBuilding, InfoFilled 
} from '@element-plus/icons-vue'
import ManufacturerInfo from './ManufacturerInfo.vue'
import BasicInfoDialog from './dialogs/BasicInfoDialog.vue'
import IngredientsDialog from './dialogs/IngredientsDialog.vue'
import DateInfoDialog from './dialogs/DateInfoDialog.vue'
import ManufacturerDialog from './dialogs/ManufacturerDialog.vue'

const props = defineProps({
  foodLabelData: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['submit-corrections', 'submit-for-review'])

// 响应式数据
const isEditMode = ref(false)
const activeManufacturerTab = ref('distributor')
const dialogVisible = ref(false)
const dialogTitle = ref('')
const currentDialogComponent = ref(null)
const currentEditData = ref({})

// 数据适配层：将后端返回的数据映射到前端所需字段
const adaptedData = computed(() => {
  const originalData = props.foodLabelData
  if (!originalData) return {}
  
  // 适配营养成分数据
  let nutrition = []
  
  if (originalData?.nutrition) {
    // 如果后端返回的是数组格式
    if (Array.isArray(originalData.nutrition)) {
      nutrition = originalData.nutrition.map(item => {
        // 处理能量单位转换
        if (item.item === '能量' && item.unit === 'kcal') {
          return {
            ...item,
            per100g: item.per100g * 4.184, // 转换为 kJ
            unit: 'kJ'
          }
        }
        return item
      })
    } 
    // 如果后端返回的是对象格式（如 ENERC_KCAL, PROCNT 等）
    else if (typeof originalData.nutrition === 'object') {
      const nutritionMap = {
        'ENERC_KCAL': { item: '能量', unit: 'kJ' },
        'PROCNT': { item: '蛋白质', unit: 'g' },
        'FAT': { item: '脂肪', unit: 'g' },
        'CHOCDF': { item: '碳水化合物', unit: 'g' },
        'NA': { item: '钠', unit: 'mg' }
      }
      
      nutrition = Object.entries(originalData.nutrition).map(([key, value]) => {
        const info = nutritionMap[key] || { item: key, unit: 'g' }
        let per100g = value
        let unit = info.unit
        
        // 处理能量单位转换
        if (info.item === '能量' && unit !== 'kJ') {
          per100g = value * 4.184 // 转换为 kJ
          unit = 'kJ'
        }
        
        return {
          item: info.item,
          per100g: per100g,
          unit: unit,
          nrvPercent: originalData[`${key}_NRV`] || 0
        }
      })
    }
  }
  
  return {
    ...originalData,
    nutrition: nutrition
  }
})

// 显示数据（只读）
const displayData = computed(() => adaptedData.value)

// 编辑数据（可修改）
const editData = reactive({
  productName: '',
  brand: '',
  netContent: '',
  ingredients: [],
  allergens: '',
  nutrition: [],
  productionDate: '',
  shelfLife: '',
  storageMethod: '',
  consumptionMethod: '',
  distributor: {},
  manufacturer: {},
  licenseNumber: '',
  standardCode: '',
  origin: '',
  tips: ''
})

// 配料表编辑文本
const editIngredientsText = computed({
  get: () => editData.ingredients?.join('\n') || '',
  set: (value) => {
    editData.ingredients = value.split('\n').filter(item => item.trim())
  }
})

// 监听适配后的数据变化，同步到编辑数据
watch(() => adaptedData.value, (newData) => {
  Object.assign(editData, JSON.parse(JSON.stringify(newData)))
}, { immediate: true, deep: true })

// 计算属性
const isInvalidNRV = (nutritionItem) => {
  const nrv = nutritionItem.nrvPercent
  return nrv !== null && nrv !== undefined && (nrv > 100 || nrv < 0)
}

const containsAllergen = (ingredient) => {
  if (!displayData.value.allergens) return false
  const allergens = displayData.value.allergens.toLowerCase()
  return ingredient.toLowerCase().includes(allergens)
}

const isKeyNutrient = (item) => {
  const keyNutrients = ['能量', '蛋白质', '脂肪', '碳水化合物', '钠']
  return keyNutrients.includes(item)
}

// 方法
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (!isEditMode.value) {
    // 退出编辑模式时重置数据
    Object.assign(editData, JSON.parse(JSON.stringify(adaptedData.value)))
  }
}

const submitCorrections = () => {
  try {
    // 验证数据
    if (!editData.productName) {
      ElMessage.warning('请输入产品名称')
      return
    }
    
    emit('submit-corrections', editData)
    ElMessage.success('修正已提交')
    isEditMode.value = false
  } catch (error) {
    ElMessage.error('提交失败：' + (error.message || '未知错误'))
  }
}

// 提交审核
const submitForReview = () => {
  try {
    // 验证数据
    if (!editData.productName) {
      ElMessage.warning('请输入产品名称')
      return
    }
    
    emit('submit-for-review', editData)
    ElMessage.success('已提交审核')
    isEditMode.value = false
  } catch (error) {
    ElMessage.error('提交审核失败：' + (error.message || '未知错误'))
  }
}

// 营养成分表操作
const addNutritionItem = () => {
  editData.nutrition.push({
    item: '',
    per100g: 0,
    unit: 'g',
    nrvPercent: 0
  })
}

const removeNutritionItem = () => {
  if (editData.nutrition.length > 1) {
    editData.nutrition.pop()
  }
}

const removeNutritionRow = (index) => {
  if (editData.nutrition.length > 1) {
    editData.nutrition.splice(index, 1)
  }
}

const getNutritionRowClass = ({ row }) => {
  if (isInvalidNRV(row)) return 'nrv-warning-row'
  if (row.item === '能量' && row.unit === 'kcal') return 'energy-warning-row'
  return ''
}

// 对话框相关方法
const editBasicInfo = () => {
  currentEditData.value = {
    productName: editData.productName,
    brand: editData.brand,
    netContent: editData.netContent
  }
  dialogTitle.value = '编辑基本信息'
  currentDialogComponent.value = 'BasicInfoDialog'
  dialogVisible.value = true
}

const editIngredients = () => {
  currentEditData.value = {
    ingredients: [...editData.ingredients],
    allergens: editData.allergens
  }
  dialogTitle.value = '编辑配料表'
  currentDialogComponent.value = 'IngredientsDialog'
  dialogVisible.value = true
}

const editDateInfo = () => {
  currentEditData.value = {
    productionDate: editData.productionDate,
    shelfLife: editData.shelfLife,
    storageMethod: editData.storageMethod,
    consumptionMethod: editData.consumptionMethod
  }
  dialogTitle.value = '编辑日期与贮存信息'
  currentDialogComponent.value = 'DateInfoDialog'
  dialogVisible.value = true
}

const editManufacturerInfo = () => {
  currentEditData.value = {
    distributor: { ...editData.distributor },
    manufacturer: { ...editData.manufacturer },
    licenseNumber: editData.licenseNumber,
    standardCode: editData.standardCode,
    origin: editData.origin
  }
  dialogTitle.value = '编辑厂商信息'
  currentDialogComponent.value = 'ManufacturerDialog'
  dialogVisible.value = true
}

const handleDialogConfirm = (data) => {
  Object.assign(editData, data)
  dialogVisible.value = false
}

const handleDialogCancel = () => {
  dialogVisible.value = false
}

const handleDialogClose = () => {
  dialogVisible.value = false
}

// 厂商信息更新
const updateDistributorData = (data) => {
  editData.distributor = data
}

const updateManufacturerData = (data) => {
  editData.manufacturer = data
}
</script>

<style scoped>
.food-label-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.action-bar {
  margin-bottom: 20px;
  text-align: right;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #333;
  font-size: 18px;
}

.info-card {
  border-radius: 8px;
}

.ingredients-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ingredient-item {
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.allergen-highlight {
  background: #fff2e8;
  color: #e6a23c;
  border: 1px solid #e6a23c;
}

.allergen-warning {
  margin-top: 16px;
}

.highlight-value {
  font-weight: bold;
  color: #409eff;
}

.unit-warning {
  color: #e6a23c;
  font-weight: bold;
}

.nrv-warning {
  color: #f56c6c;
  font-weight: bold;
}

.additional-info {
  margin-top: 16px;
}

.tips-content {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

/* 表格行样式 */n
:deep(.nrv-warning-row) {
  background-color: #fef0f0 !important;
}

:deep(.energy-warning-row) {
  background-color: #fcf6ec !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .food-label-container {
    padding: 12px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .ingredients-list {
    flex-direction: column;
  }
}
</style>