import type { ProgramCreateRequest } from '@/shared/api/generated/forms-surveys/schemas/programCreateRequest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { Program } from '@/types/domain'
import { createAdminProgramRemote } from '@/features/program/general/api/programs-api-client'
import { enrichProgramCreateRequestWithRegistrationFormBindings } from '@/features/program/general/lib/enrich-program-create-request'

export async function createAdminProgramRemoteWithRegistrationForms(
  program: Program,
  baseRequest: ProgramCreateRequest
): Promise<ProgramResponse> {
  const request = await enrichProgramCreateRequestWithRegistrationFormBindings(
    program,
    baseRequest
  )
  return createAdminProgramRemote(request)
}
