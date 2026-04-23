/**
 * 정산 관리 > 계좌 지급 — 대량이체 양식 미리보기 (Fortune Sheet)
 * Workbook·ExcelJS는 동적 import 청크로 분리해 Vite dev에서 모듈 fetch 실패를 줄입니다.
 */

import { lazy, Suspense, useCallback, useMemo } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'
import {
  BULK_TRANSFER_SHEET_COLUMN_COUNT,
  buildBulkTransferFortuneSheet,
} from '@/pages/settlement-management/bulk-transfer-fortune-data'
import './bulk-transfer-preview-modal.css'

const Workbook = lazy(() => import('./bulk-transfer-fortune-workbook'))

export interface BulkTransferPreviewModalProps {
  open: boolean
  onCancel: () => void
  rows: AccountPaymentRow[]
}

export function BulkTransferPreviewModal({ open, onCancel, rows }: BulkTransferPreviewModalProps) {
  const sheetData: Sheet[] = useMemo(() => {
    const sheet = buildBulkTransferFortuneSheet(rows)
    return [sheet]
  }, [rows])

  const handleDownload = useCallback(async () => {
    const { exportBulkTransferExcel } =
      await import('@/pages/settlement-management/bulk-transfer-excel')
    await exportBulkTransferExcel(rows)
  }, [rows])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="대량이체 양식 미리보기"
      description="계좌 지급 완료 처리된 항목에 한해서 양식에 반영됩니다."
      width={1400}
      size="large"
      className="bulk-transfer-preview-modal"
      footer={
        <>
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            닫기
          </AppButton>
          <AppButton
            variant="primary"
            size="large"
            modalTeal
            icon={<DownloadOutlined />}
            onClick={() => void handleDownload()}
          >
            엑셀 다운로드
          </AppButton>
        </>
      }
    >
      <div className="bulk-transfer-preview-modal__sheet-host">
        {open ? (
          <Suspense
            fallback={
              <div className="bulk-transfer-preview-modal__sheet-loading">
                <Spin size="large" />
              </div>
            }
          >
            <Workbook
              key={sheetData[0]?.celldata?.length ?? 0}
              data={sheetData}
              column={BULK_TRANSFER_SHEET_COLUMN_COUNT}
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
