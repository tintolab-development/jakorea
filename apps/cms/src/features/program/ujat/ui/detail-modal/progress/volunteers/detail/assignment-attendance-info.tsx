import { useCallback } from 'react'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { useCmsAlert } from '@/shared/ui'
import { downloadAbsenceEvidenceFile } from '@/features/program/general/api/absence-reasons'
import { ProgramAttendanceAbsenceReasons } from '@/features/program/shared/ui/program-attendance-absence-reasons'
import type { ProgramAttendanceAbsenceReasonItem } from '@/features/program/shared/ui/program-attendance-absence-reasons'
import { CompletionStatusText } from '@/features/program/shared/ui/program-attendance-status-text'
import {
  hasExcusedAbsenceInAssignmentRows,
  type UjatVolunteerAssignmentAbsenceReason,
  type UjatVolunteerAssignmentAttendanceSummary,
  type UjatVolunteerAssignmentProgressRow,
} from './assignment-types'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

const ABSENCE_REASON_EMPTY_MESSAGE = '사유 기재 후 불참한 이력이 없습니다.'

export function UjatEducationProgressVolunteerAssignmentAttendanceInfo({
  assignmentRows,
  attendanceSummary,
  absenceReasons,
}: {
  assignmentRows: UjatVolunteerAssignmentProgressRow[]
  attendanceSummary: UjatVolunteerAssignmentAttendanceSummary
  absenceReasons: UjatVolunteerAssignmentAbsenceReason[]
}) {
  const { showAlert } = useCmsAlert()
  const showAbsenceReasonBlock = hasExcusedAbsenceInAssignmentRows(assignmentRows)

  const showComingSoon = useCallback(() => {
    showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
  }, [showAlert])

  const handleFileDownload = useCallback(
    (item: ProgramAttendanceAbsenceReasonItem) => {
      const fileObjectId = item.fileObjectIds?.find(id => typeof id === 'number')
      if (fileObjectId == null) {
        // BE가 fileObjectId를 주지 않으면 downloadAbsenceEvidenceFile을 호출할 수 없다.
        showComingSoon()
        return
      }
      const fileName = item.fileName?.trim() || `증빙서류-${fileObjectId}`
      void downloadAbsenceEvidenceFile(fileObjectId, fileName).catch(() => {
        showAlert({
          title: '안내',
          content: '증빙 서류 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      })
    },
    [showAlert, showComingSoon]
  )

  return (
    <div className="program-attendance-detail">
      <section className="program-detail-fullpage-modal__info-tab-block">
        <div className="table-header-title--wrapper">
          <span className="table-title" style={{ marginBottom: 10 }}>
            출결 관련 정보
          </span>
        </div>
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>수료 여부</th>
                <td>
                  <CompletionStatusText label={attendanceSummary.completionStatus} />
                </td>
                <th>지각 횟수</th>
                <td>{attendanceSummary.lateCountLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {showAbsenceReasonBlock ? (
        <ProgramAttendanceAbsenceReasons
          reasons={absenceReasons}
          emptyMessage={ABSENCE_REASON_EMPTY_MESSAGE}
          onFileDownload={handleFileDownload}
        />
      ) : null}
    </div>
  )
}
