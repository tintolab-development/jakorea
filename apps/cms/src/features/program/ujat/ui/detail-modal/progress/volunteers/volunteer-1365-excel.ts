/**
 * UJAT 1365 봉사시간 등록 양식 xlsx (미리보기와 동일 데이터)
 */

import ExcelJS from '@zurmokeeper/exceljs'
import { downloadExcel, generateFilename } from '@/shared/utils/file-download'
import type { EducationProgressHalfKey } from '../tabs'
import {
  buildVolunteer1365SheetRows,
  getVolunteer1365HeaderLabels,
} from './volunteer-1365-fortune-data'

const HEADER_FILL = 'FF01A1AF'
const WARN_FONT = 'FFE03131'

export async function exportVolunteer1365Excel(
  half: EducationProgressHalfKey,
  volunteerIds: readonly string[]
): Promise<void> {
  const headerLabels = getVolunteer1365HeaderLabels(half)
  const lines = buildVolunteer1365SheetRows(half, volunteerIds)
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Sheet1')

  const headerRow = sheet.addRow([...headerLabels])
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  for (const line of lines) {
    const row = sheet.addRow([
      line.name,
      line.birthDate,
      line.id1365,
      line.region,
      line.openingCeremony,
      ...line.sessions.map(session => session.text),
    ])
    row.eachCell((cell, columnIndex) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      const sessionIndex = columnIndex - 6
      if (sessionIndex >= 0 && line.sessions[sessionIndex]?.warn) {
        cell.font = { color: { argb: WARN_FONT }, size: 11 }
      }
    })
  }

  sheet.columns = headerLabels.map((_, index) => ({
    width: index < 5 ? [14, 18, 16, 10, 12][index] : 12,
  }))

  const buffer = await workbook.xlsx.writeBuffer()
  downloadExcel(buffer, generateFilename('1365_봉사시간_등록_양식', 'xlsx'))
}
