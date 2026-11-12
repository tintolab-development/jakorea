import { describe, expect, it } from 'vitest'
import {
  createDefaultTrainedTeachersRegistrationRhfValues,
  createNewTrainedTeachersRegistrationRhfValues,
  normalizeTrainedTeachersNewRegistrationRhfValues,
  readTrainedTeachersRhfOverlayValue,
  writeTrainedTeachersRhfOverlayValue,
} from './registration-rhf-values'

const SCHEDULE_PREFIX = 'trainedTeachersRegistration.educationScheduleSettings'

describe('교육받은 교사 신규 등록 기본값 (시안 9899:221372)', () => {
  it('IP Owned·Course Delivered By = JA, Partner Involvement = No, 사업 분야 미선택', () => {
    const values = createNewTrainedTeachersRegistrationRhfValues()
    expect(values.ipOwned).toBe('ja')
    expect(values.courseDeliveredBy).toBe('ja')
    expect(values.partnerInvolvement).toBe(false)
    expect(values.businessArea).toBe('')
    expect(
      readTrainedTeachersRhfOverlayValue(values, 'trainedTeachersRegistration.basicInfo.partnerInvolvement')
    ).toBe('no')
  })

  it('임시저장 복원용 기본값은 저장값을 덮지 않도록 선택값을 넣지 않는다', () => {
    const blank = createDefaultTrainedTeachersRegistrationRhfValues()
    expect(blank.ipOwned).toBeUndefined()
    expect(blank.courseDeliveredBy).toBeUndefined()
  })

  it('Partner Involvement 값 없음은 No로 저장한다 — Yes는 명시 선택만', () => {
    const base = createDefaultTrainedTeachersRegistrationRhfValues()
    const key = 'trainedTeachersRegistration.basicInfo.partnerInvolvement'
    expect(writeTrainedTeachersRhfOverlayValue(base, key, '').partnerInvolvement).toBe(false)
    expect(writeTrainedTeachersRhfOverlayValue(base, key, undefined).partnerInvolvement).toBe(false)
    expect(writeTrainedTeachersRhfOverlayValue(base, key, 'no').partnerInvolvement).toBe(false)
    expect(writeTrainedTeachersRhfOverlayValue(base, key, 'yes').partnerInvolvement).toBe(true)
  })
})

describe('normalizeTrainedTeachersNewRegistrationRhfValues', () => {
  it('커리큘럼형·기간 지정 draft는 그대로 둔다', () => {
    const values = {
      ...createDefaultTrainedTeachersRegistrationRhfValues(),
      educationStructure: 'curriculum' as const,
      educationScheduleMode: 'period' as const,
      educationScheduleLines: ['26년 11월 3일(화) ~ 26년 11월 28일(토)'],
    }
    expect(normalizeTrainedTeachersNewRegistrationRhfValues(values)).toBe(values)
  })

  it('예전 draft의 일정형·날짜 지정은 커리큘럼형·기간 지정으로 맞추고 날짜 지정 예정일은 버린다', () => {
    const periodLine = '26년 11월 3일(화) ~ 26년 11월 28일(토)'
    const values = {
      ...createDefaultTrainedTeachersRegistrationRhfValues(),
      educationStructure: 'schedule' as const,
      educationScheduleMode: 'date' as const,
      educationScheduleLines: ['26년 11월 5일(목) 10:00 ~ 12:00'],
      scheduleDetails: [{ name: '세부 일정' }] as never,
      sidecar: {
        [`${SCHEDULE_PREFIX}.singleDateIso`]: '2026-11-05T00:00:00.000Z',
        [`${SCHEDULE_PREFIX}.scheduleLinesByPeriod`]: [periodLine],
      },
    }
    const next = normalizeTrainedTeachersNewRegistrationRhfValues(values)
    expect(next.educationStructure).toBe('curriculum')
    expect(next.educationScheduleMode).toBe('period')
    expect(next.educationScheduleLines).toEqual([periodLine])
    expect(next.scheduleDetails).toEqual([])
    expect(next.sidecar[`${SCHEDULE_PREFIX}.singleDateIso`]).toBeUndefined()
    // 원본은 바꾸지 않는다
    expect(values.educationScheduleMode).toBe('date')
  })
})
