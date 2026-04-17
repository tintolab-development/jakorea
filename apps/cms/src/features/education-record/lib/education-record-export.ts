/**
 * 실적 관리 > 실적 데이터 엑셀 export
 *
 * 공용 `exportTableToExcel` 은 `dataIndex` 기반 raw 값만 사용하므로 본 테이블의
 *  - sponsorId → 후원사명 / 월 포맷 / enum 한글 라벨(초·중·고, 학교 안/밖, 온라인/오프라인) /
 *    Partner Involvement Yes·No / `render` 전용 컬럼(학교명·시군구·학급수)
 * 등이 실제 UI 와 다르게 출력된다. 이 모듈은 antd 컬럼의 `render(value, record, index)` 를
 * **실제로 호출**해서 화면 표시 값과 1:1 로 일치하는 엑셀을 생성한다.
 *
 * 또한 데이터가 비어있는 셀은 테이블에서는 `'-'` 등으로 fallback 되어 표기되지만
 * 엑셀에서는 **완전히 빈 셀**로 출력한다(합계/필터/정렬 시 자연스럽게 동작하도록).
 */

import ExcelJS from '@zurmokeeper/exceljs'
import type { ColumnsType, ColumnType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { downloadExcel, generateFilename } from '@/shared/utils/file-download'

/** 엑셀 export 시 제외할 컬럼 key (액션 열 등) */
const EXCLUDED_COLUMN_KEYS = new Set<string>(['action'])

/** 렌더 결과가 아래 문자열 중 하나면 엑셀에서는 빈 셀로 간주 */
const EMPTY_DISPLAY_VALUES = new Set(['-', '--', '—', 'N/A', 'n/a', ''])

const HEADER_STYLE = {
  font: { bold: true, size: 11 },
  fill: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFE0E0E0' },
  },
  alignment: { vertical: 'middle' as const, horizontal: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const },
  },
}

const CELL_STYLE = {
  alignment: { vertical: 'middle' as const, horizontal: 'center' as const, wrapText: true },
  border: {
    top: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const },
  },
}

function isExportableColumn(col: ColumnsType<Program>[number]): col is ColumnType<Program> {
  if ('children' in col && col.children) return false
  if (col.hidden) return false
  if (col.key != null && EXCLUDED_COLUMN_KEYS.has(String(col.key))) return false
  return true
}

function resolveRawValue(record: Program, col: ColumnType<Program>): unknown {
  const dataIndex = col.dataIndex
  if (dataIndex == null) return undefined
  if (Array.isArray(dataIndex)) {
    let value: unknown = record
    for (const key of dataIndex) {
      if (value == null) return undefined
      value = (value as Record<string, unknown>)[String(key)]
    }
    return value
  }
  return (record as unknown as Record<string, unknown>)[String(dataIndex)]
}

/** 렌더 결과 ReactNode 에서 엑셀 셀 값(문자/숫자/빈값) 추출 */
function toCellValue(rendered: unknown): string | number | null {
  if (rendered == null) return null
  if (typeof rendered === 'number') return Number.isFinite(rendered) ? rendered : null
  if (typeof rendered === 'boolean') return rendered ? 'Y' : 'N'
  if (typeof rendered === 'string') {
    const trimmed = rendered.trim()
    if (EMPTY_DISPLAY_VALUES.has(trimmed)) return null
    return rendered
  }
  // ReactElement 등 그 외 값은 문자열화 시 시각 정보를 잃으므로 빈 셀로 둔다.
  return null
}

/** antd 스타일 `{ children: ReactNode, props: {...} }` 객체 대응 */
function unwrapRenderResult(rendered: unknown): unknown {
  if (
    rendered != null &&
    typeof rendered === 'object' &&
    'children' in (rendered as Record<string, unknown>)
  ) {
    return (rendered as { children: unknown }).children
  }
  return rendered
}

function renderCell(
  col: ColumnType<Program>,
  record: Program,
  rowIndex: number
): string | number | null {
  const rawValue = resolveRawValue(record, col)

  if (typeof col.render === 'function') {
    const rendered = col.render(rawValue, record, rowIndex)
    return toCellValue(unwrapRenderResult(rendered))
  }

  return toCellValue(rawValue)
}

function headerTitle(col: ColumnType<Program>): string {
  const title = col.title
  if (title == null) return ''
  if (typeof title === 'string' || typeof title === 'number') return String(title)
  return ''
}

function computeColumnWidth(
  col: ColumnType<Program>,
  records: Program[],
  rowIndexBase: number
): number {
  const header = headerTitle(col)
  let maxLen = header.length
  records.forEach((record, idx) => {
    const val = renderCell(col, record, rowIndexBase + idx)
    if (val == null) return
    const length = String(val).length
    if (length > maxLen) maxLen = length
  })
  return Math.min(Math.max(maxLen + 2, 10), 60)
}

/**
 * 실적 데이터 목록을 엑셀 파일로 다운로드한다.
 *
 * 빈 값 처리 규칙:
 *  - 렌더 결과가 `''`, `'-'`, `'--'`, `'—'`, `'N/A'` 면 엑셀 셀을 **빈 셀**로 둔다.
 *  - `undefined` / `null` / `NaN` 도 빈 셀로 둔다.
 *  - 나머지는 문자열·숫자 그대로 기록한다(숫자는 엑셀에서 수식/집계 가능).
 *
 * @param columns  UI 와 동일한 antd 컬럼 정의 (render 포함)
 * @param data     필터링 후 테이블에 표시된 데이터
 * @param filename 확장자 제외 파일명 prefix (예: `'실적데이터'`)
 */
export async function exportEducationRecordExcel(
  columns: ColumnsType<Program>,
  data: Program[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('실적 데이터')

  const exportable = columns.filter(isExportableColumn)

  const headerRow = worksheet.addRow(exportable.map(headerTitle))
  headerRow.height = 32
  headerRow.eachCell((cell: ExcelJS.Cell) => {
    cell.style = HEADER_STYLE
  })

  data.forEach((record, rowIndex) => {
    const values = exportable.map(col => {
      const v = renderCell(col, record, rowIndex)
      return v == null ? '' : v
    })
    const row = worksheet.addRow(values)
    row.eachCell((cell: ExcelJS.Cell) => {
      cell.style = CELL_STYLE
    })
  })

  worksheet.columns.forEach((column, index) => {
    if (!column) return
    const col = exportable[index]
    if (!col) return
    column.width = computeColumnWidth(col, data, 0)
  })

  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  downloadExcel(buffer, generateFilename(filename, 'xlsx'))
}
