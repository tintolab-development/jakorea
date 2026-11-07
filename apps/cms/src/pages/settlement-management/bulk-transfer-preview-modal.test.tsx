/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CmsAlertModalProvider } from '@/shared/ui/cms-alert-modal-provider'

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
  downloadIssuedSettlementExportFileOrReissue: vi.fn(),
  notifySettlementExportDownloadError: vi.fn(),
}))

import { BulkTransferPreviewModal } from './bulk-transfer-preview-modal'

async function confirmFilePassword() {
  fireEvent.click(screen.getByRole('button', { name: '엑셀 다운로드' }))
  fireEvent.change(screen.getByPlaceholderText('사용할 암호를 입력해 주세요'), {
    target: { value: 'Jafile1!' },
  })
  fireEvent.change(screen.getByPlaceholderText('암호를 한 번 더 입력해 주세요'), {
    target: { value: 'Jafile1!' },
  })
  fireEvent.click(screen.getByRole('button', { name: '다운로드' }))
}

describe('BulkTransferPreviewModal SERVER_FILE 다운로드', () => {
  afterEach(() => {
    cleanup()
    downloadIssuedSettlementExportFile.mockClear()
  })

  it('SERVER_FILE이면 암호 모달 후 sensitive-downloads stream 경로로 받는다', async () => {
    render(
      <CmsAlertModalProvider>
        <BulkTransferPreviewModal
          open
          onCancel={() => undefined}
          rows={[]}
          serverExport={{
            deliveryMethod: 'SERVER_FILE',
            fileObjectId: 91,
          }}
        />
      </CmsAlertModalProvider>
    )

    await confirmFilePassword()

    await waitFor(() => {
      expect(downloadIssuedSettlementExportFile).toHaveBeenCalledWith({
        serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 91 },
        kind: 'bulk-transfer',
        password: 'Jafile1!',
      })
    })
  })
})
