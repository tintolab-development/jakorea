import type { Program } from '@/types/domain'
import { getTrainedTeachersPrograms } from '@/data/mock/trained-teachers-programs'
import { TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX } from '@/features/program/general/lib/registration-local-save'
import { getTrainedTeacherRemoteIdSnapshot } from '@/features/program/trained-teachers/api/service'

/** 교육받은 교사 프로그램 상세(풀페이지) 여부 */
export function isTrainedTeachersDetailProgram(program: Program | null): boolean {
  if (!program?.id) return false
  const id = String(program.id)
  if (
    id.startsWith('trained-teachers-prog-') ||
    id.startsWith(TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)
  ) {
    return true
  }
  const remoteIds = getTrainedTeacherRemoteIdSnapshot()
  if (remoteIds?.has(id)) return true
  return getTrainedTeachersPrograms().some(item => item.id === program.id)
}
