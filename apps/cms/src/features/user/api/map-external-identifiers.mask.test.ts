import { describe, expect, it } from 'vitest'
import { mask1365IdForDisplay } from './map-external-identifiers'

describe('mask1365IdForDisplay', () => {
  it('masks only the last two characters', () => {
    expect(mask1365IdForDisplay('kim1234')).toBe('kim12**')
    expect(mask1365IdForDisplay('ab')).toBe('**')
    expect(mask1365IdForDisplay('kim12**')).toBe('kim12**')
  })
})
