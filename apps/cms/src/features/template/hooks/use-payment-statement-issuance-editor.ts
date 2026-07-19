import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import { EMPTY_WRITING_FORM_DRAFT } from '@/features/template/lib/empty-writing-form-draft'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
} from '@/features/template/lib/writing-form-template-local-save'
import { usePaymentStatementIssuanceMiddleActions } from '@/features/template/hooks/use-payment-statement-issuance-middle-actions'
import {
  createPaymentStatementIssuanceDraft,
  PAYMENT_STATEMENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-issuance-draft'
import {
  getPaymentStatementA4ParagraphGap,
  PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-issuance-a4-preview'
import {
  getWritingFormHeadMiddlePinnedTail,
  normalizeWritingFormDraft,
  reorderWritingFormMiddleParagraphs,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import { PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/payment-statement-issuance/paragraph-config'

export function usePaymentStatementIssuanceEditor(
  active: boolean,
  previewHeaderTitle: string,
  templateCode?: string,
  onTemplateDraftSaveConfirmed?: () => void
) {
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()
  const isTemplateManagementSave = onTemplateDraftSaveConfirmed != null

  const getInitialDraft = useCallback(
    () => normalizeWritingFormDraft(createPaymentStatementIssuanceDraft()),
    []
  )

  const [draft, setDraft] = useState<WritingFormDraft>(() => EMPTY_WRITING_FORM_DRAFT)
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null)
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [isDraftLoading, setIsDraftLoading] = useState(() => active)

  const applyDraftSnapshot = useCallback((next: WritingFormDraft) => {
    const normalized = normalizeWritingFormDraft(next)
    setDraft(normalized)
    setActiveParagraphId(normalized.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
  }, [])

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  useEffect(() => {
    if (!active) {
      setIsDraftLoading(false)
      return
    }

    if (templateCode != null && templateCode !== '') {
      let cancelled = false
      setIsDraftLoading(true)
      setDraft(EMPTY_WRITING_FORM_DRAFT)
      setActiveParagraphId(null)
      void loadWritingFormTemplateDraft(templateCode)
        .then(saved => {
          if (cancelled) return
          if (saved?.draft) {
            applyDraftSnapshot(saved.draft)
            return
          }
          applyDraftSnapshot(getInitialDraft())
        })
        .finally(() => {
          if (!cancelled) setIsDraftLoading(false)
        })
      return () => {
        cancelled = true
      }
    }

    setIsDraftLoading(false)
    applyDraftSnapshot(getInitialDraft())
  }, [active, applyDraftSnapshot, getInitialDraft, templateCode])

  useEffect(() => {
    if (!active) closeWritingUserPreview()
  }, [active, closeWritingUserPreview])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => (p.id === id ? updater(p) : p)),
      }))
    },
    []
  )

  const onReorderMiddle = useCallback((dragId: string, overId: string) => {
    setDraft(prev => ({
      ...prev,
      paragraphs: reorderWritingFormMiddleParagraphs(prev.paragraphs, dragId, overId),
    }))
  }, [])

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  const middleParagraphActions = usePaymentStatementIssuanceMiddleActions(
    setDraft,
    setActiveParagraphId
  )

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

  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const split = getWritingFormHeadMiddlePinnedTail(draft.paragraphs)
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    if (split == null) {
      return {
        pinnedTop: null as ReturnType<typeof line> | null,
        sortableMiddle: [] as ReturnType<typeof line>[],
        pinnedBottom: null as ReturnType<typeof line> | ReturnType<typeof line>[] | null,
      }
    }
    const { head, middle, pinnedTail } = split
    const bottomLines = pinnedTail.map(line)
    return {
      pinnedTop: line(head),
      sortableMiddle: middle.map(line),
      pinnedBottom: bottomLines.length === 1 ? bottomLines[0]! : bottomLines,
    }
  }, [draft])

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: previewHeaderTitle,
      editorKind: 'horizontal_table' as const,
      previewLayout: 'a4-document' as const,
      paragraphBodyOptions: PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS,
      hideParagraphRequiredChrome: true as const,
      a4HiddenParagraphIds: PAYMENT_STATEMENT_A4_HIDDEN_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly' as const,
      a4ParagraphGapPx: getPaymentStatementA4ParagraphGap,
    }),
    [draft, previewHeaderTitle, updateParagraph]
  )

  useEffect(() => {
    // 다른 발급 양식(설문 미리보기 등)이 열려 있을 때도 이 훅은 마운트되어 있으므로,
    // 비활성 상태에서 동기화하면 지급조서 draft가 전역 미리보기 세션을 덮어쓴다.
    if (!active || !isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [active, isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  const handlePreview = useCallback(() => {
    openWritingUserPreview(writingPreviewSession)
  }, [openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(() => {
    if (templateCode == null || templateCode === '') return
    void (async () => {
      try {
        await persistWritingFormTemplateDraft({
          templateId: templateCode,
          draft,
        })
        if (isTemplateManagementSave) {
          showSaveSuccess(onTemplateDraftSaveConfirmed)
        }
      } catch (error) {
        console.debug('paymentStatementIssuance save failed', error)
        if (isTemplateManagementSave) {
          showSaveFailure()
        }
      }
    })()
  }, [
    draft,
    isTemplateManagementSave,
    onTemplateDraftSaveConfirmed,
    showSaveFailure,
    showSaveSuccess,
    templateCode,
  ])

  const onSelectSingleItemListItem = useCallback((paragraphId: string, itemId: string | null) => {
    setActiveParagraphId(paragraphId)
    setSingleItemListActiveItemId(itemId)
  }, [])

  return {
    draft,
    isDraftLoading,
    activeParagraphId,
    singleItemListActiveItemId,
    structureLockedParagraphIds: PAYMENT_STATEMENT_SEED_PARAGRAPH_IDS,
    pinnedTop,
    sortableMiddle,
    pinnedBottom,
    handleSelectCard,
    onReorderMiddle,
    onTitleNumberingChange,
    updateParagraph,
    middleParagraphActions,
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
    handlePreview,
    handleSave,
    onSelectSingleItemListItem,
  }
}

export type PaymentStatementIssuanceEditorViewModel = ReturnType<
  typeof usePaymentStatementIssuanceEditor
>
