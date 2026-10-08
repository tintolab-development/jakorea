/**
 * UJAT 참여 봉사자 — 1365 봉사시간 등록 양식 Fortune Sheet / 엑셀 공통 데이터
 */

import type { Cell, CellWithRowAndCol, Sheet } from '@fortune-sheet/core'
import dayjs from 'dayjs'
export type Volunteer1365VolunteerSource = {
  id: string
  /** 출석(participantId)과 잇는 키 — allocation-matrix의 memberId */
  memberId?: string
  name: string
  birthDate?: string
  id1365?: string
  region?: string
}
import type { UjatInstitutionScheduleAssignDateEntry } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import { filterScheduleDatesByHalf } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import type { EducationProgressHalfKey } from '../tabs'

/** key: `volunteer1365AttendanceKey(memberId, isoDate)` */
export type Volunteer1365AttendanceLookup = ReadonlyMap<string, Volunteer1365SheetCellValue>

export function volunteer1365AttendanceKey(memberId: string, isoDate: string): string {
  return `${memberId}|${isoDate}`
}

const FIXED_HEADER_LABELS = ['이름', '생년월일', '1365 ID', '지역', '발대식'] as const
const MINT_BG = '#01A1AF'
const HEADER_FG = '#FFFFFF'
const WARN_FG = '#E03131'
const DASH = '-'
export type Volunteer1365ScheduleColumn = {
  isoDate: string
  title: string
}

export type Volunteer1365SheetCellValue = {
  text: string
  warn?: boolean
}

export type Volunteer1365SheetRow = {
  name: string
  birthDate: string
  id1365: string
  region: string
  openingCeremony: string
  sessions: Volunteer1365SheetCellValue[]
}

export function getVolunteer1365ScheduleColumns(
  half: EducationProgressHalfKey,
  scheduleDates: readonly UjatInstitutionScheduleAssignDateEntry[] = []
): Volunteer1365ScheduleColumn[] {
  return filterScheduleDatesByHalf(scheduleDates, half).map(entry => ({
    isoDate: entry.isoDate,
    title: entry.title,
  }))
}

export function getVolunteer1365HeaderLabels(
  half: EducationProgressHalfKey,
  scheduleDates: readonly UjatInstitutionScheduleAssignDateEntry[] = []
): string[] {
  return [
    ...FIXED_HEADER_LABELS,
    ...getVolunteer1365ScheduleColumns(half, scheduleDates).map(column => column.title),
  ]
}

export const buildVolunteer1365SheetColumnCount = (
  half: EducationProgressHalfKey,
  scheduleDates: readonly UjatInstitutionScheduleAssignDateEntry[] = []
): number => getVolunteer1365HeaderLabels(half, scheduleDates).length

function formatBirthDateFor1365(birthDate: string): string {
  const normalized = birthDate.replace(/\s/g, '').replace(/\./g, '-')
  const parsed = dayjs(normalized)
  if (!parsed.isValid()) return birthDate
  return `${parsed.format('YYYY')}. ${parsed.format('MM')}. ${parsed.format('DD')}.`
}

function resolveSessionCell(
  memberId: string | undefined,
  isoDate: string,
  attendance?: Volunteer1365AttendanceLookup
): Volunteer1365SheetCellValue {
  if (!memberId || !attendance) return { text: DASH }
  return attendance.get(volunteer1365AttendanceKey(memberId, isoDate)) ?? { text: DASH }
}

export function buildVolunteer1365SheetRows(
  half: EducationProgressHalfKey,
  volunteers: readonly Volunteer1365VolunteerSource[],
  scheduleDates: readonly UjatInstitutionScheduleAssignDateEntry[] = [],
  attendance?: Volunteer1365AttendanceLookup
): Volunteer1365SheetRow[] {
  const scheduleColumns = getVolunteer1365ScheduleColumns(half, scheduleDates)

  return [...volunteers]
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    .map(volunteer => ({
      name: volunteer.name,
      birthDate: volunteer.birthDate?.trim()
        ? formatBirthDateFor1365(volunteer.birthDate.trim())
        : DASH,
      id1365: volunteer.id1365?.trim() || DASH,
      region: volunteer.region?.trim() || DASH,
      openingCeremony: DASH,
      sessions: scheduleColumns.map(column =>
        resolveSessionCell(volunteer.memberId, column.isoDate, attendance)
      ),
    }))
}

function headerCell(text: string): Cell {
  return {
    v: text,
    m: text,
    bg: MINT_BG,
    fc: HEADER_FG,
    ht: 0,
    vt: 0,
  }
}

function dataCell(value: Volunteer1365SheetCellValue | string): Cell {
  const text = typeof value === 'string' ? value : value.text
  const cell: Cell = { v: text, m: text, ht: 0, vt: 0 }
  if (typeof value !== 'string' && value.warn) {
    cell.fc = WARN_FG
  }
  return cell
}

function lineToCells(line: Volunteer1365SheetRow): Cell[] {
  return [
    dataCell(line.name),
    dataCell(line.birthDate),
    dataCell(line.id1365),
    dataCell(line.region),
    dataCell(line.openingCeremony),
    ...line.sessions.map(session => dataCell(session)),
  ]
}

function buildColumnWidths(columnCount: number): Record<string, number> {
  const fixedWidths = [96, 132, 120, 72, 88]
  const remaining = Math.max(columnCount - fixedWidths.length, 0)
  const sessionWidth = remaining > 0 ? Math.max(84, Math.floor(980 / remaining)) : 88
  const columnlen: Record<string, number> = {}
  fixedWidths.forEach((width, index) => {
    columnlen[String(index)] = width
  })
  for (let index = fixedWidths.length; index < columnCount; index += 1) {
    columnlen[String(index)] = sessionWidth
  }
  return columnlen
}

export function buildVolunteer1365FortuneSheet(
  half: EducationProgressHalfKey,
  volunteers: readonly Volunteer1365VolunteerSource[],
  scheduleDates: readonly UjatInstitutionScheduleAssignDateEntry[] = [],
  attendance?: Volunteer1365AttendanceLookup
): Sheet {
  const headerLabels = getVolunteer1365HeaderLabels(half, scheduleDates)
  const columnCount = headerLabels.length
  const lines = buildVolunteer1365SheetRows(half, volunteers, scheduleDates, attendance)
  const dataRowCount = lines.length
  const totalRows = Math.max(36, 1 + dataRowCount + 8)

  const celldata: CellWithRowAndCol[] = []
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    celldata.push({
      r: 0,
      c: columnIndex,
      v: headerCell(headerLabels[columnIndex]!),
    })
  }

  let rowIndex = 1
  for (const line of lines) {
    const cells = lineToCells(line)
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      celldata.push({ r: rowIndex, c: columnIndex, v: cells[columnIndex]! })
    }
    rowIndex += 1
  }

  return {
    name: 'Sheet1',
    status: 1,
    order: 0,
    row: totalRows,
    column: columnCount,
    defaultRowHeight: 22,
    defaultColWidth: 88,
    celldata,
    config: {
      columnlen: buildColumnWidths(columnCount),
      authority: {},
    },
    frozen: {
      type: 'rangeRow',
      range: { row_focus: 0, column_focus: 0 },
    },
    showGridLines: 1,
  }
}
