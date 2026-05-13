import { useCallback, useEffect, useState } from 'react'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { ParagraphFileUpload } from '@/features/template/ui/paragraph/shared/paragraph-file-upload'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import '@toast-ui/editor/dist/toastui-editor.css'
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

function ThumbnailPlaceholderSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="86"
      height="86"
      viewBox="0 0 86 86"
      fill="none"
      aria-hidden
    >
      <g clipPath="url(#recruitDetailThumbClip)">
        <rect width="86" height="86" rx="8" fill="white" />
        <mask
          id="recruitDetailThumbMask"
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="86"
          height="86"
        >
          <rect width="86" height="86" fill="#D9D9D9" />
        </mask>
        <g mask="url(#recruitDetailThumbMask)">
          <path
            d="M62.2606 61.1848H23.8293C23.3217 61.1848 22.941 60.9459 22.6872 60.4681C22.4333 59.9903 22.4856 59.5125 22.8439 59.0348L30.5481 49.0014C30.8467 48.6431 31.205 48.4639 31.6231 48.4639C32.0412 48.4639 32.3995 48.6431 32.6981 49.0014L39.9543 58.9452L50.7043 45.0598C51.003 44.7014 51.3613 44.5223 51.7793 44.5223C52.1974 44.5223 52.5557 44.7014 52.8543 45.0598L63.3356 59.0348C63.6342 59.5125 63.6566 59.9903 63.4028 60.4681C63.149 60.9459 62.7682 61.1848 62.2606 61.1848Z"
            fill="#E0E0E0"
          />
          <path
            d="M34.9377 30.4469C34.9377 31.6939 34.5047 32.754 33.6387 33.6271C32.7728 34.5003 31.7163 34.9368 30.4693 34.9368C29.2223 34.9368 28.1622 34.5039 27.2891 33.6379C26.4159 32.7719 25.9793 31.7154 25.9793 30.4684C25.9793 29.2214 26.4123 28.1614 27.2783 27.2882C28.1443 26.4151 29.2008 25.9785 30.4478 25.9785C31.6948 25.9785 32.7548 26.4115 33.628 27.2775C34.5011 28.1434 34.9377 29.1999 34.9377 30.4469Z"
            fill="#E0E0E0"
          />
        </g>
      </g>
      <rect x="0.5" y="0.5" width="85" height="85" rx="7.5" stroke="#E0E0E0" />
      <defs>
        <clipPath id="recruitDetailThumbClip">
          <rect width="86" height="86" rx="8" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
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

  const { editorHostRef } = useNoticeWysiwygEditor(true, '', wysiwygResetKey, {
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
                <ThumbnailPlaceholderSvg />
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
              <div className="notice-register-modal__editor-host" ref={editorHostRef} />
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
