/**
 * UJAT 1365 봉사시간 등록 양식 xlsx
 * 다운로드 1회 = 반기 일괄 API `mode: DOWNLOAD` 1회 (감사 로그). PREVIEW 응답을 재사용하지 않는다.
 */

import ExcelJS from '@zurmokeeper/exceljs'
import { formatAsiaSeoulYymmdd } from '@/features/settlement-management/api/account-payments/settlement-form-download'
import { downloadExcel } from '@/shared/utils/file-download'
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
  // 날짜를 한 번만 계산해 서버 이력 파일명과 저장 파일명을 같게 한다(자정 경계 대비).
  const fileName = `[JA Korea] CMS 어드민_1365 봉사시간 등록 양식_${formatAsiaSeoulYymmdd()}.xlsx`
  const response = await fetchUjat1365SemesterRegistrationForm({ ...input, mode: 'DOWNLOAD', fileName })
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
  // 서버 DOWNLOAD 이력에 파일명·분류(VOLUNTEER_1365_HOURS_EXPORT, NAME)가 남으므로 클라이언트 이력은 남기지 않는다(1회 = 1건).
  await downloadExcel(buffer, fileName, { skipAccessLog: true })
}
