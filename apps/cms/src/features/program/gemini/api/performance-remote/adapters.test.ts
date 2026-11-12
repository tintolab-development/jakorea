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

  it('maps blank-instructor SUCCESS exclusion to - and keeps paymentExclusionReason', () => {
    const row = mapGeminiTrainingReportItemToRow(
      {
        trainingReportId: 12001,
        instructorMemberId: undefined,
        instructorName: undefined,
        trainingLocation: '서울초',
        trainingDate: '2026-04-01',
        paymentExclusionReason: 'GEMINI_INSTRUCTOR_IDENTITY_BLANK',
        accountPaymentId: null,
        calculatedAmount: 50000,
      },
      0
    )
    expect(row.instructorName).toBe('-')
    expect(row.instructorMemberId).toBeUndefined()
    expect(row.accountPaymentId).toBeUndefined()
    expect(row.paymentExclusionReason).toBe('GEMINI_INSTRUCTOR_IDENTITY_BLANK')
    expect(row.calculatedAmount).toBe(50000)
  })

  it('passes through EXTERNAL_PAYEE paymentExclusionReason and keeps instructor name', () => {
    const row = mapGeminiTrainingReportItemToRow(
      {
        trainingReportId: 186512,
        instructorMemberId: undefined,
        instructorName: '정현익스펙토페트로눔',
        trainingLocation: '서울개운초등학교',
        trainingDate: '2026-10-01',
        paymentExclusionReason: 'GEMINI_INSTRUCTOR_EXTERNAL_PAYEE',
        accountPaymentId: null,
        calculatedAmount: 170000,
      },
      0
    )
    expect(row.instructorName).toBe('정현익스펙토페트로눔')
    expect(row.instructorMemberId).toBeUndefined()
    expect(row.accountPaymentId).toBeUndefined()
    expect(row.paymentExclusionReason).toBe('GEMINI_INSTRUCTOR_EXTERNAL_PAYEE')
  })

  it('does not treat accountPaymentId 0 as paid', () => {
    const row = mapGeminiTrainingReportItemToRow({ trainingReportId: 1, accountPaymentId: 0 }, 0)
    expect(row.accountPaymentId).toBeUndefined()
  })

  it('maps deleteBlocked from the server as is, without accountPaymentId', () => {
    const confirmed = mapGeminiTrainingReportItemToRow(
      { trainingReportId: 1, settlementId: 10, statementStatus: 'CONFIRMED', deleteBlocked: true },
      0
    )
    expect(confirmed.deleteBlocked).toBe(true)
    expect(confirmed.accountPaymentId).toBeUndefined()

    const waiting = mapGeminiTrainingReportItemToRow(
      { trainingReportId: 2, settlementId: 11, statementStatus: 'WAITING_CONFIRM', deleteBlocked: false },
      1
    )
    expect(waiting.deleteBlocked).toBe(false)

    const missing = mapGeminiTrainingReportItemToRow({ trainingReportId: 3 }, 2)
    expect(missing.deleteBlocked).toBe(false)
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
        contact: ' 010-1234-5678 ',
        email: 'a@b.c',
        school: '학교',
        paymentDestination: ' 외 부 ',
        trainingLocation: '온라인',
        trainingDate: '2026-04-01',
        trainingStartTime: '10:00',
        trainingEndTime: '11:00',
        classCount: 2,
        participantCount: 10,
      },
      display
    )
    expect(importRow.instructorMemberId).toBeUndefined()
    expect(importRow.instructorEmail).toBe('a@b.c')
    expect(importRow.instructorPhone).toBe('010-1234-5678')
    expect(importRow.instructorName).toBe('김강사')
    expect(importRow.feePayee).toBe(' 외 부 ')
    expect(importRow.trainingDate).toBe('2026-04-01')
    expect(importRow.trainingStartTime).toBe('10:00:00')
    expect(importRow.trainingEndTime).toBe('11:00:00')
    expect(importRow.trainingSessionCount).toBe(2)
    expect(importRow.participantCount).toBe(10)
    expect(importRow.trainingMinutes).toBeUndefined()
    expect(importRow.schoolOrOrganizationName).toBe('학교')
  })

  // BE @KoreanPhoneNumber가 어긋나면 preview 전체가 400 → 정상 파일이 「양식 불일치 안내」로 거부됐다.
  it.each([
    ['010 3327 5124', '010-3327-5124'],
    ['01033275124', '010-3327-5124'],
    [' 010-3327-5124 ', '010-3327-5124'],
    ['02 123 4567', '02-123-4567'],
    ['12345', '12345'],
  ])('sends instructor phone %j as %j', (contact, expected) => {
    const importRow = mapUploadAndDisplayToImportRow(
      {
        timestamp: '',
        instructorName: '김성재',
        assistantInstructorNames: '',
        trainingFormat: '찾아가는 연수',
        contact,
        email: '',
        school: '학교',
        paymentDestination: 'JA Korea',
        trainingLocation: '학교',
        trainingDate: '2026-04-12',
        trainingStartTime: '10:00',
        trainingEndTime: '11:30',
        classCount: 2,
        participantCount: 20,
      },
      { trainingDate: '2026-04-12' } as GeminiPerformanceRow
    )
    expect(importRow.instructorPhone).toBe(expected)
  })

  it('omits blank identity, sends blank fee payee as null, and invents no member data', () => {
    const display: GeminiPerformanceRow = {
      id: 'tmp',
      no: 1,
      createdAt: '2026-01-01T00:00:00Z',
      duplicateKey: 'k',
      trainingLocation: '서울초',
      trainingDate: '2026-04-01',
      participantCount: 10,
      detailTimeText: '10:00~11:00',
      trainingHours: 1,
      trainingTopic: '주제',
      instructorName: '',
      assistantInstructorNames: '',
      instructorCount: 0,
      trainingFormat: '강의',
      trainingMethod: 'OFFLINE',
      contact: '',
    }
    const importRow = mapUploadAndDisplayToImportRow(
      {
        timestamp: '',
        instructorName: '',
        assistantInstructorNames: '',
        trainingFormat: '강의',
        contact: '',
        email: '',
        school: '서울초',
        paymentDestination: '',
        trainingLocation: '서울초',
        trainingDate: '2026-04-01',
        trainingStartTime: '10:00',
        trainingEndTime: '11:00',
        classCount: 2,
        participantCount: 10,
      },
      display
    )
    expect(importRow.instructorMemberId).toBeUndefined()
    expect(importRow.instructorName).toBeUndefined()
    expect(importRow.instructorPhone).toBeUndefined()
    expect(importRow.feePayee).toBeNull()
    expect(importRow.instructorEmail).toBeUndefined()
    expect(importRow.trainingDate).toBe('2026-04-01')
    expect(importRow.trainingLocation).toBe('서울초')
    expect(importRow.trainingSessionCount).toBe(2)
  })
})
