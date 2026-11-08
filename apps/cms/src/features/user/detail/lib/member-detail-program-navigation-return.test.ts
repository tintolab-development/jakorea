import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  discardMemberDetailReturnOutsidePrograms,
  peekMemberDetailReturnAfterProgram,
  stashMemberDetailReturnForProgramNavigation,
  tryNavigateMemberDetailReturn,
} from './member-detail-program-navigation-return'

describe('member-detail-program-navigation-return', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('window', globalThis)
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => store.clear(),
    })
  })

  it('stashs users list URL with id', () => {
    vi.stubGlobal('location', {
      href: 'http://localhost/users/list?kind=instructors&id=instructor-1&lnb=history&programsChild=lecture',
      pathname: '/users/list',
      search: '?kind=instructors&id=instructor-1&lnb=history&programsChild=lecture',
    } as Location)

    stashMemberDetailReturnForProgramNavigation()

    expect(peekMemberDetailReturnAfterProgram()).toBe(
      '/users/list?kind=instructors&id=instructor-1&lnb=history&programsChild=lecture'
    )
  })

  it('tryNavigate consumes stash and navigates', () => {
    sessionStorage.setItem(
      'cms:member-detail-return-after-program',
      '/users/list?id=member-1&lnb=history'
    )
    vi.stubGlobal('location', {
      href: 'http://localhost/programs/general?programId=1',
      origin: 'http://localhost',
      pathname: '/programs/general',
      search: '?programId=1',
    } as Location)
    vi.stubGlobal('history', { state: null } as History)
    const navigate = vi.fn()

    expect(tryNavigateMemberDetailReturn(navigate)).toBe(true)
    // 지나온 history 엔트리를 모르면 push 대신 replace
    expect(navigate).toHaveBeenCalledWith(
      { pathname: '/users/list', search: '?id=member-1&lnb=history' },
      { replace: true }
    )
    expect(peekMemberDetailReturnAfterProgram()).toBeNull()
  })

  it('프로그램 화면을 벗어나면 저장된 복귀 URL을 버린다', () => {
    sessionStorage.setItem('cms:member-detail-return-after-program', '/users/list?id=member-1')

    discardMemberDetailReturnOutsidePrograms('/programs/general')
    expect(peekMemberDetailReturnAfterProgram()).toBe('/users/list?id=member-1')

    discardMemberDetailReturnOutsidePrograms('/users/list')
    expect(peekMemberDetailReturnAfterProgram()).toBeNull()
  })
})
