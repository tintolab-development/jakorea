import { describe, expect, it } from 'vitest'
import { stableNotificationQueryKey } from './stable-query-key'

describe('stableNotificationQueryKey', () => {
  it('omits empty values and sorts keys', () => {
    expect(
      stableNotificationQueryKey({
        keyword: '  ',
        programId: 10,
        page: 0,
        memberType: undefined,
        participantType: null,
      })
    ).toBe(JSON.stringify({ page: 0, programId: 10 }))
  })

  it('is order-independent', () => {
    expect(stableNotificationQueryKey({ b: 1, a: 2 })).toBe(
      stableNotificationQueryKey({ a: 2, b: 1 })
    )
  })
})
