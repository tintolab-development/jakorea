import type { LinkedSocialAccount } from './types'

const LINKED_STATUSES = new Set(['LINKED', 'CONNECTED'])

const UNLINKED_STATUSES = new Set([
  'NOT_LINKED',
  'UNLINKED',
  'DISCONNECTED',
  'NOT_CONNECTED',
  'AVAILABLE',
  'READY',
  'READY_TO_LINK',
])

export function isLinkedSocialAccountStatus(status?: string | null): boolean {
  const normalized = status?.trim().toUpperCase()
  if (!normalized) return false
  if (LINKED_STATUSES.has(normalized)) return true
  if (UNLINKED_STATUSES.has(normalized)) return false
  return false
}

export function isLinkedSocialAccount(
  account: Pick<LinkedSocialAccount, 'status' | 'linkedAt' | 'providerUserIdMasked'>
): boolean {
  const status = account.status?.trim()
  if (status) {
    return isLinkedSocialAccountStatus(status)
  }

  return Boolean(account.linkedAt?.trim() || account.providerUserIdMasked?.trim())
}

export function filterLinkedSocialAccounts(
  accounts: readonly LinkedSocialAccount[]
): LinkedSocialAccount[] {
  return accounts.filter(isLinkedSocialAccount)
}
