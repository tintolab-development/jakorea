import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import { TEMPLATE_FORM_MODAL_DESCRIPTION } from '@/features/template/model/template-registry/template-registry'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import {
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { forceSurveyTitleWritingPeriodOn } from '@/features/template/lib/survey-title-period-policy'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import {
  buildDefaultSurveyWritingDraft,
  saveSurveyWritingTemplate,
} from '../../lib/survey-management/survey-writing-draft'
import {
  SurveyWritingValidationHighlightProvider,
  useSurveyWritingSaveValidationFeedback,
} from '../../lib/survey-management/use-survey-writing-save-validation-feedback'
import {
  resolveProgramSurveyFormEditFailure,
  saveProgramSurveyFormEdit,
  type ProgramSurveyFormEditTarget,
} from '../../lib/survey-management/save-program-survey-form-edit'
import {
  applyProgramSurveyTitleToParagraph,
  findProgramSurveyTitleParagraphId,
  readProgramSurveyTitle,
  resolveProgramSurveyHeaderTitle,
  seedProgramSurveyTitle,
} from '../../lib/survey-management/program-survey-title-sync'

/** 프로그램에 바인딩된 설문 version 수정 — 양식 관리 원본 대신 프로그램 전용 복제본에 저장 */
export type ProgramSurveyFormEdit = {
  target: ProgramSurveyFormEditTarget
  initialDraft: WritingFormDraft
}

export type SurveyTemplateEditModalProps = {
  open: boolean
  templateId: string
  onClose: () => void
  /** `programEdit`이면 새로 바인딩된 templateVersionId, 아니면 templateId */
  onSaved?: (savedId: string) => void
  programEdit?: ProgramSurveyFormEdit
  /** 서버 바인딩 상태가 바뀌어 저장이 거절됐을 때 — 목록 재조회 */
  onBindingsStale?: () => void
}

export function SurveyTemplateEditModal(props: SurveyTemplateEditModalProps) {
  return (
    <SurveyWritingValidationHighlightProvider variant="survey">
      <SurveyTemplateEditModalInner {...props} />
    </SurveyWritingValidationHighlightProvider>
  )
}

function SurveyTemplateEditModalInner({
  open,
  templateId,
  onClose,
  onSaved,
  programEdit,
  onBindingsStale,
}: SurveyTemplateEditModalProps) {
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()
  const { handleDraftValidationFailure } = useSurveyWritingSaveValidationFeedback()
  const templateRow = useMemo(
    () => (open && programEdit == null ? findWritingTemplateRowByDefinitionId(templateId) : null),
    [open, programEdit, templateId]
  )
  const registryEntry = useMemo(
    () => (open && programEdit == null ? lookupTemplateRegistry(templateId) : undefined),
    [open, programEdit, templateId]
  )
  const catalogHeaderTitle = useMemo(
    () => resolvePreviewHeaderTitle(registryEntry, templateRow?.templateName),
    [registryEntry, templateRow?.templateName]
  )

  /** 프로그램 설문: 좌상단 설문명 = 제목 단락 `surveyTitle` (draft가 진실 원천) */
  const getInitialDraft = useCallback(
    () =>
      (programEdit != null
        ? seedProgramSurveyTitle(
            forceSurveyTitleWritingPeriodOn(programEdit.initialDraft),
            programEdit.target.title
          )
        : null) ??
      buildDefaultSurveyWritingDraft(templateId, { templateName: templateRow?.templateName }),
    [programEdit, templateId, templateRow?.templateName]
  )
  const getDefaultActiveParagraphId = useCallback(
    (_draft: WritingFormDraft) => DEFAULT_SURVEY_PARAGRAPH_IDS.title,
    []
  )

  /** 프로그램 > 설문조사 수정 — 제목 단락「작성 기간」토글 ON 고정 */
  const paragraphBodyOptions = useMemo<RenderFormParagraphBodyOptions | undefined>(
    () => (programEdit != null ? { lockSurveyWritingPeriodToggleOn: true } : undefined),
    [programEdit]
  )

  const canEdit =
    programEdit != null || (templateRow != null && isSurveyRegistryEntry(registryEntry))

  /** 미리보기 헤더용 — editor 생성 전에 필요해서 draft 변화를 effect로 따라간다 */
  const [programPreviewHeaderTitle, setProgramPreviewHeaderTitle] = useState(() =>
    programEdit != null ? resolveProgramSurveyHeaderTitle(getInitialDraft()) : ''
  )

  const editor = useWritingFormEditorWithUserPreview({
    open: open && canEdit,
    getInitialDraft,
    getDefaultActiveParagraphId,
    previewHeaderTitle: programEdit != null ? programPreviewHeaderTitle : catalogHeaderTitle,
    editorKind: 'survey',
    previewZIndex: 1300,
    ...(programEdit == null ? { templateCode: templateId } : {}),
  })

  const draftRef = useRef(editor.draft)
  draftRef.current = editor.draft

  const programHeaderTitle = resolveProgramSurveyHeaderTitle(editor.draft)
  const headerTitle = programEdit != null ? programHeaderTitle : catalogHeaderTitle
  useEffect(() => {
    if (programEdit != null) setProgramPreviewHeaderTitle(programHeaderTitle)
  }, [programHeaderTitle, programEdit])

  const { updateParagraph } = editor
  /** 좌상단 연필 편집 → 제목 단락 `surveyTitle`에 반영 */
  const handleProgramTitleCommit = useCallback(
    (nextTitle: string) => {
      const titleId = findProgramSurveyTitleParagraphId(draftRef.current)
      if (titleId == null) return
      updateParagraph(titleId, paragraph => applyProgramSurveyTitleToParagraph(paragraph, nextTitle))
    },
    [updateParagraph]
  )

  const handleSave = useCallback(() => {
    void (async () => {
      try {
        const result =
          programEdit != null
            ? await saveProgramSurveyFormEdit(
                {
                  ...programEdit.target,
                  title: readProgramSurveyTitle(draftRef.current) || programEdit.target.title,
                },
                draftRef.current
              )
            : await saveSurveyWritingTemplate(templateId, draftRef.current)
        if (!result.ok) {
          if ('refetchBindings' in result && result.refetchBindings) onBindingsStale?.()
          if (result.incompleteKeys != null && result.incompleteKeys.length > 0) {
            handleDraftValidationFailure(result)
            return
          }
          showSaveFailure(new Error(result.message))
          return
        }
        const savedId =
          'templateVersionId' in result ? String(result.templateVersionId) : templateId
        showSaveSuccess(() => onSaved?.(savedId))
      } catch (error) {
        const programFailure =
          programEdit != null ? resolveProgramSurveyFormEditFailure(error) : undefined
        if (programFailure == null) {
          showSaveFailure(error)
          return
        }
        if (programFailure.refetchBindings) onBindingsStale?.()
        showSaveFailure(new Error(programFailure.message))
      }
    })()
  }, [
    handleDraftValidationFailure,
    onBindingsStale,
    onSaved,
    programEdit,
    showSaveFailure,
    showSaveSuccess,
    templateId,
  ])

  const tableRowSelection = useTableRowSelectionState({
    paragraphs: editor.draft.paragraphs,
    activeParagraphId: editor.activeParagraphId,
  })

  if (!canEdit) {
    return null
  }

  return (
    <TemplateFullpageModal
      open={open}
      onClose={onClose}
      title={headerTitle}
      {...(programEdit != null ? { onTitleCommit: handleProgramTitleCommit } : {})}
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
          paragraphBodyOptions={paragraphBodyOptions}
        />
      }
      rightNavigation={
        <FormEditorFieldNav
          sectionTitle="커스텀 필드"
          sortableMiddle={editor.sortableMiddle}
          pinnedBottom={editor.pinnedBottom}
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
