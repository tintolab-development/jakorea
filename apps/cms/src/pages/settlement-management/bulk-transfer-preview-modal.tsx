/**
 * 정산 관리 > 계좌 지급 — 대량이체 양식 미리보기 (Fortune Sheet)
 * Workbook·ExcelJS는 동적 import 청크로 분리해 Vite dev에서 모듈 fetch 실패를 줄입니다.
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import type { SettlementExportResponse } from '@/features/settlement-management/api/account-payments/settlement-export-response'
import {
  downloadIssuedSettlementExportFile,
  downloadIssuedSettlementExportFileOrReissue,
  notifySettlementExportDownloadError,
} from '@/features/settlement-management/api/account-payments/download-issued-export-file'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  BULK_TRANSFER_SHEET_COLUMN_COUNT,
  buildBulkTransferFortuneSheet,
} from '@/pages/settlement-management/bulk-transfer-fortune-data'
import {
  applyBulkTransferWithholdingAmounts,
  loadBulkTransferWithholdingAmounts,
} from '@/pages/settlement-management/bulk-transfer-withholding'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import './bulk-transfer-preview-modal.css'

const Workbook = lazy(() => import('./bulk-transfer-fortune-workbook'))

export interface BulkTransferPreviewModalProps {
  open: boolean
  onCancel: () => void
  rows: AccountPaymentRow[]
  serverExport?: SettlementExportResponse | null
  onReissueExport?: () => Promise<SettlementExportResponse | null>
}

export function BulkTransferPreviewModal({
  open,
  onCancel,
  rows,
  serverExport,
  onReissueExport,
}: BulkTransferPreviewModalProps) {
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const usesServerFile = serverExport?.deliveryMethod === 'SERVER_FILE'
  const serverFileReady =
    usesServerFile &&
    serverExport?.fileObjectId != null &&
    Number.isFinite(serverExport.fileObjectId)
  const [previewRows, setPreviewRows] = useState(rows)

  useEffect(() => {
    if (!open) return
    setPreviewRows(rows)
    if (!shouldUseSettlementRemote('accountPayments')) return
    let cancelled = false
    void loadBulkTransferWithholdingAmounts(rows)
      .then(withholding => {
        if (cancelled) return
        setPreviewRows(applyBulkTransferWithholdingAmounts(rows, withholding))
      })
      .catch(() => {
        if (cancelled) return
        setPreviewRows(rows)
      })
    return () => {
      cancelled = true
    }
  }, [open, rows])

  const sheetData: Sheet[] = useMemo(() => {
    const sheet = buildBulkTransferFortuneSheet(previewRows)
    return [sheet]
  }, [previewRows])

  const handleDownload = useCallback(() => {
    runProtectedDownload({
      kind: 'BULK_TRANSFER_EXCEL',
      zIndex: 1400,
      download: async password => {
    try {
      if (serverExport?.deliveryMethod === 'SERVER_FILE') {
        if (serverExport.fileObjectId == null) {
          cmsAlertModal.show({
            title: '다운로드 불가',
            content:
              '대량이체 서버 파일이 아직 준비되지 않았습니다. 목록에서 「대량이체 양식 발급」을 다시 눌러 주세요.',
          })
          return
        }
        if (onReissueExport) {
          await downloadIssuedSettlementExportFileOrReissue({
            serverExport,
            kind: 'bulk-transfer',
            password,
            onReissue: onReissueExport,
          })
        } else {
          await downloadIssuedSettlementExportFile({
            serverExport,
            kind: 'bulk-transfer',
            password,
          })
        }
        return
      }
      if (shouldUseSettlementRemote('accountPayments')) {
        cmsAlertModal.show({
          title: '다운로드 불가',
          content:
            '서버 발급 파일이 준비된 뒤에만 대량이체 양식을 받을 수 있습니다. 브라우저에서 엑셀을 만들지 않습니다.',
        })
        return
      }
      const { exportBulkTransferExcel } =
        await import('@/pages/settlement-management/bulk-transfer-excel')
      await exportBulkTransferExcel(previewRows, { password })
    } catch (error) {
      notifySettlementExportDownloadError({
        error,
        fallback: '대량이체 파일 다운로드에 실패했습니다.',
        issueButtonLabel: '대량이체 양식 발급',
        onAlreadyDownloaded: onCancel,
      })
      throw error
    }
      },
    })
  }, [onCancel, onReissueExport, previewRows, runProtectedDownload, serverExport])

  return (
    <>
    {filePasswordModal}
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="대량이체 양식 미리보기"
      description="지급조서 확인이 완료 처리된 항목만 양식에 반영됩니다."
      width={1400}
      size="large"
      className="bulk-transfer-preview-modal"
      footer={
        <>
          <CmsButton variant="secondary" size="h40" onClick={onCancel}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            size="h40"
            icon={<ButtonDownloadIcon />}
            adminAction="download"
            disabled={usesServerFile && !serverFileReady}
            onClick={() => void handleDownload()}
          >
            엑셀 다운로드
          </CmsButton>
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
    </>
  )
}
