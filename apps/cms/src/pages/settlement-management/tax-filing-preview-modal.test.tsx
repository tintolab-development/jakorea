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

vi.mock('./tax-filing-fortune-data', () => ({
  TAX_FILING_SHEET_COLUMN_COUNT: 9,
  buildTaxFilingFortuneSheet: () => ({ celldata: [] }),
}))

const downloadIssuedSettlementExportFile = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/settlement-management/api/account-payments/download-issued-export-file', () => ({
  downloadIssuedSettlementExportFile: (...args: unknown[]) =>
    downloadIssuedSettlementExportFile(...args),
  downloadIssuedSettlementExportFileOrReissue: vi.fn(),
  notifySettlementExportDownloadError: vi.fn(),
}))

import { TaxFilingPreviewModal } from './tax-filing-preview-modal'

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

describe('TaxFilingPreviewModal SERVER_FILE 다운로드', () => {
  afterEach(() => {
    cleanup()
    downloadIssuedSettlementExportFile.mockClear()
  })

  it('SERVER_FILE이면 암호 모달 후 sensitive-downloads 경로로 받는다', async () => {
    render(
      <CmsAlertModalProvider>
        <TaxFilingPreviewModal
          open
          onCancel={() => undefined}
          rows={[]}
          serverExport={{
            deliveryMethod: 'SERVER_FILE',
            fileObjectId: 92,
          }}
        />
      </CmsAlertModalProvider>
    )

    await confirmFilePassword()

    await waitFor(() => {
      expect(downloadIssuedSettlementExportFile).toHaveBeenCalledWith({
        serverExport: { deliveryMethod: 'SERVER_FILE', fileObjectId: 92 },
        kind: 'tax-report',
        password: 'Jafile1!',
      })
    })
  })
})
