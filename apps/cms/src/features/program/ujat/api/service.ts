import { createAdminProgramRemoteWithRegistrationForms } from '@/features/program/general/api/create-admin-program-remote-with-registration-forms'
import {
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
} from '@/features/program/general/api/programs-api-client'
import {
  buildUjatProgramListRowFromRegistrationSnapshot,
  collectUjatRegistrationCreateOverlay,
} from '@/features/program/ujat/lib/ujat-registration-local-save'
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
  readUjatRegistrationOverlayFromProgram,
  type RegistrationSnapshot,
} from './service-detail'

export type CreateInput = RegistrationSnapshot & {
  idempotencyKey: string
  preparedFormBindings?: import('@/features/program/general/lib/build-registration-create-form-bindings').RegistrationCreateFormBindingsPayload | null
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
  const overlay = collectUjatRegistrationCreateOverlay(input.overlay)
  const pending = buildUjatProgramListRowFromRegistrationSnapshot({
    id: `ujat-pending-${input.idempotencyKey}`,
    overlay,
  })
  return fromDetail(
    await createAdminProgramRemoteWithRegistrationForms(
      pending,
      toCreateRequest(pending, { ...input, overlay }),
      input.preparedFormBindings
    )
  )
}

export async function update(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  assertRemoteReady()
  const current = await fetchAdminProgramByIdRemote(programId)
  const registration = parseRegistrationSnapshot(current.serviceDetailJson)
  // 상세 수정 중 세션/드래프트 overlay를 registration에 합친다.
  // GET 스냅샷만 쓰면 대표·관리명 등 overlay 편집이 serviceDetailJson에 반영되지 않는다.
  const editedOverlay = readUjatRegistrationOverlayFromProgram(program)
  const nextRegistration =
    registration && Object.keys(editedOverlay).length > 0
      ? {
          ...registration,
          overlay: {
            ...registration.overlay,
            ...editedOverlay,
          },
        }
      : registration
  return fromDetail(
    await updateAdminProgramRemote(programId, toUpdateRequest(program, patch, nextRegistration))
  )
}

export async function remove(programId: string): Promise<void> {
  assertRemoteReady()
  await deleteAdminProgramRemote(programId)
}
