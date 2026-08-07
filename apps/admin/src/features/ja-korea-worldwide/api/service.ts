import type { JaKoreaWorldwide } from '@/entities/ja-korea-worldwide/model/types'
import { shouldUseJaKoreaWorldwideRemoteApi } from './capabilities'
import {
  readJaKoreaWorldwide,
  saveJaKoreaWorldwide as saveJaKoreaWorldwideLocal,
} from './store'

export async function getJaKoreaWorldwideService(): Promise<JaKoreaWorldwide> {
  if (shouldUseJaKoreaWorldwideRemoteApi()) {
    throw new Error('JA Worldwide remote API is not implemented yet')
  }
  return readJaKoreaWorldwide()
}

export async function saveJaKoreaWorldwideService(
  data: JaKoreaWorldwide
): Promise<JaKoreaWorldwide> {
  if (shouldUseJaKoreaWorldwideRemoteApi()) {
    throw new Error('JA Worldwide remote API is not implemented yet')
  }
  return saveJaKoreaWorldwideLocal(data)
}
