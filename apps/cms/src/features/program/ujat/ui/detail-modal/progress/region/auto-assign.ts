import type {
  RegionAssignmentColumn,
  RegionAssignmentTableData,
  RegionAssignmentVolunteerRow,
} from './types'

const VOLUNTEERS_PER_CLASS = 2

function pairKey(volunteerIdA: string, volunteerIdB: string): string {
  return volunteerIdA < volunteerIdB
    ? `${volunteerIdA}|${volunteerIdB}`
    : `${volunteerIdB}|${volunteerIdA}`
}

function countAssignedDays(row: RegionAssignmentVolunteerRow): number {
  return row.cells.filter(cell => cell.kind === 'assigned' && !cell.isInvalidAssignment).length
}

function recalculateTotalAssignedDays(
  row: RegionAssignmentVolunteerRow
): RegionAssignmentVolunteerRow {
  return { ...row, totalAssignedDays: countAssignedDays(row) }
}

function getVolunteerIdsOnClass(
  rows: RegionAssignmentVolunteerRow[],
  columnIndex: number,
  classLabel: string
): string[] {
  return rows
    .filter(row => {
      const cell = row.cells[columnIndex]
      return (
        cell?.kind === 'assigned' &&
        !cell.isInvalidAssignment &&
        cell.classLabel === classLabel
      )
    })
    .map(row => row.id)
}

function collectExistingPairs(
  rows: RegionAssignmentVolunteerRow[],
  columns: RegionAssignmentColumn[]
): Set<string> {
  const pairs = new Set<string>()

  columns.forEach((column, columnIndex) => {
    if (column.isBlockedDate) return

    for (const slot of column.classSlots) {
      const ids = getVolunteerIdsOnClass(rows, columnIndex, slot.classLabel)
      if (ids.length === 2) {
        pairs.add(pairKey(ids[0], ids[1]))
      }
    }
  })

  return pairs
}

function isEligibleForColumn(
  row: RegionAssignmentVolunteerRow,
  columnIndex: number
): boolean {
  if (row.isWithdrawnVolunteer) return false
  if (
    row.withdrawnFromColumnIndex != null &&
    columnIndex >= row.withdrawnFromColumnIndex
  ) {
    return false
  }
  const cell = row.cells[columnIndex]
  return cell?.kind !== 'assigned' || cell.isInvalidAssignment === true
}

function sortByAssignedDays(
  rows: RegionAssignmentVolunteerRow[],
  volunteerIds: string[]
): string[] {
  const dayCount = new Map(rows.map(row => [row.id, countAssignedDays(row)]))

  return [...volunteerIds].sort(
    (a, b) => (dayCount.get(a) ?? 0) - (dayCount.get(b) ?? 0)
  )
}

function pickVolunteerPair(
  rows: RegionAssignmentVolunteerRow[],
  columnIndex: number,
  usedPairs: Set<string>
): [string, string] | null {
  const candidates = sortByAssignedDays(
    rows,
    rows.filter(row => isEligibleForColumn(row, columnIndex)).map(row => row.id)
  )

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const key = pairKey(candidates[i], candidates[j])
      if (usedPairs.has(key)) continue
      return [candidates[i], candidates[j]]
    }
  }

  return null
}

function pickSingleVolunteer(
  rows: RegionAssignmentVolunteerRow[],
  columnIndex: number,
  existingVolunteerId: string,
  usedPairs: Set<string>
): string | null {
  const candidates = sortByAssignedDays(
    rows,
    rows
      .filter(row => isEligibleForColumn(row, columnIndex) && row.id !== existingVolunteerId)
      .map(row => row.id)
  )

  for (const candidateId of candidates) {
    if (!usedPairs.has(pairKey(existingVolunteerId, candidateId))) {
      return candidateId
    }
  }

  return candidates[0] ?? null
}

function assignVolunteerToClass(
  rows: RegionAssignmentVolunteerRow[],
  volunteerId: string,
  columnIndex: number,
  classLabel: string
): RegionAssignmentVolunteerRow[] {
  return rows.map(row => {
    if (row.id !== volunteerId) return row

    const nextCells = [...row.cells]
    nextCells[columnIndex] = { kind: 'assigned', classLabel }
    return recalculateTotalAssignedDays({ ...row, cells: nextCells })
  })
}

function markSoloAssignments(
  rows: RegionAssignmentVolunteerRow[],
  columns: RegionAssignmentColumn[]
): RegionAssignmentVolunteerRow[] {
  let nextRows = rows

  columns.forEach((column, columnIndex) => {
    for (const slot of column.classSlots) {
      const assignedIds = getVolunteerIdsOnClass(nextRows, columnIndex, slot.classLabel)
      const isSolo = assignedIds.length === 1

      nextRows = nextRows.map(row => {
        const cell = row.cells[columnIndex]
        if (
          cell?.kind !== 'assigned' ||
          cell.isInvalidAssignment ||
          cell.classLabel !== slot.classLabel
        ) {
          return row
        }

        const nextCells = [...row.cells]
        nextCells[columnIndex] = { ...cell, isSolo }
        return { ...row, cells: nextCells }
      })
    }
  })

  return nextRows.map(recalculateTotalAssignedDays)
}

function pickAnyEligibleVolunteer(
  rows: RegionAssignmentVolunteerRow[],
  columnIndex: number
): string | null {
  return sortByAssignedDays(
    rows,
    rows.filter(row => isEligibleForColumn(row, columnIndex)).map(row => row.id)
  )[0] ?? null
}

function assignAttendanceManagersForNewDates(
  rows: RegionAssignmentVolunteerRow[],
  columns: RegionAssignmentColumn[],
  dateLabelsNeedingManager: string[]
): RegionAssignmentVolunteerRow[] {
  if (dateLabelsNeedingManager.length === 0) return rows

  const managerVolunteerIds = new Set<string>()
  for (const row of rows) {
    for (const cell of row.cells) {
      if (cell.kind === 'assigned' && cell.isAttendanceManager) {
        managerVolunteerIds.add(row.id)
      }
    }
  }

  let nextRows = rows

  for (const dateLabel of dateLabelsNeedingManager) {
    const columnIndices = columns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => column.dateLabel === dateLabel)
      .map(({ index }) => index)

    const assignmentTargets: { volunteerId: string; columnIndex: number }[] = []

    for (const row of nextRows) {
      for (const columnIndex of columnIndices) {
        const cell = row.cells[columnIndex]
        if (cell?.kind === 'assigned') {
          assignmentTargets.push({ volunteerId: row.id, columnIndex })
        }
      }
    }

    const uniqueVolunteerIds = [
      ...new Set(assignmentTargets.map(target => target.volunteerId)),
    ]
    const eligibleVolunteerIds = uniqueVolunteerIds.filter(
      id => !managerVolunteerIds.has(id)
    )
    if (eligibleVolunteerIds.length === 0) continue

    const pickedVolunteerId =
      eligibleVolunteerIds[Math.floor(Math.random() * eligibleVolunteerIds.length)]
    const volunteerCells = assignmentTargets.filter(
      target => target.volunteerId === pickedVolunteerId
    )
    const pickedCell =
      volunteerCells[Math.floor(Math.random() * volunteerCells.length)]
    if (!pickedCell) continue

    managerVolunteerIds.add(pickedVolunteerId)

    nextRows = nextRows.map(row => {
      if (row.id !== pickedVolunteerId) return row

      const nextCells = row.cells.map((cell, index) => {
        if (index !== pickedCell.columnIndex || cell.kind !== 'assigned') return cell
        return { ...cell, isAttendanceManager: true }
      })

      return { ...row, cells: nextCells }
    })
  }

  return nextRows
}

function dateLabelsWithoutAttendanceManager(
  rows: RegionAssignmentVolunteerRow[],
  columns: RegionAssignmentColumn[]
): string[] {
  const datesWithManager = new Set<string>()

  columns.forEach((column, columnIndex) => {
    const hasManager = rows.some(row => {
      const cell = row.cells[columnIndex]
      return cell?.kind === 'assigned' && cell.isAttendanceManager
    })
    if (hasManager) datesWithManager.add(column.dateLabel)
  })

  const allDates = [...new Set(columns.map(column => column.dateLabel))]
  return allDates.filter(dateLabel => !datesWithManager.has(dateLabel))
}

/**
 * 미배정 학급에 봉사자 2명씩 배정.
 * - 배정일 수 적은 봉사자 우선
 * - 이미 함께 배정된 봉사자 쌍은 재사용하지 않음
 * - 교육일 최초 출결 담당자: 해당 진행일 배정 봉사자 중 무작위 1명(봉사자당 출결 담당은 1회만)
 */
export function autoAssignRegionEducationDays(
  data: RegionAssignmentTableData
): RegionAssignmentTableData {
  const { columns } = data
  const dateLabelsNeedingManager = dateLabelsWithoutAttendanceManager(data.rows, columns)

  let rows = data.rows.map(row => ({
    ...row,
    cells: row.cells.map(cell => ({ ...cell })),
  }))

  const usedPairs = collectExistingPairs(rows, columns)

  for (const [columnIndex, column] of columns.entries()) {
    if (column.isBlockedDate) continue

    for (const slot of column.classSlots) {
      const existingIds = getVolunteerIdsOnClass(rows, columnIndex, slot.classLabel)
      const needCount = VOLUNTEERS_PER_CLASS - existingIds.length
      if (needCount <= 0) continue

      if (needCount === 2) {
        const pair = pickVolunteerPair(rows, columnIndex, usedPairs)
        if (!pair) {
          const singleId = pickAnyEligibleVolunteer(rows, columnIndex)
          if (singleId) {
            rows = assignVolunteerToClass(rows, singleId, columnIndex, slot.classLabel)
          }
          continue
        }

        const [firstId, secondId] = pair
        rows = assignVolunteerToClass(rows, firstId, columnIndex, slot.classLabel)
        rows = assignVolunteerToClass(rows, secondId, columnIndex, slot.classLabel)
        usedPairs.add(pairKey(firstId, secondId))
        continue
      }

      if (needCount === 1 && existingIds.length === 1) {
        const partnerId = pickSingleVolunteer(
          rows,
          columnIndex,
          existingIds[0],
          usedPairs
        )
        if (!partnerId) continue

        rows = assignVolunteerToClass(rows, partnerId, columnIndex, slot.classLabel)
        usedPairs.add(pairKey(existingIds[0], partnerId))
      }
    }
  }

  rows = markSoloAssignments(rows, columns)
  rows = assignAttendanceManagersForNewDates(rows, columns, dateLabelsNeedingManager)

  return { ...data, rows }
}
