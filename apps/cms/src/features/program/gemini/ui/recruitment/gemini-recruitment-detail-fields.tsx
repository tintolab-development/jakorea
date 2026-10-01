import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProgramThumbnailPlaceholder } from '@/features/program/shared/ui/program-thumbnail-placeholder'
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
import { GeminiDeferredCmsInput } from './gemini-recruitment-deferred-text-input'
import { RichTextViewer } from '@/shared/rich-text'
import { GeminiRecruitmentRichTextEditor } from './gemini-recruitment-rich-text-editor'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-editor/form-editor.css'
import './gemini-recruitment-detail-fields.css'

const THUMB_UPLOAD_CLASS = 'detail-info-form-inputs-wrapper-no-gap'

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
  const [thumbObjectUrl, setThumbObjectUrl] = useState<string | null>(null)

  const revokeThumb = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  const handleThumbnailFiles = useCallback(
    (files: File[]) => {
      if (!onChange) return
      const image = files.find(f => /^image\//u.test(f.type)) ?? files[0]
      if (!image) return
      onChange({ thumbnailFileName: image.name })
      setThumbObjectUrl(prev => {
        revokeThumb(prev)
        return URL.createObjectURL(image)
      })
    },
    [onChange, revokeThumb]
  )

  const handleRemoveThumbnail = useCallback(() => {
    onChange?.({ thumbnailFileName: null })
    setThumbObjectUrl(prev => {
      revokeThumb(prev)
      return null
    })
  }, [onChange, revokeThumb])

  useEffect(
    () => () => {
      revokeThumb(thumbObjectUrl)
    },
    [revokeThumb, thumbObjectUrl]
  )

  const programDescription = GEMINI_RECRUITMENT_PROGRAM_DESCRIPTION_FIELD

  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="썸네일 이미지"
          fullRow
          view={
            <div className={THUMB_UPLOAD_CLASS}>
              <ProgramThumbnailPlaceholder />
              <ParagraphFileUpload
                accept=".jpg,.jpeg,.png"
                multiple={false}
                disabled
                style={{ marginLeft: 16 }}
                fileNames={values.thumbnailFileName ? [values.thumbnailFileName] : []}
              />
            </div>
          }
          edit={
            isEdit ? (
              <div className={THUMB_UPLOAD_CLASS}>
                {thumbObjectUrl ? (
                  <img src={thumbObjectUrl} alt="" width={86} height={86} />
                ) : (
                  <ProgramThumbnailPlaceholder />
                )}
                <ParagraphFileUpload
                  accept=".jpg,.jpeg,.png"
                  multiple={false}
                  style={{ marginLeft: 16 }}
                  disabled={readOnlyUpload}
                  fileNames={values.thumbnailFileName ? [values.thumbnailFileName] : []}
                  onFilesChange={handleThumbnailFiles}
                  onRemoveFile={handleRemoveThumbnail}
                />
              </div>
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
                  inputSize="medium"
                  width="100%"
                  placeholder={programDescription.placeholder}
                  value={values.programDescription}
                  onCommit={next => onChange({ programDescription: next })}
                />
              ) : (
                <CmsInput
                  inputSize="medium"
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
