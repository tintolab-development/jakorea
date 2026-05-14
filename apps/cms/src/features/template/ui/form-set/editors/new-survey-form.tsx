import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  reorderWritingFormMiddleParagraphs,
  SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useWritingFormMiddleParagraphActions } from '@/features/template/hooks/use-writing-form-middle-paragraph-actions'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'

type NewSurveyFormQuery = {
  mode?: string
  type?: string
  id?: string
}

export default function NewSurveyForm() {
  const { setParams } = useQueryParams<NewSurveyFormQuery>()
  const [draft, setDraft] = useState<WritingFormDraft>(() => createDefaultSurveyDraft())
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    DEFAULT_SURVEY_PARAGRAPH_IDS.user
  )
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setParams({ mode: undefined, type: undefined, id: undefined })
  }, [setParams])
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
    const [head, ...rest] = draft.paragraphs
    const tail = rest[rest.length - 1]
    const middle = rest.slice(0, -1)
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    return {
      pinnedTop: line(head),
      sortableMiddle: middle.map(line),
      pinnedBottom: line(tail),
    }
  }, [draft])

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: '설문조사',
      editorKind: 'survey' as const,
    }),
    [draft, updateParagraph]
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
      onClose={handleClose}
      title="설문조사"
      description="* 등록 시 제목과 마무리글, 설문자 정보를 제외하고 최소 1개 이상의 단락이 존재해야 합니다."
      templateTabType="writing"
      leftContent={
        <FormEditorLeftPanel
          paragraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          selectedCardId={activeParagraphId}
          onSelectCard={handleSelectParagraph}
          onReorderMiddle={onReorderMiddle}
          updateParagraph={updateParagraph}
          hideDragHandleForParagraphIds={SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS}
          editorKind="survey"
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
        />
      }
      rightNavigation={
        <FormEditorFieldNav
          sectionTitle="커스텀 필드"
          pinnedTop={pinnedTop}
          sortableMiddle={sortableMiddle}
          pinnedBottom={pinnedBottom}
          hideSortableDragHandleForIds={SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS}
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
            editorKind="survey"
            showTitleNumbering={false}
            singleItemListActiveItemId={singleItemListActiveItemId}
            horizontalTableRowSelection={activeHorizontalTableRowSelection}
            onHorizontalTableBodyRowDeleted={focusHorizontalTableBodyRow}
            verticalTableBodyRowSelection={verticalTableBodyRowSelection}
            onVerticalTableBodyRowDeleted={focusVerticalTableBodyRow}
          />
        </FormEditorFieldNav>
      }
      onPreview={handlePreview}
      onSave={handleSave}
    />
  )
}
