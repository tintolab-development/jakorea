/**
 * 정산 관리 > 계좌 지급 — 세금신고 양식 미리보기 (Fortune Sheet)
 */

import { lazy, Suspense, useCallback, useMemo } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import type { SettlementExportHistoryResponse } from '@/shared/api/generated/settlement/schemas'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
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
  serverExport?: SettlementExportHistoryResponse | null
}

export function TaxFilingPreviewModal({ open, onCancel, rows, serverExport }: TaxFilingPreviewModalProps) {
  const usesServerFile = serverExport?.deliveryMethod === 'SERVER_FILE'
  const sheetData: Sheet[] = useMemo(() => {
    const sheet = buildTaxFilingFortuneSheet(rows)
    return [sheet]
  }, [rows])

  const handleDownload = useCallback(async () => {
    try {
      if (serverExport?.deliveryMethod === 'SERVER_FILE') {
        if (!serverExport.downloadUrl) {
          throw new Error('서버에서 정산 파일을 생성 중입니다. export 이력을 확인해 주세요.')
        }
        await downloadFromBulkEndpoint(serverExport.downloadUrl, '세금신고', 'xlsx')
        return
      }
      const { exportTaxFilingExcel } =
        await import('@/pages/settlement-management/tax-filing-excel')
      await exportTaxFilingExcel(rows)
    } catch (error) {
      cmsAlertModal.show({
        title: '다운로드 불가',
        content: getSettlementApiErrorMessage(error, '세금신고 파일 다운로드에 실패했습니다.'),
      })
    }
  }, [rows, serverExport])

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
            onClick={() => void handleDownload()}
          >
            엑셀 다운로드
          </CmsButton>
        </>
      }
    >
      <div className="tax-filing-preview-modal__sheet-host">
        {usesServerFile ? (
          <div className="tax-filing-preview-modal__server-file-notice" role="status">
            <strong>서버 생성 엑셀을 기준으로 확인해 주세요.</strong>
            <p>
              원천징수세액이 0원이면 세액 행을 생성하지 않고, 세액이 있으면 실지급액·세액 행을
              서버 계산 결과에 따라 생성합니다.
            </p>
          </div>
        ) : open ? (
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
