import { describe, expect, it } from 'vitest'
import { resolveUjatSurveyScheduleFieldFromOptions } from './ujat-survey-schedule-register'

describe('resolveUjatSurveyScheduleFieldFromOptions', () => {
  it('후보가 없으면 일정 선택을 숨기고 자동값도 없다', () => {
    expect(resolveUjatSurveyScheduleFieldFromOptions([])).toEqual({
      showScheduleField: false,
      singleScheduleValue: null,
    })
  })

  it('단일 일정이면 일정 선택을 숨기고 그 일정으로 자동 연결한다', () => {
    expect(resolveUjatSurveyScheduleFieldFromOptions([{ value: '188201' }])).toEqual({
      showScheduleField: false,
      singleScheduleValue: '188201',
    })
  })

  it('복수 일정이면 일정 선택 필드를 연다', () => {
    expect(
      resolveUjatSurveyScheduleFieldFromOptions([{ value: '1' }, { value: '2' }])
    ).toEqual({
      showScheduleField: true,
      singleScheduleValue: null,
    })
  })
})
