import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import { ThumbnailUploadField } from '@/shared/ui/thumbnail-upload-field'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { useIsGeneralRegistrationWizard } from '@/features/template/context/general-registration-wizard-context'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import {
  getRecruitDetailInfoRecord,
  getRecruitDetailInfoScope,
  patchRecruitDetailInfo,
  updateRecruitDetailInfoKey,
  useRecruitDetailInfoField,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-form-rhf'
import {
  RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
  RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES,
  RECRUIT_DETAIL_FILE_MAX_BYTES,
  RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE,
  RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES,
  GENERAL_RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
  GENERAL_RECRUIT_DETAIL_ATTACHMENT_COUNT_EXCEEDED_MESSAGE,
  GENERAL_RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES,
  GENERAL_RECRUIT_DETAIL_ATTACHMENT_MAX_COUNT,
  GENERAL_RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-attachment'
import {
  isRecruitDetailContentPersistSuppressed,
  recruitDetailAdditionalContentOverlayKey,
  registerRecruitDetailRichTextHtml,
  useRecruitDetailContentResetGeneration,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  persistRecruitDetailDraftMediaFromOverlay,
  recruitDetailDraftMediaRestorePatch,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-draft-media-session'
import {
  isEphemeralThumbPreviewUrl,
  RECRUIT_DETAIL_DRAFT_PROGRAM_OWNER_ID,
  recruitDetailAttachmentFileNamesKey,
  recruitDetailAttachmentFileObjectIdsKey,
  recruitDetailThumbContentUrlKey,
  recruitDetailThumbFileNameKey,
  recruitDetailThumbFileObjectIdKey,
  recruitDetailThumbObjectUrlKey,
  resolveRecruitDetailThumbFileObjectId,
  trackRecruitDetailMediaUpload,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import {
  forgetProgramThumbnailPreviewBlob,
  loadProgramThumbnailPreviewUrl,
  rememberProgramThumbnailPreviewBlob,
} from '@/features/program/shared/api/program-thumbnail'
import { resolveRecruitDetailTextFieldOverlayKey } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-text-field-keys'
import {
  contentUrlForFileObjectId,
  programInlineImageOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import {
  programDetailAttachmentOwner,
  programThumbnailOwner,
} from '@/features/program/shared/api/program-attachments'
import '@/features/template/ui/form-editor/form-editor.css'
import './recruit-detail-info-paragraph.css'

const DEFAULT_OVERLAY_KEY_PREFIX = 'recruit.detailInfo'
const DETAIL_INFO_WYSIWYG_OPTIONS = {
  placeholder: '내용을 작성하세요',
  contentFormat: 'html' as const,
  height: '100px',
}
/** 일반 프로그램 등록 위저드 시안 — 「…을 작성하세요」 → 「…을 작성해 주세요」 */
const GENERAL_WIZARD_ADDITIONAL_CONTENT_PLACEHOLDER = '내용을 작성해 주세요'

function toGeneralWizardPlaceholder(placeholder: string): string {
  return placeholder.replace(/작성하세요$/, '작성해 주세요')
}

const RICH_TEXT_FIELD_LABELS = new Set(['모집 안내', '지원 방법', '학습 지원 내용', '기타사항'])

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
  /** 텍스트 필드 컨트롤 — 기본 `input`(h36). 멀티라인이 필요할 때만 `textarea` */
  textFieldControl?: 'textarea' | 'input'
}

function RecruitDetailInfoTextFieldRow({
  field,
  overlayKeyPrefix,
  wysiwygResetKey,
  textFieldControl = 'input',
}: {
  field: RecruitDetailInfoTextField
  overlayKeyPrefix: string
  wysiwygResetKey: string
  textFieldControl?: 'textarea' | 'input'
}) {
  const overlayKey = resolveRecruitDetailTextFieldOverlayKey(overlayKeyPrefix, field.label)
  const [value, setValue] = useRecruitDetailInfoField<string>(overlayKey, '')

  if (RICH_TEXT_FIELD_LABELS.has(field.label)) {
    return (
      <DetailInfoForm.Row
        type="single"
        className="recruit-detail-info-paragraph__rich-text-row"
      >
        <DetailInfoForm.Field
          label={field.label}
          fullRow
          edit={
            <RecruitDetailRichTextEditor
              key={overlayKey}
              overlayKey={overlayKey}
              placeholder={field.placeholder}
              wysiwygResetKey={`${wysiwygResetKey}-${overlayKey}`}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    )
  }

  const control =
    textFieldControl === 'input' ? (
      <CmsInput
        inputSize="small"
        width="100%"
        placeholder={field.placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    ) : (
      <CmsTextArea
        inputSize="small"
        width="100%"
        placeholder={field.placeholder}
        rows={1}
        expandableFromSingleRow={false}
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
  wysiwygResetKey,
  textFieldControl = 'input',
}: {
  fields: RecruitDetailInfoTextField[]
  overlayKeyPrefix: string
  wysiwygResetKey: string
  textFieldControl?: 'textarea' | 'input'
}) {
  return (
    <>
      {fields.map(field => (
        <RecruitDetailInfoTextFieldRow
          key={field.label}
          field={field}
          overlayKeyPrefix={overlayKeyPrefix}
          wysiwygResetKey={wysiwygResetKey}
          textFieldControl={textFieldControl}
        />
      ))}
    </>
  )
}

function readOverlayHtml(overlayKey: string): string {
  const raw = getRecruitDetailInfoRecord()[overlayKey]
  return typeof raw === 'string' ? raw : ''
}

function editorHtmlWithoutEmptyParagraphs(html: string): string {
  return html.replace(/<p><\/p>/gi, '').trim()
}

const RecruitDetailRichTextEditor = memo(function RecruitDetailRichTextEditor({
  wysiwygResetKey,
  overlayKey,
  placeholder = DETAIL_INFO_WYSIWYG_OPTIONS.placeholder,
}: {
  wysiwygResetKey: string
  overlayKey: string
  placeholder?: string
}) {
  const initialHtmlRef = useRef(readOverlayHtml(overlayKey))
  const fileUploadOwner = programInlineImageOwner(null)
  const { editor, editorMinHeight, getHTML } = useNoticeWysiwygEditor(
    true,
    initialHtmlRef.current,
    wysiwygResetKey,
    { ...DETAIL_INFO_WYSIWYG_OPTIONS, placeholder, fileUploadOwner }
  )

  const getHtmlRef = useRef(getHTML)
  getHtmlRef.current = getHTML
  const latestHtmlRef = useRef(initialHtmlRef.current)
  /** 사용자가 편집한 적 없으면 overlay에 되쓰지 않는다 — 저장본 hydrate 전 빈 HTML이 덮어쓰는 것 방지 */
  const editedRef = useRef(false)

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
    const onUpdate = () => {
      editedRef.current = true
      remember()
    }
    remember()
    editor.on('update', onUpdate)
    return () => {
      remember()
      if (!editor.isDestroyed) {
        editor.off('update', onUpdate)
      }
    }
  }, [editor])

  useEffect(() => {
    const readHtml = () => latestHtmlRef.current || getHtmlRef.current()
    const readEditedHtml = () => (editedRef.current ? readHtml() : null)
    registerRecruitDetailRichTextHtml(overlayKey, readEditedHtml)
    return () => {
      if (!isRecruitDetailContentPersistSuppressed()) {
        const html = readEditedHtml()
        if (typeof html === 'string') {
          patchRecruitDetailInfo({ [overlayKey]: html })
        }
      }
      registerRecruitDetailRichTextHtml(overlayKey, null)
    }
  }, [overlayKey])

  const [overlayHtml] = useRecruitDetailInfoField<string>(overlayKey, '')
  useEffect(() => {
    if (editor == null || editor.isDestroyed || editor.view == null) return
    const incoming = overlayHtml.trim()
    let current = ''
    try {
      // resetKey로 새 에디터가 생긴 직후엔 getHTML api가 이전 인스턴스를 가리킬 수 있다.
      current = editorHtmlWithoutEmptyParagraphs(editor.getHTML())
    } catch {
      return
    }
    if (incoming === '') {
      // overlay가 비면 TipTap 잔여 HTML도 비운다. 미편집 잔여는 저장 flush에 넣지 않는다.
      if (current === '') return
      try {
        editor.commands.setContent('', { emitUpdate: false, contentType: 'html' })
        latestHtmlRef.current = ''
        editedRef.current = false
      } catch {
        // 템플릿 변경으로 에디터가 destroy된 뒤 overlay hydrate가 늦게 오면 무시
      }
      return
    }
    if (current !== '') return
    try {
      editor.commands.setContent(incoming, { emitUpdate: false, contentType: 'html' })
    } catch {
      // 템플릿 변경으로 에디터가 destroy된 뒤 overlay hydrate가 늦게 오면 무시
    }
  }, [editor, overlayHtml])

  return (
    <div className="recruit-detail-info-paragraph__editor-section">
      <div className="recruit-detail-info-paragraph__editor-host">
        <RichTextEditor
          editor={editor}
          className="recruit-detail-info-paragraph__rich-text-editor"
          minHeight={editorMinHeight}
          fileUploadOwner={fileUploadOwner}
        />
      </div>
    </div>
  )
})

const RecruitDetailAdditionalContentEditor = memo(function RecruitDetailAdditionalContentEditor({
  wysiwygResetKey,
  additionalContentKey,
  placeholder,
}: {
  wysiwygResetKey: string
  additionalContentKey: string
  placeholder?: string
}) {
  return (
    <RecruitDetailRichTextEditor
      wysiwygResetKey={wysiwygResetKey}
      overlayKey={additionalContentKey}
      placeholder={placeholder}
    />
  )
})

export function RecruitDetailInfoParagraph({
  wysiwygResetKey,
  textFields,
  overlayKeyPrefix = DEFAULT_OVERLAY_KEY_PREFIX,
  afterEditorFields,
  attachmentAccept = RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
  attachmentGuideLines = RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES,
  textFieldControl = 'input',
}: RecruitDetailInfoParagraphProps) {
  // 일반 프로그램 등록 위저드만 시안 플레이스홀더 — 1사1교·Gemini·UJAT·교육받은 교사·템플릿 관리는 기존 문구
  const isGeneralWizard = useIsGeneralRegistrationWizard()
  /** 썸네일·첨부 안내 시안 문구 — 일반 등록 위저드 + 템플릿 관리 모집 폼 전체 (QA 261113 #57) */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const showSpecAttachmentGuide = isGeneralWizard || isTemplateManagementScreen
  const resolvedTextFields = isGeneralWizard
    ? textFields.map(field => ({ ...field, placeholder: toGeneralWizardPlaceholder(field.placeholder) }))
    : textFields
  const resolvedAfterEditorFields =
    isGeneralWizard && afterEditorFields != null
      ? afterEditorFields.map(field => ({
          ...field,
          placeholder: toGeneralWizardPlaceholder(field.placeholder),
        }))
      : afterEditorFields
  const contentResetGeneration = useRecruitDetailContentResetGeneration()
  const overlayScope = getRecruitDetailInfoScope()
  const editorResetKey = `${wysiwygResetKey}::scope-${overlayScope}::reset-${contentResetGeneration}`
  const thumbObjectUrlKey = recruitDetailThumbObjectUrlKey(overlayKeyPrefix)
  const thumbFileNameKey = recruitDetailThumbFileNameKey(overlayKeyPrefix)
  const thumbFileObjectIdKey = recruitDetailThumbFileObjectIdKey(overlayKeyPrefix)
  const thumbContentUrlKey = recruitDetailThumbContentUrlKey(overlayKeyPrefix)
  const attachmentFileNamesKey = recruitDetailAttachmentFileNamesKey(overlayKeyPrefix)
  const attachmentFileObjectIdsKey = recruitDetailAttachmentFileObjectIdsKey(overlayKeyPrefix)
  const additionalContentKey = recruitDetailAdditionalContentOverlayKey(overlayKeyPrefix)

  const [persistedThumbObjectUrl, setPersistedThumbObjectUrl] = useRecruitDetailInfoField<
    string | null
  >(thumbObjectUrlKey, null)
  const [thumbFileName, setThumbFileName] = useRecruitDetailInfoField<string | null>(
    thumbFileNameKey,
    null
  )
  const [thumbFileObjectId, setThumbFileObjectId] = useRecruitDetailInfoField<number | null>(
    thumbFileObjectIdKey,
    null
  )
  const [thumbContentUrl] = useRecruitDetailInfoField<string | null>(thumbContentUrlKey, null)
  const [attachmentFileNames] = useRecruitDetailInfoField<string[]>(attachmentFileNamesKey, [])
  const resolvedThumbFileObjectId = resolveRecruitDetailThumbFileObjectId(
    thumbFileObjectId,
    thumbContentUrl
  )
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null)
  const [storedPreviewUrl, setStoredPreviewUrl] = useState<string | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingAttachments, setUploadingAttachments] = useState(false)

  const revokeThumb = useCallback((url: string | null | undefined) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    const patch = recruitDetailDraftMediaRestorePatch(overlayScope, overlayKeyPrefix)
    if (patch == null) return
    patchRecruitDetailInfo(patch)
  }, [overlayKeyPrefix, overlayScope])

  useEffect(() => {
    if (!isEphemeralThumbPreviewUrl(persistedThumbObjectUrl)) return
    setPersistedThumbObjectUrl(null)
  }, [persistedThumbObjectUrl, setPersistedThumbObjectUrl])

  useEffect(() => {
    if (resolvedThumbFileObjectId == null || thumbFileObjectId === resolvedThumbFileObjectId) {
      return
    }
    setThumbFileObjectId(resolvedThumbFileObjectId)
  }, [resolvedThumbFileObjectId, setThumbFileObjectId, thumbFileObjectId])

  useEffect(() => {
    if (livePreviewUrl) return
    const id = resolvedThumbFileObjectId
    if (id == null) {
      setStoredPreviewUrl(prev => {
        revokeThumb(prev)
        return null
      })
      return
    }
    let cancelled = false
    void loadProgramThumbnailPreviewUrl(id)
      .then(url => {
        if (cancelled) return
        setStoredPreviewUrl(prev => {
          if (prev !== url) revokeThumb(prev)
          return url
        })
      })
      .catch(() => {
        if (!cancelled) {
          setStoredPreviewUrl(prev => {
            revokeThumb(prev)
            return null
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [livePreviewUrl, resolvedThumbFileObjectId, revokeThumb])

  const handleThumbnailFiles = useCallback(
    (files: File[]) => {
      const image = files.find(f => /^image\//u.test(f.type)) ?? files[0]
      if (!image) return
      const blobUrl = URL.createObjectURL(image)
      setLivePreviewUrl(prev => {
        revokeThumb(prev)
        return blobUrl
      })
      setThumbFileName(image.name)
      setPersistedThumbObjectUrl(null)
      setUploadingThumbnail(true)
      trackRecruitDetailMediaUpload(
        (async () => {
          try {
            const uploaded = await uploadAdminFileMaybeMock({
              file: image,
              owner: programThumbnailOwner(RECRUIT_DETAIL_DRAFT_PROGRAM_OWNER_ID),
              waitUntilAvailable: true,
            })
            rememberProgramThumbnailPreviewBlob(uploaded.fileObjectId, image)
            patchRecruitDetailInfo({
              [thumbFileObjectIdKey]: uploaded.fileObjectId,
              [thumbContentUrlKey]: contentUrlForFileObjectId(uploaded.fileObjectId),
              [thumbObjectUrlKey]: null,
            })
            persistRecruitDetailDraftMediaFromOverlay(overlayScope, overlayKeyPrefix)
          } catch {
            patchRecruitDetailInfo({
              [thumbFileObjectIdKey]: null,
              [thumbContentUrlKey]: null,
              [thumbObjectUrlKey]: null,
            })
            persistRecruitDetailDraftMediaFromOverlay(overlayScope, overlayKeyPrefix)
            setLivePreviewUrl(prev => {
              revokeThumb(prev)
              return null
            })
            setThumbFileName(null)
          } finally {
            setUploadingThumbnail(false)
          }
        })()
      )
    },
    [
      revokeThumb,
      setPersistedThumbObjectUrl,
      setThumbFileName,
      overlayKeyPrefix,
      overlayScope,
      thumbContentUrlKey,
      thumbFileObjectIdKey,
      thumbObjectUrlKey,
    ]
  )

  const handleRemoveThumbnail = useCallback(() => {
    setLivePreviewUrl(prev => {
      revokeThumb(prev)
      return null
    })
    setStoredPreviewUrl(prev => {
      revokeThumb(prev)
      return null
    })
    setThumbFileName(null)
    setPersistedThumbObjectUrl(null)
    forgetProgramThumbnailPreviewBlob(resolvedThumbFileObjectId)
    patchRecruitDetailInfo({
      [thumbFileObjectIdKey]: null,
      [thumbContentUrlKey]: null,
      [thumbObjectUrlKey]: null,
    })
    persistRecruitDetailDraftMediaFromOverlay(overlayScope, overlayKeyPrefix)
  }, [
    overlayKeyPrefix,
    overlayScope,
    resolvedThumbFileObjectId,
    revokeThumb,
    setPersistedThumbObjectUrl,
    setThumbFileName,
    thumbContentUrlKey,
    thumbFileObjectIdKey,
    thumbObjectUrlKey,
  ])

  const handleAttachmentFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      const incomingNames = files.map(file => file.name)
      const previousCount = Array.isArray(attachmentFileNames) ? attachmentFileNames.length : 0
      // 일반 등록 위저드 — 상세 모집 정보와 같은 최대 10개 제한
      if (
        isGeneralWizard &&
        previousCount + files.length > GENERAL_RECRUIT_DETAIL_ATTACHMENT_MAX_COUNT
      ) {
        cmsAlertModal.show({
          title: '안내',
          content: GENERAL_RECRUIT_DETAIL_ATTACHMENT_COUNT_EXCEEDED_MESSAGE,
        })
        return
      }
      // 업로드 완료 전에 단계를 바꿔도 파일명이 남도록 먼저 기록한다.
      updateRecruitDetailInfoKey<string[]>(attachmentFileNamesKey, prev => [
        ...(prev ?? []),
        ...incomingNames,
      ])
      setUploadingAttachments(true)
      trackRecruitDetailMediaUpload(
        (async () => {
          const owner = programDetailAttachmentOwner(RECRUIT_DETAIL_DRAFT_PROGRAM_OWNER_ID)
          const uploadedIds: number[] = []
          const failedIndexes = new Set<number>()
          try {
            for (let index = 0; index < files.length; index += 1) {
              try {
                const uploaded = await uploadAdminFileMaybeMock({
                  file: files[index],
                  owner,
                  waitUntilAvailable: true,
                })
                uploadedIds.push(uploaded.fileObjectId)
              } catch {
                failedIndexes.add(index)
              }
            }
            if (failedIndexes.size > 0) {
              const removeAt = [...failedIndexes]
                .map(index => previousCount + index)
                .sort((left, right) => right - left)
              updateRecruitDetailInfoKey<string[]>(attachmentFileNamesKey, prev => {
                const next = [...(prev ?? [])]
                for (const index of removeAt) {
                  if (next[index] === incomingNames[index - previousCount]) next.splice(index, 1)
                }
                return next
              })
            }
            if (uploadedIds.length === 0) {
              persistRecruitDetailDraftMediaFromOverlay(overlayScope, overlayKeyPrefix)
              return
            }
            updateRecruitDetailInfoKey<number[]>(attachmentFileObjectIdsKey, prev => [
              ...(prev ?? []),
              ...uploadedIds,
            ])
            persistRecruitDetailDraftMediaFromOverlay(overlayScope, overlayKeyPrefix)
          } finally {
            setUploadingAttachments(false)
          }
        })()
      )
    },
    [
      attachmentFileNames,
      attachmentFileNamesKey,
      attachmentFileObjectIdsKey,
      isGeneralWizard,
      overlayKeyPrefix,
      overlayScope,
    ]
  )

  const handleRemoveAttachment = useCallback(
    (index: number) => {
      updateRecruitDetailInfoKey<string[]>(attachmentFileNamesKey, prev =>
        (prev ?? []).filter((_, i) => i !== index)
      )
      updateRecruitDetailInfoKey<number[]>(attachmentFileObjectIdsKey, prev =>
        (prev ?? []).filter((_, i) => i !== index)
      )
      persistRecruitDetailDraftMediaFromOverlay(overlayScope, overlayKeyPrefix)
    },
    [attachmentFileNamesKey, attachmentFileObjectIdsKey, overlayKeyPrefix, overlayScope]
  )

  const thumbnailPreviewUrl = livePreviewUrl ?? storedPreviewUrl

  return (
    <div className="recruit-detail-info-paragraph__forms">
      <DetailInfoForm title="상세 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="썸네일 이미지"
            fullRow
            edit={
              <ThumbnailUploadField
                previewUrl={thumbnailPreviewUrl}
                fileName={thumbFileName}
                guideLines={
                  showSpecAttachmentGuide
                    ? GENERAL_RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES
                    : RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES
                }
                maxBytes={RECRUIT_DETAIL_FILE_MAX_BYTES}
                sizeExceededMessage={RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE}
                uploading={uploadingThumbnail}
                onSelectFile={file => handleThumbnailFiles([file])}
                onRemove={handleRemoveThumbnail}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <RecruitDetailInfoTextFieldRows
          fields={resolvedTextFields}
          overlayKeyPrefix={overlayKeyPrefix}
          wysiwygResetKey={editorResetKey}
          textFieldControl={textFieldControl}
        />

        <DetailInfoForm.Row
          type="single"
          className="recruit-detail-info-paragraph__rich-text-row"
        >
          <DetailInfoForm.Field
            label="추가 내용"
            fullRow
            edit={
              <RecruitDetailAdditionalContentEditor
                key={`${additionalContentKey}-${contentResetGeneration}`}
                wysiwygResetKey={editorResetKey}
                additionalContentKey={additionalContentKey}
                placeholder={
                  isGeneralWizard ? GENERAL_WIZARD_ADDITIONAL_CONTENT_PLACEHOLDER : undefined
                }
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>

        {resolvedAfterEditorFields != null && resolvedAfterEditorFields.length > 0 ? (
          <RecruitDetailInfoTextFieldRows
            fields={resolvedAfterEditorFields}
            overlayKeyPrefix={overlayKeyPrefix}
            wysiwygResetKey={editorResetKey}
            textFieldControl={textFieldControl}
          />
        ) : null}

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="첨부 파일"
            fullRow
            edit={
              <ParagraphFileUpload
                accept={
                  showSpecAttachmentGuide ? GENERAL_RECRUIT_DETAIL_ATTACHMENT_ACCEPT : attachmentAccept
                }
                guideLines={
                  showSpecAttachmentGuide
                    ? GENERAL_RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES
                    : attachmentGuideLines
                }
                multiple
                fileNames={attachmentFileNames}
                maxTotalBytes={0}
                maxFileBytes={RECRUIT_DETAIL_FILE_MAX_BYTES}
                sizeExceededMessage={RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE}
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
