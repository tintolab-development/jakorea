/**
 * 채용 공고 등록·수정 모달
 * 공지사항 NoticeFormModal 규격 미러 — ContentModal large · Cms* · RichText · FileSelect
 */

import { AdminFieldFrame } from '@jakorea/admin-ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type {
  RecruitPosting,
  RecruitPostingAttachment,
  RecruitPostingAttachmentMime,
  RecruitPostingCreateInput,
  RecruitPostingFormStatus,
} from '@/entities/recruit-posting/model/types'
import { useAdminMeProfile } from '@/features/auth/api/use-admin-me-profile'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useRecruitPostingWysiwygEditor } from '@/features/recruit-posting/hooks/use-recruit-posting-wysiwyg-editor'
import { resolveCurrentAdminAuthorName } from '@/features/recruit-posting/lib/resolve-current-admin-author-name'
import {
  CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH,
  CAREER_POSTING_LINK_URL_FORMAT_ALERT,
  careerPostingLinkUrlFormatAlert,
  validateCareerPostingLinkFields,
} from '@/features/recruit-posting/lib/link-fields'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { getRemoteRichTextBodyError, isEmptyAdminHtml, RichTextEditor } from '@/shared/rich-text'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsDatePicker,
  CmsDateRangePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MULTI_GENERAL_GUIDE_LINE,
  withAttachmentFilenameGuide,
  ATTACHMENT_MULTI_TOTAL_MAX_BYTES,
  generalAttachmentMimeFromFile,
  sumAttachmentBytes,
  validateGeneralAttachmentBatch,
} from '@/shared/lib/attachment-policy'

import './posting-form-modal.css'

const ATTACH_GUIDE = withAttachmentFilenameGuide([ATTACHMENT_MULTI_GENERAL_GUIDE_LINE])

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

function toFormStatus(status: RecruitPosting['status']): RecruitPostingFormStatus {
  return status === 'recruiting' ? 'recruiting' : 'result'
}

function mimeFromFile(file: File): RecruitPostingAttachmentMime {
  return generalAttachmentMimeFromFile(file)
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

/** 시안 2432:39720 내용 에디터 높이 */
const EDITOR_MIN_HEIGHT_PX = 200

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
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const adminId = useAuthStore(state => state.user?.id)
  const meQueryEnabled = Boolean(isAuthenticated && open && mode === 'create' && adminId)
  const meQuery = useAdminMeProfile(adminId, meQueryEnabled)
  const [publishedAt, setPublishedAt] = useState<Dayjs | null>(null)
  const [recruitRange, setRecruitRange] = useState<[Dayjs | null, Dayjs | null]>([null, null])
  const [isPublic, setIsPublic] = useState(true)
  const [status, setStatus] = useState<RecruitPostingFormStatus>('recruiting')
  const [title, setTitle] = useState('')
  const [buttonLabel, setButtonLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
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
    getHTML,
    editorMode,
    htmlSource,
    onEditorModeChange,
    onHtmlSourceChange,
    resolveImageSrc,
  } = useRecruitPostingWysiwygEditor(open, initialMarkdown, editorResetKey, {
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
      setButtonLabel(initial.buttonLabel)
      setLinkUrl(initial.linkUrl)
      setAttachments(initial.attachments.map(a => ({ ...a })))
    } else {
      setPublishedAt(null)
      setRecruitRange([null, null])
      setIsPublic(true)
      setStatus('recruiting')
      setTitle('')
      setButtonLabel('')
      setLinkUrl('')
      setAttachments([])
    }
  }, [mode, initial])

  useEffect(() => {
    if (open) resetFromInitial()
  }, [open, resetFromInitial])

  // 모집완료 행: 라디오가 발표(default)면 CLOSED 유지. 모집으로 바꾸면 RECRUITING.
  const submitStatus: RecruitPostingFormStatus | 'closed' =
    mode === 'edit' && initial?.status === 'closed' && status === 'result' ? 'closed' : status
  // 발표(RESULT)는 모집기간을 저장하지 않는다 — 입력 비활성화·검증 생략. 입력값은 유형을 되돌릴 때를 위해 유지.
  const recruitPeriodRequired = submitStatus !== 'result'

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
      const accepted: RecruitPostingAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!
        try {
          accepted.push({
            id: `new-${Date.now()}-${i}`,
            name: file.name,
            mime: mimeFromFile(file),
            dataUrl: await readFileAsDataUrl(file),
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
    const linkFormatAlert = careerPostingLinkUrlFormatAlert(linkUrl)
    if (linkFormatAlert) {
      showAlert(linkFormatAlert)
      return
    }

    if (!publishedAt || !publishedAt.isValid()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
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
    let recruitStartYmd = ''
    let recruitEndYmd = ''
    if (recruitPeriodRequired) {
      if (!recruitStart?.isValid() || !recruitEnd?.isValid()) {
        showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
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
      recruitStartYmd = recruitStart.format('YYYY-MM-DD')
      recruitEndYmd = recruitEnd.format('YYYY-MM-DD')
    }

    const t = title.trim()
    if (!t) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }

    // remote body는 HTML. 로컬 mock도 HTML을 받을 수 있다.
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

    const linkError = validateCareerPostingLinkFields({ buttonLabel, linkUrl })
    if (linkError) {
      showAlert(
        linkError === CAREER_POSTING_LINK_URL_FORMAT_ALERT.content
          ? CAREER_POSTING_LINK_URL_FORMAT_ALERT
          : linkError.includes('바로가기 링크')
            ? REQUIRED_FIELDS_INCOMPLETE_ALERT
            : { title: '입력 확인', content: linkError }
      )
      return
    }

    const author = resolveCurrentAdminAuthorName({
      mode,
      existingAuthorName: initial?.authorName,
      meName: meQuery.data?.name,
      meQueryEnabled,
      meQueryStatus: meQuery.status,
    })
    if (author.status === 'loading') {
      showAlert({
        title: '입력 확인',
        content: '작성자 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
      })
      return
    }
    if (author.status === 'unavailable') {
      showAlert({
        title: '입력 확인',
        content: '작성자명을 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.',
      })
      return
    }

    onSubmit({
      title: t,
      contentMarkdown: contentHtml,
      isPublic,
      status: submitStatus,
      publishedAt: publishedAt.format('YYYY-MM-DD'),
      recruitStart: recruitStartYmd,
      recruitEnd: recruitEndYmd,
      authorName: author.authorName,
      attachments,
      buttonLabel,
      linkUrl,
    })
  }, [
    publishedAt,
    recruitRange,
    title,
    buttonLabel,
    linkUrl,
    getHTML,
    isPublic,
    submitStatus,
    recruitPeriodRequired,
    attachments,
    onSubmit,
    showAlert,
    mode,
    initial,
    meQueryEnabled,
    meQuery.data?.name,
    meQuery.status,
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
                공고 삭제
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
              loading={
                confirmLoading || (mode === 'create' && meQuery.isPending && !meQuery.data)
              }
              disabled={mode === 'create' && meQuery.isPending && !meQuery.data}
              onClick={handleSubmit}
            >
              {submitLabel}
            </CmsButton>
          </>
        }
      >
        <div className="posting-form-modal__form">
          <div className="posting-form-modal__group-title">
            <span className="posting-form-modal__group-title-text">공고 정보</span>
          </div>
          <div className="posting-form-modal__filter-wrap">
            <div className="posting-form-modal__filter-inner">
              <div className="posting-form-modal__filter-field posting-form-modal__filter-field--radio">
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
              <div className="posting-form-modal__filter-field posting-form-modal__filter-field--datetime">
                <CmsDatePicker
                  label="게시일시"
                  required
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  showTime={{
                    format: 'HH:mm',
                    minuteStep: 30 as const,
                  }}
                  format="YYYY.MM.DD HH:mm"
                  value={publishedAt}
                  onChange={v => setPublishedAt(v)}
                  placeholder="게시일시를 선택해 주세요"
                />
              </div>
              <div className="posting-form-modal__filter-field posting-form-modal__filter-field--radio">
                <AdminFieldFrame size="medium" label="게시글 유형" required>
                  <CmsRadioGroup
                    size="medium"
                    value={status}
                    onChange={e => setStatus(e.target.value as RecruitPostingFormStatus)}
                  >
                    <CmsRadio size="medium" value="recruiting">
                      모집
                    </CmsRadio>
                    <CmsRadio size="medium" value="result">
                      발표
                    </CmsRadio>
                  </CmsRadioGroup>
                </AdminFieldFrame>
              </div>
              {/* 발표(RESULT)는 모집기간을 저장하지 않으므로 필드를 숨긴다. 입력값은 state에 남아 모집 전환 시 복원된다. */}
              {recruitPeriodRequired ? (
                <div className="posting-form-modal__filter-field posting-form-modal__filter-field--range">
                  <CmsDateRangePicker
                    label="모집 기간"
                    required
                    inputSize="medium"
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
              ) : null}
            </div>
          </div>

          <div className="posting-form-modal__section">
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
            className="posting-form-modal__section posting-form-modal__section--editor"
          >
            <div className="posting-form-modal__editor-host">
              <RichTextEditor
                editor={editor}
                minHeight={EDITOR_MIN_HEIGHT_PX}
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

          <div className="posting-form-modal__attachment">
            <div className="posting-form-modal__attachment-label">첨부 파일</div>
            <div className="posting-form-modal__attachment-body">
              <FileSelectField
                className="posting-form-modal__file-field"
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

          <div className="posting-form-modal__section posting-form-modal__section--link">
            <div className="posting-form-modal__group-title">
              <span className="posting-form-modal__group-title-text">연결 버튼</span>
              <span className="posting-form-modal__group-title-note">
                링크 입력 시 공고 상세에 버튼이 노출됩니다.
              </span>
            </div>
            <div className="posting-form-modal__link-row">
              <div className="posting-form-modal__link-field">
                <CmsInput
                  label={`채용 공고 바로가기 버튼명 (최대 ${CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH}자)`}
                  inputSize="medium"
                  width="100%"
                  maxLength={CAREER_POSTING_BUTTON_LABEL_MAX_LENGTH}
                  value={buttonLabel}
                  onChange={e => setButtonLabel(e.target.value)}
                  placeholder="하단에 노출할 버튼명을 입력해 주세요"
                />
              </div>
              <div className="posting-form-modal__link-field">
                <CmsInput
                  label="채용 공고 바로가기 링크"
                  inputSize="medium"
                  width="100%"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="버튼에 연결할 링크를 입력해 주세요"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
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
