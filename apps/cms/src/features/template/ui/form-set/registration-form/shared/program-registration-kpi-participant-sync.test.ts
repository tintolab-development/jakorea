import { describe, expect, it } from 'vitest'
import { resolveKpiFieldValueForParticipantAvailability } from './program-registration-kpi-participant-sync'

describe('resolveKpiFieldValueForParticipantAvailability', () => {
  it('비활성이면 작성값을 null로 리셋한다', () => {
    expect(resolveKpiFieldValueForParticipantAvailability(true, 12)).toBeNull()
    expect(resolveKpiFieldValueForParticipantAvailability(true, 0)).toBeNull()
  })

  it('활성이면 작성값을 유지한다', () => {
    expect(resolveKpiFieldValueForParticipantAvailability(false, 12)).toBe(12)
    expect(resolveKpiFieldValueForParticipantAvailability(false, null)).toBeNull()
  })
})
