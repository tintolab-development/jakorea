import { useCallback, useEffect, useMemo, useState } from 'react'
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
  ADMIN_FILE_PURPOSE,
  parseFileObjectId,
  programFileOwner,
  programInlineImageOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import { programThumbnailOwner } from '@/features/program/shared/api/program-attachments'
import {
  fetchProgramThumbnail,
  loadProgramThumbnailPreviewUrl,
} from '@/features/program/shared/api/program-thumbnail'
import { FILE_SELECT_TOTAL_SIZE_GUIDE_LINE } from '@/shared/ui/file-select-field-limits'
import { ThumbnailUploadField } from '@/shared/ui/thumbnail-upload-field'
import { useCmsAlert } from '@/shared/ui'
import { shouldUseGeminiVisitingTrainingRemoteApi } from '../../api/visiting-training/capabilities'
import { GeminiDeferredCmsInput } from './gemini-recruitment-deferred-text-input'
import { RichTextViewer } from '@/shared/rich-text'
import { GeminiRecruitmentRichTextEditor } from './gemini-recruitment-rich-text-editor'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-editor/form-editor.css'
import './gemini-recruitment-detail-fields.css'

/** 등록 중(programId 없음) 썸네일 임시 업로드 owner — 등록 직후 PUT /programs/{id}/thumbnail 로 연결 */
const GEMINI_THUMBNAIL_STAGING_PROGRAM_OWNER_ID = 1

const THUMBNAIL_GUIDE_LINES = [
  FILE_SELECT_TOTAL_SIZE_GUIDE_LINE,
  '- JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

const ATTACHMENT_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG, PDF, HWP 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
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

  // 저장된 썸네일 — 저장 후 파일명이 바뀌면 다시 불러온다.
  const savedThumbnailName = values.thumbnailFileName
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
          owner: programThumbnailOwner(programNumericId ?? GEMINI_THUMBNAIL_STAGING_PROGRAM_OWNER_ID),
        })
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
    onChange?.({ thumbnailFileName: null, thumbnailFileObjectId: null })
    setThumbObjectUrl(prev => {
      revokeBlobUrl(prev)
      return null
    })
  }, [onChange])

  useEffect(
    () => () => {
      revokeBlobUrl(thumbObjectUrl)
    },
    [thumbObjectUrl]
  )

  const thumbnailPreviewUrl =
    thumbObjectUrl ??
    (values.thumbnailFileName && values.thumbnailFileObjectId !== null ? storedThumbUrl : null)

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
              fileName={values.thumbnailFileName}
              guideLines={THUMBNAIL_GUIDE_LINES}
              disabled
            />
          }
          edit={
            isEdit ? (
              <ThumbnailUploadField
                previewUrl={thumbnailPreviewUrl}
                fileName={values.thumbnailFileName}
                guideLines={THUMBNAIL_GUIDE_LINES}
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
                disabled={readOnlyUpload}
                guideLines={ATTACHMENT_GUIDE_LINES}
                fileNames={values.attachmentFileNames}
                onFilesChange={files => {
                  onChange({
                    attachmentFileNames: [
                      ...values.attachmentFileNames,
                      ...files.map(file => file.name),
                    ],
                  })
                  const owner = programFileOwner(1, ADMIN_FILE_PURPOSE.PROGRAM_DETAIL_ATTACHMENT)
                  void (async () => {
                    for (const file of files) {
                      await uploadAdminFileMaybeMock({ file, owner }).catch(() => undefined)
                    }
                  })()
                }}
                onRemoveFile={index =>
                  onChange({
                    attachmentFileNames: values.attachmentFileNames.filter((_, i) => i !== index),
                  })
                }
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
    </>
  )
}
