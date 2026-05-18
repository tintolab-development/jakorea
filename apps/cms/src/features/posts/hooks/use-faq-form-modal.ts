import { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { getFaqCategorySelectOptions } from '@/features/posts/api/admin-faq-category-mock-store'
import { createFaq, deleteFaq, updateFaq } from '@/features/posts/api/admin-faq-service'
import type {
  FaqFormFieldValues,
  FaqFormModalProps } from '@/features/posts/model/faq-form-types'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { handleError, unknownErrorText } from '@/shared/utils/error-handler'

export type UseFaqFormModalResult = {
  form: FormInstance<FaqFormFieldValues>
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
  onDeleted }: FaqFormModalProps): UseFaqFormModalResult {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [form] = Form.useForm<FaqFormFieldValues>()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const isEdit = mode === 'edit' && faq != null
  const isBroken = mode === 'edit' && open && !faq

  useEffect(() => {
    if (!open) return
    if (isEdit && faq) {
      form.setFieldsValue({
        question: faq.question,
        answer: faq.answer ?? '',
        category: faq.category,
        visibility: faq.status === 'published' ? 'public' : 'private' })
    } else {
      form.resetFields()
      form.setFieldsValue({
        question: '',
        answer: '',
        category: undefined,
        visibility: 'public' })
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
      const answer = v.answer.trim()
      if (!answer) {
        return
      }

      const category = v.category.trim()
      const author = user?.name?.trim() || '관리자'
      const status = v.visibility === 'public' ? 'published' : 'draft'

      if (isEdit && faq) {
        const updated = await updateFaq(faq.id, {
          category,
          question: v.question.trim(),
          answer,
          author,
          status })
        onSuccess?.(updated)
      } else {
        const created = await createFaq({
          category,
          question: v.question.trim(),
          answer,
          author,
          status,
          createdAt: new Date().toISOString() })
        onSuccess?.(created)
      }
      onCancel()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return
      }
      const msg =
        err instanceof Error
          ? unknownErrorText(err, '오류가 발생했습니다.') === 'NOT_FOUND'
            ? 'FAQ를 찾을 수 없습니다.'
            : unknownErrorText(err, '오류가 발생했습니다.')
          : '요청에 실패했습니다.'
      handleError(err, { context: 'useFaqFormModal.handleSubmit', defaultMessage: msg })
    }
  }, [canWrite, form, isEdit, faq, onCancel, onSuccess, user?.name])

  const handleRequestDelete = useCallback(() => {
    if (!canWrite || !faq) return
    setDeleteConfirmOpen(true)
  }, [canWrite, faq])

  const handleConfirmDelete = useCallback(async () => {
    if (!faq) return
    try {
      await deleteFaq(faq.id)
      setDeleteConfirmOpen(false)
      onDeleted?.()
      onCancel()
    } catch (err) {
      handleError(err, { context: 'useFaqFormModal.handleConfirmDelete' })
    }
  }, [faq, onCancel, onDeleted])

  const modalTitle = isEdit ? 'FAQ 수정' : 'FAQ 등록'
  const submitLabel = isEdit ? '수정' : '등록'

  return {
    form,
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
    isBroken }
}
