import type { Program } from '@/types/domain'
import { getTrainedTeachersPrograms } from '@/data/mock/trained-teachers-programs'
import { TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX } from '@/features/program/general/lib/registration-local-save'

/** 교육받은 교사 프로그램 상세(풀페이지) 여부 */
export function isTrainedTeachersDetailProgram(program: Program | null): boolean {
  if (!program?.id) return false
  const id = String(program.id)
  return (
    id.startsWith('trained-teachers-prog-') ||
    id.startsWith(TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX) ||
    getTrainedTeachersPrograms().some(item => item.id === program.id)
  )
}
