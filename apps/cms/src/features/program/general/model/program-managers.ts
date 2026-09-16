import type { ProgramRole } from '@/types/user'

export interface ProgramManagerRow {
  id: string
  no: number
  name: string
  role: ProgramRole
  phone: string
  email: string
  registeredAt: string
  /** remote assignment의 adminId */
  adminId?: number
  /** remote 삭제 가능 여부 — false면 선택·삭제 비활성 */
  removableYn?: boolean
}

/** UI 표시용 권한 라벨 (시안: PM / 파트너 / 뷰어) */
export const PROGRAM_ROLE_LABELS: Record<ProgramRole, string> = {
  OWNER: 'PM',
  PARTNER: '파트너',
  ASSISTANT: '뷰어',
}

/** @deprecated {@link MAX_PM_PER_PROGRAM} 사용 권장 (엔티티 정책과 동일 값) */
export { MAX_PM_PER_PROGRAM as MAX_OWNER_COUNT } from '@/entities/program/lib/program-pm-role-policy'
