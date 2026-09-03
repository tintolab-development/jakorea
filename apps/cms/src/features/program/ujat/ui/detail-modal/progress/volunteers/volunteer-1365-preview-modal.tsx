/**
 * UJAT 참여 봉사자 — 1365 봉사시간 등록 양식 미리보기 (Fortune Sheet)
 */

import { lazy, Suspense, useCallback, useMemo } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { EducationProgressHalfKey } from '../tabs'
import {
  buildVolunteer1365FortuneSheet,
  buildVolunteer1365SheetColumnCount,
} from './volunteer-1365-fortune-data'
import './volunteer-1365-preview-modal.css'

const Workbook = lazy(() => import('@/pages/settlement-management/bulk-transfer-fortune-workbook'))

export interface Volunteer1365PreviewModalProps {
  open: boolean
  onCancel: () => void
  half: EducationProgressHalfKey
  volunteerIds: readonly string[]
}

export function Volunteer1365PreviewModal({
  open,
  onCancel,
  half,
  volunteerIds,
}: Volunteer1365PreviewModalProps) {
  const sheetData: Sheet[] = useMemo(() => {
    const sheet = buildVolunteer1365FortuneSheet(half, volunteerIds)
    return [sheet]
  }, [half, volunteerIds])

  const columnCount = useMemo(() => buildVolunteer1365SheetColumnCount(half), [half])

  const handleDownload = useCallback(async () => {
    const { exportVolunteer1365Excel } = await import('./volunteer-1365-excel')
    await exportVolunteer1365Excel(half, volunteerIds)
  }, [half, volunteerIds])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="1365 봉사시간 등록 양식 미리보기"
      description="교육 완료된 건에 한해서 양식에 반영됩니다."
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
            icon={<DownloadOutlined />}
            adminAction="download"
            onClick={() => void handleDownload()}
          >
            엑셀 다운로드
          </CmsButton>
        </>
      }
    >
      <div className="volunteer-1365-preview-modal__sheet-host">
        {open ? (
          <Suspense
            fallback={
              <div className="volunteer-1365-preview-modal__sheet-loading">
                <Spin size="large" />
              </div>
            }
          >
            <Workbook
              key={`${half}-${sheetData[0]?.celldata?.length ?? 0}`}
              data={sheetData}
              column={columnCount}
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
