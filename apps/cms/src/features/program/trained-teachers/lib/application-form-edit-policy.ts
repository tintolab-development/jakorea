import type { Program } from '@/types/domain'
import type { ApplicationFormEditContext } from '@/features/program/general/lib/common-info-edit-policy'

/**
 * 교육받은 교사 — 신청 양식 수정 가능 여부.
 * 모집 시작일은 선차단 기준이 아니며, 서버가 신청 존재 여부를 최종 판단한다.
 */
export function isTrainedTeachersApplicationFormEditable(
  program: Program | null,
  context: ApplicationFormEditContext = {}
): boolean {
  if (!program) return false
  if (context.hasBinding === false) return true
  return (context.applicationCount ?? 0) <= 0
}
