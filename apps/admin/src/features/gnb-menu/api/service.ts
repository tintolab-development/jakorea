import type { GnbMenuDoc } from '@/entities/gnb-menu/model/types'
import { shouldUseGnbMenuRemoteApi } from './capabilities'
import { readGnbMenu, saveGnbMenu as saveLocal } from './store'

const remoteError = 'GNB menu remote API is not implemented yet'

export async function getGnbMenuService(): Promise<GnbMenuDoc> {
  if (shouldUseGnbMenuRemoteApi()) throw new Error(remoteError)
  return readGnbMenu()
}

export async function saveGnbMenuService(doc: GnbMenuDoc): Promise<GnbMenuDoc> {
  if (shouldUseGnbMenuRemoteApi()) throw new Error(remoteError)
  return saveLocal(doc)
}
