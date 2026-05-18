import { useCallback, useEffect, useRef } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { createContentOnlyA4PreviewOptions } from '@/features/template/lib/a4-preview-template-options'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  isParticipantApplicationRegistryEntry,
  isRegistrationRegistryEntry,
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewEditorKind,
  resolvePreviewHeaderTitle,
  shouldRegistryUseA4Preview,
  type TemplateRegistryDefinition,
} from '@/features/template/model/template-registry/template-registry'
import type { useTemplateEditorVm } from '@/features/template/hooks/use-template-editor-vm'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

const EMPTY_PREVIEW_DRAFT: WritingFormDraft = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [],
}

const noopUpdateParagraph: FormUpdateParagraph = () => {}

export type TemplatePreviewControllerParams = {
  params: {
    mode?: string
    id?: string
    userPreview?: string
  }
  setParams: (
    patch: Record<string, string | undefined>,
    options?: { replace?: boolean }
  ) => void
  isPreviewOpen: boolean
  selectedTemplate: { id: string; templateName: string } | null
  registryEntry: TemplateRegistryDefinition | undefined
  isWritingUserPreviewOpen: boolean
  editorVm: ReturnType<typeof useTemplateEditorVm>
}

export function useTemplatePreviewController({
  params,
  setParams,
  isPreviewOpen: _isPreviewOpen,
  selectedTemplate,
  registryEntry,
  isWritingUserPreviewOpen,
  editorVm,
}: TemplatePreviewControllerParams) {
  const { openWritingUserPreview } = useTemplateWritingPreview()
  const entry = registryEntry ?? lookupTemplateRegistry(selectedTemplate?.id)

  const templateUserPreviewUrlLatchRef = useRef<{
    templateKey: string | undefined
    blockAutoReopen: boolean
  }>({ templateKey: undefined, blockAutoReopen: false })

  const openGenericWritingPreview = useCallback(() => {
    if (selectedTemplate == null) return
    const genericA4Options = shouldRegistryUseA4Preview(entry)
      ? createContentOnlyA4PreviewOptions()
      : undefined
    openWritingUserPreview({
      draft: EMPTY_PREVIEW_DRAFT,
      updateParagraph: noopUpdateParagraph,
      headerTitle: resolvePreviewHeaderTitle(entry, selectedTemplate.templateName),
      editorKind: resolvePreviewEditorKind(entry),
      previewLayout: genericA4Options?.previewLayout,
      a4RenderMode: genericA4Options?.a4RenderMode,
      hideParagraphRequiredChrome: genericA4Options?.hideParagraphRequiredChrome,
    })
  }, [entry, openWritingUserPreview, selectedTemplate])

  const runPreviewForRegistry = useCallback(() => {
    if (entry && isRegistrationRegistryEntry(entry) && entry.registrationEditor === 'general') {
      editorVm.programRegistrationVm.handlePreview()
      return
    }
    if (entry?.registrationEditor === 'ujat') {
      editorVm.ujatProgramRegistrationVm.handlePreview()
      return
    }
    if (isParticipantApplicationRegistryEntry(entry)) {
      editorVm.programParticipantApplicationVm.handlePreview()
      return
    }
    if (isSurveyRegistryEntry(entry)) {
      editorVm.surveyListEditor.handlePreview()
      return
    }
    openGenericWritingPreview()
  }, [editorVm, entry, openGenericWritingPreview])

  const handlePreview = useCallback(() => {
    setParams({ userPreview: TEMPLATE_USER_PREVIEW_ACTIVE }, { replace: false })
    runPreviewForRegistry()
  }, [runPreviewForRegistry, setParams])

  useEffect(() => {
    const tid =
      params.mode === 'edit' && params.id != null && params.id.trim() !== ''
        ? params.id.trim()
        : undefined
    const latch = templateUserPreviewUrlLatchRef.current
    if (latch.templateKey !== tid) {
      templateUserPreviewUrlLatchRef.current = { templateKey: tid, blockAutoReopen: false }
    }
    const L = templateUserPreviewUrlLatchRef.current

    if (params.userPreview !== TEMPLATE_USER_PREVIEW_ACTIVE) {
      L.blockAutoReopen = false
      return
    }
    if (params.mode !== 'edit') return
    if (entry?.usesCrimeConsentModal === true) return
    if (!selectedTemplate) return
    if (isWritingUserPreviewOpen) {
      L.blockAutoReopen = true
      return
    }
    if (L.blockAutoReopen) return
    if (entry?.selfManagedPreview === true) return

    runPreviewForRegistry()
    L.blockAutoReopen = true
  }, [
    params.userPreview,
    params.mode,
    params.id,
    entry,
    selectedTemplate,
    isWritingUserPreviewOpen,
    runPreviewForRegistry,
  ])

  return { handlePreview }
}
