/**
 * TODO(temp-mock): 열여라 참깨 — 참여 강사 정산 현황 검증 후 삭제
 */

import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export const TEMP_INSTRUCTOR_SETTLEMENT_ROW_PREFIX = 'temp-instructor-settlement-'

type TempInstructorSettlementCase = {
  suffix: string
  institutionName: string
  educationGrade: string
  scheduleLabel: string
  lectureProgress: ParticipatingInstructorSettlementApiRow['lectureProgress']
  paymentStatementStatus: InstructorSettlementUiStatus
  hasPaymentStatementApplication: boolean
  scheduledSettlementAmount: number | null
  sessionCompleted: number
  sessionTotal: number
}

const TEMP_INSTRUCTOR_SETTLEMENT_CASES: TempInstructorSettlementCase[] = [
  {
    suffix: 'awaiting',
    institutionName: '서울해봄초등학교',
    educationGrade: '초등학교 4학년',
    scheduleLabel: '2026. 10. 13(월) 09:00 ~ 10:50 | 1회차',
    lectureProgress: 'completed',
    paymentStatementStatus: 'awaiting_confirmation',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 150_000,
    sessionCompleted: 1,
    sessionTotal: 4,
  },
  {
    suffix: 'partial',
    institutionName: '서울푸른초등학교',
    educationGrade: '초등학교 5학년',
    scheduleLabel: '2026. 10. 14(화) 10:00 ~ 11:50 | 2회차',
    lectureProgress: 'completed',
    paymentStatementStatus: 'partial_confirmation',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 150_000,
    sessionCompleted: 2,
    sessionTotal: 4,
  },
  {
    suffix: 'verified',
    institutionName: '서울나래초등학교',
    educationGrade: '초등학교 6학년',
    scheduleLabel: '2026. 10. 15(수) 09:00 ~ 10:50 | 3회차',
    lectureProgress: 'completed',
    paymentStatementStatus: 'payment_statement_verified',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 150_000,
    sessionCompleted: 3,
    sessionTotal: 4,
  },
  {
    suffix: 'paid',
    institutionName: '서울미래중학교',
    educationGrade: '중학교 1학년',
    scheduleLabel: '2026. 10. 16(목) 13:00 ~ 14:50 | 4회차',
    lectureProgress: 'completed',
    paymentStatementStatus: 'account_paid',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 150_000,
    sessionCompleted: 4,
    sessionTotal: 4,
  },
  {
    suffix: 'scheduled',
    institutionName: '서울해봄초등학교',
    educationGrade: '초등학교 4학년',
    scheduleLabel: '2026. 11. 03(화) 09:00 ~ 10:50 | 1회차',
    lectureProgress: 'scheduled',
    paymentStatementStatus: 'none',
    hasPaymentStatementApplication: false,
    scheduledSettlementAmount: null,
    sessionCompleted: 0,
    sessionTotal: 4,
  },
]

export function buildTemporaryParticipatingInstructorSettlementRows(
  instructor: ParticipatingInstructorRow
): ParticipatingInstructorSettlementApiRow[] {
  const instructorKey = instructor.id || instructor.memberId || 'instructor'
  const n = TEMP_INSTRUCTOR_SETTLEMENT_CASES.length

  return TEMP_INSTRUCTOR_SETTLEMENT_CASES.map((item, index) => {
    const institutionFromInstructor =
      instructor.assignedOrganizationNames?.[
        index % Math.max(instructor.assignedOrganizationNames.length, 1)
      ] ?? instructor.schoolName
    const institutionName = institutionFromInstructor || item.institutionName
    const canView =
      item.lectureProgress === 'completed' &&
      item.hasPaymentStatementApplication &&
      item.paymentStatementStatus !== 'none'

    return {
      id: `${TEMP_INSTRUCTOR_SETTLEMENT_ROW_PREFIX}${instructorKey}-${item.suffix}`,
      settlementId: 960_001 + index,
      no: n - index,
      institutionName,
      educationGrade: item.educationGrade,
      educationScheduleLabel: item.scheduleLabel,
      lectureProgress: item.lectureProgress,
      lectureProgressLabel:
        item.lectureProgress === 'completed' ? '진행 완료' : '진행 예정',
      hasPaymentStatementApplication: item.hasPaymentStatementApplication,
      paymentStatementStatus: item.paymentStatementStatus,
      scheduledSettlementAmount: item.scheduledSettlementAmount,
      canViewPaymentStatement: canView,
      sessionCompleted: item.sessionCompleted,
      sessionTotal: item.sessionTotal,
    }
  })
}
