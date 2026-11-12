/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/access-token-memory.selfcheck.ts
 *
 * QA-0137: 회원 access token은 메모리에만 두고 브라우저 저장소에 쓰지 않는다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  dropMemoryAccessTokenFromRemote,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  migrateLegacyPersistedAccessToken,
  readMemoryAccessToken,
  requestAccessTokenFromPeers,
  resetAccessTokenMemoryForTest,
  subscribeRemoteAccessTokenChange,
  writeMemoryAccessToken,
} from './access-token-memory.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

/** 같은 이름 채널끼리 다른 인스턴스(=다른 탭)에만 전달하는 가짜 BroadcastChannel */
type FakeMessageHandler = ((event: { data: unknown }) => void) | null
const bus = new Set<FakeChannel>()
class FakeChannel {
  readonly name: string
  onmessage: FakeMessageHandler = null
  readonly sent: unknown[] = []
  constructor(name: string) {
    this.name = name
    bus.add(this)
  }
  postMessage(data: unknown) {
    this.sent.push(data)
    for (const other of bus) {
      if (other !== this && other.name === this.name) other.onmessage?.({ data })
    }
  }
}
;(globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = FakeChannel

function createPeerTab(): FakeChannel {
  return new FakeChannel('platform:member-access-token')
}

async function main() {
  // 1) 로그인·Refresh: 메모리에만 두고 다른 탭에 알린다
  resetAccessTokenMemoryForTest()
  bus.clear()
  const peer = createPeerTab()
  const peerReceived: unknown[] = []
  peer.onmessage = event => peerReceived.push(event.data)
  writeMemoryAccessToken('access-1')
  assert(readMemoryAccessToken() === 'access-1', 'set keeps token in memory')
  assert(
    JSON.stringify(peerReceived) === JSON.stringify([{ type: 'set', accessToken: 'access-1' }]),
    'set is broadcast to other tabs',
  )

  // 2) 로그아웃: 메모리에서 지우고 다른 탭에도 지우라고 알린다
  writeMemoryAccessToken(null)
  assert(readMemoryAccessToken() === null, 'logout clears memory token')
  assert(
    JSON.stringify(peerReceived[1]) === JSON.stringify({ type: 'clear' }),
    'logout is broadcast to other tabs',
  )

  // 3) 다른 탭의 로그인·로그아웃 수신
  resetAccessTokenMemoryForTest()
  bus.clear()
  const otherTab = createPeerTab()
  const remoteChanges: (string | null)[] = []
  subscribeRemoteAccessTokenChange(token => remoteChanges.push(token))
  otherTab.postMessage({ type: 'set', accessToken: 'from-other-tab' })
  assert(readMemoryAccessToken() === 'from-other-tab', 'receives token from other tab')
  otherTab.postMessage({ type: 'clear' })
  assert(readMemoryAccessToken() === null, 'receives logout from other tab')
  assert(
    JSON.stringify(remoteChanges) === JSON.stringify(['from-other-tab', null]),
    'remote changes notify subscribers',
  )
  otherTab.postMessage({ type: 'set', accessToken: '' })
  otherTab.postMessage({ hello: 'world' })
  assert(readMemoryAccessToken() === null, 'ignores malformed messages')

  // 4) 새 탭: 열려 있는 탭이 응답하면 refresh 없이 받는다
  resetAccessTokenMemoryForTest()
  bus.clear()
  const openTab = createPeerTab()
  openTab.onmessage = event => {
    const data = event.data as { type?: string; requestId?: string }
    if (data.type === 'request') {
      openTab.postMessage({ type: 'response', requestId: data.requestId, accessToken: 'peer-token' })
    }
  }
  const fromPeer = await requestAccessTokenFromPeers(50)
  assert(fromPeer === 'peer-token', 'peer response resolves')
  assert(readMemoryAccessToken() === 'peer-token', 'peer token is kept in memory')

  // 5) 응답하는 탭이 없으면 timeout 뒤 null
  resetAccessTokenMemoryForTest()
  bus.clear()
  const silent = await requestAccessTokenFromPeers(20)
  assert(silent === null, 'no peer → null after timeout')
  assert(readMemoryAccessToken() === null, 'no peer → memory stays empty')

  // 6) 이 탭이 토큰을 갖고 있으면 다른 탭 요청에 응답한다
  resetAccessTokenMemoryForTest()
  bus.clear()
  const requester = createPeerTab()
  const responses: unknown[] = []
  requester.onmessage = event => responses.push(event.data)
  writeMemoryAccessToken('mine')
  responses.length = 0
  requester.postMessage({ type: 'request', requestId: 'r1' })
  assert(
    JSON.stringify(responses) ===
      JSON.stringify([{ type: 'response', requestId: 'r1', accessToken: 'mine' }]),
    'answers peer request with memory token',
  )

  // 7) BroadcastChannel 미지원 대비: storage 이벤트로 refresh 수단이 사라지면 메모리만 비운다
  resetAccessTokenMemoryForTest()
  bus.clear()
  writeMemoryAccessToken('tab-token')
  assert(dropMemoryAccessTokenFromRemote() === true, 'drop returns true when token existed')
  assert(readMemoryAccessToken() === null, 'drop clears memory')
  assert(dropMemoryAccessTokenFromRemote() === false, 'drop is no-op when empty')

  // 8) 이전 버전이 남긴 localStorage access token은 한 번 메모리로 옮기고 지운다
  resetAccessTokenMemoryForTest()
  const store = new Map<string, string>([[LEGACY_ACCESS_TOKEN_STORAGE_KEY, 'legacy-token']])
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
  migrateLegacyPersistedAccessToken(storage)
  assert(readMemoryAccessToken() === 'legacy-token', 'legacy token migrates to memory')
  assert(!store.has(LEGACY_ACCESS_TOKEN_STORAGE_KEY), 'legacy key is removed')
  migrateLegacyPersistedAccessToken(null)

  // 9) 소스 가드: Platform 어디에서도 access token 키를 브라우저 저장소에 쓰지 않는다
  const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const forbidden = [
    /(localStorage|sessionStorage)\.setItem\(\s*PLATFORM_AUTH_TOKEN_KEY/,
    /(localStorage|sessionStorage)\.setItem\(\s*LEGACY_ACCESS_TOKEN_STORAGE_KEY/,
    /(localStorage|sessionStorage)\.setItem\(\s*['"`]platform_auth_token['"`]/,
  ]
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        walk(full)
        continue
      }
      if (!/\.(ts|tsx)$/.test(name) || name.endsWith('.selfcheck.ts')) continue
      const text = readFileSync(full, 'utf8')
      if (forbidden.some(pattern => pattern.test(text))) offenders.push(full)
    }
  }
  walk(srcRoot)
  assert(offenders.length === 0, `access token must not be persisted: ${offenders.join(', ')}`)

  resetAccessTokenMemoryForTest()
  console.log('access-token-memory selfcheck ok')
}

void main().catch(error => {
  console.error(error)
  process.exit(1)
})
