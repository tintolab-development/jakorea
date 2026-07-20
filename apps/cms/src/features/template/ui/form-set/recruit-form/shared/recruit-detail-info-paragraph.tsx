import { useCallback, useEffect, useState } from 'react'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import { ProgramThumbnailPlaceholder } from '@/features/program/shared/ui/program-thumbnail-placeholder'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-editor/form-editor.css'

const THUMB_UPLOAD_CLASS = 'detail-info-form-inputs-wrapper-no-gap'

type RecruitDetailInfoTextField = {
  label: string
  placeholder: string
}

export type RecruitDetailInfoParagraphProps = {
  wysiwygResetKey: string
  textFields: RecruitDetailInfoTextField[]
}

export function RecruitDetailInfoParagraph({
  wysiwygResetKey,
  textFields,
}: RecruitDetailInfoParagraphProps) {
  const [thumbObjectUrl, setThumbObjectUrl] = useState<string | null>(null)
  const [thumbFileName, setThumbFileName] = useState<string | null>(null)
  const [attachmentFileNames, setAttachmentFileNames] = useState<string[]>([])

  const revokeThumb = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  const handleThumbnailFiles = useCallback((files: File[]) => {
    const image = files.find(f => /^image\//u.test(f.type)) ?? files[0]
    if (!image) return
    setThumbFileName(image.name)
    setThumbObjectUrl(URL.createObjectURL(image))
  }, [])

  const handleRemoveThumbnail = useCallback(() => {
    setThumbFileName(null)
    setThumbObjectUrl(null)
  }, [])

  useEffect(
    () => () => {
      revokeThumb(thumbObjectUrl)
    },
    [revokeThumb, thumbObjectUrl]
  )

  const { editor, editorMinHeight } = useNoticeWysiwygEditor(true, '', wysiwygResetKey, {
    placeholder: '내용을 작성하세요',
  })

  return (
    <DetailInfoForm title="상세 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="썸네일 이미지"
          fullRow
          edit={
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
                fileNames={thumbFileName ? [thumbFileName] : []}
                onFilesChange={handleThumbnailFiles}
                onRemoveFile={handleRemoveThumbnail}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      {textFields.map(field => (
        <DetailInfoForm.Row key={field.label} type="single">
          <DetailInfoForm.Field
            label={field.label}
            fullRow
            edit={
              <CmsTextArea
                inputSize="medium"
                width="100%"
                placeholder={field.placeholder}
                rows={1}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      ))}

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="추가 내용"
          fullRow
          edit={
            <div className="notice-register-modal__section notice-register-modal__section--editor">
              <div className="notice-register-modal__editor-host">
                <RichTextEditor editor={editor} minHeight={editorMinHeight} />
              </div>
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="첨부 파일"
          fullRow
          edit={
            <ParagraphFileUpload
              accept=".jpg,.jpeg,.png"
              multiple
              fileNames={attachmentFileNames}
              onFilesChange={files =>
                setAttachmentFileNames(prev => [...prev, ...files.map(file => file.name)])
              }
              onRemoveFile={index =>
                setAttachmentFileNames(prev => prev.filter((_, i) => i !== index))
              }
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
