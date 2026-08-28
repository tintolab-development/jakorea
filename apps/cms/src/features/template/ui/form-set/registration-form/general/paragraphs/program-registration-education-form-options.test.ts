import { describe, expect, it } from 'vitest'
import {
  applyEducationFormTypeSettingsModeChange,
  EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
  resolveEducationFormTypeSettingsMode,
  shouldShowEducationFormParticipantSelectionRadio,
} from './program-registration-education-form-options'

describe('shouldShowEducationFormParticipantSelectionRadio', () => {
  it('일반(기관) 복수 회차이면 커리큘럼형·일정형 모두 true', () => {
    expect(
      shouldShowEducationFormParticipantSelectionRadio({
        participantOrganization: true,
        educationStructure: 'curriculum',
        sessionRound: 'multi',
      })
    ).toBe(true)
    expect(
      shouldShowEducationFormParticipantSelectionRadio({
        participantOrganization: true,
        educationStructure: 'schedule',
        sessionRound: 'multi',
      })
    ).toBe(true)
  })

  it('단일 회차·개인은 false', () => {
    expect(
      shouldShowEducationFormParticipantSelectionRadio({
        participantOrganization: true,
        educationStructure: 'curriculum',
        sessionRound: 'single',
      })
    ).toBe(false)
    expect(
      shouldShowEducationFormParticipantSelectionRadio({
        participantOrganization: false,
        educationStructure: 'curriculum',
        sessionRound: 'multi',
      })
    ).toBe(false)
  })
})

describe('resolveEducationFormTypeSettingsMode', () => {
  it('일정 별 상이는 perSchedule', () => {
    expect(
      resolveEducationFormTypeSettingsMode({
        educationFormScheduleDetail: 'perSchedule',
        educationForm: 'online',
      })
    ).toBe('perSchedule')
  })

  it('일정 공통 + 참여자 선택은 participant_selection', () => {
    expect(
      resolveEducationFormTypeSettingsMode({
        educationFormScheduleDetail: 'common',
        educationForm: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
      })
    ).toBe('participant_selection')
  })

  it('일정 공통 + 온라인은 common', () => {
    expect(
      resolveEducationFormTypeSettingsMode({
        educationFormScheduleDetail: 'common',
        educationForm: 'online',
      })
    ).toBe('common')
  })
})

describe('applyEducationFormTypeSettingsModeChange', () => {
  it('참여자 선택 → 일정 공통이면 드롭다운을 비운다', () => {
    expect(
      applyEducationFormTypeSettingsModeChange({
        next: 'common',
        currentForm: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
      })
    ).toEqual({ educationFormScheduleDetail: 'common', educationForm: '' })
  })

  it('참여자 선택으로 바꾸면 일정 공통 + participant_selection', () => {
    expect(
      applyEducationFormTypeSettingsModeChange({
        next: 'participant_selection',
        currentForm: 'offline',
      })
    ).toEqual({
      educationFormScheduleDetail: 'common',
      educationForm: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
    })
  })

  it('참여자 선택 → 일정 별 상이면 온라인으로 되돌린다', () => {
    expect(
      applyEducationFormTypeSettingsModeChange({
        next: 'perSchedule',
        currentForm: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
      })
    ).toEqual({ educationFormScheduleDetail: 'perSchedule', educationForm: 'online' })
  })

  it('일정 공통 온라인을 일정 별 상이로 바꿀 때 형태 값을 유지한다', () => {
    expect(
      applyEducationFormTypeSettingsModeChange({
        next: 'perSchedule',
        currentForm: 'offline',
      })
    ).toEqual({ educationFormScheduleDetail: 'perSchedule', educationForm: 'offline' })
  })
})
