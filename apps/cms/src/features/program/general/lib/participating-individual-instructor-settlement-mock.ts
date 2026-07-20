import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { Program } from '@/types/domain'
import { formatIndividualInstructorEducationScheduleLabel } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import type { ParticipatingIndividualInstructorLectureProgress } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'
import { parseIndividualInstructorLectureAssignSchedule } from '@/features/program/general/lib/instructor-lecture-assign-schedule'
import type { ParticipatingIndividualInstructorSettlementRow } from '@/features/program/general/lib/participating-individual-instructor-settlement-types'

type DemoSettlementDef = {
  id: string
  dateKey: string
  timeRange: string
  sessionName?: string
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  hasPaymentStatementApplication: boolean
  paymentStatementStatus: InstructorSettlementUiStatus
  scheduledSettlementAmount: number | null
  canViewPaymentStatement: boolean
}

const DEFAULT_DEMO_SETTLEMENT_DEFS: DemoSettlementDef[] = [
  {
    id: 'st-5',
    dateKey: '2026-01-09',
    timeRange: '09:20 ~ 11:20',
    sessionName: '1회차',
    lectureProgress: 'completed',
    hasPaymentStatementApplication: true,
    paymentStatementStatus: 'payment_statement_verified',
    scheduledSettlementAmount: 300_000,
    canViewPaymentStatement: true,
  },
  {
    id: 'st-4',
    dateKey: '2026-01-16',
    timeRange: '09:20 ~ 11:20',
    sessionName: '2회차',
    lectureProgress: 'completed',
    hasPaymentStatementApplication: true,
    paymentStatementStatus: 'application_rejected',
    scheduledSettlementAmount: 300_000,
    canViewPaymentStatement: true,
  },
  {
    id: 'st-3',
    dateKey: '2026-01-23',
    timeRange: '09:20 ~ 11:20',
    sessionName: '3회차',
    lectureProgress: 'completed',
    hasPaymentStatementApplication: true,
    paymentStatementStatus: 'payment_correction_requested',
    scheduledSettlementAmount: 300_000,
    canViewPaymentStatement: true,
  },
  {
    id: 'st-2',
    dateKey: '2026-01-30',
    timeRange: '09:20 ~ 11:20',
    sessionName: '4회차',
    lectureProgress: 'completed',
    hasPaymentStatementApplication: false,
    paymentStatementStatus: 'none',
    scheduledSettlementAmount: null,
    canViewPaymentStatement: false,
  },
  {
    id: 'st-1',
    dateKey: '2026-02-06',
    timeRange: '09:20 ~ 11:20',
    sessionName: '5회차',
    lectureProgress: 'scheduled',
    hasPaymentStatementApplication: false,
    paymentStatementStatus: 'none',
    scheduledSettlementAmount: null,
    canViewPaymentStatement: false,
  },
]

function buildRowFromDef(def: DemoSettlementDef): ParticipatingIndividualInstructorSettlementRow {
  return {
    id: def.id,
    scheduleLabel: formatIndividualInstructorEducationScheduleLabel({
      dateKey: def.dateKey,
      timeRange: def.timeRange,
      sessionName: def.sessionName,
    }),
    lectureProgress: def.lectureProgress,
    hasPaymentStatementApplication: def.hasPaymentStatementApplication,
    paymentStatementStatus: def.paymentStatementStatus,
    scheduledSettlementAmount: def.scheduledSettlementAmount,
    canViewPaymentStatement: def.canViewPaymentStatement,
  }
}

function buildRowsFromProgramSchedule(program: Program): ParticipatingIndividualInstructorSettlementRow[] {
  const slots = parseIndividualInstructorLectureAssignSchedule(program)
  if (slots.length === 0) return []

  const statuses: InstructorSettlementUiStatus[] = [
    'payment_statement_verified',
    'application_rejected',
    'payment_correction_requested',
    'none',
    'none',
  ]

  return slots.map((slot, index) => {
    const lectureProgress: ParticipatingIndividualInstructorLectureProgress =
      index < slots.length - 1 ? 'completed' : 'scheduled'
    const hasPaymentStatementApplication =
      lectureProgress === 'completed' && index < 3
    const paymentStatementStatus = hasPaymentStatementApplication
      ? statuses[index % statuses.length]!
      : 'none'

    return buildRowFromDef({
      id: `st-program-${slot.key}`,
      dateKey: slot.dateKey,
      timeRange: slot.timeRange,
      sessionName: slot.sessionLabel,
      lectureProgress,
      hasPaymentStatementApplication,
      paymentStatementStatus,
      scheduledSettlementAmount: hasPaymentStatementApplication ? 300_000 : null,
      canViewPaymentStatement: hasPaymentStatementApplication,
    })
  })
}

function applyActivityWithdrawn(
  rows: ParticipatingIndividualInstructorSettlementRow[],
  instructor: ParticipatingInstructorRow
): ParticipatingIndividualInstructorSettlementRow[] {
  if (!instructor.activityWithdrawn) return rows

  const stopIndex = Math.max(0, rows.length - 2)
  return rows.map((row, index) => {
    if (index !== stopIndex) return row
    return {
      ...row,
      lectureProgress: 'activity_withdrawn',
      hasPaymentStatementApplication: false,
      paymentStatementStatus: 'none',
      scheduledSettlementAmount: null,
      canViewPaymentStatement: false,
    }
  })
}

export function getParticipatingIndividualInstructorSettlementRows(
  instructor: ParticipatingInstructorRow,
  program: Program
): ParticipatingIndividualInstructorSettlementRow[] {
  const programRows = buildRowsFromProgramSchedule(program)
  const baseRows =
    programRows.length > 0
      ? programRows
      : DEFAULT_DEMO_SETTLEMENT_DEFS.map(buildRowFromDef)

  return applyActivityWithdrawn([...baseRows].reverse(), instructor)
}

/** 프로그램 전체 강의 회차 수 (mock — API 연동 시 program 기준) */
export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_PROGRAM_LECTURE_ROUND_TOTAL = 7
