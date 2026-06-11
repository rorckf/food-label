<template>
  <div class="admin-page">
    <!-- 页首 -->
    <header class="admin-hero">
      <div class="admin-hero__eyebrow">
        <span class="admin-hero__line"></span>
        <span class="admin-hero__tiny">ADMIN · 用户管理</span>
        <span class="admin-hero__line"></span>
      </div>
      <h1 class="admin-hero__title">用户管理</h1>
      <p class="admin-hero__sub">
        管理系统内的注册账号，可启用 / 禁用或永久删除。
        <span v-if="total" class="admin-hero__count">· 共 {{ total }} 条</span>
      </p>
    </header>

    <!-- 装饰分隔（与 HistoryView 一致） -->
    <div class="admin-divider" aria-hidden="true">
      <span></span><span class="admin-divider__mark">❦</span><span></span>
    </div>

    <!-- 搜索 / 筛选条 -->
    <section class="admin-filter">
      <div class="admin-filter__search">
        <BaseInput
          v-model="form.keyword"
          placeholder="搜索用户名"
          :icon="'Search'"
        />
      </div>
      <div class="admin-filter__select">
        <el-select v-model="form.status" placeholder="全部状态">
          <el-option label="全部状态" value="all" />
          <el-option label="启用中"   value="enabled" />
          <el-option label="已禁用"   value="disabled" />
        </el-select>
      </div>
      <BaseButton type="primary" size="small" @click="handleSearch">搜索</BaseButton>
      <BaseButton type="secondary" size="small" @click="handleReset">重置</BaseButton>
    </section>

    <!-- 表格 -->
    <main class="admin-main">
      <el-table
        v-loading="loading"
        :data="records"
        class="admin-table"
        row-key="id"
        stripe
        border
        empty-text="暂无用户"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="140">
          <template #default="{ row }">
            <span class="cell-username">{{ row.username }}</span>
            <span v-if="row.id === currentUserId" class="cell-self-tag">本人</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="170">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="healthGoal" label="健康目标" min-width="100">
          <template #default="{ row }">{{ row.healthGoal || '—' }}</template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.role === 'admin'" type="warning" effect="light" size="small">管理员</el-tag>
            <el-tag v-else type="info" effect="plain" size="small">普通用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success" effect="light" size="small">启用</el-tag>
            <el-tag v-else type="info" effect="plain" size="small">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="cell-actions">
              <BaseButton
                size="small"
                :type="row.status === 1 ? 'secondary' : 'primary'"
                :disabled="row.id === currentUserId"
                @click="handleToggle(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </BaseButton>
              <BaseButton
                size="small"
                type="danger"
                :disabled="row.id === currentUserId"
                @click="handleDelete(row)"
              >
                删除
              </BaseButton>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="admin-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="onSizeChange"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { adminAPI } from '@/api/admin'

/* ── 当前登录管理员 id（用于禁掉对自己的操作） ── */
const currentUserId = (() => {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'
    return JSON.parse(raw).id ?? null
  } catch { return null }
})()

/* ── 查询表单 ── */
const form = reactive({
  keyword: '',
  status:  'all'
})

/* ── 分页 + 数据 ── */
const page    = ref(1)
const size    = ref(10)
const total   = ref(0)
const records = ref([])
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const res = await adminAPI.listUsers({
      page: page.value,
      size: size.value,
      keyword: form.keyword.trim(),
      status:  form.status
    })
    if (res.code === 200 && res.data) {
      records.value = res.data.records || []
      total.value   = res.data.total   || 0
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (e) { /* 拦截器已弹错 */ }
  finally { loading.value = false }
}

const handleSearch = () => {
  page.value = 1
  loadData()
}

const handleReset = () => {
  form.keyword = ''
  form.status  = 'all'
  page.value   = 1
  loadData()
}

const onSizeChange = (v) => {
  size.value = v
  page.value = 1
  loadData()
}

/* ── 启停 ── */
const handleToggle = async (row) => {
  const nextLabel = row.status === 1 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${nextLabel}账号「${row.username}」吗？`,
      `确认${nextLabel}`,
      {
        confirmButtonText: nextLabel,
        cancelButtonText:  '取消',
        type: 'warning'
      }
    )
  } catch { return }

  try {
    const res = await adminAPI.toggleStatus(row.id)
    if (res.code === 200) {
      row.status = res.data?.status ?? (row.status === 1 ? 0 : 1)
      ElMessage.success(`已${nextLabel}「${row.username}」`)
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) { /* 拦截器 */ }
}

/* ── 删除 ── */
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账号「${row.username}」吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText:  '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch { return }

  try {
    const res = await adminAPI.deleteUser(row.id)
    if (res.code === 200) {
      ElMessage.success(`已删除「${row.username}」`)
      // 若删完当前页只剩 0 条且不在首页，往前回退一页
      if (records.value.length === 1 && page.value > 1) page.value -= 1
      loadData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) { /* 拦截器 */ }
}

/* ── 工具 ── */
const formatTime = (s) => {
  if (!s) return '—'
  if (Array.isArray(s)) {
    const [y, m, d, hh = 0, mm = 0] = s
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }
  return String(s).replace('T', ' ').slice(0, 16)
}

onMounted(() => {
  document.body.classList.add('admin-white-bg')
  loadData()
})
onBeforeUnmount(() => {
  document.body.classList.remove('admin-white-bg')
})
</script>

<style>
/* 非 scoped：仅本页生效，挂载时给 body 上白底，卸载时自动移除 */
body.admin-white-bg {
  background: #FFFFFF !important;
}
</style>

<style scoped>
/* ── 容器（与 HistoryView 完全一致） ── */
.admin-page {
  max-width: var(--w-content-max);
  margin: 0 auto;
  padding: var(--w-space-7) var(--w-space-6) var(--w-space-9);

  /* 局部色板：标准后台管理风格 —— 白色表头 + 浅蓝表体 */
  --admin-card-bg:       #F0F7FF;   /* 表体 / 筛选面板浅蓝底 */
  --admin-card-border:   #BFDBFE;   /* 浅蓝边框 */
  --admin-header-bg:     #FFFFFF;   /* 白色表头 */
  --admin-header-text:   #1F2937;   /* 表头深字 */
  --admin-row-hover:     #DBEAFE;   /* hover：稍深的浅蓝 */
  --admin-row-stripe:    #E6F2FF;   /* 斑马纹：极淡蓝 */
  --admin-success:       #16A34A;   /* 启用：绿 */
  --admin-success-bg:    #DCFCE7;
  --admin-muted:         #64748B;   /* 禁用：蓝灰 */
  --admin-muted-bg:      #F1F5F9;
  --admin-shadow-card:   0 6px 18px rgba(30, 64, 175, 0.08);
}

/* ── Hero ── */
.admin-hero { text-align: center; padding: var(--w-space-5) 0 var(--w-space-6); }
.admin-hero__eyebrow {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; color: var(--w-amber);
  margin-bottom: var(--w-space-4);
}
.admin-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.admin-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }

.admin-hero__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.08em;
  margin-bottom: var(--w-space-3);
}
.admin-hero__sub {
  max-width: 520px; margin: 0 auto;
  color: var(--w-ink-mid);
  font-size: 14px; line-height: 1.8;
  letter-spacing: 0.05em;
}
.admin-hero__count { color: var(--w-amber); margin-left: 4px; }

/* ── 装饰分隔 ── */
.admin-divider {
  display: flex; align-items: center; justify-content: center;
  gap: var(--w-space-4);
  margin: var(--w-space-5) auto var(--w-space-5);
  max-width: 340px;
  color: var(--w-amber);
}
.admin-divider span:first-child,
.admin-divider span:last-child {
  flex: 1; height: 1px; background: currentColor; opacity: 0.35;
}
.admin-divider__mark { font-size: 18px; opacity: 0.8; }

/* ── 搜索条：用一层浅色 panel 把 input/select/按钮收住，避免在白纸上"散" ── */
.admin-filter {
  max-width: 880px;
  margin: 0 auto var(--w-space-5);
  display: flex;
  gap: var(--w-space-3);
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 14px 18px;
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-card-border);
  border-radius: var(--w-radius-md);
  box-shadow: var(--admin-shadow-card);
}
.admin-filter__search { flex: 1; min-width: 220px; max-width: 320px; }
.admin-filter__select { width: 150px; }

/* el-input / el-select 主题覆盖 —— 浅蓝面板上用纯白输入框，提升对比 */
:deep(.el-input__wrapper) {
  background: #FFFFFF !important;
  box-shadow: 0 0 0 1px var(--admin-card-border) inset !important;
  border-radius: var(--w-radius-md) !important;
}
:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3B82F6 inset !important;
}
:deep(.el-input__inner) { color: var(--w-ink); }

/* ── 主体 ── */
.admin-main {
  max-width: 1080px;
  margin: 0 auto;
}

/* ── el-table 主题化（局部加强对比度） ── */
.admin-table {
  background: transparent;
  border-radius: var(--w-radius-md);
  overflow: hidden;
  box-shadow: var(--admin-shadow-card);
}
:deep(.admin-table) {
  --el-table-bg-color: var(--admin-card-bg);
  --el-table-tr-bg-color: var(--admin-card-bg);
  --el-table-row-hover-bg-color: var(--admin-row-hover);
  --el-table-header-bg-color: var(--admin-header-bg);
  --el-table-border-color: var(--admin-card-border);
  --el-table-text-color: var(--w-ink);
  --el-table-header-text-color: var(--admin-header-text);
}
:deep(.admin-table th.el-table__cell) {
  font-family: var(--w-font-serif);
  font-weight: 600;
  letter-spacing: 0.1em;
  font-size: 13px;
  color: var(--admin-header-text);
  background: var(--admin-header-bg) !important;
  border-bottom: 0;
}
:deep(.admin-table td.el-table__cell) {
  font-size: 13.5px;
  padding: 12px 0;
  border-bottom: 1px solid var(--admin-card-border) !important;
}
/* 斑马纹用本地变量替换 Element 默认 */
:deep(.admin-table .el-table__row--striped td.el-table__cell) {
  background: var(--admin-row-stripe) !important;
}
/* 表格圆角时去掉表头底部白线 */
:deep(.admin-table .el-table__header-wrapper),
:deep(.admin-table .el-table__inner-wrapper::before) {
  display: none;
}

.cell-username { color: var(--w-ink); font-weight: 500; }
.cell-self-tag {
  margin-left: 8px;
  font-size: 11px;
  color: var(--w-amber);
  letter-spacing: 0.08em;
}

.cell-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

/* ── 分页 ── */
.admin-pagination {
  display: flex;
  justify-content: center;
  margin-top: var(--w-space-5);
}
:deep(.el-pagination.is-background .el-pager li),
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-card-border);
  border-radius: var(--w-radius-sm);
  color: var(--w-ink-mid);
}
:deep(.el-pagination.is-background .el-pager li:hover) {
  color: var(--w-primary);
  border-color: var(--w-primary);
}
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: var(--w-primary);
  color: #fff;
  border-color: var(--w-primary);
}
:deep(.el-pagination__total),
:deep(.el-pagination__jump) { color: var(--w-ink-mid); }

/* ── el-tag 主题（局部加强：墨绿/暖灰/琥珀三色，全部留在暖色域） ── */
:deep(.el-tag) {
  letter-spacing: 0.04em;
  border-radius: var(--w-radius-full);
  font-weight: 500;
  border: 0;
}
/* 启用：墨绿（互补暖色但低饱和，不刺眼） */
:deep(.el-tag.el-tag--success) {
  background: var(--admin-success-bg);
  color: var(--admin-success);
}
/* 禁用 / 普通用户：暖中性灰 */
:deep(.el-tag.el-tag--info) {
  background: var(--admin-muted-bg);
  color: var(--admin-muted);
}
/* 管理员：站点 amber，提一档明度 */
:deep(.el-tag.el-tag--warning) {
  background: #FBE9C9;
  color: #8A5A1A;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .admin-page { padding: var(--w-space-5) var(--w-space-4) var(--w-space-7); }
  .admin-filter { flex-direction: column; align-items: stretch; }
  .admin-filter__search,
  .admin-filter__select { width: 100%; max-width: 100%; }
}
</style>
