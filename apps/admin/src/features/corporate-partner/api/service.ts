import type {
  CorporatePartner,
  CorporatePartnerCreateInput,
  CorporatePartnerListFilter,
  CorporatePartnerUpdateInput,
} from '@/entities/corporate-partner/model/types'
import { shouldUseCorporatePartnerRemoteApi } from './capabilities'
import {
  countCorporatePartners,
  createCorporatePartner,
  readCorporatePartners,
  removeCorporatePartners,
  reorderCorporatePartners,
  setCorporatePartnerPublic,
  updateCorporatePartner,
} from './store'

const remoteError = 'Corporate partner remote API is not implemented yet'

export async function listCorporatePartnersService(
  filter?: CorporatePartnerListFilter
): Promise<CorporatePartner[]> {
  if (shouldUseCorporatePartnerRemoteApi()) throw new Error(remoteError)
  return readCorporatePartners(filter)
}

export async function countCorporatePartnersService(): Promise<number> {
  if (shouldUseCorporatePartnerRemoteApi()) throw new Error(remoteError)
  return countCorporatePartners()
}

export async function createCorporatePartnerService(
  input: CorporatePartnerCreateInput
): Promise<CorporatePartner> {
  if (shouldUseCorporatePartnerRemoteApi()) throw new Error(remoteError)
  return createCorporatePartner(input)
}

export async function updateCorporatePartnerService(
  id: string,
  patch: CorporatePartnerUpdateInput
): Promise<CorporatePartner> {
  if (shouldUseCorporatePartnerRemoteApi()) throw new Error(remoteError)
  return updateCorporatePartner(id, patch)
}

export async function removeCorporatePartnersService(ids: string[]): Promise<void> {
  if (shouldUseCorporatePartnerRemoteApi()) throw new Error(remoteError)
  removeCorporatePartners(ids)
}

export async function reorderCorporatePartnersService(
  orderedIds: string[]
): Promise<CorporatePartner[]> {
  if (shouldUseCorporatePartnerRemoteApi()) throw new Error(remoteError)
  return reorderCorporatePartners(orderedIds)
}

export async function setCorporatePartnerPublicService(
  id: string,
  isPublic: boolean
): Promise<CorporatePartner> {
  if (shouldUseCorporatePartnerRemoteApi()) throw new Error(remoteError)
  return setCorporatePartnerPublic(id, isPublic)
}
