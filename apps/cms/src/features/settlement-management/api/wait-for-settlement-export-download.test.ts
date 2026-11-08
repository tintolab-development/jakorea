import { beforeEach, describe, expect, it, vi } from 'vitest'

const { listExportHistories, customInstance } = vi.hoisted(() => ({
  listExportHistories: vi.fn(),
  customInstance: vi.fn(),
}))

vi.mock('@/shared/api/generated/settlement/settlement-api', () => ({
  getJAKoreaCMSBackendAPISettlementSubset: () => ({
    listExportHistories,
    requestTaxReportExport: vi.fn(),
    requestBulkTransferExport: vi.fn(),
  }),
}))

vi.mock('@/features/data-management/api/unwrap-api-body', () => ({
  unwrapApiBody: <T,>(value: T) => value,
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstance,
}))

import {
  assertSettlementServerExportReady,
  isSettlementExportFileReady,
  waitForSettlementExportDownload,
} from './settlement-api-client'

describe('isSettlementExportFileReady', () => {
  it('fileObjectId가 있으면 준비 완료로 본다', () => {
    expect(isSettlementExportFileReady({ deliveryMethod: 'SERVER_FILE', fileObjectId: 12 })).toBe(
      true
    )
  })

  it('downloadUrl만 있어도 준비 완료로 본다', () => {
    expect(
      isSettlementExportFileReady({
        deliveryMethod: 'SERVER_FILE',
        downloadUrl: '/api/admin/files/1/download',
      })
    ).toBe(true)
  })

  it('FAILED면 준비되지 않은 것으로 본다', () => {
    expect(
      isSettlementExportFileReady({
        deliveryMethod: 'SERVER_FILE',
        fileObjectId: 12,
        pollingStatus: 'FAILED',
      })
    ).toBe(false)
  })
})

describe('waitForSettlementExportDownload', () => {
  beforeEach(() => {
    listExportHistories.mockReset()
    customInstance.mockReset()
  })

  it('SERVER_FILE + fileObjectId면 즉시 반환한다', async () => {
    const requested = {
      exportHistoryId: 9,
      deliveryMethod: 'SERVER_FILE',
      fileObjectId: 55,
      exportType: 'TAX_REPORT',
    }
    await expect(waitForSettlementExportDownload(requested)).resolves.toBe(requested)
    expect(customInstance).not.toHaveBeenCalled()
    expect(listExportHistories).not.toHaveBeenCalled()
  })

  it('이력이 fileObjectId를 채우면 폴링을 종료한다', async () => {
    customInstance.mockResolvedValue({
      items: [
        {
          exportHistoryId: 9,
          deliveryMethod: 'SERVER_FILE',
          fileObjectId: 77,
          exportType: 'TAX_REPORT',
          pollingStatus: 'READY',
        },
      ],
    })
    const ready = await waitForSettlementExportDownload(
      {
        exportHistoryId: 9,
        deliveryMethod: 'SERVER_FILE',
        exportType: 'TAX_REPORT',
      },
      { attempts: 2, intervalMs: 1 }
    )
    expect(ready.fileObjectId).toBe(77)
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/settlements/exports',
      method: 'GET',
      params: { exportType: 'TAX_REPORT', page: 0, size: 20 },
    })
  })
})

describe('assertSettlementServerExportReady', () => {
  it('SERVER_FILE + fileObjectId만 통과시킨다', () => {
    expect(() =>
      assertSettlementServerExportReady({
        deliveryMethod: 'SERVER_FILE',
        fileObjectId: 1,
      })
    ).not.toThrow()
  })

  it('fileObjectId 없으면 클라이언트로 대체하지 않는다', () => {
    expect(() =>
      assertSettlementServerExportReady({
        deliveryMethod: 'SERVER_FILE',
      })
    ).toThrow(/서버 파일/)
  })
})
