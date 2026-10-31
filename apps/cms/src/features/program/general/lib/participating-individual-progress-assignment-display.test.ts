import { describe, expect, it } from 'vitest'
import { filterProgressAssignmentSessionGroups } from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
  type ParticipatingIndividualProgressAssignmentFilters,
  type ParticipatingIndividualProgressAssignmentSessionGroup,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'

const EMPTY_FILTERS: ParticipatingIndividualProgressAssignmentFilters = {
  educationSchedule: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
  participantName: '',
  affiliation: '',
  educationGrade: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
  submissionStatus: PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL,
}

function session(
  id: string,
  participants: ParticipatingIndividualProgressAssignmentSessionGroup['participants'] = []
): ParticipatingIndividualProgressAssignmentSessionGroup {
  return {
    id,
    round: Number(id),
    filterValue: id,
    filterLabel: `${id}회차`,
    headerTitle: `${id}회차 : 2026.01.09(금)`,
    headerDateLabel: '2026.01.09',
    headerScheduleSummary: `${id}회차`,
    headerPeriodRangeLabel: '2026.01.09',
    assignmentPeriodLabel: '2026.01.05(월) ~ 2026.01.09(금)',
    headerPrefix: `${id}회차`,
    participants,
  }
}

const rosterRow = {
  id: 'asgn-1',
  participantId: '1',
  name: '김제이',
  genderBirthLabel: '여 | 2000.**.**',
  affiliationGradeLabel: '제이초등학교 | 3학년',
  affiliation: '제이초등학교',
  educationGrade: '3학년',
  submission: { kind: 'not_submitted' as const },
  remarkKind: 'none' as const,
}

describe('filterProgressAssignmentSessionGroups', () => {
  it('keeps empty schedule tables when no participant search is applied', () => {
    const result = filterProgressAssignmentSessionGroups(
      [session('1', [rosterRow]), session('2'), session('3', [rosterRow])],
      EMPTY_FILTERS
    )

    expect(result.map(item => item.id)).toEqual(['1', '2', '3'])
    expect(result[1]?.participants).toEqual([])
  })

  it('hides empty matching sessions only after participant search', () => {
    const result = filterProgressAssignmentSessionGroups(
      [session('1', [rosterRow]), session('2')],
      { ...EMPTY_FILTERS, participantName: '없는이름' }
    )

    expect(result).toEqual([])
  })

  it('narrows to the selected education schedule even when the table is empty', () => {
    const result = filterProgressAssignmentSessionGroups(
      [session('1', [rosterRow]), session('2')],
      { ...EMPTY_FILTERS, educationSchedule: '2' }
    )

    expect(result.map(item => item.id)).toEqual(['2'])
    expect(result[0]?.participants).toEqual([])
  })
})
