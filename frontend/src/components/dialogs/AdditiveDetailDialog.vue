<template>
  <el-dialog
    v-model="dialogVisible"
    :title="info?.name || '添加剂详情'"
    width="480px"
    destroy-on-close
  >
    <div v-if="loading" class="muted">加载中…</div>
    <div v-else-if="info" class="dialog-body">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="功能类别">
          <el-tag>{{ info.category || '未知' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用范围">{{ info.usageScope || '—' }}</el-descriptions-item>
        <el-descriptions-item label="最大添加量">{{ info.maxDosage || '—' }}</el-descriptions-item>
        <el-descriptions-item label="疾病禁忌">
          <span v-if="info.diseaseContraindication" class="risk">{{ info.diseaseContraindication }}</span>
          <span v-else>—</span>
        </el-descriptions-item>
      </el-descriptions>
      <p v-if="info.description" class="desc">{{ info.description }}</p>
      <p class="ref">参考 GB 2760-2024</p>
    </div>
    <div v-else class="muted">无数据</div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { additiveAPI } from '@/utils/api'

const props = defineProps({
  visible: { type: Boolean, default: false },
  name: { type: String, default: '' },
  /** 直接传入完整 info（来自 classify 结果时使用），有则不再调 API */
  additiveInfo: { type: Object, default: null }
})
const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
})

const fetched = ref(null)
const loading = ref(false)
const info = computed(() => props.additiveInfo || fetched.value)

watch(
  () => [props.visible, props.name, props.additiveInfo],
  async ([vis, name, infoProp]) => {
    if (!vis) return
    if (infoProp) { fetched.value = null; return }
    if (!name) return
    loading.value = true
    fetched.value = null
    try {
      const res = await additiveAPI.getDetail(name)
      if (res.code === 200) fetched.value = res.data
    } catch (e) {
      /* 拦截器已弹错 */
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.dialog-body { padding: 4px 0; }
.muted { color: var(--w-ink-mute); padding: 12px 0; font-size: 13px; }
.desc { margin: 12px 0 6px; padding: 10px 12px; background: var(--w-surface-2); border-left: 3px solid var(--w-amber); border-radius: var(--w-radius-sm); font-size: 13px; line-height: 1.7; color: var(--w-ink-mid); }
.ref { color: var(--w-ink-mute); font-size: 11px; text-align: right; letter-spacing: 0.06em; }
.risk { color: var(--w-terracotta); font-weight: 500; }
</style>
