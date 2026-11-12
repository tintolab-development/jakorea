import { useCallback, useEffect, useRef } from 'react'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import {
  lookupTemplateRegistry,
  type TemplateRegistryDefinition,
} from '@/features/template/model/template-registry/template-registry'
import { isTemplateDetailUrlMode } from '@/features/template/lib/detail-url-mode'

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
  runPreview: () => void
}

export function useTemplatePreviewController({
  params,
  setParams,
  isPreviewOpen: _isPreviewOpen,
  selectedTemplate,
  registryEntry,
  isWritingUserPreviewOpen,
  runPreview,
}: TemplatePreviewControllerParams) {
  const entry = registryEntry ?? lookupTemplateRegistry(selectedTemplate?.id)

  const templateUserPreviewUrlLatchRef = useRef<{
    templateKey: string | undefined
    blockAutoReopen: boolean
  }>({ templateKey: undefined, blockAutoReopen: false })

  const handlePreview = useCallback(() => {
    setParams({ userPreview: TEMPLATE_USER_PREVIEW_ACTIVE }, { replace: false })
    runPreview()
  }, [runPreview, setParams])

  useEffect(() => {
    const tid =
      isTemplateDetailUrlMode(params.mode) && params.id != null && params.id.trim() !== ''
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
    if (!isTemplateDetailUrlMode(params.mode)) return
    if (entry?.usesCrimeConsentModal === true) return
    if (!selectedTemplate) return
    if (isWritingUserPreviewOpen) {
      L.blockAutoReopen = true
      return
    }
    if (L.blockAutoReopen) return
    if (entry?.selfManagedPreview === true) return

    runPreview()
    L.blockAutoReopen = true
  }, [
    params.userPreview,
    params.mode,
    params.id,
    entry,
    selectedTemplate,
    isWritingUserPreviewOpen,
    runPreview,
  ])

  return { handlePreview }
}
