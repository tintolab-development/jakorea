import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { Program } from '@/types/domain'
import { shouldApplyRegistrationFormsAfterCreate } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'

/**
 * POST `/api/admin/programs` — 서버 임시저장 없이 CREATE한다(방안 C).
 * - 서버 임시저장 ID·inline `formBindings`는 보내지 않는다.
 * - `autoApplyDefaultFormBindings: true`로 카탈로그 기본 양식을 붙여 GENERAL readiness를 충족한다.
 * - 위저드 양식은 CREATE 후 `applyPreparedRegistrationFormsAfterCreate`가 프로그램 전용 COPY로 적용한다.
 * Gemini / Volunteer 등 대상이 아닌 유형은 요청을 그대로 둔다.
 */
export function enrichProgramCreateRequestWithRegistrationFormBindings(
  program: Program,
  baseRequest: ProgramCreateRequest
): ProgramCreateRequest {
  if (!shouldApplyRegistrationFormsAfterCreate(program)) {
    return baseRequest
  }
  const { programDraftId: _programDraftId, formBindings: _formBindings, ...rest } = baseRequest
  return {
    ...rest,
    autoApplyDefaultFormBindings: true,
  }
}
