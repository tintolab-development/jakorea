import { useEffect, useMemo, useState, forwardRef } from 'react'
import { Form, Select } from 'antd'
import type { RefSelectProps } from 'antd/es/select'
import type { Notice } from '@/data/mock/notices'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import {
  noticeInitialAttachmentNames,
  noticeToFormValues,
  type NoticeFormFieldValues,
} from '@/features/posts/model/notice-form-mapper'
import { useNoticeCategoriesQuery } from '@/features/posts/hooks/use-notice-categories-query'
import { useNoticeMutations } from '@/features/posts/hooks/use-notice-mutations'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor } from '@/shared/rich-text'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  ContentModal,
  CmsButton,
  CmsInput,
  CmsRadioGroup,
  FileSelectField,
} from '@/shared/ui'
import { NoticeDeleteConfirmModal } from '@/features/posts/ui/notice-delete-confirm-modal'
import './notice-register-modal.css'

function isRegisterableNoticeCategoryId(value: string): boolean {
  const v = value.trim()
  return v.length > 0 && v !== 'ALL' && v !== '전체'
}

/** 등록/수정 전용 — CmsSelect의 「전체」 자동삽입을 쓰지 않음. value = category.id */
const NoticeCategorySelect = forwardRef<
  RefSelectProps,
  {
    value?: string
    onChange?: (value: string | undefined) => void
    options: { label: string; value: string }[]
    id?: string
    'aria-describedby'?: string
    status?: '' | 'warning' | 'error'
  }
>(function NoticeCategorySelect(
  { value, onChange, options, id, status: _status, ...rest },
  ref
) {
  const resolved =
    typeof value === 'string' && isRegisterableNoticeCategoryId(value) ? value : undefined
  return (
    <span className="cms-select cms-select--large cms-select--explicit-width" style={{ width: 240 }}>
      <Select
        {...rest}
        id={id}
        ref={ref}
        variant="borderless"
        placeholder="카테고리 선택"
        options={options}
        value={resolved}
        allowClear={false}
        popupMatchSelectWidth
        onChange={next => {
          if (typeof next !== 'string' || !isRegisterableNoticeCategoryId(next)) {
            onChange?.(undefined)
            return
          }
          onChange?.(next.trim())
        }}
      />
    </span>
  )
})
NoticeCategorySelect.displayName = 'NoticeCategorySelect'

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

const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024

export function NoticeFormModal({
  open,
  mode,
  notice,
  onCancel,
  onSuccess,
  onDeleted,
}: NoticeFormModalProps) {
  const { user } = useAuthStore()
  const { createMutation, updateMutation, deleteMutation } = useNoticeMutations()
  const categoriesQuery = useNoticeCategoriesQuery(open)
  const [form] = Form.useForm<FormValues>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
        categoryId: undefined,
        visibility: 'public',
        pinTop: 'off',
        title: '',
      })
      setExistingAttachmentNames([])
      setNewFiles([])
    }
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
    () => [...existingAttachmentNames, ...newFiles.map(f => f.name)],
    [existingAttachmentNames, newFiles]
  )

  /** API 카테고리만 — label=name, value=id. 하드코딩 폴백 없음 */
  const categorySelectOptions = useMemo(
    () =>
      (categoriesQuery.data ?? [])
        .map(row => ({ label: row.name, value: row.id }))
        .filter(opt => isRegisterableNoticeCategoryId(opt.value) && opt.label.trim().length > 0),
    [categoriesQuery.data]
  )

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
      await deleteMutation.mutateAsync(notice.id)
      setDeleteConfirmOpen(false)
      handleCancel()
      onDeleted?.()
    } catch (error) {
      setErrorMessage(getPostsApiErrorMessage(error, '삭제에 실패했습니다.'))
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

  const handleFinish = async (values: FormValues) => {
    if (mode === 'edit' && !notice) {
      return
    }

    const md = getMarkdown().trim()
    if (!md) {
      setErrorMessage('내용을 입력해 주세요.')
      return
    }

    const categoryIdRaw = values.categoryId?.trim() ?? ''
    const categoryId = Number(categoryIdRaw)
    if (!isRegisterableNoticeCategoryId(categoryIdRaw) || !Number.isFinite(categoryId)) {
      setErrorMessage('카테고리를 선택해 주세요.')
      return
    }
    const categoryName =
      categorySelectOptions.find(opt => opt.value === categoryIdRaw)?.label?.trim() ?? ''

    const attachmentNames = [...existingAttachmentNames, ...newFiles.map(f => f.name)]
    const pinToTop = values.pinTop === 'on'
    const base = {
      title: values.title,
      contentMarkdown: md,
      categoryId,
      category: categoryName,
      visibility: values.visibility,
      pinToTop,
      attachmentNames,
      newFiles,
      author: authorName,
    }

    try {
      if (mode === 'create') {
        const created = await createMutation.mutateAsync(base)
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
      setExistingAttachmentNames([])
      setNewFiles([])
      onCancel()
    } catch (error) {
      setErrorMessage(getPostsApiErrorMessage(error, '저장에 실패했습니다.'))
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
              <CmsButton variant="delete" size="large" onClick={handleRequestDelete}>
                공지사항 삭제
              </CmsButton>
            ) : null}
            <div className="notice-register-modal__footer-actions-right">
              <CmsButton variant="secondary" size="large" onClick={handleCancel}>
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
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
                label="카테고리"
                className="notice-register-modal__filter-field notice-register-modal__filter-field--category"
                normalize={(value: unknown) => {
                  if (typeof value !== 'string') return undefined
                  return isRegisterableNoticeCategoryId(value) ? value.trim() : undefined
                }}
                rules={[
                  {
                    validator: async (_, value) => {
                      if (typeof value !== 'string' || !isRegisterableNoticeCategoryId(value)) {
                        throw new Error('카테고리를 선택해 주세요.')
                      }
                    },
                  },
                ]}
              >
                <NoticeCategorySelect options={categorySelectOptions} />
              </Form.Item>
              <Form.Item
                name="visibility"
                label="공개 여부"
                className="notice-register-modal__filter-field"
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
            rules={[{ required: true, whitespace: true, message: '제목을 입력해 주세요.' }]}
          >
            <CmsInput placeholder="제목을 입력하세요" inputSize="large" width="100%" />
          </Form.Item>

          <div className="notice-register-modal__section notice-register-modal__section--editor">
            <div className="notice-register-modal__editor-label">내용</div>
            <div className="notice-register-modal__editor-host">
              <RichTextEditor editor={editor} minHeight={editorMinHeight} />
            </div>
          </div>

          {errorMessage ? (
            <p className="notice-register-modal__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="notice-register-modal__attachment">
            <div className="notice-register-modal__attachment-label">첨부 파일</div>
            <div className="notice-register-modal__attachment-body">
              <FileSelectField
                className="notice-register-modal__file-field"
                multiple
                buttonLabel="파일 추가"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,.ppt,.pptx"
                fileNames={attachmentDisplayNames}
                currentTotalBytes={newFiles.reduce((sum, file) => sum + file.size, 0)}
                maxTotalBytes={ATTACHMENT_MAX_BYTES}
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
