import { describe, expect, it } from 'vitest'
import {
  EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
  EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  resolveTrainedTeachersCommonInfoDraftValidationAlert,
  validateTrainedTeachersCommonInfoDraft,
} from './validate-trained-teachers-common-info-draft'

describe('validateTrainedTeachersCommonInfoDraft', () => {
  it('일정형 단일 — 일정명 미입력 시 한글 메시지를 반환한다', () => {
    expect(
      validateTrainedTeachersCommonInfoDraft({
        educationStructure: 'schedule',
        sessionRound: 'single',
        scheduleDetails: [{ name: '' }],
        progressGroupsByDetail: [['09:30 ~ 09:40']],
        educationScheduleLines: ['2026-01-01 09:00 ~ 10:00'],
      })
    ).toBe('세부 일정 01의 일정명을 입력해 주세요.')
  })

  it('일정형 단일 — 진행 시간 미입력 시 한글 메시지를 반환한다', () => {
    expect(
      validateTrainedTeachersCommonInfoDraft({
        educationStructure: 'schedule',
        sessionRound: 'single',
        scheduleDetails: [{ name: '1차' }],
        progressGroupsByDetail: [['']],
        educationScheduleLines: ['2026-01-01 09:00 ~ 10:00'],
      })
    ).toBe('세부 일정 01의 진행 시간을 입력해 주세요.')
  })

  it('일정형 복수 — 교육 진행 예정일 검증을 건너뛴다', () => {
    expect(
      validateTrainedTeachersCommonInfoDraft({
        educationStructure: 'schedule',
        sessionRound: 'multi',
        scheduleDetails: [{ name: '행사' }],
        progressGroupsByDetail: [[]],
        educationScheduleLines: [],
      })
    ).toBeUndefined()
  })

  it('커리큘럼형 — 교육 진행 예정일 미입력 시 한글 메시지를 반환한다', () => {
    expect(
      validateTrainedTeachersCommonInfoDraft({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        scheduleDetails: [],
        progressGroupsByDetail: [],
        educationScheduleLines: [''],
      })
    ).toBe('교육 진행 예정일을 입력해 주세요.')
  })

  it('커리큘럼형 — 사업 운영기간 밖 일정은 일반과 동일 안내를 반환한다', () => {
    expect(
      resolveTrainedTeachersCommonInfoDraftValidationAlert({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        scheduleDetails: [],
        progressGroupsByDetail: [],
        educationScheduleLines: ['2026.12.01(화) 10:00 ~ 12:00'],
        operationStart: '2026-01-01',
        operationEnd: '2026-06-30',
      })
    ).toEqual({
      title: EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
      content: EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE,
    })
  })

  it('커리큘럼형 — 사업 운영기간 안 일정은 통과한다', () => {
    expect(
      validateTrainedTeachersCommonInfoDraft({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        scheduleDetails: [],
        progressGroupsByDetail: [],
        educationScheduleLines: ['2026.03.15(일) 10:00 ~ 12:00'],
        operationStart: '2026-01-01',
        operationEnd: '2026-06-30',
      })
    ).toBeUndefined()
  })
})
