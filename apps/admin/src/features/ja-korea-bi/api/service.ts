import type { JaKoreaBi } from '@/entities/ja-korea-bi/model/types'
import { shouldUseJaKoreaBiRemoteApi } from './capabilities'
import { readJaKoreaBi, saveJaKoreaBi as saveJaKoreaBiLocal } from './store'

export async function getJaKoreaBiService(): Promise<JaKoreaBi> {
  if (shouldUseJaKoreaBiRemoteApi()) {
    throw new Error('JA Korea BI remote API is not implemented yet')
  }
  return readJaKoreaBi()
}

export async function saveJaKoreaBiService(data: JaKoreaBi): Promise<JaKoreaBi> {
  if (shouldUseJaKoreaBiRemoteApi()) {
    throw new Error('JA Korea BI remote API is not implemented yet')
  }
  return saveJaKoreaBiLocal(data)
}
