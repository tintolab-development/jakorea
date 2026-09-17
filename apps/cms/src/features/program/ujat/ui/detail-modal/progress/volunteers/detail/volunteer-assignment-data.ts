import { parseEducationProgressVolunteerProfileId } from '@/features/program/ujat/model/ujat-volunteer-profile'
import type { UjatVolunteerMockProfileId } from '@/features/program/ujat/model/ujat-volunteer-profile'
import type {
  UjatVolunteerAssignmentProgressBundle,
  UjatVolunteerAssignmentProgressRow,
} from './assignment-types'

export function getVolunteerActivityWithdrawScheduleOptions(
  volunteerRowId: string,
  additionalWithdrawnRowIds: ReadonlyArray<string> = []
): { value: string; label: string }[] {
  const withdrawnIdSet = new Set(additionalWithdrawnRowIds)
  const { rows } = getUjatVolunteerAssignmentProgressBundle(volunteerRowId)

  return rows
    .filter(
      row => row.classDisplay.kind !== 'withdrawn' && !withdrawnIdSet.has(row.id)
    )
    .map(row => ({
      value: row.id,
      label: row.scheduleLabel,
    }))
}

export function mergeVolunteerActivityWithdrawnRows(
  rows: UjatVolunteerAssignmentProgressRow[],
  withdrawnScheduleRowIds: ReadonlyArray<string>
): UjatVolunteerAssignmentProgressRow[] {
  if (withdrawnScheduleRowIds.length === 0) {
    return sortVolunteerAssignmentRows(rows)
  }

  const withdrawnIdSet = new Set(withdrawnScheduleRowIds)

  return sortVolunteerAssignmentRows(
    rows.map(row => {
      if (!withdrawnIdSet.has(row.id) || row.classDisplay.kind === 'withdrawn') {
        return row
      }

      return {
        ...row,
        classDisplay: { kind: 'withdrawn' as const },
        isWithdrawn: true,
      }
    })
  )
}

export function sortVolunteerAssignmentRows(
  rows: UjatVolunteerAssignmentProgressRow[]
): UjatVolunteerAssignmentProgressRow[] {
  const active = rows.filter(row => row.classDisplay.kind !== 'withdrawn')
  const classWithdrawn = rows.filter(row => row.classDisplay.kind === 'withdrawn')
  return [...active, ...classWithdrawn]
}

export function getUjatVolunteerAssignmentProgressBundle(
  _volunteerRowId: string
): UjatVolunteerAssignmentProgressBundle {
  return {
    rows: [],
    attendanceSummary: {
      completionStatus: '교육 진행 전',
      lateCountLabel: '0회',
    },
    absenceReasons: [],
  }
}

export function resolveProfileIdFromVolunteerRowId(
  volunteerRowId: string
): UjatVolunteerMockProfileId | null {
  return parseEducationProgressVolunteerProfileId(volunteerRowId)
}
