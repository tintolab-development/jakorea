import { useEffect, useMemo, useRef, useState } from 'react'
import { Form } from 'antd'
import type { Notice, NoticeAttachment } from '@/features/posts/model/notice'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { getApiErrorField } from '@/shared/lib/extract-api-error-message'
import {
  noticeToFormValues,
  type NoticeFormFieldValues,
} from '@/features/posts/model/notice-form-mapper'
import { useNoticeCategoriesQuery } from '@/features/posts/hooks/use-notice-categories-query'
import { useNoticeMutations } from '@/features/posts/hooks/use-notice-mutations'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import {
  isAllowedNoticeAttachment,
  NOTICE_ATTACHMENT_ACCEPT,
  NOTICE_ATTACHMENT_MAX_BYTES,
  noticeInlineImageOwner,
  parseNoticeOwnerId,
  removeNoticeFileObjects,
  uploadUnboundNoticeAttachment,
} from '@/features/posts/api/notices/notice-attachments'
import { dedupeFileObjectIds } from '@/features/posts/api/notices/notice-file-ids'
import { RichTextEditor } from '@/shared/rich-text'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import {
  ContentModal,
  CmsButton,
  CmsFieldFrame,
  CmsInput,
  CmsRadioGroup,
  CmsSelect,
  FileSelectField,
  showDeleteCompletedAlert,
  showRegisterCompletedAlert,
  showUpdateCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { resolvePostsDeleteConfirmCopy } from '@/features/posts/lib/posts-delete-confirm-copy'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'

const NOTICE_SINGLE_DELETE_COPY = resolvePostsDeleteConfirmCopy('notice', 'single')
import './notice-register-modal.css'

function isRegisterableNoticeCategoryId(value: string): boolean {
  const v = value.trim()
  return v.length > 0 && v !== 'ALL' && v !== '전체'
}

export type NoticeFormModalMode = 'create' | 'edit'

export interface NoticeFormModalProps {
  open: boolean
  mode: NoticeFormModalMode
  /** `mode === 'edit'` 일 때 필수 */
  notice?: Notice | null
  onCancel: () => void
  onSuccess?: (notice: Notice) => void
  /** 수정 모드에서 삭제 완료 후 (예: 목록 이동) */
  onDeleted?: () => void
}

type FormValues = NoticeFormFieldValues & {
  categoryId: string | undefined
}

export function NoticeFormModal({
  open,
  mode,
  notice,
  onCancel,
  onSuccess,
  onDeleted,
}: NoticeFormModalProps) {
  const { user } = useAuthStore()
  const { showAlert } = useCmsAlert()
  const { createMutation, updateMutation, deleteMutation } = useNoticeMutations()
  const categoriesQuery = useNoticeCategoriesQuery(open)
  const [form] = Form.useForm<FormValues>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [existingAttachments, setExistingAttachments] = useState<NoticeAttachment[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploadingAttachments, setUploadingAttachments] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  /** 신규 등록에서 claim 전인 첨부. 성공 후에는 비워서 취소 cleanup이 지우지 않게 한다. */
  const unboundUploadsRef = useRef(new Map<File, number>())

  const authorName = user?.name?.trim() || '관리자'

  const initialMarkdown = useMemo(() => {
    if (!open) return ''
    if (mode === 'edit' && notice) return notice.content ?? ''
    return ''
  }, [open, mode, notice])

  const editorResetKey = useMemo(
    () => (open ? `${mode}-${notice?.id ?? 'new'}` : 'closed'),
    [open, mode, notice?.id]
  )

  const noticeInlineOwner = useMemo(() => {
    const id = mode === 'edit' && notice ? parseNoticeOwnerId(notice.id) : null
    return noticeInlineImageOwner(id)
  }, [mode, notice])

  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    open,
    initialMarkdown,
    editorResetKey,
    { fileUploadOwner: noticeInlineOwner }
  )

  /* 모달이 열릴 때마다 폼·첨부 세션 초기화(등록↔수정·다른 공지 전환) */
  /* eslint-disable react-hooks/set-state-in-effect -- open/mode/notice 변경 시 의도적 초기화 */
  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && notice) {
      form.setFieldsValue(noticeToFormValues(notice))
      setExistingAttachments(notice.attachments ?? [])
      setNewFiles([])
    } else {
      form.setFieldsValue({
        categoryId: undefined,
        visibility: 'public',
        pinTop: 'off',
        title: '',
      })
      setExistingAttachments([])
      setNewFiles([])
    }
    setUploadingAttachments(false)
    setErrorMessage(null)
    setContentError(null)
    setAttachmentError(null)
  }, [open, mode, notice, form])
  /* eslint-enable react-hooks/set-state-in-effect */

  /** 응답에 categoryId가 없고 name만 있을 때 — 카테고리 목록으로 id 보정 */
  useEffect(() => {
    if (!open || mode !== 'edit' || !notice) return
    const current = form.getFieldValue('categoryId')
    if (typeof current === 'string' && isRegisterableNoticeCategoryId(current)) return
    const rows = categoriesQuery.data ?? []
    if (notice.categoryId != null) {
      form.setFieldValue('categoryId', String(notice.categoryId))
      return
    }
    const byName = rows.find(row => row.name === notice.category)
    if (byName) form.setFieldValue('categoryId', byName.id)
  }, [open, mode, notice, categoriesQuery.data, form])

  const attachmentDisplayNames = useMemo(
    () => [...existingAttachments.map(item => item.name), ...newFiles.map(f => f.name)],
    [existingAttachments, newFiles]
  )
  /** API 카테고리만 — label=name, value=id. 하드코딩 폴백 없음 */
  const categorySelectOptions = useMemo(
    () =>
      (categoriesQuery.data ?? [])
        .map(row => ({ label: row.name, value: row.id }))
        .filter(opt => isRegisterableNoticeCategoryId(opt.value) && opt.label.trim().length > 0),
    [categoriesQuery.data]
  )

  const releaseUnclaimedUploads = () => {
    const ids = dedupeFileObjectIds([...unboundUploadsRef.current.values()])
    unboundUploadsRef.current.clear()
    if (ids.length > 0) void removeNoticeFileObjects(ids)
  }

  const markUploadsClaimed = () => {
    unboundUploadsRef.current.clear()
  }

  const handleCancel = () => {
    releaseUnclaimedUploads()
    form.resetFields()
    setExistingAttachments([])
    setNewFiles([])
    onCancel()
  }

  const handleRequestDelete = () => {
    if (mode !== 'edit' || !notice) return
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!notice) return
    try {
      await deleteMutation.mutateAsync(notice.id)
      setDeleteConfirmOpen(false)
      handleCancel()
      showDeleteCompletedAlert({ onConfirm: () => onDeleted?.() })
    } catch (error) {
      setErrorMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
    }
  }

  const handleAttachmentAdd = (files: File[]) => {
    const ok = files.filter(isAllowedNoticeAttachment)
    setNewFiles(prev => [...prev, ...ok])
  }

  const handleAttachmentRemove = (index: number) => {
    const nExisting = existingAttachments.length
    if (index < nExisting) {
      setExistingAttachments(prev => prev.filter((_, i) => i !== index))
      return
    }
    const ni = index - nExisting
    const removed = newFiles[ni]
    if (removed) {
      const uploadedId = unboundUploadsRef.current.get(removed)
      unboundUploadsRef.current.delete(removed)
      if (uploadedId != null) void removeNoticeFileObjects([uploadedId])
    }
    setNewFiles(prev => prev.filter((_, i) => i !== ni))
  }

  const fileObjectIdsForCreate = async (files: File[]): Promise<number[]> => {
    const ids: number[] = []
    for (const file of files) {
      const known = unboundUploadsRef.current.get(file)
      if (known != null) {
        ids.push(known)
        continue
      }
      const id = await uploadUnboundNoticeAttachment(file)
      unboundUploadsRef.current.set(file, id)
      ids.push(id)
    }
    return dedupeFileObjectIds(ids)
  }

  const handleFinish = async (values: FormValues) => {
    if (mode === 'edit' && !notice) {
      return
    }

    const md = getMarkdown().trim()
    const categoryIdRaw = values.categoryId?.trim() ?? ''
    const categoryId = Number(categoryIdRaw)
    const categoryMissing =
      !isRegisterableNoticeCategoryId(categoryIdRaw) || !Number.isFinite(categoryId)
    const visibilityMissing = values.visibility !== 'public' && values.visibility !== 'private'
    const pinMissing = values.pinTop !== 'on' && values.pinTop !== 'off'
    const titleMissing = !values.title?.trim()
    if (categoryMissing || visibilityMissing || pinMissing || titleMissing || !md) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    const categoryName =
      categorySelectOptions.find(opt => opt.value === categoryIdRaw)?.label?.trim() ?? ''

    const attachmentNames = attachmentDisplayNames
    const pinToTop = values.pinTop === 'on'
    const uploadsOnSave = newFiles.length > 0
    if (uploadsOnSave) setUploadingAttachments(true)
    try {
      let createFileObjectIds: number[] | undefined
      if (mode === 'create' && newFiles.length > 0) {
        createFileObjectIds = await fileObjectIdsForCreate(newFiles)
      }
      const base = {
        title: values.title,
        contentMarkdown: md,
        categoryId,
        category: categoryName,
        visibility: values.visibility,
        pinToTop,
        attachmentNames,
        newFiles: mode === 'create' ? [] : newFiles,
        fileObjectIds: createFileObjectIds,
        retainedFileObjectIds: existingAttachments.flatMap(item =>
          item.fileObjectId != null ? [item.fileObjectId] : []
        ),
        author: authorName,
      }

      const isCreate = mode === 'create'
      if (isCreate) {
        const created = await createMutation.mutateAsync(base)
        markUploadsClaimed()
        onSuccess?.(created)
      } else {
        const updated = await updateMutation.mutateAsync({
          id: notice!.id,
          existing: notice!,
          params: base,
        })
        onSuccess?.(updated)
      }
      setErrorMessage(null)
      form.resetFields()
      setExistingAttachments([])
      setNewFiles([])
      onCancel()
      if (isCreate) {
        showRegisterCompletedAlert()
      } else {
        showUpdateCompletedAlert()
      }
    } catch (error) {
      const message = getPostsApiErrorMessage(error, '저장에 실패했습니다.')
      const field = getApiErrorField(error)
      setErrorMessage(null)
      setContentError(null)
      setAttachmentError(null)
      if (field === 'content' || field === 'inlineImages') setContentError(message)
      else if (field === 'attachments') setAttachmentError(message)
      else setErrorMessage(message)
    } finally {
      if (uploadsOnSave) setUploadingAttachments(false)
    }
  }

  const modalTitle = mode === 'create' ? '공지사항 등록' : '공지사항 수정'
  const submitLabel = mode === 'create' ? '등록' : '수정'

  if (mode === 'edit' && open && !notice) {
    return null
  }

  return (
    <>
      <NoticeDeleteConfirmModal
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        preset="notice"
        {...NOTICE_SINGLE_DELETE_COPY}
      />
      <ContentModal
        open={open}
        onCancel={handleCancel}
        title={modalTitle}
        size="large"
        className="notice-register-modal"
        footer={
          <div className="notice-register-modal__footer-row">
            {mode === 'edit' ? (
              <CmsButton
                variant="delete"
                size="h40"
                className="cms-button--footer-auto"
                onClick={handleRequestDelete}
              >
                삭제
              </CmsButton>
            ) : null}
            <div className="notice-register-modal__footer-actions-right">
              <CmsButton
                variant="secondary"
                size="h40"
                className="cms-button--footer-auto"
                onClick={handleCancel}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="h40"
                className="cms-button--footer-auto"
                adminAction="write"
                onClick={() => form.submit()}
              >
                {submitLabel}
              </CmsButton>
            </div>
          </div>
        }
      >
        <Form<FormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          className="notice-register-modal__form"
          onFinish={handleFinish}
        >
          <div className="notice-register-modal__filter-wrap">
            <div className="notice-register-modal__filter-inner">
              <Form.Item
                name="categoryId"
                normalize={(value: unknown) => {
                  if (typeof value !== 'string') return undefined
                  return isRegisterableNoticeCategoryId(value) ? value.trim() : undefined
                }}
              >
                <CmsSelect
                  label="카테고리"
                  required
                  inputSize="large"
                  width={240}
                  withAllOption={false}
                  allowClear={false}
                  placeholder="카테고리 선택"
                  options={categorySelectOptions}
                />
              </Form.Item>
              <Form.Item name="visibility">
                <CmsRadioGroup
                  label="공개 여부"
                  required
                  size="large"
                  options={[
                    { label: '공개', value: 'public' },
                    { label: '비공개', value: 'private' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="pinTop">
                <CmsRadioGroup
                  label="상단 고정"
                  required
                  size="large"
                  options={[
                    { label: '고정 안함', value: 'off' },
                    { label: '고정', value: 'on' },
                  ]}
                />
              </Form.Item>
            </div>
          </div>

          <Form.Item name="title" className="notice-register-modal__section">
            <CmsInput
              label="제목"
              required
              placeholder="제목을 입력하세요"
              inputSize="large"
              width="100%"
            />
          </Form.Item>

          <CmsFieldFrame
            size="large"
            label="내용"
            required
            className="notice-register-modal__section notice-register-modal__section--editor"
            message={contentError}
            isError={Boolean(contentError)}
            messageClassName="notice-register-modal__error"
          >
            <div className="notice-register-modal__editor-host">
              <RichTextEditor
                editor={editor}
                minHeight={editorMinHeight}
                fileUploadOwner={noticeInlineOwner}
              />
            </div>
          </CmsFieldFrame>

          {errorMessage ? (
            <p className="notice-register-modal__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <DetailInfoForm
            title="첨부 파일"
            hideHeader
            mode="edit"
            className="notice-register-modal__attachment-form"
          >
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="첨부 파일"
                colSpan={2}
                view=""
                edit={
                  <>
                    <FileSelectField
                      className="notice-register-modal__file-field"
                      multiple
                      accept={NOTICE_ATTACHMENT_ACCEPT}
                      fileNames={attachmentDisplayNames}
                      maxTotalBytes={0}
                      maxFileBytes={NOTICE_ATTACHMENT_MAX_BYTES}
                      uploading={uploadingAttachments}
                      onFilesChange={handleAttachmentAdd}
                      onRemoveFile={handleAttachmentRemove}
                      guideLines={[
                        '파일별 최대 20MB까지 업로드 가능하며,',
                        'JPG, PNG, Excel, PDF, Word 형식만 지원됩니다.',
                      ]}
                      sizeExceededMessage={file =>
                        `${file?.name ?? '선택한 파일'}은(는) 파일별 최대 20MB를 초과했습니다.`
                      }
                    />
                    {attachmentError ? (
                      <p className="notice-register-modal__error" role="alert">
                        {attachmentError}
                      </p>
                    ) : null}
                  </>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </Form>
      </ContentModal>
    </>
  )
}
