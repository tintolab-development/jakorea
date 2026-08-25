import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import {
  assertBulkDeleteSucceeded,
  forEachBulkIdChunk,
  toBulkNumericIds,
} from '@/features/data-management/api/bulk-delete'
import { getJAKoreaCMSBackendAPIDataManagementSubset } from '@/shared/api/generated/data-management/data-management-api'
import type {
  BulkActionResponse,
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

const dmApi = getJAKoreaCMSBackendAPIDataManagementSubset()

/** OpenAPI path param은 number이나 실제 id는 string(UUID/문자열)일 수 있음 */
function pathId(id: string): number {
  const parsed = Number(id)
  return Number.isFinite(parsed) ? parsed : (id as unknown as number)
}

export async function fetchSponsorsRemote(params: SponsorsParams): Promise<SponsorResponse[]> {
  return unwrapApiBody(await dmApi.sponsors(params))
}

export async function fetchSponsorRemote(id: string): Promise<SponsorDetailResponse> {
  return unwrapApiBody(await dmApi.sponsor(pathId(id)))
}

export async function createSponsorRemote(body: SponsorRequest): Promise<SponsorResponse> {
  return unwrapApiBody(await dmApi.create3(body))
}

export async function updateSponsorRemote(
  id: string,
  body: SponsorRequest
): Promise<SponsorResponse> {
  return unwrapApiBody(await dmApi.update2(pathId(id), body))
}

export async function deleteSponsorRemote(id: string): Promise<void> {
  await dmApi.delete1(pathId(id))
}

export async function bulkDeleteSponsorsRemote(ids: string[]): Promise<void> {
  await forEachBulkIdChunk(ids, async chunk => {
    const result = unwrapApiBody<BulkActionResponse>(
      await dmApi.bulkDeleteSponsors({ ids: toBulkNumericIds(chunk) })
    )
    assertBulkDeleteSucceeded(result, '후원사 일괄 삭제에 실패했습니다.')
  })
}

export async function endSponsorRemote(id: string): Promise<void> {
  await dmApi.end(pathId(id))
}

export async function fetchSponsorContactsRemote(
  sponsorId: string
): Promise<SponsorContactResponse[]> {
  return unwrapApiBody(await dmApi.contacts(pathId(sponsorId)))
}

export async function addSponsorContactRemote(
  sponsorId: string,
  body: SponsorContactRequest
): Promise<SponsorContactResponse> {
  return unwrapApiBody(await dmApi.addContact(pathId(sponsorId), body))
}

export async function updateSponsorContactRemote(
  contactId: string,
  body: SponsorContactRequest
): Promise<SponsorContactResponse> {
  return unwrapApiBody(await dmApi.updateContact(pathId(contactId), body))
}

export async function deleteSponsorContactRemote(contactId: string): Promise<void> {
  await dmApi.deleteContact(pathId(contactId))
}

export async function bulkDeleteSponsorContactsRemote(ids: string[]): Promise<void> {
  await forEachBulkIdChunk(ids, async chunk => {
    const result = unwrapApiBody<BulkActionResponse>(
      await dmApi.bulkDeleteContacts({ ids: toBulkNumericIds(chunk) })
    )
    assertBulkDeleteSucceeded(result, '담당자 일괄 삭제에 실패했습니다.')
  })
}

export async function fetchYearlyBusinessesRemote(
  sponsorId: string
): Promise<SponsorYearlyBusinessResponse[]> {
  return unwrapApiBody(await dmApi.yearlyBusinesses(pathId(sponsorId)))
}

export async function addYearlyBusinessRemote(
  sponsorId: string,
  body: SponsorYearlyBusinessRequest
): Promise<SponsorYearlyBusinessResponse> {
  return unwrapApiBody(await dmApi.addYearlyBusiness(pathId(sponsorId), body))
}

export async function updateYearlyBusinessRemote(
  yearlyBusinessId: string,
  body: SponsorYearlyBusinessRequest
): Promise<SponsorYearlyBusinessResponse> {
  return unwrapApiBody(await dmApi.updateYearlyBusiness(pathId(yearlyBusinessId), body))
}

export async function deleteYearlyBusinessRemote(yearlyBusinessId: string): Promise<void> {
  await dmApi.deleteYearlyBusiness(pathId(yearlyBusinessId))
}

export async function fetchProgramHistoriesRemote(
  sponsorId: string,
  params?: ProgramHistoriesParams
): Promise<PageResponseSponsorProgramHistoryResponse> {
  return unwrapApiBody(await dmApi.programHistories(pathId(sponsorId), params))
}
