import { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import type { Notice } from '@/data/mock/notices'
import { getNoticeCategorySelectOptions } from '@/features/posts/api/admin-notice-category-mock-store'
import {
  buildNoticeCreateBody,
  buildNoticeUpdateBody,
  noticeInitialAttachmentNames,
  noticeToFormValues,
  type NoticeFormFieldValues } from '@/features/posts/model/notice-form-mapper'
import { createAdminNotice, updateAdminNotice } from '@/features/posts/api/admin-notice-mock-store'
import { deleteNotice } from '@/features/posts/api/admin-notice-service'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import {
  ContentModal,
  CmsButton,
  CmsInput,
  CmsSelect,
  CmsRadioGroup,
  FileSelectField } from '@/shared/ui'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import './notice-register-modal.css'

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
  category: string | undefined
}

const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024

export function NoticeFormModal({
  open,
  mode,
  notice,
  onCancel,
  onSuccess,
  onDeleted }: NoticeFormModalProps) {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [form] = Form.useForm<FormValues>()
  const [existingAttachmentNames, setExistingAttachmentNames] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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

  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    open,
    initialMarkdown,
    editorResetKey
  )

  /* 모달이 열릴 때마다 폼·첨부 세션 초기화(등록↔수정·다른 공지 전환) */
  /* eslint-disable react-hooks/set-state-in-effect -- open/mode/notice 변경 시 의도적 초기화 */
  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && notice) {
      form.setFieldsValue(noticeToFormValues(notice))
      setExistingAttachmentNames(noticeInitialAttachmentNames(notice))
      setNewFiles([])
    } else {
      form.setFieldsValue({
        category: undefined,
        visibility: 'public',
        pinTop: 'off',
        title: '' })
      setExistingAttachmentNames([])
      setNewFiles([])
    }
  }, [open, mode, notice, form])
  /* eslint-enable react-hooks/set-state-in-effect */

  const attachmentDisplayNames = useMemo(
    () => [...existingAttachmentNames, ...newFiles.map(f => f.name)],
    [existingAttachmentNames, newFiles]
  )

  /** 카테고리 관리·저장소와 동기화된 옵션 (모달이 열릴 때마다 최신 목록) */
  const categorySelectOptions = useMemo(() => getNoticeCategorySelectOptions(), [open])

  const handleCancel = () => {
    form.resetFields()
    setExistingAttachmentNames([])
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
      await deleteNotice(notice.id)
      setDeleteConfirmOpen(false)
      handleCancel()
      onDeleted?.()
    } catch (error) {
      console.debug('noticeFormModal delete failed', error)
    }
  }

  const handleAttachmentAdd = (files: File[]) => {
    const ok = files.filter(f => {
      if (f.size > ATTACHMENT_MAX_BYTES) {
        return false
      }
      return true
    })
    setNewFiles(prev => [...prev, ...ok])
  }

  const handleAttachmentRemove = (index: number) => {
    const nExisting = existingAttachmentNames.length
    if (index < nExisting) {
      setExistingAttachmentNames(prev => prev.filter((_, i) => i !== index))
    } else {
      const ni = index - nExisting
      setNewFiles(prev => prev.filter((_, i) => i !== ni))
    }
  }

  const handleFinish = (values: FormValues) => {
    if (mode === 'edit' && !notice) {
      return
    }

    const md = getMarkdown().trim()
    if (!md) {
      return
    }

    const attachmentNames = [...existingAttachmentNames, ...newFiles.map(f => f.name)]
    const pinToTop = values.pinTop === 'on'
    const base = {
      title: values.title,
      contentMarkdown: md,
      category: values.category!,
      visibility: values.visibility,
      pinToTop,
      attachmentNames,
      author: authorName }

    if (mode === 'create') {
      const created = createAdminNotice(buildNoticeCreateBody(base))
      onSuccess?.(created)
    } else {
      const updated = updateAdminNotice(notice!.id, buildNoticeUpdateBody(notice!, base))
      if (updated) {
        onSuccess?.(updated)
      } else {
        return
      }
    }

    form.resetFields()
    setExistingAttachmentNames([])
    setNewFiles([])
    onCancel()
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
                size="large"
                onClick={handleRequestDelete}
                disabled={!canWrite}
              >
                삭제
              </CmsButton>
            ) : null}
            <div className="notice-register-modal__footer-actions-right">
              <CmsButton variant="secondary" size="large" onClick={handleCancel}>
                취소
              </CmsButton>
              <CmsButton variant="primary" size="large" onClick={() => form.submit()}>
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
                name="category"
                label="카테고리"
                className="notice-register-modal__filter-field notice-register-modal__filter-field--category"
                rules={[{ required: true }]}
              >
                <CmsSelect
                  placeholder="카테고리 선택"
                  options={categorySelectOptions}
                  inputSize="large"
                  width={240}
                />
              </Form.Item>
              <Form.Item
                name="visibility"
                label="공개 여부"
                className="notice-register-modal__filter-field"
                rules={[{ required: true }]}
              >
                <CmsRadioGroup
                  size="large"
                  options={[
                    { label: '공개', value: 'public' },
                    { label: '비공개', value: 'private' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="pinTop"
                label="상단 고정"
                className="notice-register-modal__filter-field"
                rules={[{ required: true }]}
              >
                <CmsRadioGroup
                  size="large"
                  options={[
                    { label: '고정 안함', value: 'off' },
                    { label: '고정', value: 'on' },
                  ]}
                />
              </Form.Item>
            </div>
          </div>

          <Form.Item
            name="title"
            label="제목"
            className="notice-register-modal__section"
            rules={[{ required: true }]}
          >
            <CmsInput placeholder="제목을 입력해주세요" inputSize="large" width="100%" />
          </Form.Item>

          <div className="notice-register-modal__section notice-register-modal__section--editor">
            <div className="notice-register-modal__editor-label">내용</div>
            <div className="notice-register-modal__editor-host">
              <RichTextEditor editor={editor} minHeight={editorMinHeight} />
            </div>
          </div>

          <div className="notice-register-modal__attachment">
            <div className="notice-register-modal__attachment-label">첨부 파일</div>
            <div className="notice-register-modal__attachment-body">
              <FileSelectField
                className="notice-register-modal__file-field"
                multiple
                buttonLabel="파일 추가"
                fileNames={attachmentDisplayNames}
                onFilesChange={handleAttachmentAdd}
                onRemoveFile={handleAttachmentRemove}
                guideLines={[
                  '파일은 최대 20MB까지 업로드 가능하며,',
                  'PDF, 이미지, 문서 파일 형식만 지원됩니다.',
                ]}
              />
            </div>
          </div>
        </Form>
      </ContentModal>
    </>
  )
}
