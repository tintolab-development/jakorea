import { describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import {
  applyGeneralParticipantAudienceSelection,
  applyGeneralParticipantAudienceSelectToEditForm,
  generalParticipantTypesFromFlags,
  participantFlagsFromGeneralProgram,
  resolveGeneralParticipantAudienceSelectValue,
  resolveGeneralRegistrationKpiFieldAvailability,
  savedGeneralParticipantTypeLocks,
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

describe('resolveGeneralRegistrationKpiFieldAvailability', () => {
  it('등록과 같이 개인 대분류면 파견 학교·학급을 비활성한다', () => {
    expect(
      resolveGeneralRegistrationKpiFieldAvailability({
        individual: true,
        organization: false,
        teacherInstructor: false,
        volunteer: false,
      })
    ).toEqual({
      instructorDisabled: true,
      volunteerDisabled: true,
      dispatchedSchoolDisabled: true,
      dispatchedClassDisabled: true,
    })
  })

  it('기관 + 강사·봉사자여도 파견 학교·학급은 해당 없음이다', () => {
    expect(
      resolveGeneralRegistrationKpiFieldAvailability({
        individual: false,
        organization: true,
        teacherInstructor: true,
        volunteer: true,
      })
    ).toEqual({
      instructorDisabled: false,
      volunteerDisabled: false,
      dispatchedSchoolDisabled: true,
      dispatchedClassDisabled: true,
    })
  })
})

describe('savedGeneralParticipantTypeLocks', () => {
  it('상세 수정에서는 저장된 유형과 무관하게 네 유형을 모두 잠근다', () => {
    expect(
      savedGeneralParticipantTypeLocks({
        generalParticipantTypes: ['individual'],
        programRecruitments: [{ id: 11, recruitmentType: 'PARTICIPANT' }],
      })
    ).toEqual({
      individual: true,
      organization: true,
      teacherInstructor: true,
      volunteer: true,
    })
  })

  it('강사·봉사자 행이 없어도 잠근다', () => {
    expect(
      savedGeneralParticipantTypeLocks({
        programRecruitments: [],
      })
    ).toEqual({
      individual: true,
      organization: true,
      teacherInstructor: true,
      volunteer: true,
    })
  })
})

describe('participantFlagsFromGeneralProgram', () => {
  it('개인/기관이 동시에 있으면 audience 기준으로 하나만 남긴다', () => {
    const program = {
      id: 'general-1',
      category: 'school',
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['individual', 'school_institution', 'teacher_instructor'],
    } as Program
    expect(participantFlagsFromGeneralProgram(program)).toEqual({
      individual: false,
      organization: true,
      teacherInstructor: true,
      volunteer: false,
    })
    expect(
      generalParticipantTypesFromFlags(participantFlagsFromGeneralProgram(program))
    ).toEqual(['school_institution', 'teacher_instructor'])
  })
})
