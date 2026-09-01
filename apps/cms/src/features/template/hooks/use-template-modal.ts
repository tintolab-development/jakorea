import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  mergeLeftCardOrderByDragIds,
  normalizeLeftCardOrder,
  type TemplateModalLeftCardConfig,
} from '@/features/template/ui/template-management/template-modal-left-content'
import type { TemplateRow } from '@/features/template/model/template.schema'

interface UseTemplateModalParams {
  buildBaseLeftContentConfig: (selectedTemplate: TemplateRow | null) => TemplateModalLeftCardConfig[]
}

interface UseTemplateModalResult {
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
    if (selectedTemplate == null) return
    const ordered = normalizeLeftCardOrder(baseLeftContentConfig)
    setOrderedLeftContentConfig(ordered)
    setActiveCardId(ordered[0]?.id ?? null)
  }, [baseLeftContentConfig, selectedTemplate])

  const openTemplatePreview = useCallback((row: TemplateRow) => {
    setSelectedTemplate(row)
  }, [])

  const closeTemplatePreview = useCallback(() => {
    setSelectedTemplate(null)
  }, [])

  const applyOrderedCards = useCallback((orderedIds: string[]) => {
    setOrderedLeftContentConfig(prev => mergeLeftCardOrderByDragIds(prev, orderedIds))
  }, [])

  return {
    selectedTemplate,
    orderedLeftContentConfig,
    activeCardId,
    setActiveCardId,
    openTemplatePreview,
    closeTemplatePreview,
    applyOrderedCards,
  }
}
