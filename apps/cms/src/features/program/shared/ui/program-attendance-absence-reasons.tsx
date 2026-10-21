import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AttachmentDownloadIcon } from '@/shared/ui'
import '@/shared/components/detail-info-form/detail-info-form.css'

export type ProgramAttendanceAbsenceReasonItem = {
  id: string
  dateLabel: string
  reason: string
  fileName?: string | null
  fileObjectIds?: number[]
  originalFileNames?: Array<string | null>
}

const DEFAULT_EMPTY_MESSAGE = '사유 기재 후 불참한 이력이 없습니다.'

export interface ProgramAttendanceAbsenceReasonsProps {
  reasons: ProgramAttendanceAbsenceReasonItem[]
  emptyMessage?: string
  onFileDownload?: (item: ProgramAttendanceAbsenceReasonItem) => void
}

function renderEvidenceCell(
  item: ProgramAttendanceAbsenceReasonItem,
  onFileDownload?: (item: ProgramAttendanceAbsenceReasonItem) => void
) {
  if (!item.fileName) {
    return <span className="program-attendance-absence-reasons__dash">-</span>
  }
  return (
    <button
      type="button"
      className="program-attendance-absence-reasons__file"
      onClick={() => onFileDownload?.(item)}
    >
      <AttachmentDownloadIcon className="program-attendance-absence-reasons__file-icon" />
      <span className="program-attendance-absence-reasons__file-name">{item.fileName}</span>
    </button>
  )
}

export function ProgramAttendanceAbsenceReasons({
  reasons,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  onFileDownload,
}: ProgramAttendanceAbsenceReasonsProps) {
  if (reasons.length === 0) {
    return (
      <DetailInfoForm title="불참 사유" mode="view">
        <p className="program-attendance-absence-reasons__empty" role="status">
          {emptyMessage}
        </p>
      </DetailInfoForm>
    )
  }

  return (
    <DetailInfoForm title="불참 사유" mode="view">
      {reasons.map(item => (
        <DetailInfoForm.Row type="double" key={item.id}>
          <DetailInfoForm.Field
            label={item.dateLabel}
            view={item.reason?.trim() || '-'}
            readOnlyDisplay
          />
          <DetailInfoForm.Field
            label="증빙 서류"
            view={renderEvidenceCell(item, onFileDownload)}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      ))}
    </DetailInfoForm>
  )
}
