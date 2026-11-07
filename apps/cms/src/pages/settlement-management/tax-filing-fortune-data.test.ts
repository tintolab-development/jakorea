import { describe, expect, it } from 'vitest'
import type { TaxReportPreviewRow, TaxReportPreviewWorkbook } from '@/features/settlement-management/api/account-payments/tax-report-preview'
import {
  TAX_FILING_MAX_DETAIL_ROWS,
  TAX_FILING_MAX_DETAIL_ROWS_ERROR_MESSAGE,
  TAX_FILING_PREVIEW_DATA_DEPENDENCY_MESSAGE,
  buildTaxFilingFortuneSheet,
  getTaxFilingPreviewValidationError,
  getTaxFilingSelectionValidationError,
  resolveTaxFilingIncomeGroup,
} from './tax-filing-fortune-data'

const columns = [
  '소득구분',
  '지급일',
  '지급액',
  '소득세',
  '주민세',
  '공제후지급',
  '이름',
  '주민등록번호',
  '프로젝트',
] as const

function previewWorkbook(): TaxReportPreviewWorkbook {
  const groups = [
    ['기타소득 8.8%', 6],
    ['기타소득(상금) 4.4%', 6],
    ['기타소득(면접비)\n(지원금) (경품)\n22%', 4],
    ['사업소득 3.3%', 3],
  ] as const
  const rows: TaxReportPreviewRow[] = []
  for (const [label, detailRows] of groups) {
    for (let index = 0; index < detailRows; index += 1) {
      rows.push({
        소득구분: index === 0 ? label : null,
        지급일: '-',
        지급액: '-',
        소득세: '-',
        주민세: '-',
        공제후지급: '-',
        이름: '-',
        주민등록번호: '-',
        프로젝트: '-',
      })
    }
    rows.push({
      소득구분: '소계',
      지급일: '-',
      지급액: 0,
      소득세: 0,
      주민세: 0,
      공제후지급: 0,
      이름: '-',
      주민등록번호: '-',
      프로젝트: '-',
    })
  }
  rows.push({
    소득구분: '합계',
    지급일: '-',
    지급액: 0,
    소득세: 0,
    주민세: 0,
    공제후지급: 0,
    이름: '-',
    주민등록번호: '-',
    프로젝트: '-',
  })
  return {
    workbookType: 'TAX_REPORT_FORTUNE_V1',
    sheetName: 'Sheet1',
    columns,
    rows,
    columnWidths: [36, 22, 14, 12, 12, 14, 14, 18, 26],
    merges: ['A2:A7', 'A9:A14', 'A16:A19', 'A21:A23', 'A25:B25'],
    defaultRowHeight: 30,
    freezeRows: 1,
    autoFilter: 'A1:I25',
  }
}

describe('tax filing preview contract', () => {
  it('미리보기 payload가 없으면 공식 금액을 추정하지 않고 의존성 오류를 반환한다', () => {
    expect(getTaxFilingPreviewValidationError(null)).toEqual({
      code: 'BACKEND_DEPENDENCY',
      field: 'taxReportFields',
      message: TAX_FILING_PREVIEW_DATA_DEPENDENCY_MESSAGE,
    })
  })

  it('서버 payload의 24개 행을 헤더 포함 25행으로 변환하고 병합을 그대로 반영한다', () => {
    const workbook = previewWorkbook()
    const firstDetail = workbook.rows[0]
    firstDetail['지급일'] = '2026.11.25(수)'
    firstDetail['지급액'] = 417580
    firstDetail['소득세'] = 27560
    firstDetail['주민세'] = 9187
    firstDetail['공제후지급'] = 380833

    const sheet = buildTaxFilingFortuneSheet(workbook)

    expect(sheet.row).toBe(25)
    expect(sheet.column).toBe(9)
    expect(sheet.config?.merge).toMatchObject({
      '1_0': { r: 1, c: 0, rs: 6, cs: 1 },
      '8_0': { r: 8, c: 0, rs: 6, cs: 1 },
      '15_0': { r: 15, c: 0, rs: 4, cs: 1 },
      '20_0': { r: 20, c: 0, rs: 3, cs: 1 },
      '24_0': { r: 24, c: 0, rs: 1, cs: 2 },
    })
    expect(sheet.celldata?.find(cell => cell.r === 1 && cell.c === 2)?.v).toMatchObject({
      v: 417580,
      m: '417,580',
    })
    expect(sheet.celldata?.find(cell => cell.r === 24 && cell.c === 2)?.v).toMatchObject({
      v: 0,
      m: '0',
    })
  })

  it('19건 초과는 절삭하지 않고 VALIDATION_ERROR를 반환한다', () => {
    expect(getTaxFilingSelectionValidationError(0)).toBeNull()
    expect(getTaxFilingSelectionValidationError(1)).toBeNull()
    expect(getTaxFilingSelectionValidationError(TAX_FILING_MAX_DETAIL_ROWS)).toBeNull()
    expect(getTaxFilingSelectionValidationError(TAX_FILING_MAX_DETAIL_ROWS + 1)).toEqual({
      code: 'VALIDATION_ERROR',
      field: 'settlementIds',
      message: TAX_FILING_MAX_DETAIL_ROWS_ERROR_MESSAGE,
    })
  })

  it('공식 소득 유형만 그룹 매핑 대상으로 인정한다', () => {
    expect(resolveTaxFilingIncomeGroup('OTHER_INCOME')).toBe(1)
    expect(resolveTaxFilingIncomeGroup('AWARD')).toBe(2)
    expect(resolveTaxFilingIncomeGroup('EVENT_PRIZE_INCOME')).toBe(3)
    expect(resolveTaxFilingIncomeGroup('BUSINESS_INCOME')).toBe(4)
    expect(resolveTaxFilingIncomeGroup('UNKNOWN')).toBeUndefined()
  })
})
