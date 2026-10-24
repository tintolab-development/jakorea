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
}: UjatEducationDocumentFormBodyProps) {
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
    </div>
  )
}

function DocumentFileField({
  questionKey,
  files,
  onFilesChange,
  disabled,
}: {
  questionKey: string
  files: readonly UjatDocumentAttachedFile[]
  onFilesChange: (next: UjatDocumentAttachedFile[]) => void
  disabled: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const ownFiles = files.filter(file => file.questionKey === questionKey)

  const handleSelect = (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file || disabled) return
    setUploadError(null)
    setUploading(true)
    void uploadMemberPortalFile({ file, filePurpose: 'ASSIGNMENT_ATTACHMENT' })
      .then(fileObjectId => {
        onFilesChange([...files, { questionKey, fileObjectId, fileName: file.name }])
      })
      .catch((error: unknown) => {
        setUploadError(
          error instanceof MemberFileRejectedError
            ? '보안 정책상 등록할 수 없는 파일입니다. 다른 파일로 다시 시도해 주세요.'
            : error instanceof MemberFileTooLargeError
              ? '파일이 너무 큽니다. 다른 파일로 다시 시도해 주세요.'
              : error instanceof MemberFileEmptyError || isMemberFileSizeUploadError(error)
                ? '빈 파일은 업로드할 수 없습니다. 파일을 다시 선택해 주세요.'
                : '파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        )
      })
      .finally(() => setUploading(false))
  }

  return (
    <div className={styles.fileField}>
      <input
        className={styles.fileInput}
        type="file"
        disabled={disabled || uploading}
        onChange={event => {
          handleSelect(event.target.files)
          event.target.value = ''
        }}
      />
      <PFButton
        type="button"
        variant="secondary"
        size="medium"
        disabled={disabled || uploading}
        onClick={event => {
          const input = event.currentTarget.parentElement?.querySelector('input[type="file"]')
          if (input instanceof HTMLInputElement) input.click()
        }}
      >
        {uploading ? '업로드 중' : '파일 선택'}
      </PFButton>
      {ownFiles.length > 0 ? (
        <ul className={styles.fileList}>
          {ownFiles.map(file => (
            <li key={`${file.questionKey}-${file.fileObjectId}`}>
              <PFText as="span" typo="bd-md-md" color="neutral-cool-600">
                {file.fileName}
              </PFText>
              {disabled ? null : (
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
          선택된 파일 없음
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
