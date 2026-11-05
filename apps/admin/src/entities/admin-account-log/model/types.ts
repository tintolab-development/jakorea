/**
 * 관리자 계정 처리 이력
 */

export type AdminAccountActionType =
  | 'password_change'
  | 'profile_update'
  | 'permission_change'
  | 'account_create'
  | 'account_deactivate'
  | 'identity_reverify'

export const ADMIN_ACCOUNT_ACTION_LABELS: Record<AdminAccountActionType, string> = {
  password_change: '비밀번호 변경',
  profile_update: '계정 정보 수정',
  permission_change: '권한 변경',
  account_create: '계정 생성',
  account_deactivate: '계정 비활성',
  identity_reverify: '본인인증 재인증',
}

export const ADMIN_ACCOUNT_ACTION_TYPES = Object.keys(
  ADMIN_ACCOUNT_ACTION_LABELS
) as AdminAccountActionType[]

export type AdminAccountLog = {
  id: string
  name: string
  loginId: string
  /** 서버 actionType 원문. 알 수 없는 code도 그대로 보관 */
  actionType: string
  processedAt: string
  ip: string
}

export type AdminAccountListFilter = {
  name?: string
  loginId?: string
  actionType?: AdminAccountActionType | ''
  from?: string | null
  to?: string | null
  /** 0-based. omit/0 = 첫 페이지 */
  page?: number
}

export type AdminAccountListResult = {
  rows: AdminAccountLog[]
  total: number
}
