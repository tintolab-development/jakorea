/**
 * 정산 관리 > 계좌 지급 — 세금신고 양식 미리보기 (Fortune Sheet)
 */

import { lazy, Suspense, useCallback, useMemo } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { SettlementExportResponse } from '@/features/settlement-management/api/account-payments/settlement-export-response'
import type { TaxReportPreviewWorkbook } from '@/features/settlement-management/api/account-payments/tax-report-preview'
import {
  downloadIssuedSettlementExportFile,
  downloadIssuedSettlementExportFileOrReissue,
  notifySettlementExportDownloadError,
} from '@/features/settlement-management/api/account-payments/download-issued-export-file'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  TAX_FILING_SHEET_COLUMN_COUNT,
  buildTaxFilingFortuneSheet,
  getTaxFilingPreviewValidationError,
} from '@/pages/settlement-management/tax-filing-fortune-data'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import './tax-filing-preview-modal.css'

const Workbook = lazy(() => import('./bulk-transfer-fortune-workbook'))

export interface TaxFilingPreviewModalProps {
  open: boolean
  onCancel: () => void
  previewWorkbook: TaxReportPreviewWorkbook | null
  serverExport?: SettlementExportResponse | null
  onRequestExport?: () => Promise<SettlementExportResponse | null>
  onReissueExport?: () => Promise<SettlementExportResponse | null>
}

export function TaxFilingPreviewModal({
  open,
  onCancel,
  previewWorkbook,
  serverExport,
  onRequestExport,
  onReissueExport,
}: TaxFilingPreviewModalProps) {
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const usesServerFile = serverExport?.deliveryMethod === 'SERVER_FILE'
  const serverFileReady =
    usesServerFile &&
    serverExport?.fileObjectId != null &&
    Number.isFinite(serverExport.fileObjectId)
  const previewValidationError = useMemo(
    () => getTaxFilingPreviewValidationError(previewWorkbook),
    [previewWorkbook]
  )

  const sheetData: Sheet[] = useMemo(() => {
    return previewWorkbook ? [buildTaxFilingFortuneSheet(previewWorkbook)] : []
  }, [previewWorkbook])

  const handleDownload = useCallback(() => {
    runProtectedDownload({
      kind: 'TAX_REPORT_EXCEL',
      zIndex: 1400,
      download: async password => {
        try {
          let exportToDownload = serverExport ?? null
          let requestedExport = false
          if (exportToDownload == null && onRequestExport) {
            requestedExport = true
            exportToDownload = await onRequestExport()
          }
          if (requestedExport && exportToDownload == null) return
          if (exportToDownload?.deliveryMethod === 'SERVER_FILE') {
            if (exportToDownload.fileObjectId == null) {
              cmsAlertModal.show({
                title: '다운로드 불가',
                content:
                  '세금신고 서버 파일이 아직 준비되지 않았습니다. 목록에서 「세금 신고 양식 발급」을 다시 눌러 주세요.',
              })
              return
            }
            if (onReissueExport) {
              await downloadIssuedSettlementExportFileOrReissue({
                serverExport: exportToDownload,
                kind: 'tax-report',
                password,
                onReissue: onReissueExport,
              })
            } else {
              await downloadIssuedSettlementExportFile({
                serverExport: exportToDownload,
                kind: 'tax-report',
                password,
              })
            }
            return
          }
          if (shouldUseSettlementRemote('accountPayments')) {
            cmsAlertModal.show({
              title: '다운로드 불가',
              content:
                '서버 발급 파일이 준비된 뒤에만 세금신고 양식을 받을 수 있습니다. 브라우저에서 엑셀을 만들지 않습니다.',
            })
            return
          }
          if (previewValidationError) {
            cmsAlertModal.show({
              title: '다운로드 불가',
              content:
                previewValidationError?.message ??
                '서버 발급 파일이 준비된 뒤에만 세금신고 양식을 받을 수 있습니다.',
            })
            return
          }
          const { exportTaxFilingExcel } =
            await import('@/pages/settlement-management/tax-filing-excel')
          if (!previewWorkbook) {
            cmsAlertModal.show({
              title: '다운로드 불가',
              content: previewValidationError?.message ?? '세금신고 미리보기 데이터가 없습니다.',
            })
            return
          }
          await exportTaxFilingExcel(previewWorkbook, { password })
        } catch (error) {
          notifySettlementExportDownloadError({
            error,
            fallback: '세금신고 파일 다운로드에 실패했습니다.',
            issueButtonLabel: '세금 신고 양식 발급',
            onAlreadyDownloaded: onCancel,
          })
          throw error
        }
      },
    })
  }, [
    onCancel,
    onRequestExport,
    onReissueExport,
    previewValidationError,
    previewWorkbook,
    runProtectedDownload,
    serverExport,
  ])

  return (
    <>
    {filePasswordModal}
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
            disabled={
              (usesServerFile && !serverFileReady) ||
              previewValidationError?.code === 'VALIDATION_ERROR'
            }
            onClick={() => void handleDownload()}
          >
            엑셀 다운로드
          </CmsButton>
        </>
      }
    >
      <div className="tax-filing-preview-modal__sheet-host">
        {previewValidationError ? (
          <div
            role="alert"
            style={{
              marginBottom: 12,
              padding: '12px 16px',
              color: '#8a1c1c',
              background: '#fff1f0',
              border: '1px solid #ffa39e',
              borderRadius: 4,
            }}
          >
            {previewValidationError.message}
          </div>
        ) : null}
        {open && sheetData.length > 0 && !previewValidationError ? (
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
    </>
  )
}
