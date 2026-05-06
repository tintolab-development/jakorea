import { useCallback } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { HorizontalTableFormEditor } from '@/features/template/ui/form-set/horizontal-table-form-editor'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'

type NewHorizontalTableFormQuery = {
  mode?: string
  type?: string
  id?: string
  userPreview?: string
}

export default function NewHorizontalTableForm() {
  const { params, setParams } = useQueryParams<NewHorizontalTableFormQuery>()
  const { closeWritingUserPreview, isWritingUserPreviewOpen } = useTemplateWritingPreview()

  useWritingUserPreviewUrlAuxiliarySync(params, setParams, isWritingUserPreviewOpen, closeWritingUserPreview)

  const handleClose = useCallback(() => {
    setParams({ mode: undefined, type: undefined, id: undefined, userPreview: undefined })
  }, [setParams])

  const onBeforeUserPreview = useCallback(() => {
    setParams({ userPreview: TEMPLATE_USER_PREVIEW_ACTIVE }, { replace: false })
  }, [setParams])

  return (
    <HorizontalTableFormEditor
      variant="fullpage-modal"
      onClose={handleClose}
      onBeforeUserPreview={onBeforeUserPreview}
      urlUserPreviewActive={params.userPreview === TEMPLATE_USER_PREVIEW_ACTIVE}
    />
  )
}
