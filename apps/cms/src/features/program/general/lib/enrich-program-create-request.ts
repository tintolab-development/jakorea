import type { ProgramCreateRequest } from '@/shared/api/generated/forms-surveys/schemas/programCreateRequest'
import type { Program } from '@/types/domain'
import {
  buildRegistrationCreateFormBindings,
  type RegistrationCreateFormBindingsPayload,
} from '@/features/program/general/lib/build-registration-create-form-bindings'
import { shouldAttachInlineFormBindingsOnProgramCreate } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'

/**
 * OpenAPI v9 — create와 동일 트랜잭션에서 program-scoped formBindings publish/bind.
 * 실패 시 throw (attach fallback으로 조용히 넘기지 않음).
 * 일반·교육받은 교사·1사1교·UJAT. Gemini / Volunteer는 인라인 금지.
 */
export async function enrichProgramCreateRequestWithRegistrationFormBindings(
  program: Program,
  baseRequest: ProgramCreateRequest,
  prepared?: RegistrationCreateFormBindingsPayload | null
): Promise<ProgramCreateRequest> {
  if (!shouldAttachInlineFormBindingsOnProgramCreate(program)) {
    return baseRequest
  }

  const bindingPayload =
    prepared !== undefined ? prepared : await buildRegistrationCreateFormBindings(program)
  if (bindingPayload == null) {
    return baseRequest
  }

  return {
    ...baseRequest,
    autoApplyDefaultFormBindings: false,
    programDraftId: bindingPayload.programDraftId,
    formBindings: bindingPayload.formBindings,
  }
}
