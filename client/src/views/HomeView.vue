<template>
  <div class="home-content">
    <h2>系统概览</h2>
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>统计信息</span>
        </div>
      </template>
      <div class="stats">
        <el-statistic title="总卡密数" :value="totalLicenses" />
        <el-statistic title="在线设备" :value="onlineCount" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
//import { useLicenseStore } from '@/stores/license' // 如果使用Pinia

// 示例数据，实际应从store或API获取
const totalLicenses = ref(0)
const onlineCount = ref(0)
</script>

<style scoped>
.home-content {
  padding: 20px;
  background-color: #f5f7fa;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}
</style>