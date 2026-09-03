import { useCallback, useEffect } from 'react'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import { ProgramThumbnailPlaceholder } from '@/features/program/shared/ui/program-thumbnail-placeholder'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import {
  useGeneralRecruitOverlayKv,
  updateGeneralRecruitOverlayKey,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resolveRecruitDetailTextFieldOverlayKey } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-text-field-keys'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-editor/form-editor.css'

const THUMB_UPLOAD_CLASS = 'detail-info-form-inputs-wrapper-no-gap'
const DEFAULT_OVERLAY_KEY_PREFIX = 'recruit.detailInfo'

type RecruitDetailInfoTextField = {
  label: string
  placeholder: string
}

export type RecruitDetailInfoParagraphProps = {
  wysiwygResetKey: string
  textFields: RecruitDetailInfoTextField[]
  /** overlay 키 prefix (default: `recruit.detailInfo`) */
  overlayKeyPrefix?: string
  /** `추가 내용` 에디터 뒤에 둘 필드 (예: 강사 모집 폼 기타사항) */
  afterEditorFields?: RecruitDetailInfoTextField[]
  attachmentAccept?: string
  attachmentGuideLines?: string[]
}

function RecruitDetailInfoTextFieldRow({
  field,
  overlayKeyPrefix,
}: {
  field: RecruitDetailInfoTextField
  overlayKeyPrefix: string
}) {
  const overlayKey = resolveRecruitDetailTextFieldOverlayKey(overlayKeyPrefix, field.label)
  const [value, setValue] = useGeneralRecruitOverlayKv<string>(overlayKey, '')

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={field.label}
        fullRow
        edit={
          <CmsTextArea
            inputSize="medium"
            width="100%"
            placeholder={field.placeholder}
            rows={1}
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function RecruitDetailInfoTextFieldRows({
  fields,
  overlayKeyPrefix,
}: {
  fields: RecruitDetailInfoTextField[]
  overlayKeyPrefix: string
}) {
  return (
    <>
      {fields.map(field => (
        <RecruitDetailInfoTextFieldRow
          key={field.label}
          field={field}
          overlayKeyPrefix={overlayKeyPrefix}
        />
      ))}
    </>
  )
}

export function RecruitDetailInfoParagraph({
  wysiwygResetKey,
  textFields,
  overlayKeyPrefix = DEFAULT_OVERLAY_KEY_PREFIX,
  afterEditorFields,
  attachmentAccept = '.jpg,.jpeg,.png',
  attachmentGuideLines,
}: RecruitDetailInfoParagraphProps) {
  const thumbObjectUrlKey = `${overlayKeyPrefix}.thumbObjectUrl`
  const thumbFileNameKey = `${overlayKeyPrefix}.thumbFileName`
  const attachmentFileNamesKey = `${overlayKeyPrefix}.attachmentFileNames`

  const [thumbObjectUrl, setThumbObjectUrl] = useGeneralRecruitOverlayKv<string | null>(
    thumbObjectUrlKey,
    null
  )
  const [thumbFileName, setThumbFileName] = useGeneralRecruitOverlayKv<string | null>(
    thumbFileNameKey,
    null
  )
  const [attachmentFileNames] = useGeneralRecruitOverlayKv<string[]>(attachmentFileNamesKey, [])

  const revokeThumb = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  const handleThumbnailFiles = useCallback(
    (files: File[]) => {
      const image = files.find(f => /^image\//u.test(f.type)) ?? files[0]
      if (!image) return
      setThumbFileName(image.name)
      setThumbObjectUrl(URL.createObjectURL(image))
    },
    [setThumbFileName, setThumbObjectUrl]
  )

  const handleRemoveThumbnail = useCallback(() => {
    setThumbFileName(null)
    setThumbObjectUrl(null)
  }, [setThumbFileName, setThumbObjectUrl])

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

      <RecruitDetailInfoTextFieldRows fields={textFields} overlayKeyPrefix={overlayKeyPrefix} />

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

      {afterEditorFields != null && afterEditorFields.length > 0 ? (
        <RecruitDetailInfoTextFieldRows
          fields={afterEditorFields}
          overlayKeyPrefix={overlayKeyPrefix}
        />
      ) : null}

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="첨부 파일"
          fullRow
          edit={
            <ParagraphFileUpload
              accept={attachmentAccept}
              guideLines={attachmentGuideLines}
              multiple
              fileNames={attachmentFileNames}
              onFilesChange={(files: File[]) =>
                updateGeneralRecruitOverlayKey<string[]>(attachmentFileNamesKey, prev => [
                  ...(prev ?? []),
                  ...files.map(file => file.name),
                ])
              }
              onRemoveFile={(index: number) =>
                updateGeneralRecruitOverlayKey<string[]>(attachmentFileNamesKey, prev =>
                  (prev ?? []).filter((_, i) => i !== index)
                )
              }
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
