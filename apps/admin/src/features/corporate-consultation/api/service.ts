import type {
  CorporateConsultation,
  CorporateConsultationListFilter,
} from '@/entities/corporate-consultation/model/types'
import { shouldUseCorporateConsultationRemoteApi } from './capabilities'
import {
  confirmCorporateConsultations as confirmLocal,
  getCorporateConsultationWithPrivacyLog as getWithLogLocal,
  readCorporateConsultations,
  removeCorporateConsultations as removeLocal,
} from './store'

export async function listCorporateConsultationsService(
  filter: CorporateConsultationListFilter = {}
): Promise<CorporateConsultation[]> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    throw new Error('Corporate consultation remote API is not implemented yet')
  }
  return readCorporateConsultations(filter)
}

export async function getCorporateConsultationService(
  id: string,
  actorName?: string
): Promise<CorporateConsultation | null> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    throw new Error('Corporate consultation remote API is not implemented yet')
  }
  return getWithLogLocal(id, actorName)
}

export async function removeCorporateConsultationsService(ids: string[]): Promise<void> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    throw new Error('Corporate consultation remote API is not implemented yet')
  }
  removeLocal(ids)
}

export async function confirmCorporateConsultationsService(
  ids: string[],
  actorName?: string
): Promise<CorporateConsultation[]> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    throw new Error('Corporate consultation remote API is not implemented yet')
  }
  return confirmLocal(ids, actorName)
}
