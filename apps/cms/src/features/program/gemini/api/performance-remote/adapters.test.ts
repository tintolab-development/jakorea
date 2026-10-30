import { describe, expect, it } from 'vitest'
import {
  mapGeminiTrainingReportItemToRow,
  mapUploadAndDisplayToImportRow,
} from './adapters'
import type { GeminiPerformanceRow } from '../../model/performance/types'

describe('gemini performance adapters', () => {
  it('maps training report list item with gaps filled', () => {
    const row = mapGeminiTrainingReportItemToRow(
      {
        trainingReportId: 7,
        programNameKo: '찾아가는 연수',
        instructorName: '홍길동',
        schoolOrOrganizationName: '서울초',
        trainingDate: '2026-03-01',
        trainingMinutes: 90,
        classCount: 2,
        calculatedAmount: 10000,
        accountPaymentId: 55,
        createdAt: '2026-03-02T00:00:00Z',
      },
      0
    )
    expect(row.id).toBe('7')
    expect(row.instructorName).toBe('홍길동')
    expect(row.trainingLocation).toBe('서울초')
    expect(row.trainingHours).toBe(1.5)
    expect(row.trainingMethod).toBe('OFFLINE')
    expect(row.participantCount).toBeNull()
    expect(row.assistantInstructorNames).toBe('-')
    expect(row.accountPaymentId).toBe(55)
  })

  it('maps start/end time, assistants, and participantCount from the list DTO', () => {
    const row = mapGeminiTrainingReportItemToRow(
      {
        trainingReportId: 8,
        trainingLocation: '서울',
        trainingStartTime: '13:30:00',
        trainingEndTime: '16:30:00',
        participantCount: 21,
        topic: 'Gemini 아카데미',
        assistantInstructorNames: '곽도규, 김도영',
        assistantInstructorCount: 2,
        deliveryType: 'OFFLINE',
      },
      0
    )
    expect(row.detailTimeText).toBe('13:30 ~ 16:30')
    expect(row.participantCount).toBe(21)
    expect(row.trainingTopic).toBe('Gemini 아카데미')
    expect(row.assistantInstructorNames).toBe('곽도규, 김도영')
    expect(row.instructorCount).toBe(2)
    expect(row.trainingFormat).toBe('-')
    expect(row.trainingMethod).toBe('OFFLINE')
  })

  it('omits accountPaymentId when the list item has none', () => {
    const row = mapGeminiTrainingReportItemToRow({ trainingReportId: 1 }, 0)
    expect(row.accountPaymentId).toBeUndefined()
  })

  it('does not treat accountPaymentId 0 as paid', () => {
    const row = mapGeminiTrainingReportItemToRow({ trainingReportId: 1, accountPaymentId: 0 }, 0)
    expect(row.accountPaymentId).toBeUndefined()
  })

  it('maps upload+display to import row', () => {
    const display: GeminiPerformanceRow = {
      id: 'tmp',
      no: 1,
      createdAt: '2026-01-01T00:00:00Z',
      duplicateKey: 'k',
      trainingLocation: '온라인',
      trainingDate: '2026-04-01',
      participantCount: 10,
      detailTimeText: '10:00~11:00',
      trainingHours: 1,
      trainingTopic: '주제',
      instructorName: '김강사',
      assistantInstructorNames: '이보조',
      instructorCount: 2,
      trainingFormat: '강의',
      trainingMethod: 'ONLINE',
      contact: '010',
      instructorMemberId: '42',
    }
    const importRow = mapUploadAndDisplayToImportRow(
      {
        timestamp: '',
        instructorName: '김강사',
        assistantInstructorNames: '이보조',
        trainingFormat: '강의',
        contact: '01012345678',
        email: 'a@b.c',
        school: '학교',
        paymentDestination: '',
        trainingLocation: '온라인',
        trainingDate: '2026-04-01',
        trainingStartTime: '10:00',
        trainingEndTime: '11:00',
        classCount: 2,
        participantCount: 10,
      },
      display
    )
    expect(importRow.instructorMemberId).toBe(42)
    expect(importRow.instructorEmail).toBe('a@b.c')
    expect(importRow.instructorPhone).toBe('010-1234-5678')
    expect(importRow.trainingDate).toBe('2026-04-01')
    expect(importRow.trainingStartTime).toBe('10:00:00')
    expect(importRow.trainingEndTime).toBe('11:00:00')
    expect(importRow.trainingSessionCount).toBe(2)
    expect(importRow.participantCount).toBe(10)
    expect(importRow.trainingMinutes).toBeUndefined()
    expect(importRow.schoolOrOrganizationName).toBe('학교')
  })
})
