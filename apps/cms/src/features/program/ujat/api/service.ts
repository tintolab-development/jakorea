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
import {
  awaitRecruitDetailMediaUploads,
  bindUjatRecruitDetailMediaToRows,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
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
  fetchUjatTypedDetailRemote,
  applyUjatProgramPatchToTypedDetail,
  replaceUjatTypedDetailRemote,
  stripUjatScheduleLegacyOverlay,
  stripUjatTypedLegacyOverlay,
  syncUjatTypedDetailPhysicalSchedulesRemote,
  typedDetailFromUjatBasicInfo,
  typedDetailFromUjatOverlay,
  type UjatTypedDetail,
} from './typed-detail-client'
import type { UjatBasicInfoFormValues } from '@/features/program/ujat/lib/ujat-basic-info-form'
import { stripUjatBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-basic-info-form'
import {
  fetchUjatRegionCapacitiesRemote,
  regionCapacityStateFromRows,
  replaceUjatRegionCapacitiesRemote,
} from './region-capacities-client'
import { ujatRegionCapacityUpsertsFromState } from '@/features/program/ujat/lib/ujat-kpi-wage-capacity-typed'

export type CreateInput = RegistrationSnapshot & {
  idempotencyKey: string
  /** Typed RHF snapshot for UJAT registration common information. */
  basicInfo?: Partial<UjatBasicInfoFormValues>
  typedDetail?: UjatTypedDetail
  /** Registration wizard canonical program snapshot, including recruitment rows. */
  program?: Program
  preparedFormBindings?: import('@/features/program/general/lib/build-registration-create-form-bindings').RegistrationCreateFormBindingsPayload | null
}

function assertRemoteReady(): void {
  if (shouldUseRemoteApi()) return
  throw new Error(
    'UJAT 프로그램 API가 활성화되지 않았습니다. 원격 JWT·programs/ujatPrograms 모듈 설정을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

function isTypedDetailRouteMissing(error: unknown): boolean {
  return (
    error != null &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404
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
  const dto = await fetchAdminProgramByIdRemote(programId)
  let typedDetail: UjatTypedDetail | undefined
  try {
    // The backend endpoint returns a typed document for both new and legacy programs. A missing
    // route on an older local backend must not make the existing read-only fallback disappear.
    typedDetail = await fetchUjatTypedDetailRemote(programId)
  } catch (error) {
    if (!isTypedDetailRouteMissing(error)) throw error
    typedDetail = undefined
  }
  const mapped = fromDetail(dto, typedDetail)
  // 지역별 정원은 프로그램 상세 JSON이 아닌 실행 도메인의 별도 테이블에 저장된다.
  // 상세 조회에서도 같은 값을 overlay에 주입해야 정보 탭이 0/빈 값으로 남지 않는다.
  let mappedWithRegionCapacities = mapped
  try {
    const capacities = await fetchUjatRegionCapacitiesRemote(programId)
    if (capacities.length > 0) {
      mappedWithRegionCapacities = {
        ...mapped,
        ujatRegionCapacity: regionCapacityStateFromRows(capacities),
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
  await awaitRecruitDetailMediaUploads()
  const collectedOverlay = collectUjatRegistrationCreateOverlay(input.overlay)
  const overlay = stripUjatTypedLegacyOverlay(
    input.basicInfo ? stripUjatBasicInfoOverlay(collectedOverlay) : collectedOverlay
  )
  const pending = input.program ??
    buildUjatProgramListRowFromRegistrationSnapshot({
      id: `ujat-pending-${input.idempotencyKey}`,
      overlay,
      basicInfo: input.basicInfo,
    })
  const created = fromDetail(
    await createAdminProgramRemoteWithRegistrationForms(
      pending,
      toCreateRequest(pending, { draft: input.draft, overlay }),
      input.preparedFormBindings
    )
  )
  try {
    // UJAT common/schedule/survey data is persisted in the versioned typed document. Recruitment
    // compatibility data may still be present in the create payload until its own row API is
    // fully migrated, but typed fields are no longer written as registration.overlay.
    const typedDetail = input.typedDetail ??
      (input.basicInfo
        ? typedDetailFromUjatBasicInfo(input.basicInfo)
        : typedDetailFromUjatOverlay(overlay))
    const savedTypedDetail = await replaceUjatTypedDetailRemote(created.id, typedDetail)
    await syncUjatTypedDetailPhysicalSchedulesRemote(created.id, savedTypedDetail)
    await bindUjatRecruitDetailMediaToRows(created, overlay)
    try {
      await replaceUjatRegionCapacitiesRemote(
        created.id,
        ujatRegionCapacityUpsertsFromState(
          pending.ujatRegionCapacity ?? input.basicInfo?.ujatRegionCapacity
        )
      )
    } catch (capacityError) {
      const error = capacityError instanceof Error ? capacityError : new Error(String(capacityError))
      ;(error as Error & { programId?: string; stage?: string }).programId = created.id
      ;(error as Error & { programId?: string; stage?: string }).stage = 'region-capacity'
      throw error
    }
    return (await detail(created.id)) ?? created
  } catch (error) {
    if ((error as { stage?: string }).stage === 'region-capacity') throw error
    await deleteAdminProgramRemote(created.id).catch(rollbackError => {
      console.error('[ujat registration] rollback created program failed', created.id, rollbackError)
    })
    throw error
  }
}

export async function update(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  assertRemoteReady()
  const current = await fetchAdminProgramByIdRemote(programId)
  let typedDetailBefore: UjatTypedDetail | undefined
  if (shouldPersistUjatTypedDetail(patch)) {
    try {
      typedDetailBefore = await fetchUjatTypedDetailRemote(programId)
    } catch (error) {
      if (!isTypedDetailRouteMissing(error)) throw error
      typedDetailBefore = undefined
    }
  }
  const registration = parseRegistrationSnapshot(current.serviceDetailJson)
  const persistedOverlay = parseRegistrationOverlay(current.serviceDetailJson)
  // 상세 수정 중 세션/드래프트 overlay를 registration에 합친다.
  // GET 스냅샷만 쓰면 대표·관리명 등 overlay 편집이 serviceDetailJson에 반영되지 않는다.
  // The common-info form is typed, but schedule/recruitment sub-editors are still on the
  // migration boundary. Accept an explicit legacy snapshot from the caller so those fields are
  // not silently lost while the corresponding typed sections are migrated.
  const patchOverlay =
    patch?.ujatRegistrationOverlay != null &&
    typeof patch.ujatRegistrationOverlay === 'object' &&
    !Array.isArray(patch.ujatRegistrationOverlay)
      ? patch.ujatRegistrationOverlay
      : undefined
  const editedOverlay = {
    ...readUjatRegistrationOverlayFromProgram(program),
    ...(patchOverlay ?? {}),
  }
  const mergedOverlay = stripUjatTypedLegacyOverlay(
    stripUjatScheduleLegacyOverlay({
      ...persistedOverlay,
      ...(registration?.overlay ?? {}),
      ...editedOverlay,
    })
  )
  const nextRegistration: RegistrationPersistSnapshot | undefined =
    Object.keys(mergedOverlay).length > 0
      ? {
          ...(registration?.draft ? { draft: registration.draft } : {}),
          overlay: mergedOverlay,
        }
      : registration
  const dto = await updateAdminProgramRemote(
    programId,
    toUpdateRequest(program, patch, nextRegistration, {
      // Do not discard legacy typed fields when an older backend has no Typed route yet. The
      // route-backed path strips them because the following PUT owns their canonical storage.
      stripTypedLegacyOverlay: typedDetailBefore !== undefined,
    })
  )
  if (typedDetailBefore !== undefined) {
    await replaceUjatTypedDetailRemote(
      programId,
      applyUjatProgramPatchToTypedDetail(typedDetailBefore, patch ?? {})
    )
  }
  // PATCH echo는 서버 정규화·clearFields 적용 결과의 최종 정본이 아니다.
  // 저장 직후 canonical GET을 다시 읽어 열린 상세와 다음 화면이 같은 값을 사용하게 한다.
  const canonical = await detail(programId)
  return canonical ?? fromDetail(dto)
}

function shouldPersistUjatTypedDetail(patch?: Partial<Program>): boolean {
  if (!patch) return true
  return [
    'generalSurveyMenuKeys',
    'generalParticipantTypes',
  ].some(key => Object.prototype.hasOwnProperty.call(patch, key))
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
