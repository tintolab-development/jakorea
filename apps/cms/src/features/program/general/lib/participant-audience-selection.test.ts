import { describe, expect, it, vi } from 'vitest'
import {
  applyGeneralParticipantAudienceSelection,
  applyGeneralParticipantAudienceSelectToEditForm,
  resolveGeneralParticipantAudienceSelectValue,
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

describe('resolveGeneralParticipantAudienceSelectValue', () => {
  it('개인/기관 플래그를 셀렉트 값으로 변환한다', () => {
    expect(
      resolveGeneralParticipantAudienceSelectValue({ individual: true, organization: false })
    ).toBe('individual')
    expect(
      resolveGeneralParticipantAudienceSelectValue({ individual: false, organization: true })
    ).toBe('organization')
  })
})

describe('applyGeneralParticipantAudienceSelectToEditForm', () => {
  it('개인 선택 시 기관 플래그를 해제한다', () => {
    const setValue = vi.fn()
    const getValues = vi.fn()
    const editForm = { setValue, getValues } as never

    const next = applyGeneralParticipantAudienceSelectToEditForm(editForm, 'individual')

    expect(next).toEqual({ individual: true, organization: false })
    expect(setValue).toHaveBeenCalledWith('participantIndividual', true, expect.any(Object))
    expect(setValue).toHaveBeenCalledWith('participantOrganization', false, expect.any(Object))
  })
})
