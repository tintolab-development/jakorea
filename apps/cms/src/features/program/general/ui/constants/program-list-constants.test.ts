import { describe, expect, it } from 'vitest'
import { programMatchesTargetLevelFilter } from './program-list-constants'

describe('programMatchesTargetLevelFilter', () => {
  it('matches a single targetLevel', () => {
    expect(programMatchesTargetLevelFilter({ targetLevel: 'elementary' }, 'elementary')).toBe(true)
    expect(programMatchesTargetLevelFilter({ targetLevel: 'elementary' }, 'middle')).toBe(false)
  })

  it('matches any value in targetLevels even when targetLevel is empty', () => {
    expect(
      programMatchesTargetLevelFilter(
        { targetLevels: ['elementary', 'high'] },
        'high'
      )
    ).toBe(true)
    expect(
      programMatchesTargetLevelFilter({ targetLevels: ['elementary', 'high'] }, 'middle')
    ).toBe(false)
  })

  it('does not match when both fields are empty', () => {
    expect(programMatchesTargetLevelFilter({}, 'elementary')).toBe(false)
  })
})
