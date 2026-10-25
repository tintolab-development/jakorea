import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import type { Program } from '@/types/domain'
import { createAdminProgramRemote } from '@/features/program/general/api/programs-api-client'
import type { RegistrationCreateFormBindingsPayload } from '@/features/program/general/lib/build-registration-create-form-bindings'
import { enrichProgramCreateRequestWithRegistrationFormBindings } from '@/features/program/general/lib/enrich-program-create-request'
import { shouldApplyRegistrationFormsAfterCreate } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import { assertServiceDetailJsonForCreate } from '@/features/program/shared/lib/program-create-service-detail-json'

/**
 * 프로그램 CREATE(서버 임시저장 ID 없음) → 위저드 양식을 프로그램 전용 COPY로 적용.
 * 양식 적용이 일부 실패해도 프로그램은 남기고(DELETE 없음) 부분 성공 안내·재시도를 띄운다.
 */
export async function createAdminProgramRemoteWithRegistrationForms(
  program: Program,
  baseRequest: ProgramCreateRequest,
  prepared?: RegistrationCreateFormBindingsPayload | null
): Promise<ProgramResponse> {
  const request = enrichProgramCreateRequestWithRegistrationFormBindings(program, baseRequest)
  assertServiceDetailJsonForCreate(request.serviceDetailJson)
  if (!request.programType?.trim()) {
    throw new Error(
      'programType is required on program create; category must not be used to infer program type'
    )
  }
  const created = await createAdminProgramRemote(request)
  const createdId = created.id
  if (
    createdId != null &&
    prepared != null &&
    prepared.forms.length > 0 &&
    shouldApplyRegistrationFormsAfterCreate(program)
  ) {
    const { applyPreparedRegistrationFormsAfterCreate } = await import(
      '@/features/program/general/lib/apply-registration-forms-after-create'
    )
    await applyPreparedRegistrationFormsAfterCreate(
      {
        ...program,
        id: String(createdId),
        backendProgramType: created.programType ?? request.programType ?? program.backendProgramType,
      },
      prepared
    )
  }
  return created
}
