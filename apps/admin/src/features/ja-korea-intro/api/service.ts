import type { JaKoreaIntro } from '@/entities/ja-korea-intro/model/types'
import { shouldUseJaKoreaIntroRemoteApi } from './capabilities'
import { readJaKoreaIntro, saveJaKoreaIntro as saveJaKoreaIntroLocal } from './store'

export async function getJaKoreaIntroService(): Promise<JaKoreaIntro> {
  if (shouldUseJaKoreaIntroRemoteApi()) {
    throw new Error('JA Korea intro remote API is not implemented yet')
  }
  return readJaKoreaIntro()
}

export async function saveJaKoreaIntroService(data: JaKoreaIntro): Promise<JaKoreaIntro> {
  if (shouldUseJaKoreaIntroRemoteApi()) {
    throw new Error('JA Korea intro remote API is not implemented yet')
  }
  return saveJaKoreaIntroLocal(data)
}
