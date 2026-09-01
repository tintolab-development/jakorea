/**
 * 공지사항 등록·수정 모달
 * CMS 공지 등록 모달 스펙 미러 — 첨부만 th/td 테이블, 나머지 vertical 폼
 * @see apps/cms/src/features/posts/ui/notice-form-modal.tsx
 * @see apps/cms/src/features/posts/ui/notice-register-modal.css
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type {
  Notice,
  NoticeAttachment,
  NoticeCreateInput,
} from '@/entities/notices/model/types'
import { DEFAULT_AUTHOR } from '@/features/notices/api/store'
import { shouldUseNoticesRemoteApi } from '@/features/notices/api/capabilities'
import { useNoticeWysiwygEditor } from '@/features/notices/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import {
  CmsButton,
  CmsDatePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'

import './notice-form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const MAX_BYTES = 15 * 1024 * 1024

/** 시안 가이드 (15M · 특수문자) */
const ATTACH_GUIDE = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

function isAllowedImageFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function mimeFromFile(file: File): NoticeAttachment['mime'] {
  if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    return 'image/png'
  }
  return 'image/jpeg'
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

  const { editor, editorMinHeight, getMarkdown, getHTML } = useNoticeWysiwygEditor(
    open,
    initialMarkdown,
    editorResetKey,
    {
      placeholder: '공지사항 내용을 입력하세요',
      contentFormat: editorContentFormat,
      // 기존 스펙: 삽입(이미지·YouTube) 유지. remote sanitize와 무관하게 UI는 full
      allowInlineMedia: true,
    }
  )

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

      const accepted: NoticeAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!
        if (!isAllowedImageFile(file)) {
          showAlert({
            title: '파일 형식',
            content: 'JPG, PNG 형식만 등록할 수 있습니다.',
          })
          continue
        }
        if (file.size > MAX_BYTES) {
          showAlert({
            title: '파일 용량',
            content: '파일은 최대 15MB까지 등록 가능합니다.',
          })
          continue
        }
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
    [showAlert]
  )

  const handleRemoveFile = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(() => {
    if (!publishedAt || !publishedAt.isValid()) {
      showAlert({ title: '입력 확인', content: '게시일시를 선택해 주세요.' })
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
      showAlert({ title: '입력 확인', content: '제목을 입력해 주세요.' })
      return
    }
    const contentMarkdown = (
      shouldUseNoticesRemoteApi() || editorContentFormat === 'html'
        ? getHTML()
        : getMarkdown()
    ).trim()
    if (!contentMarkdown) {
      showAlert({ title: '입력 확인', content: '공지사항 내용을 입력해 주세요.' })
      return
    }
    onSubmit({
      title: t,
      contentMarkdown,
      isPublic,
      isPinned,
      publishedAt: publishedAt.toISOString(),
      authorName: mode === 'edit' && initial ? initial.authorName : DEFAULT_AUTHOR,
      attachments,
    })
  }, [
    publishedAt,
    title,
    getMarkdown,
    getHTML,
    editorContentFormat,
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
          <div className="notice-form-modal__footer">
            {mode === 'edit' && onDelete ? (
              <CmsButton
                variant="delete"
                size="large"
                type="button"
                disabled={deleteLoading || confirmLoading}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                공지사항 삭제
              </CmsButton>
            ) : null}
            <div className="notice-form-modal__footer-end">
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                disabled={confirmLoading || deleteLoading}
                onClick={onCancel}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={confirmLoading}
                onClick={handleSubmit}
              >
                {submitLabel}
              </CmsButton>
            </div>
          </div>
        }
      >
        <div className="notice-form-modal__form">
          {/* 상단: CMS 공지 filter 행 — vertical 라벨 (비테이블) */}
          <div className="notice-form-modal__filter-wrap">
            <div className="notice-form-modal__filter-inner">
              <div className="notice-form-modal__filter-field notice-form-modal__filter-field--datetime">
                <FieldLabel required>게시일시</FieldLabel>
                <CmsDatePicker
                  inputSize="large"
                  width={280}
                  showTime={{
                    format: 'HH:mm',
                    minuteStep: 30 as const,
                  }}
                  format="YYYY.MM.DD HH:mm"
                  value={publishedAt}
                  onChange={v => setPublishedAt(v)}
                  placeholder="게시일시를 선택하세요"
                />
              </div>
              <div className="notice-form-modal__filter-field notice-form-modal__filter-field--radio">
                <FieldLabel required>공개 여부</FieldLabel>
                <CmsRadioGroup
                  size="large"
                  value={isPublic ? 'public' : 'private'}
                  onChange={e => setIsPublic(e.target.value === 'public')}
                >
                  <CmsRadio size="large" value="public">
                    공개
                  </CmsRadio>
                  <CmsRadio size="large" value="private">
                    비공개
                  </CmsRadio>
                </CmsRadioGroup>
              </div>
              <div className="notice-form-modal__filter-field notice-form-modal__filter-field--radio">
                <FieldLabel required>상단 고정</FieldLabel>
                <CmsRadioGroup
                  size="large"
                  value={isPinned ? 'on' : 'off'}
                  onChange={e => setIsPinned(e.target.value === 'on')}
                >
                  <CmsRadio size="large" value="off">
                    고정 안함
                  </CmsRadio>
                  <CmsRadio size="large" value="on">
                    고정
                  </CmsRadio>
                </CmsRadioGroup>
              </div>
            </div>
          </div>

          <div className="notice-form-modal__section">
            <FieldLabel required>제목</FieldLabel>
            <CmsInput
              inputSize="large"
              width="100%"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="notice-form-modal__section notice-form-modal__section--editor">
            <FieldLabel required>내용</FieldLabel>
            <div className="notice-form-modal__editor-host">
              <RichTextEditor
                editor={editor}
                minHeight={editorMinHeight}
                allowInlineMedia
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
                accept={IMAGE_ACCEPT}
                buttonLabel="파일 추가"
                fileNames={fileNames}
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
