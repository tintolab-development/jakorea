import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import {
  GEMINI_RECRUITMENT_DETAIL_RICH_TEXT_FIELDS,
  GEMINI_RECRUITMENT_PROGRAM_DESCRIPTION_FIELD,
  type GeminiRecruitmentRichTextGetter,
  type GeminiRecruitmentRichTextKey,
} from '../../lib/recruitment/add-form-options'
import type { GeminiRecruitmentFormFieldValues } from '../../lib/recruitment/format-recruitment-fields'
import { formatOptionalText } from '../../lib/recruitment/format-recruitment-fields'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import {
  parseFileObjectId,
  programInlineImageOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import {
  programDetailAttachmentOwner,
  programThumbnailOwner,
} from '@/features/program/shared/api/program-attachments'
import {
  fetchProgramThumbnail,
  forgetProgramThumbnailPreviewBlob,
  loadProgramThumbnailPreviewUrl,
  rememberProgramThumbnailPreviewBlob,
} from '@/features/program/shared/api/program-thumbnail'
import { ThumbnailUploadField } from '@/shared/ui/thumbnail-upload-field'
import {
  RECRUIT_DETAIL_FILE_MAX_BYTES,
  RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE,
  RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-attachment'
import { useCmsAlert } from '@/shared/ui'
import { shouldUseGeminiVisitingTrainingRemoteApi } from '../../api/visiting-training/capabilities'
import { GeminiDeferredCmsInput } from './gemini-recruitment-deferred-text-input'
import {
  appendGeminiAttachmentUploads,
  removeGeminiAttachmentAt,
} from '../../lib/recruitment/attachment-file-objects'
import { RichTextViewer } from '@/shared/rich-text'
import { GeminiRecruitmentRichTextEditor } from './gemini-recruitment-rich-text-editor'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-editor/form-editor.css'
import './gemini-recruitment-detail-fields.css'

const THUMBNAIL_GUIDE_LINES = RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

const ATTACHMENT_GUIDE_LINES = [
  '- 파일은 최대 20MB까지 JPG, PNG, PDF, HWP 형식만 등록 가능합니다.',
  '- 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const HTML_TAG_RE = /<\/?[a-z][^>]*>/i

function isEmptyRichText(value: string): boolean {
  const withoutTags = value.replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/gi, ' ').trim()
  return withoutTags.length === 0
}

function GeminiRecruitmentRichTextView({ content }: { content: string }) {
  if (isEmptyRichText(content)) return '-'
  if (!HTML_TAG_RE.test(content)) {
    return <div className="gemini-recruitment-info-tab__multiline-text">{content}</div>
  }
  return (
    <div className="gemini-recruitment-info-tab__additional-content gemini-recruitment-detail-fields__rich-text-view">
      <RichTextViewer
        content={content}
        contentFormat="html"
        maxHeight="none"
        className="gemini-recruitment-detail-fields__rich-text-view"
      />
    </div>
  )
}

export type GeminiRecruitmentDetailFieldsProps = {
  mode: 'view' | 'edit'
  values: GeminiRecruitmentFormFieldValues
  onChange?: (patch: Partial<GeminiRecruitmentFormFieldValues>) => void
  /** 수정 중에만 에디터를 만들고, 프로그램이 바뀌면 다시 마운트 */
  richTextResetKey?: string
  registerRichTextGetter?: (
    key: GeminiRecruitmentRichTextKey,
    getter: GeminiRecruitmentRichTextGetter | null
  ) => void
  /** 에디터 첫 입력 — 등록 폼 dirty 판정용. 키마다 호출해도 부모는 한 번만 갱신한다. */
  onRichTextEdit?: () => void
  readOnlyUpload?: boolean
  /** true면 한 줄 입력 타이핑은 blur 때 draft commit */
  deferTextCommit?: boolean
  /** 수정 화면의 프로그램 id. 등록은 생략하고 ownerId null */
  programId?: string | number | null
}

export function GeminiRecruitmentDetailFields({
  mode,
  values,
  onChange,
  richTextResetKey = 'gemini-recruitment-detail',
  registerRichTextGetter,
  onRichTextEdit,
  readOnlyUpload = false,
  deferTextCommit = false,
  programId,
}: GeminiRecruitmentDetailFieldsProps) {
  const isEdit = mode === 'edit' && onChange != null
  const inlineImageOwner = useMemo(
    () => programInlineImageOwner(parseFileObjectId(programId)),
    [programId]
  )
  const { showAlert } = useCmsAlert()
  const programNumericId = useMemo(() => parseFileObjectId(programId), [programId])
  const [thumbObjectUrl, setThumbObjectUrl] = useState<string | null>(null)
  const [storedThumbUrl, setStoredThumbUrl] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  // 첨부 업로드 완료 시점의 최신 values — 업로드 중 다른 첨부 변경을 덮지 않는다.
  const latestValuesRef = useRef(values)
  latestValuesRef.current = values

  // 저장된 썸네일 — 저장 후 파일명이 바뀌면 다시 불러온다.
  const thumbnailFileName =
    values.thumbnailFileName?.trim() &&
    values.thumbnailFileName.trim().toLowerCase() !== 'null' &&
    values.thumbnailFileName.trim().toLowerCase() !== 'undefined'
      ? values.thumbnailFileName.trim()
      : null
  const savedThumbnailName = thumbnailFileName
  useEffect(() => {
    if (programNumericId == null || !shouldUseGeminiVisitingTrainingRemoteApi()) return
    let cancelled = false
    let loadedUrl: string | null = null
    void (async () => {
      try {
        const thumb = await fetchProgramThumbnail(programNumericId)
        if (cancelled || thumb.fileObjectId == null) return
        loadedUrl = await loadProgramThumbnailPreviewUrl(thumb.fileObjectId)
        if (cancelled) {
          revokeBlobUrl(loadedUrl)
          return
        }
        setStoredThumbUrl(loadedUrl)
      } catch {
        /* placeholder 유지 */
      }
    })()
    return () => {
      cancelled = true
      revokeBlobUrl(loadedUrl)
      setStoredThumbUrl(null)
    }
  }, [programNumericId, savedThumbnailName])

  const handleThumbnailFile = useCallback(
    async (file: File) => {
      if (!onChange) return
      const previousName = values.thumbnailFileName
      const previousFileObjectId = values.thumbnailFileObjectId
      setThumbObjectUrl(prev => {
        revokeBlobUrl(prev)
        return URL.createObjectURL(file)
      })
      onChange({ thumbnailFileName: file.name })
      setUploadingThumbnail(true)
      try {
        const uploaded = await uploadAdminFileMaybeMock({
          file,
          owner: programThumbnailOwner(programNumericId),
        })
        rememberProgramThumbnailPreviewBlob(uploaded.fileObjectId, file)
        onChange({ thumbnailFileName: file.name, thumbnailFileObjectId: uploaded.fileObjectId })
      } catch {
        setThumbObjectUrl(prev => {
          revokeBlobUrl(prev)
          return null
        })
        onChange({ thumbnailFileName: previousName, thumbnailFileObjectId: previousFileObjectId })
        showAlert({
          title: '안내',
          content: '썸네일을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setUploadingThumbnail(false)
      }
    },
    [onChange, programNumericId, showAlert, values.thumbnailFileName, values.thumbnailFileObjectId]
  )

  const handleRemoveThumbnail = useCallback(() => {
    forgetProgramThumbnailPreviewBlob(values.thumbnailFileObjectId)
    onChange?.({ thumbnailFileName: null, thumbnailFileObjectId: null })
    setThumbObjectUrl(prev => {
      revokeBlobUrl(prev)
      return null
    })
  }, [onChange, values.thumbnailFileObjectId])

  useEffect(
    () => () => {
      revokeBlobUrl(thumbObjectUrl)
    },
    [thumbObjectUrl]
  )

  const thumbnailPreviewUrl = thumbObjectUrl ?? storedThumbUrl

  const programDescription = GEMINI_RECRUITMENT_PROGRAM_DESCRIPTION_FIELD

  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="썸네일 이미지"
          fullRow
          view={
            <ThumbnailUploadField
              previewUrl={thumbnailPreviewUrl}
              fileName={thumbnailFileName}
              guideLines={THUMBNAIL_GUIDE_LINES}
              disabled
            />
          }
          edit={
            isEdit ? (
              <ThumbnailUploadField
                previewUrl={thumbnailPreviewUrl}
                fileName={thumbnailFileName}
                guideLines={THUMBNAIL_GUIDE_LINES}
                maxBytes={RECRUIT_DETAIL_FILE_MAX_BYTES}
                sizeExceededMessage={RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE}
                disabled={readOnlyUpload}
                uploading={uploadingThumbnail}
                onSelectFile={file => void handleThumbnailFile(file)}
                onRemove={handleRemoveThumbnail}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label={programDescription.label}
          fullRow
          view={formatOptionalText(values.programDescription)}
          edit={
            isEdit ? (
              deferTextCommit ? (
                <GeminiDeferredCmsInput
                  inputSize="small"
                  width="100%"
                  placeholder={programDescription.placeholder}
                  value={values.programDescription}
                  onCommit={next => onChange({ programDescription: next })}
                />
              ) : (
                <CmsInput
                  inputSize="small"
                  width="100%"
                  placeholder={programDescription.placeholder}
                  value={values.programDescription}
                  onChange={e => onChange({ programDescription: e.target.value })}
                />
              )
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      {GEMINI_RECRUITMENT_DETAIL_RICH_TEXT_FIELDS.map(field => (
        <DetailInfoForm.Row key={field.key} type="single">
          <DetailInfoForm.Field
            label={field.label}
            fullRow
            view={<GeminiRecruitmentRichTextView content={values[field.key]} />}
            edit={
              isEdit && registerRichTextGetter ? (
                <GeminiRecruitmentRichTextEditor
                  fieldKey={field.key}
                  resetKey={`${richTextResetKey}-${field.key}`}
                  initialContent={values[field.key]}
                  placeholder={field.placeholder}
                  registerGetHtml={registerRichTextGetter}
                  onEdit={onRichTextEdit}
                  fileUploadOwner={inlineImageOwner}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
      ))}

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="첨부 파일"
          fullRow
          view={
            <ParagraphFileUpload
              accept=".jpg,.jpeg,.png,.pdf,.hwp,.hwpx"
              multiple
              disabled
              fileNames={values.attachmentFileNames}
              guideLines={ATTACHMENT_GUIDE_LINES}
            />
          }
          edit={
            isEdit ? (
              <ParagraphFileUpload
                accept=".jpg,.jpeg,.png,.pdf,.hwp,.hwpx"
                multiple
                disabled={readOnlyUpload || uploadingAttachments}
                guideLines={ATTACHMENT_GUIDE_LINES}
                maxTotalBytes={0}
                maxFileBytes={RECRUIT_DETAIL_FILE_MAX_BYTES}
                sizeExceededMessage={RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE}
                fileNames={values.attachmentFileNames}
                onFilesChange={files => {
                  // 업로드 확정 fileObjectId를 파일명과 함께 보관 — 저장 시 PUT /programs/{id}/attachments.
                  const owner = programDetailAttachmentOwner(programNumericId)
                  setUploadingAttachments(true)
                  void (async () => {
                    const uploads: Array<{ fileName: string; fileObjectId: number }> = []
                    let failed = false
                    for (const file of files) {
                      try {
                        const uploaded = await uploadAdminFileMaybeMock({ file, owner })
                        uploads.push({ fileName: file.name, fileObjectId: uploaded.fileObjectId })
                      } catch {
                        failed = true
                      }
                    }
                    setUploadingAttachments(false)
                    if (uploads.length > 0) {
                      onChange(appendGeminiAttachmentUploads(latestValuesRef.current, uploads))
                    }
                    if (failed) {
                      showAlert({
                        title: '안내',
                        content: '첨부 파일을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.',
                      })
                    }
                  })()
                }}
                onRemoveFile={index => onChange(removeGeminiAttachmentAt(values, index))}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
    </>
  )
}
