/**
 * TODO(temp-mock): 열여라 참깨 — 참여 봉사자 정산 현황 검증 후 삭제
 */

import type { ParticipatingVolunteerSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-volunteer-settlement-row'
import { PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'

export const TEMP_VOLUNTEER_SETTLEMENT_ROW_PREFIX = 'temp-volunteer-settlement-'

type TempVolunteerSettlementCase = {
  suffix: string
  institutionName: string
  assignedGrade: string
  scheduleLabel: string
  progress: ParticipatingVolunteerSettlementApiRow['volunteerProgress']
  paymentStatementStatus: InstructorSettlementUiStatus
  hasPaymentStatementApplication: boolean
  scheduledSettlementAmount: number | null
  sessionCompleted: number
  sessionTotal: number
}

const TEMP_VOLUNTEER_SETTLEMENT_CASES: TempVolunteerSettlementCase[] = [
  {
    suffix: 'awaiting',
    institutionName: '서울해봄초등학교',
    assignedGrade: '초등학교 4학년',
    scheduleLabel: '2026. 10. 13(월) 09:00 ~ 10:50 | 1회차',
    progress: 'completed',
    paymentStatementStatus: 'awaiting_confirmation',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 50_000,
    sessionCompleted: 1,
    sessionTotal: 4,
  },
  {
    suffix: 'partial',
    institutionName: '서울푸른초등학교',
    assignedGrade: '초등학교 5학년',
    scheduleLabel: '2026. 10. 14(화) 10:00 ~ 11:50 | 2회차',
    progress: 'completed',
    paymentStatementStatus: 'partial_confirmation',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 55_000,
    sessionCompleted: 2,
    sessionTotal: 4,
  },
  {
    suffix: 'verified',
    institutionName: '서울나래초등학교',
    assignedGrade: '초등학교 6학년',
    scheduleLabel: '2026. 10. 15(수) 09:00 ~ 10:50 | 3회차',
    progress: 'completed',
    paymentStatementStatus: 'payment_statement_verified',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 60_000,
    sessionCompleted: 3,
    sessionTotal: 4,
  },
  {
    suffix: 'paid',
    institutionName: '서울미래중학교',
    assignedGrade: '중학교 1학년',
    scheduleLabel: '2026. 10. 16(목) 13:00 ~ 14:50 | 4회차',
    progress: 'completed',
    paymentStatementStatus: 'account_paid',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 65_000,
    sessionCompleted: 4,
    sessionTotal: 4,
  },
  {
    suffix: 'none',
    institutionName: '서울해봄초등학교',
    assignedGrade: '초등학교 4학년',
    scheduleLabel: '2026. 10. 20(월) 09:00 ~ 10:50 | 1회차',
    progress: 'completed',
    paymentStatementStatus: 'none',
    hasPaymentStatementApplication: false,
    scheduledSettlementAmount: null,
    sessionCompleted: 1,
    sessionTotal: 4,
  },
  {
    suffix: 'rejected',
    institutionName: '서울푸른초등학교',
    assignedGrade: '초등학교 5학년',
    scheduleLabel: '2026. 10. 21(화) 10:00 ~ 11:50 | 2회차',
    progress: 'completed',
    paymentStatementStatus: 'application_rejected',
    hasPaymentStatementApplication: true,
    scheduledSettlementAmount: 45_000,
    sessionCompleted: 2,
    sessionTotal: 4,
  },
  {
    suffix: 'scheduled',
    institutionName: '서울나래초등학교',
    assignedGrade: '초등학교 6학년',
    scheduleLabel: '2026. 11. 03(화) 09:00 ~ 10:50 | 3회차',
    progress: 'scheduled',
    paymentStatementStatus: 'none',
    hasPaymentStatementApplication: false,
    scheduledSettlementAmount: null,
    sessionCompleted: 0,
    sessionTotal: 4,
  },
  {
    suffix: 'withdrawn',
    institutionName: '서울미래중학교',
    assignedGrade: '중학교 1학년',
    scheduleLabel: '2026. 11. 10(화) 13:00 ~ 14:50 | 4회차',
    progress: 'activity_withdrawn',
    paymentStatementStatus: 'none',
    hasPaymentStatementApplication: false,
    scheduledSettlementAmount: null,
    sessionCompleted: 0,
    sessionTotal: 4,
  },
]

export function buildTemporaryParticipatingVolunteerSettlementRows(
  volunteer: ParticipatingVolunteerRow
): ParticipatingVolunteerSettlementApiRow[] {
  const volunteerKey = volunteer.id || volunteer.memberId || 'volunteer'
  const n = TEMP_VOLUNTEER_SETTLEMENT_CASES.length

  return TEMP_VOLUNTEER_SETTLEMENT_CASES.map((item, index) => {
    const institutionFromVolunteer = volunteer.assignedInstitutionNames?.[index % Math.max(volunteer.assignedInstitutionNames.length, 1)]
    const institutionName = institutionFromVolunteer || item.institutionName
    const canView =
      item.progress === 'completed' &&
      item.hasPaymentStatementApplication &&
      item.paymentStatementStatus !== 'none'

    return {
      id: `${TEMP_VOLUNTEER_SETTLEMENT_ROW_PREFIX}${volunteerKey}-${item.suffix}`,
      settlementId: 970_001 + index,
      no: n - index,
      institutionName,
      assignedGrade: item.assignedGrade,
      volunteerScheduleLabel: item.scheduleLabel,
      volunteerProgress: item.progress,
      volunteerProgressLabel: PARTICIPATING_INDIVIDUAL_INSTRUCTOR_LECTURE_PROGRESS_LABELS[item.progress],
      hasPaymentStatementApplication: item.hasPaymentStatementApplication,
      paymentStatementStatus: item.paymentStatementStatus,
      scheduledSettlementAmount: item.scheduledSettlementAmount,
      canViewPaymentStatement: canView,
      sessionCompleted: item.sessionCompleted,
      sessionTotal: item.sessionTotal,
    }
  })
}
