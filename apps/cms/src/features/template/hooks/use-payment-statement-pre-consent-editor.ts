import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import { usePaymentStatementIssuanceMiddleActions } from '@/features/template/hooks/use-payment-statement-issuance-middle-actions'
import {
  getPaymentStatementPreConsentA4ParagraphGap,
  PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-a4-preview'
import {
  createPaymentStatementPreConsentDraft,
  PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-draft'
import {
  getWritingFormHeadMiddlePinnedTail,
  normalizeWritingFormDraft,
  reorderWritingFormMiddleParagraphs,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import { PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/payment-statement-pre-consent/paragraph-config'

export function usePaymentStatementPreConsentEditor(active: boolean, previewHeaderTitle: string) {
  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    normalizeWritingFormDraft(createPaymentStatementPreConsentDraft())
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(() =>
    normalizeWritingFormDraft(createPaymentStatementPreConsentDraft()).paragraphs[0]?.id ?? null
  )
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  useEffect(() => {
    if (!active) return
    const next = normalizeWritingFormDraft(createPaymentStatementPreConsentDraft())
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
    setActiveParagraphId,
    { lockedParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS }
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
      paragraphBodyOptions: PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
      hideParagraphRequiredChrome: true as const,
      a4HiddenParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
      a4RenderMode: 'contentOnly' as const,
      a4ParagraphGapPx: getPaymentStatementPreConsentA4ParagraphGap,
    }),
    [draft, previewHeaderTitle, updateParagraph]
  )

  useEffect(() => {
    if (!active || !isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [active, isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  const handlePreview = useCallback(() => {
    openWritingUserPreview(writingPreviewSession)
  }, [openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  const onSelectSingleItemListItem = useCallback((paragraphId: string, itemId: string | null) => {
    setActiveParagraphId(paragraphId)
    setSingleItemListActiveItemId(itemId)
  }, [])

  return {
    draft,
    activeParagraphId,
    singleItemListActiveItemId,
    structureLockedParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
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

export type PaymentStatementPreConsentEditorViewModel = ReturnType<
  typeof usePaymentStatementPreConsentEditor
>
