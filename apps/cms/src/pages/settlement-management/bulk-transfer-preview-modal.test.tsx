/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/use-session-admin-role-code', () => ({
  useSessionAdminRoleCode: () => 'MASTER',
}))

vi.mock('./bulk-transfer-fortune-workbook', () => ({
  default: () => null,
}))

vi.mock('./bulk-transfer-fortune-data', () => ({
  BULK_TRANSFER_SHEET_COLUMN_COUNT: 9,
  buildBulkTransferFortuneSheet: () => ({ celldata: [] }),
}))

const downloadIssuedSettlementExportFile = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/settlement-management/api/account-payments/download-issued-export-file', () => ({
  downloadIssuedSettlementExportFile: (...args: unknown[]) =>
    downloadIssuedSettlementExportFile(...args),
  notifySettlementExportDownloadError: vi.fn(),
}))

import { BulkTransferPreviewModal } from './bulk-transfer-preview-modal'

describe('BulkTransferPreviewModal SERVER_FILE 다운로드', () => {
  afterEach(() => {
    cleanup()
    downloadIssuedSettlementExportFile.mockClear()
  })

  it('SERVER_FILE이면 모달이 sensitive-downloads stream 경로로 받는다', async () => {
    render(
      <BulkTransferPreviewModal
        open
        onCancel={() => undefined}
        rows={[]}
        serverExport={{
          deliveryMethod: 'SERVER_FILE',
          fileObjectId: 91,
        }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '엑셀 다운로드' }))

    expect(downloadIssuedSettlementExportFile).toHaveBeenCalledWith({
      serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 91 },
      filenamePrefix: '대량이체',
      reason: '대량이체 양식 발급',
    })
  })
})
