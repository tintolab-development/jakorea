/**
 * UJAT 참여 봉사자 — 1365 봉사시간 등록 양식 Fortune Sheet / 엑셀 공통 데이터
 * 피그마: Popup / View / w1400 / 엑셀 양식 미리보기 (10014:40205)
 * 원천: 반기 일괄 API 응답(`Ujat1365SemesterRegistrationFormResponse`)만 사용한다.
 */

import type { Cell, CellWithRowAndCol, Sheet } from '@fortune-sheet/core'
import dayjs from 'dayjs'
import type { Ujat1365SemesterRegistrationFormCell } from '@/shared/api/generated/program-progress/schemas/ujat1365SemesterRegistrationFormCell'
import type { Ujat1365SemesterRegistrationFormColumn } from '@/shared/api/generated/program-progress/schemas/ujat1365SemesterRegistrationFormColumn'
import type { Ujat1365SemesterRegistrationFormResponse } from '@/shared/api/generated/program-progress/schemas/ujat1365SemesterRegistrationFormResponse'

const FIXED_HEADER_LABELS = ['이름', '생년월일', '1365 ID', '지역', '발대식'] as const
/** 피그마 열 폭 — A 이름 140 · B 생년월일 140 · C 1365 ID 160 · D 지역 120 · E 발대식 120 · 교육일 120 */
const FIXED_COLUMN_WIDTHS = [140, 140, 160, 120, 120] as const
const SESSION_COLUMN_WIDTH = 120
/** 피그마 Table/Row 31 · 열 머리(A,B,C…) 34 · 행 번호 열 30 */
export const VOLUNTEER_1365_ROW_HEIGHT = 31
export const VOLUNTEER_1365_COLUMN_HEADER_HEIGHT = 34
export const VOLUNTEER_1365_ROW_HEADER_WIDTH = 30
/** 14px ≈ 10.5pt (Fortune Sheet `fs`는 pt 단위) */
const FONT_SIZE_PT = 10.5
const FONT_FAMILY = 'Pretendard'

export const VOLUNTEER_1365_HEADER_BG = '#00A0AF'
export const VOLUNTEER_1365_HEADER_FG = '#FFFFFF'
export const VOLUNTEER_1365_TEXT_FG = '#3D3D3D'
export const VOLUNTEER_1365_WARN_FG = '#C32F4A'
const DASH = '-'

export type Volunteer1365SheetCellValue = {
  text: string
  /** `cell.shortfall` — 인정 시간 미달(지각·조퇴), 빨간 굵은 글씨 */
  warn?: boolean
}

export type Volunteer1365SheetRow = {
  name: string
  birthDate: string
  id1365: string
  region: string
  openingCeremony: Volunteer1365SheetCellValue
  sessions: Volunteer1365SheetCellValue[]
}

/** 미리보기·다운로드에 쓰는 시트 모델 */
export type Volunteer1365SheetModel = {
  headerLabels: string[]
  rows: Volunteer1365SheetRow[]
}

/** 응답이 없을 때(조회 전·실패) 헤더만 있는 빈 양식 */
export const EMPTY_VOLUNTEER_1365_SHEET_MODEL: Volunteer1365SheetModel = {
  headerLabels: [...FIXED_HEADER_LABELS],
  rows: [],
}

/** `2026-11-06` → `11월 6일` (피그마 헤더) */
export function formatVolunteer1365ColumnTitle(date?: string | null): string {
  const trimmed = date?.trim()
  if (!trimmed) return DASH
  const parsed = dayjs(trimmed)
  return parsed.isValid() ? parsed.format('M월 D일') : trimmed
}

/** 피그마 `1999.01.11` */
export function formatBirthDateFor1365(birthDate: string): string {
  const normalized = birthDate.replace(/\s/g, '').replace(/\.+$/, '').replace(/[./]/g, '-')
  const parsed = dayjs(normalized)
  if (!parsed.isValid()) return birthDate
  return parsed.format('YYYY.MM.DD')
}

/** 인정 분 → `5시간` · `3시간 32분` · `0시간` */
export function formatVolunteer1365Minutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safe / 60)
  const rest = safe % 60
  return rest > 0 ? `${hours}시간 ${rest}분` : `${hours}시간`
}

/**
 * 셀 규칙 (BE 계약)
 * - COMPLETED: 인정 분 표기, `shortfall`이면 빨간 굵은 글씨
 * - ABSENT: `0시간` (빨간색 아님)
 * - NOT_COMPLETED·셀 없음: `-`
 */
export function toVolunteer1365CellValue(
  cell?: Ujat1365SemesterRegistrationFormCell | null
): Volunteer1365SheetCellValue {
  if (!cell) return { text: DASH }
  if (cell.status === 'COMPLETED') {
    return { text: formatVolunteer1365Minutes(cell.minutes ?? 0), warn: cell.shortfall === true }
  }
  if (cell.status === 'ABSENT') return { text: formatVolunteer1365Minutes(0) }
  return { text: DASH }
}

function pickCell(
  cells: readonly Ujat1365SemesterRegistrationFormCell[],
  column: Ujat1365SemesterRegistrationFormColumn,
  index: number
): Ujat1365SemesterRegistrationFormCell | undefined {
  // 계약상 같은 순서·개수지만, scheduleId로 먼저 맞춰 순서 어긋남에도 안전하게 한다.
  return cells.find(cell => cell.scheduleId === column.scheduleId) ?? cells[index]
}

function textOrDash(value?: string | null): string {
  return value?.trim() || DASH
}

export function buildVolunteer1365SheetModel(
  response?: Ujat1365SemesterRegistrationFormResponse | null
): Volunteer1365SheetModel {
  if (!response) return EMPTY_VOLUNTEER_1365_SHEET_MODEL
  const sessionColumns = response.columns?.sessions ?? []
  const hasOpeningCeremony = response.columns?.openingCeremony != null

  return {
    headerLabels: [
      ...FIXED_HEADER_LABELS,
      ...sessionColumns.map(column => formatVolunteer1365ColumnTitle(column.date)),
    ],
    // BE 정렬(이름 → participantId) 그대로 쓴다.
    rows: (response.volunteers ?? []).map(volunteer => {
      const birthDate = volunteer.birthDate?.trim()
      return {
        name: textOrDash(volunteer.name),
        birthDate: birthDate ? formatBirthDateFor1365(birthDate) : DASH,
        id1365: textOrDash(volunteer.external1365Id),
        region: textOrDash(volunteer.educationRegionName),
        openingCeremony: hasOpeningCeremony
          ? toVolunteer1365CellValue(volunteer.openingCeremony)
          : { text: DASH },
        sessions: sessionColumns.map((column, index) =>
          toVolunteer1365CellValue(pickCell(volunteer.sessions ?? [], column, index))
        ),
      }
    }),
  }
}

function headerCell(text: string): Cell {
  return {
    v: text,
    m: text,
    bg: VOLUNTEER_1365_HEADER_BG,
    fc: VOLUNTEER_1365_HEADER_FG,
    bl: 1,
    fs: FONT_SIZE_PT,
    ff: FONT_FAMILY,
    ht: 0,
    vt: 0,
  }
}

function dataCell(value: Volunteer1365SheetCellValue | string): Cell {
  const text = typeof value === 'string' ? value : value.text
  const warn = typeof value !== 'string' && value.warn === true
  return {
    v: text,
    m: text,
    fc: warn ? VOLUNTEER_1365_WARN_FG : VOLUNTEER_1365_TEXT_FG,
    bl: warn ? 1 : 0,
    fs: FONT_SIZE_PT,
    ff: FONT_FAMILY,
    ht: 0,
    vt: 0,
  }
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

/** 14px Pretendard 기준 대략 글자 폭 — 한글·전각 14, 그 외 8 */
function estimateTextWidthPx(text: string): number {
  let width = 0
  for (const char of text) {
    width += (char.codePointAt(0) ?? 0) >= 0x2e80 ? 14 : 8
  }
  return width
}

/** 셀 좌우 여백(12+12) */
const CELL_HORIZONTAL_PADDING_PX = 24

/**
 * 열 폭 — 피그마 폭을 최소로 두고, 긴 값(예: 긴 1365 ID)이 잘리면 그 열만 넓힌다.
 */
export function getVolunteer1365ColumnWidths(model: Volunteer1365SheetModel): number[] {
  return model.headerLabels.map((label, index) => {
    const base =
      index < FIXED_COLUMN_WIDTHS.length ? FIXED_COLUMN_WIDTHS[index]! : SESSION_COLUMN_WIDTH
    const texts = [label, ...model.rows.map(row => lineToCells(row)[index]?.m ?? '')]
    const longest = Math.max(...texts.map(text => estimateTextWidthPx(String(text))))
    return Math.max(base, Math.ceil(longest + CELL_HORIZONTAL_PADDING_PX))
  })
}

export function buildVolunteer1365FortuneSheet(model: Volunteer1365SheetModel): Sheet {
  const columnCount = model.headerLabels.length
  const totalRows = Math.max(36, 1 + model.rows.length + 8)

  const celldata: CellWithRowAndCol[] = []
  model.headerLabels.forEach((label, columnIndex) => {
    celldata.push({ r: 0, c: columnIndex, v: headerCell(label) })
  })
  model.rows.forEach((line, lineIndex) => {
    lineToCells(line).forEach((cell, columnIndex) => {
      celldata.push({ r: lineIndex + 1, c: columnIndex, v: cell })
    })
  })

  const columnlen: Record<string, number> = {}
  getVolunteer1365ColumnWidths(model).forEach((width, index) => {
    columnlen[String(index)] = width
  })

  return {
    name: 'Sheet1',
    status: 1,
    order: 0,
    row: totalRows,
    column: columnCount,
    defaultRowHeight: VOLUNTEER_1365_ROW_HEIGHT,
    defaultColWidth: SESSION_COLUMN_WIDTH,
    celldata,
    config: {
      columnlen,
      authority: {},
    },
    frozen: {
      type: 'rangeRow',
      range: { row_focus: 0, column_focus: 0 },
    },
    showGridLines: 1,
  }
}
