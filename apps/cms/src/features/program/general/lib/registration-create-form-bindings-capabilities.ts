import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseRemoteApi as shouldUseUjatProgramsRemoteApi } from '@/features/program/ujat/api/capabilities'
import { shouldUseFormsSurveysRemoteApi } from '@/features/template/api/admin-form-templates-service'
import {
  resolveProgramOperationalBindingKind,
  type ProgramOperationalBindingKind,
} from '@/features/program/general/lib/program-operational-binding-profile'
import type { Program } from '@/types/domain'

/** 등록 완료 시 CREATE 후 양식 적용(방안 C) 경로 — remote 게이트 */
export function shouldUseRegistrationCreateFormBindings(): boolean {
  return (
    shouldUseFormsSurveysRemoteApi() &&
    (shouldUseProgramsHttpRemoteApi() || shouldUseUjatProgramsRemoteApi())
  )
}

/**
 * CREATE에 `autoApplyDefaultFormBindings: true`를 싣고, CREATE 후 위저드 양식을 프로그램 전용 COPY로
 * 적용하는 유형. Gemini / Volunteer는 기존 요청을 그대로 둔다.
 */
const APPLY_FORMS_AFTER_CREATE_KINDS: ReadonlySet<ProgramOperationalBindingKind> = new Set([
  'GENERAL',
  'TRAINED_TEACHER',
  'COMPANY_SCHOOL',
  'UJAT',
])

export function shouldApplyRegistrationFormsAfterCreate(program: Program): boolean {
  return (
    shouldUseRegistrationCreateFormBindings() &&
    APPLY_FORMS_AFTER_CREATE_KINDS.has(resolveProgramOperationalBindingKind(program))
  )
}

export function assertRegistrationWizardRemoteReady(): void {
  if (shouldUseRegistrationCreateFormBindings()) return
  throw new Error(
    '프로그램 등록은 forms-surveys·programs remote API가 활성화된 환경에서만 이용할 수 있습니다.'
  )
}
