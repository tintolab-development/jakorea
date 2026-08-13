import type { ParticipateMenuLinks } from '@/entities/participate/model/types'
import { getJAKoreaHomepageAdminAPIParticipationSubset } from '@/shared/api/generated/participation/participation-api'
import { shouldUseParticipateRemoteApi } from './capabilities'
import { mapLinkResponsesToDomain, toLinksUpdateRequest } from './mappers'
import {
  readParticipateMenuLinks,
  saveParticipateMenuLinks as saveLocal,
} from './store'

function participationApi() {
  return getJAKoreaHomepageAdminAPIParticipationSubset()
}

export async function getParticipateMenuLinksService(): Promise<ParticipateMenuLinks> {
  if (shouldUseParticipateRemoteApi()) {
    const rows = await participationApi().list()
    return mapLinkResponsesToDomain(rows ?? [])
  }
  return readParticipateMenuLinks()
}

export async function saveParticipateMenuLinksService(
  data: ParticipateMenuLinks,
): Promise<ParticipateMenuLinks> {
  if (shouldUseParticipateRemoteApi()) {
    const updated = await participationApi().update3(toLinksUpdateRequest(data))
    return mapLinkResponsesToDomain(updated ?? [])
  }
  return saveLocal(data)
}
