import type { Program } from '@/types/domain'
import { isProgramRecruitmentTypeLocked } from '@/features/program/shared/lib/program-edit-window'

/**
 * 교육받은 교사 — 신청 양식 수정 가능 여부.
 * 참여자 모집 `startAt` 전까지만. `startAt`이 없으면 아직 시작 전.
 */
export function isTrainedTeachersApplicationFormEditable(program: Program | null): boolean {
  return !isProgramRecruitmentTypeLocked(program, 'PARTICIPANT')
}
