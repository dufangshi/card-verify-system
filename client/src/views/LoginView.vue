<template>
    <div class="login-container">
      <div class="login-box">
        <div class="login-header">
          <h2>系统登录</h2>
        </div>
  
        <el-form 
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-width="0"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              prefix-icon="User"
              placeholder="请输入用户名"
              clearable
            />
          </el-form-item>
  
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              prefix-icon="Lock"
              placeholder="请输入密码"
              show-password
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>
  
          <el-form-item class="remember-item">
            <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
            <el-link type="primary" :underline="false" class="forgot-password">
              忘记密码?
            </el-link>
          </el-form-item>
  
          <el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
      import { ref, reactive, onMounted } from 'vue'
      import { useRouter } from 'vue-router'
      import { ElMessage } from 'element-plus'
      import type { FormInstance } from 'element-plus'
      import axios from '../utils/request' // 导入封装好的axios实例
      import type { APIResponse } from '../types/api' // 导入接口类型定义
      
      // 定义 LoginResponseData 类型
      interface LoginResponseData {
        token: string
        username: string
        userId: string
      }

  
  // 表单数据类型
  interface LoginForm {
    username: string
    password: string
    remember: boolean
  }
  // 响应式数据
  const router = useRouter()
  // 响应式数据
  const loginForm = reactive<LoginForm>({
    username: '',
    password: '',
    remember: false
  })
  
  const loginFormRef = ref<FormInstance>()
  const loading = ref(false)
  
  // 验证规则
  const loginRules = reactive({
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 12, message: '长度在 3 到 12 个字符', trigger: 'blur' }
    ],
    // password: [
    //   { required: true, message: '请输入密码', trigger: 'blur' },
    //   { min: 6, max: 18, message: '长度在 6 到 18 个字符', trigger: 'blur' }
    // ]
  })
  
  // 初始化时读取保存的账号密码
  onMounted(() => {
    const rememberInfo = localStorage.getItem('loginInfo')
    if (rememberInfo) {
      const { username, password } = JSON.parse(rememberInfo)
      loginForm.username = username
      loginForm.password = password
      loginForm.remember = true
    }
  })
  
  // 登录处理
  const handleLogin = async () => {
  if (!loginFormRef.value) return
  const valid = await loginFormRef.value.validate()
  if (!valid) return

  try {
    loading.value = true
    
    // 发送登录请求
    const response = await axios.post<APIResponse<LoginResponseData>>('/user/login', {
      username: loginForm.username,
      password: loginForm.password
    });

    const { token, username, userId } = response.data;
    



    localStorage.setItem('access_token', token);


    //console.log("token", localStorage.getItem('access_token'));
   

    // 记住密码处理（建议不要存储密码）
    if (loginForm.remember) {
      localStorage.setItem('loginInfo', JSON.stringify({
        username: loginForm.username
        // 安全考虑不存储密码
      }))
    } else {
      localStorage.removeItem('loginInfo')
    }

    ElMessage.success('登录成功')
    router.push('/')
    
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || '登录失败'
    console.error('登录错误:', error)
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: url('https://source.unsplash.com/random/1920x1080') no-repeat;
    background-size: cover;
  }
  
  .login-box {
    width: 400px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .login-header h2 {
    color: #303133;
    font-size: 24px;
  }
  
  .login-form :deep(.el-input__inner) {
    height: 48px;
    line-height: 48px;
  }
  
  .remember-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .forgot-password {
    margin-left: auto; /* 将忘记密码推到最右边 */
    font-size: 14px;
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
  }
  </style>