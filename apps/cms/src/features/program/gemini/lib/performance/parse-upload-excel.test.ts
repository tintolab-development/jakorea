import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseUploadExcel } from './parse-upload-excel'

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
})
