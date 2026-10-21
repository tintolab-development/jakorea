import { describe, expect, it } from 'vitest'
import { resolveSelectedListUsers } from './resolve-selected-list-users'

describe('resolveSelectedListUsers', () => {
  it('string/number 키를 같은 id로 매칭한다', () => {
    const users = [{ id: 'organization-12' }, { id: 'organization-13' }]
    expect(resolveSelectedListUsers(users, ['organization-12'])).toEqual([users[0]])
  })

  it('현재 페이지에 없어도 스냅샷에서 복원한다', () => {
    const snapshot = [{ id: 'organization-99' }]
    expect(resolveSelectedListUsers([], ['organization-99'], snapshot)).toEqual(snapshot)
  })

  it('선택 키가 없으면 빈 배열이다', () => {
    expect(resolveSelectedListUsers([{ id: 'organization-1' }], [])).toEqual([])
  })
})
