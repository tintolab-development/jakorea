import {
  TemplateFullpageModal,
  type TemplateFullpageModalFooterAction,
} from '@/features/template/ui/template-management/template-fullpage-modal'
import type { TemplateRegistryDefinition } from '@/features/template/model/template-registry/template-registry'
import type { TemplateRendererContext } from '@/features/template/ui/template-renderers/template-renderer-types'
import { TemplatePreviewModalEditor } from '@/features/template/ui/template-management/template-preview-modal-editor'
import type { TemplatePreviewControllerParams } from '@/features/template/hooks/use-template-preview-controller'

export type TemplatePreviewModalProps = {
  open: boolean
  onClose: () => void
  title: string
  showDeleteButton?: boolean
  onDelete?: () => void
  deleteLoading?: boolean
  registryEntry: TemplateRegistryDefinition | undefined
  templateId: string | undefined
  templateName: string | undefined
  onTemplateDraftSaveConfirmed?: () => void
  generic: TemplateRendererContext['generic']
  previewControllerBase: Omit<TemplatePreviewControllerParams, 'runPreview'>
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
  showDeleteButton,
  onDelete,
  deleteLoading,
  registryEntry,
  templateId,
  templateName,
  onTemplateDraftSaveConfirmed,
  generic,
  previewControllerBase,
  registrationUserMode = false,
  footerAction,
}: TemplatePreviewModalProps) {
  if (!open) {
    return (
      <TemplateFullpageModal
        open={false}
        onClose={onClose}
        title={title}
        templateTabType="writing"
        leftContent={null}
        rightNavigation={null}
      />
    )
  }

  return (
    <TemplatePreviewModalEditor
      title={title}
      onClose={onClose}
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      deleteLoading={deleteLoading}
      registryEntry={registryEntry}
      templateId={templateId}
      templateName={templateName}
      onTemplateDraftSaveConfirmed={onTemplateDraftSaveConfirmed}
      registrationUserMode={registrationUserMode}
      footerAction={footerAction}
      generic={generic}
      previewControllerBase={previewControllerBase}
    />
  )
}
