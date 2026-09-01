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
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseHistoryAwardsCertsRemoteApi } from './capabilities'
import {
  mapAwardResponseToDomain,
  mapCertResponseToDomain,
  mapHistoryResponseToDomain,
  toAwardCreateRequest,
  toAwardListParams,
  toAwardUpdateRequest,
  toBulkDeleteRequest,
  toCertCreateRequest,
  toCertListParams,
  toCertUpdateRequest,
  toHistoryCreateRequest,
  toHistoryListParams,
  toHistoryUpdateRequest,
  toPublishedToggleRequest,
} from './mappers'
import * as local from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

async function listRemoteHistory(filter?: HistoryListFilter): Promise<HistoryItem[]> {
  const response = await jaKoreaApi().history(toHistoryListParams(filter))
  return (response.items ?? []).map(mapHistoryResponseToDomain)
}

async function listRemoteAwards(filter?: AwardListFilter): Promise<AwardItem[]> {
  const response = await jaKoreaApi().awards(toAwardListParams(filter))
  return (response.items ?? []).map(mapAwardResponseToDomain)
}

async function listRemoteCerts(filter?: CertListFilter): Promise<CertItem[]> {
  const response = await jaKoreaApi().certifications(toCertListParams(filter))
  return (response.items ?? []).map(mapCertResponseToDomain)
}

async function getRemoteHistory(id: string): Promise<HistoryItem> {
  return mapHistoryResponseToDomain(await jaKoreaApi().historyDetail(Number(id)))
}

async function getRemoteAward(id: string): Promise<AwardItem> {
  return mapAwardResponseToDomain(await jaKoreaApi().awardDetail(Number(id)))
}

async function getRemoteCert(id: string): Promise<CertItem> {
  return mapCertResponseToDomain(await jaKoreaApi().certificationDetail(Number(id)))
}

async function resolveRow<T extends { id: string }>(
  id: string,
  cachedRows: T[] | undefined,
  fetchDetail: () => Promise<T>,
): Promise<T> {
  const found = cachedRows?.find(row => row.id === id)
  if (found) return found
  return fetchDetail()
}

async function resolveRowsByIds<T extends { id: string }>(
  ids: string[],
  cachedRows: T[] | undefined,
  fetchDetail: (id: string) => Promise<T>,
): Promise<T[]> {
  const byId = new Map((cachedRows ?? []).map(row => [row.id, row]))
  const rows: T[] = []
  for (const id of ids) {
    const cached = byId.get(id)
    rows.push(cached ?? (await fetchDetail(id)))
  }
  return rows
}

async function syncPublished<T extends { id: string; isPublic: boolean; version: number }>(
  current: T,
  wantPublic: boolean,
  toggle: (id: number, body: ReturnType<typeof toPublishedToggleRequest>) => Promise<T>,
): Promise<T> {
  if (current.isPublic === wantPublic) return current
  return toggle(Number(current.id), toPublishedToggleRequest(wantPublic, current.version))
}

export async function listHistoryService(filter?: HistoryListFilter): Promise<HistoryItem[]> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    return listRemoteHistory(filter)
  }
  return local.listHistoryItems(filter)
}

export async function createHistoryService(input: HistoryCreateInput): Promise<HistoryItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    let created = mapHistoryResponseToDomain(
      await jaKoreaApi().createHistory(toHistoryCreateRequest(input)),
    )
    created = await syncPublished(created, input.isPublic, async (id, body) =>
      mapHistoryResponseToDomain(await jaKoreaApi().toggleHistory(id, body)),
    )
    return created
  }
  return local.createHistoryItem(input)
}

export async function updateHistoryService(
  id: string,
  input: HistoryCreateInput,
  cachedRows?: HistoryItem[],
): Promise<HistoryItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    const current = await resolveRow(id, cachedRows, () => getRemoteHistory(id))
    let updated = mapHistoryResponseToDomain(
      await jaKoreaApi().updateHistory(Number(id), toHistoryUpdateRequest(input, current.version)),
    )
    updated = await syncPublished(updated, input.isPublic, async (rowId, body) =>
      mapHistoryResponseToDomain(await jaKoreaApi().toggleHistory(rowId, body)),
    )
    return updated
  }
  return local.updateHistoryItem(id, input)
}

export async function setHistoryPublicService(
  id: string,
  isPublic: boolean,
  cachedRows?: HistoryItem[],
): Promise<HistoryItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    const current = await resolveRow(id, cachedRows, () => getRemoteHistory(id))
    return mapHistoryResponseToDomain(
      await jaKoreaApi().toggleHistory(
        Number(id),
        toPublishedToggleRequest(isPublic, current.version),
      ),
    )
  }
  return local.setHistoryPublic(id, isPublic)
}

export async function removeHistoryService(
  ids: string[],
  cachedRows?: HistoryItem[],
): Promise<void> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    if (ids.length === 0) return
    const rows = await resolveRowsByIds(ids, cachedRows, getRemoteHistory)
    if (rows.length === 1) {
      const row = rows[0]!
      await jaKoreaApi().deleteHistory(Number(row.id), { version: row.version })
      return
    }
    await jaKoreaApi().deleteHistoryBulk(toBulkDeleteRequest(rows))
    return
  }
  local.removeHistoryItems(ids)
}

export async function listAwardService(filter?: AwardListFilter): Promise<AwardItem[]> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    return listRemoteAwards(filter)
  }
  return local.listAwardItems(filter)
}

export async function createAwardService(input: AwardCreateInput): Promise<AwardItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    let created = mapAwardResponseToDomain(
      await jaKoreaApi().createAward(toAwardCreateRequest(input)),
    )
    created = await syncPublished(created, input.isPublic, async (id, body) =>
      mapAwardResponseToDomain(await jaKoreaApi().toggleAward(id, body)),
    )
    return created
  }
  return local.createAwardItem(input)
}

export async function updateAwardService(
  id: string,
  input: AwardCreateInput,
  cachedRows?: AwardItem[],
): Promise<AwardItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    const current = await resolveRow(id, cachedRows, () => getRemoteAward(id))
    let updated = mapAwardResponseToDomain(
      await jaKoreaApi().updateAward(Number(id), toAwardUpdateRequest(input, current.version)),
    )
    updated = await syncPublished(updated, input.isPublic, async (rowId, body) =>
      mapAwardResponseToDomain(await jaKoreaApi().toggleAward(rowId, body)),
    )
    return updated
  }
  return local.updateAwardItem(id, input)
}

export async function setAwardPublicService(
  id: string,
  isPublic: boolean,
  cachedRows?: AwardItem[],
): Promise<AwardItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    const current = await resolveRow(id, cachedRows, () => getRemoteAward(id))
    return mapAwardResponseToDomain(
      await jaKoreaApi().toggleAward(
        Number(id),
        toPublishedToggleRequest(isPublic, current.version),
      ),
    )
  }
  return local.setAwardPublic(id, isPublic)
}

export async function removeAwardService(
  ids: string[],
  cachedRows?: AwardItem[],
): Promise<void> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    if (ids.length === 0) return
    const rows = await resolveRowsByIds(ids, cachedRows, getRemoteAward)
    if (rows.length === 1) {
      const row = rows[0]!
      await jaKoreaApi().deleteAward(Number(row.id), { version: row.version })
      return
    }
    await jaKoreaApi().deleteAwards(toBulkDeleteRequest(rows))
    return
  }
  local.removeAwardItems(ids)
}

export async function listCertService(filter?: CertListFilter): Promise<CertItem[]> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    return listRemoteCerts(filter)
  }
  return local.listCertItems(filter)
}

export async function createCertService(input: CertCreateInput): Promise<CertItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    let created = mapCertResponseToDomain(
      await jaKoreaApi().createCertification(toCertCreateRequest(input)),
    )
    created = await syncPublished(created, input.isPublic, async (id, body) =>
      mapCertResponseToDomain(await jaKoreaApi().toggleCertification(id, body)),
    )
    return created
  }
  return local.createCertItem(input)
}

export async function updateCertService(
  id: string,
  input: CertCreateInput,
  cachedRows?: CertItem[],
): Promise<CertItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    const current = await resolveRow(id, cachedRows, () => getRemoteCert(id))
    let updated = mapCertResponseToDomain(
      await jaKoreaApi().updateCertification(
        Number(id),
        toCertUpdateRequest(input, current.version),
      ),
    )
    updated = await syncPublished(updated, input.isPublic, async (rowId, body) =>
      mapCertResponseToDomain(await jaKoreaApi().toggleCertification(rowId, body)),
    )
    return updated
  }
  return local.updateCertItem(id, input)
}

export async function setCertPublicService(
  id: string,
  isPublic: boolean,
  cachedRows?: CertItem[],
): Promise<CertItem> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    const current = await resolveRow(id, cachedRows, () => getRemoteCert(id))
    return mapCertResponseToDomain(
      await jaKoreaApi().toggleCertification(
        Number(id),
        toPublishedToggleRequest(isPublic, current.version),
      ),
    )
  }
  return local.setCertPublic(id, isPublic)
}

export async function removeCertService(
  ids: string[],
  cachedRows?: CertItem[],
): Promise<void> {
  if (shouldUseHistoryAwardsCertsRemoteApi()) {
    if (ids.length === 0) return
    const rows = await resolveRowsByIds(ids, cachedRows, getRemoteCert)
    if (rows.length === 1) {
      const row = rows[0]!
      await jaKoreaApi().deleteCertification(Number(row.id), { version: row.version })
      return
    }
    await jaKoreaApi().deleteCertifications(toBulkDeleteRequest(rows))
    return
  }
  local.removeCertItems(ids)
}
