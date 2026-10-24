/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { PRE_EDUCATION_SCHEDULE_LABEL } from '@/features/program/general/lib/schedule-detail-form'
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
