import { useCallback } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useCmsAlert } from '@/shared/ui'
import { downloadAbsenceEvidenceFile } from '@/features/program/general/api/absence-reasons'
import { ProgramAttendanceAbsenceReasons } from '@/features/program/shared/ui/program-attendance-absence-reasons'
import type { ProgramAttendanceAbsenceReasonItem } from '@/features/program/shared/ui/program-attendance-absence-reasons'
import { CompletionStatusText } from '@/features/program/shared/ui/program-attendance-status-text'
import type {
  UjatVolunteerAssignmentAbsenceReason,
  UjatVolunteerAssignmentAttendanceSummary,
  UjatVolunteerAssignmentProgressRow,
} from './assignment-types'

const ABSENCE_REASON_EMPTY_MESSAGE = '사유 기재 후 불참한 이력이 없습니다.'

export function UjatEducationProgressVolunteerAssignmentAttendanceInfo(props: {
  assignmentRows?: UjatVolunteerAssignmentProgressRow[]
  attendanceSummary: UjatVolunteerAssignmentAttendanceSummary
  absenceReasons: UjatVolunteerAssignmentAbsenceReason[]
}) {
  const { attendanceSummary, absenceReasons } = props
  const { showAlert } = useCmsAlert()

  const handleFileDownload = useCallback(
    (_item: ProgramAttendanceAbsenceReasonItem, fileObjectId: number, fileName: string) => {
      void downloadAbsenceEvidenceFile(fileObjectId, fileName).catch(() => {
        showAlert({
          title: '안내',
          content: '증빙 서류 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      })
    },
    [showAlert]
  )

  return (
    <div className="program-attendance-detail ujat-volunteer-assignment-attendance-info">
      <DetailInfoForm title="출결 관련 정보" mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="수료 여부"
            view={<CompletionStatusText label={attendanceSummary.completionStatus} />}
            readOnlyDisplay
          />
          <DetailInfoForm.Field
            label="지각 횟수"
            view={attendanceSummary.lateCountLabel}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <ProgramAttendanceAbsenceReasons
        reasons={absenceReasons}
        emptyMessage={ABSENCE_REASON_EMPTY_MESSAGE}
        onFileDownload={handleFileDownload}
      />
    </div>
  )
}
