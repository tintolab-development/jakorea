import type { SocialLink, SocialLinkUrlPatch } from '@/entities/social-link/model/types'
import { shouldUseSocialLinkRemoteApi } from './capabilities'
import {
  readSocialLinks,
  reorderSocialLinks as reorderLocal,
  setSocialLinkActive as setActiveLocal,
  updateSocialLinkUrls as updateUrlsLocal,
} from './store'

export async function listSocialLinksService(): Promise<SocialLink[]> {
  if (shouldUseSocialLinkRemoteApi()) {
    throw new Error('Social link remote API is not implemented yet')
  }
  return readSocialLinks()
}

export async function reorderSocialLinksService(orderedIds: string[]): Promise<SocialLink[]> {
  if (shouldUseSocialLinkRemoteApi()) {
    throw new Error('Social link remote API is not implemented yet')
  }
  return reorderLocal(orderedIds)
}

export async function setSocialLinkActiveService(
  id: string,
  isActive: boolean
): Promise<SocialLink> {
  if (shouldUseSocialLinkRemoteApi()) {
    throw new Error('Social link remote API is not implemented yet')
  }
  return setActiveLocal(id, isActive)
}

export async function saveSocialLinksService(
  patches: SocialLinkUrlPatch[]
): Promise<SocialLink[]> {
  if (shouldUseSocialLinkRemoteApi()) {
    throw new Error('Social link remote API is not implemented yet')
  }
  return updateUrlsLocal(patches)
}
