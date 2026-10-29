/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { PRE_EDUCATION_SCHEDULE_LABEL } from '@/features/program/general/lib/schedule-detail-form'
import {
  buildCurriculumSessionsFromMaps,
  buildScheduleDetailsFromMaps,
  emptyCurriculumMaps,
} from './common-info-domain'
import type { CommonInfoScheduleMaps } from './common-info-form-values'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'
import {
  applyCurriculumCountTrim,
  applyEducationStructureReset,
  applyScheduleDetailCountTrim,
  applyScheduleGroupCountTrim,
  createRegistrationCreateSessionAuthoring,
  trimIndexRecord,
} from './registration-wizard-structure'

describe('registration-wizard-structure', () => {
  it('회차 축소 시 4→2 키만 남긴다', () => {
    expect(trimIndexRecord({ 1: 'a', 2: 'b', 3: 'c', 4: 'd' }, 2)).toEqual({ 1: 'a', 2: 'b' })
    const values = createDefaultRegistrationWizardUiValues({ curriculumChartSessionCount: 4 })
    values.curriculum.unitNameBySession = { 1: '1', 2: '2', 3: '3', 4: '4' }
    const trimmed = applyCurriculumCountTrim(values, 2, 'chart')
    expect(trimmed.extras.curriculumChartSessionCount).toBe(2)
    expect(trimmed.curriculum.unitNameBySession).toEqual({ 1: '1', 2: '2' })
  })

  it('2→0 명시 삭제는 맵을 비운다', () => {
    const values = createDefaultRegistrationWizardUiValues({ curriculumSessionCount: 2 })
    values.curriculum.progressSessionByRound = { 1: '1회', 2: '2회' }
    const trimmed = applyCurriculumCountTrim(values, 0, 'session')
    expect(trimmed.extras.curriculumSessionCount).toBe(0)
    expect(trimmed.curriculum.progressSessionByRound).toEqual({})
  })

  it('커리큘럼→일정형 전환 시 비활성 커리큘럼 맵을 비우고 세부프로그램은 해당없음', () => {
    const values = createDefaultRegistrationWizardUiValues({ programType: 'curriculum' })
    values.detailedProgramId = '163006'
    values.curriculum.unitNameBySession = { 1: '단원' }
    values.schedule.eventNameByDetail = { 1: '일정' }
    const next = applyEducationStructureReset(values, 'schedule')
    expect(next.extras.programType).toBe('schedule')
    expect(next.detailedProgramId).toBe(TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)
    expect(next.curriculum.unitNameBySession).toEqual({})
    expect(next.curriculum.preEducationScheduleName).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    expect(next.schedule.eventNameByDetail).toEqual({ 1: '일정' })
  })

  it('일정형→커리큘럼 전환 시 비활성 일정 맵만 비운다', () => {
    const values = createDefaultRegistrationWizardUiValues({ programType: 'schedule' })
    values.curriculum.unitNameBySession = { 1: '단원' }
    values.schedule.eventNameByDetail = { 1: '일정' }
    const next = applyEducationStructureReset(values, 'curriculum')
    expect(next.extras.programType).toBe('curriculum')
    expect(next.schedule.eventNameByDetail).toEqual({})
    expect(next.schedule.preEducationName).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    expect(next.curriculum.unitNameBySession).toEqual({ 1: '단원' })
  })

  it('세부 일정·그룹 수 축소는 해당 맵만 자른다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      scheduleCurriculumDetailCount: 3,
      scheduleCurriculumGroupCount: 2,
    })
    values.schedule.eventNameByDetail = { 1: 'a', 2: 'b', 3: 'c' }
    values.schedule.groupTimesByDetail = {
      1: [{ startTime: '09:00' }, { startTime: '13:00' }],
    }
    const details = applyScheduleDetailCountTrim(values, 1)
    expect(details.schedule.eventNameByDetail).toEqual({ 1: 'a' })
    const groups = applyScheduleGroupCountTrim(values, 1)
    expect(groups.schedule.groupTimesByDetail[1]).toEqual([{ startTime: '09:00' }])
  })

  it('세부 일정 수 축소 시 사전 교육(index 0) 값은 유지한다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      scheduleCurriculumDetailCount: 3,
    })
    values.schedule.educationFormByDetail = { 0: 'offline', 1: 'online', 2: 'hybrid', 3: 'online' }
    values.schedule.scheduleDateByDetailIso = { 0: '2026-11-01', 1: '2026-11-02', 3: '2026-11-04' }
    const details = applyScheduleDetailCountTrim(values, 1)
    expect(details.schedule.educationFormByDetail).toEqual({ 0: 'offline', 1: 'online' })
    expect(details.schedule.scheduleDateByDetailIso).toEqual({ 0: '2026-11-01', 1: '2026-11-02' })
  })

  it('커리큘럼 회차 축소 시 사전 교육 교육 형태(index 0)만 유지한다', () => {
    const values = createDefaultRegistrationWizardUiValues({ curriculumChartSessionCount: 3 })
    values.curriculum.educationFormBySession = { 0: 'offline', 1: 'online', 2: 'hybrid', 3: 'online' }
    values.curriculum.participationBySession = { 0: 'team', 1: 'individual', 3: 'team' }
    const trimmed = applyCurriculumCountTrim(values, 1, 'chart')
    expect(trimmed.curriculum.educationFormBySession).toEqual({ 0: 'offline', 1: 'online' })
    expect(trimmed.curriculum.participationBySession).toEqual({ 1: 'individual' })
  })

  it('trimIndexRecord 기본 호출은 index 0을 여전히 제외한다', () => {
    expect(trimIndexRecord({ 0: 'a', 1: 'b', 2: 'c' }, 1)).toEqual({ 1: 'b' })
  })

  it('CREATE sessionAuthoring은 활성 구조만 maps, 비활성은 clear', () => {
    expect(createRegistrationCreateSessionAuthoring('curriculum')).toEqual({
      curriculum: { kind: 'maps' },
      schedule: { kind: 'clear' },
    })
    expect(createRegistrationCreateSessionAuthoring('schedule')).toEqual({
      curriculum: { kind: 'clear' },
      schedule: { kind: 'maps' },
    })
  })
})

describe('buildScheduleDetailsFromMaps 사전 교육 교육 형태', () => {
  const maps: CommonInfoScheduleMaps = {
    eventNameByDetail: { 1: '본 교육' },
    scheduleDateByDetailIso: {},
    groupTimesByDetail: {},
    educationFormByDetail: {},
    participationByDetail: {},
    ipsByDetailIndex: {},
    assignmentByDetail: {},
    preEducationName: '',
  }
  const baseExtras = {
    programType: 'schedule',
    sessionRoundType: 'single',
    scheduleCurriculumPreEducation: true,
    scheduleCurriculumDetailCount: 1,
  } as const

  it('perSchedule이고 index 0이 없으면 사전 교육 행도 온라인 기본값', () => {
    const rows = buildScheduleDetailsFromMaps(maps, {
      ...baseExtras,
      educationFormScheduleDetail: 'perSchedule',
    } as Parameters<typeof buildScheduleDetailsFromMaps>[1])
    expect(rows[0]).toEqual(
      expect.objectContaining({
        scheduleLabel: PRE_EDUCATION_SCHEDULE_LABEL,
        educationFormLabel: '온라인',
      })
    )
  })

  it('common이고 index 0이 없어도 사전 교육 행은 온라인 기본값', () => {
    const rows = buildScheduleDetailsFromMaps(maps, {
      ...baseExtras,
      educationFormScheduleDetail: 'common',
    } as Parameters<typeof buildScheduleDetailsFromMaps>[1])
    expect(rows[0]?.educationFormLabel).toBe('온라인')
  })

  it('common이어도 index 0이 offline이면 사전 교육 행은 오프라인', () => {
    const rows = buildScheduleDetailsFromMaps(
      { ...maps, educationFormByDetail: { 0: 'offline' } },
      {
        ...baseExtras,
        educationFormScheduleDetail: 'common',
      } as Parameters<typeof buildScheduleDetailsFromMaps>[1]
    )
    expect(rows[0]?.educationFormLabel).toBe('오프라인')
  })
})

describe('buildCurriculumSessionsFromMaps 사전 교육 교육 형태', () => {
  const extras = {
    programType: 'curriculum',
    sessionRoundType: 'multi',
    scheduleCurriculumPreEducation: true,
    curriculumChartSessionCount: 1,
    curriculumSessionCount: 1,
    educationFormScheduleDetail: 'common',
  } as Parameters<typeof buildCurriculumSessionsFromMaps>[1]

  it('common이고 index 0이 없으면 사전 교육 행은 온라인', () => {
    const maps = { ...emptyCurriculumMaps(), unitNameBySession: { 1: '단원' } }
    const rows = buildCurriculumSessionsFromMaps(maps, extras)
    expect(rows[0]).toEqual(
      expect.objectContaining({ isPreEducation: true, educationFormLabel: '온라인' })
    )
  })

  it('common이어도 index 0이 offline이면 사전 교육 행은 오프라인', () => {
    const maps = {
      ...emptyCurriculumMaps(),
      unitNameBySession: { 1: '단원' },
      educationFormBySession: { 0: 'offline' },
    }
    const rows = buildCurriculumSessionsFromMaps(maps, extras)
    expect(rows[0]).toEqual(
      expect.objectContaining({ isPreEducation: true, educationFormLabel: '오프라인' })
    )
  })
})
