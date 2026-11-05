import axios from 'axios'
import type {
  OperatingPrinciplesDoc,
  OperatingPrinciplesSavePayload,
} from '@/entities/operating-principles/model/types'
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api'
import { isOptimisticLockConflictError } from '@/shared/lib/api-error-message'
import {
  applyFreshPrincipleLock,
  mapPrincipleManagementToDomain,
  toPrincipleUpdateRequest,
} from './mappers'

function jaKoreaApi() {
  return getJAKoreaHomepageAdminAPIJAKoreaSubset()
}

async function getRemoteDoc(): Promise<OperatingPrinciplesDoc> {
  const response = await jaKoreaApi().principles()
  return mapPrincipleManagementToDomain(response)
}

function isPrincipleLockConflict(error: unknown): boolean {
  if (isOptimisticLockConflictError(error)) return true
  return axios.isAxiosError(error) && error.response?.status === 409
}

async function putRemoteDoc(doc: OperatingPrinciplesDoc): Promise<OperatingPrinciplesDoc> {
  try {
    const updated = await jaKoreaApi().updatePrinciples(toPrincipleUpdateRequest(doc))
    return mapPrincipleManagementToDomain(updated)
  } catch (error) {
    if (!isPrincipleLockConflict(error)) throw error
    const fresh = await getRemoteDoc()
    const retried = await jaKoreaApi().updatePrinciples(
      toPrincipleUpdateRequest(applyFreshPrincipleLock(doc, fresh)),
    )
    return mapPrincipleManagementToDomain(retried)
  }
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
  return getRemoteDoc()
}

export async function reorderOperatingPrinciplesService(
  orderedIds: string[],
  cached?: OperatingPrinciplesDoc,
): Promise<OperatingPrinciplesDoc> {
  const current = await resolveDoc(cached)
  return putRemoteDoc(orderByIds(current, orderedIds))
}

export async function setPrincipleActiveService(
  id: string,
  isActive: boolean,
  cached?: OperatingPrinciplesDoc,
): Promise<OperatingPrinciplesDoc> {
  const current = await resolveDoc(cached)
  const principles = current.principles.map(row =>
    row.id === id ? { ...row, isActive } : row,
  )
  return putRemoteDoc({ ...current, principles })
}

export async function saveOperatingPrinciplesService(
  payload: OperatingPrinciplesSavePayload,
  cached?: OperatingPrinciplesDoc,
): Promise<OperatingPrinciplesDoc> {
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
