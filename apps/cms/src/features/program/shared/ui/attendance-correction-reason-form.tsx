import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, FileSelectField, type FileSelectFieldProps } from '@/shared/ui'

const EVIDENCE_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'

export type AttendanceCorrectionReasonFormProps = {
  reason: string
  onReasonChange: (value: string) => void
  evidenceFileNames: string[]
  onFilesChange: (files: File[]) => void
  onRemoveFile: (index: number) => void
  /** 「사유」 라벨 `*` — 기본 true(기존 표시). UJAT 출결 정정 시안(4082:109940)은 false */
  reasonRequiredMark?: boolean
  /** 사유 입력 최대 글자 수 — 생략 시 제한 없음(기존 동작) */
  reasonMaxLength?: number
  /** 증빙 서류 FileSelectField accept·안내·용량 정책 — 생략 시 기존 값 */
  evidenceFileFieldProps?: Pick<
    FileSelectFieldProps,
    | 'accept'
    | 'guideLines'
    | 'maxFileBytes'
    | 'maxTotalBytes'
    | 'currentTotalBytes'
    | 'sizeExceededMessage'
  >
}

/** 출결 정정 — 사유 불참 시 사유·증빙 서류 (DetailInfoForm) */
export function AttendanceCorrectionReasonForm({
  reason,
  onReasonChange,
  evidenceFileNames,
  onFilesChange,
  onRemoveFile,
  reasonRequiredMark = true,
  reasonMaxLength,
  evidenceFileFieldProps,
}: AttendanceCorrectionReasonFormProps) {
  return (
    <DetailInfoForm title="사유 및 증빙 서류" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="사유"
          required={reasonRequiredMark}
          fullRow
          view={reason}
          edit={
            <CmsInput
              inputSize="large"
              width="100%"
              value={reason}
              onChange={event => onReasonChange(event.target.value)}
              maxLength={reasonMaxLength}
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
              {...evidenceFileFieldProps}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
