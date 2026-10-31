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
  /** CMS 전역 역할 — VIEWER면 프로그램 뷰어만 지정 가능 */
  cmsRoleCode?: string
  /** remote 삭제 가능 여부 — false면 선택·삭제 비활성 */
  removableYn?: boolean
}

/** UI 표시용 권한 라벨 (시안: Program Owner / Assistant / Viewer) */
export const PROGRAM_ROLE_LABELS: Record<ProgramRole, string> = {
  OWNER: 'Program Owner',
  PARTNER: 'Program Assistant',
  ASSISTANT: 'Program Viewer',
}

/** 담당자 추가 등록 — 지정 가능한 프로그램 권한 안내 */
export function formatAddProgramManagerRegistrationHint(programRole: ProgramRole): string {
  return `선택한 관리자는 ${PROGRAM_ROLE_LABELS[programRole]} 권한으로 등록 가능합니다.`
}

/** @deprecated {@link MAX_PM_PER_PROGRAM} 사용 권장 (엔티티 정책과 동일 값) */
export { MAX_PM_PER_PROGRAM as MAX_OWNER_COUNT } from '@/entities/program/lib/program-pm-role-policy'
