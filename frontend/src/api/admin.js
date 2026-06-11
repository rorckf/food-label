import { api } from '@/utils/api'

/**
 * 后台管理 API（UC-8）
 * 复用 utils/api.js 中的 axios 实例 —— 自动附带 Authorization 头、统一处理 401
 */
export const adminAPI = {
  /**
   * 用户列表
   * @param {Object} params
   * @param {number} params.page    第几页，1 起
   * @param {number} params.size    每页大小
   * @param {string} params.keyword 用户名模糊关键字
   * @param {'all'|'enabled'|'disabled'} params.status 状态筛选
   */
  listUsers: (params) => api.get('/admin/users', { params }),

  /** 切换账号启停状态 */
  toggleStatus: (id) => api.put(`/admin/users/${id}/status`),

  /** 删除账号 */
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
}
