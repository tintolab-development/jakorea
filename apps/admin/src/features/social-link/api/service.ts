import type { SocialLink, SocialLinkUrlPatch } from '@/entities/social-link/model/types'
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api'
import { shouldUseSocialLinkRemoteApi } from './capabilities'
import { mapSocialResponseToDomain, toSocialUpdateRequest } from './mappers'
import {
  readSocialLinks,
  reorderSocialLinks as reorderLocal,
  setSocialLinkActive as setActiveLocal,
  updateSocialLinkUrls as updateUrlsLocal,
} from './store'

function mainApi() {
  return getJAKoreaHomepageAdminAPIMainSubset()
}

async function listRemoteSocialLinks(): Promise<SocialLink[]> {
  const response = await mainApi().list1()
  return (response ?? [])
    .map(mapSocialResponseToDomain)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

async function putRemoteSocialLinks(rows: SocialLink[]): Promise<SocialLink[]> {
  const updated = await mainApi().update5(toSocialUpdateRequest(rows))
  return (updated ?? [])
    .map(mapSocialResponseToDomain)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** 캐시에 고정 6채널이 있으면 그대로 사용, 없으면 GET */
async function resolveCurrentRows(cachedRows?: SocialLink[]): Promise<SocialLink[]> {
  if (cachedRows && cachedRows.length === 6) {
    return [...cachedRows].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return listRemoteSocialLinks()
}

function orderByIds(rows: SocialLink[], orderedIds: string[]): SocialLink[] {
  const byId = new Map(rows.map(row => [row.id, row]))
  const ordered: SocialLink[] = []
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

export async function listSocialLinksService(): Promise<SocialLink[]> {
  if (shouldUseSocialLinkRemoteApi()) {
    return listRemoteSocialLinks()
  }
  return readSocialLinks()
}

export async function reorderSocialLinksService(
  orderedIds: string[],
  cachedRows?: SocialLink[],
): Promise<SocialLink[]> {
  if (shouldUseSocialLinkRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    return putRemoteSocialLinks(orderByIds(current, orderedIds))
  }
  return reorderLocal(orderedIds)
}

export async function setSocialLinkActiveService(
  id: string,
  isActive: boolean,
  cachedRows?: SocialLink[],
): Promise<SocialLink[]> {
  if (shouldUseSocialLinkRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    const index = current.findIndex(row => row.id === id)
    if (index < 0) {
      throw new Error(`Social link not found: ${id}`)
    }
    const next = current.map((row, i) => (i === index ? { ...row, isActive } : row))
    return putRemoteSocialLinks(next)
  }
  setActiveLocal(id, isActive)
  return readSocialLinks()
}

export async function saveSocialLinksService(
  patches: SocialLinkUrlPatch[],
  cachedRows?: SocialLink[],
): Promise<SocialLink[]> {
  if (shouldUseSocialLinkRemoteApi()) {
    const current = await resolveCurrentRows(cachedRows)
    const patchById = new Map(patches.map(p => [p.id, p.linkUrl]))
    const next = current.map(row => {
      if (!patchById.has(row.id)) return row
      return {
        ...row,
        linkUrl: (patchById.get(row.id) ?? '').trim(),
      }
    })
    return putRemoteSocialLinks(next)
  }
  return updateUrlsLocal(patches)
}
