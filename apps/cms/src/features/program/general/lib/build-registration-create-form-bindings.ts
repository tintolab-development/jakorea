import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { Program } from '@/types/domain'
import { prepareRegistrationCreateFormBindings } from '@/features/program/general/lib/prepare-registration-create-form-bindings'

export type RegistrationCreateFormBindingsPayload = {
  programDraftId: number
  formBindings: ProgramFormBindingRequest[]
}

/**
 * create body용 program-scoped formBindings 빌드 (OpenAPI v9 옵션 1).
 * flush 없이 publish-only fallback — 등록 완료는 `prepareRegistrationCreateFormBindings` 사용.
 */
export async function buildRegistrationCreateFormBindings(
  program: Program
): Promise<RegistrationCreateFormBindingsPayload | null> {
  return prepareRegistrationCreateFormBindings({ program })
}
