import { useCallback, useEffect, useState } from 'react'
import type { Editor } from '@/shared/rich-text'
import { ProgramThumbnailPlaceholder } from '@/features/program/shared/ui/program-thumbnail-placeholder'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { GEMINI_RECRUITMENT_DETAIL_TEXT_FIELDS } from '../../lib/recruitment/add-form-options'
import type { GeminiRecruitmentFormFieldValues } from '../../lib/recruitment/format-recruitment-fields'
import { formatOptionalText } from '../../lib/recruitment/format-recruitment-fields'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { RichTextEditor } from '@/shared/rich-text'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-editor/form-editor.css'

const THUMB_UPLOAD_CLASS = 'detail-info-form-inputs-wrapper-no-gap'

const ATTACHMENT_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG, PDF, HWP 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

export type GeminiRecruitmentDetailFieldsProps = {
  mode: 'view' | 'edit'
  values: GeminiRecruitmentFormFieldValues
  onChange?: (patch: Partial<GeminiRecruitmentFormFieldValues>) => void
  editor?: Editor | null
  editorMinHeight?: string | number
  readOnlyUpload?: boolean
}

export function GeminiRecruitmentDetailFields({
  mode,
  values,
  onChange,
  editor = null,
  editorMinHeight,
  readOnlyUpload = false,
}: GeminiRecruitmentDetailFieldsProps) {
  const isEdit = mode === 'edit' && onChange != null
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

  const textFieldValues = {
    programDescription: values.programDescription,
    recruitmentGuide: values.recruitmentGuide,
    applicationMethod: values.applicationMethod,
    learningSupportContent: values.learningSupportContent,
  } as const

  const additionalContentView = values.additionalContentMarkdown.trim() ? (
    <div
      className="gemini-recruitment-info-tab__additional-content"
      dangerouslySetInnerHTML={{ __html: values.additionalContentMarkdown }}
    />
  ) : (
    '-'
  )

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

      {GEMINI_RECRUITMENT_DETAIL_TEXT_FIELDS.map(field => (
        <DetailInfoForm.Row key={field.key} type="single">
          <DetailInfoForm.Field
            label={field.label}
            fullRow
            view={
              field.key === 'recruitmentGuide' ? (
                <div className="gemini-recruitment-info-tab__multiline-text">
                  {formatOptionalText(textFieldValues[field.key])}
                </div>
              ) : (
                formatOptionalText(textFieldValues[field.key])
              )
            }
            edit={
              isEdit ? (
                <CmsTextArea
                  inputSize="medium"
                  width="100%"
                  placeholder={field.placeholder}
                  rows={field.key === 'recruitmentGuide' ? 6 : 3}
                  value={textFieldValues[field.key]}
                  onChange={e => onChange({ [field.key]: e.target.value })}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
      ))}

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="추가 내용"
          fullRow
          view={additionalContentView}
          edit={
            isEdit ? (
              <div className="notice-register-modal__section notice-register-modal__section--editor gemini-recruitment-info-tab__editor">
                <div className="notice-register-modal__editor-host">
                  <RichTextEditor editor={editor} minHeight={editorMinHeight} />
                </div>
              </div>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

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
                onFilesChange={files =>
                  onChange({
                    attachmentFileNames: [
                      ...values.attachmentFileNames,
                      ...files.map(file => file.name),
                    ],
                  })
                }
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
