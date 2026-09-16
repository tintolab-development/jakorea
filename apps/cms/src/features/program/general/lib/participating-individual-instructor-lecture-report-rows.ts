import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'
import {
  formatIndividualInstructorEducationScheduleLabel,
  formatLectureReportSubmissionDeadline,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import type {
  ParticipatingIndividualInstructorLectureProgress,
  ParticipatingIndividualInstructorLectureReportRow,
  ParticipatingIndividualInstructorSubmissionStatus,
} from '@/features/program/general/lib/participating-individual-instructor-lecture-report-types'
import { parseIndividualInstructorLectureAssignSchedule } from '@/features/program/general/lib/instructor-lecture-assign-schedule'

type DemoRowDef = {
  id: string
  dateKey: string
  timeRange: string
  sessionName?: string
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  submissionStatus: ParticipatingIndividualInstructorSubmissionStatus
}

function buildRowFromDef(def: DemoRowDef): ParticipatingIndividualInstructorLectureReportRow {
  const scheduleLabel = formatIndividualInstructorEducationScheduleLabel({
    dateKey: def.dateKey,
    timeRange: def.timeRange,
    sessionName: def.sessionName,
  })

  return {
    id: def.id,
    scheduleLabel,
    submissionPeriodLabel: formatLectureReportSubmissionDeadline(def.dateKey),
    lectureProgress: def.lectureProgress,
    submissionStatus: def.submissionStatus,
    canViewReport: def.submissionStatus === 'submitted',
  }
}

function buildRowsFromProgramSchedule(program: Program): ParticipatingIndividualInstructorLectureReportRow[] {
  const slots = parseIndividualInstructorLectureAssignSchedule(program)
  if (slots.length === 0) return []

  return slots.map((slot, index) => {
    const lectureProgress: ParticipatingIndividualInstructorLectureProgress =
      index < slots.length - 1 ? 'completed' : 'scheduled'
    const submissionStatus: ParticipatingIndividualInstructorSubmissionStatus =
      lectureProgress === 'completed'
        ? index % 2 === 0
          ? 'submitted'
          : 'not_submitted'
        : 'scheduled'

    return buildRowFromDef({
      id: `lr-program-${slot.key}`,
      dateKey: slot.dateKey,
      timeRange: slot.timeRange,
      sessionName: slot.sessionLabel,
      lectureProgress,
      submissionStatus,
    })
  })
}

function applyActivityWithdrawn(
  rows: ParticipatingIndividualInstructorLectureReportRow[],
  instructor: ParticipatingInstructorRow
): ParticipatingIndividualInstructorLectureReportRow[] {
  if (!instructor.activityWithdrawn) return rows

  const stopIndex = Math.max(0, rows.length - 2)
  return rows.map((row, index) => {
    if (index !== stopIndex) return row
    return {
      ...row,
      lectureProgress: 'activity_withdrawn',
      submissionStatus: 'not_submitted',
      canViewReport: false,
    }
  })
}

export function getParticipatingIndividualInstructorLectureReportRows(
  instructor: ParticipatingInstructorRow,
  program: Program
): ParticipatingIndividualInstructorLectureReportRow[] {
  const baseRows = buildRowsFromProgramSchedule(program)
  return applyActivityWithdrawn([...baseRows].reverse(), instructor)
}
