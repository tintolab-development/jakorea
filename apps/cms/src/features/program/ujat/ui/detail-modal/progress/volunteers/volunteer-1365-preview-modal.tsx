/**
 * UJAT 참여 봉사자 — 1365 봉사시간 등록 양식 미리보기 (Fortune Sheet)
 */

import { lazy, Suspense, useCallback, useMemo } from 'react'
import { Spin } from 'antd'
import type { Sheet } from '@fortune-sheet/core'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useUjatProgramScheduleDates } from '@/features/program/ujat/ui/detail-modal/application-institution/use-program-schedule-dates'
import type { EducationProgressHalfKey } from '../tabs'
import {
  buildVolunteer1365FortuneSheet,
  buildVolunteer1365SheetColumnCount,
  type Volunteer1365VolunteerSource,
} from './volunteer-1365-fortune-data'
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
  const { dates: scheduleDates } = useUjatProgramScheduleDates(programId)
  const { data: attendance } = useVolunteer1365Attendance({
    programId,
    half,
    scheduleDates,
    enabled: open,
  })
  const sheetData: Sheet[] = useMemo(() => {
    const sheet = buildVolunteer1365FortuneSheet(half, volunteers, scheduleDates, attendance)
    return [sheet]
  }, [attendance, half, scheduleDates, volunteers])

  const columnCount = useMemo(
    () => buildVolunteer1365SheetColumnCount(half, scheduleDates),
    [half, scheduleDates]
  )

  const handleDownload = useCallback(async () => {
    const { exportVolunteer1365Excel } = await import('./volunteer-1365-excel')
    await exportVolunteer1365Excel(half, volunteers, scheduleDates, attendance)
  }, [attendance, half, scheduleDates, volunteers])

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
          <ExcelButton onClick={() => void handleDownload()} />
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
