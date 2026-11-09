import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  customInstance: vi.fn(),
  generatedTaxReportExport: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: mocks.customInstance,
}))

vi.mock('@/shared/api/generated/settlement/settlement-api', () => ({
  getJAKoreaCMSBackendAPISettlementSubset: () => ({
    requestTaxReportExport: mocks.generatedTaxReportExport,
  }),
}))

import { requestTaxReportExportRemote, requestTaxReportPreviewRemote } from './settlement-api-client'

describe('requestTaxReportExportRemote', () => {
  beforeEach(() => {
    mocks.customInstance.mockReset()
    mocks.generatedTaxReportExport.mockReset()
  })

  it('body 없는 generated operation을 거치지 않고 JSON body를 한 번 전송한다', async () => {
    const body = {
      status: 'PAID',
      reason: '세금신고 양식 발급',
      businessPurpose: '정산 관리 세금신고 양식',
      rawPrivacyIncluded: false,
      settlementIds: [88021],
    }
    const response = {
      exportHistoryId: 5102,
      exportType: 'TAX_REPORT',
      exportStatus: 'REQUESTED',
      totalCount: 120,
      totalAmount: 3500000,
      fileObjectId: null,
      clientExportEventId: null,
      privacyExportFileId: null,
      deliveryMethod: 'SERVER_FILE',
      exportPolicy: 'MASKED_ONLY',
      rawPrivacyIncluded: false,
      downloadUrl: null,
      pollingStatus: 'PENDING',
    }
    mocks.customInstance.mockResolvedValueOnce({ success: true, data: response })

    await expect(requestTaxReportExportRemote(body)).resolves.toEqual(response)

    expect(mocks.generatedTaxReportExport).not.toHaveBeenCalled()
    expect(mocks.customInstance).toHaveBeenCalledTimes(1)
    expect(mocks.customInstance).toHaveBeenCalledWith({
      url: '/api/admin/settlements/exports/tax-report',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
    })
  })

  it('미리보기 API는 settlementIds만 보내고 canonical workbook payload를 검증한다', async () => {
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
    ]
    const rows = Array.from({ length: 24 }, (_, index) =>
      Object.fromEntries(columns.map(column => [column, index === 0 && column === '지급액' ? 100 : '-']))
    )
    const payload = {
      workbookType: 'TAX_REPORT_FORTUNE_V1',
      sheetName: 'Sheet1',
      columns,
      rows,
      columnWidths: [36, 22, 14, 12, 12, 14, 14, 18, 26],
      merges: ['A2:A7', 'A9:A14', 'A16:A19', 'A21:A23', 'A25:B25'],
      defaultRowHeight: 30,
      freezeRows: 1,
      autoFilter: 'A1:I25',
      warnings: [],
    }
    mocks.customInstance.mockResolvedValueOnce({ success: true, data: payload })

    await expect(requestTaxReportPreviewRemote({ settlementIds: [10001, 10002], accountPaymentIds: [186008] })).resolves.toMatchObject({
      workbookType: 'TAX_REPORT_FORTUNE_V1',
      rows,
    })
    expect(mocks.customInstance).toHaveBeenCalledWith({
      url: '/api/admin/settlements/exports/tax-report/preview',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { settlementIds: [10001, 10002], accountPaymentIds: [186008] },
    })
  })
})
