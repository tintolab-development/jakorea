import { useCallback, useMemo, useRef } from 'react'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'
import { TEMPLATE_FORM_MODAL_DESCRIPTION } from '@/features/template/model/template-registry/template-registry'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import {
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { useCmsAlert } from '@/shared/ui'
import {
  resolveUjatSurveyWritingDraft,
  saveUjatSurveyWritingTemplate,
} from '../lib/ujat-survey-writing-draft'

export type UjatSurveyTemplateEditModalProps = {
  open: boolean
  templateId: string
  onClose: () => void
  onSaved?: (templateId: string) => void
}

export function UjatSurveyTemplateEditModal({
  open,
  templateId,
  onClose,
  onSaved,
}: UjatSurveyTemplateEditModalProps) {
  const { showAlert } = useCmsAlert()
  const templateRow = useMemo(
    () => (open ? findWritingTemplateRowByDefinitionId(templateId) : null),
    [open, templateId]
  )
  const registryEntry = useMemo(
    () => (open ? lookupTemplateRegistry(templateId) : undefined),
    [open, templateId]
  )
  const headerTitle = useMemo(
    () => resolvePreviewHeaderTitle(registryEntry, templateRow?.templateName),
    [registryEntry, templateRow?.templateName]
  )

  const getInitialDraft = useCallback(
    () => resolveUjatSurveyWritingDraft(templateId, { templateName: templateRow?.templateName }),
    [templateId, templateRow?.templateName]
  )
  const getDefaultActiveParagraphId = useCallback(
    (_draft: WritingFormDraft) => DEFAULT_SURVEY_PARAGRAPH_IDS.title,
    []
  )

  const editor = useWritingFormEditorWithUserPreview({
    open: open && templateRow != null && isSurveyRegistryEntry(registryEntry),
    getInitialDraft,
    getDefaultActiveParagraphId,
    previewHeaderTitle: headerTitle,
    editorKind: 'survey',
    previewZIndex: 1300,
  })

  const draftRef = useRef(editor.draft)
  draftRef.current = editor.draft

  const handleSave = useCallback(() => {
    const result = saveUjatSurveyWritingTemplate(templateId, draftRef.current)
    if (!result.ok) {
      showAlert({ title: '안내', content: result.message })
      return
    }
    showAlert({ title: '안내', content: '양식이 저장되었습니다.' })
    onSaved?.(templateId)
  }, [onSaved, showAlert, templateId])

  const tableRowSelection = useTableRowSelectionState({
    paragraphs: editor.draft.paragraphs,
    activeParagraphId: editor.activeParagraphId,
  })

  if (templateRow == null || registryEntry == null || !isSurveyRegistryEntry(registryEntry)) {
    return null
  }

  return (
    <TemplateFullpageModal
      open={open}
      onClose={onClose}
      title={headerTitle}
      description={TEMPLATE_FORM_MODAL_DESCRIPTION}
      templateTabType="writing"
      className="ujat-survey-template-edit-modal"
      zIndex={1200}
      onPreview={editor.handlePreview}
      onSave={handleSave}
      leftContent={
        <FormEditorLeftPanel
          paragraphs={editor.draft.paragraphs}
          titleNumbering={editor.draft.formSettings.titleNumbering}
          selectedCardId={editor.activeParagraphId}
          onSelectCard={editor.handleSelectCard}
          onReorderMiddle={editor.onReorderMiddle}
          updateParagraph={editor.updateParagraph}
          hideDragHandleForParagraphIds={SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS}
          editorKind="survey"
          singleItemListActiveItemId={editor.singleItemListActiveItemId}
          onSelectSingleItemListItem={editor.onSelectSingleItemListItem}
          horizontalTableRowSelectionsByParagraphId={
            tableRowSelection.horizontalTableRowSelectionsByParagraphId
          }
          onHorizontalTableRowSelectionChange={
            tableRowSelection.onHorizontalTableRowSelectionChange
          }
          verticalTableBodyRowSelection={tableRowSelection.verticalTableBodyRowSelection}
          onVerticalTableBodyRowSelectionChange={
            tableRowSelection.onVerticalTableBodyRowSelectionChange
          }
          middleParagraphActions={editor.middleParagraphActions}
        />
      }
      rightNavigation={
        <FormEditorFieldNav
          sectionTitle="커스텀 필드"
          pinnedTop={editor.pinnedTop}
          sortableMiddle={editor.sortableMiddle}
          pinnedBottom={editor.pinnedBottom}
          hideSortableDragHandleForIds={SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS}
          selectedItemId={editor.activeParagraphId}
          onSelectItem={editor.handleSelectCard}
          onReorderMiddle={editor.onReorderMiddle}
          fieldListBottomSlot={
            <FormEditorTitleNumberingField
              value={editor.draft.formSettings.titleNumbering}
              onChange={editor.onTitleNumberingChange}
            />
          }
        >
          <FormEditorRightPanel
            draft={editor.draft}
            activeParagraphId={editor.activeParagraphId}
            onTitleNumberingChange={editor.onTitleNumberingChange}
            updateParagraph={editor.updateParagraph}
            editorKind="survey"
            showTitleNumbering={false}
            singleItemListActiveItemId={editor.singleItemListActiveItemId}
            horizontalTableRowSelection={tableRowSelection.activeHorizontalTableRowSelection}
            onHorizontalTableBodyRowDeleted={tableRowSelection.focusHorizontalTableBodyRow}
            verticalTableBodyRowSelection={tableRowSelection.verticalTableBodyRowSelection}
            onVerticalTableBodyRowDeleted={tableRowSelection.focusVerticalTableBodyRow}
          />
        </FormEditorFieldNav>
      }
    />
  )
}
