import type { GlobalValue, GlobalValueTextPatch } from '@/entities/global-value/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseGlobalValueRemoteApi } from './capabilities'
import { mapGlobalValueResponseToDomain, toGlobalValueBulkRequest } from './mappers'
import {
  readGlobalValues,
  reorderGlobalValues as reorderLocal,
  setGlobalValueActive as setActiveLocal,
  updateGlobalValueTexts as updateTextsLocal,
} from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

async function listRemoteGlobalValues(): Promise<GlobalValue[]> {
  const response = await jaKoreaApi().globalValues()
  return (response ?? [])
    .map(mapGlobalValueResponseToDomain)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

async function putRemoteGlobalValues(rows: GlobalValue[]): Promise<GlobalValue[]> {
  const updated = await jaKoreaApi().updateGlobalValues(toGlobalValueBulkRequest(rows))
  return (updated ?? [])
    .map(mapGlobalValueResponseToDomain)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

async function resolveCurrentRows(cachedRows?: GlobalValue[]): Promise<GlobalValue[]> {
  if (cachedRows && cachedRows.length === 5) {
    return [...cachedRows].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return listRemoteGlobalValues()
}

function orderByIds(rows: GlobalValue[], orderedIds: string[]): GlobalValue[] {
  const byId = new Map(rows.map(row => [row.id, row]))
  const ordered: GlobalValue[] = []
  for (const id of orderedIds) {
    const row = byId.get(id)
    if (row) {
      ordered.push(row)
      byId.delete(id)
    }
  }
  for (const row of byId.values()) {
    ordered.push(row)
  }
  return ordered.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

export async function listGlobalValuesService(): Promise<GlobalValue[]> {
  if (shouldUseGlobalValueRemoteApi()) {
    return listRemoteGlobalValues()
  }
  return readGlobalValues()
}

export async function reorderGlobalValuesService(
  orderedIds: string[],
  cachedRows?: GlobalValue[],
): Promise<GlobalValue[]> {
  if (shouldUseGlobalValueRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    return putRemoteGlobalValues(orderByIds(current, orderedIds))
  }
  return reorderLocal(orderedIds)
}

export async function setGlobalValueActiveService(
  id: string,
  isActive: boolean,
  cachedRows?: GlobalValue[],
): Promise<GlobalValue[]> {
  if (shouldUseGlobalValueRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    const index = current.findIndex(row => row.id === id)
    if (index < 0) {
      throw new Error(`Global value not found: ${id}`)
    }
    const next = [...current]
    next[index] = { ...next[index]!, isActive }
    return putRemoteGlobalValues(next)
  }
  setActiveLocal(id, isActive)
  return readGlobalValues()
}

export async function saveGlobalValuesService(
  patches: GlobalValueTextPatch[],
  cachedRows?: GlobalValue[],
): Promise<GlobalValue[]> {
  if (shouldUseGlobalValueRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    const patchById = new Map(patches.map(p => [p.id, p]))
    const next = current.map(row => {
      const patch = patchById.get(row.id)
      if (!patch) return row
      return {
        ...row,
        mainText: patch.mainText,
        subText: patch.subText,
      }
    })
    return putRemoteGlobalValues(next)
  }
  return updateTextsLocal(patches)
}
