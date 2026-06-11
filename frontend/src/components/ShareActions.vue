<template>
  <el-dropdown trigger="click" @command="run">
    <button class="share-btn" :disabled="busy">
      <Share2 :size="14" />
      {{ busy ? '处理中…' : '导出 / 分享' }}
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="image">
          <ImageDown :size="14" /> 保存为图片
        </el-dropdown-item>
        <el-dropdown-item command="text">
          <Copy :size="14" /> 复制文案摘要
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { Share2, ImageDown, Copy } from 'lucide-vue-next'

const props = defineProps({
  /** 完整识读结果，用于生成文案 */
  result: { type: Object, default: null },
  /** 返回 DOM 元素的函数，html2canvas 截图目标 */
  getTarget: { type: Function, required: true }
})

const busy = ref(false)

const run = (cmd) => {
  if (cmd === 'image') saveImage()
  else if (cmd === 'text') copyText()
}

/**
 * 行业标准做法（Playwright / Puppeteer）：在截图前向 document.head 注入一段
 * 全局样式，强制把所有动画 / 过渡 / 变换 / 滤镜全部置零，再触发一次回流，
 * 等到下一帧后再截图，这样可以保证拿到的是最终稳定态。
 * 截图完成后必须把这段样式移除，避免影响正常 UI。
 */
const injectFreezeStyle = () => {
  const style = document.createElement('style')
  style.setAttribute('data-screenshot-freeze', 'true')
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      animation-play-state: paused !important;
      transition: none !important;
      transform: none !important;
      opacity: 1 !important;
      filter: none !important;
      backdrop-filter: none !important;
      caret-color: transparent !important;
    }
  `
  document.head.appendChild(style)
  return style
}

const saveImage = async () => {
  const el = props.getTarget?.()
  if (!el) {
    ElMessage.warning('未找到截图区域')
    return
  }
  busy.value = true

  let freezeStyle = null
  try {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready } catch (_) { /* ignore */ }
    }

    // 1) 注入冻结样式 → 2) 强制 reflow → 3) 等两个 RAF 让浏览器完成绘制
    freezeStyle = injectFreezeStyle()
    void el.getBoundingClientRect()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const canvas = await html2canvas(el, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: '#FFFBF2',
      logging: false,
      // 双保险：克隆树上同样禁用动画 / 过渡 / 变换
      onclone: (doc) => {
        const css = doc.createElement('style')
        css.textContent = `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
            filter: none !important;
            backdrop-filter: none !important;
          }
          canvas { transform: none !important; }
        `
        doc.head.appendChild(css)
      },
    })
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    const name = props.result?.productName || '食品标签'
    const time = new Date().toISOString().slice(0, 10)
    a.download = `食品标签解读_${name}_${time}.png`
    a.href = url
    a.click()
    ElMessage.success('图片已保存')
  } catch (e) {
    console.error(e)
    ElMessage.error('图片生成失败，请重试')
  } finally {
    if (freezeStyle && freezeStyle.parentNode) freezeStyle.parentNode.removeChild(freezeStyle)
    busy.value = false
  }
}

const copyText = async () => {
  const r = props.result
  if (!r) {
    ElMessage.warning('暂无可复制的内容')
    return
  }
  const nut = r.nutrition || {}
  const tipsArr = r.healthTips || []
  const nrvTips = tipsArr.filter((t) => t.percentage != null).slice(0, 3).map((t) => `${t.name}${t.level}`).join('、')
  const riskTips = tipsArr.filter((t) => t.percentage == null).slice(0, 2).map((t) => t.text).join('；')
  const adds = (r.additives || []).slice(0, 3).map((a) => a.name || a).join('、')
                || (r.additiveMap ? Object.keys(r.additiveMap).slice(0, 3).join('、') : '')
                || '无'

  const lines = [
    `【食品标签解读】${r.productName || '未知产品'}${r.netContent ? '（' + r.netContent + '）' : ''}`,
    `· 能量 ${nut.energy ?? 0} kcal/100g  · 蛋白质 ${nut.protein ?? 0} g`,
    `· 脂肪 ${nut.fat ?? 0} g  · 碳水 ${nut.carbohydrate ?? nut.carb ?? 0} g  · 钠 ${nut.sodium ?? 0} mg`,
    `· 添加剂：${adds}`,
    nrvTips ? `· 营养评级：${nrvTips}` : '',
    riskTips ? `· 风险提示：${riskTips}` : '',
    `—— 食安慧眼`
  ].filter(Boolean)

  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    ElMessage.success('文案已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.share-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px;
  background: var(--w-primary); color: #FFFBF2;
  border: 0; border-radius: var(--w-radius-full);
  font-size: 12.5px; letter-spacing: 0.08em;
  cursor: pointer; transition: all 0.18s var(--w-ease);
  box-shadow: var(--w-shadow-sm);
}
.share-btn:hover:not(:disabled) {
  background: var(--w-primary-hover);
  transform: translateY(-1px);
}
.share-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
