import type { NavigateFunction } from 'react-router-dom'

/**
 * 풀페이지 상세 모달 스택 ↔ 브라우저 history 정합.
 *
 * 브레드크럼 상위 클릭·중첩 상세 닫기·모달 닫기는 "앞으로 push"가 아니라
 * 이미 지나온 history 엔트리로 되돌아가야 브라우저 뒤로가기와 같은 스택을 유지한다.
 *
 * - Layout이 모든 엔트리의 URL을 `history.state.idx` 기준으로 기록한다.
 * - 목표 URL과 같은 엔트리가 바로 앞 구간에 있으면 `navigate(-n)`.
 * - 없으면(딥링크·새로고침·다른 경로로 진입) 현재 엔트리를 replace — 중복 엔트리를 만들지 않는다.
 */

export type HistoryTarget = {
  pathname: string
  search?: string
}

const STORAGE_KEY = 'cms:history-entry-urls'
/** 뒤로 탐색할 최대 엔트리 수 */
const MAX_LOOKBACK = 50
/** 기록 보관 범위 (현재 idx 기준 앞쪽) */
const KEEP_RANGE = 200

function normalizeSearch(search: string | undefined): string {
  const raw = (search ?? '').startsWith('?') ? (search ?? '').slice(1) : (search ?? '')
  const params = new URLSearchParams(raw)
  params.sort()
  const text = params.toString()
  return text ? `?${text}` : ''
}

/** 쿼리 키 순서와 무관한 비교용 URL */
export function normalizeHistoryUrl(pathname: string, search?: string): string {
  return `${pathname}${normalizeSearch(search)}`
}

function pathnameOf(url: string): string {
  const index = url.indexOf('?')
  return index === -1 ? url : url.slice(0, index)
}

export function readHistoryIdx(state: unknown = typeof window !== 'undefined' ? window.history.state : null): number | null {
  if (!state || typeof state !== 'object') return null
  const idx = (state as { idx?: unknown }).idx
  return typeof idx === 'number' && Number.isInteger(idx) && idx >= 0 ? idx : null
}

let memoryEntries: Record<string, string> = {}

function loadEntries(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return memoryEntries
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') {
      memoryEntries = parsed as Record<string, string>
    }
  } catch {
    // 스토리지 불가 — 메모리 기록만 사용
  }
  return memoryEntries
}

function saveEntries(entries: Record<string, string>): void {
  memoryEntries = entries
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // 스토리지 불가 — 메모리 기록만 사용
  }
}

/** 현재 엔트리 URL 기록 (push·replace·pop 모두). Layout에서 위치가 바뀔 때마다 호출 */
export function recordHistoryEntry(idx: number | null, pathname: string, search?: string): void {
  if (idx == null) return
  const entries = { ...loadEntries() }
  entries[String(idx)] = normalizeHistoryUrl(pathname, search)
  for (const key of Object.keys(entries)) {
    const n = Number(key)
    if (!Number.isFinite(n) || n < idx - KEEP_RANGE) delete entries[key]
  }
  saveEntries(entries)
}

type RouterLike = {
  state: { location: { pathname: string; search: string } }
  subscribe: (fn: (state: { location: { pathname: string; search: string } }) => void) => () => void
}

/**
 * 라우터의 모든 이동(push·replace·pop)을 기록한다. 앱 시작 시 1회.
 * React effect로 기록하면 같은 틱의 연속 이동이 묶여 중간 엔트리가 빠진다.
 */
export function recordRouterHistory(router: RouterLike): () => void {
  const record = (location: { pathname: string; search: string }) =>
    recordHistoryEntry(readHistoryIdx(), location.pathname, location.search)
  let lastLocation = router.state.location
  record(lastLocation)
  return router.subscribe(state => {
    // 위치가 실제로 바뀌면 진행 중이던 뒤로 이동은 끝난 것
    if (state.location !== lastLocation) {
      lastLocation = state.location
      pendingTraversal = null
    }
    record(state.location)
  })
}

/**
 * 뒤로 이동(`navigate(-n)`) 진행 상태.
 * 브라우저 traversal은 비동기라 완료 전까지 주소·`history.state.idx`가 출발 엔트리 그대로다.
 * 그 사이 같은 엔트리에서 들어온 닫기(같은 틱 X 두 번 등)가 다시 -n을 계산하면 두 번 뒤로 가므로 막는다.
 */
let pendingTraversal: { fromIdx: number; startedAt: number } | null = null
/** 브라우저가 이동을 무시한 경우 대비 — 이 시간이 지나면 자동 해제 */
const PENDING_TRAVERSAL_TIMEOUT_MS = 1000

/**
 * 뒤로 이동이 진행 중인지. 출발 엔트리를 벗어났거나(idx 변경) 시간이 지나면 해제한다.
 * 부모 닫기 콜백은 이 값이 참이면 URL 쓰기를 건너뛴다 — 아직 현재인 출발 엔트리를 덮어쓰지 않도록.
 */
export function isHistoryTraversalPending(): boolean {
  if (!pendingTraversal) return false
  const expired = Date.now() - pendingTraversal.startedAt > PENDING_TRAVERSAL_TIMEOUT_MS
  if (expired || readHistoryIdx() !== pendingTraversal.fromIdx) {
    pendingTraversal = null
    return false
  }
  return true
}

function startTraversal(navigate: NavigateFunction, delta: number): void {
  const fromIdx = readHistoryIdx()
  pendingTraversal = fromIdx == null ? null : { fromIdx, startedAt: Date.now() }
  void navigate(delta)
}

/**
 * 목표 URL과 같은 직전 엔트리까지의 거리(음수). 없으면 null.
 * 기록이 끊기거나(모르는 엔트리) 현재·목표와 다른 경로를 지나면 탐색을 멈춘다.
 */
export function findAncestorDelta(input: {
  entries: Readonly<Record<string, string>>
  currentIdx: number | null
  currentPathname: string
  target: HistoryTarget
}): number | null {
  const { entries, currentIdx, currentPathname, target } = input
  if (currentIdx == null) return null
  const targetUrl = normalizeHistoryUrl(target.pathname, target.search)
  const lowest = Math.max(0, currentIdx - MAX_LOOKBACK)
  for (let idx = currentIdx - 1; idx >= lowest; idx -= 1) {
    const url = entries[String(idx)]
    if (url === undefined) return null
    if (url === targetUrl) return idx - currentIdx
    const path = pathnameOf(url)
    if (path !== currentPathname && path !== target.pathname) return null
  }
  return null
}

/**
 * 같은 경로의 직전 엔트리 중 쿼리가 조건을 만족하는 가장 가까운 엔트리까지의 거리(음수). 없으면 null.
 * 정확한 URL을 모를 때(예: 상위 상세의 LNB가 무엇이었는지 모름) 사용한다.
 */
export function findAncestorDeltaWhere(input: {
  entries: Readonly<Record<string, string>>
  currentIdx: number | null
  currentPathname: string
  matches: (search: URLSearchParams) => boolean
}): number | null {
  const { entries, currentIdx, currentPathname, matches } = input
  if (currentIdx == null) return null
  const lowest = Math.max(0, currentIdx - MAX_LOOKBACK)
  for (let idx = currentIdx - 1; idx >= lowest; idx -= 1) {
    const url = entries[String(idx)]
    if (url === undefined) return null
    if (pathnameOf(url) !== currentPathname) return null
    const queryIndex = url.indexOf('?')
    if (matches(new URLSearchParams(queryIndex === -1 ? '' : url.slice(queryIndex + 1)))) {
      return idx - currentIdx
    }
  }
  return null
}

type NavigateLike = NavigateFunction

/**
 * 조건에 맞는 직전 엔트리로 뒤로 간다. 없으면 아무것도 하지 않고 false.
 * 이미 뒤로 이동 중이면 무시하고 true — 호출부가 대체 이동(push)으로 넘어가지 않도록.
 */
export function navigateBackToMatchingEntry(
  navigate: NavigateLike,
  matches: (search: URLSearchParams) => boolean
): boolean {
  if (isHistoryTraversalPending()) return true
  const delta = findAncestorDeltaWhere({
    entries: loadEntries(),
    currentIdx: readHistoryIdx(),
    currentPathname: window.location.pathname,
    matches,
  })
  if (delta == null) return false
  startTraversal(navigate, delta)
  return true
}

/** pending = 이미 뒤로 이동 중이라 요청을 무시함 */
export type AncestorNavigationResult = 'back' | 'replace' | 'noop' | 'pending'

/**
 * 상위 단계로 이동 — 직전 history에 같은 URL이 있으면 뒤로, 없으면 replace.
 * 현재 URL과 같으면 아무것도 하지 않는다.
 */
export function navigateToAncestorOrReplace(
  navigate: NavigateLike,
  target: HistoryTarget
): AncestorNavigationResult {
  if (isHistoryTraversalPending()) return 'pending'
  const currentPathname = window.location.pathname
  const currentUrl = normalizeHistoryUrl(currentPathname, window.location.search)
  if (normalizeHistoryUrl(target.pathname, target.search) === currentUrl) return 'noop'
  const delta = findAncestorDelta({
    entries: loadEntries(),
    currentIdx: readHistoryIdx(),
    currentPathname,
    target,
  })
  if (delta != null) {
    startTraversal(navigate, delta)
    return 'back'
  }
  void navigate(
    { pathname: target.pathname, search: normalizeSearch(target.search) },
    { replace: true }
  )
  return 'replace'
}

/** 같은 경로에서 쿼리만 바꾸는 상위 이동 — recipe는 주소창 쿼리 기준 */
export function navigateToAncestorSearch(
  navigate: NavigateLike,
  recipe: (current: URLSearchParams) => URLSearchParams
): AncestorNavigationResult {
  const current = new URLSearchParams(window.location.search)
  const next = recipe(new URLSearchParams(current))
  const search = next.toString()
  return navigateToAncestorOrReplace(navigate, {
    pathname: window.location.pathname,
    search: search ? `?${search}` : '',
  })
}

/** 테스트 전용 */
export function resetHistoryEntriesForTest(): void {
  memoryEntries = {}
  pendingTraversal = null
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
