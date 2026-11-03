/**
 * UJAT 참여 봉사자 — 1365 봉사시간 등록 양식 Fortune Sheet 미리보기 + 엑셀 다운로드
 */

import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useUjatProgramScheduleDates } from '@/features/program/ujat/ui/detail-modal/application-institution/use-program-schedule-dates'
import type { EducationProgressHalfKey } from '../tabs'
import {
  buildVolunteer1365FortuneSheet,
  buildVolunteer1365SheetColumnCount,
  type Volunteer1365VolunteerSource,
} from './volunteer-1365-fortune-data'
import { exportVolunteer1365Excel } from './volunteer-1365-excel'
import { useVolunteer1365Attendance } from './use-volunteer-1365-attendance'
import './volunteer-1365-preview-modal.css'

const Workbook = lazy(() => import('@/pages/settlement-management/bulk-transfer-fortune-workbook'))

export interface Volunteer1365PreviewModalProps {
  open: boolean
  onCancel: () => void
  half: EducationProgressHalfKey
  volunteers: readonly Volunteer1365VolunteerSource[]
  programId?: string | null
}

export function Volunteer1365PreviewModal({
  open,
  onCancel,
  half,
  volunteers,
  programId,
}: Volunteer1365PreviewModalProps) {
  const { showAlert } = useCmsAlert()
  const { dates: scheduleDates } = useUjatProgramScheduleDates(programId)
  const { data: attendance } = useVolunteer1365Attendance({
    programId,
    half,
    scheduleDates,
    enabled: open,
  })
  const [exporting, setExporting] = useState(false)

  const sheetData: Sheet[] = useMemo(() => {
    const sheet = buildVolunteer1365FortuneSheet(half, volunteers, scheduleDates, attendance)
    return [sheet]
  }, [attendance, half, scheduleDates, volunteers])

  const columnCount = useMemo(
    () => buildVolunteer1365SheetColumnCount(half, scheduleDates),
    [half, scheduleDates]
  )

  const handleExcelDownload = useCallback(async () => {
    if (exporting) return
    try {
      setExporting(true)
      await exportVolunteer1365Excel(half, volunteers, scheduleDates, attendance)
    } catch {
      showAlert({
        title: '엑셀 다운로드',
        content: '엑셀 파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setExporting(false)
    }
  }, [attendance, exporting, half, scheduleDates, showAlert, volunteers])

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
            icon={<ButtonDownloadIcon />}
            adminAction="download"
            disabled={exporting}
            onClick={() => void handleExcelDownload()}
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
              key={`${half}-${sheetData[0]?.celldata?.length ?? 0}-${attendance?.size ?? 0}`}
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
