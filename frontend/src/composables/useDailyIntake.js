import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 每日营养摄入管理组合式函数
 * 负责管理当日的钠、糖、能量摄入数据，支持跨天重置
 */
export const useDailyIntake = () => {
  // 状态
  const dailyIntake = ref({
    sodium: 0,
    sugar: 0,
    energy: 0,
    date: ''
  })
  
  const loading = ref(false)

  // 常量定义
  const DEFAULT_GOALS = {
    sodium: 2000,
    sugar: 50,
    energy: 2000
  }

  // 计算属性
  const today = computed(() => new Date().toDateString())
  
  const isToday = computed(() => dailyIntake.value.date === today.value)
  
  const progress = computed(() => {
    return {
      sodium: Math.min((dailyIntake.value.sodium / DEFAULT_GOALS.sodium) * 100, 100),
      sugar: Math.min((dailyIntake.value.sugar / DEFAULT_GOALS.sugar) * 100, 100),
      energy: Math.min((dailyIntake.value.energy / DEFAULT_GOALS.energy) * 100, 100)
    }
  })
  
  const exceeded = computed(() => {
    return {
      sodium: dailyIntake.value.sodium > DEFAULT_GOALS.sodium,
      sugar: dailyIntake.value.sugar > DEFAULT_GOALS.sugar,
      energy: dailyIntake.value.energy > DEFAULT_GOALS.energy
    }
  })

  // 方法
  const init = () => {
    try {
      const stored = localStorage.getItem('dailyIntake')
      
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // 检查是否是今天的数据
        if (parsed.date === today.value) {
          dailyIntake.value = parsed
        } else {
          // 跨天重置
          reset()
        }
      } else {
        // 首次初始化
        reset()
      }
      
    } catch (error) {
      console.error('初始化每日摄入失败:', error)
      reset()
    }
  }

  const addIntake = (sodium, sugar, energy) => {
    try {
      // 检查是否需要重置
      if (!isToday.value) {
        reset()
      }
      
      // 累加摄入
      dailyIntake.value.sodium += sodium
      dailyIntake.value.sugar += sugar
      dailyIntake.value.energy += energy
      
      // 保存到本地存储
      saveToStorage()
      
      // 检查是否超过目标值
      checkExceededWarning()
      
      return dailyIntake.value
      
    } catch (error) {
      console.error('添加营养摄入失败:', error)
      throw error
    }
  }

  const reset = () => {
    dailyIntake.value = {
      sodium: 0,
      sugar: 0,
      energy: 0,
      date: today.value
    }
    saveToStorage()
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem('dailyIntake', JSON.stringify(dailyIntake.value))
    } catch (error) {
      console.error('保存每日摄入到本地存储失败:', error)
    }
  }

  const checkExceededWarning = () => {
    const goals = DEFAULT_GOALS
    const intake = dailyIntake.value
    
    const warnings = []
    
    if (intake.sodium > goals.sodium) {
      warnings.push(`钠摄入已超过目标值 ${intake.sodium}mg/${goals.sodium}mg`)
    }
    
    if (intake.sugar > goals.sugar) {
      warnings.push(`糖摄入已超过目标值 ${intake.sugar}g/${goals.sugar}g`)
    }
    
    if (intake.energy > goals.energy) {
      warnings.push(`能量摄入已超过目标值 ${intake.energy}kcal/${goals.energy}kcal`)
    }
    
    if (warnings.length > 0) {
      ElMessage.warning({
        message: warnings.join('，'),
        duration: 5000
      })
    }
  }

  const getIntake = () => {
    return { ...dailyIntake.value }
  }

  const getProgress = () => {
    return { ...progress.value }
  }

  const getExceeded = () => {
    return { ...exceeded.value }
  }

  const clearAll = () => {
    localStorage.removeItem('dailyIntake')
    reset()
    ElMessage.success('已清除所有摄入记录')
  }

  // 导出
  return {
    // State
    dailyIntake: computed(() => dailyIntake.value),
    loading: computed(() => loading.value),
    
    // Computed
    today,
    isToday,
    progress,
    exceeded,
    
    // Methods
    init,
    addIntake,
    reset,
    getIntake,
    getProgress,
    getExceeded,
    clearAll
  }
}

// 默认导出
const useDailyIntakeDefault = useDailyIntake
export default useDailyIntakeDefault