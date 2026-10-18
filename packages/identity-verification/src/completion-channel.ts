import type { IdentityMessage } from './types'

interface StoredIdentityCompletion {
  message: IdentityMessage
  publishedAt: number
}

const consumedCompletionKeys = new Set<string>()

function storageKey(prefix: string): string {
  return `${prefix}_completion`
}

function channelName(prefix: string): string {
  return `jakorea-identity:${prefix}`
}

function completionDedupeKey(prefix: string, message: IdentityMessage): string {
  if (message.type === 'IDENTITY_VERIFIED') {
    return `${prefix}:verified:${message.sessionId}`
  }
  if (message.type === 'IDENTITY_FAILED') {
    return `${prefix}:failed:${message.message ?? ''}`
  }
  return `${prefix}:cancelled`
}

function readStoredCompletion(prefix: string): IdentityMessage | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem(storageKey(prefix))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as StoredIdentityCompletion
    if (!parsed?.message || typeof parsed.message !== 'object' || !('type' in parsed.message)) {
      return null
    }
    return parsed.message
  } catch {
    return null
  }
}

export function publishIdentityCompletion(prefix: string, message: IdentityMessage): void {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored: StoredIdentityCompletion = {
        message,
        publishedAt: Date.now(),
      }
      localStorage.setItem(storageKey(prefix), JSON.stringify(stored))
    } catch {
      // private mode 등 — BroadcastChannel·postMessage만으로 진행
    }
  }

  if (typeof BroadcastChannel === 'undefined') {
    return
  }

  try {
    const channel = new BroadcastChannel(channelName(prefix))
    channel.postMessage(message)
    channel.close()
  } catch {
    // BroadcastChannel 미지원 브라우저는 storage·postMessage로 충분
  }
}

export function clearIdentityCompletion(prefix: string): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.removeItem(storageKey(prefix))
  } catch {
    // ignore
  }
}

export function takeIdentityCompletion(prefix: string): IdentityMessage | null {
  const message = readStoredCompletion(prefix)
  if (!message) {
    return null
  }

  const key = completionDedupeKey(prefix, message)
  if (consumedCompletionKeys.has(key)) {
    clearIdentityCompletion(prefix)
    return null
  }

  consumedCompletionKeys.add(key)
  clearIdentityCompletion(prefix)
  return message
}

export function subscribeIdentityCompletion(
  prefix: string,
  handler: (message: IdentityMessage) => void
): () => void {
  const dispatch = (message: IdentityMessage) => {
    const key = completionDedupeKey(prefix, message)
    if (consumedCompletionKeys.has(key)) {
      return
    }
    consumedCompletionKeys.add(key)
    clearIdentityCompletion(prefix)
    handler(message)
  }

  let channel: BroadcastChannel | null = null
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(channelName(prefix))
      channel.onmessage = event => {
        if (!event.data || typeof event.data !== 'object' || !('type' in event.data)) {
          return
        }
        dispatch(event.data as IdentityMessage)
      }
    } catch {
      channel = null
    }
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey(prefix) || !event.newValue) {
      return
    }
    try {
      const parsed = JSON.parse(event.newValue) as StoredIdentityCompletion
      if (parsed?.message) {
        dispatch(parsed.message)
      }
    } catch {
      // ignore malformed completion payload
    }
  }

  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener('storage', onStorage)
    channel?.close()
  }
}
