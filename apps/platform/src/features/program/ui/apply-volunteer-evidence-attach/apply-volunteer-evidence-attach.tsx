import { useState } from 'react'
import {
  isMemberFileSizeUploadError,
  MemberFileEmptyError,
  MemberFileRejectedError,
  MemberFileTooLargeError,
  uploadMemberPortalFile,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import {
  FILE_UPLOAD_MAX_COUNT,
  FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE,
  formatMultiFileUploadHint,
  sumUploadFileBytes,
  validateUploadBatch,
} from '@/shared/lib/file-upload-policy'
import { PFFormFileAttach } from '@/shared/ui'
import styles from './apply-volunteer-evidence-attach.module.css'

const EVIDENCE_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'
const EVIDENCE_FILE_PURPOSE = 'VOLUNTEER_APPLICATION_EVIDENCE'
const EVIDENCE_NAME_PATTERN = /\.(jpe?g|png|pdf)$/i
const EVIDENCE_HINT = formatMultiFileUploadHint('JPG, PNG, PDF')

export type ApplyVolunteerEvidenceFile = {
  questionKey: string
  fileObjectId: number
  fileName: string
  /** 이번 화면에서 올린 파일만 알 수 있다. 임시저장 복원 파일은 없음 */
  fileSize?: number
}

type ApplyVolunteerEvidenceAttachProps = {
  questionKey: string
  files: readonly ApplyVolunteerEvidenceFile[]
  onChange: (next: ApplyVolunteerEvidenceFile[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

function evidenceFileError(
  file: File,
  currentFiles: readonly ApplyVolunteerEvidenceFile[]
): string | null {
  const mime = file.type.trim().toLowerCase()
  const allowedMime = mime === 'image/jpeg' || mime === 'image/png' || mime === 'application/pdf'
  if (!allowedMime && !EVIDENCE_NAME_PATTERN.test(file.name)) {
    return 'JPG, PNG, PDF 파일만 첨부할 수 있습니다.'
  }
  return validateUploadBatch({
    currentCount: currentFiles.length,
    currentTotalBytes: sumUploadFileBytes(currentFiles.map(item => ({ size: item.fileSize ?? 0 }))),
    incoming: [file],
  })
}

/** 신청폼 조회 `draftAttachments` → 첨부 상태 */
export function readDraftEvidenceFiles(raw: unknown): ApplyVolunteerEvidenceFile[] {
  if (!Array.isArray(raw)) return []
  const files: ApplyVolunteerEvidenceFile[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const fileObjectId = typeof row.fileObjectId === 'number' ? row.fileObjectId : Number(row.fileObjectId)
    const questionKey = typeof row.questionKey === 'string' ? row.questionKey : ''
    const fileName = typeof row.originalFileName === 'string' ? row.originalFileName.trim() : ''
    if (!Number.isFinite(fileObjectId) || fileObjectId <= 0 || !questionKey || !fileName) continue
    files.push({ questionKey, fileObjectId, fileName })
  }
  return files
}

/** 보이는 문항만 `fileObjectIdsByQuestion`으로 묶는다. 첨부가 없으면 undefined */
export function evidenceFileObjectIdsByQuestion(
  files: readonly ApplyVolunteerEvidenceFile[],
  questionKeys: readonly string[],
): Record<string, number[]> | undefined {
  const allowed = new Set(questionKeys)
  const grouped: Record<string, number[]> = {}
  for (const file of files) {
    if (!allowed.has(file.questionKey)) continue
    grouped[file.questionKey] = [...(grouped[file.questionKey] ?? []), file.fileObjectId]
  }
  return Object.keys(grouped).length > 0 ? grouped : undefined
}

/** 일반·UJAT 봉사자 증빙. 업로드 후 CLEAN 확인까지 기존 회원 파일 흐름을 쓴다. */
export function ApplyVolunteerEvidenceAttach({
  questionKey,
  files,
  onChange,
  onUploadingChange,
}: ApplyVolunteerEvidenceAttachProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const ownFiles = files.filter(file => file.questionKey === questionKey)

  const handleFileSelect = (file: File) => {
    const invalid = evidenceFileError(file, ownFiles)
    if (invalid) {
      setUploadError(invalid)
      return
    }
    setUploadError(null)
    setUploading(true)
    onUploadingChange?.(true)
    void uploadMemberPortalFile({ file, filePurpose: EVIDENCE_FILE_PURPOSE })
      .then(fileObjectId => {
        onChange([...files, { questionKey, fileObjectId, fileName: file.name, fileSize: file.size }])
      })
      .catch((error: unknown) => {
        setUploadError(
          error instanceof MemberFileRejectedError
            ? '보안 정책상 등록할 수 없는 파일입니다. 다른 파일로 다시 시도해 주세요.'
            : error instanceof MemberFileTooLargeError
              ? FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE
            : error instanceof MemberFileEmptyError || isMemberFileSizeUploadError(error)
              ? '빈 파일은 업로드할 수 없습니다. 파일을 다시 선택해 주세요.'
              : '증빙서류 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        )
      })
      .finally(() => {
        setUploading(false)
        onUploadingChange?.(false)
      })
  }

  return (
    <div className={styles.evidence}>
      {ownFiles.length > 0 ? (
        <div className={styles.files}>
          {ownFiles.map(file => (
            <PFFormFileAttach
              key={file.fileObjectId}
              hideTrigger
              fileName={file.fileName}
              disabled={uploading}
              onFileSelect={() => {}}
              onRemove={() =>
                onChange(files.filter(item => item.fileObjectId !== file.fileObjectId))
              }
            />
          ))}
        </div>
      ) : null}
      <div className={styles.evidenceRow}>
        <PFFormFileAttach
          className={styles.trigger}
          accept={EVIDENCE_ACCEPT}
          buttonLabel="파일 추가"
          aria-label="증빙서류 첨부"
          uploading={uploading}
          disabled={ownFiles.length >= FILE_UPLOAD_MAX_COUNT}
          onFileSelect={handleFileSelect}
        />
        <p className={styles.hint}>
          <span>{EVIDENCE_HINT}</span>
          <span>파일명에 특수문자가 있으면 등록되지 않을 수 있습니다.</span>
        </p>
      </div>
      {uploadError ? <p className={styles.evidenceError}>{uploadError}</p> : null}
    </div>
  )
}
