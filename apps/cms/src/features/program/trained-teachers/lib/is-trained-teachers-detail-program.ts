import type { Program } from '@/types/domain'
import { TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX } from '@/features/program/general/lib/registration-local-save'
import { getTrainedTeacherRemoteIdSnapshot } from '@/features/program/trained-teachers/api/service'
import { looksLikeTrainedTeacherProgramId } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'

/** 교육받은 교사 프로그램 상세(풀페이지) 여부 — Primary 186xxx / remote snapshot / 로컬 등록 */
export function isTrainedTeachersDetailProgram(program: Program | null): boolean {
  if (!program?.id) return false
  const id = String(program.id)
  if (looksLikeTrainedTeacherProgramId(id)) return true
  if (id.startsWith(TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)) return true
  const remoteIds = getTrainedTeacherRemoteIdSnapshot()
  return remoteIds?.has(id) === true
}
