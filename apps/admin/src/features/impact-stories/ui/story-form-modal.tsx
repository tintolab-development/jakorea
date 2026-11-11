/**
 * 임팩트 스토리 등록·수정 모달
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { AdminFieldFrame } from '@jakorea/admin-ui'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import type {
  ImpactStory,
  ImpactStoryAttachment,
  ImpactStoryCategory,
  ImpactStoryCreateInput,
} from '@/entities/impact-stories/model/types'
import { DEFAULT_AUTHOR } from '@/features/impact-stories/api/store'
import { shouldUseImpactStoriesRemoteApi } from '@/features/impact-stories/api/capabilities'
import { useStoryWysiwygEditor } from '@/features/impact-stories/hooks/use-story-wysiwyg-editor'
import { IMPACT_STORY_PIN_MAX } from '@/features/impact-stories/lib/pin-limits'
import {
  getRemoteRichTextBodyError,
  isEmptyAdminHtml,
  isHtmlContent,
  RichTextEditor,
} from '@/shared/rich-text'
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_ERROR,
  ATTACHMENT_MULTI_GENERAL_GUIDE_LINE,
  ATTACHMENT_MULTI_TOTAL_MAX_BYTES,
  ATTACHMENT_PER_FILE_MAX_BYTES,
  ATTACHMENT_SINGLE_JPG_PNG_GUIDE_LINE,
  generalAttachmentMimeFromFile,
  withAttachmentFilenameGuide,
  sumAttachmentBytes,
  validateGeneralAttachmentBatch,
  validateSingleJpgPngFile,
} from '@/shared/lib/attachment-policy'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  CmsSelect,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'

import './story-form-modal.css'

const THUMB_GUIDE = [
  ATTACHMENT_SINGLE_JPG_PNG_GUIDE_LINE,
  '- 권장 배너 사이즈는 630 × 355px입니다.',
] as const

const ATTACH_GUIDE = withAttachmentFilenameGuide([ATTACHMENT_MULTI_GENERAL_GUIDE_LINE])

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function mimeFromFile(file: File): ImpactStoryAttachment['mime'] {
  return generalAttachmentMimeFromFile(file)
}

export type StoryFormValues = ImpactStoryCreateInput

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: ImpactStory | null
  categories: ImpactStoryCategory[]
  /** 현재 고정 건수 (본인 제외). 핀 상한 검증용 */
  pinnedCountExcludingSelf?: number
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: StoryFormValues) => void
  onDelete?: () => void
}

export function StoryFormModal({
  open,
  mode,
  initial,
  categories,
  pinnedCountExcludingSelf = 0,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onDelete,
}: Props) {
  const { showAlert } = useCmsAlert()
  const [publishedAt, setPublishedAt] = useState<Dayjs | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [title, setTitle] = useState('')
  const [thumbnail, setThumbnail] = useState<ImpactStoryAttachment | null>(null)
  const [attachments, setAttachments] = useState<ImpactStoryAttachment[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const initialMarkdown = useMemo(() => {
    if (!open) return ''
    if (mode === 'edit' && initial) return initial.contentMarkdown ?? ''
    return ''
  }, [open, mode, initial])

  const useRemote = shouldUseImpactStoriesRemoteApi()
  const editorContentFormat = useMemo((): 'markdown' | 'html' => {
    if (!useRemote) return 'markdown'
    const body = initialMarkdown.trim()
    return isHtmlContent(body) ? 'html' : 'markdown'
  }, [initialMarkdown, useRemote])

  const editorResetKey = useMemo(
    () => (open ? `${mode}-${initial?.id ?? 'new'}-${editorContentFormat}` : 'closed'),
    [open, mode, initial?.id, editorContentFormat]
  )

  const {
    editor,
    getHTML,
    editorMode,
    htmlSource,
    onEditorModeChange,
    onHtmlSourceChange,
    resolveImageSrc,
  } = useStoryWysiwygEditor(open, initialMarkdown, editorResetKey, {
    contentFormat: editorContentFormat,
    // 기존 스펙: 삽입(이미지·YouTube) 유지
    allowInlineMedia: true,
  })

  const categoryOptions = useMemo(
    () => categories.map(c => ({ value: c.id, label: c.name })),
    [categories]
  )

  const resetFromInitial = useCallback(() => {
    if (mode === 'edit' && initial) {
      setPublishedAt(dayjs(initial.publishedAt))
      setCategoryId(initial.categoryId)
      setIsPublic(initial.isPublic)
      setIsPinned(initial.isPinned)
      setTitle(initial.title)
      setThumbnail(initial.thumbnail ? { ...initial.thumbnail } : null)
      setAttachments(initial.attachments.map(a => ({ ...a })))
    } else {
      setPublishedAt(null)
      setCategoryId('')
      setIsPublic(true)
      setIsPinned(false)
      setTitle('')
      setThumbnail(null)
      setAttachments([])
    }
  }, [mode, initial])

  useEffect(() => {
    if (open) resetFromInitial()
  }, [open, resetFromInitial])

  const fileNames = useMemo(() => attachments.map(a => a.name), [attachments])
  const thumbnailNames = useMemo(() => (thumbnail?.name ? [thumbnail.name] : []), [thumbnail])

  const readAcceptedFile = useCallback(
    async (file: File, id: string): Promise<ImpactStoryAttachment | null> => {
      try {
        const dataUrl = await readFileAsDataUrl(file)
        return {
          id,
          name: file.name,
          mime: mimeFromFile(file),
          dataUrl,
          file: shouldUseImpactStoriesRemoteApi() ? file : undefined,
        }
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '파일을 읽지 못했습니다. 다시 시도해 주세요.',
        })
        return null
      }
    },
    [showAlert]
  )

  const handleThumbnailChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      const error = validateSingleJpgPngFile(file)
      if (error) {
        showAlert({
          title: error === ATTACHMENT_ERROR.format ? '파일 형식' : '파일 용량',
          content: error,
        })
        return
      }
      const next = await readAcceptedFile(file, `thumb-${Date.now()}`)
      if (next) setThumbnail(next)
    },
    [readAcceptedFile, showAlert]
  )

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      const error = validateGeneralAttachmentBatch({
        incoming: files,
        existingCount: attachments.length,
        existingBytes: sumAttachmentBytes(attachments.map(att => att.file ?? { size: 0 })),
      })
      if (error) {
        showAlert({ title: '안내', content: error })
        return
      }
      const accepted: ImpactStoryAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const next = await readAcceptedFile(files[i]!, `new-${Date.now()}-${i}`)
        if (next) accepted.push(next)
      }
      if (accepted.length > 0) {
        setAttachments(prev => [...prev, ...accepted])
      }
    },
    [attachments, readAcceptedFile, showAlert]
  )

  const handleRemoveFile = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!publishedAt || !publishedAt.isValid()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const m = publishedAt.minute()
    if (m !== 0 && m !== 30) {
      showAlert({
        title: '입력 확인',
        content: '게시일시 분은 00분 또는 30분만 선택할 수 있습니다.',
      })
      return
    }
    if (!categoryId) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const t = title.trim()
    if (!t) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const contentHtml = getHTML().trim()
    if (isEmptyAdminHtml(contentHtml)) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const bodyError = getRemoteRichTextBodyError(contentHtml)
    if (bodyError) {
      showAlert({ title: '입력 확인', content: bodyError })
      return
    }
    if (isPinned && pinnedCountExcludingSelf >= IMPACT_STORY_PIN_MAX) {
      showAlert({
        title: '상단 고정 제한',
        content: `상단 고정 게시글은 최대 ${IMPACT_STORY_PIN_MAX}개까지 설정 가능합니다.`,
      })
      return
    }
    onSubmit({
      categoryId,
      title: t,
      contentMarkdown: contentHtml,
      isPublic,
      isPinned,
      publishedAt: publishedAt.toISOString(),
      authorName: mode === 'edit' && initial ? initial.authorName : DEFAULT_AUTHOR,
      thumbnail,
      attachments,
    })
  }, [
    publishedAt,
    categoryId,
    title,
    getHTML,
    isPublic,
    isPinned,
    pinnedCountExcludingSelf,
    thumbnail,
    attachments,
    onSubmit,
    showAlert,
    mode,
    initial,
  ])

  const titleText = mode === 'edit' ? '게시글 수정' : '게시글 등록'
  const submitLabel = mode === 'edit' ? '저장' : '등록'

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={titleText}
        size="large"
        className="story-form-modal"
        footer={
          <>
            {mode === 'edit' && onDelete ? (
              <CmsButton
                className={CONTENT_MODAL_FOOTER_START_CLASS}
                variant="delete"
                size="medium"
                type="button"
                disabled={deleteLoading || confirmLoading}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                삭제
              </CmsButton>
            ) : null}
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              disabled={confirmLoading || deleteLoading}
              onClick={onCancel}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              loading={confirmLoading}
              onClick={handleSubmit}
            >
              {submitLabel}
            </CmsButton>
          </>
        }
      >
        <div className="story-form-modal__form">
          <div className="story-form-modal__filter-wrap">
            <div className="story-form-modal__filter-inner story-form-modal__filter-inner--with-category">
              <div className="story-form-modal__filter-field story-form-modal__filter-field--datetime">
                <CmsDatePicker
                  label="게시일시"
                  required
                  inputSize="medium"
                  width={240}
                  showTime={{
                    format: 'HH:mm',
                    minuteStep: 30 as const,
                  }}
                  showNow={false}
                  format="YYYY.MM.DD HH:mm"
                  value={publishedAt}
                  onChange={v => setPublishedAt(v)}
                  placeholder="게시일시를 선택해 주세요"
                />
              </div>
              <div className="story-form-modal__filter-field story-form-modal__filter-field--category">
                <CmsSelect
                  label="카테고리"
                  required
                  inputSize="medium"
                  width={240}
                  value={categoryId || undefined}
                  placeholder="카테고리를 선택해 주세요"
                  options={categoryOptions}
                  onChange={v => setCategoryId(String(v ?? ''))}
                />
              </div>
              <div className="story-form-modal__filter-field story-form-modal__filter-field--radio">
                <AdminFieldFrame size="medium" label="공개 여부" required>
                  <CmsRadioGroup
                    size="medium"
                    value={isPublic ? 'public' : 'private'}
                    onChange={e => setIsPublic(e.target.value === 'public')}
                  >
                    <CmsRadio size="medium" value="public">
                      공개
                    </CmsRadio>
                    <CmsRadio size="medium" value="private">
                      비공개
                    </CmsRadio>
                  </CmsRadioGroup>
                </AdminFieldFrame>
              </div>
              <div className="story-form-modal__filter-field story-form-modal__filter-field--radio">
                <AdminFieldFrame size="medium" label="상단 고정" required>
                  <CmsRadioGroup
                    size="medium"
                    value={isPinned ? 'on' : 'off'}
                    onChange={e => setIsPinned(e.target.value === 'on')}
                  >
                    <CmsRadio size="medium" value="off">
                      고정 안 함
                    </CmsRadio>
                    <CmsRadio size="medium" value="on">
                      고정
                    </CmsRadio>
                  </CmsRadioGroup>
                </AdminFieldFrame>
              </div>
            </div>
          </div>

          <div className="story-form-modal__section">
            <CmsInput
              label="제목"
              required
              inputSize="medium"
              width="100%"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력해 주세요"
            />
          </div>

          <AdminFieldFrame
            size="medium"
            label="내용"
            required
            className="story-form-modal__section story-form-modal__section--editor"
          >
            <div className="story-form-modal__editor-host">
              <RichTextEditor
                editor={editor}
                allowInlineMedia
                resolveImageSrc={resolveImageSrc}
                allowRawHtmlBlock
                editorMode={editorMode}
                htmlSource={htmlSource}
                onEditorModeChange={onEditorModeChange}
                onHtmlSourceChange={onHtmlSourceChange}
              />
            </div>
          </AdminFieldFrame>

          <DetailInfoForm
            title="첨부 파일"
            hideHeader
            mode="edit"
            className="story-form-modal__files"
          >
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="대표 썸네일"
                view={null}
                edit={
                  <FileSelectField
                    className="story-form-modal__file-field"
                    multiple={false}
                    accept={ATTACHMENT_ACCEPT.jpgPng}
                    buttonLabel="파일 추가"
                    fileNames={thumbnailNames}
                    maxTotalBytes={ATTACHMENT_PER_FILE_MAX_BYTES}
                    guideLines={THUMB_GUIDE}
                    onFilesChange={files => {
                      void handleThumbnailChange(files)
                    }}
                    onRemoveFile={() => setThumbnail(null)}
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="첨부 파일"
                view={null}
                edit={
                  <FileSelectField
                    className="story-form-modal__file-field"
                    multiple
                    accept={ATTACHMENT_ACCEPT.general}
                    buttonLabel="파일 추가"
                    fileNames={fileNames}
                    currentTotalBytes={sumAttachmentBytes(attachments.map(att => att.file ?? { size: 0 }))}
                    maxTotalBytes={ATTACHMENT_MULTI_TOTAL_MAX_BYTES}
                    guideLines={ATTACH_GUIDE}
                    onFilesChange={files => {
                      void handleFilesChange(files)
                    }}
                    onRemoveFile={handleRemoveFile}
                  />
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      </ContentModal>

      {mode === 'edit' && onDelete ? (
        <ConfirmModal
          open={deleteConfirmOpen}
          title="게시글 삭제"
          content="선택한 게시글을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          danger
          confirmLoading={deleteLoading}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={() => {
            setDeleteConfirmOpen(false)
            onDelete()
          }}
        />
      ) : null}
    </>
  )
}
