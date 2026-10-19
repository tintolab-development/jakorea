import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import type { Program } from '@/types/domain'
import { createAdminProgramRemote } from '@/features/program/general/api/programs-api-client'
import type { RegistrationCreateFormBindingsPayload } from '@/features/program/general/lib/build-registration-create-form-bindings'
import { enrichProgramCreateRequestWithRegistrationFormBindings } from '@/features/program/general/lib/enrich-program-create-request'
import { assertServiceDetailJsonForCreate } from '@/features/program/shared/lib/program-create-service-detail-json'

export async function createAdminProgramRemoteWithRegistrationForms(
  program: Program,
  baseRequest: ProgramCreateRequest,
  prepared?: RegistrationCreateFormBindingsPayload | null
): Promise<ProgramResponse> {
  const request = await enrichProgramCreateRequestWithRegistrationFormBindings(
    program,
    baseRequest,
    prepared
  )
  assertServiceDetailJsonForCreate(request.serviceDetailJson)
  if (!request.programType?.trim()) {
    throw new Error(
      'programType is required on program create; category must not be used to infer program type'
    )
  }
  return createAdminProgramRemote(request)
}
