/**
 * 프로그램 상세 정보 / 강사·봉사자 정보 탭 — 상세 정보 섹션 통합
 * - ProjectInfoDetailInfoSection: 풀페이지 모달 내 상세 블록 래퍼
 * - DetailInfoSection / InstructorDetailInfoSection / VolunteerDetailInfoSection
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Image } from 'antd'
import type { Program } from '@/types/domain'
import { Controller } from 'react-hook-form'
import type { ControllerRenderProps, FieldPath, UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { TextAreaFieldRow } from '@/shared/ui/text-area-field-row'
import {
  parseFileObjectId,
  programInlineImageOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import { loadProgramThumbnailPreviewUrl } from '@/features/program/shared/api/program-thumbnail'
import {
  fetchProgramMediaAttachments,
  fetchProgramMediaThumbnail,
  hasProgramMediaTarget,
  programMediaAttachmentOwner,
  programMediaThumbnailOwner,
  putProgramMediaAttachments,
  putProgramMediaThumbnail,
} from '@/features/program/shared/api/program-media-target'
import { useCmsAlert } from '@/shared/ui'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { useTemplateEditor } from '@/features/template/hooks/use-template-editor'
import { RichTextEditor, RichTextViewer } from '@/shared/rich-text'
import {
  DEFAULT_ADDITIONAL_HTML,
  DEFAULT_LEARNING_SUPPORT,
  DEFAULT_PROGRAM_DESCRIPTION,
  DEFAULT_RECRUITMENT_GUIDE,
  getThumbnailFilename,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { ProgramThumbnailPlaceholder } from '@/features/program/shared/ui/program-thumbnail-placeholder'
import './project-info-detail-info-section.css'

/** 참여자 정보 탭 등 파일 선택(FileSelectField) 우측 안내 — 썸네일·첨부 공통 */
const THUMBNAIL_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다. / 가로 사이즈 500px 권장, 세로 사이즈 무관',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const ATTACHMENT_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

export type DetailInfoEmptyReadDisplay = 'mock-default' | 'dash'

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

/** GET attachments API 결과 + program/상세 JSON fallback (빈 API 응답이 이름을 덮어쓰지 않게) */
function resolveAttachmentFileNamesForDisplay({
  isFormEdit,
  formFileNames,
  linkedAttachmentNames,
  programFallback,
}: {
  isFormEdit: boolean
  formFileNames: string[] | undefined
  linkedAttachmentNames: string[] | null
  programFallback: string[] | undefined
}): string[] {
  const fallback = normalizeAttachmentFileNames(programFallback)
  if (isFormEdit) {
    return normalizeAttachmentFileNames(formFileNames)
  }
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
    return <div className={className}>{content}</div>
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
  const { editor, editorMinHeight, getHTML } = useNoticeWysiwygEditor(true, value, resetKey, {
    placeholder,
    contentFormat: 'html',
    height: '100px',
    fileUploadOwner: owner,
  })

  useEffect(() => {
    if (editor == null) return
    const sync = () => {
      if (editor.isDestroyed) return
      field.onChange(getHTML())
    }
    editor.on('update', sync)
    return () => {
      sync()
      if (!editor.isDestroyed) editor.off('update', sync)
    }
  }, [editor, field, getHTML])

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

function RichTextFieldRow({
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
    <tr>
      <th>
        {label}
        {showRequiredStar ? <span className="text-area-field-row__required">*</span> : null}
      </th>
      <td>
        {isFormEdit && form ? (
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
        ) : (
          <RichTextReadContent
            content={readContent}
            className="text-area-field-row__content-block"
          />
        )}
      </td>
    </tr>
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

function useDetailInfoEditorBlock(
  program: Program,
  isEditMode: boolean,
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined,
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void,
  emptyReadDisplay: DetailInfoEmptyReadDisplay = 'mock-default'
) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [thumbnailPreviewBlobUrl, setThumbnailPreviewBlobUrl] = useState<string | null>(null)
  const [linkedThumbnail, setLinkedThumbnail] = useState<{
    url: string
    fileName: string
  } | null>(null)

  useEffect(() => {
    if (!isEditMode) {
      setEditorOpen(false)
      setThumbnailPreviewBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    const t = setTimeout(() => setEditorOpen(true), 500)
    return () => clearTimeout(t)
  }, [isEditMode])

  const additionalContentHtml = resolveAdditionalContentHtml(program, emptyReadDisplay)
  const inlineImageOwner = programInlineImageOwner(parseFileObjectId(program.id))

  const { editor, editorMinHeight, getHTML } = useTemplateEditor(
    editorOpen,
    '',
    additionalContentHtml,
    inlineImageOwner
  )
  const getterRef = useRef<() => string>(() => '')

  useEffect(() => {
    getterRef.current = () => (editorOpen ? getHTML() : additionalContentHtml)
  }, [editorOpen, getHTML, additionalContentHtml])

  useEffect(() => {
    if (!isEditMode) return
    onRegisterGetAdditionalContentHtml?.(() => getterRef.current())
    return () => {
      onRegisterGetAdditionalContentHtml?.(() => '')
    }
  }, [isEditMode, onRegisterGetAdditionalContentHtml])

  const isFormEdit = Boolean(isEditMode && form)
  const [linkedAttachmentNames, setLinkedAttachmentNames] = useState<string[] | null>(null)
  const displayFileNames = resolveAttachmentFileNamesForDisplay({
    isFormEdit,
    formFileNames: isFormEdit ? form!.watch('attachmentFileNames') : undefined,
    linkedAttachmentNames,
    programFallback: program.attachmentFileNames,
  })

  useEffect(() => {
    if (!hasProgramMediaTarget(program)) {
      setLinkedAttachmentNames(null)
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
        if (form && names.length > 0) {
          form.setValue('attachmentFileNames', names, { shouldDirty: false })
        }
      })
      .catch(() => {
        if (!cancelled) setLinkedAttachmentNames(null)
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
    if (!hasProgramMediaTarget(program)) {
      setLinkedThumbnail(null)
      return
    }
    let cancelled = false
    let createdUrl: string | null = null
    void (async () => {
      const thumbnail = await fetchProgramMediaThumbnail(program)
      if (cancelled || thumbnail.fileObjectId == null) {
        if (!cancelled) {
          setLinkedThumbnail(prev => {
            revokeBlobUrl(prev?.url)
            return null
          })
        }
        return
      }
      const nextUrl = await loadProgramThumbnailPreviewUrl(thumbnail.fileObjectId)
      if (cancelled) {
        revokeBlobUrl(nextUrl)
        return
      }
      createdUrl = nextUrl
      setLinkedThumbnail(prev => {
        if (prev?.url !== nextUrl) revokeBlobUrl(prev?.url)
        return {
          url: nextUrl,
          fileName: thumbnail.originalFileName?.trim() || '',
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
  }, [program.id, program.activeRecruitmentId, activeRowThumbnailId])

  const legacyThumbnailUrl = readableThumbnailUrl(
    (isFormEdit && form
      ? form.watch('keyVisualImage') || form.watch('posterImage')
      : undefined) ||
      program.keyVisualImage ||
      program.posterImage
  )
  const displayThumbnailUrl =
    thumbnailPreviewBlobUrl || linkedThumbnail?.url || legacyThumbnailUrl
  const thumbnailFilename =
    linkedThumbnail?.fileName ||
    (legacyThumbnailUrl ? getThumbnailFilename(legacyThumbnailUrl) : '')

  return {
    editorOpen,
    editor,
    editorMinHeight,
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    setLinkedThumbnail,
    isFormEdit,
    displayFileNames,
    displayThumbnailUrl,
    thumbnailFilename,
    form,
  }
}

function DetailInfoTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="program-detail-info-tab__table-wrapper">
      <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
        <colgroup>
          <col style={{ width: '200px' }} />
          <col />
        </colgroup>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function ThumbnailImageRow({
  program,
  isEditMode,
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
  return (
    <tr>
      <th>
        썸네일 이미지
        {showRequiredStar ? <span className="program-detail-info-tab__required">*</span> : null}
      </th>
      <td className="program-detail-info-tab__cell--thumbnail">
        <div className="program-detail-info-tab__thumbnail-wrap">
          <div className="program-detail-info-tab__thumbnail-row">
            {displayThumbnailUrl ? (
              <Image
                src={displayThumbnailUrl}
                alt={program.title}
                className="program-detail-info-tab__thumbnail-img"
                preview={{ mask: '확대 보기' }}
              />
            ) : (
              <ProgramThumbnailPlaceholder />
            )}
            <div className="program-detail-info-tab__thumbnail-meta">
              <FileSelectField
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple={false}
                disabled={!isEditMode || uploadingThumbnail}
                buttonLabel={uploadingThumbnail ? '업로드 중…' : '파일 선택'}
                uploading={uploadingThumbnail}
                className={
                  isEditMode
                    ? 'program-detail-info-tab__file-select file-select-field--edit'
                    : 'program-detail-info-tab__file-select'
                }
                fileNames={thumbnailFilename ? [thumbnailFilename] : []}
                guideLines={guideLines}
                onFilesChange={
                  isFormEdit
                    ? async files => {
                        const file = files[0]
                        if (!file || !form) return
                        setThumbnailPreviewBlobUrl(prev => {
                          if (prev) URL.revokeObjectURL(prev)
                          return null
                        })
                        const blobUrl = URL.createObjectURL(file)
                        setThumbnailPreviewBlobUrl(blobUrl)
                        setUploadingThumbnail(true)
                        try {
                          const owner = programMediaThumbnailOwner(program)
                          if (owner == null) {
                            throw new Error('프로그램 번호가 없어 대표 이미지를 저장할 수 없습니다.')
                          }
                          const uploaded = await uploadAdminFileMaybeMock({ file, owner })
                          await putProgramMediaThumbnail(program, uploaded.fileObjectId)
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
                        } catch {
                          URL.revokeObjectURL(blobUrl)
                          setThumbnailPreviewBlobUrl(null)
                          showAlert({
                            title: '안내',
                            content: '대표 이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
                          })
                        } finally {
                          setUploadingThumbnail(false)
                        }
                      }
                    : undefined
                }
                onRemoveFile={
                  isFormEdit
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
          </div>
        </div>
      </td>
    </tr>
  )
}

function AdditionalContentRow({
  program,
  isEditMode,
  isFormEdit,
  editorOpen,
  editor,
  editorMinHeight,
  showRequiredOnTh,
  emptyReadDisplay = 'mock-default',
}: {
  program: Program
  isEditMode: boolean
  isFormEdit: boolean
  editorOpen: boolean
  editor: ReturnType<typeof useTemplateEditor>['editor']
  editorMinHeight: string
  showRequiredOnTh: boolean
  emptyReadDisplay?: DetailInfoEmptyReadDisplay
}) {
  const additionalEmpty =
    emptyReadDisplay === 'dash' ? isAdditionalContentEmpty(program) : false

  return (
    <tr>
      <th>
        추가 내용
        {showRequiredOnTh && isFormEdit ? (
          <span className="program-detail-info-tab__required">*</span>
        ) : null}
      </th>
      <td>
        {isEditMode ? (
          <div className="program-detail-info-tab__additional-content program-detail-info-tab__additional-content--edit">
            {editorOpen && editor ? (
              <div className="program-detail-info-tab__editor-host">
                <RichTextEditor
                  editor={editor}
                  minHeight={editorMinHeight}
                  fileUploadOwner={programInlineImageOwner(parseFileObjectId(program.id))}
                />
              </div>
            ) : (
              <div className="program-detail-info-tab__editor-placeholder">로딩 중…</div>
            )}
          </div>
        ) : additionalEmpty ? (
          '-'
        ) : (
          <div className="program-detail-info-tab__additional-content">
            <RichTextViewer
              content={resolveAdditionalContentHtml(program, emptyReadDisplay)}
              contentFormat="html"
              maxHeight="none"
              className="program-detail-info-tab__editor-content"
            />
          </div>
        )}
      </td>
    </tr>
  )
}

function AttachmentRowStandard({
  program,
  isEditMode,
  isFormEdit,
  form,
  displayFileNames,
  guideLines,
  emptyReadDisplay = 'mock-default',
}: {
  program: Program
  isEditMode: boolean
  isFormEdit: boolean
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  displayFileNames: string[]
  guideLines: string[]
  emptyReadDisplay?: DetailInfoEmptyReadDisplay
}) {
  const [uploading, setUploading] = useState(false)
  const showEmptyDash =
    !isEditMode && emptyReadDisplay === 'dash' && displayFileNames.length === 0

  return (
    <tr>
      <th>첨부 파일</th>
      <td>
        {showEmptyDash ? (
          '-'
        ) : (
          <FileSelectField
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            multiple
            disabled={!isEditMode || uploading}
            uploading={uploading}
            buttonLabel="파일 선택"
            className={isEditMode ? 'file-select-field--edit' : ''}
            fileNames={displayFileNames}
            guideLines={guideLines}
            onFilesChange={
              isFormEdit
                ? async files => {
                    const owner = programMediaAttachmentOwner(program)
                    if (owner == null) return
                    setUploading(true)
                    try {
                      const uploadedIds: number[] = []
                      for (const file of files) {
                        const uploaded = await uploadAdminFileMaybeMock({ file, owner })
                        uploadedIds.push(uploaded.fileObjectId)
                      }
                      if (uploadedIds.length === 0) return
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
                      form!.setValue(
                        'attachmentFileNames',
                        list.filter((_, i) => i !== index)
                      )
                      return
                    }
                    void (async () => {
                      const existing = await fetchProgramMediaAttachments(program).catch(() => [])
                      const remainingIds = existing
                        .map(item => item.fileObjectId)
                        .filter((id): id is number => typeof id === 'number' && id > 0)
                        .filter((_, i) => i !== index)
                      const linked = await putProgramMediaAttachments(program, remainingIds).catch(
                        () => [] as Awaited<ReturnType<typeof putProgramMediaAttachments>>
                      )
                      const names = linked
                        .map(item => item.originalFileName?.trim() || '')
                        .filter(Boolean)
                      form!.setValue('attachmentFileNames', names)
                    })()
                  }
                : undefined
            }
          />
        )}
      </td>
    </tr>
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
  /** 프로그램 설명·모집 안내 등 — UJAT 참여 기관 모집은 `input` */
  textFieldControl?: 'textarea' | 'input'
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
  textFieldControl = 'textarea',
}: DetailInfoSectionProps) {
  const {
    editorOpen,
    editor,
    editorMinHeight,
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    setLinkedThumbnail,
    isFormEdit,
    displayFileNames,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
  } = useDetailInfoEditorBlock(
    program,
    isEditMode,
    form,
    onRegisterGetAdditionalContentHtml,
    emptyReadDisplay
  )

  const headerDescription = !isFormEdit
    ? undefined
    : sectionTitleOnly && !sectionDescription
      ? undefined
      : (sectionDescription ??
        '필수 정보가 아닌 항목이 공란인 경우, 상세 페이지에서 항목 미노출 됩니다.')

  return (
    <>
      <DetailInfoForm
        title={sectionTitle ?? '상세 정보'}
        description={headerDescription}
        descriptionPlacement="below"
        mode={isFormEdit ? 'edit' : 'view'}
        className="project-info-detail-info-section__frame"
      >
        <DetailInfoTableFrame>
          {showThumbnail && (
            <ThumbnailImageRow
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
              guideLines={THUMBNAIL_GUIDE_LINES}
              showRequiredStar={false}
            />
          )}
          <TextAreaFieldRow
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
          <RichTextFieldRow
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
            <RichTextFieldRow
              label={recruitmentMethodLabel}
              showRequiredStar={false}
              isFormEdit={isFormEdit}
              form={f}
              program={program}
              name="applicationMethod"
              placeholder={recruitmentMethodLabel}
              readContent={program.applicationMethod ?? '-'}
            />
          ) : null}
          <RichTextFieldRow
            label="학습 지원 내용"
            showRequiredStar={false}
            isFormEdit={isFormEdit}
            form={f}
            program={program}
            name="learningSupportContent"
            placeholder="학습 지원 내용"
            readContent={resolveTextReadContent(
              program.learningSupportContent,
              emptyReadDisplay,
              DEFAULT_LEARNING_SUPPORT
            )}
          />
          <AdditionalContentRow
            program={program}
            isEditMode={isEditMode}
            isFormEdit={isFormEdit}
            editorOpen={editorOpen}
            editor={editor}
            editorMinHeight={editorMinHeight}
            showRequiredOnTh={false}
            emptyReadDisplay={emptyReadDisplay}
          />
          <AttachmentRowStandard
            program={program}
            isEditMode={isEditMode}
            isFormEdit={isFormEdit}
            form={f}
            displayFileNames={displayFileNames}
            guideLines={ATTACHMENT_GUIDE_LINES}
            emptyReadDisplay={emptyReadDisplay}
          />
        </DetailInfoTableFrame>
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
}

export function InstructorDetailInfoSection({
  program,
  isEditMode = false,
  form,
  onRegisterGetAdditionalContentHtml,
  emptyReadDisplay = 'mock-default',
}: InstructorDetailInfoSectionProps) {
  const {
    editorOpen,
    editor,
    editorMinHeight,
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    setLinkedThumbnail,
    isFormEdit,
    displayFileNames,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
  } = useDetailInfoEditorBlock(
    program,
    isEditMode,
    form,
    onRegisterGetAdditionalContentHtml,
    emptyReadDisplay
  )

  const applicationMethod = resolveTextReadContent(
    program.applicationMethod,
    emptyReadDisplay,
    '-'
  )
  const otherNotes = resolveTextReadContent(
    program.otherNotes ?? program.oneLineIntroduction,
    emptyReadDisplay,
    '-'
  )
  const headerDescription = isFormEdit
    ? '공란인 경우, 상세 페이지에서 항목 미노출 됩니다.'
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
        <DetailInfoTableFrame>
          <ThumbnailImageRow
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
            guideLines={THUMBNAIL_GUIDE_LINES}
            showRequiredStar={false}
          />
          <TextAreaFieldRow
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
          <RichTextFieldRow
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
          <RichTextFieldRow
            label="지원 방법"
            showRequiredStar={false}
            isFormEdit={isFormEdit}
            form={f}
            program={program}
            name="applicationMethod"
            placeholder="지원 방법"
            readContent={applicationMethod}
          />
          <AdditionalContentRow
            program={program}
            isEditMode={isEditMode}
            isFormEdit={isFormEdit}
            editorOpen={editorOpen}
            editor={editor}
            editorMinHeight={editorMinHeight}
            showRequiredOnTh={false}
            emptyReadDisplay={emptyReadDisplay}
          />
          <RichTextFieldRow
            label="기타사항"
            showRequiredStar={false}
            isFormEdit={isFormEdit}
            form={f}
            program={program}
            name="otherNotes"
            placeholder="기타사항"
            readContent={otherNotes}
          />
          <AttachmentRowStandard
            program={program}
            isEditMode={isEditMode}
            isFormEdit={isFormEdit}
            form={f}
            displayFileNames={displayFileNames}
            guideLines={[
              '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
              '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
            ]}
            emptyReadDisplay={emptyReadDisplay}
          />
        </DetailInfoTableFrame>
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
}: VolunteerDetailInfoSectionProps) {
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const {
    editorOpen,
    editor,
    editorMinHeight,
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    setLinkedThumbnail,
    isFormEdit,
    displayFileNames,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
  } = useDetailInfoEditorBlock(
    program,
    isEditMode,
    form,
    onRegisterGetAdditionalContentHtml,
    emptyReadDisplay
  )

  const applicationMethod = resolveTextReadContent(
    program.applicationMethod,
    emptyReadDisplay,
    '-'
  )
  const otherNotes = resolveTextReadContent(
    program.otherNotes ?? program.oneLineIntroduction,
    emptyReadDisplay,
    '-'
  )
  const headerDescription = !isFormEdit
    ? undefined
    : sectionTitleOnly
      ? undefined
      : (sectionDescription ?? '공란인 경우, 상세 페이지에서 항목 미노출 됩니다.')

  return (
    <>
      <DetailInfoForm
        title={sectionTitle ?? '상세 정보'}
        description={headerDescription}
        descriptionPlacement="below"
        mode={isFormEdit ? 'edit' : 'view'}
        className="project-info-detail-info-section__frame"
      >
        <DetailInfoTableFrame>
          <ThumbnailImageRow
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
            guideLines={THUMBNAIL_GUIDE_LINES}
            showRequiredStar={false}
          />
          <TextAreaFieldRow
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
          <RichTextFieldRow
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
          <RichTextFieldRow
            label="지원 방법"
            showRequiredStar={false}
            isFormEdit={isFormEdit}
            form={f}
            program={program}
            name="applicationMethod"
            placeholder="지원 방법"
            readContent={applicationMethod}
          />
          <AdditionalContentRow
            program={program}
            isEditMode={isEditMode}
            isFormEdit={isFormEdit}
            editorOpen={editorOpen}
            editor={editor}
            editorMinHeight={editorMinHeight}
            showRequiredOnTh={false}
            emptyReadDisplay={emptyReadDisplay}
          />
          <RichTextFieldRow
            label="기타사항"
            showRequiredStar={false}
            isFormEdit={isFormEdit}
            form={f}
            program={program}
            name="otherNotes"
            placeholder="기타사항"
            readContent={otherNotes}
          />
          <tr>
            <th>첨부 파일</th>
            <td>
              {isEditMode ? (
                <FileSelectField
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  multiple
                  disabled={uploadingAttachments}
                  uploading={uploadingAttachments}
                  buttonLabel="파일 선택"
                  className="file-select-field--edit"
                  fileNames={displayFileNames}
                  guideLines={ATTACHMENT_GUIDE_LINES}
                  onFilesChange={
                    isFormEdit
                      ? async files => {
                          const owner = programMediaAttachmentOwner(program)
                          if (owner == null) return
                          setUploadingAttachments(true)
                          try {
                            const uploadedIds: number[] = []
                            for (const file of files) {
                              const uploaded = await uploadAdminFileMaybeMock({ file, owner })
                              uploadedIds.push(uploaded.fileObjectId)
                            }
                            if (uploadedIds.length === 0) return
                            const existing = await fetchProgramMediaAttachments(program).catch(
                              () => []
                            )
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
                            f!.setValue('attachmentFileNames', names)
                          } finally {
                            setUploadingAttachments(false)
                          }
                        }
                      : undefined
                  }
                  onRemoveFile={
                    isFormEdit
                      ? index => {
                          if (!hasProgramMediaTarget(program)) {
                            const list = f!.getValues('attachmentFileNames') ?? []
                            f!.setValue(
                              'attachmentFileNames',
                              list.filter((_, i) => i !== index)
                            )
                            return
                          }
                          void (async () => {
                            const existing = await fetchProgramMediaAttachments(program).catch(
                              () => []
                            )
                            const remainingIds = existing
                              .map(item => item.fileObjectId)
                              .filter((id): id is number => typeof id === 'number' && id > 0)
                              .filter((_, i) => i !== index)
                            const linked = await putProgramMediaAttachments(program, remainingIds).catch(
                              () => [] as Awaited<ReturnType<typeof putProgramMediaAttachments>>
                            )
                            const names = linked
                              .map(item => item.originalFileName?.trim() || '')
                              .filter(Boolean)
                            f!.setValue('attachmentFileNames', names)
                          })()
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="program-detail-info-tab__content-block">
                  {displayFileNames.length > 0 ? displayFileNames.join(', ') : '-'}
                </div>
              )}
            </td>
          </tr>
        </DetailInfoTableFrame>
      </DetailInfoForm>
    </>
  )
}
