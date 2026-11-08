/**
 * 공지사항 등록·수정 모달
 * CMS 공지 등록 모달 스펙 미러 — 첨부만 th/td 테이블, 나머지 vertical 폼
 * @see apps/cms/src/features/posts/ui/notice-form-modal.tsx
 * @see apps/cms/src/features/posts/ui/notice-register-modal.css
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { Notice, NoticeAttachment, NoticeCreateInput } from '@/entities/notices/model/types'
import { DEFAULT_AUTHOR } from '@/features/notices/api/store'
import { useNoticeWysiwygEditor } from '@/features/notices/hooks/use-notice-wysiwyg-editor'
import { getRemoteRichTextBodyError, isEmptyAdminHtml, RichTextEditor } from '@/shared/rich-text'
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MULTI_GENERAL_GUIDE_LINE,
  ATTACHMENT_MULTI_TOTAL_MAX_BYTES,
  withAttachmentFilenameGuide,
  generalAttachmentMimeFromFile,
  sumAttachmentBytes,
  validateGeneralAttachmentBatch,
} from '@/shared/lib/attachment-policy'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'

import './notice-form-modal.css'

const ATTACH_GUIDE = withAttachmentFilenameGuide([ATTACHMENT_MULTI_GENERAL_GUIDE_LINE])

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function mimeFromFile(file: File): NoticeAttachment['mime'] {
  return generalAttachmentMimeFromFile(file)
}

export type NoticeFormValues = NoticeCreateInput

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Notice | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: NoticeFormValues) => void
  onDelete?: () => void
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <div className="notice-form-modal__label">
      <span>{children}</span>
      {required ? (
        <span className="notice-form-modal__required" aria-hidden>
          *
        </span>
      ) : null}
    </div>
  )
}

export function NoticeFormModal({
  open,
  mode,
  initial,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onDelete,
}: Props) {
  const { showAlert } = useCmsAlert()
  const [publishedAt, setPublishedAt] = useState<Dayjs | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [title, setTitle] = useState('')
  const [attachments, setAttachments] = useState<NoticeAttachment[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const initialMarkdown = useMemo(() => {
    if (!open) return ''
    if (mode === 'edit' && initial) return initial.contentMarkdown ?? ''
    return ''
  }, [open, mode, initial])

  const editorContentFormat = useMemo<'markdown' | 'html'>(() => {
    const content = initialMarkdown.trim()
    return content.startsWith('<') ? 'html' : 'markdown'
  }, [initialMarkdown])

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
  } = useNoticeWysiwygEditor(open, initialMarkdown, editorResetKey, {
    contentFormat: editorContentFormat,
    // 기존 스펙: 삽입(이미지·YouTube) 유지
    allowInlineMedia: true,
  })

  const resetFromInitial = useCallback(() => {
    if (mode === 'edit' && initial) {
      setPublishedAt(dayjs(initial.publishedAt))
      setIsPublic(initial.isPublic)
      setIsPinned(initial.isPinned)
      setTitle(initial.title)
      setAttachments(initial.attachments.map(a => ({ ...a })))
    } else {
      setPublishedAt(null)
      setIsPublic(true)
      setIsPinned(false)
      setTitle('')
      setAttachments([])
    }
  }, [mode, initial])

  useEffect(() => {
    if (open) resetFromInitial()
  }, [open, resetFromInitial])

  const fileNames = useMemo(() => attachments.map(a => a.name), [attachments])

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

      const accepted: NoticeAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!
        try {
          const dataUrl = await readFileAsDataUrl(file)
          accepted.push({
            id: `new-${Date.now()}-${i}`,
            name: file.name,
            mime: mimeFromFile(file),
            dataUrl,
            file,
          })
        } catch {
          showAlert({
            title: '파일 읽기 실패',
            content: '파일을 읽지 못했습니다. 다시 시도해 주세요.',
          })
        }
      }
      if (accepted.length > 0) {
        setAttachments(prev => [...prev, ...accepted])
      }
    },
    [attachments, showAlert]
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
    onSubmit({
      title: t,
      contentMarkdown: contentHtml,
      isPublic,
      isPinned,
      publishedAt: publishedAt.toISOString(),
      authorName: mode === 'edit' && initial ? initial.authorName : DEFAULT_AUTHOR,
      attachments,
    })
  }, [
    publishedAt,
    title,
    getHTML,
    isPublic,
    isPinned,
    attachments,
    onSubmit,
    showAlert,
    mode,
    initial,
  ])

  const titleText = mode === 'edit' ? '공지사항 수정' : '공지사항 등록'
  const submitLabel = mode === 'edit' ? '저장' : '등록'

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={titleText}
        size="large"
        className="notice-form-modal"
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
        <div className="notice-form-modal__form">
          {/* 상단: CMS 공지 filter 행 — vertical 라벨 (비테이블) */}
          <div className="notice-form-modal__filter-wrap">
            <div className="notice-form-modal__filter-inner">
              <div className="notice-form-modal__filter-field notice-form-modal__filter-field--datetime">
                <FieldLabel required>게시일시</FieldLabel>
                <CmsDatePicker
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
              <div className="notice-form-modal__filter-field notice-form-modal__filter-field--radio">
                <FieldLabel required>공개 여부</FieldLabel>
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
              </div>
              <div className="notice-form-modal__filter-field notice-form-modal__filter-field--radio">
                <FieldLabel required>상단 고정</FieldLabel>
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
              </div>
            </div>
          </div>

          <div className="notice-form-modal__section">
            <FieldLabel required>제목</FieldLabel>
            <CmsInput
              inputSize="medium"
              width="100%"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력해 주세요"
            />
          </div>

          <div className="notice-form-modal__section notice-form-modal__section--editor">
            <FieldLabel required>내용</FieldLabel>
            <div className="notice-form-modal__editor-host">
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
          </div>

          {/* 첨부만 th/td 테이블 — CMS notice-register-modal__attachment */}
          <div className="notice-form-modal__attachment">
            <div className="notice-form-modal__attachment-label">첨부 파일</div>
            <div className="notice-form-modal__attachment-body">
              <FileSelectField
                className="notice-form-modal__file-field"
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
            </div>
          </div>
        </div>
      </ContentModal>

      {mode === 'edit' && onDelete ? (
        <ConfirmModal
          open={deleteConfirmOpen}
          title="공지사항 삭제"
          content="선택한 공지사항을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."
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
