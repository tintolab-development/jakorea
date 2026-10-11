import { describe, expect, it } from 'vitest'
import { readApplicationNameChangeCount } from '@/features/program/general/lib/individual-application-name-change-count'

describe('readApplicationNameChangeCount', () => {
  it('reads applicationNameChangeCount when present', () => {
    expect(readApplicationNameChangeCount({ applicationNameChangeCount: 2 })).toBe(2)
  })

  it('returns 0 when field is missing or invalid', () => {
    expect(readApplicationNameChangeCount(null)).toBe(0)
    expect(readApplicationNameChangeCount({})).toBe(0)
    expect(readApplicationNameChangeCount({ applicationNameChangeCount: 0 })).toBe(0)
  })
})
