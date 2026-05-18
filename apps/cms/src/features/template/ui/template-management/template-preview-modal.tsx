import { useMemo } from 'react'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { TEMPLATE_FORM_MODAL_DESCRIPTION } from '@/features/template/model/template-registry/template-registry'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import type { TemplateRendererContext } from '@/features/template/ui/template-renderers/template-renderer-types'

export type TemplatePreviewModalProps = {
  open: boolean
  onClose: () => void
  title: string
  onPreview: () => void
  onSave?: () => void
  rendererContext: TemplateRendererContext
}

export function TemplatePreviewModal({
  open,
  onClose,
  title,
  onPreview,
  onSave,
  rendererContext,
}: TemplatePreviewModalProps) {
  const panels = useMemo(
    () => resolveTemplateEditorPanels(rendererContext),
    [rendererContext]
  )

  return (
    <TemplateFullpageModal
      open={open}
      onClose={onClose}
      title={title}
      description={TEMPLATE_FORM_MODAL_DESCRIPTION}
      templateTabType="writing"
      onPreview={onPreview}
      onSave={onSave}
      leftContent={panels.leftContent}
      rightNavigation={panels.rightNavigation}
    />
  )
}
