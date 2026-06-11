import { describe, expect, it } from 'vitest'
import {
  applyGeneralParticipantAudienceSelection,
  shouldResetParticipationScheduleDetailForAudience,
} from './participant-audience-selection'

describe('applyGeneralParticipantAudienceSelection', () => {
  it('개인 선택 시 기관을 해제한다', () => {
    expect(applyGeneralParticipantAudienceSelection('individual', true)).toEqual({
      individual: true,
      organization: false,
    })
  })

  it('개인 해제 시 기관을 자동 선택한다', () => {
    expect(applyGeneralParticipantAudienceSelection('individual', false)).toEqual({
      individual: false,
      organization: true,
    })
  })

  it('기관 선택 시 개인을 해제한다', () => {
    expect(applyGeneralParticipantAudienceSelection('organization', true)).toEqual({
      individual: false,
      organization: true,
    })
  })

  it('기관 해제 시 개인을 자동 선택한다', () => {
    expect(applyGeneralParticipantAudienceSelection('organization', false)).toEqual({
      individual: true,
      organization: false,
    })
  })
})

describe('shouldResetParticipationScheduleDetailForAudience', () => {
  it('기관 대상일 때만 참여 일정 상세를 초기화한다', () => {
    expect(
      shouldResetParticipationScheduleDetailForAudience({
        individual: false,
        organization: true,
      })
    ).toBe(true)
    expect(
      shouldResetParticipationScheduleDetailForAudience({
        individual: true,
        organization: false,
      })
    ).toBe(false)
  })
})
