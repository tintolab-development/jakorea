/**
 * UJAT 참여 봉사자 — 1365 봉사시간 등록 양식 Fortune Sheet / 엑셀 공통 데이터
 */

import type { Cell, CellWithRowAndCol, Sheet } from '@fortune-sheet/core'
import dayjs from 'dayjs'
import {
  getUjatVolunteerMockProfile,
  parseEducationProgressVolunteerProfileId,
  regionLabelForVolunteerProfile,
} from '@/data/mock/ujat-volunteer-mock-profiles'
import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import type { EducationProgressHalfKey } from '../tabs'
import { getUjatVolunteerAssignmentProgressBundle } from './detail/assignment-mock'
import type { UjatVolunteerAssignmentProgressRow } from './detail/assignment-types'

const FIXED_HEADER_LABELS = ['이름', '생년월일', '1365 ID', '지역', '발대식'] as const
const MINT_BG = '#01A1AF'
const HEADER_FG = '#FFFFFF'
const WARN_FG = '#E03131'
const DASH = '-'
const OPENING_CEREMONY_HOURS = '2시간'

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

function simpleHash(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getVolunteer1365ScheduleColumns(half: EducationProgressHalfKey): Volunteer1365ScheduleColumn[] {
  return UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES.filter(entry => entry.semester === half).map(entry => ({
    isoDate: entry.isoDate,
    title: entry.title,
  }))
}

export function getVolunteer1365HeaderLabels(half: EducationProgressHalfKey): string[] {
  return [...FIXED_HEADER_LABELS, ...getVolunteer1365ScheduleColumns(half).map(column => column.title)]
}

export const buildVolunteer1365SheetColumnCount = (half: EducationProgressHalfKey): number =>
  getVolunteer1365HeaderLabels(half).length

function formatBirthDateFor1365(birthDate: string): string {
  const normalized = birthDate.replace(/\s/g, '').replace(/\./g, '-')
  const parsed = dayjs(normalized)
  if (!parsed.isValid()) return birthDate
  return `${parsed.format('YYYY')}. ${parsed.format('MM')}. ${parsed.format('DD')}.`
}

function formatDurationLabel(totalMinutes: number): Volunteer1365SheetCellValue {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (minutes === 0) {
    return { text: `${hours}시간` }
  }
  return { text: `${hours}시간 ${minutes}분`, warn: true }
}

function parseScheduleLabelMonthDay(label: string): { month: number; day: number } | null {
  const match = label.match(/(\d{1,2})\.\s*(\d{1,2})/)
  if (!match) return null
  return { month: Number(match[1]), day: Number(match[2]) }
}

function resolveAssignmentForDate(
  rows: readonly UjatVolunteerAssignmentProgressRow[],
  isoDate: string
): UjatVolunteerAssignmentProgressRow | undefined {
  const target = dayjs(isoDate)
  return rows.find(row => {
    const parsed = parseScheduleLabelMonthDay(row.scheduleLabel)
    if (!parsed) return false
    return parsed.month === target.month() + 1 && parsed.day === target.date()
  })
}

function resolveSessionCell(
  volunteerId: string,
  isoDate: string,
  assignment?: UjatVolunteerAssignmentProgressRow
): Volunteer1365SheetCellValue {
  if (!assignment || assignment.educationProgress !== 'completed') {
    return { text: DASH }
  }

  if (assignment.attendance.kind === 'excused_absence' || assignment.attendance.kind === 'dash') {
    return { text: DASH }
  }

  if (assignment.attendance.kind === 'late') {
    const seed = simpleHash(`${volunteerId}|${isoDate}|late`)
    const minutes = 180 + (seed % 90)
    return formatDurationLabel(minutes)
  }

  if (assignment.attendance.kind === 'present') {
    const seed = simpleHash(`${volunteerId}|${isoDate}|present`)
    const usePartial = seed % 5 === 0
    const minutes = usePartial ? 280 + (seed % 40) : 300
    return formatDurationLabel(minutes)
  }

  return { text: DASH }
}

function resolveOpeningCeremony(volunteerId: string): string {
  const profileId = parseEducationProgressVolunteerProfileId(volunteerId)
  if (!profileId) return DASH
  const profile = getUjatVolunteerMockProfile(profileId)
  if (!profile || profile.assignmentStatus === 'activity_abandoned') return DASH
  return OPENING_CEREMONY_HOURS
}

export function buildVolunteer1365SheetRows(
  half: EducationProgressHalfKey,
  volunteerIds: readonly string[]
): Volunteer1365SheetRow[] {
  const scheduleColumns = getVolunteer1365ScheduleColumns(half)

  return [...volunteerIds]
    .sort((a, b) => {
      const profileA = parseEducationProgressVolunteerProfileId(a)
      const profileB = parseEducationProgressVolunteerProfileId(b)
      const nameA = profileA ? (getUjatVolunteerMockProfile(profileA)?.name ?? a) : a
      const nameB = profileB ? (getUjatVolunteerMockProfile(profileB)?.name ?? b) : b
      return nameA.localeCompare(nameB, 'ko')
    })
    .map(volunteerId => {
      const profileId = parseEducationProgressVolunteerProfileId(volunteerId)
      const profile = profileId ? getUjatVolunteerMockProfile(profileId) : null
      const assignmentRows = getUjatVolunteerAssignmentProgressBundle(volunteerId).rows

      return {
        name: profile?.name ?? volunteerId,
        birthDate: formatBirthDateFor1365(profile?.birthDate ?? DASH),
        id1365: profile?.id1365 ?? DASH,
        region: profile ? regionLabelForVolunteerProfile(profile.regionKey) : DASH,
        openingCeremony: resolveOpeningCeremony(volunteerId),
        sessions: scheduleColumns.map(column =>
          resolveSessionCell(
            volunteerId,
            column.isoDate,
            resolveAssignmentForDate(assignmentRows, column.isoDate)
          )
        ),
      }
    })
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
  volunteerIds: readonly string[]
): Sheet {
  const headerLabels = getVolunteer1365HeaderLabels(half)
  const columnCount = headerLabels.length
  const lines = buildVolunteer1365SheetRows(half, volunteerIds)
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
