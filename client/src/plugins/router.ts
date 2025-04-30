import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/user',
      name: 'UserMenu',
      component: () => import('../views/UserMenu.vue'),
      meta: {
        title: 'DFS网络验证 - 主页'
      }
    },
    {
      path: '/login',
      name: 'LoginMenu',
      component: () => import('../views/LoginView.vue'),
      meta: {
        title: 'DFS网络验证 - 登录'
      }
    }
  ]
})

router.beforeEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  return true
})

export default router