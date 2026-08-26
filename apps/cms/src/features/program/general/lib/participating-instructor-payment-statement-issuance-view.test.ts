import { describe, expect, it } from 'vitest'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { buildParticipatingInstructorPaymentStatementViewOptions } from './participating-instructor-payment-statement-issuance-view'

const instructor = (
  overrides: Partial<ParticipatingInstructorRow> = {}
): ParticipatingInstructorRow => ({
  id: 'pi-1',
  no: 1,
  instructorName: '홍길동',
  schoolName: '진월초등학교',
  educationGrade: '초등',
  classCount: 1,
  studentCount: 24,
  lectureRound: '3회차',
  settlementStatus: 'payment_statement_verified',
  teacherName: '김교사',
  ...overrides,
})

describe('buildParticipatingInstructorPaymentStatementViewOptions', () => {
  it('없는 PII·강의비를 최강사 샘플로 채우지 않는다', () => {
    const options = buildParticipatingInstructorPaymentStatementViewOptions(instructor(), {
      id: 'set-1',
      schoolName: '진월초등학교',
      educationScheduleLabel: '2026. 08. 15(토) 10:00 | 3회차',
      scheduledSettlementAmount: null,
    })
    const serialized = JSON.stringify(options)

    expect(options.paymentStatementBasicInfoValues?.nameKo).toBe('홍길동')
    expect(options.paymentStatementBasicInfoValues?.nameEn).toBe('')
    expect(options.paymentStatementBasicInfoValues?.addressDetail).toBe('')
    expect(options.paymentStatementBasicInfoValues?.residentFront).toBe('')
    expect(options.paymentStatementBasicInfoValues?.bankName).toBe('')
    expect(options.paymentStatementBasicInfoValues?.accountNumber).toBe('')
    expect(options.lectureFeeCalculationValues?.lectureFeeType).toBe('')
    expect(options.lectureFeeCalculationValues?.totalLectureFee).toBe('')
    expect(options.paymentStatementCalculationLines?.blocks[0]?.lines).toEqual([])
    expect(serialized).not.toContain('최강사')
    expect(serialized).not.toContain('Choi Kang-sa')
    expect(serialized).not.toContain('JA빌딩')
    expect(serialized).not.toContain('850320')
    expect(serialized).not.toContain('3급 강사비')
    expect(serialized).not.toContain('240,000')
  })

  it('정산 금액이 있으면 산출 라인만 실데이터로 채운다', () => {
    const options = buildParticipatingInstructorPaymentStatementViewOptions(
      instructor({ nameEnglish: 'Hong Gildong', bankName: '국민은행' }),
      {
        id: 'set-2',
        schoolName: '진월초등학교',
        educationScheduleLabel: '2026. 08. 15(토) | 3회차',
        scheduledSettlementAmount: 915000,
      }
    )

    expect(options.paymentStatementBasicInfoValues?.nameEn).toBe('Hong Gildong')
    expect(options.paymentStatementBasicInfoValues?.bankName).toBe('국민은행')
    expect(options.paymentStatementCalculationLines?.blocks[0]?.lines.length).toBe(2)
    expect(JSON.stringify(options)).not.toContain('최강사')
  })
})
