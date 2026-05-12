import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createUjatProgramRegistrationDraft,
  UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-program-registration-draft'
import {
  normalizeWritingFormDraft,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/use-table-row-selection-state'

export function useUjatProgramRegistrationEditor(active: boolean, previewHeaderTitle: string) {
  const { openWritingUserPreview, syncWritingUserPreviewSession, closeWritingUserPreview, isWritingUserPreviewOpen } =
    useTemplateWritingPreview()

  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    normalizeWritingFormDraft(createUjatProgramRegistrationDraft())
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(() =>
    normalizeWritingFormDraft(createUjatProgramRegistrationDraft()).paragraphs[0]?.id ?? null
  )
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    const next = normalizeWritingFormDraft(createUjatProgramRegistrationDraft())
    setDraft(next)
    setActiveParagraphId(next.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
  }, [active])

  useEffect(() => {
    if (!active) closeWritingUserPreview()
  }, [active, closeWritingUserPreview])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => {
          if (p.id !== id) return p
          let next = updater(p)
          if (UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS.has(id)) {
            next = { ...next, requiredMark: true, answerRequired: true } as WritingFormParagraph
          }
          return next
        }),
      }))
    },
    []
  )

  const onReorderMiddle = useCallback((dragId: string, overId: string) => {
    setDraft(prev => ({
      ...prev,
      paragraphs: (() => {
        const from = prev.paragraphs.findIndex(p => p.id === dragId)
        const to = prev.paragraphs.findIndex(p => p.id === overId)
        if (from < 0 || to < 0 || from === to) return prev.paragraphs
        const next = [...prev.paragraphs]
        const [moved] = next.splice(from, 1)
        if (!moved) return prev.paragraphs
        next.splice(to, 0, moved)
        return next
      })(),
    }))
  }, [])

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  const {
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
  } = useTableRowSelectionState({
    paragraphs: draft.paragraphs,
    activeParagraphId,
  })

  const handleSelectCard = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  const paragraphBodyOptions = useMemo(
    () => ({
      ujatProgramRegistration: true,
      structureLockedAuthoringChoicePreview: true,
    }),
    []
  )

  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    return {
      pinnedTop: null as ReturnType<typeof line> | null,
      sortableMiddle: draft.paragraphs.map(line),
      pinnedBottom: null as ReturnType<typeof line> | ReturnType<typeof line>[] | null,
    }
  }, [draft])

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: previewHeaderTitle,
      editorKind: 'horizontal_table' as const,
      paragraphBodyOptions,
    }),
    [draft, paragraphBodyOptions, previewHeaderTitle, updateParagraph]
  )

  useEffect(() => {
    if (!active) return
    if (!isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [active, isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  const handlePreview = useCallback(() => {
    openWritingUserPreview(writingPreviewSession)
  }, [openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  return {
    draft,
    activeParagraphId,
    singleItemListActiveItemId,
    structureLockedParagraphIds: UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS as ReadonlySet<string>,
    pinnedTop,
    sortableMiddle,
    pinnedBottom,
    handleSelectCard,
    onReorderMiddle,
    onTitleNumberingChange,
    updateParagraph,
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
    handlePreview,
    handleSave,
    onSelectSingleItemListItem: (paragraphId: string, itemId: string | null) => {
      setActiveParagraphId(paragraphId)
      setSingleItemListActiveItemId(itemId)
    },
    paragraphBodyOptions,
  }
}

export type UjatProgramRegistrationEditorViewModel = ReturnType<
  typeof useUjatProgramRegistrationEditor
>
