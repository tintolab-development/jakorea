import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  findAncestorDelta,
  findAncestorDeltaWhere,
  navigateToAncestorOrReplace,
  normalizeHistoryUrl,
  recordHistoryEntry,
  resetHistoryEntriesForTest,
} from './history-ancestor-navigation'

const LIST = '/programs/general?page=2'
const DETAIL = '/programs/general?lnb=info&page=2&programId=1&tab=info'
const LNB = '/programs/general?lnb=progress&page=2&programId=1&tab=progress_volunteers'
const NESTED = `${LNB}&volunteerId=9`

function entries(...urls: string[]): Record<string, string> {
  return Object.fromEntries(urls.map((url, idx) => [String(idx), url]))
}

describe('normalizeHistoryUrl', () => {
  it('쿼리 키 순서와 무관하게 같은 URL로 본다', () => {
    expect(normalizeHistoryUrl('/p', '?b=2&a=1')).toBe(normalizeHistoryUrl('/p', 'a=1&b=2'))
    expect(normalizeHistoryUrl('/p', '')).toBe('/p')
  })
})

describe('findAncestorDelta', () => {
  it('직전 엔트리가 목표면 -1', () => {
    expect(
      findAncestorDelta({
        entries: entries(LIST, DETAIL, LNB, NESTED),
        currentIdx: 3,
        currentPathname: '/programs/general',
        target: { pathname: '/programs/general', search: '?programId=1&lnb=progress&tab=progress_volunteers&page=2' },
      })
    ).toBe(-1)
  })

  it('여러 단계 위(목록)로 한 번에 되돌아간다', () => {
    expect(
      findAncestorDelta({
        entries: entries(LIST, DETAIL, LNB, NESTED),
        currentIdx: 3,
        currentPathname: '/programs/general',
        target: { pathname: '/programs/general', search: '?page=2' },
      })
    ).toBe(-3)
  })

  it('기록이 없는 엔트리를 만나면 null (딥링크·새로고침)', () => {
    expect(
      findAncestorDelta({
        entries: { '3': NESTED },
        currentIdx: 3,
        currentPathname: '/programs/general',
        target: { pathname: '/programs/general', search: '?page=2' },
      })
    ).toBeNull()
  })

  it('다른 경로를 지나면 탐색을 멈춘다', () => {
    expect(
      findAncestorDelta({
        entries: entries(LIST, '/users/list?id=3', DETAIL),
        currentIdx: 2,
        currentPathname: '/programs/general',
        target: { pathname: '/programs/general', search: '?page=2' },
      })
    ).toBeNull()
  })

  it('목표 경로가 다르면(회원 상세 복귀) 그 엔트리까지 되돌아간다', () => {
    expect(
      findAncestorDelta({
        entries: entries('/users/list?id=3', DETAIL, LNB),
        currentIdx: 2,
        currentPathname: '/programs/general',
        target: { pathname: '/users/list', search: '?id=3' },
      })
    ).toBe(-2)
  })

  it('idx를 모르면 null', () => {
    expect(
      findAncestorDelta({
        entries: entries(LIST),
        currentIdx: null,
        currentPathname: '/programs/general',
        target: { pathname: '/programs/general', search: '?page=2' },
      })
    ).toBeNull()
  })
})

describe('navigateToAncestorOrReplace', () => {
  beforeEach(() => {
    resetHistoryEntriesForTest()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubLocation(url: string, idx: number) {
    const parsed = new URL(`http://localhost${url}`)
    vi.stubGlobal('window', {
      location: { pathname: parsed.pathname, search: parsed.search },
      history: { state: { idx } },
    })
  }

  it('지나온 엔트리면 뒤로 이동한다', () => {
    ;[LIST, DETAIL, LNB, NESTED].forEach((url, idx) => {
      const parsed = new URL(`http://localhost${url}`)
      recordHistoryEntry(idx, parsed.pathname, parsed.search)
    })
    stubLocation(NESTED, 3)
    const navigate = vi.fn()
    expect(navigateToAncestorOrReplace(navigate, { pathname: '/programs/general', search: '?page=2' })).toBe('back')
    expect(navigate).toHaveBeenCalledWith(-3)
  })

  it('지나온 엔트리가 아니면 replace (push 하지 않음)', () => {
    stubLocation(NESTED, 0)
    const navigate = vi.fn()
    expect(navigateToAncestorOrReplace(navigate, { pathname: '/programs/general', search: '?page=2' })).toBe('replace')
    expect(navigate).toHaveBeenCalledWith({ pathname: '/programs/general', search: '?page=2' }, { replace: true })
  })

  it('현재 URL과 같으면 아무것도 하지 않는다', () => {
    stubLocation(LIST, 0)
    const navigate = vi.fn()
    expect(navigateToAncestorOrReplace(navigate, { pathname: '/programs/general', search: '?page=2' })).toBe('noop')
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe('findAncestorDeltaWhere', () => {
  const USERS_LIST = '/users?page=1'
  const SCHOOL = '/users?id=school-1&lnb=detail-info&page=1'
  const SCHOOL_LNB = '/users?id=school-1&lnb=history&page=1'
  const TEACHER = '/users?id=teacher-1&lnb=detail-info&page=1'
  const isSchool = (search: URLSearchParams) => search.get('id') === 'school-1'

  it('조건에 맞는 가장 가까운 엔트리까지 거리', () => {
    expect(
      findAncestorDeltaWhere({
        entries: entries(USERS_LIST, SCHOOL, SCHOOL_LNB, TEACHER),
        currentIdx: 3,
        currentPathname: '/users',
        matches: isSchool,
      })
    ).toBe(-1)
  })

  it('다른 경로를 지나면 멈춘다', () => {
    expect(
      findAncestorDeltaWhere({
        entries: entries(SCHOOL, '/programs/general?programId=1', TEACHER),
        currentIdx: 2,
        currentPathname: '/users',
        matches: isSchool,
      })
    ).toBeNull()
  })

  it('기록이 끊기면 null', () => {
    expect(
      findAncestorDeltaWhere({
        entries: { '3': TEACHER },
        currentIdx: 3,
        currentPathname: '/users',
        matches: isSchool,
      })
    ).toBeNull()
  })
})
