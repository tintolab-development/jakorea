import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from '@zurmokeeper/exceljs'
import { describe, expect, it } from 'vitest'
import { parseUploadExcel } from './parse-upload-excel'
import { GEMINI_PERFORMANCE_UPLOAD_COLUMNS } from './upload-column-spec'

const dir = dirname(fileURLToPath(import.meta.url))
const fixturePath = join(dir, '__fixtures__/gemini-training-report-upload-v2.xlsx')
const realSchoolFixturePath = join(
  dir,
  '__fixtures__/gemini-training-report-real-schools-20.xlsx'
)

function asUploadFile(buffer: Buffer, name: string): File {
  const bytes = Uint8Array.from(buffer)
  const file = new File([bytes], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  if (typeof file.arrayBuffer !== 'function') {
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () =>
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    })
  }
  return file
}

describe('parseUploadExcel — Gemini 연수보고서 v2 양식', () => {
  it('comments 절대경로가 있어도 헤더·데이터 행을 읽는다', async () => {
    const buffer = readFileSync(fixturePath)
    const file = asUploadFile(buffer, 'gemini-training-report-upload-v2.xlsx')

    const rows = await parseUploadExcel(file)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.instructorName).toBe('등록된 강사 회원 이름으로 변경')
    expect(rows[0]?.contact).toBe('010-1234-5678')
    expect(rows[0]?.trainingDate).toBe('2026-09-30')
    expect(rows[0]?.trainingStartTime).toBe('10:00')
    expect(rows[0]?.trainingEndTime).toBe('11:30')
    expect(rows[0]?.classCount).toBe(2)
    expect(rows[0]?.participantCount).toBe(20)
  })

  it('실존학교 20행 샘플의 헤더·교육일 시리얼·차시를 읽는다', async () => {
    const buffer = readFileSync(realSchoolFixturePath)
    const file = asUploadFile(buffer, 'gemini-training-report-real-schools-20.xlsx')

    const rows = await parseUploadExcel(file)
    expect(rows).toHaveLength(20)
    expect(rows[0]?.instructorName).toBe('테스트강사')
    expect(rows[0]?.contact).toBe('010-0000-0000')
    expect(rows[0]?.school).toBe('서울개현초등학교')
    expect(rows[0]?.trainingLocation).toBe('서울개현초등학교')
    expect(rows[0]?.trainingDate).toBe('2026-10-12')
    expect(rows[0]?.trainingStartTime).toBe('09:30')
    expect(rows[0]?.trainingEndTime).toBe('12:30')
    expect(rows[0]?.classCount).toBe(3)
  })

  it('엑셀 시간 셀(Date·숫자)을 날짜가 아닌 HH:mm으로 읽는다', async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('연수보고서')
    const headers = Object.values(GEMINI_PERFORMANCE_UPLOAD_COLUMNS)
    sheet.addRow(headers)
    const base: Record<string, ExcelJS.CellValue> = {
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.timestamp]: '2026-04-01 09:00',
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.instructorName]: '테스트강사',
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingFormat]: '오프라인',
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.contact]: '010-0000-0000',
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.email]: 'test@example.com',
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.school]: '테스트학교',
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.paymentDestination]: '본인',
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingLocation]: '테스트학교',
      [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingDate]: new Date(Date.UTC(2026, 3, 1)),
    }
    const addRow = (start: ExcelJS.CellValue, end: ExcelJS.CellValue) => {
      const values: Record<string, ExcelJS.CellValue> = {
        ...base,
        [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingStartTime]: start,
        [GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingEndTime]: end,
      }
      const row = sheet.addRow(headers.map(header => values[header] ?? null))
      row.getCell(headers.indexOf(GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingStartTime) + 1).numFmt =
        'hh:mm'
      row.getCell(headers.indexOf(GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingEndTime) + 1).numFmt =
        'hh:mm'
    }
    addRow(new Date(Date.UTC(1899, 11, 30, 10, 0)), new Date(Date.UTC(1899, 11, 30, 11, 30)))
    addRow(13 / 24, 15.5 / 24)
    addRow('9:30', '13:00')

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
    const rows = await parseUploadExcel(asUploadFile(buffer, 'time-cells.xlsx'))

    expect(rows.map(row => [row.trainingStartTime, row.trainingEndTime])).toEqual([
      ['10:00', '11:30'],
      ['13:00', '15:30'],
      ['09:30', '13:00'],
    ])
    expect(rows[0]?.trainingDate).toBe('2026-04-01')
  })
})
