import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import { Form, message } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { getFaqCategorySelectOptions } from '@/features/posts/api/admin-faq-category-mock-store'
import { createFaq, deleteFaq, updateFaq } from '@/features/posts/api/admin-faq-service'
import { useNoticeWysiwygEditor } from '@/features/posts/hooks/use-notice-wysiwyg-editor'
import type {
  FaqFormFieldValues,
  FaqFormModalProps,
} from '@/features/posts/model/faq-form-types'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'

const FAQ_EDITOR_HEIGHT = '240px'
const FAQ_EDITOR_PLACEHOLDER = 'FAQ내용을 입력해주세요....'

export type UseFaqFormModalResult = {
  form: FormInstance<FaqFormFieldValues>
  editorHostRef: RefObject<HTMLDivElement | null>
  getMarkdown: () => string
  categoryOptions: { label: string; value: string }[]
  handleSubmit: () => Promise<void>
  deleteConfirmOpen: boolean
  setDeleteConfirmOpen: (open: boolean) => void
  handleRequestDelete: () => void
  handleConfirmDelete: () => Promise<void>
  modalTitle: string
  submitLabel: string
  isEdit: boolean
  canWrite: boolean
  /** `mode === 'edit'` 인데 `faq` 없음 — 렌더 생략 */
  isBroken: boolean
}

export function useFaqFormModal({
  open,
  onCancel,
  mode = 'create',
  faq = null,
  onSuccess,
  onDeleted,
}: FaqFormModalProps): UseFaqFormModalResult {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [form] = Form.useForm<FaqFormFieldValues>()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const isEdit = mode === 'edit' && faq != null
  const isBroken = mode === 'edit' && open && !faq

  const initialMarkdown = useMemo(() => {
    if (!open) return ''
    if (isEdit && faq) return faq.answer ?? ''
    return ''
  }, [open, isEdit, faq])

  const editorResetKey = useMemo(
    () => (open ? `faq-${mode}-${faq?.id ?? 'new'}` : 'closed'),
    [open, mode, faq?.id]
  )

  const { editorHostRef, getMarkdown } = useNoticeWysiwygEditor(
    open,
    initialMarkdown,
    editorResetKey,
    {
      height: FAQ_EDITOR_HEIGHT,
      placeholder: FAQ_EDITOR_PLACEHOLDER,
    }
  )

  useEffect(() => {
    if (!open) return
    if (isEdit && faq) {
      form.setFieldsValue({
        question: faq.question,
        category: faq.category,
        visibility: faq.status === 'published' ? 'public' : 'private',
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        question: '',
        category: undefined,
        visibility: 'public',
      })
    }
  }, [open, isEdit, faq, form])

  useEffect(() => {
    if (!open) {
      setDeleteConfirmOpen(false)
    }
  }, [open])

  const categoryOptions = useMemo(() => getFaqCategorySelectOptions(), [open])

  const handleSubmit = useCallback(async () => {
    if (!canWrite) return
    try {
      const v = await form.validateFields()
      const answerMd = getMarkdown().trim()
      if (!answerMd) {
        message.warning('내용(답변)을 입력해주세요.')
        return
      }

      const category = v.category.trim()
      const author = user?.name?.trim() || '관리자'
      const status = v.visibility === 'public' ? 'published' : 'draft'

      if (isEdit && faq) {
        const updated = await updateFaq(faq.id, {
          category,
          question: v.question.trim(),
          answer: answerMd,
          author,
          status,
        })
        message.success('FAQ가 수정되었습니다.')
        onSuccess?.(updated)
      } else {
        const created = await createFaq({
          category,
          question: v.question.trim(),
          answer: answerMd,
          author,
          status,
          createdAt: new Date().toISOString(),
        })
        message.success('FAQ가 등록되었습니다.')
        onSuccess?.(created)
      }
      onCancel()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return
      }
      const msg =
        err instanceof Error
          ? err.message === 'NOT_FOUND'
            ? 'FAQ를 찾을 수 없습니다.'
            : err.message
          : '요청에 실패했습니다.'
      message.error(msg)
    }
  }, [canWrite, form, getMarkdown, isEdit, faq, onCancel, onSuccess, user?.name])

  const handleRequestDelete = useCallback(() => {
    if (!canWrite || !faq) return
    setDeleteConfirmOpen(true)
  }, [canWrite, faq])

  const handleConfirmDelete = useCallback(async () => {
    if (!faq) return
    try {
      await deleteFaq(faq.id)
      message.success('FAQ가 삭제되었습니다.')
      setDeleteConfirmOpen(false)
      onDeleted?.()
      onCancel()
    } catch {
      message.error('FAQ 삭제에 실패했습니다.')
    }
  }, [faq, onCancel, onDeleted])

  const modalTitle = isEdit ? 'FAQ 수정' : 'FAQ 등록'
  const submitLabel = isEdit ? '수정' : '등록'

  return {
    form,
    editorHostRef,
    getMarkdown,
    categoryOptions,
    handleSubmit,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    handleRequestDelete,
    handleConfirmDelete,
    modalTitle,
    submitLabel,
    isEdit,
    canWrite,
    isBroken,
  }
}
