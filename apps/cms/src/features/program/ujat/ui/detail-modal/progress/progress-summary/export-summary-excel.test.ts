import { describe, expect, it } from 'vitest'
import { buildRegionRow } from './summary-display'
import { buildUjatEducationProgressSummaryWorkbook } from './export-summary-excel'
import type {
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from './types'

const REGIONS = [
  { key: 'seoul', label: '서울' },
  { key: 'incheon', label: '인천' },
] as const

function schoolFixture(): UjatEducationProgressSchoolSummary {
  const seoul = (n: number | null) => buildRegionRow({ seoul: n, incheon: null })
  return {
    appliedSchools: buildRegionRow({ seoul: 10, incheon: 0 }),
    semesters: [
      {
        tone: 'h1',
        label: '1학기',
        metrics: {
          operating_schools: seoul(null),
          operating_classes: seoul(null),
          operating_students: seoul(null),
        },
      },
      {
        tone: 'h2',
        label: '2학기',
        metrics: {
          operating_schools: seoul(6),
          operating_classes: seoul(8),
          operating_students: seoul(186),
        },
      },
    ],
  }
}

function volunteerFixture(): UjatEducationProgressVolunteerSummary {
  return {
    rows: [
      {
        key: 'planned_selection',
        label: '선발 예정 인원',
        row: buildRegionRow({ seoul: null, incheon: null }),
      },
      {
        key: 'h1_final_pass',
        label: '1학기 최종 합격',
        tone: 'h1',
        row: buildRegionRow({ seoul: null, incheon: null }),
      },
      {
        key: 'h2_final_pass',
        label: '2학기 최종 합격',
        tone: 'h2',
        row: buildRegionRow({ seoul: 5, incheon: 1 }),
      },
      {
        key: 'final_total',
        label: '2026 봉사단 최종 인원',
        tone: 'grand',
        mergedTotalOnly: true,
        row: buildRegionRow({ seoul: 5, incheon: 1 }, 6),
      },
    ],
  }
}

describe('buildUjatEducationProgressSummaryWorkbook', () => {
  it('화면 표와 같이 구분 2열 병합·학기 rowspan·최종 인원 지역열 병합을 만든다', () => {
    const workbook = buildUjatEducationProgressSummaryWorkbook({
      regions: REGIONS,
      schoolSummary: schoolFixture(),
      volunteerSummary: volunteerFixture(),
    })
    const sheet = workbook.getWorksheet('교육 진행 요약')
    expect(sheet).toBeDefined()
    const merges = sheet!.model.merges ?? []
    expect(merges).toEqual(
      expect.arrayContaining([
        'A2:B2',
        'A3:B3',
        'A4:A6',
        'A7:A9',
        'A12:B12',
        'A13:B13',
        'A16:B16',
        'C16:E16',
      ])
    )
    expect(sheet!.getCell('A2').value).toBe('구분')
    expect(sheet!.getCell('C2').value).toBe('서울')
    expect(sheet!.getCell('D2').value).toBe('인천')
    expect(sheet!.getCell('E2').value).toBe('합계')
    expect(sheet!.getCell('A3').value).toBe('신청 학교')
    expect(sheet!.getCell('C3').value).toBe(10)
    expect(sheet!.getCell('D3').value).toBe(0)
    expect(sheet!.getCell('E3').value).toBe(10)
    expect(sheet!.getCell('A4').value).toBe('1학기')
    expect(sheet!.getCell('B4').value).toBe('진행 학교(개교)')
    expect(sheet!.getCell('C4').value).toBe('-')
    expect(sheet!.getCell('A7').value).toBe('2학기')
    expect(sheet!.getCell('B8').value).toBe('진행 학급 수')
    expect(sheet!.getCell('C8').value).toBe(8)
    expect(sheet!.getCell('A11').value).toBe('봉사단 교육 진행 요약')
    expect(sheet!.getCell('A12').value).toBe('구분')
    expect(sheet!.getCell('A15').value).toBe('2학기 최종 합격')
    expect(sheet!.getCell('C15').value).toBe(5)
    expect(sheet!.getCell('D15').value).toBe(1)
    expect(sheet!.getCell('E15').value).toBe(6)
    expect(sheet!.getCell('A16').value).toBe('2026 봉사단 최종 인원')
    expect(sheet!.getCell('C16').value).toBe(6)
  })
})
