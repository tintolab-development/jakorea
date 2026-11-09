/**
 * UJAT 참여 봉사자 — 1365 봉사시간 등록 양식 Fortune Sheet 미리보기 + 엑셀 다운로드
 * 데이터: 반기 일괄 API (미리보기 PREVIEW 1회 / 다운로드 DOWNLOAD 1회)
 */

import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { EducationProgressHalfKey } from '../tabs'
import {
  buildVolunteer1365FortuneSheet,
  buildVolunteer1365SheetModel,
  VOLUNTEER_1365_COLUMN_HEADER_HEIGHT,
  VOLUNTEER_1365_ROW_HEADER_WIDTH,
  VOLUNTEER_1365_ROW_HEIGHT,
} from './volunteer-1365-fortune-data'
import { exportVolunteer1365Excel } from './volunteer-1365-excel'
import {
  resolveVolunteer1365FormErrorMessage,
  useVolunteer1365SemesterFormPreview,
} from './use-volunteer-1365-semester-form'
import './volunteer-1365-preview-modal.css'

const Workbook = lazy(() => import('@/pages/settlement-management/bulk-transfer-fortune-workbook'))

export interface Volunteer1365PreviewModalProps {
  open: boolean
  onCancel: () => void
  half: EducationProgressHalfKey
  programId?: string | null
}

export function Volunteer1365PreviewModal({
  open,
  onCancel,
  half,
  programId,
}: Volunteer1365PreviewModalProps) {
  const { showAlert } = useCmsAlert()
  const preview = useVolunteer1365SemesterFormPreview({ programId, half, enabled: open })
  const [exporting, setExporting] = useState(false)

  const model = useMemo(() => buildVolunteer1365SheetModel(preview.data), [preview.data])
  const sheetData: Sheet[] = useMemo(() => [buildVolunteer1365FortuneSheet(model)], [model])
  const columnCount = model.headerLabels.length
  const previewErrorMessage = preview.isError
    ? resolveVolunteer1365FormErrorMessage(preview.error)
    : null

  const handleExcelDownload = useCallback(async () => {
    if (exporting || !programId) return
    try {
      setExporting(true)
      await exportVolunteer1365Excel({ programId: String(programId), half })
    } catch (error) {
      showAlert({
        title: '엑셀 다운로드',
        content: resolveVolunteer1365FormErrorMessage(error),
      })
    } finally {
      setExporting(false)
    }
  }, [exporting, half, programId, showAlert])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="1365 봉사시간 등록 양식 미리보기"
      description="교육이 완료된 항목만 양식에 반영됩니다."
      width={1400}
      size="large"
      className="volunteer-1365-preview-modal"
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
            loading={exporting}
            disabled={exporting || !programId || preview.isError}
            onClick={() => void handleExcelDownload()}
          >
            엑셀 다운로드
          </CmsButton>
        </>
      }
    >
      <div className="volunteer-1365-preview-modal__sheet-host">
        {!open ? null : previewErrorMessage ? (
          <div className="volunteer-1365-preview-modal__sheet-message" role="alert">
            {previewErrorMessage}
          </div>
        ) : preview.isFetching && !preview.data ? (
          <div className="volunteer-1365-preview-modal__sheet-loading">
            <Spin size="large" />
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="volunteer-1365-preview-modal__sheet-loading">
                <Spin size="large" />
              </div>
            }
          >
            <Workbook
              key={`${half}-${columnCount}-${model.rows.length}-${preview.dataUpdatedAt}`}
              data={sheetData}
              column={columnCount}
              rowHeaderWidth={VOLUNTEER_1365_ROW_HEADER_WIDTH}
              columnHeaderHeight={VOLUNTEER_1365_COLUMN_HEADER_HEIGHT}
              defaultRowHeight={VOLUNTEER_1365_ROW_HEIGHT}
              showToolbar={false}
              showFormulaBar={false}
              showSheetTabs
              allowEdit={false}
              addRows={0}
            />
          </Suspense>
        )}
      </div>
    </ContentModal>
  )
}
