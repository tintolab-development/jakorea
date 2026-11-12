import {
  mapProgramHistoryResponse,
  mapSponsorContactResponse,
  mapSponsorDetailResponse,
  mapSponsorResponse,
  mapYearlyBusinessResponse,
  shouldPersistYearlyBusinessRow,
  toSponsorContactRequest,
  toSponsorContactUpdateRequest,
  toSponsorRequestFromBasicInfo,
  toSponsorRequestFromRegister,
  toYearlyBusinessRequest,
} from '@/features/sponsor/api/adapters/sponsor-adapters'
import {
  programHistoriesParamsFromFilters,
  SPONSOR_PROGRAM_HISTORY_PAGE_SIZE,
} from '@/features/sponsor/api/program-histories-filter-params'
import { mapSponsorListPage } from '@/features/sponsor/api/map-sponsor-list-page'
import { fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'
import {
  SPONSOR_OPTIONS_LIST_SIZE,
  sponsorsParamsFromSearchParams,
} from '@/features/sponsor/api/sponsor-filter-params'
import type { SponsorResponse } from '@/shared/api/generated/data-management/schemas'
import type { DataManagementListPage } from '@/features/data-management/api/data-management-list-page'
import {
  addSponsorContactRemote,
  addYearlyBusinessRemote,
  bulkDeleteSponsorProgramHistoriesRemote,
  bulkDeleteSponsorContactsRemote,
  bulkDeleteSponsorsRemote,
  createSponsorRemote,
  deleteSponsorRemote,
  endSponsorRemote,
  fetchProgramHistoriesRemote,
  fetchSponsorContactsRemote,
  fetchSponsorRemote,
  fetchSponsorsRemote,
  fetchYearlyBusinessesRemote,
  type SponsorContactPrivacyMode,
  type SponsorContactsQueryParams,
  updateSponsorContactRemote,
  updateSponsorRemote,
  updateYearlyBusinessRemote,
} from '@/features/sponsor/api/sponsors-api-client'
import type {
  SponsorContactRow,
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorRegisterPayload,
  SponsorProgramHistoryFilters,
  SponsorProgramHistoryRow,
  SponsorYearlyBusinessRow,
} from '@/features/sponsor/model/sponsor-management.types'
import type { BasicInfoEditState } from '@/features/sponsor/ui/sponsor-detail-basic-info'
import type { SponsorContactRegisterPayload } from '@/features/sponsor/ui/modal/sponsor-contact-register-modal'
import {
  buildLogoFileIdsForPatch,
  sponsorLogosChanged,
  uploadSponsorLogoFiles,
} from '@/features/sponsor/lib/sponsor-logo-patch'
import { enrichSponsorLogoFiles } from '@/features/sponsor/lib/sponsor-logo-files'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertSponsorsRemoteReady(): void {
  if (!isRealApiModuleEnabled('sponsors')) {
    throw new Error('후원사 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('후원사 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseSponsorsRemoteApi(): boolean {
  return isRealApiModuleEnabled('sponsors') && hasRemoteAdminJwt()
}

export async function getSponsorListPage(
  searchParams: URLSearchParams,
  page = 0
): Promise<DataManagementListPage<SponsorManagementRow>> {
  assertSponsorsRemoteReady()
  const payload = await fetchSponsorsRemote(sponsorsParamsFromSearchParams(searchParams, page))
  return mapSponsorListPage(payload)
}

export async function getSponsorList(
  searchParams: URLSearchParams
): Promise<SponsorManagementRow[]> {
  const listPage = await getSponsorListPage(searchParams, 0)
  return listPage.items
}

async function withEnrichedLogosIfNeeded(
  detail: SponsorManagementDetailView
): Promise<SponsorManagementDetailView> {
  const needsEnrich = detail.logos.some(logo => !logo.fileName.trim())
  if (!needsEnrich) return detail
  const logos = await enrichSponsorLogoFiles(detail.logos)
  return logos === detail.logos ? detail : { ...detail, logos }
}

export async function getSponsorDetail(
  id: string,
  options?: { contactPrivacy?: SponsorContactPrivacyMode }
): Promise<SponsorManagementDetailView> {
  assertSponsorsRemoteReady()
  // 옵션이 없으면 기존 호출 그대로(데이터 관리 RAW). 프로그램 공통 정보 수정만 MASKED를 넘긴다.
  const dto = await (options ? fetchSponsorRemote(id, options) : fetchSponsorRemote(id))
  const detail = mapSponsorDetailResponse(dto)
  return withEnrichedLogosIfNeeded(detail)
}

/** 연도별 후원금 — 상세 GET과 분리. 상세 탭 패널에서만 호출한다. */
export async function getSponsorYearlyBusinesses(
  sponsorId: string
): Promise<SponsorYearlyBusinessRow[]> {
  assertSponsorsRemoteReady()
  const yearly = await fetchYearlyBusinessesRemote(sponsorId).catch(() => [])
  return yearly.map(mapYearlyBusinessResponse)
}

export async function createSponsor(payload: SponsorRegisterPayload): Promise<SponsorManagementRow> {
  assertSponsorsRemoteReady()
  const dto = await createSponsorRemote(toSponsorRequestFromRegister(payload))
  const row = mapSponsorResponse(dto)
  if (payload.logoFiles.length > 0 && row.id) {
    const sponsorId = Number(row.id)
    if (Number.isFinite(sponsorId) && sponsorId >= 1) {
      const logoFileIds = await uploadSponsorLogoFiles(sponsorId, payload.logoFiles)
      const updated = await updateSponsorRemote(row.id, {
        ...toSponsorRequestFromRegister(payload),
        logoFileIds,
      })
      return mapSponsorResponse(updated)
    }
  }
  return row
}

export async function updateSponsorBasicInfo(
  sponsorId: string,
  basicInfo: BasicInfoEditState,
  existing: SponsorManagementDetailView
): Promise<SponsorManagementDetailView> {
  assertSponsorsRemoteReady()
  const logosChanged = sponsorLogosChanged(existing.logos, basicInfo)
  const numericSponsorId = Number(sponsorId)
  let uploadedLogoIds: number[] = []
  if (
    basicInfo.pendingLogoFiles.length > 0 &&
    Number.isFinite(numericSponsorId) &&
    numericSponsorId >= 1
  ) {
    uploadedLogoIds = await uploadSponsorLogoFiles(numericSponsorId, basicInfo.pendingLogoFiles)
  }
  const writeBody = toSponsorRequestFromBasicInfo(basicInfo, existing)
  if (logosChanged) {
    writeBody.logoFileIds = buildLogoFileIdsForPatch(basicInfo.logos, uploadedLogoIds)
  }
  await updateSponsorRemote(sponsorId, writeBody)
  const dto = await fetchSponsorRemote(sponsorId)
  const detail = mapSponsorDetailResponse(dto)
  return withEnrichedLogosIfNeeded(detail)
}

export async function updateSponsorStatus(
  sponsorId: string,
  sponsorshipStatus: NonNullable<SponsorManagementRow['sponsorshipStatus']>,
  existing: SponsorManagementRow
): Promise<void> {
  assertSponsorsRemoteReady()
  await updateSponsorRemote(sponsorId, {
    name: existing.name,
    nameEn: existing.nameEn,
    organizationKind: existing.organizationKind,
    sponsorshipStatus,
    sponsorshipStartDate:
      existing.sponsorshipStartDate != null ? String(existing.sponsorshipStartDate) : undefined,
  })
}

export async function deleteSponsor(id: string): Promise<void> {
  assertSponsorsRemoteReady()
  await deleteSponsorRemote(id)
}

export async function deleteSponsors(ids: string[]): Promise<void> {
  assertSponsorsRemoteReady()
  if (ids.length === 1) {
    await deleteSponsorRemote(ids[0]!)
    return
  }
  await bulkDeleteSponsorsRemote(ids)
}

export async function deleteSponsorProgramHistories(
  sponsorId: string,
  programIds: string[]
): Promise<void> {
  assertSponsorsRemoteReady()
  await bulkDeleteSponsorProgramHistoriesRemote(sponsorId, programIds)
}

export async function endSponsorship(id: string): Promise<void> {
  assertSponsorsRemoteReady()
  await endSponsorRemote(id)
}

export async function getSponsorContacts(
  sponsorId: string,
  filters?: SponsorContactsQueryParams
): Promise<SponsorContactRow[]> {
  assertSponsorsRemoteReady()
  const dtos = await fetchSponsorContactsRemote(sponsorId, filters)
  return dtos.map(mapSponsorContactResponse).filter(row => row.id.length > 0)
}

export async function addSponsorContact(
  sponsorId: string,
  payload: SponsorContactRegisterPayload,
  contactType: SponsorContactRow['contactType']
): Promise<SponsorContactRow> {
  assertSponsorsRemoteReady()
  const dto = await addSponsorContactRemote(
    sponsorId,
    toSponsorContactRequest(payload, contactType)
  )
  return mapSponsorContactResponse(dto)
}

export async function updateSponsorContact(row: SponsorContactRow): Promise<SponsorContactRow> {
  assertSponsorsRemoteReady()
  const dto = await updateSponsorContactRemote(row.id, toSponsorContactUpdateRequest(row))
  if (!dto || typeof dto !== 'object') return row
  const mapped = mapSponsorContactResponse(dto)
  return {
    ...mapped,
    id: mapped.id || row.id,
    contactType:
      dto.contactType != null || dto.primary != null ? mapped.contactType : row.contactType,
  }
}

export async function deleteSponsorContacts(contactIds: string[]): Promise<void> {
  assertSponsorsRemoteReady()
  await bulkDeleteSponsorContactsRemote(contactIds)
}

export async function saveSponsorYearlyBusinesses(
  sponsorId: string,
  rows: SponsorYearlyBusinessRow[]
): Promise<void> {
  assertSponsorsRemoteReady()
  for (const row of rows) {
    if (!shouldPersistYearlyBusinessRow(row)) continue
    const body = toYearlyBusinessRequest(row)
    if (row.id) {
      await updateYearlyBusinessRemote(row.id, body)
    } else {
      await addYearlyBusinessRemote(sponsorId, body)
    }
  }
}

export interface SponsorProgramHistoriesPage {
  items: SponsorProgramHistoryRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export async function getSponsorProgramHistories(
  sponsorId: string,
  filters: SponsorProgramHistoryFilters,
  page = 0,
  size = SPONSOR_PROGRAM_HISTORY_PAGE_SIZE
): Promise<SponsorProgramHistoriesPage> {
  assertSponsorsRemoteReady()
  const dto = await fetchProgramHistoriesRemote(
    sponsorId,
    programHistoriesParamsFromFilters(filters, page, size)
  )
  return {
    items: (dto.items ?? []).map(mapProgramHistoryResponse),
    page: dto.page ?? page,
    size: dto.size ?? size,
    totalElements: dto.totalElements ?? 0,
    totalPages: dto.totalPages ?? 0,
  }
}

/** 후원사 셀렉트 드롭다운 — 페이지 단위 (기본 size 20) */
export async function getSponsorSelectOptionsPage(
  keyword = '',
  page = 0,
  size = SPONSOR_OPTIONS_LIST_SIZE
): Promise<DataManagementListPage<SponsorManagementRow>> {
  assertSponsorsRemoteReady()
  const params = new URLSearchParams()
  const trimmed = keyword.trim()
  if (trimmed) params.set('sp_name', trimmed)
  const payload = await fetchSponsorsRemote(
    sponsorsParamsFromSearchParams(params, page, size)
  )
  return mapSponsorListPage(payload)
}

/** 후원사 셀렉트·이름 조회용 목록 (구분 필터 없음, size=20 페이지 순회) */
export async function getSponsorOptionsList(): Promise<SponsorManagementRow[]> {
  assertSponsorsRemoteReady()
  const items = await fetchAllApiPages<SponsorResponse>(async (page, size) => {
    const payload = (await fetchSponsorsRemote({ page, size })) as {
      items?: SponsorResponse[]
      totalPages?: number
    }
    return { items: payload.items ?? [], totalPages: payload.totalPages }
  })
  return items.map(item => mapSponsorResponse(item))
}
