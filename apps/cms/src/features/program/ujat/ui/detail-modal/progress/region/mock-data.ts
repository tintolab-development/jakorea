import { getUjatEducationRegionLabel } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type {
  RegionAssignmentCell,
  RegionAssignmentColumn,
  RegionAssignmentTableData,
  RegionAssignmentVolunteerRow,
} from './types'

function col(
  id: string,
  dateLabel: string,
  institutionName: string,
  location: string,
  classLabels: string[],
  isBlockedDate = false
): RegionAssignmentColumn {
  return {
    id,
    dateLabel,
    institutionName,
    location,
    isBlockedDate,
    classSlots: classLabels.map((classLabel, index) => ({
      id: `${id}-class-${index}`,
      classLabel,
    })),
  }
}
function assigned(
  classLabel: string,
  options?: {
    isAttendanceManager?: boolean
    isSolo?: boolean
    isInvalidAssignment?: boolean
  }
): RegionAssignmentCell {
  return { kind: 'assigned', classLabel, ...options }
}

const empty: RegionAssignmentCell = { kind: 'empty' }
const blockedEmpty: RegionAssignmentCell = { kind: 'empty', blockedEmpty: true }

function normalizeVolunteerRowCells(
  row: RegionAssignmentVolunteerRow,
  columnCount: number
): RegionAssignmentVolunteerRow {
  let cells = row.cells.map((cell, index) => {
    if (
      row.withdrawnFromColumnIndex != null &&
      index >= row.withdrawnFromColumnIndex
    ) {
      if (cell.kind === 'assigned') {
        return {
          ...cell,
          isAttendanceManager: false,
          isInvalidAssignment: true,
        }
      }
      return empty
    }
    return cell
  })

  if (cells.length > columnCount) {
    cells = cells.slice(0, columnCount)
  } else if (cells.length < columnCount) {
    cells = [...cells, ...Array.from({ length: columnCount - cells.length }, () => ({ ...empty }))]
  }

  return { ...row, cells }
}

function normalizeRegionAssignmentRows(
  rows: RegionAssignmentVolunteerRow[],
  columns: RegionAssignmentColumn[]
): RegionAssignmentVolunteerRow[] {
  return rows.map(row => normalizeVolunteerRowCells(row, columns.length))
}

const SEOUL_COLUMNS: RegionAssignmentColumn[] = [
  col('d1-a', '4월 3일', '구일초', '구로구', ['2학년 1반', '2학년 3반', '2학년 4반']),
  col('d1-b', '4월 3일', '청운초', '종로구', ['3학년 2반', '4학년 2반', '1학년 2반']),
  col('d2-a', '4월 17일', '신답초', '동대문구', ['1학년 3반', '2학년 2반', '3학년 7반']),
  col('d2-b', '4월 17일', '현대초', '서대문구', ['4학년 1반', '3학년 1반', '2학년 3반']),
  col('d3-a', '5월 8일', '신답초', '동대문구', ['1학년 2반', '3학년 3반', '4학년 3반']),
  col('d3-b', '5월 8일', '현대초', '서대문구', ['2학년 1반', '4학년 1반', '1학년 4반']),
  col('d4-a', '5월 15일', '청운초', '종로구', ['3학년 4반', '2학년 4반', '1학년 1반']),
  col('d4-b', '5월 15일', '신답초', '동대문구', ['4학년 2반', '3학년 2반', '2학년 1반']),
  col('d5-a', '5월 22일', '신도초', '구로구', ['1학년 3반', '5학년 1반', '6학년 2반']),
  col('d5-b', '5월 22일', '영등포초', '영등포구', ['3학년 1반', '4학년 3반', '2학년 4반']),
  col('d5-c', '5월 22일', '여의대공원', '영등포구', ['5학년 2반', '6학년 1반']),
  col('d6-a', '5월 29일', '구일초', '구로구', ['2학년 2반', '3학년 1반', '4학년 4반']),
  col('d6-b', '5월 29일', '청운초', '종로구', ['1학년 4반', '3학년 3반', '2학년 3반']),
  col('d7-a', '6월 5일', '신답초', '동대문구', ['2학년 1반', '3학년 2반'], true),
  col('d7-b', '6월 5일', '현대초', '서대문구', ['4학년 1반', '1학년 3반'], true),
  col('d8-a', '6월 12일', '신도초', '구로구', ['3학년 2반', '2학년 3반', '4학년 3반']),
  col('d8-b', '6월 12일', '영등포초', '영등포구', ['2학년 1반', '4학년 1반', '1학년 1반']),
]

function buildSeoulRows(): RegionAssignmentVolunteerRow[] {
  const rows: RegionAssignmentVolunteerRow[] = [
    {
      id: 'v1',
      name: '고종욱',
      totalAssignedDays: 7,
      cells: [
        assigned('2학년 1반'),
        assigned('3학년 2반'),
        assigned('1학년 3반'),
        assigned('4학년 1반'),
        assigned('2학년 2반'),
        assigned('3학년 1반'),
        assigned('1학년 1반'),
        assigned('2학년 3반'),
        assigned('4학년 2반'),
        assigned('3학년 4반'),
        assigned('1학년 2반'),
        assigned('2학년 4반'),
        assigned('3학년 3반'),
        assigned('1학년 4반'),
        assigned('2학년 1반', { isInvalidAssignment: true }),
        assigned('3학년 2반', { isInvalidAssignment: true }),
        empty,
      ],
    },
    {
      id: 'v2',
      name: '김규성',
      totalAssignedDays: 6,
      cells: [
        assigned('3학년 1반', { isAttendanceManager: true }),
        empty,
        assigned('2학년 2반'),
        assigned('4학년 3반'),
        assigned('1학년 2반'),
        assigned('3학년 3반'),
        assigned('2학년 1반'),
        assigned('4학년 1반'),
        assigned('1학년 3반'),
        assigned('3학년 2반'),
        assigned('2학년 4반'),
        assigned('4학년 2반'),
        assigned('1학년 1반'),
        assigned('3학년 4반'),
        blockedEmpty,
        blockedEmpty,
        assigned('2학년 3반'),
      ],
    },
    {
      id: 'v3',
      name: '김동연',
      totalAssignedDays: 6,
      cells: [
        empty,
        assigned('4학년 2반'),
        assigned('3학년 1반'),
        assigned('2학년 3반'),
        assigned('1학년 4반'),
        assigned('4학년 1반'),
        assigned('2학년 2반'),
        assigned('3학년 3반'),
        assigned('1학년 2반'),
        assigned('4학년 3반'),
        assigned('2학년 4반'),
        assigned('3학년 2반'),
        assigned('1학년 3반'),
        assigned('4학년 4반'),
        blockedEmpty,
        blockedEmpty,
        assigned('2학년 1반'),
      ],
    },
    {
      id: 'v4',
      name: '김태형',
      totalAssignedDays: 5,
      cells: [
        assigned('1학년 1반'),
        assigned('2학년 1반'),
        assigned('3학년 1반', { isSolo: true }),
        empty,
        assigned('4학년 1반'),
        assigned('1학년 2반'),
        assigned('2학년 2반'),
        assigned('3학년 2반'),
        assigned('4학년 2반'),
        assigned('1학년 3반'),
        assigned('2학년 3반'),
        assigned('3학년 3반'),
        assigned('4학년 3반'),
        assigned('1학년 4반'),
        blockedEmpty,
        blockedEmpty,
        assigned('2학년 4반'),
      ],
    },
    {
      id: 'v5',
      name: '나성범',
      totalAssignedDays: 4,
      cells: [
        assigned('5학년 1반', { isSolo: true }),
        assigned('6학년 2반'),
        assigned('5학년 2반'),
        assigned('6학년 1반'),
        assigned('5학년 3반'),
        assigned('6학년 3반'),
        assigned('5학년 4반'),
        assigned('6학년 4반'),
        assigned('5학년 1반'),
        assigned('6학년 2반'),
        assigned('5학년 2반'),
        assigned('6학년 1반'),
        assigned('5학년 3반'),
        assigned('6학년 3반'),
        blockedEmpty,
        blockedEmpty,
        empty,
      ],
    },
    {
      id: 'v6',
      name: '박정우',
      totalAssignedDays: 3,
      isWithdrawnVolunteer: true,
      withdrawnFromColumnIndex: 10,
      cells: [
        assigned('3학년 4반'),
        assigned('2학년 2반'),
        assigned('4학년 1반'),
        assigned('1학년 3반'),
        assigned('3학년 2반'),
        assigned('2학년 4반'),
        assigned('4학년 3반'),
        assigned('1학년 1반'),
        assigned('3학년 1반'),
        assigned('2학년 3반'),
        assigned('3학년 4반', { isInvalidAssignment: true }),
        empty,
        empty,
        empty,
        blockedEmpty,
        blockedEmpty,
        empty,
      ],
    },
    {
      id: 'v7',
      name: '최동수',
      totalAssignedDays: 1,
      cells: [
        empty,
        empty,
        empty,
        empty,
        empty,
        empty,
        empty,
        empty,
        empty,
        empty,
        assigned('2학년 1반'),
        empty,
        empty,
        empty,
        blockedEmpty,
        blockedEmpty,
        empty,
      ],
    },
  ]

  return normalizeRegionAssignmentRows(rows, SEOUL_COLUMNS)
}

function buildGenericRows(columnCount: number): RegionAssignmentVolunteerRow[] {
  return [
    {
      id: 'sample-1',
      name: '홍길동',
      totalAssignedDays: 2,
      cells: Array.from({ length: columnCount }, (_, i) =>
        i % 3 === 0 ? assigned(`${i + 1}학년 1반`) : empty
      ),
    },
    {
      id: 'sample-2',
      name: '김봉사',
      totalAssignedDays: 1,
      cells: Array.from({ length: columnCount }, (_, i) =>
        i === 1 ? assigned('3학년 2반', { isAttendanceManager: true }) : empty
      ),
    },
  ]
}

function buildGenericColumns(regionKey: UjatInstitutionApplicationRegionKey): RegionAssignmentColumn[] {
  const location =
    regionKey === 'gyeonggi_south'
      ? '부천시'
      : regionKey === 'incheon'
        ? '남동구'
        : '중구'

  return [
    col('g1', '4월 10일', '샘플초', location, ['1학년 1반', '2학년 2반', '3학년 1반']),
    col('g2', '4월 24일', '예시초', location, ['2학년 1반', '3학년 2반']),
    col('g3', '5월 15일', '샘플초', location, ['4학년 1반', '5학년 1반']),
    col('g4', '5월 29일', '예시초', location, ['3학년 3반', '4학년 2반'], true),
  ]
}

export function buildInitialRegionAssignmentTableData(
  regionKey: UjatInstitutionApplicationRegionKey
): RegionAssignmentTableData {
  const regionLabel = getUjatEducationRegionLabel(regionKey, regionKey)

  if (regionKey === 'seoul') {
    const columns = SEOUL_COLUMNS
    const rows = buildSeoulRows()
    return {
      regionKey,
      regionLabel,
      volunteerCount: 24,
      columns,
      rows,
    }
  }

  const columns = buildGenericColumns(regionKey)
  const rows = normalizeRegionAssignmentRows(buildGenericRows(columns.length), columns)

  return {
    regionKey,
    regionLabel,
    volunteerCount: rows.length,
    columns,
    rows,
  }
}
