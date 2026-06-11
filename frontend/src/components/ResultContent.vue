（）<template>
  <el-main class="main-content" v-loading="loading">
    <el-card v-if="result">
      <!-- 基本信息 -->
      <el-row :gutter="20" class="info-row">
        <el-col :span="8">
          <el-image :src="result.imageUrl" fit="contain" class="food-image" />
        </el-col>
        <el-col :span="16">
          <!-- 风险评级 -->
          <div class="risk-section">
            <h3>风险评级</h3>
            <el-tag :type="getRiskType(result.riskLevel)" size="large" style="font-size: 18px; padding: 10px 20px;">
              {{ getRiskText(result.riskLevel) }}
            </el-tag>
            <p class="risk-reason">{{ result.riskReason }}</p>
          </div>
          
          <!-- 营养等级标识 -->
          <div v-if="nutritionLevels.length > 0" class="nutrition-levels-section">
            <h3>营养等级标识</h3>
            <div class="nutrition-tags">
              <el-tag 
                v-for="level in nutritionLevels" 
                :key="level.type"
                :type="level.type"
                size="large"
                effect="dark"
                class="nutrition-tag"
              >
                {{ level.text }}
              </el-tag>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <!-- 合规性检查 -->
      <div v-if="complianceIssues.length > 0" class="compliance-section">
        <el-alert 
          title="标签合规性检查" 
          :description="`发现 ${complianceIssues.length} 项缺失信息`"
          type="warning" 
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="compliance-issues">
              <div v-for="issue in complianceIssues" :key="issue" class="compliance-issue">
                <el-icon class="warning-icon"><Warning /></el-icon>
                <span>{{ issue }}</span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 营养成分标签页 -->
        <el-tab-pane label="营养成分" name="nutrition">
          <div class="nutrition-section">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>营养成分占比</span>
                    </div>
                  </template>
                  <div ref="pieChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>营养成分含量</span>
                    </div>
                  </template>
                  <div ref="barChartRef" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="24">
                <el-card shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>营养成分详情</span>
                      <el-button type="primary" size="small" :icon="CopyDocument" @click="copyNutritionData">
                        一键复制营养数据
                      </el-button>
                    </div>
                  </template>
                  <el-table :data="nutritionData" stripe border>
                    <el-table-column prop="name" label="成分" width="120" />
                    <el-table-column prop="value" label="含量" />
                    <el-table-column prop="unit" label="单位" width="80" />
                    <el-table-column prop="advice" label="建议" />
                  </el-table>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 整包折算区域 -->
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="24">
                <el-card shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>整包折算</span>
                      <div>
                        <el-button 
                          type="text" 
                          @click="showPackageCalculation = !showPackageCalculation"
                          :icon="showPackageCalculation ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
                        >
                          {{ showPackageCalculation ? '收起' : '展开' }}
                        </el-button>
                        <el-button 
                          type="primary" 
                          size="small" 
                          :icon="CopyDocument" 
                          @click="copyPackageNutritionData"
                          :disabled="packageNutritionData.length === 0"
                        >
                          复制整包数据
                        </el-button>
                      </div>
                    </div>
                  </template>
                  <div v-if="showPackageCalculation" class="package-calculation">
                    <div class="package-input-section">
                      <el-form label-width="120px">
                        <el-form-item label="净含量：">
                          <el-input 
                            v-model="packageWeight" 
                            :placeholder="result.netWeight || '请输入净含量（如：30g）'"
                            style="width: 200px;"
                          >
                            <template #append>
                              <el-button @click="packageWeight = result.netWeight || ''" v-if="result.netWeight">
                                使用识别值
                              </el-button>
                            </template>
                          </el-input>
                          <span class="input-tip">支持格式：30g、100ml、0.5kg等</span>
                        </el-form-item>
                      </el-form>
                    </div>
                    
                    <div v-if="packageNutritionData.length > 0" class="package-result-section">
                      <el-table :data="packageNutritionData" stripe border>
                        <el-table-column prop="name" label="成分" width="120" />
                        <el-table-column prop="value" label="整包含量" />
                        <el-table-column prop="unit" label="单位" width="80" />
                      </el-table>
                      <div class="package-summary">
                        <p>基于每100g含量折算整包{{ packageWeight || result.netWeight }}的营养含量</p>
                      </div>
                    </div>
                    
                    <div v-else class="package-empty">
                      <el-alert 
                        title="请输入有效的净含量以查看整包营养含量" 
                        type="info" 
                        :closable="false"
                        show-icon
                      />
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 添加剂分析标签页 -->
        <el-tab-pane label="添加剂分析" name="additives">
          <div class="additives-section">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-card shadow="hover" v-if="result.additives && result.additives.length">
                  <template #header>
                    <div class="card-header">
                      <span>添加剂功能类别分布</span>
                    </div>
                  </template>
                  <div ref="additivesChartRef" class="chart-container"></div>
                </el-card>
                <el-card shadow="hover" v-else>
                  <div class="empty-additives">
                    <el-icon :size="60" color="#ccc"><NoData /></el-icon>
                    <p>未检测到添加剂</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="24" v-if="result.additives && result.additives.length">
                <el-card shadow="hover">
                  <template #header>
                    <div class="card-header">
                      <span>添加剂列表</span>
                    </div>
                  </template>
                  <el-table :data="result.additives" stripe border>
                    <el-table-column prop="name" label="名称" />
                    <el-table-column prop="ins" label="INS号" width="100" />
                    <el-table-column prop="category" label="功能类别" />
                    <el-table-column label="风险等级" width="100">
                      <template #default="{ row }">
                        <el-tag :type="getRiskType(row.riskLevel)">
                          {{ getRiskText(row.riskLevel) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 厂商信息 -->
      <div class="result-section" v-if="result.manufacturer || result.manufacturerAddress">
        <h3>厂商信息</h3>
        <div class="manufacturer-info">
          <div class="manufacturer-details">
            <div v-if="result.manufacturer" class="info-item">
              <span class="info-label">生产商：</span>
              <span>{{ result.manufacturer }}</span>
            </div>
            <div v-if="result.manufacturerAddress" class="info-item">
              <span class="info-label">地址：</span>
              <span>{{ result.manufacturerAddress }}</span>
              <div class="map-section">
                <div class="map-thumbnail" @click="openMap">
                  <div class="map-placeholder">
                    <el-icon class="map-pin"><Position /></el-icon>
                    <div class="map-text">查看地图</div>
                  </div>
                </div>
                <div class="map-tooltip" v-if="showMapTooltip">点击查看地图位置</div>
              </div>
            </div>
            <div v-if="result.licenseNumber" class="info-item">
              <span class="info-label">许可证号：</span>
              <span>{{ result.licenseNumber }}</span>
            </div>
            <div v-if="result.executionStandard" class="info-item">
              <span class="info-label">执行标准：</span>
              <span>{{ result.executionStandard }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 配料表原文 -->
      <div class="result-section" v-if="result.ingredientsText">
        <div class="ingredients-header">
          <h3>配料表原文</h3>
          <div class="ingredients-actions">
            <el-button type="primary" size="small" :icon="CopyDocument" @click="copyIngredients">
              一键复制配料表
            </el-button>
          </div>
        </div>
        
        <div class="ingredients-container">
          <!-- 添加剂统计 -->
          <div v-if="detectedAdditives.length > 0" class="additives-summary">
            <el-alert 
              :title="`检测到 ${detectedAdditives.length} 种添加剂` + (hasControversialAdditives ? '，其中包含有争议的添加剂' : '')" 
              :type="hasControversialAdditives ? 'warning' : 'info'" 
              :closable="false"
              show-icon
            />
          </div>
          
          <!-- 配料表内容 -->
          <div class="ingredients-text" v-html="formattedIngredients"></div>
          
          <!-- 展开/收起按钮 -->
          <div v-if="detectedAdditives.length > 5" class="ingredients-toggle">
            <el-button 
              type="text" 
              @click="showAllIngredients = !showAllIngredients"
              :icon="showAllIngredients ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
            >
              {{ showAllIngredients ? '收起' : `展开全部 ${detectedAdditives.length} 种添加剂` }}
            </el-button>
          </div>
        </div>
        
        <!-- 添加剂详情 -->
        <div v-if="detailedAdditives.length > 0" class="additives-details">
          <h4>检测到的添加剂</h4>
          <div class="additives-grid">
            <div 
              v-for="additive in displayedAdditives" 
              :key="additive.name"
              class="additive-item"
              :class="{ 'controversial': additive.isControversial }"
            >
              <div class="additive-name">
                {{ additive.name }}
                <el-tooltip 
                  :content="`功能类别：${additive.function}，风险等级：${additive.riskLevel}`" 
                  placement="top"
                >
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
                </el-tooltip>
                <el-icon v-if="additive.isControversial" class="warning-icon"><Warning /></el-icon>
              </div>
              <div class="additive-function">{{ additive.function }}</div>
              <div class="additive-risk" :class="additive.riskLevel">风险等级：{{ additive.riskLevel }}</div>
            </div>
          </div>
        </div>
        
        <!-- 添加剂合规性 -->
        <div v-if="additiveValidation" class="additive-compliance">
          <h4>添加剂合规性</h4>
          <div class="compliance-stats">
            <el-tag type="success" size="small">合规：{{ additiveValidation.compliant.length }}种</el-tag>
            <el-tag v-if="additiveValidation.nonCompliant.length > 0" type="danger" size="small">不合规：{{ additiveValidation.nonCompliant.length }}种</el-tag>
          </div>
          <div v-if="additiveValidation.nonCompliant.length > 0" class="non-compliant-list">
            <h5>不合规添加剂：</h5>
            <ul>
              <li v-for="additive in additiveValidation.nonCompliant" :key="additive.name">
                {{ additive.name }} - {{ additive.violationReason }}
              </li>
            </ul>
          </div>
        </div>
        
        <!-- 合规性报告 -->
        <div v-if="complianceReport" class="compliance-report">
          <h4>标签合规性报告</h4>
          <div class="report-stats">
            <el-progress 
              :percentage="complianceReport.overall.complianceRate" 
              :color="complianceReport.overall.complianceRate >= 90 ? '#67c23a' : complianceReport.overall.complianceRate >= 70 ? '#e6a23c' : '#f56c6c'"
            />
            <div class="report-details">
              <p>合规率：{{ complianceReport.overall.complianceRate.toFixed(2) }}%</p>
              <p>合规项：{{ complianceReport.overall.compliant }}，不合规项：{{ complianceReport.overall.nonCompliant }}</p>
            </div>
          </div>
          <div v-if="complianceReport.basic.nonCompliant.length > 0" class="report-issues">
            <h5>不合规项：</h5>
            <ul>
              <li v-for="(issue, index) in complianceReport.basic.nonCompliant" :key="index">
                {{ issue }}
              </li>
            </ul>
          </div>
          <div v-if="complianceReport.basic.suggestions.length > 0" class="report-suggestions">
            <h5>整改建议：</h5>
            <ul>
              <li v-for="(suggestion, index) in complianceReport.basic.suggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 时间信息 -->
      <div class="time-info">
        <p>扫描时间：{{ formatTime(result.createTime) }}</p>
      </div>
    </el-card>
  </el-main>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { detectAdditives, formatIngredientsWithAdditives, controversialAdditives, parseAdditivesFromIngredients, validateAdditivesForPastry } from '@/utils/additives'
import { generateComplianceReport } from '@/utils/compliance'

const props = defineProps({
  result: Object,
  loading: Boolean
})

const emit = defineEmits(['update:loading'])

const activeTab = ref('nutrition')

// 图表引用
const pieChartRef = ref(null)
const barChartRef = ref(null)
const additivesChartRef = ref(null)

// 图表实例
let pieChart = null
let barChart = null
let additivesChart = null

// 整包折算相关
const packageWeight = ref('')
const showPackageCalculation = ref(false)

const nutritionData = computed(() => {
    if (!props.result || !props.result.nutrition) return []
    const n = props.result.nutrition
    return [
        { name: '能量', value: n.energy || '-', unit: 'kcal', advice: n.energy > 500 ? '较高' : '正常' },
        { name: '蛋白质', value: n.protein || '-', unit: 'g', advice: '-' },
        { name: '脂肪', value: n.fat || '-', unit: 'g', advice: n.fat > 20 ? '较高' : '正常' },
        { name: '碳水化合物', value: n.carb || '-', unit: 'g', advice: '-' },
        { name: '钠', value: n.sodium || '-', unit: 'mg', advice: n.sodium > 600 ? '高钠食品' : '正常' }
    ]
})

// 整包折算数据
const packageNutritionData = computed(() => {
    if (!props.result || !props.result.nutrition) return []
    
    const n = props.result.nutrition
    const weight = parseNetWeight(packageWeight.value || props.result.netWeight)
    
    if (!weight || weight <= 0) return []
    
    const multiplier = weight / 100 // 基于每100g的含量进行折算
    
    return [
        { name: '能量', value: Math.round((n.energy || 0) * multiplier), unit: 'kcal' },
        { name: '蛋白质', value: ((n.protein || 0) * multiplier).toFixed(1), unit: 'g' },
        { name: '脂肪', value: ((n.fat || 0) * multiplier).toFixed(1), unit: 'g' },
        { name: '碳水化合物', value: ((n.carb || 0) * multiplier).toFixed(1), unit: 'g' },
        { name: '钠', value: Math.round((n.sodium || 0) * multiplier), unit: 'mg' }
    ]
})

// 解析净含量
const parseNetWeight = (weightStr) => {
    if (!weightStr) return null
    
    // 匹配数字和单位
    const match = weightStr.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l)/i)
    if (!match) return null
    
    let value = parseFloat(match[1])
    const unit = match[2].toLowerCase()
    
    // 转换为克
    if (unit === 'kg') value *= 1000
    else if (unit === 'ml' || unit === 'l') value *= 1 // 假设1ml=1g
    
    return value
}

// 复制营养数据
const copyNutritionData = () => {
    const data = nutritionData.value
    const text = data.map(item => `${item.name}: ${item.value}${item.unit}`).join('\n')
    
    navigator.clipboard.writeText(text).then(() => {
        ElMessage.success('营养数据已复制到剪贴板')
    }).catch(() => {
        ElMessage.error('复制失败，请手动复制')
    })
}

// 复制整包营养数据
const copyPackageNutritionData = () => {
    const data = packageNutritionData.value
    if (data.length === 0) {
        ElMessage.warning('请先输入有效的净含量')
        return
    }
    
    const weight = packageWeight.value || props.result.netWeight
    const text = `整包${weight}营养含量：\n` + 
                 data.map(item => `${item.name}: ${item.value}${item.unit}`).join('\n')
    
    navigator.clipboard.writeText(text).then(() => {
        ElMessage.success('整包营养数据已复制到剪贴板')
    }).catch(() => {
        ElMessage.error('复制失败，请手动复制')
    })
}

// 配料表添加剂标注相关
const showAllIngredients = ref(false)
const detectedAdditives = computed(() => {
    if (!props.result?.ingredientsText) return []
    return detectAdditives(props.result.ingredientsText)
})

const detailedAdditives = computed(() => {
    if (!props.result?.ingredientsText) return []
    return parseAdditivesFromIngredients(props.result.ingredientsText)
})

const additiveValidation = computed(() => {
    return validateAdditivesForPastry(detailedAdditives.value)
})

const complianceReport = computed(() => {
    if (!props.result) return null
    return generateComplianceReport(props.result, detailedAdditives.value)
})

const displayedAdditives = computed(() => {
    if (showAllIngredients.value) {
        return detailedAdditives.value
    }
    return detailedAdditives.value.slice(0, 5)
})

const hasControversialAdditives = computed(() => {
    return detailedAdditives.value.some(additive => additive.isControversial)
})

// 格式化配料文本
const formattedIngredients = computed(() => {
    if (!props.result?.ingredientsText) return ''
    return formatIngredientsWithAdditives(props.result.ingredientsText)
})

// 复制配料表
const copyIngredients = () => {
    if (!props.result?.ingredientsText) {
        ElMessage.warning('没有配料表内容可复制')
        return
    }
    
    navigator.clipboard.writeText(props.result.ingredientsText).then(() => {
        ElMessage.success('配料表已复制到剪贴板')
    }).catch(() => {
        ElMessage.error('复制失败，请手动复制')
    })
}

// 合规性检查（基于GB 7718关键项）
const complianceIssues = computed(() => {
    if (!props.result) return []
    
    const issues = []
    
    // 检查产品名称
    if (!props.result.productName || props.result.productName.trim() === '') {
        issues.push('缺少产品名称')
    }
    
    // 检查净含量
    if (!props.result.netWeight || props.result.netWeight.trim() === '') {
        issues.push('缺少净含量')
    }
    
    // 检查配料表
    if (!props.result.ingredientsText || props.result.ingredientsText.trim() === '') {
        issues.push('缺少配料表')
    }
    
    // 检查营养成分表
    if (!props.result.nutrition || Object.keys(props.result.nutrition).length === 0) {
        issues.push('缺少营养成分表')
    }
    
    // 检查生产日期
    if (!props.result.productionDate || props.result.productionDate.trim() === '') {
        issues.push('缺少生产日期')
    }
    
    // 检查保质期
    if (!props.result.shelfLife || props.result.shelfLife.trim() === '') {
        issues.push('缺少保质期')
    }
    
    // 检查生产者信息
    if (!props.result.manufacturer || props.result.manufacturer.trim() === '') {
        issues.push('缺少生产者信息')
    }
    
    return issues
})

// 营养等级标识计算（基于GB 28050简化版）
const nutritionLevels = computed(() => {
    if (!props.result?.nutrition) return []
    
    const n = props.result.nutrition
    const levels = []
    
    // 高钠：钠 ≥ 800mg
    if (n.sodium && n.sodium >= 800) {
        levels.push({ type: 'danger', text: '高钠' })
    }
    
    // 高糖：碳水化合物 ≥ 15g（简化处理）
    if (n.carb && n.carb >= 15) {
        levels.push({ type: 'warning', text: '高糖' })
    }
    
    // 低脂：脂肪 ≤ 3g
    if (n.fat && n.fat <= 3) {
        levels.push({ type: 'success', text: '低脂' })
    }
    
    // 高蛋白：蛋白质 ≥ 12g
    if (n.protein && n.protein >= 12) {
        levels.push({ type: 'success', text: '高蛋白' })
    }
    
    // 低能量：能量 ≤ 200kcal
    if (n.energy && n.energy <= 200) {
        levels.push({ type: 'success', text: '低能量' })
    }
    
    return levels
})

// 地图相关功能
const showMapTooltip = ref(false)

// 打开地图
const openMap = () => {
    if (!props.result?.manufacturerAddress) {
        ElMessage.warning('没有有效的地址信息')
        return
    }
    
    const address = encodeURIComponent(props.result.manufacturerAddress)
    
    // 同时提供高德地图和百度地图链接
    const amapUrl = `https://uri.amap.com/marker?position=&name=${encodeURIComponent(props.result.manufacturer || '')}&address=${address}`
    const baiduUrl = `https://api.map.baidu.com/marker?location=&title=${encodeURIComponent(props.result.manufacturer || '')}&content=${address}&output=html&src=webapp`
    
    // 创建地图选择弹窗
    ElMessageBox.confirm(
        '请选择地图服务：',
        '查看地图位置',
        {
            confirmButtonText: '高德地图',
            cancelButtonText: '百度地图',
            distinguishCancelAndClose: true,
            roundButton: true
        }
    ).then(() => {
        // 高德地图
        window.open(amapUrl, '_blank')
    }).catch((action) => {
        if (action === 'cancel') {
            // 百度地图
            window.open(baiduUrl, '_blank')
        }
    })
}

const initCharts = () => {
    initPieChart()
    initBarChart()
    initAdditivesChart()
}

const initPieChart = () => {
    if (!pieChartRef.value || !props.result || !props.result.nutrition) return

    if (pieChart) {
        pieChart.dispose()
    }

    pieChart = echarts.init(pieChartRef.value)
    
    const nutrition = props.result.nutrition
    const data = [
        { name: '蛋白质', value: nutrition.protein || 0 },
        { name: '脂肪', value: nutrition.fat || 0 },
        { name: '碳水化合物', value: nutrition.carb || 0 }
    ]

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c}g ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: data.map(item => item.name)
        },
        series: [
            {
                name: '营养成分',
                type: 'pie',
                radius: '60%',
                center: ['50%', '50%'],
                data: data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    }

    pieChart.setOption(option)

    window.addEventListener('resize', () => {
        pieChart.resize()
    })
}

const initBarChart = () => {
    if (!barChartRef.value || !props.result || !props.result.nutrition) return

    if (barChart) {
        barChart.dispose()
    }

    barChart = echarts.init(barChartRef.value)
    
    const nutrition = props.result.nutrition
    const data = [
        { name: '能量', value: nutrition.energy || 0, unit: 'kcal', recommended: 2000 },
        { name: '蛋白质', value: nutrition.protein || 0, unit: 'g', recommended: 60 },
        { name: '脂肪', value: nutrition.fat || 0, unit: 'g', recommended: 65 },
        { name: '碳水化合物', value: nutrition.carb || 0, unit: 'g', recommended: 300 },
        { name: '钠', value: nutrition.sodium || 0, unit: 'mg', recommended: 2000 }
    ]

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                const data = params[0]
                const item = data.data
                const percentage = ((item.value / item.recommended) * 100).toFixed(1)
                return `${data.name}: ${item.value}${item.unit} (${percentage}%)`
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.map(item => item.name),
            axisLabel: {
                interval: 0,
                rotate: 30
            }
        },
        yAxis: {
            type: 'value',
            name: '含量'
        },
        series: [
            {
                name: '实际含量',
                type: 'bar',
                data: data,
                itemStyle: {
                    color: function(params) {
                        const percentage = (params.data.value / params.data.recommended) * 100
                        if (percentage > 100) return '#f56c6c'
                        if (percentage > 80) return '#e6a23c'
                        return '#67c23a'
                    }
                }
            }
        ]
    }

    barChart.setOption(option)

    window.addEventListener('resize', () => {
        barChart.resize()
    })
}

const initAdditivesChart = () => {
    if (!additivesChartRef.value || !props.result || !props.result.additives || props.result.additives.length === 0) return

    if (additivesChart) {
        additivesChart.dispose()
    }

    additivesChart = echarts.init(additivesChartRef.value)
    
    // 统计各功能类别的添加剂数量
    const categoryCount = {}
    props.result.additives.forEach(additive => {
        if (additive.category) {
            categoryCount[additive.category] = (categoryCount[additive.category] || 0) + 1
        }
    })

    const data = Object.entries(categoryCount).map(([category, count]) => ({
        name: category,
        value: count
    }))

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.map(item => item.name),
            axisLabel: {
                interval: 0,
                rotate: 30
            }
        },
        yAxis: {
            type: 'value',
            name: '数量'
        },
        series: [
            {
                name: '添加剂数量',
                type: 'bar',
                data: data.map(item => item.value),
                itemStyle: {
                    color: '#409eff'
                }
            }
        ]
    }

    additivesChart.setOption(option)

    window.addEventListener('resize', () => {
        additivesChart.resize()
    })
}

onMounted(() => {
    nextTick(() => {
        initCharts()
    })
})

watch(() => props.result, () => {
    nextTick(() => {
        initCharts()
    })
}, { deep: true })

const getRiskType = (level) => {
    const types = ['success', 'warning', 'danger']
    return types[level] || 'info'
}

const getRiskText = (level) => {
    const texts = ['安全', '注意', '避免']
    return texts[level] || '未知'
}

const formatTime = (time) => {
    if (!time) return '-'
    return new Date(time).toLocaleString('zh-CN')
}
</script>

<style scoped>
.main-content {
    padding: 20px;
}

.info-row {
    margin-bottom: 20px;
}

.food-image {
    width: 100%;
    max-height: 300px;
    border-radius: 8px;
}

.risk-section {
    margin-bottom: 20px;
}

.risk-reason {
    margin-top: 10px;
    color: #666;
}

.nutrition-levels-section {
    margin-top: 20px;
}

.nutrition-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}

.nutrition-tag {
    font-size: 14px;
    padding: 6px 12px;
}

.compliance-section {
    margin-bottom: 20px;
}

.compliance-issues {
    margin-top: 10px;
}

.compliance-issue {
    display: flex;
    align-items: center;
    margin: 5px 0;
    color: #e6a23c;
    font-size: 14px;
}

.compliance-issue .warning-icon {
    margin-right: 8px;
    font-size: 16px;
}

.chart-container {
    width: 100%;
    height: 400px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nutrition-section,
.additives-section {
    margin-top: 20px;
}

.empty-additives {
    text-align: center;
    padding: 60px 20px;
    color: #999;
}

.result-section {
    margin-top: 30px;
    margin-bottom: 30px;
}

.result-section h3 {
    margin-bottom: 15px;
    color: #333;
}

.ingredients-text {
    padding: 15px;
    background: #f5f7fa;
    border-radius: 8px;
    white-space: pre-wrap;
    line-height: 1.8;
}

.time-info {
    text-align: right;
    color: #999;
    font-size: 14px;
    margin-top: 30px;
}

.package-calculation {
    padding: 0 20px 20px;
}

.package-input-section {
    margin-bottom: 20px;
}

.input-tip {
    margin-left: 10px;
    color: #999;
    font-size: 12px;
}

.package-result-section {
    margin-top: 20px;
}

.package-summary {
    margin-top: 15px;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;
    text-align: center;
    color: #666;
}

.package-empty {
    margin-top: 20px;
}

.ingredients-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.ingredients-container {
    margin-bottom: 20px;
}

.additives-summary {
    margin-bottom: 15px;
}

.ingredients-text {
    padding: 15px;
    background: #f5f7fa;
    border-radius: 8px;
    white-space: pre-wrap;
    line-height: 1.8;
}

.ingredients-text .additive-tag {
    background: #e8f4fd;
    color: #409eff;
    padding: 2px 6px;
    border-radius: 4px;
    margin: 0 2px;
    font-weight: 500;
    position: relative;
    cursor: help;
}

.ingredients-text .additive-tag[data-controversial="true"] {
    background: #fef0f0;
    color: #f56c6c;
}

.ingredients-text .additive-tag:hover::after {
    content: attr(data-function);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
}

.ingredients-toggle {
    text-align: center;
    margin-top: 10px;
}

.additives-details {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
}

.additives-details h4 {
    margin-bottom: 15px;
    color: #333;
}

.additives-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
}

.additive-item {
    padding: 10px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    transition: all 0.3s;
}

.additive-item.controversial {
    border-color: #f56c6c;
    background: #fef0f0;
}

.additive-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.additive-name {
    font-weight: 500;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.info-icon {
    color: #909399;
    font-size: 12px;
    cursor: help;
}

.warning-icon {
    color: #f56c6c;
    font-size: 14px;
}

.additive-function {
    font-size: 12px;
    color: #666;
}

.manufacturer-info {
    padding: 15px;
    background: #f5f7fa;
    border-radius: 8px;
}

.manufacturer-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.info-label {
    font-weight: 600;
    color: #333;
    min-width: 80px;
}

.map-section {
    margin-top: 10px;
    position: relative;
}

.map-thumbnail {
    width: 120px;
    height: 80px;
    background: #e8f4fd;
    border: 2px solid #409eff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
}

.map-thumbnail:hover {
    background: #d1ebff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.map-placeholder {
    text-align: center;
    color: #409eff;
}

.map-pin {
    font-size: 24px;
    margin-bottom: 5px;
}

.map-text {
    font-size: 12px;
    font-weight: 500;
}

.map-tooltip {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
}

/* 添加剂详情样式 */
.additive-item {
    padding: 12px;
    border-radius: 8px;
    background: #f9f9f9;
    margin: 8px;
    flex: 1 1 200px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.additive-item.controversial {
    border-left: 4px solid #f56c6c;
}

.additive-name {
    font-weight: 600;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
}

.additive-function {
    font-size: 12px;
    color: #606266;
    margin-bottom: 4px;
}

.additive-risk {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    display: inline-block;
}

.additive-risk.安全 {
    background: #f0f9eb;
    color: #67c23a;
}

.additive-risk.需注意 {
    background: #fdf6ec;
    color: #e6a23c;
}

.additive-risk.高风险 {
    background: #fef0f0;
    color: #f56c6c;
}

.info-icon {
    margin-left: 8px;
    color: #409eff;
    cursor: pointer;
}

.warning-icon {
    margin-left: 8px;
    color: #f56c6c;
}

/* 添加剂合规性样式 */
.additive-compliance {
    margin-top: 24px;
    padding: 16px;
    background: #f9f9f9;
    border-radius: 8px;
}

.compliance-stats {
    margin: 12px 0;
}

.non-compliant-list {
    margin-top: 12px;
}

.non-compliant-list ul {
    list-style: none;
    padding: 0;
}

.non-compliant-list li {
    padding: 4px 0;
    color: #f56c6c;
}

/* 合规性报告样式 */
.compliance-report {
    margin-top: 24px;
    padding: 16px;
    background: #f9f9f9;
    border-radius: 8px;
}

.report-stats {
    margin: 12px 0;
}

.report-details {
    margin-top: 12px;
    font-size: 14px;
}

.report-issues {
    margin-top: 16px;
}

.report-issues ul {
    list-style: none;
    padding: 0;
}

.report-issues li {
    padding: 4px 0;
    color: #f56c6c;
}

.report-suggestions {
    margin-top: 16px;
}

.report-suggestions ul {
    list-style: none;
    padding: 0;
}

.report-suggestions li {
    padding: 4px 0;
    color: #409eff;
}
</style>