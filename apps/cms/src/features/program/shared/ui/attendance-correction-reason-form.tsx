import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, FileSelectField } from '@/shared/ui'

const EVIDENCE_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'

export type AttendanceCorrectionReasonFormProps = {
  reason: string
  onReasonChange: (value: string) => void
  evidenceFileNames: string[]
  onFilesChange: (files: File[]) => void
  onRemoveFile: (index: number) => void
}

/** 출결 정정 — 사유 불참 시 사유·증빙 서류 (DetailInfoForm) */
export function AttendanceCorrectionReasonForm({
  reason,
  onReasonChange,
  evidenceFileNames,
  onFilesChange,
  onRemoveFile,
}: AttendanceCorrectionReasonFormProps) {
  return (
    <DetailInfoForm title="사유 및 증빙 서류" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="사유"
          required
          fullRow
          view={reason}
          edit={
            <CmsInput
              inputSize="large"
              width="100%"
              value={reason}
              onChange={event => onReasonChange(event.target.value)}
              placeholder="사유를 입력해 주세요"
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="증빙 서류"
          fullRow
          view=""
          edit={
            <FileSelectField
              accept={EVIDENCE_ACCEPT}
              fileNames={evidenceFileNames}
              onFilesChange={onFilesChange}
              onRemoveFile={onRemoveFile}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
