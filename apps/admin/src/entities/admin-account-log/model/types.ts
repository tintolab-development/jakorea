/**
 * 관리자 계정 처리 이력
 */

export type AdminAccountActionType =
  | 'password_change'
  | 'profile_update'
  | 'permission_change'
  | 'account_create'
  | 'account_deactivate'

export const ADMIN_ACCOUNT_ACTION_LABELS: Record<AdminAccountActionType, string> = {
  password_change: '비밀번호 변경',
  profile_update: '계정 정보 수정',
  permission_change: '권한 변경',
  account_create: '계정 생성',
  account_deactivate: '계정 비활성',
}

export const ADMIN_ACCOUNT_ACTION_TYPES = Object.keys(
  ADMIN_ACCOUNT_ACTION_LABELS
) as AdminAccountActionType[]

export type AdminAccountLog = {
  id: string
  name: string
  loginId: string
  actionType: AdminAccountActionType
  processedAt: string
  ip: string
}

export type AdminAccountListFilter = {
  name?: string
  loginId?: string
  actionType?: AdminAccountActionType | ''
  from?: string | null
  to?: string | null
}

export type AdminAccountListResult = {
  rows: AdminAccountLog[]
  total: number
}
