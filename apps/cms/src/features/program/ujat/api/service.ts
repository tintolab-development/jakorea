import { createAdminProgramRemoteWithRegistrationForms } from '@/features/program/general/api/create-admin-program-remote-with-registration-forms'
import {
  bulkDeleteAdminProgramsRemote,
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
  parseRegistrationOverlay,
  readUjatRegistrationOverlayFromProgram,
  type RegistrationPersistSnapshot,
  type RegistrationSnapshot,
} from './service-detail'
import {
  buildUjatRegionCapacityOverlay,
  fetchUjatRegionCapacitiesRemote,
} from './region-capacities-client'

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
  const mapped = fromDetail(await fetchAdminProgramByIdRemote(programId))
  // 지역별 정원은 프로그램 상세 JSON이 아닌 실행 도메인의 별도 테이블에 저장된다.
  // 상세 조회에서도 같은 값을 overlay에 주입해야 정보 탭이 0/빈 값으로 남지 않는다.
  let mappedWithRegionCapacities = mapped
  try {
    const capacities = await fetchUjatRegionCapacitiesRemote(programId)
    if (capacities.length > 0) {
      mappedWithRegionCapacities = {
        ...mapped,
        ujatRegistrationOverlay: {
          ...(mapped.ujatRegistrationOverlay ?? {}),
          ...buildUjatRegionCapacityOverlay(capacities),
        },
      }
    }
  } catch {
    // 지역 정원 권한/구버전 백엔드로 상세 전체가 막히지 않도록 기존 상세 응답을 유지한다.
  }
  const { withFetchedProgramSponsorAssignments } = await import(
    '@/features/program/shared/lib/merge-program-sponsor-assignments'
  )
  const { fetchAdminProgramSponsorsRemote } = await import(
    '@/features/program/general/api/programs-api-client'
  )
  return withFetchedProgramSponsorAssignments(
    mappedWithRegionCapacities,
    programId,
    fetchAdminProgramSponsorsRemote
  )
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
      toCreateRequest(pending, { draft: input.draft, overlay }),
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
  const persistedOverlay = parseRegistrationOverlay(current.serviceDetailJson)
  // 상세 수정 중 세션/드래프트 overlay를 registration에 합친다.
  // GET 스냅샷만 쓰면 대표·관리명 등 overlay 편집이 serviceDetailJson에 반영되지 않는다.
  const editedOverlay = readUjatRegistrationOverlayFromProgram(program)
  const mergedOverlay = {
    ...persistedOverlay,
    ...(registration?.overlay ?? {}),
    ...editedOverlay,
  }
  const nextRegistration: RegistrationPersistSnapshot | undefined =
    Object.keys(mergedOverlay).length > 0
      ? {
          ...(registration?.draft ? { draft: registration.draft } : {}),
          overlay: mergedOverlay,
        }
      : registration
  const dto = await updateAdminProgramRemote(
    programId,
    toUpdateRequest(program, patch, nextRegistration)
  )
  const mapped = fromDetail(dto)
  const { withFetchedProgramSponsorAssignments } = await import(
    '@/features/program/shared/lib/merge-program-sponsor-assignments'
  )
  const { fetchAdminProgramSponsorsRemote } = await import(
    '@/features/program/general/api/programs-api-client'
  )
  return withFetchedProgramSponsorAssignments(mapped, programId, fetchAdminProgramSponsorsRemote)
}

export async function remove(programId: string): Promise<void> {
  assertRemoteReady()
  await deleteAdminProgramRemote(programId)
}

/** 409 `PROGRAM_HARD_DELETE_BLOCKED` → `ProgramHardDeleteBlockedError` */
export async function removeMany(programIds: string[]): Promise<void> {
  if (programIds.length === 0) return
  assertRemoteReady()
  await bulkDeleteAdminProgramsRemote(programIds)
}
