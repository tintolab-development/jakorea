import type { RegionBlockedDateModalPayload } from './blocked-date-modal'
import type {
  RegionAssignmentCell,
  RegionAssignmentColumn,
  RegionAssignmentTableData,
  RegionAssignmentVolunteerRow,
} from './types'

type RegionDirectAssignPayload = {
  classSlotId: string
  volunteerId: string
}

const EMPTY_CELL: RegionAssignmentCell = { kind: 'empty' }
const BLOCKED_EMPTY_CELL: RegionAssignmentCell = { kind: 'empty', blockedEmpty: true }

function countAssignedDays(row: RegionAssignmentVolunteerRow): number {
  return row.cells.filter(cell => cell.kind === 'assigned' && !cell.isInvalidAssignment).length
}

function recalculateRow(row: RegionAssignmentVolunteerRow): RegionAssignmentVolunteerRow {
  return { ...row, totalAssignedDays: countAssignedDays(row) }
}

function cloneRows(rows: RegionAssignmentVolunteerRow[]): RegionAssignmentVolunteerRow[] {
  return rows.map(row => ({
    ...row,
    cells: row.cells.map(cell => ({ ...cell })),
  }))
}

function findClassSlot(
  columns: RegionAssignmentColumn[],
  classSlotId: string
): { columnIndex: number; classLabel: string } | null {
  for (const [columnIndex, column] of columns.entries()) {
    const slot = column.classSlots.find(item => item.id === classSlotId)
    if (slot) return { columnIndex, classLabel: slot.classLabel }
  }
  return null
}

function getValidAssignedRowIds(
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

function normalizeSoloForClass(
  rows: RegionAssignmentVolunteerRow[],
  columnIndex: number,
  classLabel: string
): RegionAssignmentVolunteerRow[] {
  const assignedIds = getValidAssignedRowIds(rows, columnIndex, classLabel)
  const isSolo = assignedIds.length === 1

  return rows.map(row => {
    const cell = row.cells[columnIndex]
    if (
      cell?.kind !== 'assigned' ||
      cell.isInvalidAssignment ||
      cell.classLabel !== classLabel
    ) {
      return recalculateRow(row)
    }

    const nextCells = [...row.cells]
    nextCells[columnIndex] = { ...cell, isSolo }
    return recalculateRow({ ...row, cells: nextCells })
  })
}

function ensureAttendanceManagerForColumn(
  rows: RegionAssignmentVolunteerRow[],
  columnIndex: number
): RegionAssignmentVolunteerRow[] {
  const hasManager = rows.some(row => {
    const cell = row.cells[columnIndex]
    return cell?.kind === 'assigned' && !cell.isInvalidAssignment && cell.isAttendanceManager
  })
  if (hasManager) return rows

  const candidates = rows.filter(row => {
    const cell = row.cells[columnIndex]
    return (
      !row.isWithdrawnVolunteer &&
      cell?.kind === 'assigned' &&
      !cell.isInvalidAssignment
    )
  })
  const picked = candidates.sort((a, b) => a.totalAssignedDays - b.totalAssignedDays)[0]
  if (!picked) return rows

  return rows.map(row => {
    if (row.id !== picked.id) return row
    const cell = row.cells[columnIndex]
    if (cell?.kind !== 'assigned') return row

    const nextCells = [...row.cells]
    nextCells[columnIndex] = { ...cell, isAttendanceManager: true }
    return { ...row, cells: nextCells }
  })
}

export function applyRegionDirectAssignment(
  data: RegionAssignmentTableData,
  payload: RegionDirectAssignPayload
): RegionAssignmentTableData {
  const slot = findClassSlot(data.columns, payload.classSlotId)
  if (!slot) return data

  let rows = cloneRows(data.rows).map(row => {
    const cell = row.cells[slot.columnIndex]
    if (
      cell?.kind === 'assigned' &&
      cell.isInvalidAssignment &&
      cell.classLabel === slot.classLabel
    ) {
      const nextCells = [...row.cells]
      nextCells[slot.columnIndex] = EMPTY_CELL
      return { ...row, cells: nextCells }
    }
    return row
  })

  rows = rows.map(row => {
    if (row.id !== payload.volunteerId) return row
    const nextCells = [...row.cells]
    nextCells[slot.columnIndex] = {
      kind: 'assigned',
      classLabel: slot.classLabel,
    }
    return { ...row, cells: nextCells }
  })

  rows = normalizeSoloForClass(rows, slot.columnIndex, slot.classLabel)
  rows = ensureAttendanceManagerForColumn(rows, slot.columnIndex)

  return { ...data, rows }
}

export function applyRegionBlockedDateSetting(
  data: RegionAssignmentTableData,
  payload: RegionBlockedDateModalPayload
): RegionAssignmentTableData {
  const dateSet = new Set(payload.blockedDateLabels)
  let rows = cloneRows(data.rows)

  data.columns.forEach((column, columnIndex) => {
    if (!dateSet.has(column.dateLabel)) return

    const targetIndex = rows.findIndex(row => row.id === payload.volunteerId)
    const substituteIndex = rows.findIndex(row => row.id === payload.substituteVolunteerId)
    if (targetIndex < 0) return

    const targetCell = rows[targetIndex].cells[columnIndex]
    if (targetCell?.kind !== 'assigned') {
      rows[targetIndex].cells[columnIndex] = BLOCKED_EMPTY_CELL
      return
    }

    const shouldTransferAttendance = targetCell.isAttendanceManager === true
    const classLabel = targetCell.classLabel

    rows[targetIndex].cells[columnIndex] = BLOCKED_EMPTY_CELL

    if (substituteIndex >= 0) {
      rows[substituteIndex].cells[columnIndex] = {
        kind: 'assigned',
        classLabel,
        isAttendanceManager: shouldTransferAttendance,
      }
    }

    rows = normalizeSoloForClass(rows, columnIndex, classLabel)
    rows = ensureAttendanceManagerForColumn(rows, columnIndex)
  })

  return {
    ...data,
    rows: rows.map(recalculateRow),
  }
}
