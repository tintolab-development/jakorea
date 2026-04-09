import { useEffect, useMemo, useState } from 'react'
import type { TemplateModalLeftCardConfig } from '@/shared/components/template/template-modal-left-content'
import type { TemplateRow } from '@/features/template/model/template.schema'

interface UseTemplateModalParams {
  buildBaseLeftContentConfig: (selectedTemplate: TemplateRow | null) => TemplateModalLeftCardConfig[]
}

interface UseTemplateModalResult {
  isPreviewOpen: boolean
  selectedTemplate: TemplateRow | null
  orderedLeftContentConfig: TemplateModalLeftCardConfig[]
  activeCardId: string | null
  setActiveCardId: (id: string | null) => void
  openTemplatePreview: (row: TemplateRow) => void
  closeTemplatePreview: () => void
  applyOrderedCards: (orderedIds: string[]) => void
}

export function useTemplateModal({
  buildBaseLeftContentConfig,
}: UseTemplateModalParams): UseTemplateModalResult {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRow | null>(null)
  const [orderedLeftContentConfig, setOrderedLeftContentConfig] = useState<TemplateModalLeftCardConfig[]>(
    []
  )
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const baseLeftContentConfig = useMemo(
    () => buildBaseLeftContentConfig(selectedTemplate),
    [buildBaseLeftContentConfig, selectedTemplate]
  )

  useEffect(() => {
    if (!isPreviewOpen) return
    setOrderedLeftContentConfig(baseLeftContentConfig)
    setActiveCardId(baseLeftContentConfig[0]?.id ?? null)
  }, [baseLeftContentConfig, isPreviewOpen])

  const openTemplatePreview = (row: TemplateRow) => {
    setSelectedTemplate(row)
    setIsPreviewOpen(true)
  }

  const closeTemplatePreview = () => {
    setIsPreviewOpen(false)
    setSelectedTemplate(null)
  }

  const applyOrderedCards = (orderedIds: string[]) => {
    const idSet = new Set(orderedIds)
    setOrderedLeftContentConfig(prev =>
      prev.filter(card => idSet.has(card.id)).sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
    )
  }

  return {
    isPreviewOpen,
    selectedTemplate,
    orderedLeftContentConfig,
    activeCardId,
    setActiveCardId,
    openTemplatePreview,
    closeTemplatePreview,
    applyOrderedCards,
  }
}
