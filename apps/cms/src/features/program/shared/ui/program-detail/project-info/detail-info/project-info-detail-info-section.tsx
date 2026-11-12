/**
 * 프로그램 상세 정보 / 강사·봉사자 정보 탭 — 상세 정보 섹션 통합
 * - ProjectInfoDetailInfoSection: 풀페이지 모달 내 상세 블록 래퍼
 * - DetailInfoSection / InstructorDetailInfoSection / VolunteerDetailInfoSection
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Program } from '@/types/domain'
import { Controller } from 'react-hook-form'
import type { ControllerRenderProps, FieldPath, UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { ThumbnailUploadField } from '@/shared/ui/thumbnail-upload-field'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import {
  parseFileObjectId,
  programInlineImageOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import {
  loadProgramThumbnailPreviewUrl,
  rememberProgramThumbnailPreviewBlob,
} from '@/features/program/shared/api/program-thumbnail'
import {
  applyLiveRecruitmentThumbnailOverlay,
  readRecruitDetailMediaFromOverlay,
  trackRecruitDetailMediaUpload,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import {
  fetchProgramMediaAttachments,
  fetchProgramMediaThumbnail,
  hasProgramMediaTarget,
  isUjatTypedRecruitmentDraftProgram,
  putProgramMediaAttachments,
  putProgramMediaThumbnail,
  resolveProgramMediaAttachmentUploadOwner,
  resolveProgramMediaThumbnailUploadOwner,
  usesRecruitmentRowMedia,
} from '@/features/program/shared/api/program-media-target'
import { useCmsAlert } from '@/shared/ui'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor, RichTextViewer } from '@/shared/rich-text'
import {
  DEFAULT_ADDITIONAL_HTML,
  DEFAULT_LEARNING_SUPPORT,
  DEFAULT_PROGRAM_DESCRIPTION,
  DEFAULT_RECRUITMENT_GUIDE,
  getThumbnailFilename,
} from '@/features/program/shared/lib/program-detail-info-constants'
import {
  RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
  RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES,
  RECRUIT_DETAIL_FILE_MAX_BYTES,
  RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE,
  RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-attachment'
import './project-info-detail-info-section.css'

/** 프로그램 상세 — 모집양식 썸네일 안내 + 권장 가로 사이즈 */
const THUMBNAIL_GUIDE_LINES = [
  `${RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES[0]} / 가로 사이즈 500px 권장, 세로 사이즈 무관`,
  RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES[1],
]

const ATTACHMENT_GUIDE_LINES = RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES

/**
 * 상세 정보 파일·문구 스펙.
 * - `default`: 기존 동작(1사1교·UJAT·교육받은 교사 등)
 * - `general`: 일반 프로그램 모집 정보 수정 시안(02-1·02-2·03-2) — HWP 허용, 최대 10개·총 100MB, 안내 문구
 * - `company-school`: 1사1교 참여 기관 모집 정보 시안(4175:101670·102464) — `general` + 학습 지원 내용 placeholder
 * - `trained-teachers`: 교육받은 교사 참여 기관 모집 정보 — 일반 기관 시안과 같은 스펙(`company-school`과 동일 문구)
 */
export type DetailInfoSectionVariant = 'default' | 'general' | 'company-school' | 'trained-teachers'

const GENERAL_DETAIL_SECTION_DESCRIPTION = '공란인 경우, 홈페이지 모집 상세에서 항목 미노출됩니다.'
const GENERAL_THUMBNAIL_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  RECRUIT_DETAIL_THUMBNAIL_GUIDE_LINES[1],
]
const GENERAL_ATTACHMENT_GUIDE_LINES = [
  '- 파일은 JPG, PNG, HWP, Excel, PDF, Word 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
  RECRUIT_DETAIL_ATTACHMENT_GUIDE_LINES[1],
]
const GENERAL_ATTACHMENT_ACCEPT = `${RECRUIT_DETAIL_ATTACHMENT_ACCEPT},.hwp,.hwpx`
const GENERAL_ATTACHMENT_MAX_COUNT = 10
const GENERAL_ATTACHMENT_MAX_TOTAL_BYTES = 100 * 1024 * 1024
const GENERAL_ATTACHMENT_COUNT_EXCEEDED_MESSAGE = '첨부 파일은 최대 10개까지 등록할 수 있습니다.'
const GENERAL_ATTACHMENT_TOTAL_EXCEEDED_MESSAGE = '첨부 파일은 총 100MB까지 업로드 가능합니다.'
const GENERAL_APPLICATION_METHOD_PLACEHOLDER = '지원 방법을 작성해 주세요'
const COMPANY_SCHOOL_LEARNING_SUPPORT_PLACEHOLDER = '학습 지원 내용을 작성해 주세요'

function resolveDetailInfoVariantCopy(variant: DetailInfoSectionVariant) {
  const isGeneral =
    variant === 'general' || variant === 'company-school' || variant === 'trained-teachers'
  return {
    learningSupportPlaceholder:
      variant === 'company-school' || variant === 'trained-teachers'
        ? COMPANY_SCHOOL_LEARNING_SUPPORT_PLACEHOLDER
        : undefined,
    thumbnailGuideLines: isGeneral ? GENERAL_THUMBNAIL_GUIDE_LINES : THUMBNAIL_GUIDE_LINES,
    attachmentGuideLines: isGeneral ? GENERAL_ATTACHMENT_GUIDE_LINES : ATTACHMENT_GUIDE_LINES,
    attachmentAccept: isGeneral ? GENERAL_ATTACHMENT_ACCEPT : RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
    attachmentMaxCount: isGeneral ? GENERAL_ATTACHMENT_MAX_COUNT : undefined,
    attachmentMaxTotalBytes: isGeneral ? GENERAL_ATTACHMENT_MAX_TOTAL_BYTES : 0,
    applicationMethodPlaceholder: isGeneral ? GENERAL_APPLICATION_METHOD_PLACEHOLDER : undefined,
    sectionDescription: isGeneral ? GENERAL_DETAIL_SECTION_DESCRIPTION : undefined,
  }
}

export type DetailInfoEmptyReadDisplay = 'mock-default' | 'dash'

function axiosErrorData(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  return (error as { response?: { data?: unknown } }).response?.data
}

function revokeBlobUrl(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

/** `/content` 경로는 대표 이미지를 열지 못한다. http(s)·blob 만 미리보기로 쓴다. */
function readableThumbnailUrl(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.includes('/api/admin/files/')) return undefined
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed
  }
  return undefined
}

function normalizeAttachmentFileNames(names: string[] | undefined | null): string[] {
  return (names ?? []).map(name => name.trim()).filter(Boolean)
}

/**
 * 모집 행 화면은 그 행 첨부만 보여 준다. `[]`이면 프로그램 첨부로 채우지 않는다.
 * 프로그램 화면은 행 API가 비어 있을 때만 프로그램 첨부 이름을 유지한다.
 */
export function resolveAttachmentFileNamesForDisplay({
  rowScoped,
  isFormEdit,
  formFileNames,
  linkedAttachmentNames,
  programFallback,
}: {
  rowScoped: boolean
  isFormEdit: boolean
  formFileNames: string[] | undefined
  linkedAttachmentNames: string[] | null
  programFallback: string[] | undefined
}): string[] {
  if (rowScoped) {
    return normalizeAttachmentFileNames(linkedAttachmentNames ?? [])
  }
  const fallback = normalizeAttachmentFileNames(programFallback)
  if (isFormEdit) return normalizeAttachmentFileNames(formFileNames)
  if (linkedAttachmentNames != null && linkedAttachmentNames.length > 0) {
    return normalizeAttachmentFileNames(linkedAttachmentNames)
  }
  return fallback
}

function resolveTextReadContent(
  raw: string | undefined,
  emptyReadDisplay: DetailInfoEmptyReadDisplay,
  mockDefault: string
): ReactNode {
  const trimmed = raw?.trim()
  if (emptyReadDisplay === 'dash') return trimmed || '-'
  return trimmed || mockDefault
}

function isAdditionalContentEmpty(program: Program): boolean {
  const html = program.additionalContentHtml?.trim()
  if (!html) return true
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return !text
}

function isHtmlContent(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value)
}

function RichTextReadContent({
  content,
  className,
}: {
  content: ReactNode
  className?: string
}) {
  if (typeof content !== 'string' || !isHtmlContent(content)) {
    // HTML이 아닌 기존·자동 입력 값도 에디터 뷰어와 같은 글자 크기·행간으로 보인다
    return (
      <div className={[className, 'program-detail-info-tab__plain-content'].filter(Boolean).join(' ')}>
        {content}
      </div>
    )
  }
  return (
    <div className={className}>
      <RichTextViewer
        content={content}
        contentFormat="html"
        maxHeight="none"
        className="program-detail-info-tab__editor-content"
      />
    </div>
  )
}

function isBlankDetailHtml(value: string): boolean {
  const text = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return text === ''
}

function DetailInfoRichTextFieldEditor({
  field,
  program,
  placeholder,
  error,
}: {
  field: ControllerRenderProps<ProgramDetailEditFormValues, FieldPath<ProgramDetailEditFormValues>>
  program: Program
  placeholder: string
  error?: unknown
}) {
  const value = typeof field.value === 'string' ? field.value : String(field.value ?? '')
  const owner = programInlineImageOwner(parseFileObjectId(program.id))
  const resetKey = `${program.id}-${field.name}`
  const initialContentRef = useRef({ resetKey, value })
  if (initialContentRef.current.resetKey !== resetKey) {
    initialContentRef.current = { resetKey, value }
  }
  const onChangeRef = useRef(field.onChange)
  onChangeRef.current = field.onChange
  const fieldValueRef = useRef(value)
  fieldValueRef.current = value
  const { editor, editorMinHeight, getHTML } = useNoticeWysiwygEditor(
    true,
    initialContentRef.current.value,
    resetKey,
    {
      placeholder,
      contentFormat: 'html',
      height: '100px',
      fileUploadOwner: owner,
    }
  )

  useEffect(() => {
    if (editor == null) return
    const sync = () => {
      if (editor.isDestroyed) return
      onChangeRef.current(getHTML())
    }
    editor.on('update', sync)
    return () => {
      if (!editor.isDestroyed) {
        const html = getHTML()
        const stored = fieldValueRef.current
        if (!(isBlankDetailHtml(html) && !isBlankDetailHtml(stored))) {
          onChangeRef.current(html)
        }
        editor.off('update', sync)
      }
    }
  }, [editor, getHTML])

  return (
    <>
      <div className="program-detail-info-tab__editor-host program-detail-info-tab__editor-host--field">
        <RichTextEditor
          editor={editor}
          className="program-detail-info-tab__rich-text-editor"
          minHeight={editorMinHeight}
          fileUploadOwner={owner}
        />
      </div>
      {error ? (
        <span className="text-area-field-row__field-error">입력값을 확인해주세요.</span>
      ) : null}
    </>
  )
}

const DETAIL_INFO_FIELD_LABEL_WIDTH = 200 as const

function ProgramDetailTextAreaField({
  label,
  showRequiredStar,
  isFormEdit,
  form,
  name,
  rows = 1,
  placeholder,
  readContent,
  control = 'input',
}: {
  label: string
  showRequiredStar: boolean
  isFormEdit: boolean
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  name: FieldPath<ProgramDetailEditFormValues>
  rows?: number
  placeholder: string
  readContent: ReactNode
  control?: 'textarea' | 'input'
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        required={showRequiredStar}
        labelWidth={DETAIL_INFO_FIELD_LABEL_WIDTH}
        fullRow
        view={
          <div className="text-area-field-row__content-block">{readContent}</div>
        }
        edit={
          isFormEdit && form
            ? (
                <Controller
                  name={name}
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const value =
                      typeof field.value === 'string' ? field.value : String(field.value ?? '')
                    return (
                      <>
                        {control === 'input' ? (
                          <CmsInput
                            {...field}
                            value={value}
                            inputSize="small"
                            width="100%"
                            placeholder={placeholder}
                            className="text-area-field-row__field"
                            status={fieldState.error ? 'error' : undefined}
                          />
                        ) : (
                          <CmsTextArea
                            {...field}
                            value={value}
                            inputSize="small"
                            width="100%"
                            rows={rows}
                            expandableFromSingleRow={false}
                            placeholder={placeholder}
                            className="text-area-field-row__field"
                            status={fieldState.error ? 'error' : undefined}
                          />
                        )}
                        {fieldState.error?.message ? (
                          <span className="text-area-field-row__field-error">
                            {fieldState.error.message}
                          </span>
                        ) : null}
                      </>
                    )
                  }}
                />
              )
            : undefined
        }
      />
    </DetailInfoForm.Row>
  )
}

function RichTextDetailField({
  label,
  showRequiredStar,
  isFormEdit,
  form,
  program,
  name,
  placeholder,
  readContent,
}: {
  label: string
  showRequiredStar: boolean
  isFormEdit: boolean
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  program: Program
  name: FieldPath<ProgramDetailEditFormValues>
  placeholder: string
  readContent: ReactNode
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        required={showRequiredStar}
        labelWidth={DETAIL_INFO_FIELD_LABEL_WIDTH}
        fullRow
        view={
          <RichTextReadContent
            content={readContent}
            className="text-area-field-row__content-block"
          />
        }
        edit={
          isFormEdit && form
            ? (
                <Controller
                  name={name}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <DetailInfoRichTextFieldEditor
                      field={field}
                      program={program}
                      placeholder={placeholder}
                      error={fieldState.error}
                    />
                  )}
                />
              )
            : undefined
        }
      />
    </DetailInfoForm.Row>
  )
}

/** 조회·수정 모드 동일 — mock 기본 HTML 포함 (UJAT dash 모드는 공란 유지) */
function resolveAdditionalContentHtml(
  program: Program,
  emptyReadDisplay: DetailInfoEmptyReadDisplay = 'mock-default'
): string {
  const trimmed = program.additionalContentHtml?.trim()
  if (trimmed) return trimmed
  if (emptyReadDisplay === 'dash') return ''
  return DEFAULT_ADDITIONAL_HTML
}

function additionalContentReadContent(
  program: Program,
  emptyReadDisplay: DetailInfoEmptyReadDisplay
): ReactNode {
  if (emptyReadDisplay === 'dash' && isAdditionalContentEmpty(program)) return '-'
  return resolveAdditionalContentHtml(program, emptyReadDisplay)
}

function useDetailInfoEditorBlock(
  program: Program,
  isEditMode: boolean,
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined,
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
) {
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [thumbnailPreviewBlobUrl, setThumbnailPreviewBlobUrl] = useState<string | null>(null)
  const [linkedThumbnail, setLinkedThumbnail] = useState<{
    url: string
    fileName: string
  } | null>(null)

  useEffect(() => {
    if (isEditMode) return
    setThumbnailPreviewBlobUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode || !form) return
    onRegisterGetAdditionalContentHtml?.(() => {
      const value = form.getValues('additionalContentHtml')
      return typeof value === 'string' ? value : ''
    })
    return () => {
      onRegisterGetAdditionalContentHtml?.(() => '')
    }
  }, [isEditMode, form, onRegisterGetAdditionalContentHtml])

  const isFormEdit = Boolean(isEditMode && form)
  const typedDraftMedia = isUjatTypedRecruitmentDraftProgram(program)
  const rowMedia = usesRecruitmentRowMedia(program)
  const [linkedAttachmentNames, setLinkedAttachmentNames] = useState<string[] | null>(null)
  const [linkedAttachmentTotalBytes, setLinkedAttachmentTotalBytes] = useState(0)
  const displayFileNames = resolveAttachmentFileNamesForDisplay({
    rowScoped: rowMedia,
    isFormEdit,
    formFileNames: isFormEdit ? form!.watch('attachmentFileNames') : undefined,
    linkedAttachmentNames,
    programFallback: rowMedia ? undefined : program.attachmentFileNames,
  })
  const draftThumbId =
    typedDraftMedia && isFormEdit ? form!.watch('recruitmentThumbnailFileObjectId') : undefined
  const draftThumbName =
    typedDraftMedia && isFormEdit ? form!.watch('recruitmentThumbnailFileName') : undefined

  useEffect(() => {
    if (!hasProgramMediaTarget(program)) {
      return
    }
    let cancelled = false
    void fetchProgramMediaAttachments(program)
      .then(items => {
        if (cancelled) return
        const names = items
          .map(item => item.originalFileName?.trim() || '')
          .filter(Boolean)
        setLinkedAttachmentNames(names)
        setLinkedAttachmentTotalBytes(
          items.reduce((sum, item) => sum + (item.fileSize ?? 0), 0)
        )
        if (form && (usesRecruitmentRowMedia(program) || names.length > 0)) {
          form.setValue('attachmentFileNames', names, { shouldDirty: false })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLinkedAttachmentNames(null)
          setLinkedAttachmentTotalBytes(0)
        }
      })
    return () => {
      cancelled = true
    }
    // form identity는 렌더마다 바뀔 수 있어 program.id·모집 행 기준으로만 동기화
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from attachments API SSOT
  }, [program.id, program.activeRecruitmentId])

  const activeRowThumbnailId = program.programRecruitments?.find(
    row => row.id != null && row.id === program.activeRecruitmentId
  )?.thumbnailFileObjectId

  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null
    void (async () => {
      let fileObjectId: number | null = null
      let fileName = ''
      if (hasProgramMediaTarget(program)) {
        const thumbnail = await fetchProgramMediaThumbnail(program)
        fileObjectId = thumbnail.fileObjectId
        fileName = thumbnail.originalFileName?.trim() || ''
      } else if (typedDraftMedia) {
        fileObjectId =
          typeof draftThumbId === 'number' && draftThumbId > 0 ? draftThumbId : null
        fileName = draftThumbName?.trim() || ''
      } else {
        return
      }
      if (cancelled || fileObjectId == null) {
        if (!cancelled) {
          setLinkedThumbnail(prev => {
            revokeBlobUrl(prev?.url)
            return null
          })
        }
        return
      }
      const nextUrl = await loadProgramThumbnailPreviewUrl(fileObjectId)
      if (cancelled) {
        revokeBlobUrl(nextUrl)
        return
      }
      createdUrl = nextUrl
      setLinkedThumbnail(prev => {
        if (prev?.url !== nextUrl) revokeBlobUrl(prev?.url)
        return {
          url: nextUrl,
          fileName,
        }
      })
    })().catch(() => {
      if (!cancelled) {
        setLinkedThumbnail(prev => {
          revokeBlobUrl(prev?.url)
          return null
        })
      }
    })
    return () => {
      cancelled = true
      revokeBlobUrl(createdUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- program 객체는 렌더마다 바뀐다
  }, [
    program.id,
    program.activeRecruitmentId,
    activeRowThumbnailId,
    typedDraftMedia,
    draftThumbId,
    draftThumbName,
  ])

  const legacyThumbnailUrl = readableThumbnailUrl(
    (isFormEdit && form
      ? form.watch('keyVisualImage') || form.watch('posterImage')
      : undefined) ||
      program.keyVisualImage ||
      program.posterImage
  )
  const displayThumbnailUrl = rowMedia
    ? thumbnailPreviewBlobUrl || linkedThumbnail?.url
    : thumbnailPreviewBlobUrl || linkedThumbnail?.url || legacyThumbnailUrl
  // 행 모드 파일명은 fetchProgramMediaThumbnail(활성 행 prefix)만 쓴다 — 다른 유형 overlay로 폴백하지 않는다.
  const overlayThumbnailName = rowMedia
    ? undefined
    : readRecruitDetailMediaFromOverlay(program.registrationOverlay ?? {}).thumbFileName
  const thumbnailFilename =
    linkedThumbnail?.fileName ||
    overlayThumbnailName ||
    (rowMedia
      ? displayThumbnailUrl
        ? '썸네일.jpg'
        : ''
      : legacyThumbnailUrl
        ? getThumbnailFilename(legacyThumbnailUrl)
        : '')

  return {
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    setLinkedThumbnail,
    isFormEdit,
    displayFileNames,
    linkedAttachmentTotalBytes,
    setLinkedAttachmentTotalBytes,
    displayThumbnailUrl,
    thumbnailFilename,
    form,
    setLinkedAttachmentNames,
  }
}

function ThumbnailImageField({
  program,
  isEditMode: _isEditMode,
  isFormEdit,
  form,
  uploadingThumbnail,
  setUploadingThumbnail,
  setThumbnailPreviewBlobUrl,
  setLinkedThumbnail,
  displayThumbnailUrl,
  thumbnailFilename,
  guideLines,
  showRequiredStar,
}: {
  program: Program
  isEditMode: boolean
  isFormEdit: boolean
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  uploadingThumbnail: boolean
  setUploadingThumbnail: (v: boolean) => void
  setThumbnailPreviewBlobUrl: React.Dispatch<React.SetStateAction<string | null>>
  setLinkedThumbnail: React.Dispatch<
    React.SetStateAction<{ url: string; fileName: string } | null>
  >
  displayThumbnailUrl: string | undefined
  thumbnailFilename: string
  guideLines: string[]
  showRequiredStar: boolean
}) {
  const { showAlert } = useCmsAlert()

  const renderThumbnail = (disabled: boolean) => (
    <div className="program-detail-info-tab__cell--thumbnail">
      <ThumbnailUploadField
        previewUrl={displayThumbnailUrl}
        previewAlt={program.title}
        fileName={thumbnailFilename}
        guideLines={guideLines}
        maxBytes={RECRUIT_DETAIL_FILE_MAX_BYTES}
        sizeExceededMessage={RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE}
        disabled={disabled}
        uploading={uploadingThumbnail}
        onSelectFile={
          !disabled && isFormEdit
            ? async file => {
                  if (!form) return
                  setThumbnailPreviewBlobUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev)
                    return null
                  })
                  const blobUrl = URL.createObjectURL(file)
                  setThumbnailPreviewBlobUrl(blobUrl)
                  setUploadingThumbnail(true)
                  const task = (async () => {
                    try {
                      const owner = resolveProgramMediaThumbnailUploadOwner(program)
                      const uploaded = await uploadAdminFileMaybeMock({
                        file,
                        owner,
                        waitUntilAvailable: true,
                      })
                      rememberProgramThumbnailPreviewBlob(uploaded.fileObjectId, file)
                      if (hasProgramMediaTarget(program)) {
                        await putProgramMediaThumbnail(program, uploaded.fileObjectId)
                      }
                      if (isUjatTypedRecruitmentDraftProgram(program) && form) {
                        form.setValue('recruitmentThumbnailFileObjectId', uploaded.fileObjectId, {
                          shouldDirty: true,
                        })
                        form.setValue('recruitmentThumbnailFileName', file.name, {
                          shouldDirty: true,
                        })
                      } else {
                        applyLiveRecruitmentThumbnailOverlay(
                          program,
                          uploaded.fileObjectId,
                          file.name
                        )
                      }
                      let previewUrl = blobUrl
                      try {
                        previewUrl = await loadProgramThumbnailPreviewUrl(uploaded.fileObjectId)
                        if (previewUrl !== blobUrl) URL.revokeObjectURL(blobUrl)
                      } catch {
                        previewUrl = blobUrl
                      }
                      setLinkedThumbnail(prev => {
                        if (prev?.url !== previewUrl) revokeBlobUrl(prev?.url)
                        return { url: previewUrl, fileName: file.name }
                      })
                      setThumbnailPreviewBlobUrl(null)
                    } catch (error) {
                      URL.revokeObjectURL(blobUrl)
                      setThumbnailPreviewBlobUrl(null)
                      showAlert({
                        title: '안내',
                        content: extractApiErrorMessage(axiosErrorData(error), {
                          fallback: '대표 이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
                        }),
                      })
                    } finally {
                      setUploadingThumbnail(false)
                    }
                  })()
                  trackRecruitDetailMediaUpload(task)
                  await task
                }
            : undefined
        }
        onRemove={
          !disabled && isFormEdit
            ? () => {
                  setThumbnailPreviewBlobUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev)
                    return null
                  })
                  if (form) {
                    form.setValue('keyVisualImage', undefined)
                    form.setValue('posterImage', undefined)
                  }
                  setLinkedThumbnail(prev => {
                    revokeBlobUrl(prev?.url)
                    return null
                  })
                  if (isUjatTypedRecruitmentDraftProgram(program) && form) {
                    form.setValue('recruitmentThumbnailFileObjectId', undefined, {
                      shouldDirty: true,
                    })
                    form.setValue('recruitmentThumbnailFileName', undefined, {
                      shouldDirty: true,
                    })
                  } else {
                    applyLiveRecruitmentThumbnailOverlay(program, null)
                  }
                  if (hasProgramMediaTarget(program)) {
                    void putProgramMediaThumbnail(program, null).catch(() => {
                      showAlert({
                        title: '안내',
                        content: '대표 이미지를 지우지 못했습니다. 잠시 후 다시 시도해 주세요.',
                      })
                    })
                  }
                }
            : undefined
        }
      />
    </div>
  )

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="썸네일 이미지"
        required={showRequiredStar}
        labelWidth={DETAIL_INFO_FIELD_LABEL_WIDTH}
        fullRow
        view={renderThumbnail(true)}
        edit={renderThumbnail(false)}
      />
    </DetailInfoForm.Row>
  )
}

function AttachmentDetailField({
  program,
  isEditMode,
  isFormEdit,
  form,
  displayFileNames,
  guideLines,
  emptyReadDisplay = 'mock-default',
  onNamesChange,
  currentTotalBytes = 0,
  onTotalBytesChange,
  accept = RECRUIT_DETAIL_ATTACHMENT_ACCEPT,
  maxFileCount,
  maxTotalBytes = 0,
}: {
  program: Program
  isEditMode: boolean
  isFormEdit: boolean
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  displayFileNames: string[]
  guideLines: string[]
  emptyReadDisplay?: DetailInfoEmptyReadDisplay
  onNamesChange?: (names: string[]) => void
  currentTotalBytes?: number
  onTotalBytesChange?: (bytes: number) => void
  /** 허용 확장자. 생략 시 기존 모집 상세 기본값 */
  accept?: string
  /** 첨부 개수 상한. 생략 시 개수 검사 생략(기존) */
  maxFileCount?: number
  /** 첨부 합계 상한(byte). `0`(기본)이면 합계 검사 생략(기존) */
  maxTotalBytes?: number
}) {
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const showEmptyDash =
    !isEditMode && emptyReadDisplay === 'dash' && displayFileNames.length === 0

  const attachmentField = (
    <>
      <FileSelectField
        accept={accept}
        multiple
        disabled={!isEditMode || uploading}
        uploading={uploading}
        className={isEditMode ? 'file-select-field--edit' : ''}
        fileNames={displayFileNames}
        guideLines={guideLines}
        currentTotalBytes={currentTotalBytes}
        maxTotalBytes={maxTotalBytes}
        maxFileBytes={RECRUIT_DETAIL_FILE_MAX_BYTES}
        sizeExceededMessage={file =>
          file != null || maxTotalBytes <= 0
            ? RECRUIT_DETAIL_FILE_SIZE_EXCEEDED_MESSAGE
            : GENERAL_ATTACHMENT_TOTAL_EXCEEDED_MESSAGE
        }
        onFilesChange={
          isFormEdit
            ? async files => {
                    if (
                      maxFileCount != null &&
                      displayFileNames.length + files.length > maxFileCount
                    ) {
                      setAttachmentError(GENERAL_ATTACHMENT_COUNT_EXCEEDED_MESSAGE)
                      return
                    }
                    const owner = resolveProgramMediaAttachmentUploadOwner(program)
                    setUploading(true)
                    try {
                      const uploadedIds: number[] = []
                      for (const file of files) {
                        const uploaded = await uploadAdminFileMaybeMock({ file, owner })
                        uploadedIds.push(uploaded.fileObjectId)
                      }
                      if (uploadedIds.length === 0) return
                      if (!hasProgramMediaTarget(program)) {
                        const previous = form!.getValues('attachmentFileNames') ?? []
                        const names = [...previous, ...files.map(file => file.name)]
                        form!.setValue('attachmentFileNames', names)
                        if (isUjatTypedRecruitmentDraftProgram(program)) {
                          const previousIds =
                            form!.getValues('recruitmentAttachmentFileObjectIds') ?? []
                          form!.setValue(
                            'recruitmentAttachmentFileObjectIds',
                            [...previousIds, ...uploadedIds],
                            { shouldDirty: true }
                          )
                        }
                        onNamesChange?.(names)
                        setAttachmentError(null)
                        return
                      }
                      const existing = await fetchProgramMediaAttachments(program).catch(() => [])
                      const existingIds = existing
                        .map(item => item.fileObjectId)
                        .filter((id): id is number => typeof id === 'number' && id > 0)
                      const linked = await putProgramMediaAttachments(program, [
                        ...existingIds,
                        ...uploadedIds,
                      ])
                      const names = linked
                        .map(item => item.originalFileName?.trim() || '')
                        .filter(Boolean)
                      form!.setValue('attachmentFileNames', names)
                      onNamesChange?.(names)
                      onTotalBytesChange?.(
                        linked.reduce((sum, item) => sum + (item.fileSize ?? 0), 0)
                      )
                      setAttachmentError(null)
                    } catch (error) {
                      setAttachmentError(
                        extractApiErrorMessage(axiosErrorData(error), {
                          fallback: '첨부파일을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
                        })
                      )
                    } finally {
                      setUploading(false)
                    }
                  }
                : undefined
            }
            onRemoveFile={
              isFormEdit
                ? index => {
                    if (!hasProgramMediaTarget(program)) {
                      const list = form!.getValues('attachmentFileNames') ?? []
                      const next = list.filter((_, i) => i !== index)
                      form!.setValue('attachmentFileNames', next)
                      if (isUjatTypedRecruitmentDraftProgram(program)) {
                        const ids = form!.getValues('recruitmentAttachmentFileObjectIds') ?? []
                        form!.setValue(
                          'recruitmentAttachmentFileObjectIds',
                          ids.filter((_, i) => i !== index),
                          { shouldDirty: true }
                        )
                      }
                      onNamesChange?.(next)
                      return
                    }
                    void (async () => {
                      const existing = await fetchProgramMediaAttachments(program).catch(() => [])
                      const remainingIds = existing
                        .map(item => item.fileObjectId)
                        .filter((id): id is number => typeof id === 'number' && id > 0)
                        .filter((_, i) => i !== index)
                      try {
                        const linked = await putProgramMediaAttachments(program, remainingIds)
                        const names = linked
                          .map(item => item.originalFileName?.trim() || '')
                          .filter(Boolean)
                        form!.setValue('attachmentFileNames', names)
                        onNamesChange?.(names)
                        onTotalBytesChange?.(
                          linked.reduce((sum, item) => sum + (item.fileSize ?? 0), 0)
                        )
                        setAttachmentError(null)
                      } catch (error) {
                        setAttachmentError(
                          extractApiErrorMessage(axiosErrorData(error), {
                            fallback: '첨부파일을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
                          })
                        )
                      }
                    })()
                  }
            : undefined
        }
      />
      {attachmentError != null ? (
        <p className="text-area-field-row__field-error" role="alert">
          {attachmentError}
        </p>
      ) : null}
    </>
  )

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="첨부 파일"
        labelWidth={DETAIL_INFO_FIELD_LABEL_WIDTH}
        fullRow
        view={showEmptyDash ? '-' : attachmentField}
        edit={attachmentField}
      />
    </DetailInfoForm.Row>
  )
}

export function ProjectInfoDetailInfoSection({ children }: { children: ReactNode }) {
  return <div className="program-detail-fullpage-modal__info-tab-block">{children}</div>
}

export interface DetailInfoSectionProps {
  program: Program
  isEditMode?: boolean
  /** 수정 모드일 때만 전달 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
  /** 수정 모드에서 저장 시 추가 내용 HTML 수집용 getter 등록 */
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
  /** 참여자 정보 탭 등에서 상세 정보 상단에 썸네일 이미지 행 노출 */
  showThumbnail?: boolean
  /** 참여자 모집 상세 정보에서 모집 방법(applicationMethod) 행 노출 */
  showRecruitmentMethod?: boolean
  recruitmentMethodLabel?: string
  sectionTitle?: string
  sectionDescription?: string | null
  /** UJAT 프로그램 상세 — title만, description·기본 안내 문구 미노출 */
  sectionTitleOnly?: boolean
  /** 조회 모드 공란 표시 — UJAT: 관리자 상세는 '-' */
  emptyReadDisplay?: DetailInfoEmptyReadDisplay
  /** 프로그램 설명 등 단줄 필드 — 기본 `input`(h36). 멀티라인이 필요할 때만 `textarea` */
  textFieldControl?: 'textarea' | 'input'
  /** 상위 단락 타이틀이 있을 때 DetailInfoForm `h2` 헤더 숨김 */
  hideFormHeader?: boolean
  /** `general`: 일반 프로그램 모집 정보 시안(파일 형식·개수·안내 문구). 생략 시 기존 동작 */
  variant?: DetailInfoSectionVariant
}

export function DetailInfoSection({
  program,
  isEditMode = false,
  form,
  onRegisterGetAdditionalContentHtml,
  showThumbnail = false,
  showRecruitmentMethod = false,
  recruitmentMethodLabel = '모집 방법',
  sectionTitle,
  sectionDescription,
  sectionTitleOnly = false,
  emptyReadDisplay = 'mock-default',
  textFieldControl = 'input',
  hideFormHeader = false,
  variant = 'default',
}: DetailInfoSectionProps) {
  const variantCopy = resolveDetailInfoVariantCopy(variant)
  const {
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    setLinkedThumbnail,
    isFormEdit,
    displayFileNames,
    linkedAttachmentTotalBytes,
    setLinkedAttachmentTotalBytes,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
    setLinkedAttachmentNames,
  } = useDetailInfoEditorBlock(
    program,
    isEditMode,
    form,
    onRegisterGetAdditionalContentHtml
  )

  const headerDescription = !isFormEdit
    ? undefined
    : sectionTitleOnly && !sectionDescription
      ? undefined
      : (sectionDescription ??
        variantCopy.sectionDescription ??
        '필수 정보가 아닌 항목이 공란인 경우, 상세 페이지에서 항목 미노출 됩니다.')

  return (
    <>
      <DetailInfoForm
        title={sectionTitle ?? '상세 정보'}
        description={headerDescription}
        descriptionPlacement="below"
        hideHeader={hideFormHeader}
        mode={isFormEdit ? 'edit' : 'view'}
        className="project-info-detail-info-section__frame"
      >
        {showThumbnail ? (
          <ThumbnailImageField
            program={program}
            isEditMode={isEditMode}
            isFormEdit={isFormEdit}
            form={f}
            uploadingThumbnail={uploadingThumbnail}
            setUploadingThumbnail={setUploadingThumbnail}
            setThumbnailPreviewBlobUrl={setThumbnailPreviewBlobUrl}
            setLinkedThumbnail={setLinkedThumbnail}
            displayThumbnailUrl={displayThumbnailUrl}
            thumbnailFilename={thumbnailFilename}
            guideLines={variantCopy.thumbnailGuideLines}
            showRequiredStar={false}
          />
        ) : null}
        <ProgramDetailTextAreaField
          label="프로그램 설명"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          name="description"
          placeholder="프로그램 설명"
          control={textFieldControl}
          readContent={resolveTextReadContent(
            program.description,
            emptyReadDisplay,
            DEFAULT_PROGRAM_DESCRIPTION
          )}
        />
        <RichTextDetailField
          label="모집 안내"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="recruitmentGuide"
          placeholder="모집 안내"
          readContent={resolveTextReadContent(
            program.recruitmentGuide,
            emptyReadDisplay,
            DEFAULT_RECRUITMENT_GUIDE
          )}
        />
        {showRecruitmentMethod ? (
          <RichTextDetailField
            label={recruitmentMethodLabel}
            showRequiredStar={false}
            isFormEdit={isFormEdit}
            form={f}
            program={program}
            name="applicationMethod"
            placeholder={variantCopy.applicationMethodPlaceholder ?? recruitmentMethodLabel}
            readContent={program.applicationMethod ?? '-'}
          />
        ) : null}
        <RichTextDetailField
          label="학습 지원 내용"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="learningSupportContent"
          placeholder={variantCopy.learningSupportPlaceholder ?? '학습 지원 내용'}
          readContent={resolveTextReadContent(
            program.learningSupportContent,
            emptyReadDisplay,
            DEFAULT_LEARNING_SUPPORT
          )}
        />
        <RichTextDetailField
          label="추가 내용"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="additionalContentHtml"
          placeholder="내용을 작성하세요"
          readContent={additionalContentReadContent(program, emptyReadDisplay)}
        />
        <AttachmentDetailField
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          displayFileNames={displayFileNames}
          guideLines={variantCopy.attachmentGuideLines}
          emptyReadDisplay={emptyReadDisplay}
          onNamesChange={setLinkedAttachmentNames}
          currentTotalBytes={linkedAttachmentTotalBytes}
          onTotalBytesChange={setLinkedAttachmentTotalBytes}
          accept={variantCopy.attachmentAccept}
          maxFileCount={variantCopy.attachmentMaxCount}
          maxTotalBytes={variantCopy.attachmentMaxTotalBytes}
        />
      </DetailInfoForm>
    </>
  )
}

export interface InstructorDetailInfoSectionProps {
  program: Program
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
  emptyReadDisplay?: DetailInfoEmptyReadDisplay
  /** `general`: 일반 프로그램 모집 정보 시안(파일 형식·개수·안내 문구). 생략 시 기존 동작 */
  variant?: DetailInfoSectionVariant
}

export function InstructorDetailInfoSection({
  program,
  isEditMode = false,
  form,
  onRegisterGetAdditionalContentHtml,
  emptyReadDisplay = 'mock-default',
  variant = 'default',
}: InstructorDetailInfoSectionProps) {
  const variantCopy = resolveDetailInfoVariantCopy(variant)
  const {
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    setLinkedThumbnail,
    isFormEdit,
    displayFileNames,
    linkedAttachmentTotalBytes,
    setLinkedAttachmentTotalBytes,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
    setLinkedAttachmentNames,
  } = useDetailInfoEditorBlock(
    program,
    isEditMode,
    form,
    onRegisterGetAdditionalContentHtml
  )

  const applicationMethod = resolveTextReadContent(
    program.applicationMethod,
    emptyReadDisplay,
    '-'
  )
  const otherNotes = resolveTextReadContent(program.otherNotes, emptyReadDisplay, '-')
  const headerDescription = isFormEdit
    ? (variantCopy.sectionDescription ?? '공란인 경우, 상세 페이지에서 항목 미노출 됩니다.')
    : undefined

  return (
    <>
      <DetailInfoForm
        title="상세 정보"
        description={headerDescription}
        descriptionPlacement="below"
        mode={isFormEdit ? 'edit' : 'view'}
        className="project-info-detail-info-section__frame"
      >
        <ThumbnailImageField
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          uploadingThumbnail={uploadingThumbnail}
          setUploadingThumbnail={setUploadingThumbnail}
          setThumbnailPreviewBlobUrl={setThumbnailPreviewBlobUrl}
          setLinkedThumbnail={setLinkedThumbnail}
          displayThumbnailUrl={displayThumbnailUrl}
          thumbnailFilename={thumbnailFilename}
          guideLines={variantCopy.thumbnailGuideLines}
          showRequiredStar={false}
        />
        <ProgramDetailTextAreaField
          label="프로그램 설명"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          name="description"
          placeholder="프로그램 설명"
          readContent={resolveTextReadContent(
            program.description,
            emptyReadDisplay,
            DEFAULT_PROGRAM_DESCRIPTION
          )}
        />
        <RichTextDetailField
          label="모집 안내"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="recruitmentGuide"
          placeholder="모집 안내"
          readContent={resolveTextReadContent(
            program.recruitmentGuide,
            emptyReadDisplay,
            DEFAULT_RECRUITMENT_GUIDE
          )}
        />
        <RichTextDetailField
          label="지원 방법"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="applicationMethod"
          placeholder={variantCopy.applicationMethodPlaceholder ?? '지원 방법'}
          readContent={applicationMethod}
        />
        <RichTextDetailField
          label="추가 내용"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="additionalContentHtml"
          placeholder="내용을 작성하세요"
          readContent={additionalContentReadContent(program, emptyReadDisplay)}
        />
        <RichTextDetailField
          label="기타사항"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="otherNotes"
          placeholder="기타사항"
          readContent={otherNotes}
        />
        <AttachmentDetailField
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          displayFileNames={displayFileNames}
          guideLines={variantCopy.attachmentGuideLines}
          emptyReadDisplay={emptyReadDisplay}
          onNamesChange={setLinkedAttachmentNames}
          currentTotalBytes={linkedAttachmentTotalBytes}
          onTotalBytesChange={setLinkedAttachmentTotalBytes}
          accept={variantCopy.attachmentAccept}
          maxFileCount={variantCopy.attachmentMaxCount}
          maxTotalBytes={variantCopy.attachmentMaxTotalBytes}
        />
      </DetailInfoForm>
    </>
  )
}

export interface VolunteerDetailInfoSectionProps {
  program: Program
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
  sectionTitle?: string
  sectionDescription?: string | null
  sectionTitleOnly?: boolean
  emptyReadDisplay?: DetailInfoEmptyReadDisplay
  hideFormHeader?: boolean
  /** `general`: 일반 프로그램 모집 정보 시안(파일 형식·개수·안내 문구). 생략 시 기존 동작 */
  variant?: DetailInfoSectionVariant
}

export function VolunteerDetailInfoSection({
  program,
  isEditMode = false,
  form,
  onRegisterGetAdditionalContentHtml,
  sectionTitle,
  sectionDescription,
  sectionTitleOnly = false,
  emptyReadDisplay = 'mock-default',
  hideFormHeader = false,
  variant = 'default',
}: VolunteerDetailInfoSectionProps) {
  const variantCopy = resolveDetailInfoVariantCopy(variant)
  const {
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    setLinkedThumbnail,
    isFormEdit,
    displayFileNames,
    linkedAttachmentTotalBytes,
    setLinkedAttachmentTotalBytes,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
    setLinkedAttachmentNames,
  } = useDetailInfoEditorBlock(
    program,
    isEditMode,
    form,
    onRegisterGetAdditionalContentHtml
  )

  const applicationMethod = resolveTextReadContent(
    program.applicationMethod,
    emptyReadDisplay,
    '-'
  )
  const otherNotes = resolveTextReadContent(program.otherNotes, emptyReadDisplay, '-')
  const headerDescription = !isFormEdit
    ? undefined
    : sectionTitleOnly
      ? undefined
      : (sectionDescription ??
        variantCopy.sectionDescription ??
        '공란인 경우, 상세 페이지에서 항목 미노출 됩니다.')

  return (
    <>
      <DetailInfoForm
        title={sectionTitle ?? '상세 정보'}
        description={headerDescription}
        descriptionPlacement="below"
        hideHeader={hideFormHeader}
        mode={isFormEdit ? 'edit' : 'view'}
        className="project-info-detail-info-section__frame"
      >
        <ThumbnailImageField
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          uploadingThumbnail={uploadingThumbnail}
          setUploadingThumbnail={setUploadingThumbnail}
          setThumbnailPreviewBlobUrl={setThumbnailPreviewBlobUrl}
          setLinkedThumbnail={setLinkedThumbnail}
          displayThumbnailUrl={displayThumbnailUrl}
          thumbnailFilename={thumbnailFilename}
          guideLines={variantCopy.thumbnailGuideLines}
          showRequiredStar={false}
        />
        <ProgramDetailTextAreaField
          label="프로그램 설명"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          name="description"
          placeholder="프로그램 설명"
          readContent={resolveTextReadContent(
            program.description,
            emptyReadDisplay,
            DEFAULT_PROGRAM_DESCRIPTION
          )}
        />
        <RichTextDetailField
          label="모집 안내"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="recruitmentGuide"
          placeholder="모집 안내"
          readContent={resolveTextReadContent(
            program.recruitmentGuide,
            emptyReadDisplay,
            DEFAULT_RECRUITMENT_GUIDE
          )}
        />
        <RichTextDetailField
          label="지원 방법"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="applicationMethod"
          placeholder={variantCopy.applicationMethodPlaceholder ?? '지원 방법'}
          readContent={applicationMethod}
        />
        <RichTextDetailField
          label="추가 내용"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="additionalContentHtml"
          placeholder="내용을 작성하세요"
          readContent={additionalContentReadContent(program, emptyReadDisplay)}
        />
        <RichTextDetailField
          label="기타사항"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          program={program}
          name="otherNotes"
          placeholder="기타사항"
          readContent={otherNotes}
        />
        <AttachmentDetailField
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          displayFileNames={displayFileNames}
          guideLines={variantCopy.attachmentGuideLines}
          emptyReadDisplay={emptyReadDisplay}
          onNamesChange={setLinkedAttachmentNames}
          currentTotalBytes={linkedAttachmentTotalBytes}
          onTotalBytesChange={setLinkedAttachmentTotalBytes}
          accept={variantCopy.attachmentAccept}
          maxFileCount={variantCopy.attachmentMaxCount}
          maxTotalBytes={variantCopy.attachmentMaxTotalBytes}
        />
      </DetailInfoForm>
    </>
  )
}
