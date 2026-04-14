import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'

/** 관리자 회원 목록 — 권한 유형 필터 */
export const ADMIN_PERMISSION_FILTER_OPTIONS: {
  label: string
  value: AdminPermissionTagVariant | ''
}[] = [
  { label: '전체', value: '' },
  { label: ADMIN_PERMISSION_TAG_LABEL.manager, value: 'manager' },
  { label: ADMIN_PERMISSION_TAG_LABEL.partner, value: 'partner' },
  { label: ADMIN_PERMISSION_TAG_LABEL.viewer, value: 'viewer' },
]
