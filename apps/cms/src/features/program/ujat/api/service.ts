import { getUjatPrograms } from '@/data/mock/program-schedule-categories'
import {
  createAdminProgramRemote,
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
} from '@/features/program/general/api/programs-api-client'
import {
  buildUjatProgramListRowFromRegistrationSnapshot,
  deleteUjatRegistrationLocalProgram,
  persistUjatRegistrationFormLocal,
  readUjatRegistrationLocalSavePrograms,
  updateUjatRegistrationLocalProgram,
} from '@/features/program/ujat/lib/ujat-registration-local-save'
import { resolveUjatProgramForDetail } from '@/features/program/ujat/lib/ujat-program-detail-meta'
import type { Program } from '@/types/domain'
import { fromDetail, fromListItem, toCreateRequest, toUpdateRequest } from './adapters'
import { shouldUseRemoteApi } from './capabilities'
import { toRemoteListParams, type ListParams } from './list-params'
import {
  parseRegistrationSnapshot,
  type RegistrationSnapshot,
} from './service-detail'

export type CreateInput = RegistrationSnapshot & {
  idempotencyKey: string
}

function localList(params: ListParams): Program[] {
  const merged = [...getUjatPrograms(), ...readUjatRegistrationLocalSavePrograms()]
  const keyword = params.keyword?.trim().toLocaleLowerCase()
  const filtered = merged.filter(program => {
    if (params.businessYear != null) {
      const year = new Date(program.startDate).getFullYear()
      if (year !== params.businessYear) return false
    }
    return !keyword || `${program.title} ${program.mainTitle ?? ''}`.toLocaleLowerCase().includes(keyword)
  })
  const page = params.page ?? 0
  const size = params.size ?? filtered.length
  return filtered.slice(page * size, page * size + size)
}

export async function list(params: ListParams = {}): Promise<Program[]> {
  if (!shouldUseRemoteApi()) return localList(params)
  const response = await fetchAdminProgramsRemote(toRemoteListParams(params))
  return (response.items ?? []).map(fromListItem)
}

export async function detail(programId: string): Promise<Program | null> {
  if (!shouldUseRemoteApi()) return resolveUjatProgramForDetail(programId) ?? null
  return fromDetail(await fetchAdminProgramByIdRemote(programId))
}

export async function create(input: CreateInput): Promise<Program> {
  if (!shouldUseRemoteApi()) {
    return persistUjatRegistrationFormLocal(input)
  }

  const pending = buildUjatProgramListRowFromRegistrationSnapshot({
    id: `ujat-pending-${input.idempotencyKey}`,
    overlay: input.overlay,
  })
  return fromDetail(await createAdminProgramRemote(toCreateRequest(pending, input)))
}

export async function update(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  if (!shouldUseRemoteApi()) {
    const updated = updateUjatRegistrationLocalProgram(programId, patch ?? program)
    if (updated) return updated

    const mockProgram = getUjatPrograms().find(item => item.id === programId)
    if (!mockProgram) throw new Error('수정할 UJAT 프로그램을 찾을 수 없습니다.')
    Object.assign(mockProgram, patch ?? program, {
      id: mockProgram.id,
      createdAt: mockProgram.createdAt,
      updatedAt: new Date().toISOString(),
    })
    return mockProgram
  }
  const current = await fetchAdminProgramByIdRemote(programId)
  const registration = parseRegistrationSnapshot(current.serviceDetailJson)
  return fromDetail(
    await updateAdminProgramRemote(
      programId,
      toUpdateRequest(program, patch, registration)
    )
  )
}

export async function remove(programId: string): Promise<void> {
  if (!shouldUseRemoteApi()) {
    if (deleteUjatRegistrationLocalProgram(programId)) return

    const mockPrograms = getUjatPrograms()
    const mockIndex = mockPrograms.findIndex(program => program.id === programId)
    if (mockIndex < 0) throw new Error('삭제할 UJAT 프로그램을 찾을 수 없습니다.')
    mockPrograms.splice(mockIndex, 1)
    return
  }
  await deleteAdminProgramRemote(programId)
}
