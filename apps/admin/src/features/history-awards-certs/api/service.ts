import type {
  AwardCreateInput,
  AwardItem,
  AwardListFilter,
  CertCreateInput,
  CertItem,
  CertListFilter,
  HistoryCreateInput,
  HistoryItem,
  HistoryListFilter,
} from '@/entities/history-awards-certs/model/types'
import { shouldUseHistoryAwardsCertsRemoteApi } from './capabilities'
import * as local from './store'

function assertLocal(): void {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    throw new Error('History/Awards/Certs remote API is not implemented yet')
  }
}

export async function listHistoryService(filter?: HistoryListFilter): Promise<HistoryItem[]> {
  assertLocal()
  return local.listHistoryItems(filter)
}
export async function createHistoryService(input: HistoryCreateInput): Promise<HistoryItem> {
  assertLocal()
  return local.createHistoryItem(input)
}
export async function updateHistoryService(
  id: string,
  input: HistoryCreateInput
): Promise<HistoryItem> {
  assertLocal()
  return local.updateHistoryItem(id, input)
}
export async function setHistoryPublicService(
  id: string,
  isPublic: boolean
): Promise<HistoryItem> {
  assertLocal()
  return local.setHistoryPublic(id, isPublic)
}
export async function removeHistoryService(ids: string[]): Promise<void> {
  assertLocal()
  local.removeHistoryItems(ids)
}

export async function listAwardService(filter?: AwardListFilter): Promise<AwardItem[]> {
  assertLocal()
  return local.listAwardItems(filter)
}
export async function createAwardService(input: AwardCreateInput): Promise<AwardItem> {
  assertLocal()
  return local.createAwardItem(input)
}
export async function updateAwardService(
  id: string,
  input: AwardCreateInput
): Promise<AwardItem> {
  assertLocal()
  return local.updateAwardItem(id, input)
}
export async function setAwardPublicService(id: string, isPublic: boolean): Promise<AwardItem> {
  assertLocal()
  return local.setAwardPublic(id, isPublic)
}
export async function removeAwardService(ids: string[]): Promise<void> {
  assertLocal()
  local.removeAwardItems(ids)
}

export async function listCertService(filter?: CertListFilter): Promise<CertItem[]> {
  assertLocal()
  return local.listCertItems(filter)
}
export async function createCertService(input: CertCreateInput): Promise<CertItem> {
  assertLocal()
  return local.createCertItem(input)
}
export async function updateCertService(id: string, input: CertCreateInput): Promise<CertItem> {
  assertLocal()
  return local.updateCertItem(id, input)
}
export async function setCertPublicService(id: string, isPublic: boolean): Promise<CertItem> {
  assertLocal()
  return local.setCertPublic(id, isPublic)
}
export async function removeCertService(ids: string[]): Promise<void> {
  assertLocal()
  local.removeCertItems(ids)
}
