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
 * GET/PUT/DELETE /api/admin/program-draft query programType — 위저드·copy ownerProgramDraftId SSOT.
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
