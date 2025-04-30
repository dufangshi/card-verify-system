<template>
    <div class="license-management">
        <div class="toolbar">
            <el-button type="primary" @click="handleCreate" :icon="Plus">
                新增单码卡密
            </el-button>
            <el-button type="warning" @click="handleBatchDelete" style="margin-left: 12px"
                :disabled="selectedKeys.length === 0" :icon="Delete">
                批量删除
            </el-button>
            <el-button type="info" @click="handleExport" style="margin-left: 12px" :icon="Download"
                :loading="isExporting">
                导出数据
            </el-button>
            <el-input v-model="searchKey" placeholder="搜索卡密或设备码" style="width: 300px; margin-left: auto" clearable
                :prefix-icon="Search" />
        </div>

        <div class="table-wrapper" v-loading="isLoading">
            <el-table :data="filteredLicenses" border style="width: 100%; flex-grow: 1"
                @selection-change="handleSelectionChange" height="0">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column prop="id" label="ID" width="100" align="center" />
                <el-table-column prop="program" label="程序" width="150" align="center" />
                <el-table-column prop="superior" label="上级" width="120" align="center" />
                <el-table-column prop="category" label="分类" width="100" align="center" />
                <el-table-column prop="licenseKey" label="卡密" min-width="310" header-align="center">
                    <template #default="{ row }">
                        <div class="license-container">
                            <el-tooltip effect="dark" :content="row.licenseKey" placement="top">
                                <span class="license-key">{{ row.licenseKey }}</span>
                            </el-tooltip>
                            <el-button type="success" size="small" text bg @click="copyToClipboard(row.licenseKey)"
                                class="copy-button">
                                复制
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" min-width="180" align="center">
                    <template #default="{ row }">
                        <el-tooltip effect="dark" :content="row.createdAt" placement="top">
                            <span class="duration">{{ formatDate(row.createdAt) }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column prop="online" label="在线" width="80" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.online ? 'success' : 'info'">
                            {{ row.online ? "在线" : "离线" }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.status ? 'danger' : 'success'">
                            {{ row.status ? "封禁" : "正常" }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="deviceCode" label="设备码" min-width="160" align="center">
                    <template #default="{ row }">
                        <el-tooltip v-if="row.deviceCode" effect="dark" :content="row.deviceCode" placement="top">
                            <span class="device-code">{{ row.deviceCode }}</span>
                        </el-tooltip>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="customData.info" label="备注" min-width="150" align="center" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ row.customData?.info || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="150" align="center" fixed="right">
                    <template #default="{ row }">
                        <div class="action-buttons">
                            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
                            <el-button size="small" type="danger" @click="handleDelete(row)" style="margin-left: 5px">
                                删除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <el-pagination background layout="total, prev, pager, next, jumper" :total="total" :page-size="pageSize"
                    :current-page="currentPage" @current-change="handlePageChange" />
            </div>
        </div>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="resetDialogForm">
            <el-form :model="currentLicense" label-width="100px" ref="dialogFormRef">
                <el-form-item v-if="!isCreateMode" label="ID">
                    <el-input :value="currentLicense.id" disabled />
                </el-form-item>
                <el-form-item v-if="!isCreateMode" label="卡密">
                    <el-input :value="currentLicense.licenseKey" disabled />
                </el-form-item>

                <el-form-item label="归属程序">
                    <el-radio-group v-model="currentLicense.appId" id="appId">
                        <el-radio :value="1">程序A</el-radio>
                        <el-radio :value="2">程序B</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="卡密时效">
                    <el-radio-group v-model="currentLicense.typeId" id="typeId">
                        <el-radio :value="0">天卡</el-radio>
                        <el-radio :value="1">周卡</el-radio>
                        <el-radio :value="2">月卡</el-radio>
                        <el-radio :value="3">年卡</el-radio>
                        <el-radio :value="4">永久卡</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="生成数量">
                    <el-input-number v-model="currentLicense.quantity" :min="1" id="quantity" />
                </el-form-item>

                <el-form-item label="卡密前缀">
                    <el-input v-model="currentLicense.pattern" placeholder="可选，留空则随机生成" id="pattern" />
                </el-form-item>

                <el-form-item label="卡密备注">
                    <el-input v-model="currentLicense.customData.info" placeholder="请输入备注信息" id="customDataInfo" />
                </el-form-item>

                <el-form-item label="状态" v-if="!isCreateMode">
                    <el-radio-group v-model="currentLicense.status">
                        <el-radio :value="false">正常</el-radio>
                        <el-radio :value="true">封禁</el-radio>
                    </el-radio-group>
                </el-form-item>


            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="isSubmitting" @click="handleConfirm">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { Download, Delete, Plus, Search } from '@element-plus/icons-vue';

// --- 常量定义 ---
const API_BASE_URL = 'http://localhost:5013/api/licenses'; // 后端 API 基础路径
const AUTH_TOKEN_KEY = 'access_token'; // localStorage 中的 token key

// --- 类型定义 ---
interface License {
    id: number; // 修改为 number 类型，如果后端返回的是 number
    licenseKey: string;
    program: string; // 程序名称
    superior: string; // 上级信息
    category: string; // 分类名称
    duration?: string; // 这个字段似乎没在表格中使用，确认是否需要
    online: boolean; // 是否在线
    status: boolean; // 状态：false-正常, true-封禁
    deviceCode: string | null; // 设备码


    createdAt: string; // 创建时间 (从 API 获取)
    customData: { info?: string }; // 自定义数据/备注

    // 仅用于表单的字段
    appId?: number; // 程序 ID (用于创建)
    typeId?: number; // 卡密类型 ID (用于创建)
    quantity?: number; // 生成数量 (用于创建)
    pattern?: string; // 卡密前缀 (用于创建)
}

// --- API 服务 ---
const apiService = {
    // 获取认证 Headers
    getAuthHeaders: () => ({
        Authorization: `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}`,
    }),

    // 处理 API 错误
    handleApiError: (error: any, defaultMessage: string) => {
        console.error(`${defaultMessage}失败:`, error);
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ message?: string; data?: any }>;
            const responseData = axiosError.response?.data;
            const message = responseData?.message || axiosError.message;

            // 特殊处理 Token 过期或无效
            if (message === 'jwt expired' || message === 'jwt malformed' || axiosError.response?.status === 401) {
                ElMessage.error('登录已过期或无效，请重新登录');
                localStorage.removeItem(AUTH_TOKEN_KEY);
                // 跳转到登录页，根据项目路由配置修改
                window.location.href = '/login';
                return; // 阻止后续默认提示
            }
            // 显示后端返回的错误信息或 Axios 错误信息
            ElMessage.error(responseData?.data || message || defaultMessage + '失败');
        } else {
            ElMessage.error(defaultMessage + '失败');
        }
    },

    // 获取卡密列表
    fetchLicenses: async (page: number, pageSize: number) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/getAllKey`, {
                headers: apiService.getAuthHeaders(),
                params: { page, pageSize },
            });
            //console.log('获取卡密列表数据:', response.data); // 调试输出
            //假设后端返回的数据结构是 { code: number, message: string, data: { items: [], total: number } }
            if (response.data && response.data.data) {
                const { items, total } = response.data.data;
                // 转换数据结构以匹配前端 License 接口
                const mappedItems: License[] = items.map((item: any) => ({
                    id: 1,//item.key_id, // 使用 key_id 作为 id
                    licenseKey: item.key_value,
                    program: item.app?.name || "未知程序", // 假设关联了 app 对象并有 name 字段
                    superior: item.user?.username || "开发者", // 假设关联了 user 对象并有 username 字段
                    category: item.type?.name || "默认", // 假设关联了 type 对象并有 name 字段
                    online: !!item.machine_code, // 根据 machine_code 判断是否在线
                    status: item.is_ban, // is_ban 为 true 表示封禁
                    deviceCode: item.machine_code || null, // 设备码
                    createdAt: item.created_at, // 创建时间
                    customData: { info: item.custom_data?.info || '' } // 备注信息
                }));
                return { items: mappedItems, total };


            } else {
                throw new Error(response.data?.message || '获取卡密列表结构错误');
            }
        } catch (error) {
            console.error('获取卡密列表失败:', error);
            apiService.handleApiError(error, '获取卡密列表');
            return { items: [], total: 0 }; // 出错时返回空数据
        }
    },

    // 创建卡密
    createLicense: async (data: Partial<License>) => {
        try {
            const payload = {
                pattern: data.pattern || undefined, // 如果为空字符串，则不传或传 undefined，根据后端要求调整
                appId: data.appId,
                typeId: data.typeId,
                quantity: data.quantity,
                customData: { info: data.customData?.info || '' },
            };
            console.log('创建卡密请求数据:', payload); // 调试输出
            const response = await axios.post(`${API_BASE_URL}/create`, payload, {
                headers: apiService.getAuthHeaders(),
            });
            if (response.data && response.data.status === "success") {
                ElMessage.success('卡密创建成功');
                return true;
            } else {
                throw new Error(response.data?.message || '创建卡密失败');
            }
        } catch (error) {
            apiService.handleApiError(error, '创建卡密');
            return false;
        }
    },

    // 更新卡密 (编辑)
    updateLicense: async (keyId: number, data: Partial<License>) => {
        try {
            const payload = {
                keyId: keyId,
                isBan: data.status, // 更新封禁状态
                machineCode: data.deviceCode || '', // 更新设备码，空字符串表示解绑
                customData: { info: data.customData?.info || '' } // 更新备注
            };
            const response = await axios.put(`${API_BASE_URL}/update`, payload, { // 假设更新使用 PUT 方法
                headers: apiService.getAuthHeaders(),
            });
            if (response.data && response.data.status === "success") {
                ElMessage.success('卡密更新成功');
                return true;
            } else {
                throw new Error(response.data?.message || '更新卡密失败');
            }
        } catch (error) {
            apiService.handleApiError(error, '更新卡密');
            return false;
        }
    },


    // 删除卡密 (单条或批量)
    deleteLicenses: async (licenseKeys: string[]) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/delete`, { licenseKeys }, {
                headers: apiService.getAuthHeaders(),
            });
            if (response.data && response.data.status === "success") {
                ElMessage.success(response.data.data || '删除成功'); // 显示后端返回的成功信息
                return true;
            } else {
                throw new Error(response.data?.message || '删除失败');
            }
        } catch (error) {
            apiService.handleApiError(error, '删除卡密');
            return false;
        }
    },

    // 导出数据
    exportLicenses: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/export`, { // 假设导出接口是 /export
                responseType: 'blob', // 重要：指定响应类型为 blob
                headers: apiService.getAuthHeaders(),
            });

            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // 从 Content-Disposition 头获取文件名，如果存在的话
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'licenses.csv'; // 默认文件名
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // 清理
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            ElMessage.success('导出成功');
        } catch (error) {
            apiService.handleApiError(error, '导出数据');
        }
    }
};

// --- 组件状态 ---
const licenses = ref<License[]>([]); // 卡密列表数据
const pageSize = ref(100); // 每页显示数量
const total = ref(0); // 总条数
const currentPage = ref(1); // 当前页码
const searchKey = ref(""); // 搜索关键字
const selectedKeys = ref<string[]>([]); // 表格中选中的卡密 key (用于批量删除)
const isLoading = ref(false); // 表格加载状态
const isExporting = ref(false); // 导出加载状态
const isSubmitting = ref(false); // 对话框提交状态 (创建/编辑)
const dialogVisible = ref(false); // 对话框可见性
const dialogTitle = ref("新增卡密"); // 对话框标题
const isCreateMode = ref(true); // 是否为新增模式
const dialogFormRef = ref<FormInstance>(); // 对话框表单引用

// 对话框绑定的当前卡密数据 (使用 reactive 以便深层监听)
const currentLicense = reactive<Partial<License>>({
    id: undefined,
    licenseKey: '',
    program: '',
    superior: '',
    category: '',
    online: false,
    status: false, // 默认正常
    deviceCode: null,
    createdAt: '',
    customData: { info: '' },
    // --- 新增时需要的字段 ---
    appId: 1, // 默认选择程序A (根据实际情况调整)
    typeId: 0, // 默认选择天卡 (根据实际情况调整)
    quantity: 1, // 默认生成数量为1
    pattern: '', // 卡密前缀
});


// --- 计算属性 ---
// 根据搜索关键字过滤卡密列表
const filteredLicenses = computed(() => {
    const sk = searchKey.value.trim().toLowerCase();
    if (!sk) {
        return licenses.value; // 没有搜索关键字则返回全部
    }
    return licenses.value.filter(
        (item) =>
            item.licenseKey.toLowerCase().includes(sk) ||
            (item.deviceCode && item.deviceCode.toLowerCase().includes(sk))
        // 可以根据需要添加其他搜索字段，如备注 item.customData?.info?.toLowerCase().includes(sk)
    );
});

// --- 方法 ---

// 获取卡密数据
const loadLicenses = async () => {
    isLoading.value = true;
    const { items, total: totalCount } = await apiService.fetchLicenses(currentPage.value, pageSize.value);
    licenses.value = items;
    total.value = totalCount;
    isLoading.value = false;
};

// 页码改变处理
const handlePageChange = (page: number) => {
    currentPage.value = page;
    loadLicenses();
};

// 表格选择项改变处理
const handleSelectionChange = (selection: License[]) => {
    // 获取选中行的 licenseKey 列表
    selectedKeys.value = selection.map(item => item.licenseKey);
};

// 导出数据处理
const handleExport = async () => {
    isExporting.value = true;
    await apiService.exportLicenses();
    isExporting.value = false;
};

// 日期格式化 (使用 dayjs)
const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 重置对话框表单
const resetDialogForm = () => {
    // 使用 Object.assign 重置对象，保留响应性
    Object.assign(currentLicense, {
        id: undefined,
        licenseKey: '',
        program: '',
        superior: '',
        category: '',
        online: false,
        status: false,
        deviceCode: null,
        createdAt: '',
        customData: { info: '' },
        appId: 1,
        typeId: 0,
        quantity: 1,
        pattern: '',
    });
    // 重置 Element Plus 表单的校验状态 (如果添加了校验规则)
    nextTick(() => {
        dialogFormRef.value?.clearValidate();
    });
};

// 处理新增按钮点击
const handleCreate = () => {
    isCreateMode.value = true;
    dialogTitle.value = '新增卡密';
    resetDialogForm(); // 重置表单
    dialogVisible.value = true;
};

// 处理编辑按钮点击
const handleEdit = (row: License) => {
    isCreateMode.value = false;
    dialogTitle.value = '编辑卡密';
    // 使用 Object.assign 将行数据深拷贝到 currentLicense，避免直接修改原始数据
    Object.assign(currentLicense, JSON.parse(JSON.stringify(row)));
    // 确保 customData 存在且是对象
    if (!currentLicense.customData) {
        currentLicense.customData = { info: '' };
    }
    dialogVisible.value = true;
};

// 处理对话框确认按钮点击 (新增/编辑)
const handleConfirm = async () => {
    if (isSubmitting.value) return; // 防止重复提交
    isSubmitting.value = true;

    let success = false;
    if (isCreateMode.value) {
        // 新增模式
        success = await apiService.createLicense(currentLicense);
    } else {
        // 编辑模式
        if (currentLicense.id) {
            success = await apiService.updateLicense(currentLicense.id, currentLicense);
        } else {
            ElMessage.error('无法编辑：缺少卡密ID');
        }
    }

    isSubmitting.value = false;

    if (success) {
        dialogVisible.value = false; // 关闭对话框
        await loadLicenses(); // 刷新列表
    }
};

// 处理单条删除按钮点击
const handleDelete = (row: License) => {
    ElMessageBox.confirm(
        `确定要删除卡密 "${row.licenseKey}" 吗？此操作不可恢复。`,
        '警告',
        {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        // 用户确认删除
        const success = await apiService.deleteLicenses([row.licenseKey]);
        if (success) {
            await loadLicenses(); // 刷新列表
        }
    }).catch(() => {
        // 用户取消删除
        ElMessage.info('已取消删除');
    });
};

// 处理批量删除按钮点击
const handleBatchDelete = () => {
    if (selectedKeys.value.length === 0) {
        ElMessage.warning('请先选择要删除的卡密');
        return;
    }
    ElMessageBox.confirm(
        `确定要删除选中的 ${selectedKeys.value.length} 条卡密吗？此操作不可恢复。`,
        '警告',
        {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        // 用户确认删除
        const success = await apiService.deleteLicenses(selectedKeys.value);
        if (success) {
            selectedKeys.value = []; // 清空选择
            await loadLicenses(); // 刷新列表
        }
    }).catch(() => {
        // 用户取消删除
        ElMessage.info('已取消批量删除');
    });
};

// 复制卡密到剪贴板
const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
        .then(() => ElMessage.success("卡密已复制到剪贴板"))
        .catch((err) => {
            console.error('复制失败:', err);
            ElMessage.error("复制失败，请检查浏览器权限或手动复制");
        });
};

// --- 生命周期钩子 ---
// 组件挂载后加载初始数据
onMounted(() => {
    loadLicenses();
});
</script>

<style scoped>
.license-management {
    padding: 20px;
    background-color: #f5f7fa;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 40px);
    /* 减去 padding 的高度，使内容充满视口 */
}

.toolbar {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    /* 防止工具栏在 flex 布局中被压缩 */
}

.table-wrapper {
    flex-grow: 1;
    /* 使表格区域占据剩余空间 */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* 隐藏内部溢出 */
    background-color: #fff;
    /* 添加背景色 */
    border-radius: 4px;
    /* 添加圆角 */
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
    /* 添加阴影 */
    padding: 15px;
    /* 添加内边距 */
}

.el-table {
    /* height: 0 使得表格高度能自适应 flex 容器 */
    /* style="width: 100%; flex-grow: 1" height="0" 已移到 template 中 */
}


.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
    /* 防止分页器在 flex 布局中被压缩 */
}

.license-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    /* 让复制按钮靠右 */
}

.license-key {
    /* flex: 1; */
    /* 不再需要 flex: 1 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #409eff;
    cursor: pointer;
    margin-right: 10px;
    /* 与复制按钮保持距离 */
}

.copy-button {
    /* margin-left: 10px; */
    /* 不再需要 margin-left */
}

.device-code,
.duration {
    /* duration 类似乎没用了，但保留样式以防万一 */
    color: #606266;
    /* 调整颜色 */
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* max-width: 150px; */
    /* 移除最大宽度限制，交给表格列宽控制 */
    display: inline-block;
}

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    /* 按钮居中 */
}

/* 微调对话框内元素间距 */
.el-form-item {
    margin-bottom: 18px;
}

.el-radio {
    margin-right: 15px;
    /* 调整单选按钮间距 */
}
</style>
