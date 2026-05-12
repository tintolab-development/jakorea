/**
 * POST `/api/admin/auth/login` 계약 (실서버 응답 래퍼).
 */

export interface AdminLoginRequestBody {
  email: string
  password: string
}

/** 성공 시 `data` — 역할 값은 백엔드 스펙 확정 후 좁히면 됨 */
export type AdminLoginUserRole = string

export interface AdminLoginSuccessData {
  id: string
  programId: string
  userId: string
  userEmail: string
  userName: string
  role: AdminLoginUserRole
}

export interface AdminLoginErrorBody {
  code: string
  message: string
}

export interface AdminLoginMeta {
  serverTime: string
}

export interface AdminLoginApiResponse {
  success: boolean
  data?: AdminLoginSuccessData
  error?: AdminLoginErrorBody
  meta?: AdminLoginMeta
}
