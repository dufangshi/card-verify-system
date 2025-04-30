<template>
  <div class="app-container">
    <el-aside width="220px" class="sidebar">
      <!-- 添加标题区域 -->
      <div class="sidebar-header">
        DSF网络验证
      </div>

      <el-menu :default-active="$route.path" router class="vertical-menu">
        <!-- 后台首页 -->
        <el-menu-item index="/">
          <el-icon>
            <House />
          </el-icon>
          <span>后台首页</span>
        </el-menu-item>

        <!-- 卡密管理分组 -->
        <el-sub-menu index="/licenses">
          <template #title>
            <el-icon>
              <Key />
            </el-icon>
            <span>卡密管理</span>
          </template>
          <el-menu-item index="/licenses">卡密列表</el-menu-item>
          <!-- 可以添加更多子菜单 -->
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <div class="main-container">
      <router-view></router-view> <!-- 这里显示子路由内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { House, Key } from '@element-plus/icons-vue'
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden; /* 禁止全局滚动 */
}

.sidebar {
  flex: 0 0 220px; /* 固定宽度 */
  background: #fff;
  box-shadow: 2px 0 6px rgba(0,0,0,.1);
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 禁止内容溢出 */
  background: #f5f7fa;
  
}

.sidebar-header {
  height: 60px; /* 设置标题区域高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px; /* 设置字体大小 */
  font-weight: bold; /* 设置字体加粗 */
  color: #000000; /* 设置字体颜色 */
  background: linear-gradient(90deg, #cdd3d8, #cdd3d8); /* 设置背景渐变色 */
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
}
</style>