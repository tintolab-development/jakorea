import { useCallback, useEffect, useMemo, useState } from 'react'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  cloneHorizontalTableParagraph,
  cloneVerticalTableParagraph,
  createDefaultHorizontalTableDraft,
  createHorizontalTableParagraph,
  createVerticalTableParagraph,
  DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS,
  type FormTitleNumberingStyle,
  type HorizontalTableFlavor,
  type HorizontalTableParagraph,
  horizontalTableSetFlavor,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  normalizeWritingFormDraft,
  paragraphsAreOnlyTableLayoutParagraphs,
  type VerticalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

function stripLegacyHorizontalTableSurveyTitle(
  paragraphs: WritingFormParagraph[]
): WritingFormParagraph[] {
  const first = paragraphs[0]
  if (
    first &&
    first.kind === 'description' &&
    first.variant === 'survey_title_with_period' &&
    paragraphs.length >= 3
  ) {
    return paragraphs.slice(1)
  }
  return paragraphs
}

/** 예전 초안 `[…가로형들, 마무리]`를 테이블만 남기도록 정리 */
function stripTrailingClosingAfterHorizontalTablesOnly(
  paragraphs: WritingFormParagraph[]
): WritingFormParagraph[] {
  if (paragraphs.length < 2) return paragraphs
  const last = paragraphs[paragraphs.length - 1]
  if (last?.kind !== 'description' || last.variant !== 'closing') return paragraphs
  const rest = paragraphs.slice(0, -1)
  if (
    rest.every(
      p =>
        p.kind === 'single_item' &&
        (p.variant === 'horizontal_table' || p.variant === 'vertical_table')
    )
  ) {
    return rest
  }
  return paragraphs
}

function normalizeHorizontalTableDraft(d: WritingFormDraft): WritingFormDraft {
  let paragraphs = stripLegacyHorizontalTableSurveyTitle(d.paragraphs)
  paragraphs = stripTrailingClosingAfterHorizontalTablesOnly(paragraphs)
  paragraphs = paragraphs.map(p => {
    if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
      return normalizeHorizontalTableParagraph(p)
    }
    if (p.kind === 'single_item' && p.variant === 'vertical_table') {
      return normalizeVerticalTableParagraph(p)
    }
    return p
  })
  return normalizeWritingFormDraft({ ...d, paragraphs })
}

function createInitialHorizontalTableDraft(tableFlavor: HorizontalTableFlavor): WritingFormDraft {
  const base = normalizeHorizontalTableDraft(createDefaultHorizontalTableDraft())
  if (tableFlavor === 'text') {
    return base
  }
  return {
    ...base,
    paragraphs: base.paragraphs.map(p => {
      if (p.id !== DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.table) return p
      if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return p
      const withField = horizontalTableSetFlavor(p, 'field')
      return {
        ...withField,
        paragraphTitle: '테이블_가로형 (필드 형)',
      }
    }),
  }
}

export function useHorizontalTableFormDraft({
  initialTableFlavor,
  initialDraft,
  initialActiveParagraphId,
}: {
  initialTableFlavor: HorizontalTableFlavor
  initialDraft?: WritingFormDraft
  initialActiveParagraphId?: string
}) {
  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    initialDraft != null
      ? normalizeHorizontalTableDraft(initialDraft)
      : createInitialHorizontalTableDraft(initialTableFlavor)
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    () =>
      initialActiveParagraphId ??
      initialDraft?.paragraphs[0]?.id ??
      DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.table
  )

  useEffect(() => {
    if (activeParagraphId == null) return
    if (!draft.paragraphs.some(p => p.id === activeParagraphId)) {
      setActiveParagraphId(draft.paragraphs[0]?.id ?? null)
    }
  }, [draft.paragraphs, activeParagraphId])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => (p.id === id ? updater(p) : p)),
      }))
    },
    []
  )

  const onReorderMiddle = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return
    setDraft(prev => {
      const paras = prev.paragraphs
      if (paras.length < 2) return prev
      if (paragraphsAreOnlyTableLayoutParagraphs(paras)) {
        const oldIdx = paras.findIndex(p => p.id === activeId)
        const newIdx = paras.findIndex(p => p.id === overId)
        if (oldIdx === -1 || newIdx === -1) return prev
        const next = [...paras]
        const [removed] = next.splice(oldIdx, 1)
        next.splice(newIdx, 0, removed)
        return { ...prev, paragraphs: next }
      }
      const tail = paras[paras.length - 1]!
      const middle = paras.slice(0, -1)
      const oldIdx = middle.findIndex(p => p.id === activeId)
      const newIdx = middle.findIndex(p => p.id === overId)
      if (oldIdx === -1 || newIdx === -1) return prev
      const nextMiddle = [...middle]
      const [removed] = nextMiddle.splice(oldIdx, 1)
      nextMiddle.splice(newIdx, 0, removed)
      return { ...prev, paragraphs: [...nextMiddle, tail] }
    })
  }, [])

  const onAddMiddleParagraphAfter = useCallback((paragraphId: string) => {
    const newId = crypto.randomUUID()
    setDraft(prev => {
      const idx = prev.paragraphs.findIndex(p => p.id === paragraphId)
      if (idx === -1) return prev
      const anchor = prev.paragraphs[idx]!
      const next = [...prev.paragraphs]
      if (anchor.kind === 'single_item' && anchor.variant === 'vertical_table') {
        const v = normalizeVerticalTableParagraph(anchor as VerticalTableParagraph)
        next.splice(
          idx + 1,
          0,
          v.verticalTableFlavor === 'file_attachment'
            ? createHorizontalTableParagraph(newId)
            : createVerticalTableParagraph(newId, v.verticalTableFlavor)
        )
      } else {
        let p: HorizontalTableParagraph = createHorizontalTableParagraph(newId)
        if (anchor.kind === 'single_item' && anchor.variant === 'horizontal_table') {
          const a = anchor as HorizontalTableParagraph
          if (a.tableFlavor === 'field') {
            p = {
              ...horizontalTableSetFlavor(p, 'field'),
              paragraphTitle: '테이블_가로형 (필드 형)',
            }
          }
        }
        next.splice(idx + 1, 0, p)
      }
      return { ...prev, paragraphs: next }
    })
    setActiveParagraphId(newId)
  }, [])

  const onDuplicateMiddleParagraph = useCallback((paragraphId: string) => {
    const newId = crypto.randomUUID()
    setDraft(prev => {
      const idx = prev.paragraphs.findIndex(p => p.id === paragraphId)
      if (idx === -1) return prev
      const p = prev.paragraphs[idx]
      if (p.kind !== 'single_item') return prev
      if (p.variant === 'vertical_table') {
        const clone = cloneVerticalTableParagraph(p as VerticalTableParagraph, newId)
        const next = [...prev.paragraphs]
        next.splice(idx + 1, 0, clone)
        return { ...prev, paragraphs: next }
      }
      if (p.variant !== 'horizontal_table') return prev
      const clone = cloneHorizontalTableParagraph(p as HorizontalTableParagraph, newId)
      const next = [...prev.paragraphs]
      next.splice(idx + 1, 0, clone)
      return { ...prev, paragraphs: next }
    })
    setActiveParagraphId(newId)
  }, [])

  const onDeleteMiddleParagraph = useCallback((paragraphId: string) => {
    let nextActiveId: string | null = null
    setDraft(prev => {
      const onlyTables = paragraphsAreOnlyTableLayoutParagraphs(prev.paragraphs)
      const middle = onlyTables ? prev.paragraphs : prev.paragraphs.slice(0, -1)
      if (middle.length <= 1) {
        return prev
      }
      if (!middle.some(p => p.id === paragraphId)) {
        return prev
      }
      const idx = prev.paragraphs.findIndex(p => p.id === paragraphId)
      const nextParagraphs = prev.paragraphs.filter(p => p.id !== paragraphId)
      nextActiveId = idx > 0 ? prev.paragraphs[idx - 1]!.id : nextParagraphs[0]!.id
      return { ...prev, paragraphs: nextParagraphs }
    })
    if (nextActiveId != null) {
      setActiveParagraphId(nextActiveId)
    }
  }, [])

  const middleParagraphActions = useMemo(
    () => ({
      onAddAfter: onAddMiddleParagraphAfter,
      onDuplicate: onDuplicateMiddleParagraph,
      onDelete: onDeleteMiddleParagraph,
    }),
    [onAddMiddleParagraphAfter, onDuplicateMiddleParagraph, onDeleteMiddleParagraph]
  )

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  const { sortableMiddle, pinnedBottom } = useMemo(() => {
    const ps = draft.paragraphs
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    if (paragraphsAreOnlyTableLayoutParagraphs(ps)) {
      return {
        sortableMiddle: ps.map(line),
        pinnedBottom: null as { id: string; displayLine: string } | null,
      }
    }
    if (ps.length < 2) {
      return {
        sortableMiddle: [] as { id: string; displayLine: string }[],
        pinnedBottom: null as { id: string; displayLine: string } | null,
      }
    }
    const tail = ps[ps.length - 1]!
    const tableBlocks = ps.slice(0, -1)
    return {
      sortableMiddle: tableBlocks.map(line),
      pinnedBottom: line(tail),
    }
  }, [draft])

  return {
    draft,
    activeParagraphId,
    setActiveParagraphId,
    updateParagraph,
    onReorderMiddle,
    middleParagraphActions,
    onTitleNumberingChange,
    sortableMiddle,
    pinnedBottom,
  }
}
