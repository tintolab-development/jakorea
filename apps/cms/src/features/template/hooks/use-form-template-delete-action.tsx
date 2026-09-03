import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteFormTemplate } from '@/features/template/api/admin-form-templates-service'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { shouldShowWritingFormTemplateDeleteButton } from '@/features/template/lib/form-template-delete-policy'
import { useFormsSurveysRemoteEnabled } from '@/features/template/hooks/use-forms-surveys-remote-enabled'
import type { TemplateRow } from '@/features/template/model/template.schema'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { useCmsAlert } from '@/shared/ui'

export function useFormTemplateDeleteAction(args: {
  templateRow: TemplateRow | null | undefined
  onDeleted: () => void
}) {
  const { templateRow, onDeleted } = args
  const remoteEnabled = useFormsSurveysRemoteEnabled()
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const showDeleteButton = shouldShowWritingFormTemplateDeleteButton(templateRow, remoteEnabled)

  const requestDelete = useCallback(() => {
    if (!showDeleteButton) return
    setConfirmOpen(true)
  }, [showDeleteButton])

  const handleConfirmDelete = useCallback(async () => {
    if (templateRow == null) return
    setDeleting(true)
    try {
      await deleteFormTemplate(templateRow.id)
      await queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.writingSections() })
      setConfirmOpen(false)
      showAlert({
        title: '삭제',
        content: '템플릿이 삭제되었습니다.',
        onConfirm: onDeleted,
      })
    } catch (error) {
      console.warn('[form-templates] delete failed', error)
      showAlert({
        title: '삭제 실패',
        content: '템플릿 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.',
      })
    } finally {
      setDeleting(false)
    }
  }, [onDeleted, queryClient, showAlert, templateRow])

  const deleteConfirmModal = (
    <ConfirmModal
      open={confirmOpen}
      title="템플릿 삭제"
      content="해당 템플릿을 삭제하시겠습니까?"
      confirmText="삭제"
      cancelText="취소"
      danger
      confirmLoading={deleting}
      onConfirm={() => {
        void handleConfirmDelete()
      }}
      onCancel={() => {
        if (deleting) return
        setConfirmOpen(false)
      }}
    />
  )

  return {
    showDeleteButton,
    deleteLoading: deleting,
    requestDelete,
    deleteConfirmModal,
  }
}
