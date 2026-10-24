import { describe, expect, it } from 'vitest'
import {
  filterProgressAttendanceSessionGroups,
} from '@/features/program/general/lib/participating-individual-progress-attendance-display'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
  type ParticipatingIndividualProgressAttendanceFilters,
  type ParticipatingIndividualProgressAttendanceSessionGroup,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'

const EMPTY_FILTERS: ParticipatingIndividualProgressAttendanceFilters = {
  educationSchedule: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
  participantName: '',
  affiliation: '',
  educationGrade: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
  attendanceStatus: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL,
}

function session(
  id: string,
  participants: ParticipatingIndividualProgressAttendanceSessionGroup['participants'] = []
): ParticipatingIndividualProgressAttendanceSessionGroup {
  return {
    id,
    round: Number(id),
    filterValue: id,
    filterLabel: `${id}회차`,
    headerTitle: `${id}회차 출석`,
    headerDateLabel: '2026.10.21',
    headerScheduleSummary: `${id}회차`,
    headerPeriodRangeLabel: '2026.10.21',
    headerPrefix: `${id}회차`,
    scheduleEducationProgress: 'scheduled',
    attendanceRecordingOpen: true,
    participants,
  }
}

const rosterRow = {
  id: 'att-1',
  participantId: '1',
  name: '일반회원',
  genderBirthLabel: '여 | 1994.01.02',
  affiliationGradeLabel: '경영화과 | 3학년',
  affiliation: '경영화과',
  educationGrade: '3학년',
  attendanceRecorded: false,
}

describe('filterProgressAttendanceSessionGroups', () => {
  it('keeps empty schedule tables when no participant search is applied', () => {
    const result = filterProgressAttendanceSessionGroups(
      [session('1', [rosterRow]), session('2'), session('3', [rosterRow])],
      EMPTY_FILTERS
    )

    expect(result.map(item => item.id)).toEqual(['1', '2', '3'])
    expect(result[1]?.participants).toEqual([])
  })

  it('hides empty matching sessions only after participant search', () => {
    const result = filterProgressAttendanceSessionGroups(
      [session('1', [rosterRow]), session('2')],
      { ...EMPTY_FILTERS, participantName: '없는이름' }
    )

    expect(result).toEqual([])
  })

  it('narrows to the selected education schedule even when the table is empty', () => {
    const result = filterProgressAttendanceSessionGroups(
      [session('1', [rosterRow]), session('2')],
      { ...EMPTY_FILTERS, educationSchedule: '2' }
    )

    expect(result.map(item => item.id)).toEqual(['2'])
    expect(result[0]?.participants).toEqual([])
  })
})
