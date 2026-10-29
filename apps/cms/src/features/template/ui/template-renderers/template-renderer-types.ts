import type { ReactNode } from 'react'
import type { TemplateRegistryDefinition } from '@/features/template/model/template-registry/template-registry'
import type { useTemplateEditorVm } from '@/features/template/hooks/use-template-editor-vm'
import type { TemplateModalLeftCardConfig } from '@/features/template/ui/template-management/template-modal-left-content'
import type { TemplateModalRightNavigationConfig } from '@/features/template/ui/template-management/template-modal-right-navigation'

export type TemplateEditorVm = ReturnType<typeof useTemplateEditorVm>

export type GenericTemplateModalState = {
  orderedLeftContentConfig: TemplateModalLeftCardConfig[]
  activeCardId: string | null
  setActiveCardId: (id: string | null) => void
  applyOrderedCards: (ids: string[]) => void
  rightNavigationConfig: TemplateModalRightNavigationConfig
}

export type TemplateRendererContext = {
  registryEntry: TemplateRegistryDefinition | undefined
  editorVm: TemplateEditorVm
  generic: GenericTemplateModalState
}

export type TemplateRendererPanels = {
  leftContent: ReactNode
  rightNavigation: ReactNode
}
