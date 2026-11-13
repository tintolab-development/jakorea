import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import {
  createWritingFormTemplateRemote,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { allocateUniqueWritingTemplateName } from '@/features/template/lib/allocate-unique-writing-template-name'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import { useFormTemplateModalTitle } from '@/features/template/hooks/use-form-template-modal-title'
import { getWritingTemplateRowsByCategory } from '@/features/template/lib/writing-template-create-helpers'
import { validateSurveyWritingDraft } from '@/features/program/shared/lib/survey-management/survey-writing-draft'
import {
  SurveyWritingValidationHighlightProvider,
  useSurveyWritingSaveValidationFeedback,
} from '@/features/program/shared/lib/survey-management/use-survey-writing-save-validation-feedback'
import { persistWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import { useAgreementDocumentPdf } from '@/features/template/ui/form-set/editors/agreement-document-pdf'
import {
  buildTemplateManagementNavLine,
  resolveNavTitleNumberingStyle,
} from '@/features/template/lib/form-title-numbering'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import { titleWithPeriodPlaceholder } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-heading'
import {
  createNewSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { reorderSurveyParagraphs } from '@/features/template/lib/writing-form-middle-paragraph-mutations'
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

function resolveSurveyTemplateName(draft: WritingFormDraft): string {
  const titleParagraph = draft.paragraphs.find(p => p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title)
  if (titleParagraph?.kind === 'description' && titleParagraph.variant === 'survey_title_with_period') {
    const name = titleParagraph.surveyTitle?.trim()
    if (name !== '') return name
  }
  return '신규 설문 양식'
}

export default function NewSurveyForm() {
  return (
    <SurveyWritingValidationHighlightProvider variant="survey">
      <NewSurveyFormInner />
    </SurveyWritingValidationHighlightProvider>
  )
}

function NewSurveyFormInner() {
  const queryClient = useQueryClient()
  const { setParams } = useQueryParams<NewSurveyFormQuery>()
  const { sections } = useWritingFormSections()
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()
  const { handleDraftValidationFailure } = useSurveyWritingSaveValidationFeedback()
  const [draft, setDraft] = useState<WritingFormDraft>(() => createNewSurveyDraft())
  const [templateId, setTemplateId] = useState<string | null>(null)
  const { displayName: modalTitle, commitTitle: commitModalTitle } = useFormTemplateModalTitle({
    templateCode: templateId,
    initialName: '설문조사 신규 폼',
  })
  // 시안 12723:137188 — 진입 시 제목 단락 선택(우측 제목·작성 기간 설정 노출). 동의 양식 신규 폼과 같음
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    DEFAULT_SURVEY_PARAGRAPH_IDS.title
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
      paragraphs: reorderSurveyParagraphs(prev.paragraphs, activeId, overId),
    }))
  }, [])

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  /** 템플릿 관리 화면에서 「미선택」이어도 우측 목록만 `1. 2. 3.` 번호 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const { sortableMiddle } = useMemo(() => {
    // 시안 5767:42989·5767:43362·12723:137188 — 카드 제목은 「Q1.」이어도 목록은 단락 순번 숫자
    const titleNumbering = resolveNavTitleNumberingStyle(
      draft.formSettings.titleNumbering,
      isTemplateManagementScreen,
      { survey: true }
    )
    // 시안 12723:137188 — 빈 제목은 「설문 제목 입력」·「N. 타이틀을 입력해 주세요」 회색, 제목·마무리글 행은 핸들 없음
    const line = (p: WritingFormParagraph) =>
      buildTemplateManagementNavLine(draft.paragraphs, p, titleNumbering, {
        titlePlaceholder: titleWithPeriodPlaceholder('survey'),
        closingPlaceholder: true,
      })
    return {
      sortableMiddle: draft.paragraphs.map(line),
    }
  }, [draft, isTemplateManagementScreen])

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
    const validation = validateSurveyWritingDraft(draft)
    if (!validation.ok) {
      handleDraftValidationFailure(validation)
      return
    }

    void (async () => {
      try {
        let nextTemplateId = templateId
        if (nextTemplateId == null) {
          const existingNames = getWritingTemplateRowsByCategory('survey', sections).map(
            row => row.templateName
          )
          const templateName = allocateUniqueWritingTemplateName(
            modalTitle.trim() || resolveSurveyTemplateName(draft),
            existingNames
          )
          if (shouldUseFormsSurveysRemoteApi()) {
            nextTemplateId = await createWritingFormTemplateRemote({
              target: 'survey',
              templateName,
            })
          } else {
            nextTemplateId = `survey-custom-${crypto.randomUUID()}`
          }
          setTemplateId(nextTemplateId)
        }

        await persistWritingFormTemplateDraft({
          templateId: nextTemplateId,
          draft,
          publishAfterSave: true,
        })

        await queryClient.invalidateQueries({
          queryKey: formTemplateQueryKeys.writingSections(),
        })

        showSaveSuccess(() => {
          setParams({ mode: 'edit', id: nextTemplateId ?? undefined, type: undefined })
        })
      } catch (error) {
        console.debug('newSurveyForm save failed', error)
        showSaveFailure(error)
      }
    })()
  }, [
    draft,
    handleDraftValidationFailure,
    modalTitle,
    queryClient,
    sections,
    setParams,
    showSaveFailure,
    showSaveSuccess,
    templateId,
  ])

  const handleSelectParagraph = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  const middleParagraphActions = useWritingFormMiddleParagraphActions(setDraft, setActiveParagraphId, {
    surveyFreeForm: true,
  })
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

  /** 시안 12723:137188 상단 「문서 다운로드」 — 동의 양식 편집기와 같은 A4 PDF 내보내기(설문 단락으로 렌더) */
  const documentPdf = useAgreementDocumentPdf({
    enabled: true,
    draft,
    headerTitle: modalTitle,
    editorKind: 'survey',
  })

  return (
    <>
      {documentPdf.hostNode}
      <TemplateFullpageModal
        open
        onClose={handleClose}
        title={modalTitle}
        // 시안 12723:137188 상단 안내 문구 그대로 (동의 양식 신규 폼과 같은 문구)
        description="※ 최소 1개 이상의 단락이 존재해야 등록이 가능합니다. (제목글, 마무리글, 년도, 서명란 제외)"
        templateTabType="writing"
        onTitleCommit={commitModalTitle}
        // 닫기는 우측 상단 X (QA 261113 #11)
        showHeaderCloseButton={false}
        onDownloadDocument={documentPdf.download}
        downloadDocumentLoading={documentPdf.loading}
        leftContent={
          <FormEditorLeftPanel
            paragraphs={draft.paragraphs}
            titleNumbering={draft.formSettings.titleNumbering}
            selectedCardId={activeParagraphId}
            onSelectCard={handleSelectParagraph}
            onReorderMiddle={onReorderMiddle}
            updateParagraph={updateParagraph}
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
            sortableMiddle={sortableMiddle}
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
    </>
  )
}
