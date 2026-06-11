<template>
  <div class="health-sidebar-wrapper">
    <!-- 健康饮食动画容器 - 三栏布局 -->
    <div class="health-wellness-container">
      <!-- 卡片1 -->
      <div class="health-card card-1">
        <!-- 漂浮动画元素 -->
        <div class="floating-nutrients card-1-float">
          <div class="float-item">📋</div>
          <div class="float-item">🔍</div>
          <div class="float-item">📊</div>
        </div>
        
        <!-- 卡片内容 -->
        <div class="health-content">
          <div class="wellness-badge">预包装食品 · 标签解读</div>
          <h2 class="card-title">标签解读指南</h2>
          
          <!-- 动态健康箴言 (轮播切换) -->
          <div class="tip-container">
            <div class="light-icon-container">
              <span class="tip-icon" :class="{ 'light-off': !lightStatus[0] }" @click="toggleLight(0)">{{ lightStatus[0] ? '💡' : '💤' }}</span>
            </div>
            <div class="tip-text">{{ currentTips[0] }}</div>
          </div>
          
          <!-- 预包装食品标签要点 -->
          <div class="health-stats">
            <div class="stat-item">
              <div class="stat-value">📝</div>
              <div class="stat-label">营养成分表</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">🧪</div>
              <div class="stat-label">配料表</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">⏰</div>
              <div class="stat-label">生产日期</div>
            </div>
          </div>
          
          <!-- 标签解读步骤 -->
          <div class="pyramid-container">
            <div class="pyramid-title">标签解读步骤</div>
            <div class="pyramid">
              <div class="pyramid-layer layer-1">
                <span>查看营养成分表</span>
              </div>
              <div class="pyramid-layer layer-2">
                <span>分析配料表</span>
              </div>
              <div class="pyramid-layer layer-3">
                <span>检查保质期</span>
              </div>
              <div class="pyramid-layer layer-4">
                <span>了解储存条件</span>
              </div>
              <div class="pyramid-layer layer-5">
                <span>注意过敏原信息</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 卡片2 -->
      <div class="health-card card-2">
        <!-- 漂浮动画元素 -->
        <div class="floating-nutrients card-2-float">
          <div class="float-item">🛡️</div>
          <div class="float-item">✅</div>
          <div class="float-item">⚠️</div>
        </div>
        
        <!-- 卡片内容 -->
        <div class="health-content">
          <div class="wellness-badge">预包装食品 · 安全指南</div>
          <h2 class="card-title">食品安全贴士</h2>
          
          <!-- 动态健康箴言 (轮播切换) -->
          <div class="tip-container">
            <div class="light-icon-container">
              <span class="tip-icon" :class="{ 'light-off': !lightStatus[1] }" @click="toggleLight(1)">{{ lightStatus[1] ? '💡' : '💤' }}</span>
            </div>
            <div class="tip-text">{{ currentTips[1] }}</div>
          </div>
          
          <!-- 食品安全要点 -->
          <div class="health-stats">
            <div class="stat-item">
              <div class="stat-value">📦</div>
              <div class="stat-label">包装完好</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">❄️</div>
              <div class="stat-label">正确储存</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">🛒</div>
              <div class="stat-label">正规渠道</div>
            </div>
          </div>
          
          <!-- 食品安全等级 -->
          <div class="pyramid-container">
            <div class="pyramid-title">食品安全等级</div>
            <div class="pyramid">
              <div class="pyramid-layer layer-1">
                <span>优质安全</span>
              </div>
              <div class="pyramid-layer layer-2">
                <span>一般安全</span>
              </div>
              <div class="pyramid-layer layer-3">
                <span>注意食用</span>
              </div>
              <div class="pyramid-layer layer-4">
                <span>谨慎选择</span>
              </div>
              <div class="pyramid-layer layer-5">
                <span>避免食用</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 卡片3 -->
      <div class="health-card card-3">
        <!-- 漂浮动画元素 -->
        <div class="floating-nutrients card-3-float">
          <div class="float-item">🥗</div>
          <div class="float-item">⚖️</div>
          <div class="float-item">🏆</div>
        </div>
        
        <!-- 卡片内容 -->
        <div class="health-content">
          <div class="wellness-badge">预包装食品 · 选择技巧</div>
          <h2 class="card-title">健康选择指南</h2>
          
          <!-- 动态健康箴言 (轮播切换) -->
          <div class="tip-container">
            <div class="light-icon-container">
              <span class="tip-icon" :class="{ 'light-off': !lightStatus[2] }" @click="toggleLight(2)">{{ lightStatus[2] ? '💡' : '💤' }}</span>
            </div>
            <div class="tip-text">{{ currentTips[2] }}</div>
          </div>
          
          <!-- 健康选择要点 -->
          <div class="health-stats">
            <div class="stat-item">
              <div class="stat-value">🧂</div>
              <div class="stat-label">低盐</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">🍬</div>
              <div class="stat-label">低糖</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">🥩</div>
              <div class="stat-label">低脂</div>
            </div>
          </div>
          
          <!-- 健康选择优先级 -->
          <div class="pyramid-container">
            <div class="pyramid-title">健康选择优先级</div>
            <div class="pyramid">
              <div class="pyramid-layer layer-1">
                <span>新鲜食材</span>
              </div>
              <div class="pyramid-layer layer-2">
                <span>少加工食品</span>
              </div>
              <div class="pyramid-layer layer-3">
                <span>添加剂少</span>
              </div>
              <div class="pyramid-layer layer-4">
                <span>营养均衡</span>
              </div>
              <div class="pyramid-layer layer-5">
                <span>适量食用</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 健康小贴士列表 - 三个不同的类别（预包装食品健康相关）
const healthTips = [
  // 卡片1: 预包装食品标签解读
  [
    '查看预包装食品的营养成分表，了解能量和营养素含量',
    '注意配料表顺序，含量越高的成分排名越靠前',
    '关注食品添加剂，选择添加剂较少的产品',
    '查看生产日期和保质期，确保食品新鲜',
    '注意净含量，避免被包装大小误导'
  ],
  // 卡片2: 预包装食品安全
  [
    '购买预包装食品时检查包装是否完好无损',
    '注意储存条件，按照包装说明正确保存',
    '避免购买超过保质期的预包装食品',
    '注意食品标签上的过敏原信息',
    '选择正规渠道购买预包装食品'
  ],
  // 卡片3: 预包装食品选择技巧
  [
    '选择低盐、低糖、低脂肪的预包装食品',
    '查看营养声称，如"无添加糖"、"低盐"等',
    '比较同类产品的营养成分，选择更健康的选项',
    '注意隐形糖和隐形盐，如酱油、番茄酱等',
    '适量食用加工食品，多吃新鲜食材'
  ]
]

// 当前显示的小贴士
const currentTips = ref(['', '', ''])
// 灯泡状态
const lightStatus = ref([true, true, true])
let tipIntervals = []

// 切换灯泡状态
const toggleLight = (index) => {
  lightStatus.value[index] = !lightStatus.value[index]
}

// 切换健康小贴士
const rotateTips = () => {
  // 为每个卡片设置独立的轮换逻辑
  for (let i = 0; i < 3; i++) {
    let currentIndex = 0
    
    // 立即显示第一条
    currentTips.value[i] = healthTips[i][currentIndex]
    
    // 设置轮换间隔（延长1秒）
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % healthTips[i].length
      currentTips.value[i] = healthTips[i][currentIndex]
    }, 6000 + i * 1000) // 每个卡片错开1秒轮换，总间隔延长1秒
    
    tipIntervals.push(interval)
  }
}

// 模拟AI生成预包装食品健康小贴士
const generateAITips = async () => {
  try {
    // 这里可以替换为实际的AI API调用
    // 模拟AI响应
    console.log('AI正在生成预包装食品健康小贴士...')
    // 实际项目中，这里应该调用AI API
    // const response = await axios.post('/api/ai/generate-tips', { topic: '预包装食品健康' })
    // const aiTips = response.data.tips
    
    // 模拟AI生成的小贴士
    const aiGeneratedTips = [
      '注意预包装食品中的反式脂肪酸含量，过多摄入对健康有害',
      '查看营养成分表中的钠含量，成人每日钠摄入不超过2000mg',
      '选择含有全谷物的预包装食品，增加膳食纤维摄入',
      '注意食品标签上的"无糖"声称，可能含有其他甜味剂',
      '查看食品的能量密度，选择低能量密度的产品'
    ]
    
    // 将AI生成的小贴士添加到现有列表
    healthTips[0] = [...healthTips[0], ...aiGeneratedTips]
    console.log('AI小贴士生成完成')
  } catch (error) {
    console.error('AI生成小贴士失败:', error)
  }
}

onMounted(() => {
  rotateTips()
  // 初始化时生成AI小贴士
  generateAITips()
})

onUnmounted(() => {
  // 清除所有定时器
  tipIntervals.forEach(interval => clearInterval(interval))
})
</script>

<style scoped>
/* 健康饮食动画容器 - 三栏布局 */
.health-wellness-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 600px;
}

/* 健康卡片通用样式 */
.health-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  padding: 20px 16px 24px 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.health-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 卡片1特殊样式 */
.card-1 {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
}

/* 卡片2特殊样式 */
.card-2 {
  background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
}

/* 卡片3特殊样式 */
.card-3 {
  background: linear-gradient(135deg, #fff7e6 0%, #ffffff 100%);
}

/* 漂浮动画元素的容器 (z-index底层背景层) */
.floating-nutrients {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

/* 单个漂浮食物图标 */
.float-item {
  position: absolute;
  font-size: 1.2rem;
  filter: drop-shadow(0 4px 6px rgba(64, 158, 255, 0.1));
  opacity: 0.2;
  will-change: transform;
  user-select: none;
  pointer-events: none;
}

/* 卡片1漂浮动画 */
.card-1-float .float-item {
  animation: floatAround 18s infinite ease-in-out;
}

.card-1-float .float-item:nth-child(1) { top: 10%; left: 10%; animation-duration: 20s; animation-delay: 0s; }
.card-1-float .float-item:nth-child(2) { top: 60%; left: 20%; animation-duration: 15s; animation-delay: -3s; }
.card-1-float .float-item:nth-child(3) { top: 40%; right: 15%; animation-duration: 22s; animation-delay: -5s; }

/* 卡片2漂浮动画 */
.card-2-float .float-item {
  animation: floatAround2 20s infinite ease-in-out;
}

.card-2-float .float-item:nth-child(1) { top: 20%; left: 15%; animation-duration: 18s; animation-delay: 0s; }
.card-2-float .float-item:nth-child(2) { top: 70%; left: 10%; animation-duration: 25s; animation-delay: -2s; }
.card-2-float .float-item:nth-child(3) { top: 50%; right: 10%; animation-duration: 20s; animation-delay: -4s; }

/* 卡片3漂浮动画 */
.card-3-float .float-item {
  animation: floatAround3 22s infinite ease-in-out;
}

.card-3-float .float-item:nth-child(1) { top: 15%; left: 10%; animation-duration: 25s; animation-delay: 0s; }
.card-3-float .float-item:nth-child(2) { top: 65%; left: 15%; animation-duration: 18s; animation-delay: -3s; }
.card-3-float .float-item:nth-child(3) { top: 45%; right: 10%; animation-duration: 22s; animation-delay: -5s; }

/* 核心漂浮动画1：缓慢上下浮动 + 轻微水平漂移 + 柔和旋转 */
@keyframes floatAround {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(10px, -15px) rotate(3deg);
  }
  50% {
    transform: translate(-5px, -25px) rotate(-2deg);
  }
  75% {
    transform: translate(8px, -10px) rotate(2deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

/* 核心漂浮动画2：不同路径 */
@keyframes floatAround2 {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(-10px, -18px) rotate(-3deg);
  }
  50% {
    transform: translate(8px, -30px) rotate(2deg);
  }
  75% {
    transform: translate(-5px, -12px) rotate(-1deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

/* 核心漂浮动画3：另一种路径 */
@keyframes floatAround3 {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(12px, -12px) rotate(4deg);
  }
  50% {
    transform: translate(-8px, -20px) rotate(-3deg);
  }
  75% {
    transform: translate(6px, -8px) rotate(1deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

/* 健康内容主区域 (文字+小贴士) 位于漂浮物上层 */
.health-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  flex: 1;
}

/* 主标题 & 装饰 */
.wellness-badge {
  background: #ecf5ff;
  border-radius: 4px;
  padding: 4px 12px;
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #409eff;
  border: 1px solid #d9ecff;
  margin-bottom: 8px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.3;
  text-align: center;
}

/* 动态健康箴言 (轮播切换) */
.tip-container {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  margin: 4px 0;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.light-icon-container {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background: #f5f7fa;
  padding: 5px;
  border-radius: 50%;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.tip-icon {
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tip-icon:hover {
  transform: scale(1.1);
}

.tip-icon.light-off {
  opacity: 0.5;
  filter: grayscale(100%);
}

.tip-text {
  line-height: 1.4;
  text-align: center;
  margin-top: 10px;
  font-size: 0.9rem;
  font-weight: 400;
  color: #666;
  transition: opacity 0.5s ease;
  padding: 0 10px;
}

/* 健康数据统计 */
.health-stats {
  display: flex;
  justify-content: space-around;
  gap: 12px;
  margin: 12px 0;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  width: 100%;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 400;
  text-align: center;
}

/* 健康饮食金字塔 */
.pyramid-container {
  margin-top: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  width: 100%;
  margin-top: auto;
}

.pyramid-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  text-align: center;
}

.pyramid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.pyramid-layer {
  width: 100%;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 500;
  text-align: center;
  color: white;
  transition: all 0.3s ease;
  background: #409eff;
}

/* 卡片1金字塔颜色 */
.card-1 .pyramid-layer.layer-1 { background: #409eff; width: 100%; }
.card-1 .pyramid-layer.layer-2 { background: #66b1ff; width: 85%; }
.card-1 .pyramid-layer.layer-3 { background: #91d5ff; width: 70%; }
.card-1 .pyramid-layer.layer-4 { background: #bae7ff; width: 55%; color: #333; }
.card-1 .pyramid-layer.layer-5 { background: #e6f7ff; width: 40%; color: #333; }

/* 卡片2金字塔颜色 */
.card-2 .pyramid-layer.layer-1 { background: #52c41a; width: 100%; }
.card-2 .pyramid-layer.layer-2 { background: #73d13d; width: 85%; }
.card-2 .pyramid-layer.layer-3 { background: #95de64; width: 70%; }
.card-2 .pyramid-layer.layer-4 { background: #b7eb8f; width: 55%; color: #333; }
.card-2 .pyramid-layer.layer-5 { background: #f6ffed; width: 40%; color: #333; }

/* 卡片3金字塔颜色 */
.card-3 .pyramid-layer.layer-1 { background: #faad14; width: 100%; }
.card-3 .pyramid-layer.layer-2 { background: #ffc53d; width: 85%; }
.card-3 .pyramid-layer.layer-3 { background: #ffd666; width: 70%; }
.card-3 .pyramid-layer.layer-4 { background: #ffe58f; width: 55%; color: #333; }
.card-3 .pyramid-layer.layer-5 { background: #fff7e6; width: 40%; color: #333; }

.pyramid-layer:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .health-wellness-container {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .health-card {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .health-wellness-container {
    gap: 10px;
  }
  
  .health-card {
    padding: 16px 12px 20px 12px;
    min-height: 350px;
  }
  
  .card-title {
    font-size: 1rem;
  }
  
  .health-stats {
    gap: 8px;
    padding: 10px;
  }
  
  .stat-value {
    font-size: 1.2rem;
  }
  
  .tip-container {
    padding: 10px 14px;
  }
  
  .dynamic-tip {
    font-size: 0.85rem;
    min-height: 2.5rem;
  }
}
</style>