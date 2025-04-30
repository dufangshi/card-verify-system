<template>
  <div class="app-container">
    <!-- 顶部导航 -->
    <el-menu mode="horizontal" :default-active="activeMenu" class="nav-menu">
      <el-menu-item index="dashboard">后台首页</el-menu-item>
      <el-sub-menu index="management">
        <template #title>管理中心</template>
        <el-menu-item index="program">程序管理</el-menu-item>
        <el-menu-item index="agent">代理管理</el-menu-item>
        <el-menu-item index="user">用户管理</el-menu-item>
        <el-menu-item index="license">卡密管理</el-menu-item>
      </el-sub-menu>
      <!-- 其他菜单项... -->
    </el-menu>

    <!-- 内容区域 -->
    <div class="main-content">
      <!-- 操作工具栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleCreate">
          <el-icon>
            <Plus />
          </el-icon>
          新增单码卡密
        </el-button>
        <el-input v-model="searchKey" placeholder="搜索卡密" style="width: 300px; margin-left: 20px" clearable>
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <!-- 数据表格 -->
      <el-table :data="filteredLicenses" border :fit="false" style="table-layout: auto">
        <el-table-column prop="id" label="ID" width="120" align="center" />
        <el-table-column prop="program" label="程序" width="150" align="center" />
        <el-table-column prop="superior" label="上级" width="120" align="center" />
        <el-table-column prop="category" label="分类" width="100" align="center" />
        <el-table-column prop="licenseKey" label="卡密" :min-width="310" header-align="center">
          <template #default="{ row }">
            <div class="license-container">
              <el-tooltip effect="dark" :content="row.licenseKey" placement="top">
                <span class="license-key">{{ row.licenseKey }}</span>
              </el-tooltip>
              <el-button type="success" size="small" @click="copyToClipboard(row.licenseKey)" class="copy-button">
                复制
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="到期时间" min-width="220" align="center">
          <template #default="{ row }">
            <el-tooltip effect="dark" :content="row.duration" placement="top">
              <span class="duration">{{ row.duration }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="online" label="在线" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'">
              {{ row.online ? "在线" : "离线" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'danger' : 'success'">
              {{ row.status ? "封禁" : "正常" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceCode" label="设备码" min-width="160">
          <template #default="{ row }">
            <el-tooltip effect="dark" :content="row.deviceCode" placement="top">
              <span class="device-code">{{ row.deviceCode }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize"
          @current-change="handlePageChange" />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="currentLicense" label-width="80px">
        <el-form-item label="卡密类型">
          <el-select v-model="currentLicense.category">
            <el-option label="单码卡密" value="single" />
            <el-option label="用户卡密" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker v-model="currentLicense.expiresAt" type="datetime" placeholder="选择到期时间" />
        </el-form-item>
        <el-form-item label="生成数量">
          <el-input-number v-model="currentLicense.quantity" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";

// 定义卡密数据类型
interface License {
  id: string;
  licenseKey: string;
  program: string;
  superior: string;
  category: string;
  expiresAt?: string;
  duration: string;
  online: boolean;
  status: boolean;
  deviceCode: string | null;
  createdAt: string;
  quantity?: number;
}

// 响应式数据
const licenses = ref<License[]>([]); // 存储卡密数据
const pageSize = ref(30); // 每页显示 30 条
const total = ref(0); // 总条数
const currentPage = ref(1); // 当前页码

// 搜索功能
const searchKey = ref("");
const filteredLicenses = computed(() =>
  licenses.value.filter(
    (item) =>
      item.licenseKey.includes(searchKey.value) ||
      (item.deviceCode && item.deviceCode.includes(searchKey.value))
  )
);

// 获取卡密数据
const fetchLicenses = async () => {
  try {
    const response = await axios.get(
      "http://localhost:5013/api/licenses/getAllKey",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        params: {
          page: currentPage.value,
          pageSize: pageSize.value,
        },
      }
    );

    // 解析返回数据
    const { items, total: totalCount } = response.data.data;

    // 映射数据到 License 类型
    licenses.value = items.map((item: any) => ({
      id: 1, //item.key_id,
      licenseKey: item.key_value,
      program: "火星人V2", // 示例数据，可根据实际需求调整
      superior: "开发者", // 示例数据，可根据实际需求调整
      category: "默认", // 示例数据，可根据实际需求调整
      duration: item.created_at,
      online: !!item.machine_code, // 如果 machine_code 存在，则认为在线
      status: item.is_ban,
      deviceCode: item.machine_code,
      createdAt: item.created_at,
    }));

    total.value = totalCount; // 设置总条数
  } catch (error: any) {
    ElMessage.error("数据加载失败");
    //console.error('Error fetching licenses:', error.response?.data?.message);
    if (
      axios.isAxiosError(error) &&
      error.response?.data?.message === "jwt expired"
    ) {
      ElMessage.error("登录已过期，请重新登录");
      localStorage.removeItem("access_token");
      window.location.href = "/login"; // 重定向到登录页面
    }
  }
};

// 分页切换
const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchLicenses(); // 切换页码时重新获取数据
};

// 初始化加载数据
onMounted(() => {
  fetchLicenses();
});

// 导航菜单激活项
const activeMenu = ref("dashboard");

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("新增卡密");
const currentLicense = ref<Partial<License>>({});

const handleCreate = () => {
  currentLicense.value = {
    category: "single",
    quantity: 1,
  };
  dialogTitle.value = "新增卡密";
  dialogVisible.value = true;
};

const handleConfirm = () => {
  // 这里添加实际创建逻辑
  ElMessage.success("操作成功");
  dialogVisible.value = false;
};

const handleEdit = (row: License) => {
  currentLicense.value = { ...row };
  dialogTitle.value = "编辑卡密";
  dialogVisible.value = true;
};

// 辅助函数
const shortenKey = (key: string) => key.substring(0, 6) + "..." + key.slice(-4);
const shortenCode = (code: string) => code.substring(0, 8) + "...";

const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      ElMessage.success("卡密已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败，请重试");
    });
};
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-menu {
  border-bottom: 1px solid #eee;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.license-column .cell {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
}

.license-key,
.device-code,
.duration {
  cursor: pointer;
  color: #409eff;
  white-space: nowrap;
  display: inline-block;
  max-width: 600px;
  /* 设置最大显示宽度 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.license-container {
  display: flex;
  align-items: center;
  /* 垂直居中对齐 */
}

.license-key {
  flex: 1;
  /* 占据剩余空间 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-button {
  margin-left: 10px;
  /* 按钮与卡密之间的间距 */
  height: auto;
  /* 确保按钮高度与卡密一致 */
  line-height: normal;
  /* 修复按钮文字的垂直对齐问题 */
}
</style>
