import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { Program } from '@/types/domain'
import { createAdminProgramRemote } from '@/features/program/general/api/programs-api-client'
import type { RegistrationCreateFormBindingsPayload } from '@/features/program/general/lib/build-registration-create-form-bindings'
import { enrichProgramCreateRequestWithRegistrationFormBindings } from '@/features/program/general/lib/enrich-program-create-request'

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
  return createAdminProgramRemote(request)
}
