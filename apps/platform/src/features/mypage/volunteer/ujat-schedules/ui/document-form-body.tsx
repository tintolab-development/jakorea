import { useState } from 'react'
import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import {
  isMemberFileSizeUploadError,
  MemberFileEmptyError,
  MemberFileRejectedError,
  MemberFileTooLargeError,
  uploadMemberPortalFile,
} from '@/features/mypage/instructor-apply/api/member-file-upload'
import {
  resolveEducationSurveySectionRequired,
  resolveEducationSurveySectionTitle,
} from '@/features/mypage/education/surveys/lib/survey-section-title'
import type { SurveySidecarState } from '@/features/mypage/education/surveys/lib/survey-sidecar'
import { PlatformSurveyParagraphBody } from '@/features/mypage/education/surveys/ui/platform-survey-paragraph-body'
import {
  FILE_UPLOAD_MAX_COUNT,
  FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE,
  sumUploadFileBytes,
  validateUploadBatch,
} from '@/shared/lib/file-upload-policy'
import { PFButton, PFFormSection, PFText } from '@/shared/ui'
import {
  fileQuestionKey,
  type UjatDocumentAttachedFile,
} from '../lib/document-answers'
import styles from './document-form-body.module.css'

type UjatEducationDocumentFormBodyProps = {
  draft: WritingFormDraft
  programTitle: string
  onUpdateParagraph: FormUpdateParagraph
  sidecar: SurveySidecarState
  onSidecarChange: (next: SurveySidecarState) => void
  files: readonly UjatDocumentAttachedFile[]
  onFilesChange: (next: UjatDocumentAttachedFile[]) => void
  readOnly?: boolean
  onDownloadFile?: (file: UjatDocumentAttachedFile) => void
  downloadingFileObjectId?: number | null
}

function isBodyOnlyParagraph(paragraph: WritingFormParagraph): boolean {
  return paragraph.kind === 'description' && paragraph.variant === 'closing'
}

export function UjatEducationDocumentFormBody({
  draft,
  programTitle,
  onUpdateParagraph,
  sidecar,
  onSidecarChange,
  files,
  onFilesChange,
  readOnly = false,
  onDownloadFile,
  downloadingFileObjectId = null,
}: UjatEducationDocumentFormBodyProps) {
  const formFileQuestionKeys = new Set(
    draft.paragraphs.map(paragraph => fileQuestionKey(paragraph)).filter(Boolean),
  )
  const orphanFiles = files.filter(
    file => !file.questionKey || !formFileQuestionKeys.has(file.questionKey),
  )

  return (
    <div className={styles.form}>
      {draft.paragraphs.flatMap(paragraph => {
        if (isUserInfoParagraph(paragraph) && getUserInfoSelectedEntries(paragraph).length === 0) {
          return []
        }
        if (isBodyOnlyParagraph(paragraph)) {
          const body = 'body' in paragraph ? String(paragraph.body ?? '').trim() : ''
          if (!body) return []
          return [
            <PFText key={paragraph.id} as="p" typo="bd-md-md" color="neutral-cool-600">
              {body}
            </PFText>,
          ]
        }

        const title = resolveEducationSurveySectionTitle(draft, paragraph)
        if (!title && paragraph.kind === 'description') return []

        const questionKey = fileQuestionKey(paragraph)

        return [
          <PFFormSection
            key={paragraph.id}
            id={paragraph.id}
            title={title || '문항'}
            description={
              isUserInfoParagraph(paragraph)
                ? undefined
                : paragraph.paragraphDescription?.trim() || undefined
            }
            required={resolveEducationSurveySectionRequired(paragraph)}
          >
            {questionKey ? (
              <DocumentFileField
                questionKey={questionKey}
                files={files}
                onFilesChange={onFilesChange}
                disabled={readOnly}
                onDownloadFile={onDownloadFile}
                downloadingFileObjectId={downloadingFileObjectId}
              />
            ) : (
              <PlatformSurveyParagraphBody
                paragraph={paragraph}
                programTitle={programTitle}
                onUpdateParagraph={onUpdateParagraph}
                sidecar={sidecar}
                onSidecarChange={onSidecarChange}
                readOnly={readOnly}
              />
            )}
          </PFFormSection>,
        ]
      })}
      {orphanFiles.length > 0 ? (
        <PFFormSection title="첨부파일">
          <DocumentAttachedFileList
            files={orphanFiles}
            readOnly={readOnly}
            onDownloadFile={onDownloadFile}
            downloadingFileObjectId={downloadingFileObjectId}
          />
        </PFFormSection>
      ) : null}
    </div>
  )
}

export function UjatLegacyEducationDocumentResponseBody({
  answers,
  files,
  onDownloadFile,
  downloadingFileObjectId = null,
}: {
  answers: Record<string, unknown>
  files: readonly UjatDocumentAttachedFile[]
  onDownloadFile?: (file: UjatDocumentAttachedFile) => void
  downloadingFileObjectId?: number | null
}) {
  const entries = Object.entries(answers)
  return (
    <div className={styles.form}>
      {entries.length > 0 ? (
        <PFFormSection title="제출 답변">
          <div className={styles.legacyAnswers}>
            {entries.map(([key, value]) => (
              <div className={styles.legacyAnswer} key={key}>
                <PFText as="strong" typo="bd-md-sb" color="neutral-cool-700">
                  {key}
                </PFText>
                <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
                  {formatLegacyAnswerValue(value)}
                </PFText>
              </div>
            ))}
          </div>
        </PFFormSection>
      ) : (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          제출된 답변이 없습니다.
        </PFText>
      )}
      {files.length > 0 ? (
        <PFFormSection title="첨부파일">
          <DocumentAttachedFileList
            files={files}
            readOnly
            onDownloadFile={onDownloadFile}
            downloadingFileObjectId={downloadingFileObjectId}
          />
        </PFFormSection>
      ) : null}
    </div>
  )
}

function formatLegacyAnswerValue(value: unknown): string {
  if (value == null || value === '') return '-'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value) ?? '-'
  } catch {
    return String(value)
  }
}

function DocumentAttachedFileList({
  files,
  readOnly,
  onDownloadFile,
  downloadingFileObjectId,
}: {
  files: readonly UjatDocumentAttachedFile[]
  readOnly: boolean
  onDownloadFile?: (file: UjatDocumentAttachedFile) => void
  downloadingFileObjectId: number | null
}) {
  return (
    <ul className={styles.fileList}>
      {files.map(file => (
        <li key={`${file.questionKey}-${file.fileObjectId}`}>
          <PFText as="span" typo="bd-md-md" color="neutral-cool-600">
            {file.fileName}
          </PFText>
          {readOnly && file.downloadable === true && onDownloadFile ? (
            <PFButton
              type="button"
              variant="tertiary"
              size="small"
              disabled={downloadingFileObjectId === file.fileObjectId}
              onClick={() => onDownloadFile(file)}
            >
              {downloadingFileObjectId === file.fileObjectId ? '다운로드 중' : '다운로드'}
            </PFButton>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function DocumentFileField({
  questionKey,
  files,
  onFilesChange,
  disabled,
  onDownloadFile,
  downloadingFileObjectId,
}: {
  questionKey: string
  files: readonly UjatDocumentAttachedFile[]
  onFilesChange: (next: UjatDocumentAttachedFile[]) => void
  disabled: boolean
  onDownloadFile?: (file: UjatDocumentAttachedFile) => void
  downloadingFileObjectId?: number | null
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const ownFiles = files.filter(file => file.questionKey === questionKey)

  const handleSelect = (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file || disabled) return
    const policyError = validateUploadBatch({
      currentCount: ownFiles.length,
      currentTotalBytes: sumUploadFileBytes(ownFiles.map(item => ({ size: item.fileSize ?? 0 }))),
      incoming: [file],
    })
    if (policyError) {
      setUploadError(policyError)
      return
    }
    setUploadError(null)
    setUploading(true)
    void uploadMemberPortalFile({ file, filePurpose: 'ASSIGNMENT_ATTACHMENT' })
      .then(fileObjectId => {
        onFilesChange([
          ...files,
          { questionKey, fileObjectId, fileName: file.name, fileSize: file.size },
        ])
      })
      .catch((error: unknown) => {
        setUploadError(
          error instanceof MemberFileRejectedError
            ? '보안 정책상 등록할 수 없는 파일입니다. 다른 파일로 다시 시도해 주세요.'
            : error instanceof MemberFileTooLargeError
              ? FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE
              : error instanceof MemberFileEmptyError || isMemberFileSizeUploadError(error)
                ? '빈 파일은 업로드할 수 없습니다. 파일을 다시 선택해 주세요.'
                : '파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        )
      })
      .finally(() => setUploading(false))
  }

  return (
    <div className={styles.fileField}>
      {disabled ? null : (
        <>
          <input
            className={styles.fileInput}
            type="file"
            disabled={uploading || ownFiles.length >= FILE_UPLOAD_MAX_COUNT}
            onChange={event => {
              handleSelect(event.target.files)
              event.target.value = ''
            }}
          />
          <PFButton
            type="button"
            variant="secondary"
            size="medium"
            disabled={uploading || ownFiles.length >= FILE_UPLOAD_MAX_COUNT}
            onClick={event => {
              const input = event.currentTarget.parentElement?.querySelector('input[type="file"]')
              if (input instanceof HTMLInputElement) input.click()
            }}
          >
            {uploading ? '업로드 중' : '파일 선택'}
          </PFButton>
        </>
      )}
      {ownFiles.length > 0 ? (
        <ul className={styles.fileList}>
          {ownFiles.map(file => (
            <li key={`${file.questionKey}-${file.fileObjectId}`}>
              <PFText as="span" typo="bd-md-md" color="neutral-cool-600">
                {file.fileName}
              </PFText>
              {disabled && file.downloadable === true && onDownloadFile ? (
                <PFButton
                  type="button"
                  variant="tertiary"
                  size="small"
                  disabled={downloadingFileObjectId === file.fileObjectId}
                  onClick={() => onDownloadFile(file)}
                >
                  {downloadingFileObjectId === file.fileObjectId ? '다운로드 중' : '다운로드'}
                </PFButton>
              ) : disabled ? null : (
                <PFButton
                  type="button"
                  variant="tertiary"
                  size="small"
                  onClick={() =>
                    onFilesChange(
                      files.filter(
                        item =>
                          !(
                            item.questionKey === file.questionKey &&
                            item.fileObjectId === file.fileObjectId
                          ),
                      ),
                    )
                  }
                >
                  삭제
                </PFButton>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <PFText as="span" typo="bd-md-md" color="neutral-cool-500">
          {disabled ? '첨부된 파일 없음' : '선택된 파일 없음'}
        </PFText>
      )}
      {uploadError ? (
        <PFText as="p" typo="bd-sm-rg" color="error">
          {uploadError}
        </PFText>
      ) : null}
    </div>
  )
}
