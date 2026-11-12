/**
 * 면접 평가 담당자 슬롯 입력 권한 — 마스터·해당 프로그램 PM은 A·B 모두, 그 외는 한 슬롯
 *
 * 본인 역할은 GET …/my-assignment(개인정보 노출 NONE, 감사 기록 대상 아님)로만 판정한다.
 * GET …/managers는 담당자 이메일 원문 + 「프로그램 담당자를 지정·관리하기 위함」 자동 기록(CMS-31)이라
 * 담당자 정보 화면이 아닌 곳에서 부르면 불필요한 조회 이력이 남는다.
 * Cache: my-assignment 쿼리(useMyProgramPrivacyRole, staleTime 0) 공유
 */

import { useAuthStore } from '@/features/auth/model/auth-store'
import { resolveAdminRoleCodeFromUser } from '@/shared/lib/admin-role-policy'
import {
  normalizeAssignmentRole,
  type ProgramMyAssignment,
} from '@/features/program/shared/lib/program-my-assignment'
import { useMyProgramPrivacyRole } from '@/features/user/detail/lib/use-my-program-privacy-role'

export type GeneralInterviewEvaluationAccess = {
  canFillBothSlots: boolean
  currentAdminId: number | null
}

/** 이 프로그램에 본인이 PM(Owner)으로 배정됐는지. 배정 응답이 없거나 다른 역할이면 false. */
export function isMyProgramPmAssignment(
  assignment: ProgramMyAssignment | null | undefined
): boolean {
  if (!assignment || assignment.assigned !== true) return false
  return normalizeAssignmentRole(assignment.assignmentRole) === 'PM'
}

export function useGeneralInterviewEvaluationAccess(
  programId: string | undefined
): GeneralInterviewEvaluationAccess {
  const user = useAuthStore(state => state.user)
  const isMaster = resolveAdminRoleCodeFromUser(user) === 'MASTER'
  const currentAdminId = user?.adminAccountId ?? null
  const myAssignment = useMyProgramPrivacyRole(programId)

  const isProgramPm =
    currentAdminId != null && !myAssignment.pending && isMyProgramPmAssignment(myAssignment.assignment)

  return { canFillBothSlots: isMaster || isProgramPm, currentAdminId }
}
