import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
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
    const navigate = vi.fn()

    expect(tryNavigateMemberDetailReturn(navigate)).toBe(true)
    expect(navigate).toHaveBeenCalledWith('/users/list?id=member-1&lnb=history')
    expect(peekMemberDetailReturnAfterProgram()).toBeNull()
  })
})
