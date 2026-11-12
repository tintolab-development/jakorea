/**
 * QA-0137: 회원 access token 메모리 보관소.
 * - localStorage·sessionStorage 등 브라우저 저장소에 쓰지 않는다. 새로고침하면 사라지고 refresh로 다시 받는다.
 * - 같은 출처의 다른 탭과는 BroadcastChannel 메시지로만 주고받는다(메시지는 저장되지 않는다).
 *   다른 탭의 로그인·Refresh·로그아웃을 이 탭 메모리에도 반영하고, 새 탭은 열려 있는 탭에서 먼저 받아 refresh 횟수를 줄인다.
 *
 * node selfcheck에서 그대로 돌도록 `@/` 별칭 import를 쓰지 않는다.
 */

/** 이전 버전이 localStorage에 두던 access token 키. 시작 시 한 번 메모리로 옮기고 지운다. */
export const LEGACY_ACCESS_TOKEN_STORAGE_KEY = 'platform_auth_token'

const CHANNEL_NAME = 'platform:member-access-token'

type AccessTokenMessage =
  | { type: 'set'; accessToken: string }
  | { type: 'clear' }
  | { type: 'request'; requestId: string }
  | { type: 'response'; requestId: string; accessToken: string }

type ChannelLike = {
  postMessage: (message: AccessTokenMessage) => void
  onmessage: ((event: { data: unknown }) => void) | null
}

let accessToken: string | null = null
let channel: ChannelLike | null | undefined
const remoteChangeListeners = new Set<(token: string | null) => void>()
const pendingPeerRequests = new Map<string, (token: string | null) => void>()

function isAccessTokenMessage(value: unknown): value is AccessTokenMessage {
  if (!value || typeof value !== 'object') return false
  const type = (value as { type?: unknown }).type
  return type === 'set' || type === 'clear' || type === 'request' || type === 'response'
}

function handleChannelMessage(data: unknown) {
  if (!isAccessTokenMessage(data)) return
  switch (data.type) {
    case 'set':
      if (typeof data.accessToken !== 'string' || !data.accessToken) return
      if (accessToken === data.accessToken) return
      accessToken = data.accessToken
      notifyRemoteChange()
      return
    case 'clear':
      if (accessToken == null) return
      accessToken = null
      notifyRemoteChange()
      return
    case 'request':
      if (accessToken) {
        getChannel()?.postMessage({ type: 'response', requestId: data.requestId, accessToken })
      }
      return
    case 'response': {
      const resolve = pendingPeerRequests.get(data.requestId)
      if (!resolve || typeof data.accessToken !== 'string' || !data.accessToken) return
      pendingPeerRequests.delete(data.requestId)
      resolve(data.accessToken)
      return
    }
  }
}

function getChannel(): ChannelLike | null {
  if (channel !== undefined) return channel
  const Ctor = (globalThis as { BroadcastChannel?: new (name: string) => ChannelLike })
    .BroadcastChannel
  if (typeof Ctor !== 'function') {
    channel = null
    return channel
  }
  try {
    channel = new Ctor(CHANNEL_NAME)
    channel.onmessage = event => handleChannelMessage(event.data)
  } catch {
    channel = null
  }
  return channel
}

function notifyRemoteChange() {
  for (const listener of remoteChangeListeners) listener(accessToken)
}

export function readMemoryAccessToken(): string | null {
  return accessToken
}

/** 이 탭에서 토큰을 바꾼다(로그인·Refresh·로그아웃). 다른 탭에도 알린다. */
export function writeMemoryAccessToken(token: string | null): void {
  const next = token && token.length > 0 ? token : null
  accessToken = next
  const target = getChannel()
  if (!target) return
  target.postMessage(next ? { type: 'set', accessToken: next } : { type: 'clear' })
}

/** 다른 탭에서 받은 변경으로 이 탭 메모리 토큰이 바뀌었을 때 호출된다 */
export function subscribeRemoteAccessTokenChange(
  listener: (token: string | null) => void,
): () => void {
  remoteChangeListeners.add(listener)
  getChannel()
  return () => remoteChangeListeners.delete(listener)
}

/**
 * 다른 탭에서 쿠키 로그아웃 등으로 refresh 수단이 사라졌을 때(BroadcastChannel 미지원 대비) 메모리 토큰만 비운다.
 * 이 탭 메모리에 토큰이 있었으면 true.
 */
export function dropMemoryAccessTokenFromRemote(): boolean {
  if (accessToken == null) return false
  accessToken = null
  notifyRemoteChange()
  return true
}

let requestSequence = 0

/** 열려 있는 다른 탭에 access token을 요청한다. 없거나 timeout이면 null */
export function requestAccessTokenFromPeers(timeoutMs: number): Promise<string | null> {
  const target = getChannel()
  if (!target) return Promise.resolve(null)
  requestSequence += 1
  const requestId = `${Date.now().toString(36)}-${requestSequence}-${Math.random().toString(36).slice(2)}`
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      pendingPeerRequests.delete(requestId)
      resolve(null)
    }, timeoutMs)
    pendingPeerRequests.set(requestId, token => {
      clearTimeout(timer)
      if (token && accessToken == null) accessToken = token
      resolve(token)
    })
    target.postMessage({ type: 'request', requestId })
  })
}

/**
 * 이전 버전이 localStorage에 남긴 access token을 한 번 메모리로 옮기고 지운다.
 * 옮긴 토큰은 다른 탭에 알리지 않는다(각 탭이 같은 값을 갖고 시작한다).
 */
export function migrateLegacyPersistedAccessToken(storage: Pick<Storage, 'getItem' | 'removeItem'> | null): void {
  if (!storage) return
  let legacy: string | null = null
  try {
    legacy = storage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY)
    storage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    return
  }
  if (legacy && accessToken == null) accessToken = legacy
}

/** selfcheck 전용 — 모듈 상태 초기화 */
export function resetAccessTokenMemoryForTest(): void {
  accessToken = null
  channel = undefined
  remoteChangeListeners.clear()
  pendingPeerRequests.clear()
}
