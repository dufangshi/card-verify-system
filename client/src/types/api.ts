// 基础响应类型
export interface APIResponse<T = unknown> {
    status: 'success' | 'error';
    message?: string;
    data: T;
    code?: number;
    errorCode?: string;
  }
  
  // 登录响应数据类型
  export interface LoginResponseData {
    userId: number;
    username: string;
    roleId: number;
    token: string;
  }
  
  // 用户信息类型（用于后续接口扩展）
  export interface UserProfile {
    userId: number;
    username: string;
    roleId: number;
    email?: string;
    avatar?: string;
  }