import { useCallback, useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import type { FormInstance } from 'antd/es/form'
import { getPostsApiErrorMessage } from '@/features/posts/api/get-posts-api-error'
import { useFaqCategoriesQuery } from '@/features/posts/hooks/use-faq-categories-query'
import { useFaqMutations } from '@/features/posts/hooks/use-faq-mutations'
import type {
  FaqFormFieldValues,
  FaqFormModalProps,
} from '@/features/posts/model/faq-form-types'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'
import { handleError } from '@/shared/utils/error-handler'

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
  onDeleted,
}: FaqFormModalProps): UseFaqFormModalResult {
  const { user } = useAuthStore()
  const canWrite = canPerformWriteAction(user)
  const [form] = Form.useForm<FaqFormFieldValues>()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { createMutation, updateMutation, deleteMutation } = useFaqMutations()

  const isEdit = mode === 'edit' && faq != null
  const isBroken = mode === 'edit' && open && !faq

  useEffect(() => {
    if (!open) return
    if (isEdit && faq) {
      form.setFieldsValue({
        question: faq.question,
        answer: faq.answer ?? '',
        category: faq.category,
        visibility: faq.status === 'published' ? 'public' : 'private',
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        question: '',
        answer: '',
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

  const categoriesQuery = useFaqCategoriesQuery(open)
  const categoryOptions = useMemo(
    () => (categoriesQuery.data ?? []).map(row => ({ label: row.name, value: row.name })),
    [categoriesQuery.data]
  )

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
        const updated = await updateMutation.mutateAsync({
          id: faq.id,
          patch: {
            category,
            question: v.question.trim(),
            answer,
            author,
            status,
          },
        })
        onSuccess?.(updated)
      } else {
        const created = await createMutation.mutateAsync({
          category,
          question: v.question.trim(),
          answer,
          author,
          status,
          createdAt: new Date().toISOString(),
        })
        onSuccess?.(created)
      }
      onCancel()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return
      }
      handleError(err, {
        context: 'useFaqFormModal.handleSubmit',
        defaultMessage: getPostsApiErrorMessage(err, '저장에 실패했습니다.'),
      })
    }
  }, [
    canWrite,
    createMutation,
    form,
    isEdit,
    faq,
    onCancel,
    onSuccess,
    updateMutation,
    user?.name,
  ])

  const handleRequestDelete = useCallback(() => {
    if (!canWrite || !faq) return
    setDeleteConfirmOpen(true)
  }, [canWrite, faq])

  const handleConfirmDelete = useCallback(async () => {
    if (!faq) return
    try {
      await deleteMutation.mutateAsync(faq.id)
      setDeleteConfirmOpen(false)
      onDeleted?.()
      onCancel()
    } catch (err) {
      handleError(err, {
        context: 'useFaqFormModal.handleConfirmDelete',
        defaultMessage: getPostsApiErrorMessage(err, '삭제에 실패했습니다.'),
      })
    }
  }, [deleteMutation, faq, onCancel, onDeleted])

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
    isBroken,
  }
}
