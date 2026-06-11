<template>
  <div class="result-container" ref="shareTarget">
    <!-- 分享操作栏 -->
    <div class="share-toolbar" v-if="result">
      <el-dropdown trigger="click" @command="handleShareCommand">
        <el-button type="primary" size="small" :loading="sharing">
          <el-icon><Share /></el-icon> 分享
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="image"><el-icon><Picture /></el-icon> 生成图片</el-dropdown-item>
            <el-dropdown-item command="text"><el-icon><CopyDocument /></el-icon> 复制文案</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 第二行：产品速览卡、配料表、营养成分 - 容器2、3、4 -->
    <el-row :gutter="20" class="result-row">
      <!-- 产品速览卡和使用指南卡 -->
      <el-col :span="8" class="result-col">
        <!-- 产品速览卡 - 容器2 -->
        <el-card class="info-card product-overview-card">
          <template #header>
            <h3><el-icon><InfoFilled /></el-icon> 产品速览卡</h3>
          </template>
          <div class="product-overview">
            <h2 class="product-name-overview">{{ result?.productName || '产品名称' }}</h2>
            <div class="overview-tags">
              <el-tag v-for="(tag, index) in sortedTags" :key="index" class="overview-tag" size="large">
                {{ tag.text }}
              </el-tag>
            </div>
            <el-tag type="warning" class="allergen-tag-overview" v-if="result?.allergenInfo">
              {{ result?.allergenInfo || '致敏物质' }}
            </el-tag>
            <div class="usage-info" v-if="result?.usageInfo">
              <span class="usage-item">🧊 {{ result?.usageInfo?.storage || '贮存条件' }}</span>
              <span class="usage-item">🍽️ {{ result?.usageInfo?.consumption || '食用方法' }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 使用指南卡 - 容器7 -->
        <el-card class="info-card usage-guide-card">
          <template #header>
            <h3><el-icon><InfoFilled /></el-icon> 使用指南</h3>
          </template>
          <div class="usage-guide-content">
            <div v-if="result?.storageCondition && !result.storageCondition.includes('见背面') && !result.storageCondition.includes('空白处')" class="guide-item">
              <div class="guide-icon">🧊</div>
              <div class="guide-content">
                <span class="guide-title">贮存条件</span>
                <span class="guide-text">{{ result.storageCondition }}</span>
              </div>
            </div>
            <div v-if="result?.consumptionMethod && !result.consumptionMethod.includes('见背面') && !result.consumptionMethod.includes('空白处')" class="guide-item">
              <div class="guide-icon">🍽️</div>
              <div class="guide-content">
                <span class="guide-title">食用方法</span>
                <span class="guide-text">{{ result.consumptionMethod }}</span>
              </div>
            </div>
            <div v-if="result?.precautions && !result.precautions.includes('见背面') && !result.precautions.includes('空白处')" class="guide-item">
              <div class="guide-icon">⚠️</div>
              <div class="guide-content">
                <span class="guide-title">注意事项</span>
                <span class="guide-text">{{ result.precautions }}</span>
              </div>
            </div>
            <div v-if="result?.additionalTips && !result.additionalTips.includes('见背面') && !result.additionalTips.includes('空白处')" class="guide-item">
              <div class="guide-icon">💡</div>
              <div class="guide-content">
                <span class="guide-title">重要提示</span>
                <span class="guide-text">{{ result.additionalTips }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 配料表 - 容器3 -->
      <el-col :span="8" class="result-col">
        <el-card class="info-card ingredients-transparent-card">
          <template #header>
            <h3><el-icon><List /></el-icon> 配料透明卡</h3>
          </template>
          <div class="ingredients-list">
            <!-- 有 ingredients 数组时：逐项展示，已知添加剂高亮可点击 -->
            <template v-if="result?.ingredients && result.ingredients.length > 0">
              <div class="ingredients-grid">
                <div
                  v-for="(ing, index) in result.ingredients"
                  :key="index"
                  class="ingredient-grid-item"
                  :class="{ 'additive-grid-item': isAdditive(ing) }"
                  @click="isAdditive(ing) && openAdditiveDialog(ing)"
                  :style="isAdditive(ing) ? 'cursor:pointer' : ''"
                >
                  <span class="ingredient-grid-name">{{ ing }}</span>
                  <el-tag v-if="isAdditive(ing)" size="small" class="additive-tag">
                    {{ result.additiveMap?.[ing]?.category || '添加剂' }}
                  </el-tag>
                </div>
              </div>
            </template>
            <!-- 仅有纯文本时回退显示 -->
            <div v-else-if="result?.ingredientsText" class="ingredient-text">
              {{ result.ingredientsText }}
            </div>
            <div v-else class="ingredient-empty">无配料信息</div>
          </div>
        </el-card>

        <!-- 添加剂速查弹窗 -->
        <AdditiveDetailDialog
          v-model:visible="dialogVisible"
          :additive-info="selectedAdditive"
        />
      </el-col>

      <!-- 营养成分 - 容器4 -->
      <el-col :span="8" class="result-col">
        <el-card class="info-card nutrition-facts-card">
          <template #header>
            <h3><el-icon><DataAnalysis /></el-icon> 营养事实卡</h3>
          </template>
          <div class="nutrition-facts-content">
            <!-- 每100g含量 -->
            <div class="nutrition-section">
              <h4 class="section-title">每100g含量</h4>
              <div class="nutrition-grid">
                <div class="nutrition-row">
                  <span class="nutrient-name">能量</span>
                  <div class="nutrient-value-with-unit">
                    <span class="nutrient-value">{{ result?.nutrition?.energy || result?.nutrition?.energyPer100g || 0 }}</span>
                    <span class="nutrient-unit">kcal</span>
                  </div>
                </div>
                <div class="nutrition-row">
                  <span class="nutrient-name">蛋白质</span>
                  <div class="nutrient-value-with-unit">
                    <span class="nutrient-value">{{ result?.nutrition?.protein || result?.nutrition?.proteinPer100g || 0 }}</span>
                    <span class="nutrient-unit">g</span>
                  </div>
                </div>
                <div class="nutrition-row">
                  <span class="nutrient-name">脂肪</span>
                  <div class="nutrient-value-with-unit">
                    <span class="nutrient-value">{{ result?.nutrition?.fat || result?.nutrition?.fatPer100g || 0 }}</span>
                    <span class="nutrient-unit">g</span>
                  </div>
                </div>
                <div class="nutrition-row">
                  <span class="nutrient-name">碳水化合物</span>
                  <div class="nutrient-value-with-unit">
                    <span class="nutrient-value">{{ result?.nutrition?.carb || result?.nutrition?.carbPer100g || 0 }}</span>
                    <span class="nutrient-unit">g</span>
                  </div>
                </div>
                <div class="nutrition-row">
                  <span class="nutrient-name">钠</span>
                  <div class="nutrient-value-with-unit">
                    <span class="nutrient-value">{{ result?.nutrition?.sodium || result?.nutrition?.sodiumPer100g || 0 }}</span>
                    <span class="nutrient-unit">mg</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 整包摄入计算 - 抽屉式 -->
            <div class="package-drawer-container" @mouseenter="showPackageDrawer = true" @mouseleave="showPackageDrawer = false">
              <div class="drawer-trigger">
                <h4 class="section-title">整包摄入量 ({{ result?.netWeight && !result.netWeight.includes('见背面') && !result.netWeight.includes('空白处') ? result.netWeight : '净含量' }})</h4>
                <el-icon class="drawer-icon" v-if="showPackageDrawer"><ArrowUp /></el-icon>
                <el-icon class="drawer-icon" v-else><ArrowDown /></el-icon>
              </div>
              <div class="package-drawer" :class="{ 'drawer-open': showPackageDrawer }">
                <div class="whole-package-grid">
                  <div class="package-row">
                    <span class="package-name">整包能量</span>
                    <div class="package-value-with-unit">
                      <span class="package-value">{{ result?.nutrition?.energy || result?.nutrition?.energyPerPackage || 0 }}</span>
                      <span class="package-unit">kcal</span>
                    </div>
                  </div>
                  <div class="package-row">
                    <span class="package-name">整包蛋白质</span>
                    <div class="package-value-with-unit">
                      <span class="package-value">{{ result?.nutrition?.protein || result?.nutrition?.proteinPerPackage || 0 }}</span>
                      <span class="package-unit">g</span>
                    </div>
                  </div>
                  <div class="package-row">
                    <span class="package-name">整包脂肪</span>
                    <div class="package-value-with-unit">
                      <span class="package-value">{{ result?.nutrition?.fat || result?.nutrition?.fatPerPackage || 0 }}</span>
                      <span class="package-unit">g</span>
                    </div>
                  </div>
                  <div class="package-row">
                    <span class="package-name">整包碳水化合物</span>
                    <div class="package-value-with-unit">
                      <span class="package-value">{{ result?.nutrition?.carb || result?.nutrition?.carbPerPackage || 0 }}</span>
                      <span class="package-unit">g</span>
                    </div>
                  </div>
                  <div class="package-row">
                    <span class="package-name">整包钠</span>
                    <div class="package-value-with-unit">
                      <span class="package-value">{{ result?.nutrition?.sodium || result?.nutrition?.sodiumPerPackage || 0 }}</span>
                      <span class="package-unit">mg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

    </el-row>

    <!-- 第二行：健康提示 + 添加剂详情 -->
    <el-row :gutter="20" class="result-row">

      <!-- 健康提示卡 -->
      <el-col :span="12" class="result-col">
        <el-card class="info-card health-tips-card">
          <template #header>
            <h3><el-icon><Sunny /></el-icon> 健康提示</h3>
          </template>
          <div class="health-tips-content">
            <template v-if="result?.healthTips && result.healthTips.length > 0">
              <div
                v-for="(tip, i) in result.healthTips"
                :key="i"
                class="health-tip-item"
                :class="tipLevelClass(tip.level)"
              >
                <div class="tip-header">
                  <span class="tip-name">{{ tip.name }}</span>
                  <el-tag :type="tipTagType(tip.level)" size="small">
                    {{ tip.level }} {{ tip.percentage }}%
                  </el-tag>
                </div>
                <span class="tip-text">{{ tip.text }}</span>
              </div>
            </template>
            <div v-else class="tips-placeholder">
              <el-icon class="placeholder-icon"><Sunny /></el-icon>
              <p>识别完成后将自动生成个性化健康建议</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 营养饼图 + 添加剂详情 -->
      <el-col :span="12" class="result-col">
        <el-card class="info-card additive-info-card">
          <template #header>
            <h3><el-icon><PieChart /></el-icon> 三大营养素占比</h3>
          </template>
          <div ref="chartRef" class="nutrition-chart"></div>
        </el-card>
      </el-col>

    </el-row>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import { ElMessage } from 'element-plus'
import AdditiveDetailDialog from '@/components/dialogs/AdditiveDetailDialog.vue'

const props = defineProps({
  result: { type: Object, default: null }
})

// ── 通用 ──────────────────────────────────────────────────────────────────
const showPackageDrawer = ref(false)

const sortedTags = computed(() => {
    const tags = []
    if (props.result?.netWeight && !props.result.netWeight.includes('见背面') && !props.result.netWeight.includes('空白处'))
        tags.push({ text: props.result.netWeight, type: 'netWeight' })
    if (props.result?.foodCategory && !props.result.foodCategory.includes('见背面') && !props.result.foodCategory.includes('空白处') && props.result.foodCategory !== '食品类别')
        tags.push({ text: props.result.foodCategory, type: 'foodCategory' })
    if (props.result?.productionDate && !props.result.productionDate.includes('见背面') && !props.result.productionDate.includes('空白处'))
        tags.push({ text: props.result.productionDate, type: 'productionDate' })
    return tags.sort((a, b) => a.text.length - b.text.length)
})

// ── 添加剂弹窗 ────────────────────────────────────────────────────────────
const dialogVisible   = ref(false)
const selectedAdditive = ref(null)

const isAdditive = (name) => !!props.result?.additiveMap?.[name]

const openAdditiveDialog = (name) => {
    selectedAdditive.value = props.result?.additiveMap?.[name] ?? { name, category: '未知', description: '暂无说明' }
    dialogVisible.value = true
}

// ── 健康提示级别 ──────────────────────────────────────────────────────────
const tipLevelClass = (level) => {
    if (level === '偏高') return 'tip-high'
    if (level === '偏低') return 'tip-low'
    return 'tip-mid'
}

const tipTagType = (level) => {
    if (level === '偏高') return 'danger'
    if (level === '偏低') return 'info'
    return 'success'
}

// ── ECharts 饼图 ──────────────────────────────────────────────────────────
const chartRef  = ref(null)
let   chartInst = null

const initChart = () => {
    if (!chartRef.value) return
    if (chartInst) chartInst.dispose()
    chartInst = echarts.init(chartRef.value)
    renderChart()
}

const renderChart = () => {
    if (!chartInst) return
    const nut = props.result?.nutrition
    const protein = nut?.protein ?? 0
    const fat     = nut?.fat     ?? 0
    const carb    = nut?.carbohydrate ?? nut?.carb ?? 0
    chartInst.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}g ({d}%)' },
        legend:  { bottom: 0, itemWidth: 12 },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            data: [
                { value: protein, name: '蛋白质', itemStyle: { color: '#5470c6' } },
                { value: fat,     name: '脂肪',   itemStyle: { color: '#fac858' } },
                { value: carb,    name: '碳水化合物', itemStyle: { color: '#91cc75' } }
            ],
            label: { show: false }
        }]
    })
}

onMounted(() => nextTick(initChart))
onUnmounted(() => chartInst?.dispose())
watch(() => props.result?.nutrition, () => nextTick(renderChart), { deep: true })

// ── 分享功能 ──────────────────────────────────────────────────────────────
const shareTarget = ref(null)
const sharing     = ref(false)

const handleShareCommand = (cmd) => {
    if (cmd === 'image') handleShareImage()
    else handleCopyText()
}

const handleShareImage = async () => {
    if (!shareTarget.value) return
    sharing.value = true
    try {
        const canvas = await html2canvas(shareTarget.value, {
            useCORS: true,
            scale: 2,
            backgroundColor: '#ffffff'
        })
        const url  = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        const name = props.result?.productName || '食品标签'
        const time = new Date().toISOString().slice(0, 10)
        link.download = `食品标签解读_${name}_${time}.png`
        link.href = url
        link.click()
        ElMessage.success('图片已保存')
    } catch (e) {
        ElMessage.error('图片生成失败，请重试')
    } finally {
        sharing.value = false
    }
}

const handleCopyText = async () => {
    const r = props.result
    if (!r) return
    const nut   = r.nutrition || {}
    const tips  = (r.healthTips || []).slice(0, 3).map(t => `${t.name}${t.level}`).join('、')
    const adds  = Object.keys(r.additiveMap || {}).slice(0, 3).join('、') || '无'
    const text = [
        `【食品标签解读】${r.productName || '未知产品'} (${r.netContent || ''})`,
        `- 能量: ${nut.energy || 0}kcal/100g`,
        `- 蛋白质: ${nut.protein || 0}g/100g`,
        `- 脂肪: ${nut.fat || 0}g/100g`,
        `- 碳水化合物: ${nut.carbohydrate || nut.carb || 0}g/100g`,
        `- 钠: ${nut.sodium || 0}mg/100g`,
        `- 主要添加剂: ${adds}`,
        tips ? `- 健康提示: ${tips}` : '',
        `—— 来自"食安慧眼"小程序`
    ].filter(Boolean).join('\n')
    try {
        await navigator.clipboard.writeText(text)
        ElMessage.success('文案已复制到剪贴板')
    } catch (e) {
        ElMessage.error('复制失败，请手动复制')
    }
}
</script>

<style scoped>
/* 分享工具栏 */
.share-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

/* 容器样式 */
.result-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-row {
  margin-bottom: 20px;
  flex: 1;
  display: flex;
  gap: 20px;
}

.result-col {
  flex: 1;
}

.product-overview-card {
  margin-bottom: 20px;
  height: 100%;
}

.ingredients-transparent-card,
.nutrition-facts-card {
  height: 100%;
}

/* 统一卡片样式 */
.el-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.el-card:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.el-card__header {
    padding: 8px 20px;
    border-bottom: 1px solid #f0f0f0;
    background-color: #fafafa;
    border-radius: 8px 8px 0 0;
    margin-bottom: 8px;
}

.el-card__header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 产品速览卡样式 */
.product-overview-card {
    border-radius: 16px;
}

.product-overview {
    padding: 20px;
    background: white;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.product-name-overview {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    line-height: 1.3;
}

.overview-tags {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.overview-tag {
    font-size: 14px;
    height: 32px;
    line-height: 30px;
    padding: 0 16px;
    border-radius: 8px;
    background-color: #f5f5f5;
    border: none;
    color: #666;
    font-weight: 500;
    width: fit-content;
    white-space: nowrap;
}

.allergen-tag-overview {
    display: block;
    width: fit-content;
    font-size: 14px;
    height: 36px;
    line-height: 34px;
    padding: 0 20px;
    border-radius: 8px;
    background-color: #ffd666;
    border-color: #ffd666;
    color: #8b5a00;
    font-weight: bold;
}

.usage-info {
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    color: #666;
}

.usage-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 配料透明卡样式 */
.ingredients-transparent-card {
    border-radius: 16px;
}

.ingredients-list {
    padding: 0;
    max-height: 300px;
    overflow-y: auto;
}

.ingredient-empty {
    padding: 40px 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
}

/* 表格样式调整 */
.ingredients-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 16px;
}

.ingredient-grid-item {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 12px;
    transition: all 0.3s ease;
}

.ingredient-grid-item:hover {
    background-color: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.additive-grid-item {
    background-color: #f0f7ff;
    border-left: 3px solid #1890ff;
}

.ingredient-grid-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.ingredient-grid-name {
    font-size: 13px;
    font-weight: 500;
    color: #333;
    line-height: 1.3;
}

.ingredient-grid-percentage {
    font-size: 11px;
    color: #666;
    background-color: #f0f0f0;
    padding: 2px 6px;
    border-radius: 4px;
    width: fit-content;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .ingredients-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}



.additive-tag {
    background-color: #e6f7ff !important;
    border-color: #91d5ff !important;
    color: #1890ff !important;
    font-size: 11px !important;
    height: 20px !important;
    line-height: 18px !important;
    padding: 0 8px !important;
}

.ingredient-text {
    padding: 16px;
    line-height: 1.6;
    font-size: 14px;
    color: #333;
    white-space: pre-wrap;
}

/* 营养事实卡样式 */
.nutrition-facts-card {
    border-radius: 16px;
}

.nutrition-facts-content {
    padding: 0;
}

.nutrition-section {
    padding: 16px;
}

.package-drawer-container {
    margin-top: 16px;
    border-radius: 8px;
    overflow: hidden;
}

.drawer-trigger {
    background-color: #fafafa;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.drawer-trigger:hover {
    background-color: #f0f0f0;
}

.drawer-icon {
    transition: transform 0.3s ease;
}

.package-drawer {
    background-color: #fafafa;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.package-drawer.drawer-open {
    max-height: 200px;
}

.whole-package-grid {
    padding: 0 16px 16px;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    text-align: center;
}

.nutrition-grid, .whole-package-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.nutrition-row, .package-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
}

.nutrition-row {
    border-bottom: 1px solid #f5f5f5;
}

.nutrient-name, .package-name {
    color: #666;
    font-weight: 500;
    flex: 1;
}

.nutrient-value-with-unit, .package-value-with-unit {
    display: flex;
    align-items: baseline;
    gap: 4px;
    text-align: right;
    min-width: 100px;
}

.nutrient-value, .package-value {
    color: #333;
    font-weight: 600;
}

.nutrient-unit, .package-unit {
    color: #666;
    font-size: 12px;
    font-weight: 500;
}

.package-row {
    background-color: white;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.package-name {
    color: #333;
    font-size: 12px;
    flex: 1;
}

.package-value-with-unit {
    min-width: 80px;
}

.package-value {
    color: #1890ff;
    font-weight: bold;
    font-size: 13px;
}

.package-unit {
    color: #1890ff;
    font-size: 11px;
    font-weight: 500;
}

/* 使用指南卡样式 */
.usage-guide-card {
    border-radius: 16px;
}

.usage-guide-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.guide-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
}

.guide-item:last-child {
    border-bottom: none;
}

.guide-icon {
    font-size: 24px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f8ff;
    border-radius: 8px;
    flex-shrink: 0;
}

.guide-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.guide-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    line-height: 1.4;
}

.guide-text {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    word-break: break-all;
}

/* 健康提示卡 */
.health-tips-card, .additive-info-card {
    border-radius: 16px;
    height: 100%;
}

.health-tips-content, .additive-info-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.health-tip-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    background: #f0f9eb;
    border-radius: 8px;
    font-size: 13px;
    color: #333;
    line-height: 1.5;
}

.tip-icon { flex-shrink: 0; font-size: 16px; }
.tip-text  { flex: 1; }

.tips-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    color: #bbb;
    gap: 8px;
}

.placeholder-icon { font-size: 32px; }
.tips-placeholder p { font-size: 13px; margin: 0; }

/* 添加剂详情卡 */
.additive-detail-item {
    padding: 10px 12px;
    border-radius: 8px;
    background: #fafafa;
    border-left: 4px solid #d9d9d9;
}

.additive-detail-item.risk-high   { background: #fff2f0; border-left-color: #ff4d4f; }
.additive-detail-item.risk-medium { background: #fffbe6; border-left-color: #faad14; }
.additive-detail-item.risk-low    { background: #f6ffed; border-left-color: #52c41a; }

.additive-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.additive-detail-name {
    font-size: 13px;
    font-weight: 600;
    color: #333;
}

.additive-detail-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #888;
}

.risk-tag { flex-shrink: 0; }

/* ECharts 饼图 */
.nutrition-chart {
    width: 100%;
    height: 220px;
}

/* 健康提示级别颜色 */
.health-tip-item.tip-high { background: #fff2f0; border-left: 4px solid #ff4d4f; }
.health-tip-item.tip-mid  { background: #f6ffed; border-left: 4px solid #52c41a; }
.health-tip-item.tip-low  { background: #e6f7ff; border-left: 4px solid #1890ff; }

.tip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.tip-name {
    font-size: 13px;
    font-weight: 600;
    color: #333;
}
</style>