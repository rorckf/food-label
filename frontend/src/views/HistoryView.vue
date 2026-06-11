<template>
  <div class="history-page">
    <!-- 页首 -->
    <header class="hist-hero">
      <div class="hist-hero__eyebrow">
        <span class="hist-hero__line"></span>
        <span class="hist-hero__tiny">LEDGER · 识读档案</span>
        <span class="hist-hero__line"></span>
      </div>
      <h1 class="hist-hero__title">历史记录</h1>
      <p class="hist-hero__sub">
        按月归档的每一次识读，如同笔记本上的时间切片。
        <span v-if="historyList.length" class="hist-hero__count">· 共 {{ historyList.length }} 条</span>
      </p>
    </header>

    <!-- Tab：全部 / 已收藏 -->
    <el-tabs v-model="activeTab" class="hist-tabs">
      <el-tab-pane :label="`全部 (${historyList.length})`" name="all" />
      <el-tab-pane :label="`已收藏 (${favoriteCount})`" name="fav" />
    </el-tabs>

    <!-- 搜索 / 筛选 -->
    <section class="hist-filter">
      <div class="hist-filter__search">
        <BaseInput
          v-model="searchKeyword"
          placeholder="搜索产品名称"
          :icon="'Search'"
        />
      </div>
      <div class="hist-filter__date">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :clearable="true"
          :editable="false"
        >
          <template #prefix>
            <el-icon><Calendar /></el-icon>
          </template>
        </el-date-picker>
      </div>
    </section>

    <!-- 装饰分隔 -->
    <div class="hist-divider" aria-hidden="true">
      <span></span><span class="hist-divider__mark">❦</span><span></span>
    </div>

    <!-- 列表 -->
    <main class="hist-main">
      <div v-if="loading" class="state-box">
        <el-icon class="state-box__spin"><Loading /></el-icon>
        <span>加载中…</span>
      </div>

      <div v-else-if="filteredGroupedHistory.length === 0" class="state-box state-box--empty">
        <div class="state-box__mark">
          <el-icon><Document /></el-icon>
        </div>
        <h3 class="state-box__title">{{ activeTab === 'fav' ? '还没有收藏' : '暂无扫描记录' }}</h3>
        <p class="state-box__desc">{{ activeTab === 'fav' ? '识读结果页点 ★ 即可加入收藏' : '去首页扫一个吧' }}</p>
        <BaseButton type="primary" @click="goToHome">
          <el-icon><Camera /></el-icon> 开始扫描
        </BaseButton>
      </div>

      <div v-else class="month-groups">
        <MonthGroup
          v-for="group in filteredGroupedHistory"
          :key="group.yearMonth"
          :group-year-month="group.yearMonth"
          :group-items="group.items"
          @item-deleted="handleItemDeleted"
          ref="monthGroupRefs"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Calendar, Loading, Document, Camera } from '@element-plus/icons-vue'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import MonthGroup from '@/components/history/MonthGroup.vue'
import { historyAPI } from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const searchKeyword = ref('')
const selectedDate = ref('')
const activeTab = ref(route.query.tab === 'fav' ? 'fav' : 'all')
const monthGroupRefs = ref([])

const historyList = reactive([])

const favoriteCount = computed(() => historyList.filter(it => it.isFavorite === 1).length)

const groupedHistory = computed(() => {
  const groups = {}
  historyList.forEach(item => {
    const date = new Date(item.scanTime)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const yearMonth = `${year}-${month}`
    if (!groups[yearMonth]) groups[yearMonth] = []
    groups[yearMonth].push(item)
  })
  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .map(yearMonth => ({
      yearMonth,
      items: groups[yearMonth].sort((a, b) => new Date(b.scanTime) - new Date(a.scanTime))
    }))
})

const filteredGroupedHistory = computed(() => {
  return groupedHistory.value
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        const keywordMatch = !searchKeyword.value ||
          item.productName.toLowerCase().includes(searchKeyword.value.toLowerCase())
        const dateMatch = !selectedDate.value ||
          item.scanTime.startsWith(selectedDate.value)
        const favMatch = activeTab.value !== 'fav' || item.isFavorite === 1
        return keywordMatch && dateMatch && favMatch
      })
    }))
    .filter(group => group.items.length > 0)
})

const fetchHistoryList = async () => {
  try {
    loading.value = true
    const res = await historyAPI.getHistoryList()
    if (res.code === 200 && res.data) {
      const items = res.data.map(item => ({
        id: item.id,
        productName: item.productName || '未知产品',
        thumbnailUrl: item.imageUrl || '/placeholder-image.jpg',
        scanTime: Array.isArray(item.createTime)
          ? new Date(...item.createTime).toISOString()
          : item.createTime,
        isFavorite: item.isFavorite,
        healthScore: item.healthScore
      }))
      historyList.splice(0, historyList.length, ...items)
    } else {
      ElMessage.error(res.message || '获取历史记录失败')
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    loading.value = false
    nextTick(() => {
      setTimeout(() => {
        monthGroupRefs.value?.forEach(group => group?.checkScrollHint?.())
      }, 200)
    })
  }
}

const handleItemDeleted = ({ itemId }) => {
  const idx = historyList.findIndex(item => item.id === itemId)
  if (idx !== -1) historyList.splice(idx, 1)
  ElMessage.success('删除成功')
}

const goToHome = () => router.push('/')

onMounted(fetchHistoryList)
</script>

<style scoped>
.history-page {
  max-width: var(--w-content-max);
  margin: 0 auto;
  padding: var(--w-space-7) var(--w-space-6) var(--w-space-9);
}

/* ── Hero ── */
.hist-hero { text-align: center; padding: var(--w-space-5) 0 var(--w-space-6); }
.hist-hero__eyebrow {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; color: var(--w-amber);
  margin-bottom: var(--w-space-4);
}
.hist-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.hist-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }

.hist-hero__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.08em;
  margin-bottom: var(--w-space-3);
}
.hist-hero__sub {
  max-width: 520px; margin: 0 auto;
  color: var(--w-ink-mid);
  font-size: 14px; line-height: 1.8;
  letter-spacing: 0.05em;
}
.hist-hero__count { color: var(--w-amber); margin-left: 4px; }

/* ── Tabs ── */
.hist-tabs { max-width: 640px; margin: var(--w-space-4) auto 0; }
.hist-tabs :deep(.el-tabs__nav-wrap) { display: flex; justify-content: center; }
.hist-tabs :deep(.el-tabs__nav-wrap::after) { background-color: var(--w-divider); }
.hist-tabs :deep(.el-tabs__item) { font-family: var(--w-font-serif); letter-spacing: 0.08em; color: var(--w-ink-mid); }
.hist-tabs :deep(.el-tabs__item.is-active) { color: var(--w-primary); }
.hist-tabs :deep(.el-tabs__active-bar) { background-color: var(--w-primary); }

/* ── Filter ── */
.hist-filter {
  max-width: 640px;
  margin: var(--w-space-5) auto 0;
  display: flex;
  gap: var(--w-space-3);
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.hist-filter__search { flex: 1; min-width: 240px; max-width: 360px; }
.hist-filter__date   { width: 180px; }

:deep(.el-date-editor) {
  border-color: var(--w-border) !important;
  border-radius: var(--w-radius-md) !important;
  background: var(--w-surface) !important;
}
:deep(.el-input__wrapper) {
  background: var(--w-surface) !important;
  box-shadow: 0 0 0 1px var(--w-border-soft) inset !important;
  border-radius: var(--w-radius-md) !important;
}
:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--w-primary) inset !important;
}
:deep(.el-input__inner) { color: var(--w-ink); }

/* ── 装饰分隔 ── */
.hist-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--w-space-4);
  margin: var(--w-space-6) auto var(--w-space-6);
  max-width: 340px;
  color: var(--w-amber);
}
.hist-divider span:first-child,
.hist-divider span:last-child {
  flex: 1;
  height: 1px;
  background: currentColor;
  opacity: 0.35;
}
.hist-divider__mark { font-size: 18px; opacity: 0.8; }

/* ── 主体 ── */
.hist-main { max-width: 880px; margin: 0 auto; min-height: 380px; }

.month-groups {
  display: flex;
  flex-direction: column;
  gap: var(--w-space-6);
}

/* ── 状态框 ── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--w-ink-mid);
  gap: var(--w-space-3);
}

.state-box__spin {
  font-size: 34px;
  color: var(--w-primary);
  animation: w-spin 1.1s linear infinite;
}
@keyframes w-spin { to { transform: rotate(360deg); } }

.state-box--empty { padding: 100px 20px; text-align: center; }

.state-box__mark {
  width: 84px; height: 84px;
  border-radius: 50%;
  background: var(--w-primary-pale);
  border: 1px solid var(--w-border-soft);
  color: var(--w-amber);
  display: flex; align-items: center; justify-content: center;
  font-size: 36px;
  margin-bottom: var(--w-space-4);
}

.state-box__title {
  font-family: var(--w-font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.1em;
  margin: 0 0 8px;
}

.state-box__desc {
  font-size: 13px;
  color: var(--w-ink-soft);
  letter-spacing: 0.05em;
  margin: 0 0 var(--w-space-5);
}

@media (max-width: 768px) {
  .history-page { padding: var(--w-space-5) var(--w-space-4) var(--w-space-7); }
  .hist-filter { flex-direction: column; align-items: stretch; }
  .hist-filter__search, .hist-filter__date { width: 100%; max-width: 100%; }
}
</style>
