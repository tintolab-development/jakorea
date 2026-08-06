import type { DirectionsInfo } from '@/entities/directions/model/types'
import { shouldUseDirectionsRemoteApi } from './capabilities'
import { readDirections, saveDirections as saveDirectionsLocal } from './store'

export async function getDirectionsService(): Promise<DirectionsInfo> {
  if (shouldUseDirectionsRemoteApi()) {
    throw new Error('Directions remote API is not implemented yet')
  }
  return readDirections()
}

export async function saveDirectionsService(
  data: DirectionsInfo
): Promise<DirectionsInfo> {
  if (shouldUseDirectionsRemoteApi()) {
    throw new Error('Directions remote API is not implemented yet')
  }
  return saveDirectionsLocal(data)
}
