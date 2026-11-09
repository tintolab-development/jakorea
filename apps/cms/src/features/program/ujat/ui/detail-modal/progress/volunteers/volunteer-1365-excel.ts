/**
 * UJAT 1365 봉사시간 등록 양식 xlsx
 * 다운로드 1회 = 반기 일괄 API `mode: DOWNLOAD` 1회 (감사 로그). PREVIEW 응답을 재사용하지 않는다.
 */

import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel, generateFilename } from '@/shared/utils/file-download'
import type { EducationProgressHalfKey } from '../tabs'
import { fetchUjat1365SemesterRegistrationForm } from './use-volunteer-1365-semester-form'
import {
  buildVolunteer1365SheetModel,
  getVolunteer1365ColumnWidths,
} from './volunteer-1365-fortune-data'

const HEADER_FILL = 'FF00A0AF'
const HEADER_FONT = 'FFFFFFFF'
const TEXT_FONT = 'FF3D3D3D'
const WARN_FONT = 'FFC32F4A'
const THIN_BORDER = {
  top: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  left: { style: 'thin' as const },
  right: { style: 'thin' as const },
}

/** 화면 px → 엑셀 열 너비(문자 수) 근사 */
function pxToExcelWidth(px: number): number {
  return Math.round((px / 7) * 10) / 10
}

export async function exportVolunteer1365Excel(input: {
  programId: string
  half: EducationProgressHalfKey
}): Promise<void> {
  const response = await fetchUjat1365SemesterRegistrationForm({ ...input, mode: 'DOWNLOAD' })
  const model = buildVolunteer1365SheetModel(response)
  const { headerLabels, rows: lines } = model
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sheet1')

  const headerRow = sheet.addRow([...headerLabels])
  headerRow.height = 23
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = THIN_BORDER
  })

  for (const line of lines) {
    const values = [line.openingCeremony, ...line.sessions]
    const row = sheet.addRow([
      line.name,
      line.birthDate,
      line.id1365,
      line.region,
      ...values.map(value => value.text),
    ])
    row.height = 23
    row.eachCell((cell, columnNumber) => {
      cell.border = THIN_BORDER
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      // 5열(E, 발대식)부터 시간 칸 — warn이면 빨간 굵은 글씨
      const warn = columnNumber >= 5 && values[columnNumber - 5]?.warn === true
      cell.font = warn
        ? { bold: true, color: { argb: WARN_FONT }, size: 11 }
        : { color: { argb: TEXT_FONT }, size: 11 }
    })
  }

  sheet.columns = getVolunteer1365ColumnWidths(model).map(px => ({
    width: pxToExcelWidth(px),
  }))

  const buffer = await workbook.xlsx.writeBuffer()
  await downloadExcel(buffer, generateFilename('1365_봉사시간_등록_양식', 'xlsx'), {
    accessLog: { downloadKind: 'VOLUNTEER_1365_HOURS_EXPORT', containedPiiTypes: ['NAME'] },
  })
}
