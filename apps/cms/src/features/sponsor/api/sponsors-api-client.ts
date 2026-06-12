import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { getJAKoreaCMSBackendAPIDataManagementSubset } from '@/shared/api/generated/data-management/data-management-api'
import type {
  SponsorContactRequest,
  SponsorContactResponse,
  SponsorDetailResponse,
  SponsorRequest,
  SponsorResponse,
  SponsorsParams,
  SponsorYearlyBusinessRequest,
  SponsorYearlyBusinessResponse,
} from '@/shared/api/generated/data-management/schemas'

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
  return unwrapApiBody(await dmApi.create(body))
}

export async function updateSponsorRemote(
  id: string,
  body: SponsorRequest
): Promise<SponsorResponse> {
  return unwrapApiBody(await dmApi.update(pathId(id), body))
}

export async function deleteSponsorRemote(id: string): Promise<void> {
  await dmApi._delete(pathId(id))
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
