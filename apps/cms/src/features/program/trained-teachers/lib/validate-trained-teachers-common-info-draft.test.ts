import { describe, expect, it } from 'vitest'
import { validateTrainedTeachersCommonInfoDraft } from './validate-trained-teachers-common-info-draft'

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
})
