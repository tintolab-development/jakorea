import { memo, useCallback, useEffect, useRef, useState } from 'react'
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
import {
  RECRUIT_DETAIL_STAGING_PROGRAM_OWNER_ID,
  recruitDetailAttachmentFileNamesKey,
  recruitDetailAttachmentFileObjectIdsKey,
  recruitDetailThumbContentUrlKey,
  recruitDetailThumbFileNameKey,
  recruitDetailThumbFileObjectIdKey,
  recruitDetailThumbObjectUrlKey,
  trackRecruitDetailMediaUpload,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { resolveRecruitDetailTextFieldOverlayKey } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-text-field-keys'
import {
  contentUrlForFileObjectId,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import {
  programDetailAttachmentOwner,
  programThumbnailOwner,
} from '@/features/program/shared/api/program-attachments'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-editor/form-editor.css'
import './recruit-detail-info-paragraph.css'

const THUMB_UPLOAD_CLASS = 'detail-info-form-inputs-wrapper-no-gap'
const DEFAULT_OVERLAY_KEY_PREFIX = 'recruit.detailInfo'
const DETAIL_INFO_WYSIWYG_OPTIONS = {
  placeholder: '내용을 작성하세요',
  contentFormat: 'html' as const,
}

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

const RecruitDetailAdditionalContentEditor = memo(function RecruitDetailAdditionalContentEditor({
  wysiwygResetKey,
  additionalContentKey,
}: {
  wysiwygResetKey: string
  additionalContentKey: string
}) {
  const initialAdditionalHtmlRef = useRef(readOverlayAdditionalContentHtml(additionalContentKey))
  const { editor, editorMinHeight, getHTML } = useNoticeWysiwygEditor(
    true,
    initialAdditionalHtmlRef.current,
    wysiwygResetKey,
    DETAIL_INFO_WYSIWYG_OPTIONS
  )

  const getHtmlRef = useRef(getHTML)
  getHtmlRef.current = getHTML
  const latestHtmlRef = useRef(initialAdditionalHtmlRef.current)

  useEffect(() => {
    if (editor == null) return
    const remember = () => {
      if (editor.isDestroyed || editor.schema == null) return
      try {
        latestHtmlRef.current = editor.getHTML()
      } catch {
        // 탭 전환 시 TipTap이 먼저 destroy되면 getHTML이 schema.cached에서 실패한다.
      }
    }
    remember()
    editor.on('update', remember)
    return () => {
      remember()
      if (!editor.isDestroyed) {
        editor.off('update', remember)
      }
    }
  }, [editor])

  useEffect(() => {
    const readHtml = () => latestHtmlRef.current || getHtmlRef.current()
    registerRecruitDetailAdditionalContentHtml(additionalContentKey, readHtml)
    return () => {
      const html = readHtml()
      if (typeof html === 'string') {
        patchGeneralRecruitOverlay({ [additionalContentKey]: html })
      }
      registerRecruitDetailAdditionalContentHtml(additionalContentKey, null)
    }
  }, [additionalContentKey])

  const [overlayAdditionalHtml] = useGeneralRecruitOverlayKv<string>(additionalContentKey, '')
  useEffect(() => {
    if (editor == null) return
    const incoming = overlayAdditionalHtml.trim()
    if (incoming === '') return
    const current = getHtmlRef.current().replace(/<p><\/p>/gi, '').trim()
    if (current !== '') return
    editor.commands.setContent(incoming, { emitUpdate: false, contentType: 'html' })
  }, [editor, overlayAdditionalHtml])

  return (
    <div className="notice-register-modal__section notice-register-modal__section--editor">
      <div className="notice-register-modal__editor-host">
        <RichTextEditor editor={editor} minHeight={editorMinHeight} />
      </div>
    </div>
  )
})

export function RecruitDetailInfoParagraph({
  wysiwygResetKey,
  textFields,
  overlayKeyPrefix = DEFAULT_OVERLAY_KEY_PREFIX,
  afterEditorFields,
  attachmentAccept = RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
  attachmentGuideLines = RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES,
  textFieldControl = 'textarea',
}: RecruitDetailInfoParagraphProps) {
  const thumbObjectUrlKey = recruitDetailThumbObjectUrlKey(overlayKeyPrefix)
  const thumbFileNameKey = recruitDetailThumbFileNameKey(overlayKeyPrefix)
  const thumbFileObjectIdKey = recruitDetailThumbFileObjectIdKey(overlayKeyPrefix)
  const thumbContentUrlKey = recruitDetailThumbContentUrlKey(overlayKeyPrefix)
  const attachmentFileNamesKey = recruitDetailAttachmentFileNamesKey(overlayKeyPrefix)
  const attachmentFileObjectIdsKey = recruitDetailAttachmentFileObjectIdsKey(overlayKeyPrefix)
  const additionalContentKey = recruitDetailAdditionalContentOverlayKey(overlayKeyPrefix)

  const [thumbObjectUrl, setThumbObjectUrl] = useGeneralRecruitOverlayKv<string | null>(
    thumbObjectUrlKey,
    null
  )
  const [thumbFileName, setThumbFileName] = useGeneralRecruitOverlayKv<string | null>(
    thumbFileNameKey,
    null
  )
  const [attachmentFileNames] = useGeneralRecruitOverlayKv<string[]>(attachmentFileNamesKey, [])
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingAttachments, setUploadingAttachments] = useState(false)

  const revokeThumb = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }, [])

  const handleThumbnailFiles = useCallback(
    (files: File[]) => {
      const image = files.find(f => /^image\//u.test(f.type)) ?? files[0]
      if (!image) return
      const previousPreview = thumbObjectUrl
      const blobUrl = URL.createObjectURL(image)
      setThumbFileName(image.name)
      setThumbObjectUrl(blobUrl)
      setUploadingThumbnail(true)
      trackRecruitDetailMediaUpload(
        (async () => {
          try {
            const uploaded = await uploadAdminFileMaybeMock({
              file: image,
              owner: programThumbnailOwner(RECRUIT_DETAIL_STAGING_PROGRAM_OWNER_ID),
            })
            patchGeneralRecruitOverlay({
              [thumbFileObjectIdKey]: uploaded.fileObjectId,
              [thumbContentUrlKey]: contentUrlForFileObjectId(uploaded.fileObjectId),
            })
            revokeThumb(previousPreview)
          } catch {
            patchGeneralRecruitOverlay({
              [thumbFileObjectIdKey]: null,
              [thumbContentUrlKey]: null,
            })
          } finally {
            setUploadingThumbnail(false)
          }
        })()
      )
    },
    [
      revokeThumb,
      setThumbFileName,
      setThumbObjectUrl,
      thumbContentUrlKey,
      thumbFileObjectIdKey,
      thumbObjectUrl,
    ]
  )

  const handleRemoveThumbnail = useCallback(() => {
    revokeThumb(thumbObjectUrl)
    setThumbFileName(null)
    setThumbObjectUrl(null)
    patchGeneralRecruitOverlay({
      [thumbFileObjectIdKey]: null,
      [thumbContentUrlKey]: null,
    })
  }, [
    revokeThumb,
    setThumbFileName,
    setThumbObjectUrl,
    thumbContentUrlKey,
    thumbFileObjectIdKey,
    thumbObjectUrl,
  ])

  const handleAttachmentFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      const incomingNames = files.map(file => file.name)
      const previousCount = Array.isArray(getGeneralRecruitOverlayRecord()[attachmentFileNamesKey])
        ? (getGeneralRecruitOverlayRecord()[attachmentFileNamesKey] as string[]).length
        : 0
      // 업로드 완료 전에 단계를 바꿔도 파일명이 남도록 먼저 기록한다.
      updateGeneralRecruitOverlayKey<string[]>(attachmentFileNamesKey, prev => [
        ...(prev ?? []),
        ...incomingNames,
      ])
      setUploadingAttachments(true)
      trackRecruitDetailMediaUpload(
        (async () => {
          const owner = programDetailAttachmentOwner(RECRUIT_DETAIL_STAGING_PROGRAM_OWNER_ID)
          const uploadedIds: number[] = []
          const failedIndexes = new Set<number>()
          try {
            for (let index = 0; index < files.length; index += 1) {
              try {
                const uploaded = await uploadAdminFileMaybeMock({ file: files[index], owner })
                uploadedIds.push(uploaded.fileObjectId)
              } catch {
                failedIndexes.add(index)
              }
            }
            if (failedIndexes.size > 0) {
              const removeAt = [...failedIndexes]
                .map(index => previousCount + index)
                .sort((left, right) => right - left)
              updateGeneralRecruitOverlayKey<string[]>(attachmentFileNamesKey, prev => {
                const next = [...(prev ?? [])]
                for (const index of removeAt) {
                  if (next[index] === incomingNames[index - previousCount]) next.splice(index, 1)
                }
                return next
              })
            }
            if (uploadedIds.length === 0) return
            updateGeneralRecruitOverlayKey<number[]>(attachmentFileObjectIdsKey, prev => [
              ...(prev ?? []),
              ...uploadedIds,
            ])
          } finally {
            setUploadingAttachments(false)
          }
        })()
      )
    },
    [attachmentFileNamesKey, attachmentFileObjectIdsKey]
  )

  const handleRemoveAttachment = useCallback(
    (index: number) => {
      updateGeneralRecruitOverlayKey<string[]>(attachmentFileNamesKey, prev =>
        (prev ?? []).filter((_, i) => i !== index)
      )
      updateGeneralRecruitOverlayKey<number[]>(attachmentFileObjectIdsKey, prev =>
        (prev ?? []).filter((_, i) => i !== index)
      )
    },
    [attachmentFileNamesKey, attachmentFileObjectIdsKey]
  )

  // unmount 시 blob revoke 금지 — overlay 에 URL 이 남아 미리보기에서 깨짐 (StrictMode 포함).
  // 교체·삭제 시에만 revokeThumb.

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
                  onFilesChange={uploadingThumbnail ? undefined : handleThumbnailFiles}
                  onRemoveFile={uploadingThumbnail ? undefined : handleRemoveThumbnail}
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
              <RecruitDetailAdditionalContentEditor
                key={additionalContentKey}
                wysiwygResetKey={wysiwygResetKey}
                additionalContentKey={additionalContentKey}
              />
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
                onFilesChange={uploadingAttachments ? undefined : handleAttachmentFiles}
                onRemoveFile={uploadingAttachments ? undefined : handleRemoveAttachment}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
