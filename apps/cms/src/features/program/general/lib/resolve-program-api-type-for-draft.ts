import { COMPANY_SCHOOL_PROGRAM_API_TYPE } from '@/features/program/1c-1s/api/adapters'
import { resolveGeneralProgramCreateProgramType } from '@/features/program/general/api/adapters/general-program-adapters'
import { listRegistrationFormTemplateCodeForProgram } from '@/features/program/general/lib/operational-form-bindings'
import { resolveProgramOperationalBindingKind } from '@/features/program/general/lib/program-operational-binding-profile'
import { TRAINED_TEACHER_PROGRAM_API_TYPE } from '@/features/program/trained-teachers/api/adapters'
import {
  registrationProgramTypeForTemplateCode,
  type ProgramRegistrationDraftTemplateCode,
  type RegistrationProgramTypeKey,
} from '@/features/program/shared/lib/registration-draft-notice'
import type { Program } from '@/types/domain'

/**
 * POST /api/admin/programs body.programType — GENERAL / GENERAL_INDIVIDUAL 등 create enum.
 */
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

/**
 * 등록 위저드 localStorage 키(registration-wizard:<TYPE>:*)·임시저장 메타의 programType SSOT (서버 임시저장 API는 쓰지 않음).
 * create body.programType(GENERAL_INDIVIDUAL 등)과 **분리**된 4값 키.
 */
export function resolveRegistrationProgramDraftProgramType(
  program: Program
): RegistrationProgramTypeKey {
  const templateCode = listRegistrationFormTemplateCodeForProgram(program)
  if (templateCode != null) {
    return registrationProgramTypeForTemplateCode(
      templateCode as ProgramRegistrationDraftTemplateCode
    )
  }
  const kind = resolveProgramOperationalBindingKind(program)
  if (kind === 'UJAT') return 'UJAT'
  if (kind === 'COMPANY_SCHOOL') return 'COMPANY_SCHOOL'
  if (kind === 'TRAINED_TEACHER') return 'TRAINED_TEACHER'
  return 'GENERAL'
}
