import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/login', // 新增登录路由
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'DFS网络验证 - 登录' } // 添加路由元信息
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/HomeView.vue'),
        meta: { title: 'DFS网络验证 - 主页' }
      },
      {
        path: '/licenses',
        name: 'LicensesManagement',
        component: () => import('../views/LicenseManagement.vue'),
        meta: { title: 'DFS网络验证 - 卡密管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  return true
})

export default router