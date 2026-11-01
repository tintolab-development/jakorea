/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

const exportTaxFilingExcel = vi.fn().mockResolvedValue(undefined)

vi.mock('./tax-filing-excel', () => ({
  exportTaxFilingExcel: (...args: unknown[]) => exportTaxFilingExcel(...args),
}))

import { TaxFilingPreviewModal } from './tax-filing-preview-modal'

describe('TaxFilingPreviewModal 엑셀 다운로드', () => {
  afterEach(() => {
    cleanup()
    exportTaxFilingExcel.mockClear()
  })

  it('미리보기와 같은 행으로 프론트에서 엑셀을 만든다', async () => {
    const rows = [{ id: 'row-1' }]

    render(
      <TaxFilingPreviewModal
        open
        onCancel={() => undefined}
        rows={rows as never}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '엑셀 다운로드' }))

    await vi.waitFor(() => {
      expect(exportTaxFilingExcel).toHaveBeenCalledWith(rows)
    })
  })
})
