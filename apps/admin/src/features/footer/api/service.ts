import type {
  FooterOrgInfo,
  FooterRelatedLogo,
  FooterRelatedLogoSaveInput,
  FooterTopMenu,
  FooterTopMenuPatch,
} from '@/entities/footer/model/types'
import { shouldUseFooterRemoteApi } from './capabilities'
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

function remoteNotReady(): never {
  throw new Error('Footer remote API is not implemented yet')
}

export async function listFooterTopMenusService(): Promise<FooterTopMenu[]> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return readFooterTopMenus()
}

export async function reorderFooterTopMenusService(
  orderedIds: string[]
): Promise<FooterTopMenu[]> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return reorderTopLocal(orderedIds)
}

export async function setFooterTopMenuActiveService(
  id: string,
  isActive: boolean
): Promise<FooterTopMenu> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return setTopActiveLocal(id, isActive)
}

export async function saveFooterTopMenusService(
  patches: FooterTopMenuPatch[]
): Promise<FooterTopMenu[]> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return saveTopLocal(patches)
}

export async function getFooterOrgInfoService(): Promise<FooterOrgInfo> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return readFooterOrgInfo()
}

export async function saveFooterOrgInfoService(data: FooterOrgInfo): Promise<FooterOrgInfo> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return saveOrgLocal(data)
}

export async function listFooterRelatedLogosService(): Promise<FooterRelatedLogo[]> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return readFooterRelatedLogos()
}

export async function reorderFooterRelatedLogosService(
  orderedIds: string[]
): Promise<FooterRelatedLogo[]> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return reorderRelatedLocal(orderedIds)
}

export async function setFooterRelatedLogoActiveService(
  id: string,
  isActive: boolean
): Promise<FooterRelatedLogo> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return setRelatedActiveLocal(id, isActive)
}

export async function saveFooterRelatedLogoService(
  input: FooterRelatedLogoSaveInput
): Promise<FooterRelatedLogo> {
  if (shouldUseFooterRemoteApi()) remoteNotReady()
  return saveRelatedLocal(input)
}
