import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userAPI, scanAPI, historyAPI, nutritionAPI } from '@/utils/api.js'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref({
    nickname: '',
    phone: '',
    avatar: '',
    createdAt: '',
    allergies: [],
    chronicDiseases: [],
    nutritionGoals: {
      sodium: 2000,
      sugar: 50,
      energy: 2000
    }
  })
  
  const monthlyIntake = ref({
    sodium: 0,
    sugar: 0,
    energy: 0,
    yearMonth: ''
  })
  
  const dailyIntake = ref({
    sodium: 0,
    sugar: 0,
    energy: 0,
    date: ''
  })
  
  const loading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  
  const dailyGoalProgress = computed(() => {
    const goals = userInfo.value.nutritionGoals
    const intake = dailyIntake.value
    
    return {
      sodium: Math.min((intake.sodium / goals.sodium) * 100, 100),
      sugar: Math.min((intake.sugar / goals.sugar) * 100, 100),
      energy: Math.min((intake.energy / goals.energy) * 100, 100)
    }
  })
  
  const monthlyGoalProgress = computed(() => {
    const goals = userInfo.value.nutritionGoals
    const intake = monthlyIntake.value
    
    // 按30天估算月目标（简化处理）
    const monthlyGoals = {
      sodium: goals.sodium * 30,
      sugar: goals.sugar * 30,
      energy: goals.energy * 30
    }
    
    return {
      sodium: Math.min((intake.sodium / monthlyGoals.sodium) * 100, 100),
      sugar: Math.min((intake.sugar / monthlyGoals.sugar) * 100, 100),
      energy: Math.min((intake.energy / monthlyGoals.energy) * 100, 100)
    }
  })

  // Actions
  const login = async (username, password) => {
    try {
      loading.value = true
      
      const response = await userAPI.login({ username, password })

      // JWT：服务端返回 token，axios 拦截器自动附 Bearer
      const jwt = response?.data?.token
      if (!jwt) {
        throw new Error(response?.message || '登录失败：未返回 token')
      }
      token.value = jwt
      localStorage.setItem('token', jwt)
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      // 获取用户信息
      await fetchUserInfo()
      
      // 获取营养摄入数据
      await fetchMonthlyIntake()
      await initDailyIntake()
      
      ElMessage.success('登录成功')
      return response
      
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const register = async (data) => {
    try {
      loading.value = true
      
      const response = await userAPI.register(data)
      
      // 注册成功后自动登录
      await login(data.phone, data.password)
      
      ElMessage.success('注册成功')
      return response
      
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {
      nickname: '',
      phone: '',
      avatar: '',
      createdAt: '',
      allergies: [],
      chronicDiseases: [],
      nutritionGoals: {
        sodium: 2000,
        sugar: 50,
        energy: 2000
      }
    }
    monthlyIntake.value = {
      sodium: 0,
      sugar: 0,
      energy: 0,
      yearMonth: ''
    }
    dailyIntake.value = {
      sodium: 0,
      sugar: 0,
      energy: 0,
      date: ''
    }
    
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('dailyIntake')
    
    ElMessage.success('已退出登录')
  }

  const fetchUserInfo = async () => {
    try {
      // 模拟数据，实际使用时调用 API
      const mockData = {
        nickname: '食标签用户',
        phone: '138****8888',
        avatar: '',
        createdAt: '2026-04-01',
        allergies: ['peanut', 'seafood'],
        chronicDiseases: ['hypertension'],
        nutritionGoals: {
          sodium: 1800,
          sugar: 45,
          energy: 2200
        }
      }
      
      // 实际使用时替换为：
      // const response = await userAPI.getProfile()
      // userInfo.value = response.data
      
      userInfo.value = mockData
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  const updateUserProfile = async (data) => {
    try {
      loading.value = true
      
      // 更新本地状态
      Object.assign(userInfo.value, data)
      
      // 实际使用时调用 API
      // await userAPI.updateProfile(data)
      
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      
      ElMessage.success('更新成功')
      
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const uploadAvatar = async (file) => {
    try {
      // 实际使用时调用 API
      // const response = await userAPI.uploadAvatar(file)
      // userInfo.value.avatar = response.data.avatarUrl
      
      // 模拟上传成功
      const mockAvatarUrl = URL.createObjectURL(file)
      userInfo.value.avatar = mockAvatarUrl
      
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      
      ElMessage.success('头像上传成功')
      
    } catch (error) {
      console.error('头像上传失败:', error)
      throw error
    }
  }

  const fetchMonthlyIntake = async (yearMonth = null) => {
    try {
      // 模拟数据，实际使用时调用 API
      const currentDate = new Date()
      const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      
      const mockData = {
        sodium: 4500,
        sugar: 120,
        energy: 8500,
        yearMonth: currentYearMonth
      }
      
      // 实际使用时替换为：
      // const response = await nutritionAPI.getMonthlyIntake(yearMonth)
      // monthlyIntake.value = response.data
      
      monthlyIntake.value = mockData
      
    } catch (error) {
      console.error('获取月度摄入数据失败:', error)
      throw error
    }
  }

  const addIntake = async (sodium, sugar, energy, productId = null) => {
    try {
      // 更新月度摄入
      monthlyIntake.value.sodium += sodium
      monthlyIntake.value.sugar += sugar
      monthlyIntake.value.energy += energy
      
      // 更新每日摄入
      await updateDailyIntake(sodium, sugar, energy)
      
      // 实际使用时调用 API
      // await nutritionAPI.addIntake({ sodium, sugar, energy, productId })
      
    } catch (error) {
      console.error('添加营养摄入失败:', error)
      throw error
    }
  }

  const initDailyIntake = () => {
    try {
      const today = new Date().toDateString()
      const stored = localStorage.getItem('dailyIntake')
      
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // 检查是否是今天的数据
        if (parsed.date === today) {
          dailyIntake.value = parsed
        } else {
          // 跨天重置
          dailyIntake.value = {
            sodium: 0,
            sugar: 0,
            energy: 0,
            date: today
          }
          localStorage.setItem('dailyIntake', JSON.stringify(dailyIntake.value))
        }
      } else {
        // 首次初始化
        dailyIntake.value = {
          sodium: 0,
          sugar: 0,
          energy: 0,
          date: today
        }
        localStorage.setItem('dailyIntake', JSON.stringify(dailyIntake.value))
      }
      
    } catch (error) {
      console.error('初始化每日摄入失败:', error)
    }
  }

  const updateDailyIntake = (sodium, sugar, energy) => {
    try {
      const today = new Date().toDateString()
      
      // 检查是否需要重置
      if (dailyIntake.value.date !== today) {
        dailyIntake.value = {
          sodium: 0,
          sugar: 0,
          energy: 0,
          date: today
        }
      }
      
      // 累加摄入
      dailyIntake.value.sodium += sodium
      dailyIntake.value.sugar += sugar
      dailyIntake.value.energy += energy
      
      // 保存到本地存储
      localStorage.setItem('dailyIntake', JSON.stringify(dailyIntake.value))
      
    } catch (error) {
      console.error('更新每日摄入失败:', error)
    }
  }

  const resetDailyIntake = () => {
    const today = new Date().toDateString()
    dailyIntake.value = {
      sodium: 0,
      sugar: 0,
      energy: 0,
      date: today
    }
    localStorage.setItem('dailyIntake', JSON.stringify(dailyIntake.value))
  }

  // 初始化时从本地存储恢复数据
  const initFromStorage = () => {
    try {
      const storedUserInfo = localStorage.getItem('userInfo')
      if (storedUserInfo) {
        userInfo.value = JSON.parse(storedUserInfo)
      }
      
      initDailyIntake()
      
    } catch (error) {
      console.error('从本地存储初始化失败:', error)
    }
  }

  return {
    // State
    token,
    userInfo,
    monthlyIntake,
    dailyIntake,
    loading,
    
    // Getters
    isLoggedIn,
    dailyGoalProgress,
    monthlyGoalProgress,
    
    // Actions
    login,
    register,
    logout,
    fetchUserInfo,
    updateUserProfile,
    uploadAvatar,
    fetchMonthlyIntake,
    addIntake,
    initDailyIntake,
    updateDailyIntake,
    resetDailyIntake,
    initFromStorage
  }
})