/**
 * 채용 공고 등록·수정 모달
 * 공지사항 NoticeFormModal 규격 미러 — ContentModal large · Cms* · RichText · FileSelect
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type {
  RecruitPosting,
  RecruitPostingAttachment,
  RecruitPostingAttachmentMime,
  RecruitPostingCreateInput,
  RecruitPostingFormStatus,
} from '@/entities/recruit-posting/model/types'
import { DEFAULT_AUTHOR } from '@/features/recruit-posting/api/store'
import { useRecruitPostingWysiwygEditor } from '@/features/recruit-posting/hooks/use-recruit-posting-wysiwyg-editor'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { getRemoteRichTextBodyError, isEmptyAdminHtml, RichTextEditor } from '@/shared/rich-text'
import {
  CmsButton,
  CmsDatePicker,
  CmsDateRangePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  ContentModal,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  useCmsAlert,
} from '@/shared/ui'

import './posting-form-modal.css'

const FILE_ACCEPT =
  '.jpg,.jpeg,.png,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024

const ATTACH_GUIDE = [
  '- 이미지 파일은 최대 20MB, Excel·PDF·Word 파일은 최대 15MB까지 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
] as const

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.pdf', '.doc', '.docx'])

function isImageAttachment(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

export type RecruitPostingFormValues = RecruitPostingCreateInput

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  initial?: RecruitPosting | null
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: RecruitPostingFormValues) => void
  onDelete?: () => void
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <div className="posting-form-modal__label">
      <span>{children}</span>
      {required ? (
        <span className="posting-form-modal__required" aria-hidden>
          *
        </span>
      ) : null}
    </div>
  )
}

function toFormStatus(status: RecruitPosting['status']): RecruitPostingFormStatus {
  return status === 'recruiting' ? 'recruiting' : 'result'
}

function isAllowedAttachment(file: File): boolean {
  const name = file.name.toLowerCase()
  const dot = name.lastIndexOf('.')
  if (dot < 0) return false
  return ALLOWED_EXT.has(name.slice(dot))
}

function mimeFromFile(file: File): RecruitPostingAttachmentMime {
  const name = file.name.toLowerCase()
  if (file.type === 'image/png' || name.endsWith('.png')) return 'image/png'
  if (file.type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return 'image/jpeg'
  }
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.doc')) return 'application/msword'
  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (name.endsWith('.xls')) return 'application/vnd.ms-excel'
  if (name.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type as RecruitPostingAttachmentMime
  }
  throw new Error('unsupported-mime')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function parseDayjs(value: string | undefined | null): Dayjs | null {
  if (!value) return null
  const d = dayjs(value)
  return d.isValid() ? d : null
}

export function RecruitPostingFormModal({
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
  const [recruitRange, setRecruitRange] = useState<[Dayjs | null, Dayjs | null]>([null, null])
  const [isPublic, setIsPublic] = useState(true)
  const [status, setStatus] = useState<RecruitPostingFormStatus>('recruiting')
  const [title, setTitle] = useState('')
  const [attachments, setAttachments] = useState<RecruitPostingAttachment[]>([])
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
    editorMinHeight,
    getHTML,
    editorMode,
    htmlSource,
    onEditorModeChange,
    onHtmlSourceChange,
  } = useRecruitPostingWysiwygEditor(open, initialMarkdown, editorResetKey, {
    placeholder: '게시글 내용을 입력하세요',
    contentFormat: editorContentFormat,
    allowInlineMedia: true,
  })

  const resetFromInitial = useCallback(() => {
    if (mode === 'edit' && initial) {
      setPublishedAt(parseDayjs(initial.publishedAt))
      setRecruitRange([parseDayjs(initial.recruitStart), parseDayjs(initial.recruitEnd)])
      setIsPublic(initial.isPublic)
      setStatus(toFormStatus(initial.status))
      setTitle(initial.title)
      setAttachments(initial.attachments.map(a => ({ ...a })))
    } else {
      setPublishedAt(null)
      setRecruitRange([null, null])
      setIsPublic(true)
      setStatus('recruiting')
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

      const file = files[0]!
      if (!isAllowedAttachment(file)) {
        showAlert({
          title: '파일 형식',
          content: 'JPG, PNG, Excel, PDF, Word 형식만 등록할 수 있습니다.',
        })
        return
      }
      const maxBytes = isImageAttachment(file)
        ? FILE_SELECT_IMAGE_MAX_TOTAL_BYTES
        : DOCUMENT_MAX_BYTES
      if (file.size > maxBytes) {
        showAlert({
          title: '파일 용량',
          content: `이미지 파일은 최대 20MB, 문서 파일은 최대 ${
            DOCUMENT_MAX_BYTES / (1024 * 1024)
          }MB까지 등록 가능합니다.`,
        })
        return
      }
      try {
        const mime = mimeFromFile(file)
        const dataUrl = await readFileAsDataUrl(file)
        setAttachments([
          {
            id: `new-${Date.now()}`,
            name: file.name,
            mime,
            dataUrl,
            file,
          },
        ])
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '파일을 읽지 못했습니다. 다시 시도해 주세요.',
        })
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
    const publishedMinute = publishedAt.minute()
    if (publishedMinute !== 0 && publishedMinute !== 30) {
      showAlert({
        title: '입력 확인',
        content: '게시일시 분은 00분 또는 30분만 선택할 수 있습니다.',
      })
      return
    }

    const [recruitStart, recruitEnd] = recruitRange
    if (!recruitStart?.isValid() || !recruitEnd?.isValid()) {
      showAlert({ title: '입력 확인', content: '모집 기간을 선택해 주세요.' })
      return
    }
    const startMinute = recruitStart.minute()
    const endMinute = recruitEnd.minute()
    if ((startMinute !== 0 && startMinute !== 30) || (endMinute !== 0 && endMinute !== 30)) {
      showAlert({
        title: '입력 확인',
        content: '모집 기간 분은 00분 또는 30분만 선택할 수 있습니다.',
      })
      return
    }
    if (recruitEnd.isBefore(recruitStart)) {
      showAlert({ title: '입력 확인', content: '모집 종료일시는 시작일시 이후여야 합니다.' })
      return
    }

    const t = title.trim()
    if (!t) {
      showAlert({ title: '입력 확인', content: '제목을 입력해 주세요.' })
      return
    }

    // remote body는 HTML. 로컬 mock도 HTML을 받을 수 있다.
    const contentHtml = getHTML().trim()
    if (isEmptyAdminHtml(contentHtml)) {
      showAlert({ title: '입력 확인', content: '공고 내용을 입력해 주세요.' })
      return
    }
    const bodyError = getRemoteRichTextBodyError(contentHtml)
    if (bodyError) {
      showAlert({ title: '입력 확인', content: bodyError })
      return
    }

    // 모집완료 행: 라디오가 발표(default)면 CLOSED 유지. 모집으로 바꾸면 RECRUITING.
    const submitStatus: RecruitPostingFormStatus | 'closed' =
      mode === 'edit' && initial?.status === 'closed' && status === 'result' ? 'closed' : status

    onSubmit({
      title: t,
      contentMarkdown: contentHtml,
      isPublic,
      status: submitStatus,
      publishedAt: publishedAt.format('YYYY-MM-DD'),
      recruitStart: recruitStart.format('YYYY-MM-DD'),
      recruitEnd: recruitEnd.format('YYYY-MM-DD'),
      authorName: mode === 'edit' && initial ? initial.authorName : DEFAULT_AUTHOR,
      attachments,
      buttonLabel: '',
      linkUrl: '',
    })
  }, [
    publishedAt,
    recruitRange,
    title,
    getHTML,
    isPublic,
    status,
    attachments,
    onSubmit,
    showAlert,
    mode,
    initial,
  ])

  const titleText = mode === 'edit' ? '채용 공고 수정' : '채용 공고 등록'
  const submitLabel = mode === 'edit' ? '저장' : '등록'

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={titleText}
        size="large"
        className="posting-form-modal"
        footer={
          <div className="posting-form-modal__footer">
            {mode === 'edit' && onDelete ? (
              <CmsButton
                variant="delete"
                size="large"
                type="button"
                disabled={deleteLoading || confirmLoading}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                공고 삭제
              </CmsButton>
            ) : null}
            <div className="posting-form-modal__footer-end">
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
        <div className="posting-form-modal__form">
          <div className="posting-form-modal__filter-wrap">
            <div className="posting-form-modal__filter-inner">
              <div className="posting-form-modal__filter-field posting-form-modal__filter-field--radio">
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
                    미공개
                  </CmsRadio>
                </CmsRadioGroup>
              </div>
              <div className="posting-form-modal__filter-field posting-form-modal__filter-field--datetime">
                <FieldLabel required>게시일시</FieldLabel>
                <CmsDatePicker
                  inputSize="large"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
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
              <div className="posting-form-modal__filter-field posting-form-modal__filter-field--radio">
                <FieldLabel required>게시글 유형</FieldLabel>
                <CmsRadioGroup
                  size="large"
                  value={status}
                  onChange={e => setStatus(e.target.value as RecruitPostingFormStatus)}
                >
                  <CmsRadio size="large" value="recruiting">
                    모집
                  </CmsRadio>
                  <CmsRadio size="large" value="result">
                    발표
                  </CmsRadio>
                </CmsRadioGroup>
              </div>
              <div className="posting-form-modal__filter-field posting-form-modal__filter-field--range">
                <FieldLabel required>모집 기간</FieldLabel>
                <CmsDateRangePicker
                  inputSize="large"
                  width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                  showTime={{
                    format: 'HH:mm',
                    minuteStep: 30 as const,
                  }}
                  format="YYYY.MM.DD HH:mm"
                  value={recruitRange}
                  placeholder={['시작일시', '종료일시']}
                  allowClear
                  onChange={dates => {
                    if (!dates || (!dates[0] && !dates[1])) {
                      setRecruitRange([null, null])
                      return
                    }
                    setRecruitRange([dates[0] ?? null, dates[1] ?? null])
                  }}
                />
              </div>
            </div>
          </div>

          <div className="posting-form-modal__section">
            <FieldLabel required>제목</FieldLabel>
            <CmsInput
              inputSize="large"
              width="100%"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="posting-form-modal__section posting-form-modal__section--editor">
            <FieldLabel required>내용</FieldLabel>
            <div className="posting-form-modal__editor-host">
              <RichTextEditor
                editor={editor}
                minHeight={editorMinHeight}
                allowInlineMedia
                allowRawHtmlBlock
                editorMode={editorMode}
                htmlSource={htmlSource}
                onEditorModeChange={onEditorModeChange}
                onHtmlSourceChange={onHtmlSourceChange}
              />
            </div>
          </div>

          <div className="posting-form-modal__attachment">
            <div className="posting-form-modal__attachment-label">첨부 파일</div>
            <div className="posting-form-modal__attachment-body">
              <FileSelectField
                className="posting-form-modal__file-field"
                multiple={false}
                accept={FILE_ACCEPT}
                buttonLabel="파일 추가"
                fileNames={fileNames}
                maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
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
          title="채용공고 삭제"
          content="선택한 채용공고를 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다."
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
