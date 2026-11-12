import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  assertBulkDeleteSucceeded,
  forEachBulkIdChunk,
  toBulkNumericIds,
} from '@/features/data-management/api/bulk-delete'
import { getDataManagementSubsetApi } from '@/features/data-management/api/data-management-subset-api'
import customInstance from '@/shared/api/orval-mutator'
import type { SponsorWriteRequest } from '@/features/sponsor/api/adapters/sponsor-adapters'
import type {
  BulkActionResponse,
  ContactsParams,
  ProgramHistoriesParams,
  SponsorContactRequest,
  SponsorContactResponse,
  SponsorDetailResponse,
  SponsorRequest,
  SponsorResponse,
  SponsorsParams,
  SponsorYearlyBusinessRequest,
  SponsorYearlyBusinessResponse,
} from '@/shared/api/generated/data-management/schemas'
import type { PageResponseSponsorProgramHistoryResponse } from '@/shared/api/generated/data-management/schemas/pageResponseSponsorProgramHistoryResponse'


/** OpenAPI path param은 number이나 실제 id는 string(UUID/문자열)일 수 있음 */
function pathId(id: string): number {
  const parsed = Number(id)
  return Number.isFinite(parsed) ? parsed : (id as unknown as number)
}

export async function fetchSponsorsRemote(
  params: SponsorsParams & {
    sponsorshipStartDateFrom?: string
    sponsorshipStartDateTo?: string
    page?: number
    size?: number
  }
): Promise<unknown> {
  return unwrapApiBody(await getDataManagementSubsetApi().sponsors(params))
}

/**
 * 후원사 담당자 연락처 노출 모드 — `contactPrivacy` 쿼리(기본 RAW).
 * RAW: 데이터 관리 > 후원사 담당자 정보(원문 + 고정 사유 자동 기록, CMS-17).
 * MASKED: 프로그램 공통 정보 수정의 담당자 선택지(마스킹, 기록 없음, 정책 32·37). 서버 반영 전에는 무시된다.
 */
export type SponsorContactPrivacyMode = 'RAW' | 'MASKED'

export async function fetchSponsorRemote(
  id: string,
  options?: { contactPrivacy?: SponsorContactPrivacyMode }
): Promise<SponsorDetailResponse> {
  const contactPrivacy = options?.contactPrivacy
  return unwrapApiBody(
    await getDataManagementSubsetApi().sponsor(
      pathId(id),
      contactPrivacy ? { params: { contactPrivacy } } : undefined
    )
  )
}

export async function createSponsorRemote(body: SponsorWriteRequest): Promise<SponsorResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().create4(body))
}

export async function updateSponsorRemote(
  id: string,
  body: SponsorRequest
): Promise<SponsorResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().update4(pathId(id), body))
}

export async function deleteSponsorRemote(id: string): Promise<void> {
  await getDataManagementSubsetApi().delete2(pathId(id))
}

export async function bulkDeleteSponsorsRemote(ids: string[]): Promise<void> {
  await forEachBulkIdChunk(ids, async chunk => {
    const numericIds = chunk.map(id => Number(id))
    if (numericIds.some(id => !Number.isSafeInteger(id) || id < 1)) {
      throw new Error('삭제할 후원사 ID가 올바르지 않습니다.')
    }
    const result = unwrapApiBody<BulkActionResponse>(
      await getDataManagementSubsetApi().bulkDeleteSponsors({ ids: numericIds })
    )
    assertBulkDeleteSucceeded(result, '후원사 일괄 삭제에 실패했습니다.')
  })
}

export async function bulkDeleteSponsorProgramHistoriesRemote(
  sponsorId: string,
  programIds: string[]
): Promise<void> {
  await forEachBulkIdChunk(programIds, async chunk => {
    const numericProgramIds = chunk.map(Number)
    if (
      numericProgramIds.some(
        programId => !Number.isSafeInteger(programId) || programId < 1
      )
    ) {
      throw new Error('삭제할 프로그램 ID 형식이 올바르지 않습니다.')
    }
    // 생성 스펙에서 deprecated bulk-delete가 빠졌다. 후원사 화면이 쓰던 path는 유지한다.
    const result = unwrapApiBody<BulkActionResponse>(
      await customInstance({
        url: `/api/admin/sponsors/${pathId(sponsorId)}/program-histories/bulk-delete`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { ids: numericProgramIds },
      })
    )
    assertBulkDeleteSucceeded(result, '후원사 프로그램 후원 이력 삭제에 실패했습니다.')
  })
}

export async function endSponsorRemote(id: string): Promise<void> {
  await getDataManagementSubsetApi().end(pathId(id))
}

export type SponsorContactsQueryParams = {
  department?: string
  position?: string
  name?: string
  /** 생략하면 서버 기본(RAW). 프로그램 공통 정보 수정 선택지는 MASKED */
  contactPrivacy?: SponsorContactPrivacyMode
}

function unwrapSponsorContactList(payload: unknown): SponsorContactResponse[] {
  const body = unwrapApiBody<
    SponsorContactResponse[] | { content?: SponsorContactResponse[]; items?: SponsorContactResponse[] }
  >(payload)
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    if (Array.isArray(body.content)) return body.content
    if (Array.isArray(body.items)) return body.items
  }
  return []
}

export async function fetchSponsorContactsRemote(
  sponsorId: string,
  params?: SponsorContactsQueryParams
): Promise<SponsorContactResponse[]> {
  const query = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value != null && String(value).trim() !== '')
      )
    : undefined
  const contactsParams =
    query && Object.keys(query).length > 0 ? (query as ContactsParams) : undefined
  const payload = await getDataManagementSubsetApi().contacts(pathId(sponsorId), contactsParams)
  return unwrapSponsorContactList(payload)
}

export async function addSponsorContactRemote(
  sponsorId: string,
  body: SponsorContactRequest
): Promise<SponsorContactResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().addContact(pathId(sponsorId), body))
}

export async function updateSponsorContactRemote(
  contactId: string,
  body: SponsorContactRequest
): Promise<SponsorContactResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().updateContact(pathId(contactId), body))
}

export async function deleteSponsorContactRemote(contactId: string): Promise<void> {
  await getDataManagementSubsetApi().deleteContact(pathId(contactId))
}

export async function bulkDeleteSponsorContactsRemote(ids: string[]): Promise<void> {
  await forEachBulkIdChunk(ids, async chunk => {
    const result = unwrapApiBody<BulkActionResponse>(
      await getDataManagementSubsetApi().bulkDeleteContacts({ ids: toBulkNumericIds(chunk) })
    )
    assertBulkDeleteSucceeded(result, '담당자 일괄 삭제에 실패했습니다.')
  })
}

export async function fetchYearlyBusinessesRemote(
  sponsorId: string
): Promise<SponsorYearlyBusinessResponse[]> {
  return unwrapApiBody(await getDataManagementSubsetApi().yearlyBusinesses(pathId(sponsorId)))
}

export async function addYearlyBusinessRemote(
  sponsorId: string,
  body: SponsorYearlyBusinessRequest
): Promise<SponsorYearlyBusinessResponse> {
  // OpenAPI subset currently omits POST; keep runtime path used by CMS sponsor UI.
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/sponsors/${pathId(sponsorId)}/yearly-businesses`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  )
}

export async function updateYearlyBusinessRemote(
  yearlyBusinessId: string,
  body: SponsorYearlyBusinessRequest
): Promise<SponsorYearlyBusinessResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().updateYearlyBusiness(pathId(yearlyBusinessId), body))
}

export async function deleteYearlyBusinessRemote(yearlyBusinessId: string): Promise<void> {
  // OpenAPI subset currently omits DELETE; keep runtime path used by CMS sponsor UI.
  await customInstance({
    url: `/api/admin/sponsors/yearly-businesses/${pathId(yearlyBusinessId)}`,
    method: 'DELETE',
  })
}

export async function fetchProgramHistoriesRemote(
  sponsorId: string,
  params?: ProgramHistoriesParams & { participantType?: string }
): Promise<PageResponseSponsorProgramHistoryResponse> {
  return unwrapApiBody(await getDataManagementSubsetApi().programHistories(pathId(sponsorId), params))
}
