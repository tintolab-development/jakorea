import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseRemoteApi as shouldUseUjatProgramsRemoteApi } from '@/features/program/ujat/api/capabilities'
import { shouldUseFormsSurveysRemoteApi } from '@/features/template/api/admin-form-templates-service'
import {
  resolveProgramOperationalBindingKind,
  type ProgramOperationalBindingKind,
} from '@/features/program/general/lib/program-operational-binding-profile'
import type { Program } from '@/types/domain'

/** create 시 programDraftId + formBindings (OpenAPI v9) 경로 — remote 게이트 */
export function shouldUseRegistrationCreateFormBindings(): boolean {
  return (
    shouldUseFormsSurveysRemoteApi() &&
    (shouldUseProgramsHttpRemoteApi() || shouldUseUjatProgramsRemoteApi())
  )
}

/**
 * POST `/api/admin/programs` 인라인 formBindings 허용 유형.
 * Gemini / Volunteer는 BE가 여전히 `INLINE_PROGRAM_FORM_BINDINGS_GENERAL_ONLY` 400.
 */
const INLINE_PROGRAM_FORM_BINDINGS_KINDS: ReadonlySet<ProgramOperationalBindingKind> = new Set([
  'GENERAL',
  'TRAINED_TEACHER',
  'COMPANY_SCHOOL',
  'UJAT',
])

export function shouldAttachInlineFormBindingsOnProgramCreate(program: Program): boolean {
  return (
    shouldUseRegistrationCreateFormBindings() &&
    INLINE_PROGRAM_FORM_BINDINGS_KINDS.has(resolveProgramOperationalBindingKind(program))
  )
}

export function assertRegistrationWizardRemoteReady(): void {
  if (shouldUseRegistrationCreateFormBindings()) return
  throw new Error(
    '프로그램 등록은 forms-surveys·programs remote API가 활성화된 환경에서만 이용할 수 있습니다.'
  )
}
