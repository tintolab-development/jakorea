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
const NO_ATTACHMENT_LABEL = '첨부 없음'

export interface ProgramAttendanceAbsenceReasonsProps {
  reasons: ProgramAttendanceAbsenceReasonItem[]
  emptyMessage?: string
  onFileDownload?: (
    item: ProgramAttendanceAbsenceReasonItem,
    fileObjectId: number,
    fileName: string
  ) => void
}

function resolveEvidenceFileName(
  item: ProgramAttendanceAbsenceReasonItem,
  fileObjectId: number,
  index: number
): string {
  return (
    item.originalFileNames?.[index]?.trim() ||
    item.fileName?.trim() ||
    `증빙서류-${fileObjectId}`
  )
}

function renderEvidenceCell(
  item: ProgramAttendanceAbsenceReasonItem,
  onFileDownload?: ProgramAttendanceAbsenceReasonsProps['onFileDownload']
) {
  const fileObjectIds = item.fileObjectIds?.filter((id): id is number => typeof id === 'number') ?? []
  if (fileObjectIds.length === 0) {
    return <span className="program-attendance-absence-reasons__no-attachment">{NO_ATTACHMENT_LABEL}</span>
  }

  return (
    <div className="program-attendance-absence-reasons__files">
      {fileObjectIds.map((fileObjectId, index) => {
        const fileName = resolveEvidenceFileName(item, fileObjectId, index)
        return (
          <button
            key={`${item.id}-${fileObjectId}-${index}`}
            type="button"
            className="program-attendance-absence-reasons__file"
            onClick={() => onFileDownload?.(item, fileObjectId, fileName)}
          >
            <AttachmentDownloadIcon className="program-attendance-absence-reasons__file-icon" />
            <span className="program-attendance-absence-reasons__file-name">{fileName}</span>
          </button>
        )
      })}
    </div>
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
