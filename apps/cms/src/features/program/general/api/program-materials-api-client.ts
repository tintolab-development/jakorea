import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { ProgramMaterialAssignmentResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialAssignmentResponse'
import type { ProgramMaterialAssignmentRequest } from '@/shared/api/generated/dashboard/schemas/programMaterialAssignmentRequest'
import type { ProgramMaterialAssignmentItemRequest } from '@/shared/api/generated/dashboard/schemas/programMaterialAssignmentItemRequest'
import type { ProgramMaterialCandidateResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialCandidateResponse'
import type { ProgramMaterialResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialResponse'

export type { ProgramMaterialAssignmentRequest, ProgramMaterialAssignmentItemRequest }

export type ProgramMaterialAssignmentStatus = 'UNDECIDED' | 'NONE' | 'ASSIGNED'

export type ProgramMaterialAssignmentSnapshot = Omit<
  ProgramMaterialAssignmentResponse,
  'assignmentStatus' | 'noneYn' | 'items'
> & {
  assignmentStatus: ProgramMaterialAssignmentStatus
  noneYn: boolean
  items: ProgramMaterialResponse[]
}

function normalizeAssignmentSnapshot(
  payload: ProgramMaterialAssignmentResponse | ProgramMaterialResponse[] | null | undefined
): ProgramMaterialAssignmentSnapshot {
  const raw = Array.isArray(payload) ? {} : (payload ?? {})
  const items = Array.isArray(payload) ? payload : (raw.items ?? [])
  const rawStatus = raw.assignmentStatus?.trim().toUpperCase()
  const assignmentStatus: ProgramMaterialAssignmentStatus =
    rawStatus === 'NONE' || rawStatus === 'ASSIGNED' || rawStatus === 'UNDECIDED'
      ? rawStatus
      : raw.noneYn
        ? 'NONE'
        : items.length > 0
          ? 'ASSIGNED'
          : 'UNDECIDED'

  return {
    programId: raw.programId,
    assignmentStatus,
    noneYn: raw.noneYn === true || assignmentStatus === 'NONE',
    items,
  }
}

function buildProgramMaterialUrl(programId: string, suffix = ''): string {
  const id = programId.trim()
  if (!id) throw new Error('Invalid programId')
  return `/api/admin/programs/${encodeURIComponent(id)}/materials${suffix}`
}

/** GET /api/admin/programs/{programId}/materials */
export async function fetchProgramMaterials(
  programId: string
): Promise<ProgramMaterialAssignmentSnapshot> {
  const payload = await customInstance<unknown>({
    url: buildProgramMaterialUrl(programId),
    method: 'GET',
  })
  return normalizeAssignmentSnapshot(
    unwrapApiBody<ProgramMaterialAssignmentResponse | ProgramMaterialResponse[]>(payload)
  )
}

/** GET /api/admin/programs/{programId}/material-candidates */
export async function fetchProgramMaterialCandidates(
  programId: string
): Promise<ProgramMaterialCandidateResponse[]> {
  const payload = await customInstance<unknown>({
    url: `/api/admin/programs/${encodeURIComponent(programId.trim())}/material-candidates`,
    method: 'GET',
  })
  const body = unwrapApiBody<
    | ProgramMaterialCandidateResponse[]
    | { items?: ProgramMaterialCandidateResponse[]; content?: ProgramMaterialCandidateResponse[] }
  >(payload)
  if (Array.isArray(body)) return body
  return body.items ?? body.content ?? []
}

/** PUT /api/admin/programs/{programId}/materials */
export async function saveProgramMaterials(
  programId: string,
  request: ProgramMaterialAssignmentRequest
): Promise<ProgramMaterialAssignmentSnapshot> {
  const payload = await customInstance<unknown>({
    url: buildProgramMaterialUrl(programId),
    method: 'PUT',
    data: request,
  })
  return normalizeAssignmentSnapshot(
    unwrapApiBody<ProgramMaterialAssignmentResponse | ProgramMaterialResponse[]>(payload)
  )
}

/** DELETE /api/admin/programs/{programId}/materials/{materialId} */
export async function deleteProgramMaterial(programId: string, materialId: string): Promise<void> {
  await customInstance({
    url: `${buildProgramMaterialUrl(programId)}/${encodeURIComponent(materialId)}`,
    method: 'DELETE',
  })
}
