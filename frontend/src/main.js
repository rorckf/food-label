import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 全局样式
import './styles/variables.css'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 配置axios
axios.defaults.baseURL = ''

// 响应拦截
axios.interceptors.response.use(
    response => response.data,
    error => {
        return Promise.reject(error)
    }
)

app.config.globalProperties.$axios = axios
app.use(ElementPlus)
app.use(pinia)
app.use(router)
app.mount('#app')