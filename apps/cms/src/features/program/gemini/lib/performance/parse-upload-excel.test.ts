import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseUploadExcel } from './parse-upload-excel'

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '__fixtures__/gemini-training-report-upload-v2.xlsx'
)

describe('parseUploadExcel — Gemini 연수보고서 v2 양식', () => {
  it('comments 절대경로가 있어도 헤더·데이터 행을 읽는다', async () => {
    const buffer = readFileSync(fixturePath)
    const file = new File([buffer], 'gemini-training-report-upload-v2.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

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
})
