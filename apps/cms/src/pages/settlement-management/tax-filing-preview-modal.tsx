/**
 * 정산 관리 > 계좌 지급 — 세금신고 양식 미리보기 (Fortune Sheet)
 */

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import type { SettlementExportHistoryResponse } from '@/shared/api/generated/settlement/schemas'
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
} from '@/pages/settlement-management/tax-filing-fortune-data'
import {
  applyTaxFilingMaskedResidentNumbers,
  loadTaxFilingMaskedResidentNumbers,
} from '@/pages/settlement-management/tax-filing-masked-resident'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './tax-filing-preview-modal.css'

const Workbook = lazy(() => import('./bulk-transfer-fortune-workbook'))

export interface TaxFilingPreviewModalProps {
  open: boolean
  onCancel: () => void
  rows: AccountPaymentRow[]
  serverExport?: SettlementExportHistoryResponse | null
  onReissueExport?: () => Promise<SettlementExportHistoryResponse | null>
}

export function TaxFilingPreviewModal({
  open,
  onCancel,
  rows,
  serverExport,
  onReissueExport,
}: TaxFilingPreviewModalProps) {
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
    void loadTaxFilingMaskedResidentNumbers(rows)
      .then(masked => {
        if (cancelled) return
        setPreviewRows(applyTaxFilingMaskedResidentNumbers(rows, masked))
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
    const sheet = buildTaxFilingFortuneSheet(previewRows)
    return [sheet]
  }, [previewRows])

  const handleDownload = useCallback(async () => {
    try {
      if (serverExport?.deliveryMethod === 'SERVER_FILE') {
        if (serverExport.fileObjectId == null) {
          cmsAlertModal.show({
            title: '다운로드 불가',
            content:
              '세금신고 서버 파일이 아직 준비되지 않았습니다. 목록에서 「세금 신고 양식 발급」을 다시 눌러 주세요.',
          })
          return
        }
        if (onReissueExport) {
          await downloadIssuedSettlementExportFileOrReissue({
            serverExport,
            kind: 'tax-report',
            onReissue: onReissueExport,
          })
        } else {
          await downloadIssuedSettlementExportFile({
            serverExport,
            kind: 'tax-report',
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
  }, [onCancel, onReissueExport, rows, serverExport])

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
            disabled={usesServerFile && !serverFileReady}
            onClick={() => void handleDownload()}
          >
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
