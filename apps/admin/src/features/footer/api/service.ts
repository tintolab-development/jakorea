import type {
  FooterAdminDoc,
  FooterOrgInfo,
  FooterOrgInfoSaveInput,
  FooterRelatedLogo,
  FooterRelatedLogoSaveInput,
  FooterTopMenu,
  FooterTopMenuPatch,
} from '@/entities/footer/model/types'
import { getJAKoreaHomepageAdminAPISiteSubset } from '@/shared/api/generated/site/site-api'
import { shouldUseFooterRemoteApi } from './capabilities'
import {
  mapFooterAdminResponseToDomain,
  mapFooterMenusToDomain,
  mapFooterOrganizationToDomain,
  mapFooterPartnerToDomain,
  mapFooterPartnersToDomain,
  toFooterMenusUpdateRequest,
  toFooterOrganizationUpdateRequest,
  toFooterPartnerOrderRequest,
  toFooterPartnerUpdateRequest,
} from './mappers'
import {
  readFooterOrgInfo,
  readFooterRelatedLogos,
  readFooterTopMenus,
  reorderFooterRelatedLogos as reorderRelatedLocal,
  reorderFooterTopMenus as reorderTopLocal,
  saveFooterOrgInfo as saveOrgLocal,
  saveFooterRelatedLogo as saveRelatedLocal,
  saveFooterTopMenus as saveTopLocal,
  setFooterRelatedLogoActive as setRelatedActiveLocal,
  setFooterTopMenuActive as setTopActiveLocal,
} from './store'
import { uploadFooterLogoAsset, uploadFooterPartnerLogoAsset } from './upload-footer-assets'

function siteApi() {
  return getJAKoreaHomepageAdminAPISiteSubset()
}

export async function getFooterAdminService(): Promise<FooterAdminDoc> {
  if (shouldUseFooterRemoteApi()) {
    return mapFooterAdminResponseToDomain(await siteApi().get8())
  }
  return {
    topMenus: readFooterTopMenus(),
    orgInfo: readFooterOrgInfo(),
    relatedLogos: readFooterRelatedLogos(),
  }
}

async function resolveCurrentMenus(cached?: FooterTopMenu[]): Promise<FooterTopMenu[]> {
  if (cached && cached.length === 7) {
    return [...cached].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return (await getFooterAdminService()).topMenus
}

async function resolveCurrentPartners(cached?: FooterRelatedLogo[]): Promise<FooterRelatedLogo[]> {
  if (cached && cached.length === 4) {
    return [...cached].sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return (await getFooterAdminService()).relatedLogos
}

function orderMenusByIds(rows: FooterTopMenu[], orderedIds: string[]): FooterTopMenu[] {
  const byId = new Map(rows.map(row => [row.id, row]))
  const ordered: FooterTopMenu[] = []
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

function orderPartnersByIds(rows: FooterRelatedLogo[], orderedIds: string[]): FooterRelatedLogo[] {
  const byId = new Map(rows.map(row => [row.id, row]))
  const ordered: FooterRelatedLogo[] = []
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

export async function listFooterTopMenusService(): Promise<FooterTopMenu[]> {
  return (await getFooterAdminService()).topMenus
}

export async function reorderFooterTopMenusService(
  orderedIds: string[],
  cachedRows?: FooterTopMenu[],
): Promise<FooterTopMenu[]> {
  if (shouldUseFooterRemoteApi()) {
    const current = await resolveCurrentMenus(cachedRows)
    const next = orderMenusByIds(current, orderedIds)
    const updated = await siteApi().updateMenus(toFooterMenusUpdateRequest(next))
    return mapFooterMenusToDomain(updated)
  }
  return reorderTopLocal(orderedIds)
}

export async function setFooterTopMenuActiveService(
  id: string,
  isActive: boolean,
  cachedRows?: FooterTopMenu[],
): Promise<FooterTopMenu[]> {
  if (shouldUseFooterRemoteApi()) {
    const current = await resolveCurrentMenus(cachedRows)
    const index = current.findIndex(row => row.id === id)
    if (index < 0) throw new Error(`Footer top menu not found: ${id}`)
    const next = [...current]
    next[index] = { ...next[index]!, isActive }
    const updated = await siteApi().updateMenus(toFooterMenusUpdateRequest(next))
    return mapFooterMenusToDomain(updated)
  }
  await setTopActiveLocal(id, isActive)
  return readFooterTopMenus()
}

export async function saveFooterTopMenusService(
  patches: FooterTopMenuPatch[],
  cachedRows?: FooterTopMenu[],
): Promise<FooterTopMenu[]> {
  if (shouldUseFooterRemoteApi()) {
    const current = await resolveCurrentMenus(cachedRows)
    const patchMap = new Map(patches.map(p => [p.id, p]))
    const next = current.map(row => {
      const patch = patchMap.get(row.id)
      if (!patch) return row
      return {
        ...row,
        linkUrl: row.isInternal ? row.linkUrl : patch.linkUrl.trim(),
      }
    })
    const updated = await siteApi().updateMenus(toFooterMenusUpdateRequest(next))
    return mapFooterMenusToDomain(updated)
  }
  return saveTopLocal(patches)
}

export async function getFooterOrgInfoService(): Promise<FooterOrgInfo> {
  return (await getFooterAdminService()).orgInfo
}

async function resolveOrgLogoAssetId(
  current: FooterOrgInfo,
  input: FooterOrgInfoSaveInput,
): Promise<number | undefined> {
  if (input.logoFile) {
    return uploadFooterLogoAsset(input.logoFile)
  }
  if (input.logoAssetId != null) {
    return input.logoAssetId
  }
  if (current.logoAssetId != null && input.logoUrl.trim()) {
    return current.logoAssetId
  }
  if (!input.logoUrl.trim()) {
    return undefined
  }
  throw new Error('기관 로고 asset이 없습니다. 이미지를 다시 등록해 주세요.')
}

export async function saveFooterOrgInfoService(
  input: FooterOrgInfoSaveInput,
  cached?: FooterOrgInfo,
): Promise<FooterOrgInfo> {
  if (shouldUseFooterRemoteApi()) {
    const current = cached ?? (await getFooterAdminService()).orgInfo
    const logoAssetId = await resolveOrgLogoAssetId(current, input)
    const updated = await siteApi().updateOrganization(
      toFooterOrganizationUpdateRequest(input, current.version, logoAssetId),
    )
    return mapFooterOrganizationToDomain(updated)
  }
  return saveOrgLocal({
    ...input,
    updatedAt: new Date().toISOString(),
    version: cached?.version ?? 0,
    logoAssetId: input.logoAssetId,
  })
}

export async function listFooterRelatedLogosService(): Promise<FooterRelatedLogo[]> {
  return (await getFooterAdminService()).relatedLogos
}

export async function reorderFooterRelatedLogosService(
  orderedIds: string[],
  cachedRows?: FooterRelatedLogo[],
): Promise<FooterRelatedLogo[]> {
  if (shouldUseFooterRemoteApi()) {
    const current = await resolveCurrentPartners(cachedRows)
    const next = orderPartnersByIds(current, orderedIds)
    const updated = await siteApi().reorderPartners(toFooterPartnerOrderRequest(next))
    return mapFooterPartnersToDomain(updated)
  }
  return reorderRelatedLocal(orderedIds)
}

export async function setFooterRelatedLogoActiveService(
  id: string,
  isActive: boolean,
  cachedRows?: FooterRelatedLogo[],
): Promise<FooterRelatedLogo> {
  if (shouldUseFooterRemoteApi()) {
    const current = await resolveCurrentPartners(cachedRows)
    const row = current.find(item => item.id === id)
    if (!row) throw new Error(`Footer partner not found: ${id}`)
    if (isActive && (!row.name.trim() || !row.logoAssetId)) {
      throw new Error('사용하려면 기관명과 로고가 필요합니다.')
    }
    const updated = await siteApi().updatePartner(
      row.partnerId,
      toFooterPartnerUpdateRequest({ ...row, isActive }, row.logoAssetId),
    )
    const mapped = mapFooterPartnerToDomain(updated)
    if (!mapped) throw new Error('Footer partner response mapping failed')
    return mapped
  }
  return setRelatedActiveLocal(id, isActive)
}

async function resolvePartnerLogoAssetId(
  current: FooterRelatedLogo,
  input: FooterRelatedLogoSaveInput,
): Promise<number | undefined> {
  if (input.logoFile) {
    return uploadFooterPartnerLogoAsset(input.logoFile)
  }
  if (input.logoAssetId != null) {
    return input.logoAssetId
  }
  if (current.logoAssetId != null && input.logoUrl.trim()) {
    return current.logoAssetId
  }
  if (!input.logoUrl.trim()) {
    return undefined
  }
  throw new Error('유관기관 로고 asset이 없습니다. 이미지를 다시 등록해 주세요.')
}

export async function saveFooterRelatedLogoService(
  input: FooterRelatedLogoSaveInput,
  cachedRows?: FooterRelatedLogo[],
): Promise<FooterRelatedLogo> {
  if (shouldUseFooterRemoteApi()) {
    const current = await resolveCurrentPartners(cachedRows)
    const row = current.find(item => item.id === input.id)
    if (!row) throw new Error(`Footer partner not found: ${input.id}`)
    const logoAssetId = await resolvePartnerLogoAssetId(row, input)
    const next: FooterRelatedLogo = {
      ...row,
      isActive: input.isActive,
      name: input.name,
      logoUrl: input.logoUrl,
      logoFileName: input.logoFileName,
      logoAssetId,
      hasContent: Boolean(input.name.trim() || input.logoUrl.trim()),
    }
    const updated = await siteApi().updatePartner(
      row.partnerId,
      toFooterPartnerUpdateRequest(next, logoAssetId),
    )
    const mapped = mapFooterPartnerToDomain(updated)
    if (!mapped) throw new Error('Footer partner response mapping failed')
    return mapped
  }
  return saveRelatedLocal(input)
}
