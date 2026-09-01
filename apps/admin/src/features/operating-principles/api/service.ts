import type {
  OperatingPrinciplesDoc,
  OperatingPrinciplesSavePayload,
} from '@/entities/operating-principles/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { shouldUseOperatingPrinciplesRemoteApi } from './capabilities'
import { mapPrincipleManagementToDomain, toPrincipleUpdateRequest } from './mappers'
import {
  readOperatingPrinciples,
  reorderOperatingPrinciples as reorderLocal,
  saveOperatingPrinciplesContent as saveLocal,
  setPrincipleActive as setActiveLocal,
} from './store'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

async function getRemoteDoc(): Promise<OperatingPrinciplesDoc> {
  const response = await jaKoreaApi().principles()
  return mapPrincipleManagementToDomain(response)
}

async function putRemoteDoc(doc: OperatingPrinciplesDoc): Promise<OperatingPrinciplesDoc> {
  const updated = await jaKoreaApi().updatePrinciples(toPrincipleUpdateRequest(doc))
  return mapPrincipleManagementToDomain(updated)
}

async function resolveDoc(cached?: OperatingPrinciplesDoc): Promise<OperatingPrinciplesDoc> {
  if (cached && cached.principles.length === 5) {
    return {
      ...cached,
      principles: [...cached.principles].sort((a, b) => a.sortOrder - b.sortOrder),
    }
  }
  return getRemoteDoc()
}

function orderByIds(doc: OperatingPrinciplesDoc, orderedIds: string[]): OperatingPrinciplesDoc {
  const byId = new Map(doc.principles.map(row => [row.id, row]))
  const ordered = []
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
  return {
    ...doc,
    principles: ordered.map((row, index) => ({ ...row, sortOrder: index + 1 })),
  }
}

export async function getOperatingPrinciplesService(): Promise<OperatingPrinciplesDoc> {
  if (shouldUseOperatingPrinciplesRemoteApi()) {
    return getRemoteDoc()
  }
  return readOperatingPrinciples()
}

export async function reorderOperatingPrinciplesService(
  orderedIds: string[],
  cached?: OperatingPrinciplesDoc,
): Promise<OperatingPrinciplesDoc> {
  if (shouldUseOperatingPrinciplesRemoteApi()) {
    const current = await resolveDoc(cached)
    return putRemoteDoc(orderByIds(current, orderedIds))
  }
  return reorderLocal(orderedIds)
}

export async function setPrincipleActiveService(
  id: string,
  isActive: boolean,
  cached?: OperatingPrinciplesDoc,
): Promise<OperatingPrinciplesDoc> {
  if (shouldUseOperatingPrinciplesRemoteApi()) {
    const current = await resolveDoc(cached)
    const principles = current.principles.map(row =>
      row.id === id ? { ...row, isActive } : row,
    )
    return putRemoteDoc({ ...current, principles })
  }
  return setActiveLocal(id, isActive)
}

export async function saveOperatingPrinciplesService(
  payload: OperatingPrinciplesSavePayload,
  cached?: OperatingPrinciplesDoc,
): Promise<OperatingPrinciplesDoc> {
  if (shouldUseOperatingPrinciplesRemoteApi()) {
    const current = await resolveDoc(cached)
    const patchById = new Map(payload.principles.map(p => [p.id, p]))
    const principles = current.principles.map(row => {
      const patch = patchById.get(row.id)
      if (!patch) return row
      return {
        ...row,
        title: patch.title,
        subText: patch.subText,
      }
    })
    return putRemoteDoc({
      ...current,
      intro: {
        topSubText: payload.intro.topSubText.trim(),
        mainText: payload.intro.mainText.trimEnd(),
      },
      principles,
    })
  }
  return saveLocal(payload)
}
