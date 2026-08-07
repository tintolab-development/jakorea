import type { ParticipateMenuLinks } from '@/entities/participate/model/types'
import { shouldUseParticipateRemoteApi } from './capabilities'
import {
  readParticipateMenuLinks,
  saveParticipateMenuLinks as saveLocal,
} from './store'

export async function getParticipateMenuLinksService(): Promise<ParticipateMenuLinks> {
  if (shouldUseParticipateRemoteApi()) {
    throw new Error('Participate menu links remote API is not implemented yet')
  }
  return readParticipateMenuLinks()
}

export async function saveParticipateMenuLinksService(
  data: ParticipateMenuLinks
): Promise<ParticipateMenuLinks> {
  if (shouldUseParticipateRemoteApi()) {
    throw new Error('Participate menu links remote API is not implemented yet')
  }
  return saveLocal(data)
}
