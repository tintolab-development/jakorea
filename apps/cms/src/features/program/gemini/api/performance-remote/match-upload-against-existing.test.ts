import { describe, expect, it } from 'vitest'
import type { GeminiPerformanceRow, GeminiPerformanceUploadRow } from '../../model/performance/types'
import { matchUploadRowsAgainstExistingReports } from './service'

function upload(
  partial: Partial<GeminiPerformanceUploadRow> &
    Pick<GeminiPerformanceUploadRow, 'trainingDate' | 'trainingLocation' | 'trainingStartTime'>
): GeminiPerformanceUploadRow {
  return {
    timestamp: '',
    instructorName: '',
    assistantInstructorNames: '',
    trainingFormat: '',
    contact: '',
    email: '',
    school: partial.trainingLocation,
    paymentDestination: '',
    trainingEndTime: '12:00',
    classCount: 2,
    participantCount: 10,
    ...partial,
  }
}

function display(duplicateKey: string, trainingDate: string): GeminiPerformanceRow {
  return {
    id: '1',
    no: 1,
    createdAt: '',
    duplicateKey,
    trainingLocation: '중복키테스트학교',
    trainingDate,
    participantCount: 10,
    detailTimeText: '10:00 ~ 12:00',
    trainingHours: 2,
    trainingTopic: '-',
    instructorName: '',
    assistantInstructorNames: '-',
    instructorCount: null,
    trainingFormat: '-',
    trainingMethod: 'OFFLINE',
    contact: '',
  }
}

describe('matchUploadRowsAgainstExistingReports', () => {
  it('flags unpaid BLANK session match for 덮어쓰기/데이터 추가 modal', () => {
    const result = matchUploadRowsAgainstExistingReports(
      [
        upload({
          trainingDate: '2026-08-15',
          trainingLocation: '중복키테스트학교',
          trainingStartTime: '10:00:00',
        }),
      ],
      [display('k1', '2026-08-15')],
      [
        {
          trainingReportId: 185902,
          programId: 186425,
          trainingDate: '2026-08-15',
          trainingLocation: '중복키테스트학교',
          trainingStartTime: '10:00:00',
          instructorName: undefined,
          instructorMemberId: undefined,
          accountPaymentId: undefined,
        },
      ],
      186425
    )
    expect(result.paidDuplicate).toBe(false)
    expect(result.unpaidDuplicateKeys).toEqual(['k1'])
  })

  it('flags paid server match as paidDuplicate (등록 불가)', () => {
    const result = matchUploadRowsAgainstExistingReports(
      [
        upload({
          trainingDate: '2026-10-28',
          trainingLocation: '왕남초등학교',
          trainingStartTime: '14:00:00',
          instructorName: '강하늘',
          contact: '010-1111-2222',
        }),
      ],
      [
        {
          ...display('k-paid', '2026-10-28'),
          instructorName: '강하늘',
          instructorMemberId: '99',
        },
      ],
      [
        {
          trainingReportId: 185888,
          programId: 186425,
          trainingDate: '2026-10-28',
          trainingLocation: '왕남초등학교',
          trainingStartTime: '14:00:00',
          instructorName: '강하늘',
          instructorMemberId: 99,
          accountPaymentId: 185986,
        },
      ],
      186425
    )
    expect(result.paidDuplicate).toBe(true)
    expect(result.unpaidDuplicateKeys).toEqual([])
  })
})
