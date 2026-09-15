import {
  createAdminProgramRemote,
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
} from '@/features/program/general/api/programs-api-client'
import { buildUjatProgramListRowFromRegistrationSnapshot } from '@/features/program/ujat/lib/ujat-registration-local-save'
import type { Program } from '@/types/domain'
import { fromDetail, fromListItem, toCreateRequest, toUpdateRequest } from './adapters'
import { shouldUseRemoteApi } from './capabilities'
import {
  UJAT_PROGRAM_LIST_PAGE_SIZE,
  toRemoteListParams,
  type ListParams,
} from './list-params'
import {
  parseRegistrationSnapshot,
  type RegistrationSnapshot,
} from './service-detail'

export type CreateInput = RegistrationSnapshot & {
  idempotencyKey: string
}

function assertRemoteReady(): void {
  if (shouldUseRemoteApi()) return
  throw new Error(
    'UJAT 프로그램 API가 활성화되지 않았습니다. 원격 JWT·programs/ujatPrograms 모듈 설정을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

export type UjatProgramsRemoteListPage = {
  programs: Program[]
  page: number
  size: number
  totalElements: number
  hasMore: boolean
}

export async function listPage(
  params: ListParams = {},
  pageParam = 0
): Promise<UjatProgramsRemoteListPage> {
  assertRemoteReady()
  const response = await fetchAdminProgramsRemote(
    toRemoteListParams({ ...params, page: pageParam, size: params.size ?? UJAT_PROGRAM_LIST_PAGE_SIZE })
  )
  const programs = (response.items ?? []).map(fromListItem)
  const size = response.size ?? params.size ?? UJAT_PROGRAM_LIST_PAGE_SIZE
  const currentPage = response.page ?? pageParam
  const totalElements = response.totalElements ?? programs.length
  const totalPages =
    response.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : currentPage + 1)
  return {
    programs,
    page: currentPage,
    size,
    totalElements,
    hasMore: currentPage + 1 < totalPages,
  }
}

/** @deprecated 무한 스크롤은 `listPage` 사용 */
export async function list(params: ListParams = {}): Promise<Program[]> {
  const page = await listPage(params, params.page ?? 0)
  return page.programs
}

export async function detail(programId: string): Promise<Program | null> {
  assertRemoteReady()
  return fromDetail(await fetchAdminProgramByIdRemote(programId))
}

export async function create(input: CreateInput): Promise<Program> {
  assertRemoteReady()
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
  assertRemoteReady()
  const current = await fetchAdminProgramByIdRemote(programId)
  const registration = parseRegistrationSnapshot(current.serviceDetailJson)
  return fromDetail(
    await updateAdminProgramRemote(programId, toUpdateRequest(program, patch, registration))
  )
}

export async function remove(programId: string): Promise<void> {
  assertRemoteReady()
  await deleteAdminProgramRemote(programId)
}
