import { useCallback, useEffect, useRef } from 'react'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import { ProgramThumbnailPlaceholder } from '@/features/program/shared/ui/program-thumbnail-placeholder'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  useGeneralRecruitOverlayKv,
  updateGeneralRecruitOverlayKey,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
  RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES,
  RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-attachment'
import {
  recruitDetailAdditionalContentOverlayKey,
  registerRecruitDetailAdditionalContentHtml,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { resolveRecruitDetailTextFieldOverlayKey } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-text-field-keys'
import {
  ADMIN_FILE_PURPOSE,
  programFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-editor/form-editor.css'
import './recruit-detail-info-paragraph.css'

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
  /** 텍스트 필드 컨트롤 — UJAT 참여 기관 모집 등은 `input` */
  textFieldControl?: 'textarea' | 'input'
}

function RecruitDetailInfoTextFieldRow({
  field,
  overlayKeyPrefix,
  textFieldControl = 'textarea',
}: {
  field: RecruitDetailInfoTextField
  overlayKeyPrefix: string
  textFieldControl?: 'textarea' | 'input'
}) {
  const overlayKey = resolveRecruitDetailTextFieldOverlayKey(overlayKeyPrefix, field.label)
  const [value, setValue] = useGeneralRecruitOverlayKv<string>(overlayKey, '')

  const control =
    textFieldControl === 'input' ? (
      <CmsInput
        inputSize="medium"
        width="100%"
        placeholder={field.placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    ) : (
      <CmsTextArea
        inputSize="medium"
        width="100%"
        placeholder={field.placeholder}
        rows={1}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    )

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field label={field.label} fullRow edit={control} view="-" />
    </DetailInfoForm.Row>
  )
}

function RecruitDetailInfoTextFieldRows({
  fields,
  overlayKeyPrefix,
  textFieldControl = 'textarea',
}: {
  fields: RecruitDetailInfoTextField[]
  overlayKeyPrefix: string
  textFieldControl?: 'textarea' | 'input'
}) {
  return (
    <>
      {fields.map(field => (
        <RecruitDetailInfoTextFieldRow
          key={field.label}
          field={field}
          overlayKeyPrefix={overlayKeyPrefix}
          textFieldControl={textFieldControl}
        />
      ))}
    </>
  )
}

function readOverlayAdditionalContentHtml(overlayKey: string): string {
  const raw = getGeneralRecruitOverlayRecord()[overlayKey]
  return typeof raw === 'string' ? raw : ''
}

export function RecruitDetailInfoParagraph({
  wysiwygResetKey,
  textFields,
  overlayKeyPrefix = DEFAULT_OVERLAY_KEY_PREFIX,
  afterEditorFields,
  attachmentAccept = RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
  attachmentGuideLines = RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES,
  textFieldControl = 'textarea',
}: RecruitDetailInfoParagraphProps) {
  const thumbObjectUrlKey = `${overlayKeyPrefix}.thumbObjectUrl`
  const thumbFileNameKey = `${overlayKeyPrefix}.thumbFileName`
  const attachmentFileNamesKey = `${overlayKeyPrefix}.attachmentFileNames`
  const additionalContentKey = recruitDetailAdditionalContentOverlayKey(overlayKeyPrefix)

  // 마운트 시 overlay 스냅샷만 초기값 — flush로 overlay가 바뀌어도 에디터 remount 금지
  const initialAdditionalHtmlRef = useRef(readOverlayAdditionalContentHtml(additionalContentKey))

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
      void uploadAdminFileMaybeMock({
        file: image,
        owner: programFileOwner(1, ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL),
      }).catch(() => undefined)
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

  const { editor, editorMinHeight, getHTML } = useNoticeWysiwygEditor(
    true,
    initialAdditionalHtmlRef.current,
    wysiwygResetKey,
    {
      placeholder: '내용을 작성하세요',
      contentFormat: 'html',
    }
  )

  const getHtmlRef = useRef(getHTML)
  getHtmlRef.current = getHTML

  useEffect(() => {
    registerRecruitDetailAdditionalContentHtml(additionalContentKey, () => getHtmlRef.current())
    return () => {
      // 탭 전환 시에도 TipTap 본문을 overlay에 남겨 임시저장·등록에 포함
      const html = getHtmlRef.current()
      if (typeof html === 'string') {
        patchGeneralRecruitOverlay({ [additionalContentKey]: html })
      }
      registerRecruitDetailAdditionalContentHtml(additionalContentKey, null)
    }
  }, [additionalContentKey])

  return (
    <div className="recruit-detail-info-paragraph__forms">
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
                  guideLines={RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES}
                  fileNames={thumbFileName ? [thumbFileName] : []}
                  onFilesChange={handleThumbnailFiles}
                  onRemoveFile={handleRemoveThumbnail}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <RecruitDetailInfoTextFieldRows
          fields={textFields}
          overlayKeyPrefix={overlayKeyPrefix}
          textFieldControl={textFieldControl}
        />

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
            textFieldControl={textFieldControl}
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
                onFilesChange={(files: File[]) => {
                  updateGeneralRecruitOverlayKey<string[]>(attachmentFileNamesKey, prev => [
                    ...(prev ?? []),
                    ...files.map(file => file.name),
                  ])
                  const owner = programFileOwner(1, ADMIN_FILE_PURPOSE.PROGRAM_DETAIL_ATTACHMENT)
                  void (async () => {
                    for (const file of files) {
                      await uploadAdminFileMaybeMock({ file, owner }).catch(() => undefined)
                    }
                  })()
                }}
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
    </div>
  )
}
