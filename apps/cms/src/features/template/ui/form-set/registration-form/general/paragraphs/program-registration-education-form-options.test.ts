import { describe, expect, it } from 'vitest'
import {
  applyEducationFormTypeSettingsModeChange,
  EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
  isParticipantSelectionEducationFormInOverlay,
  resolveEducationFormTypeSettingsMode,
  resolveGeneralRegistrationCommonEducationForm,
  resolveGeneralRegistrationCommonParticipation,
  resolveIndexedEducationForm,
  resolveIndexedParticipation,
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
  it('참여자 선택 → 일정 공통이면 단일 회차와 같은 기본 온라인으로 되돌린다', () => {
    expect(
      applyEducationFormTypeSettingsModeChange({
        next: 'common',
        currentForm: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
      })
    ).toEqual({ educationFormScheduleDetail: 'common', educationForm: 'online' })
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

describe('resolveGeneralRegistrationCommonEducationForm', () => {
  const overlay = {
    'generalRegistration.typeSettings.multiCommonEducationForm': 'hybrid',
    'generalRegistration.typeSettings.singleEducationForm': 'offline',
  }

  it('단일 회차면 stale multi보다 single 값을 쓴다', () => {
    expect(resolveGeneralRegistrationCommonEducationForm(overlay, 'single')).toBe('offline')
  })

  it('복수 회차면 multi 값을 쓴다', () => {
    expect(resolveGeneralRegistrationCommonEducationForm(overlay, 'multi')).toBe('hybrid')
  })

  it('회차 유형이 없으면 단일 키를 먼저 본다', () => {
    expect(resolveGeneralRegistrationCommonEducationForm(overlay)).toBe('offline')
  })

  it('단일 회차에서 single이 비면 multi fallback', () => {
    expect(
      resolveGeneralRegistrationCommonEducationForm(
        {
          'generalRegistration.typeSettings.multiCommonEducationForm': 'hybrid',
          'generalRegistration.typeSettings.singleEducationForm': '',
        },
        'single'
      )
    ).toBe('hybrid')
  })

  it('둘 다 없으면 online', () => {
    expect(resolveGeneralRegistrationCommonEducationForm({}, 'single')).toBe('online')
  })
})

describe('resolveGeneralRegistrationCommonParticipation', () => {
  const overlay = {
    'generalRegistration.typeSettings.multiCommonParticipation': 'team',
    'generalRegistration.typeSettings.singleParticipation': 'individual',
  }

  it('단일 회차면 stale multi보다 single 값을 쓴다', () => {
    expect(resolveGeneralRegistrationCommonParticipation(overlay, 'single')).toBe('individual')
  })

  it('복수 회차면 multi 값을 쓴다', () => {
    expect(resolveGeneralRegistrationCommonParticipation(overlay, 'multi')).toBe('team')
  })

  it('회차 유형이 없으면 단일 키를 먼저 본다', () => {
    expect(resolveGeneralRegistrationCommonParticipation(overlay)).toBe('individual')
  })

  it('복수 회차에서 multi가 비면 single fallback', () => {
    expect(
      resolveGeneralRegistrationCommonParticipation(
        {
          'generalRegistration.typeSettings.multiCommonParticipation': '',
          'generalRegistration.typeSettings.singleParticipation': 'team',
        },
        'multi'
      )
    ).toBe('team')
  })

  it('둘 다 없으면 individual', () => {
    expect(resolveGeneralRegistrationCommonParticipation({}, 'multi')).toBe('individual')
  })
})

describe('isParticipantSelectionEducationFormInOverlay', () => {
  it('복수회차 공통 키가 participant_selection이면 true', () => {
    expect(
      isParticipantSelectionEducationFormInOverlay({
        'generalRegistration.typeSettings.multiCommonEducationForm':
          EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
      })
    ).toBe(true)
  })

  it('단일 회차 키가 participant_selection이면 true', () => {
    expect(
      isParticipantSelectionEducationFormInOverlay({
        'generalRegistration.typeSettings.singleEducationForm':
          EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
      })
    ).toBe(true)
  })

  it('일정별 회차 맵에 participant_selection이 있으면 true', () => {
    expect(
      isParticipantSelectionEducationFormInOverlay({
        'generalRegistration.educationCurriculum.educationFormBySession': {
          0: 'online',
          1: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
        },
      })
    ).toBe(true)
  })

  it('일정별 세부 맵에 participant_selection이 있으면 true', () => {
    expect(
      isParticipantSelectionEducationFormInOverlay({
        'generalRegistration.educationScheduleCurriculum.educationFormByDetail': {
          0: EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
        },
      })
    ).toBe(true)
  })

  it('복수회차에 남은 online이 있어도 단일 회차 참여자 선택이면 true', () => {
    expect(
      isParticipantSelectionEducationFormInOverlay({
        'generalRegistration.typeSettings.multiCommonEducationForm': 'online',
        'generalRegistration.typeSettings.singleEducationForm':
          EDUCATION_FORM_PARTICIPANT_SELECTION_VALUE,
      })
    ).toBe(true)
  })

  it('온라인이거나 빈 overlay면 false', () => {
    expect(isParticipantSelectionEducationFormInOverlay({})).toBe(false)
    expect(isParticipantSelectionEducationFormInOverlay(undefined)).toBe(false)
    expect(
      isParticipantSelectionEducationFormInOverlay({
        'generalRegistration.typeSettings.singleEducationForm': 'online',
      })
    ).toBe(false)
  })
})

describe('resolveIndexed education/participation defaults', () => {
  it('미기록은 UI 기본값이다', () => {
    expect(resolveIndexedEducationForm(undefined)).toBe('online')
    expect(resolveIndexedParticipation(undefined)).toBe('individual')
  })

  it('값이 있으면 그대로 쓴다', () => {
    expect(resolveIndexedEducationForm('hybrid')).toBe('hybrid')
    expect(resolveIndexedParticipation('team')).toBe('team')
  })
})
