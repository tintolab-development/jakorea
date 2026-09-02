import { useMemo } from 'react'
import {
  TemplateFullpageModal,
  type TemplateFullpageModalFooterAction,
} from '@/features/template/ui/template-management/template-fullpage-modal'
import { TEMPLATE_FORM_MODAL_DESCRIPTION } from '@/features/template/model/template-registry/template-registry'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import type { TemplateRendererContext } from '@/features/template/ui/template-renderers/template-renderer-types'
import { FormDraftLoading } from '@/features/template/ui/form-draft-loading'

export type TemplatePreviewModalProps = {
  open: boolean
  onClose: () => void
  title: string
  onPreview: () => void
  onSave?: () => void
  showDeleteButton?: boolean
  onDelete?: () => void
  deleteLoading?: boolean
  rendererContext: TemplateRendererContext
  /**
   * 프로그램 등록 등 **사용자 모드** 레이아웃(청록 헤더·임시저장).
   * `/templates/form-management` 템플릿 편집에서는 사용하지 않는다.
   */
  registrationUserMode?: boolean
  footerAction?: TemplateFullpageModalFooterAction
}

export function TemplatePreviewModal({
  open,
  onClose,
  title,
  onPreview,
  onSave,
  showDeleteButton,
  onDelete,
  deleteLoading,
  rendererContext,
  registrationUserMode = false,
  footerAction,
}: TemplatePreviewModalProps) {
  const panels = useMemo(
    () => resolveTemplateEditorPanels(rendererContext),
    [rendererContext]
  )
  const isDraftLoading = rendererContext.editorVm.isDraftLoading === true

  return (
    <TemplateFullpageModal
      open={open}
      onClose={onClose}
      title={title}
      description={
        registrationUserMode
          ? undefined
          : (rendererContext.registryEntry?.modalDescription ?? TEMPLATE_FORM_MODAL_DESCRIPTION)
      }
      templateTabType="writing"
      onPreview={onPreview}
      onSave={onSave}
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      deleteLoading={deleteLoading}
      registrationUserMode={registrationUserMode}
      footerAction={footerAction}
      leftContent={isDraftLoading ? <FormDraftLoading /> : panels.leftContent}
      rightNavigation={isDraftLoading ? null : panels.rightNavigation}
    />
  )
}
