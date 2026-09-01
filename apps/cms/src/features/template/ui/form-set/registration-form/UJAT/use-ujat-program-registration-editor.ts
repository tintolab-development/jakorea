import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import { EMPTY_WRITING_FORM_DRAFT } from '@/features/template/lib/empty-writing-form-draft'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
} from '@/features/template/lib/writing-form-template-local-save'
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
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  getUjatProgramRegistrationOverlayRecord,
  patchUjatProgramRegistrationOverlay,
  resetUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  loadUjatRegistrationTemplateSave,
  persistUjatRegistrationTemplateSave,
} from '@/features/program/ujat/lib/ujat-registration-template-local-save'

export const UJAT_PROGRAM_REGISTRATION_TEMPLATE_CODE = 'registration-ujat' as const

export type UseUjatProgramRegistrationEditorOptions = {
  /** 템플릿 관리 저장 확인 후 (편집 모달 닫기·목록 복귀) */
  onTemplateDraftSaveConfirmed?: () => void
  /** true면 임시저장 복원 없이 시드로 시작 (신규 등록) */
  skipDraftRestore?: boolean
}

export function useUjatProgramRegistrationEditor(
  active: boolean,
  previewHeaderTitle: string,
  options?: UseUjatProgramRegistrationEditorOptions
) {
  const onTemplateDraftSaveConfirmed = options?.onTemplateDraftSaveConfirmed
  const skipDraftRestore = options?.skipDraftRestore === true
  const isTemplateManagementSave = onTemplateDraftSaveConfirmed != null
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  const [draft, setDraft] = useState<WritingFormDraft>(() => EMPTY_WRITING_FORM_DRAFT)
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null)
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [isDraftLoading, setIsDraftLoading] = useState(() => active)

  const resetToSeed = useCallback(() => {
    resetUjatProgramRegistrationOverlay()
    const next = normalizeWritingFormDraft(createUjatProgramRegistrationDraft())
    setDraft(next)
    setActiveParagraphId(next.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
  }, [])

  useEffect(() => {
    if (!active) {
      setIsDraftLoading(false)
      return
    }

    let cancelled = false
    resetUjatProgramRegistrationOverlay()

    if (skipDraftRestore) {
      setIsDraftLoading(false)
      resetToSeed()
      return
    }

    setIsDraftLoading(true)
    setDraft(EMPTY_WRITING_FORM_DRAFT)
    setActiveParagraphId(null)

    void loadWritingFormTemplateDraft(UJAT_PROGRAM_REGISTRATION_TEMPLATE_CODE)
      .then(saved => {
        if (cancelled) return
        if (saved?.draft) {
          if (saved.overlay && Object.keys(saved.overlay).length > 0) {
            patchUjatProgramRegistrationOverlay(saved.overlay)
          }
          const next = normalizeWritingFormDraft(saved.draft)
          setDraft(next)
          setActiveParagraphId(next.paragraphs[0]?.id ?? null)
          setSingleItemListActiveItemId(null)
          return
        }

        const legacy = loadUjatRegistrationTemplateSave()
        if (legacy?.overlay && Object.keys(legacy.overlay).length > 0) {
          patchUjatProgramRegistrationOverlay(legacy.overlay)
        }
        const next = normalizeWritingFormDraft(legacy?.draft ?? createUjatProgramRegistrationDraft())
        setDraft(next)
        setActiveParagraphId(next.paragraphs[0]?.id ?? null)
        setSingleItemListActiveItemId(null)
      })
      .finally(() => {
        if (!cancelled) setIsDraftLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [active, resetToSeed, skipDraftRestore])

  useEffect(() => {
    if (!active) {
      resetUjatProgramRegistrationOverlay()
      closeWritingUserPreview()
    }
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

  const persistDraft = useCallback(async () => {
    const overlay = { ...getUjatProgramRegistrationOverlayRecord() }
    await persistWritingFormTemplateDraft({
      templateId: UJAT_PROGRAM_REGISTRATION_TEMPLATE_CODE,
      draft,
      overlay,
    })
    persistUjatRegistrationTemplateSave({ draft, overlay })
    return { draft, overlay }
  }, [draft])

  const handleSave = useCallback(() => {
    void (async () => {
      try {
        await persistDraft()
        if (isTemplateManagementSave) {
          showSaveSuccess(onTemplateDraftSaveConfirmed)
        }
      } catch (error) {
        console.debug('ujatProgramRegistrationEditor save failed', error)
        if (isTemplateManagementSave) {
          showSaveFailure()
        }
      }
    })()
  }, [
    isTemplateManagementSave,
    onTemplateDraftSaveConfirmed,
    showSaveFailure,
    showSaveSuccess,
    persistDraft,
  ])

  return {
    draft,
    isDraftLoading,
    activeParagraphId,
    singleItemListActiveItemId,
    structureLockedParagraphIds:
      UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS as ReadonlySet<string>,
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
    persistDraft,
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
