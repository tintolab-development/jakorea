import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaxReportPreviewRow, TaxReportPreviewWorkbook } from '@/features/settlement-management/api/account-payments/tax-report-preview'

const mocks = vi.hoisted(() => ({
  downloadExcel: vi.fn(),
}))

vi.mock('@/shared/utils/file-download', () => ({
  downloadExcel: mocks.downloadExcel,
}))

import { exportTaxFilingExcel } from './tax-filing-excel'

function makePreviewWorkbook(): TaxReportPreviewWorkbook {
  const rows: TaxReportPreviewRow[] = []
  const groups = [
    ['기타소득 8.8%', 6],
    ['기타소득(상금) 4.4%', 6],
    ['기타소득(면접비)\n(지원금) (경품)\n22%', 4],
    ['사업소득 3.3%', 3],
  ] as const
  const detail = (groupLabel: string | null): TaxReportPreviewRow => ({
    소득구분: groupLabel,
    지급일: '-',
    지급액: '-',
    소득세: '-',
    주민세: '-',
    공제후지급: '-',
    이름: '-',
    주민등록번호: '-',
    프로젝트: '-',
  })
  for (const [label, count] of groups) {
    for (let index = 0; index < count; index += 1) rows.push(detail(index === 0 ? label : null))
    rows.push({
      ...detail('소계'),
      지급액: 0,
      소득세: 0,
      주민세: 0,
      공제후지급: 0,
    })
  }
  rows.push({
    ...detail('합계'),
    지급액: 0,
    소득세: 0,
    주민세: 0,
    공제후지급: 0,
  })
  return {
    workbookType: 'TAX_REPORT_FORTUNE_V1',
    sheetName: 'Sheet1',
    columns: [
      '소득구분',
      '지급일',
      '지급액',
      '소득세',
      '주민세',
      '공제후지급',
      '이름',
      '주민등록번호',
      '프로젝트',
    ],
    rows,
    columnWidths: [36, 22, 14, 12, 12, 14, 14, 18, 26],
    merges: ['A2:A7', 'A9:A14', 'A16:A19', 'A21:A23', 'A25:B25'],
    defaultRowHeight: 30,
    freezeRows: 1,
    autoFilter: 'A1:I25',
  }
}

describe('exportTaxFilingExcel', () => {
  beforeEach(() => {
    mocks.downloadExcel.mockReset()
  })

  it('서버 preview payload와 같은 구조로 local fallback을 만들고 입력한 암호로 암호화한다', async () => {
    const previewWorkbook = makePreviewWorkbook()
    previewWorkbook.rows[0]['지급액'] = 417580
    await exportTaxFilingExcel(previewWorkbook, { password: 'Jafile1!' })

    const buffer = mocks.downloadExcel.mock.calls[0]?.[0]
    expect(buffer).toBeTruthy()
    expect(Buffer.from(buffer).subarray(0, 8).toString('hex')).toBe('d0cf11e0a1b11ae1')
    expect(mocks.downloadExcel.mock.calls[0]?.[2]).toEqual({
      accessLog: {
        downloadKind: 'SETTLEMENT_EXPORT',
        containedPiiTypes: ['NAME', 'RESIDENT_REGISTRATION_NUMBER'],
      },
    })
  })
})
