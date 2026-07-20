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
        createdAt: '2026-03-02T00:00:00Z',
      },
      0
    )
    expect(row.id).toBe('7')
    expect(row.instructorName).toBe('홍길동')
    expect(row.trainingLocation).toBe('서울초')
    expect(row.trainingHours).toBe(1.5)
    expect(row.trainingMethod).toBe('OFFLINE')
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
        contact: '010',
        email: 'a@b.c',
        school: '학교',
        paymentDestination: '',
        trainingLocation: '온라인',
        trainingDate: '2026-04-01',
        trainingStartTime: '10:00',
        trainingEndTime: '11:00',
        classCount: 1,
        participantCount: 10,
      },
      display
    )
    expect(importRow.instructorMemberId).toBe(42)
    expect(importRow.instructorEmail).toBe('a@b.c')
    expect(importRow.trainingMinutes).toBe(60)
    expect(importRow.schoolOrOrganizationName).toBe('학교')
  })
})
