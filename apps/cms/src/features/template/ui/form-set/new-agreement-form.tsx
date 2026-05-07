import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { message } from 'antd'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createDefaultDirectAgreementDraft,
  DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS,
  getWritingFormHeadMiddlePinnedTail,
  isAgreementLockedSystemParagraph,
  reorderWritingFormMiddleParagraphs,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useWritingFormMiddleParagraphActions } from '@/features/template/hooks/use-writing-form-middle-paragraph-actions'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/form-editor-left-panel'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/use-table-row-selection-state'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/form-editor-right-panel'

type NewAgreementFormQuery = {
  mode?: string
  type?: string
  id?: string
}

export type AgreementWritingFormShellProps = {
  /** 초안 — 매 렌더 새 객체를 넘기지 말고 팩토리 또는 메모된 값 사용 권장 */
  initialDraft: WritingFormDraft | (() => WritingFormDraft)
  /** 최초 선택 단락 id — 생략 시 초안의 첫 단락 id */
  defaultActiveParagraphId?: string | null
  modalTitle: ReactNode
  modalDescription?: ReactNode
  onClose: () => void
  /** 미리보기 컨텍스트 헤더 — 생략 시 `동의 양식` */
  writingPreviewHeaderTitle?: string
  /** 고정 템플릿 단락 — 표 구조·드래그·본문 편집 잠금 등 */
  structureLockedParagraphIds?: ReadonlySet<string>
  /** 제목형 등 — 드래그 핸들 비노출 */
  hideDragHandleForParagraphIds?: ReadonlySet<string>
}

export function AgreementWritingFormShell({
  initialDraft,
  defaultActiveParagraphId,
  modalTitle,
  modalDescription = '* 등록 시 최소 1개의 단락은 존재해야 하며, 동의 양식은 화면 전반에 동일한 구조로 노출될 수 있습니다.',
  onClose,
  writingPreviewHeaderTitle = '동의 양식',
  structureLockedParagraphIds,
  hideDragHandleForParagraphIds,
}: AgreementWritingFormShellProps) {
  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    typeof initialDraft === 'function' ? initialDraft() : initialDraft
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(() => {
    if (defaultActiveParagraphId != null) return defaultActiveParagraphId
    const d = typeof initialDraft === 'function' ? initialDraft() : initialDraft
    return d.paragraphs[0]?.id ?? null
  })
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

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
    setDraft(prev => ({
      ...prev,
      paragraphs: reorderWritingFormMiddleParagraphs(prev.paragraphs, activeId, overId),
    }))
  }, [])

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
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
        pinnedTop: null,
        sortableMiddle: [],
        pinnedBottom: [] as Array<{ id: string; displayLine: string }>,
      }
    }
    const { head, middle, pinnedTail } = split
    const pinnedBottomCards = pinnedTail.filter(p => !isAgreementLockedSystemParagraph(p))
    return {
      pinnedTop: line(head),
      sortableMiddle: middle.map(line),
      pinnedBottom: pinnedBottomCards.map(line),
    }
  }, [draft])

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: writingPreviewHeaderTitle,
      editorKind: 'agreement' as const,
    }),
    [draft, updateParagraph, writingPreviewHeaderTitle]
  )

  useEffect(() => {
    if (!isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  useEffect(() => {
    return () => {
      closeWritingUserPreview()
    }
  }, [closeWritingUserPreview])

  const handlePreview = useCallback(() => {
    openWritingUserPreview(writingPreviewSession)
  }, [openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  const handleSelectParagraph = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  const middleParagraphActions = useWritingFormMiddleParagraphActions(setDraft, setActiveParagraphId)
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

  return (
    <TemplateFullpageModal
      open
      onClose={onClose}
      title={modalTitle}
      description={modalDescription}
      templateTabType="writing"
      leftContent={
        <FormEditorLeftPanel
          paragraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          selectedCardId={activeParagraphId}
          onSelectCard={handleSelectParagraph}
          onReorderMiddle={onReorderMiddle}
          updateParagraph={updateParagraph}
          editorKind="agreement"
          singleItemListActiveItemId={singleItemListActiveItemId}
          onSelectSingleItemListItem={(paragraphId, itemId) => {
            setActiveParagraphId(paragraphId)
            setSingleItemListActiveItemId(itemId)
          }}
          horizontalTableRowSelectionsByParagraphId={horizontalTableRowSelectionsByParagraphId}
          onHorizontalTableRowSelectionChange={onHorizontalTableRowSelectionChange}
          verticalTableBodyRowSelection={verticalTableBodyRowSelection}
          onVerticalTableBodyRowSelectionChange={onVerticalTableBodyRowSelectionChange}
          middleParagraphActions={middleParagraphActions}
          structureLockedParagraphIds={structureLockedParagraphIds}
          hideDragHandleForParagraphIds={hideDragHandleForParagraphIds}
        />
      }
      rightNavigation={
        <FormEditorFieldNav
          sectionTitle="커스텀 필드"
          pinnedTop={pinnedTop}
          sortableMiddle={sortableMiddle}
          pinnedBottom={pinnedBottom}
          selectedItemId={activeParagraphId}
          onSelectItem={handleSelectParagraph}
          onReorderMiddle={onReorderMiddle}
          fieldListBottomSlot={
            <FormEditorTitleNumberingField
              value={draft.formSettings.titleNumbering}
              onChange={onTitleNumberingChange}
            />
          }
        >
          <FormEditorRightPanel
            draft={draft}
            activeParagraphId={activeParagraphId}
            onTitleNumberingChange={onTitleNumberingChange}
            updateParagraph={updateParagraph}
            editorKind="agreement"
            showTitleNumbering={false}
            singleItemListActiveItemId={singleItemListActiveItemId}
            horizontalTableRowSelection={activeHorizontalTableRowSelection}
            onHorizontalTableBodyRowDeleted={focusHorizontalTableBodyRow}
            verticalTableBodyRowSelection={verticalTableBodyRowSelection}
            onVerticalTableBodyRowDeleted={focusVerticalTableBodyRow}
            structureLockedParagraphIds={structureLockedParagraphIds}
          />
        </FormEditorFieldNav>
      }
      onPreview={handlePreview}
      onSave={handleSave}
    />
  )
}

export default function NewAgreementForm() {
  const { setParams } = useQueryParams<NewAgreementFormQuery>()
  const handleClose = useCallback(() => {
    setParams({ mode: undefined, type: undefined, id: undefined })
  }, [setParams])

  return (
    <AgreementWritingFormShell
      initialDraft={createDefaultDirectAgreementDraft}
      defaultActiveParagraphId={DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.explanationText}
      modalTitle="동의 양식"
      onClose={handleClose}
    />
  )
}
