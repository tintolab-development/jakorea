import { COMPANY_SCHOOL_PROGRAM_API_TYPE } from '@/features/program/1c-1s/api/adapters'
import { resolveGeneralProgramCreateProgramType } from '@/features/program/general/api/adapters/general-program-adapters'
import { resolveProgramOperationalBindingKind } from '@/features/program/general/lib/program-operational-binding-profile'
import { TRAINED_TEACHER_PROGRAM_API_TYPE } from '@/features/program/trained-teachers/api/adapters'
import type { Program } from '@/types/domain'

/** PUT /api/admin/program-draft · create programDraftId용 programType */
export function resolveProgramApiTypeForDraft(program: Program): string {
  const kind = resolveProgramOperationalBindingKind(program)
  if (kind === 'UJAT') return 'UJAT'
  if (kind === 'COMPANY_SCHOOL') return COMPANY_SCHOOL_PROGRAM_API_TYPE
  if (kind === 'TRAINED_TEACHER') return TRAINED_TEACHER_PROGRAM_API_TYPE
  return (
    resolveGeneralProgramCreateProgramType(
      program.generalProgramAudience,
      program.generalParticipantTypes
    ) ?? 'GENERAL'
  )
}
