import { describe, expect, it } from 'vitest'
import type { ProgramAbsenceReasonItem } from '@/features/program/general/api/absence-reasons'
import { resolveAttendanceCorrectionAutoReason } from './attendance-correction-submitted-reason'

function item(over: Partial<ProgramAbsenceReasonItem>): ProgramAbsenceReasonItem {
  return {
    submissionId: 1,
    programId: 186400,
    scheduleId: 187363,
    participantId: 1694920,
    memberId: 190126,
    reason: '코로나',
    reviewStatus: 'SUBMITTED',
    latestRevision: true,
    revisionNo: 1,
    fileObjectIds: [2056251],
    originalFileNames: ['샘플팝업.png'],
    ...over,
  }
}

const base = {
  programId: 186400,
  participantId: 1694920,
  scheduleId: 187363,
  confirmedExcusedAbsence: false,
}

describe('resolveAttendanceCorrectionAutoReason', () => {
  it('SUBMITTED 최신 신청 사유를 반환한다', () => {
    expect(resolveAttendanceCorrectionAutoReason({ ...base, items: [item({})] })).toBe('코로나')
  })

  it('확정된 사유 불참은 출석 기록 사유를 우선한다', () => {
    expect(
      resolveAttendanceCorrectionAutoReason({
        ...base,
        items: [item({})],
        confirmedExcusedAbsence: true,
        confirmedReason: '병원',
      })
    ).toBe('병원')
  })

  it('REJECTED만 있으면 자동 입력하지 않는다', () => {
    expect(
      resolveAttendanceCorrectionAutoReason({
        ...base,
        items: [item({ reviewStatus: 'REJECTED' })],
      })
    ).toBe('')
  })

  it('다른 일정·참여자 사유는 쓰지 않는다', () => {
    expect(
      resolveAttendanceCorrectionAutoReason({
        ...base,
        items: [
          item({ scheduleId: 1, reason: '다른일정' }),
          item({ participantId: 2, reason: '다른참여자' }),
        ],
      })
    ).toBe('')
  })

  it('동일 일정 여러 건이면 revisionNo가 큰 SUBMITTED만 쓴다', () => {
    expect(
      resolveAttendanceCorrectionAutoReason({
        ...base,
        items: [
          item({ revisionNo: 1, reason: '이전' }),
          item({ revisionNo: 2, reason: '최신', submissionId: 9 }),
        ],
      })
    ).toBe('최신')
  })

  it('latestRevision이 아니면 쓰지 않는다', () => {
    expect(
      resolveAttendanceCorrectionAutoReason({
        ...base,
        items: [item({ latestRevision: false, reason: '과거' })],
      })
    ).toBe('')
  })

  it('조회 결과 없으면 빈 문자열이다', () => {
    expect(resolveAttendanceCorrectionAutoReason({ ...base, items: null })).toBe('')
    expect(resolveAttendanceCorrectionAutoReason({ ...base, items: [] })).toBe('')
  })

  it('다른 프로그램 사유는 쓰지 않는다', () => {
    expect(
      resolveAttendanceCorrectionAutoReason({
        ...base,
        items: [item({ programId: 1, reason: '다른프로그램' })],
      })
    ).toBe('')
  })
})
