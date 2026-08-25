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
import { programHistoriesParamsFromFilters } from '@/features/sponsor/api/program-histories-filter-params'
import { sponsorsParamsFromSearchParams } from '@/features/sponsor/api/sponsor-filter-params'
import {
  addSponsorContactRemote,
  addYearlyBusinessRemote,
  bulkDeleteSponsorContactsRemote,
  bulkDeleteSponsorsRemote,
  createSponsorRemote,
  deleteSponsorRemote,
  endSponsorRemote,
  fetchProgramHistoriesRemote,
  fetchSponsorRemote,
  fetchSponsorsRemote,
  fetchYearlyBusinessesRemote,
  updateSponsorContactRemote,
  updateSponsorRemote,
  updateYearlyBusinessRemote,
} from '@/features/sponsor/api/sponsors-api-client'
import type {
  SponsorContactRow,
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorProgramHistoryFilters,
  SponsorProgramHistoryRow,
  SponsorYearlyBusinessRow,
} from '@/features/sponsor/model/sponsor-management.types'
import type { BasicInfoEditState } from '@/features/sponsor/ui/sponsor-detail-basic-info'
import type { SponsorContactRegisterPayload } from '@/features/sponsor/ui/modal/sponsor-contact-register-modal'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

function assertSponsorsRemoteReady(): void {
  if (!isRealApiModuleEnabled('sponsors')) {
    throw new Error('후원사 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 sponsors를 추가해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('후원사 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseSponsorsRemoteApi(): boolean {
  return isRealApiModuleEnabled('sponsors') && hasRemoteAdminJwt()
}

export async function getSponsorList(
  searchParams: URLSearchParams
): Promise<SponsorManagementRow[]> {
  assertSponsorsRemoteReady()
  const dtos = await fetchSponsorsRemote(sponsorsParamsFromSearchParams(searchParams))
  return dtos.map(mapSponsorResponse)
}

export async function getSponsorDetail(id: string): Promise<SponsorManagementDetailView> {
  assertSponsorsRemoteReady()
  const dto = await fetchSponsorRemote(id)
  return mapSponsorDetailResponse(dto)
}

/** 연도별 후원금 — 상세 GET과 분리. 상세 탭 패널에서만 호출한다. */
export async function getSponsorYearlyBusinesses(
  sponsorId: string
): Promise<SponsorYearlyBusinessRow[]> {
  assertSponsorsRemoteReady()
  const yearly = await fetchYearlyBusinessesRemote(sponsorId).catch(() => [])
  return yearly.map(mapYearlyBusinessResponse)
}

export async function createSponsor(row: SponsorManagementRow): Promise<SponsorManagementRow> {
  assertSponsorsRemoteReady()
  const dto = await createSponsorRemote(toSponsorRequestFromRegister(row))
  return mapSponsorResponse(dto)
}

export async function updateSponsorBasicInfo(
  sponsorId: string,
  basicInfo: BasicInfoEditState,
  existing: SponsorManagementDetailView
): Promise<SponsorManagementDetailView> {
  assertSponsorsRemoteReady()
  await updateSponsorRemote(sponsorId, toSponsorRequestFromBasicInfo(basicInfo, existing))
  return getSponsorDetail(sponsorId)
}

export async function updateSponsorStatus(
  sponsorId: string,
  sponsorshipStatus: NonNullable<SponsorManagementRow['sponsorshipStatus']>,
  existing: SponsorManagementRow
): Promise<void> {
  assertSponsorsRemoteReady()
  await updateSponsorRemote(sponsorId, {
    ...toSponsorRequestFromRegister(existing),
    sponsorshipStatus,
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

export async function endSponsorship(id: string): Promise<void> {
  assertSponsorsRemoteReady()
  await endSponsorRemote(id)
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
  return mapSponsorContactResponse(dto)
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
  size = 50
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

/** 후원사 셀렉트·이름 조회용 전체 목록 (필터 없음) */
export async function getSponsorOptionsList(): Promise<SponsorManagementRow[]> {
  return getSponsorList(new URLSearchParams())
}
