import { describe, expect, it } from 'vitest'
import {
  GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS,
  mergeGeneralDevAutofillParticipant,
  resolveGeneralRegistrationDevAutofillPreset,
} from './registration-dev-autofill-cases'
import { listDevAutofillRecruitOverlayTargets } from '@/features/program/shared/lib/dev-autofill-recruit-overlay'

describe('resolveGeneralRegistrationDevAutofillPreset', () => {
  it('9개 케이스 id를 모두 정의한다', () => {
    expect(GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS).toHaveLength(9)
  })

  it('케이스3은 기관 커리큘럼 복수 기간 지정이다', () => {
    const preset = resolveGeneralRegistrationDevAutofillPreset(3)
    expect(preset.participantFlags.organization).toBe(true)
    expect(preset.typeSettings.programType).toBe('curriculum')
    expect(preset.typeSettings.sessionRoundType).toBe('multi')
    expect(preset.typeSettings.educationScheduleMode).toBe('period')
  })

  it('케이스5는 기관 일정 복수 일정별 일시이다', () => {
    const preset = resolveGeneralRegistrationDevAutofillPreset(5)
    expect(preset.typeSettings.programType).toBe('schedule')
    expect(preset.typeSettings.sessionRoundType).toBe('multi')
    expect(preset.overlayBehavior.scheduleMultiUsesDetailDates).toBe(true)
    expect(preset.layout.scheduleCurriculumDetailCount).toBeGreaterThanOrEqual(2)
  })

  it('케이스7은 개인 커리큘럼 복수이며 기간 지정을 쓰지 않는다', () => {
    const preset = resolveGeneralRegistrationDevAutofillPreset(7)
    expect(preset.participantFlags.individual).toBe(true)
    expect(preset.typeSettings.educationScheduleMode).toBe('date')
  })

  it('케이스 preset만 쓰면 강사·봉사자 모집 버킷을 타겟에 넣지 않는다', () => {
    const preset = resolveGeneralRegistrationDevAutofillPreset(1)
    const targets = listDevAutofillRecruitOverlayTargets('general', preset.participantFlags)
    expect(targets.generalRecruit).not.toContain('recruitment-instructor')
    expect(targets.generalRecruit).not.toContain('recruitment-volunteer')
  })

  it('mergeGeneralDevAutofillParticipant는 기관/개인만 케이스에 고정하고 staff는 에디터를 따른다', () => {
    const preset = resolveGeneralRegistrationDevAutofillPreset(1)
    const merged = mergeGeneralDevAutofillParticipant(preset.participantFlags, {
      individual: true,
      organization: false,
      teacherInstructor: true,
      volunteer: true,
    })
    expect(merged.organization).toBe(true)
    expect(merged.individual).toBe(false)
    expect(merged.teacherInstructor).toBe(true)
    expect(merged.volunteer).toBe(true)
    const targets = listDevAutofillRecruitOverlayTargets('general', merged)
    expect(targets.institutionRecruit).toContain('recruitment-participant-school')
    expect(targets.generalRecruit).toEqual(
      expect.arrayContaining([
        'recruitment-instructor',
        'recruitment-volunteer',
      ])
    )
  })

  it('케이스별 대표·공고용 프로그램명을 채운다', () => {
    const preset = resolveGeneralRegistrationDevAutofillPreset(5)
    expect(preset.programTitleKo).toBe(
      '일정형 · 복수 회차 · 일정별 날짜·시간 지정 [ 기관 ]'
    )
    expect(preset.publicProgramTitle).toBe(preset.programTitleKo)
  })
})
