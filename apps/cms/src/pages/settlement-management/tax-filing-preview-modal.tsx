/**
 * 정산 관리 > 계좌 지급 — 세금신고 양식 미리보기 (Fortune Sheet)
 */

import { lazy, Suspense, useCallback, useMemo } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import { notifySettlementExportDownloadError } from '@/features/settlement-management/api/account-payments/download-issued-export-file'
import {
  TAX_FILING_SHEET_COLUMN_COUNT,
  buildTaxFilingFortuneSheet,
} from '@/pages/settlement-management/tax-filing-fortune-data'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './tax-filing-preview-modal.css'

const Workbook = lazy(() => import('./bulk-transfer-fortune-workbook'))

export interface TaxFilingPreviewModalProps {
  open: boolean
  onCancel: () => void
  rows: AccountPaymentRow[]
}

export function TaxFilingPreviewModal({ open, onCancel, rows }: TaxFilingPreviewModalProps) {
  const sheetData: Sheet[] = useMemo(() => {
    const sheet = buildTaxFilingFortuneSheet(rows)
    return [sheet]
  }, [rows])

  const handleDownload = useCallback(async () => {
    try {
      const { exportTaxFilingExcel } =
        await import('@/pages/settlement-management/tax-filing-excel')
      await exportTaxFilingExcel(rows)
    } catch (error) {
      notifySettlementExportDownloadError({
        error,
        fallback: '세금신고 파일 다운로드에 실패했습니다.',
        issueButtonLabel: '세금 신고 양식 발급',
        onAlreadyDownloaded: onCancel,
      })
    }
  }, [onCancel, rows])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="세금신고 양식 미리보기"
      description="계좌 지급 완료 처리된 정산 항목에 한해서 양식에 반영됩니다."
      width={1400}
      size="large"
      className="tax-filing-preview-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            icon={<ButtonDownloadIcon />}
            adminAction="download"
            onClick={() => void handleDownload()} >
            엑셀 다운로드
          </CmsButton>
        </>
      }
    >
      <div className="tax-filing-preview-modal__sheet-host">
        {open ? (
          <Suspense
            fallback={
              <div className="tax-filing-preview-modal__sheet-loading">
                <Spin size="large" />
              </div>
            }
          >
            <Workbook
              key={sheetData[0]?.celldata?.length ?? 0}
              data={sheetData}
              column={TAX_FILING_SHEET_COLUMN_COUNT}
              showToolbar={false}
              showFormulaBar={false}
              showSheetTabs
              allowEdit={false}
              addRows={0}
            />
          </Suspense>
        ) : null}
      </div>
    </ContentModal>
  )
}
