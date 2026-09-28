import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { looksLikeTrainedTeacherProgramId } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { looksLikeUjatProgramId } from '@/features/program/ujat/lib/is-ujat-primary-program'
import type { Program } from '@/types/domain'

/** form-bindings attach / operational spec 분기용 프로그램 유형 */
export type ProgramOperationalBindingKind =
  | 'GENERAL'
  | 'COMPANY_SCHOOL'
  | 'TRAINED_TEACHER'
  | 'UJAT'

export function resolveProgramOperationalBindingKind(
  program: Program
): ProgramOperationalBindingKind {
  if (isCompanySchoolProgram(program)) {
    return 'COMPANY_SCHOOL'
  }
  if (
    isTrainedTeachersDetailProgram(program) ||
    looksLikeTrainedTeacherProgramId(program.id)
  ) {
    return 'TRAINED_TEACHER'
  }
  if (looksLikeUjatProgramId(program.id) || program.ujatProgressStatus != null) {
    return 'UJAT'
  }
  return 'GENERAL'
}
