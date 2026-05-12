import { message } from 'antd'
import { useCallback, useEffect, useMemo } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import {
  AGREEMENT_NOTICE_HIDDEN_DRAG_HANDLE_IDS,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_HIDDEN_DRAG_HANDLE_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS,
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createDefaultSurveyDraft,
  createEducatorFacilitatorPledgeDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS,
  getAgreementNoticeA4ParagraphGap,
} from '@/features/template/model/agreement-notice-a4-preview'
import {
  AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS,
  getAgreementPortraitA4ParagraphGap,
} from '@/features/template/model/agreement-portrait-a4-preview'
import {
  createPaymentStatementPreConsentDraft,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-draft'
import {
  getPaymentStatementPreConsentA4ParagraphGap,
  PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS,
} from '@/features/template/model/payment-statement-pre-consent-a4-preview'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
} from '@/features/template/ui/form-set/payment-statement-pre-consent/paragraph-config'
import { TemplateListCard } from '@/features/template/ui/template-list-card'
import './template-form-tab.css'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
import { TemplateModalLeftContent } from '@/features/template/ui/template-modal-left-content'
import { TemplateModalRightNavigation } from '@/features/template/ui/template-modal-right-navigation'
import { BasicInfoCurriculumSection } from '@/features/template/ui/basic-info-curriculum-section'
import { EducationCurriculumSection } from '@/features/template/ui/education-curriculum-section'
import { KpiGoalsCurriculumSection } from '@/features/template/ui/kpi-goals-curriculum-section'
import { TemplateTable } from '@/features/template/ui/template-table'
import { WageInfoCurriculumSection } from '@/features/template/ui/wage-info-curriculum-section'
import { useTemplateModal } from '@/features/template/hooks/use-template-modal'
import { writingSections } from '@/features/template/model/template.schema'
import type { TemplateRow } from '@/features/template/model/template.schema'
import {
  buildRightNavigationConfig,
  buildTemplateConfig,
} from '@/features/template/lib/build-template-config'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import NewAgreementForm, {
  AgreementWritingFormShell,
} from '@/features/template/ui/form-set/new-agreement-form'
import NewHorizontalTableForm from '@/features/template/ui/form-set/new-horizontal-table-form'
import NewSurveyForm from '@/features/template/ui/form-set/new-survey-form'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/form-editor-right-panel'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/use-table-row-selection-state'
import type { FormUpdateParagraph } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import {
  useProgramParticipantApplicationEditor,
  type ProgramParticipantApplicationEditorVariant,
} from '@/features/template/hooks/use-program-participant-application-editor'
import { useProgramRegistrationEditor } from '@/features/template/hooks/use-program-registration-editor'
import {
  ProgramParticipantApplicationEditorLeftColumn,
  ProgramParticipantApplicationEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/individual'
import {
  ApplicantRecruitFormIndividualEditorLeftColumn,
  ApplicantRecruitFormIndividualEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/individual'
import {
  ApplicantRecruitFormInstitutionEditorLeftColumn,
  ApplicantRecruitFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/institution'
import {
  UjatRecruitFormInstitutionEditorLeftColumn,
  UjatRecruitFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution'
import {
  RecruitFormInstructorEditorLeftColumn,
  RecruitFormInstructorEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/instructor'
import {
  RecruitFormVolunteerEditorLeftColumn,
  RecruitFormVolunteerEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/volunteer'
import {
  UjatRecruitFormVolunteerEditorLeftColumn,
  UjatRecruitFormVolunteerEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer'
import {
  ProgramApplicationFormInstitutionEditorLeftColumn,
  ProgramApplicationFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/institution'
import {
  UjatProgramApplicationFormInstitutionEditorLeftColumn,
  UjatProgramApplicationFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/UJAT-institution'
import {
  UjatProgramApplicationFormVolunteerEditorLeftColumn,
  UjatProgramApplicationFormVolunteerEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer'
import {
  ProgramApplicationFormInstructorEditorLeftColumn,
  ProgramApplicationFormInstructorEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/instructor'
import {
  ProgramApplicationFormVolunteerEditorLeftColumn,
  ProgramApplicationFormVolunteerEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/volunteer'
import {
  ProgramRegistrationEditorLeftColumn,
  ProgramRegistrationEditorRightColumn,
} from '@/features/template/ui/form-set/registration-form/general'
import {
  UjatProgramRegistrationEditorLeftColumn,
  UjatProgramRegistrationEditorRightColumn,
  useUjatProgramRegistrationEditor,
} from '@/features/template/ui/form-set/registration-form/UJAT'
import { CrimeRecordConsentDocumentFullpageModal } from '@/features/template/ui/crime-record-consent-document-fullpage-modal'
import {
  AGREEMENT_WRITING_FORM_SHELL_TEMPLATE_IDS,
  TEMPLATE_USER_PREVIEW_ACTIVE,
} from '@/features/template/lib/template-user-preview-url'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import {
  createContentOnlyA4PreviewOptions,
  shouldUseA4PreviewForWritingTemplate,
} from '@/features/template/lib/a4-preview-template-options'

const AGREEMENT_CRIME_TEMPLATE_ID = 'agreement-crime'
const AGREEMENT_PAYMENT_STATEMENT_PRE_CONSENT_ID = 'agreement-third-party'

type TemplateFormTabQuery = {
  mode?: string
  type?: string
  id?: string
  userPreview?: string
}

const EMPTY_PREVIEW_DRAFT: WritingFormDraft = {
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [],
}

const noopUpdateParagraph: FormUpdateParagraph = () => {}

export default function TemplateFormTab() {
  const { params, setParams } = useQueryParams<TemplateFormTabQuery>()
  const isPreviewOpen = params.mode === 'edit'
  const { openWritingUserPreview, closeWritingUserPreview, isWritingUserPreviewOpen } =
    useTemplateWritingPreview()

  const curriculumSections = useMemo(
    () => ({
      '기본 정보': <BasicInfoCurriculumSection />,
      '사업 KPI 목표': <KpiGoalsCurriculumSection />,
      '임금 정보': <WageInfoCurriculumSection />,
      '교육 커리큘럼': <EducationCurriculumSection />,
    }),
    []
  )
  const buildBaseLeftContentConfig = useCallback(
    (selectedTemplate: Parameters<typeof buildTemplateConfig>[0]['selectedTemplate']) =>
      buildTemplateConfig({
        selectedTemplate,
        orderedLeftContentConfig: [],
        curriculumSections,
      }).baseLeftContentConfig,
    [curriculumSections]
  )

  const {
    selectedTemplate,
    orderedLeftContentConfig,
    activeCardId,
    setActiveCardId,
    openTemplatePreview,
    closeTemplatePreview,
    applyOrderedCards,
  } = useTemplateModal({
    buildBaseLeftContentConfig,
  })

  const handleOpenTemplatePreview = useCallback(
    (row: TemplateRow) => {
      setParams(
        { mode: 'edit', id: row.id, type: undefined, userPreview: undefined },
        { replace: false }
      )
    },
    [setParams]
  )

  const handleCloseTemplatePreview = useCallback(() => {
    setParams({ mode: undefined, id: undefined, type: undefined, userPreview: undefined })
  }, [setParams])

  useEffect(() => {
    if (params.mode !== 'edit' || params.id == null || params.id === '') {
      closeTemplatePreview()
      return
    }
    const normalizedId = params.id.trim()
    const row = findWritingTemplateRowByDefinitionId(normalizedId)
    if (row) {
      openTemplatePreview(row)
      return
    }
    closeTemplatePreview()
  }, [params.mode, params.id, closeTemplatePreview, openTemplatePreview])

  const rightNavigationConfig = useMemo(
    () => buildRightNavigationConfig(orderedLeftContentConfig),
    [orderedLeftContentConfig]
  )
  const previewEditorKind =
    selectedTemplate?.id.startsWith('agreement-') === true ? 'agreement' : 'survey'
  const programRegistrationFormVariant =
    selectedTemplate?.id === 'registration-economy' ? 'economy' : 'general'
  const isProgramRegistrationTemplate =
    selectedTemplate?.id === 'registration-general' ||
    selectedTemplate?.id === 'registration-economy'
  const isUjatProgramRegistrationTemplate = selectedTemplate?.id === 'registration-ujat'
  const isApplicantRecruitInstitutionTemplate =
    selectedTemplate?.id === 'recruitment-participant-school'
  const isUjatRecruitInstitutionTemplate = selectedTemplate?.id === 'recruitment-ujat-school'
  const isApplicantRecruitIndividualTemplate =
    selectedTemplate?.id === 'recruitment-participant-individual'
  const isRecruitFormInstructorTemplate = selectedTemplate?.id === 'recruitment-instructor'
  const isRecruitFormVolunteerTemplate = selectedTemplate?.id === 'recruitment-volunteer'
  const isUjatRecruitFormVolunteerTemplate = selectedTemplate?.id === 'recruitment-ujat-volunteer'
  const isProgramParticipantApplicationTemplate =
    selectedTemplate?.id === 'application-participant-school' ||
    selectedTemplate?.id === 'application-participant-individual'
  const isUjatProgramApplicationInstitutionTemplate =
    selectedTemplate?.id === 'application-ujat-school'
  const isUjatProgramApplicationVolunteerTemplate =
    selectedTemplate?.id === 'application-ujat-volunteer'
  const isProgramInstructorApplicationTemplate = selectedTemplate?.id === 'application-instructor'
  const isProgramVolunteerApplicationTemplate = selectedTemplate?.id === 'application-volunteer'
  const useA4PreviewForWritingTemplate = shouldUseA4PreviewForWritingTemplate(selectedTemplate?.id)
  const programParticipantApplicationVariant: ProgramParticipantApplicationEditorVariant =
    selectedTemplate?.id === 'application-participant-school' ? 'institution' : 'individual'
  const programRegistrationVm = useProgramRegistrationEditor(
    isPreviewOpen && isProgramRegistrationTemplate,
    selectedTemplate?.templateName ?? '일반 프로그램 등록 폼',
    {
      restrictCurriculumSessionStructure: true,
      programRegistrationFormVariant,
    }
  )
  const ujatProgramRegistrationVm = useUjatProgramRegistrationEditor(
    isPreviewOpen && isUjatProgramRegistrationTemplate,
    selectedTemplate?.templateName ?? 'UJAT 프로그램 등록 폼'
  )
  const programParticipantApplicationVm = useProgramParticipantApplicationEditor(
    isPreviewOpen &&
      (isApplicantRecruitInstitutionTemplate ||
        isUjatRecruitInstitutionTemplate ||
        isApplicantRecruitIndividualTemplate ||
        isRecruitFormInstructorTemplate ||
        isRecruitFormVolunteerTemplate ||
        isUjatRecruitFormVolunteerTemplate ||
        isUjatProgramApplicationInstitutionTemplate ||
        isUjatProgramApplicationVolunteerTemplate ||
        isProgramParticipantApplicationTemplate ||
        isProgramInstructorApplicationTemplate ||
        isProgramVolunteerApplicationTemplate),
    isProgramInstructorApplicationTemplate
      ? (selectedTemplate?.templateName ?? '프로그램 강사 신청 폼')
      : isProgramVolunteerApplicationTemplate
        ? (selectedTemplate?.templateName ?? '프로그램 봉사자 신청 폼')
        : isUjatRecruitInstitutionTemplate
          ? (selectedTemplate?.templateName ?? 'UJAT 프로그램 학교 모집 폼')
          : isApplicantRecruitInstitutionTemplate
            ? (selectedTemplate?.templateName ?? '프로그램 참여자 모집 폼 (학교)')
            : isApplicantRecruitIndividualTemplate
              ? (selectedTemplate?.templateName ?? '프로그램 참여자 모집 폼 (개인)')
              : isRecruitFormInstructorTemplate
                ? (selectedTemplate?.templateName ?? '프로그램 강사 모집 폼')
                : isRecruitFormVolunteerTemplate
                  ? (selectedTemplate?.templateName ?? '프로그램 봉사자 모집 폼')
                  : isUjatRecruitFormVolunteerTemplate
                    ? (selectedTemplate?.templateName ?? 'UJAT 프로그램 봉사자 모집 폼')
                    : isUjatProgramApplicationInstitutionTemplate
                      ? (selectedTemplate?.templateName ?? 'UJAT 프로그램 학교 신청 폼')
                      : isUjatProgramApplicationVolunteerTemplate
                        ? (selectedTemplate?.templateName ?? 'UJAT 프로그램 봉사자 신청 폼')
                        : (selectedTemplate?.templateName ?? '프로그램 참여자 신청 폼'),
    isProgramInstructorApplicationTemplate
      ? 'instructor'
      : isProgramVolunteerApplicationTemplate
        ? 'volunteer'
        : isUjatRecruitInstitutionTemplate
          ? 'ujat-recruit-institution'
          : isApplicantRecruitInstitutionTemplate
            ? 'applicant-recruit-institution'
            : isApplicantRecruitIndividualTemplate
              ? 'applicant-recruit-individual'
              : isRecruitFormInstructorTemplate
                ? 'recruit-instructor'
                : isRecruitFormVolunteerTemplate
                  ? 'recruit-volunteer'
                  : isUjatRecruitFormVolunteerTemplate
                    ? 'ujat-recruit-volunteer'
                    : isUjatProgramApplicationInstitutionTemplate
                      ? 'ujat-application-institution'
                      : isUjatProgramApplicationVolunteerTemplate
                        ? 'ujat-application-volunteer'
                        : programParticipantApplicationVariant
  )

  const isWritingSurveyListTemplate = useMemo(
    () =>
      Boolean(
        isPreviewOpen && selectedTemplate != null && selectedTemplate.id.startsWith('survey-')
      ),
    [isPreviewOpen, selectedTemplate]
  )

  const getSurveyListInitialDraft = useCallback((): WritingFormDraft => {
    const base = createDefaultSurveyDraft()
    const name = selectedTemplate?.templateName?.trim()
    if (name == null || name === '') return base
    return {
      ...base,
      paragraphs: base.paragraphs.map(p =>
        p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title ? { ...p, surveyTitle: name } : p
      ),
    }
  }, [selectedTemplate?.templateName])

  const getSurveyListDefaultParagraphId = useCallback((_draft: WritingFormDraft) => {
    return DEFAULT_SURVEY_PARAGRAPH_IDS.title
  }, [])

  const surveyListEditor = useWritingFormEditorWithUserPreview({
    open: isWritingSurveyListTemplate,
    getInitialDraft: getSurveyListInitialDraft,
    getDefaultActiveParagraphId: getSurveyListDefaultParagraphId,
    previewHeaderTitle: selectedTemplate?.templateName ?? '설문',
    editorKind: 'survey',
    onSave: () => {
      message.success('저장 API 연동 전입니다.')
    },
  })

  const surveyTableRowSelection = useTableRowSelectionState({
    paragraphs: isWritingSurveyListTemplate ? surveyListEditor.draft.paragraphs : [],
    activeParagraphId: isWritingSurveyListTemplate ? surveyListEditor.activeParagraphId : null,
  })

  const isCrimeConsentDetail = isPreviewOpen && selectedTemplate?.id === AGREEMENT_CRIME_TEMPLATE_ID

  const suppressInactiveUserPreviewStrip = useMemo(() => {
    if (params.mode !== 'edit' || params.id == null || params.id.trim() === '') return false
    const id = params.id.trim()
    if (AGREEMENT_WRITING_FORM_SHELL_TEMPLATE_IDS.has(id)) return true
    return id.startsWith('survey-')
  }, [params.mode, params.id])

  useWritingUserPreviewUrlAuxiliarySync(
    params,
    setParams,
    isWritingUserPreviewOpen,
    closeWritingUserPreview,
    {
      suppressInactiveUserPreviewStrip,
    }
  )

  /** 직접 입력/앞으로가기 등 URL에 userPreview가 있으면 미리보기 오픈 */
  useEffect(() => {
    if (params.userPreview !== TEMPLATE_USER_PREVIEW_ACTIVE) return
    if (params.mode !== 'edit') return
    if (isCrimeConsentDetail) return
    if (!selectedTemplate) return
    if (isWritingUserPreviewOpen) return
    // agreement-notice·agreement-expense·agreement-portrait는 AgreementWritingFormShell이 직접 미리보기 제어
    if (
      params.id === 'agreement-notice' ||
      params.id === 'agreement-expense' ||
      params.id === 'agreement-portrait' ||
      params.id === AGREEMENT_PAYMENT_STATEMENT_PRE_CONSENT_ID
    ) {
      return
    }

    if (isProgramRegistrationTemplate) {
      programRegistrationVm.handlePreview()
      return
    }
    if (isUjatProgramRegistrationTemplate) {
      ujatProgramRegistrationVm.handlePreview()
      return
    }
    if (
      isApplicantRecruitInstitutionTemplate ||
      isUjatRecruitInstitutionTemplate ||
      isApplicantRecruitIndividualTemplate ||
      isRecruitFormInstructorTemplate ||
      isRecruitFormVolunteerTemplate ||
      isUjatRecruitFormVolunteerTemplate ||
      isUjatProgramApplicationInstitutionTemplate ||
      isUjatProgramApplicationVolunteerTemplate ||
      isProgramParticipantApplicationTemplate ||
      isProgramInstructorApplicationTemplate ||
      isProgramVolunteerApplicationTemplate
    ) {
      programParticipantApplicationVm.handlePreview()
      return
    }
    if (isWritingSurveyListTemplate) {
      surveyListEditor.handlePreview()
      return
    }
    const genericA4Options = shouldUseA4PreviewForWritingTemplate(selectedTemplate.id)
      ? createContentOnlyA4PreviewOptions()
      : undefined
    openWritingUserPreview({
      draft: EMPTY_PREVIEW_DRAFT,
      updateParagraph: noopUpdateParagraph,
      headerTitle: selectedTemplate.templateName ?? '양식 미리보기',
      editorKind: selectedTemplate.id.startsWith('agreement-') === true ? 'agreement' : 'survey',
      previewLayout: genericA4Options?.previewLayout,
      a4RenderMode: genericA4Options?.a4RenderMode,
      hideParagraphRequiredChrome: genericA4Options?.hideParagraphRequiredChrome,
    })
  }, [
    params.userPreview,
    params.mode,
    params.id,
    isCrimeConsentDetail,
    selectedTemplate,
    isWritingUserPreviewOpen,
    isProgramRegistrationTemplate,
    isUjatProgramRegistrationTemplate,
    ujatProgramRegistrationVm,
    isApplicantRecruitInstitutionTemplate,
    isUjatRecruitInstitutionTemplate,
    isApplicantRecruitIndividualTemplate,
    isRecruitFormInstructorTemplate,
    isRecruitFormVolunteerTemplate,
    isUjatRecruitFormVolunteerTemplate,
    isUjatProgramApplicationInstitutionTemplate,
    isUjatProgramApplicationVolunteerTemplate,
    isProgramParticipantApplicationTemplate,
    isProgramInstructorApplicationTemplate,
    isProgramVolunteerApplicationTemplate,
    programRegistrationVm,
    programParticipantApplicationVm,
    openWritingUserPreview,
    isWritingSurveyListTemplate,
    surveyListEditor,
  ])

  const handlePreview = useCallback(() => {
    setParams({ userPreview: TEMPLATE_USER_PREVIEW_ACTIVE }, { replace: false })
    if (isProgramRegistrationTemplate) {
      programRegistrationVm.handlePreview()
      return
    }
    if (isUjatProgramRegistrationTemplate) {
      ujatProgramRegistrationVm.handlePreview()
      return
    }
    if (
      isApplicantRecruitInstitutionTemplate ||
      isUjatRecruitInstitutionTemplate ||
      isApplicantRecruitIndividualTemplate ||
      isRecruitFormInstructorTemplate ||
      isRecruitFormVolunteerTemplate ||
      isUjatRecruitFormVolunteerTemplate ||
      isUjatProgramApplicationInstitutionTemplate ||
      isUjatProgramApplicationVolunteerTemplate ||
      isProgramParticipantApplicationTemplate ||
      isProgramInstructorApplicationTemplate ||
      isProgramVolunteerApplicationTemplate
    ) {
      programParticipantApplicationVm.handlePreview()
      return
    }
    if (isWritingSurveyListTemplate) {
      surveyListEditor.handlePreview()
      return
    }
    const genericA4Options = useA4PreviewForWritingTemplate
      ? createContentOnlyA4PreviewOptions()
      : undefined
    openWritingUserPreview({
      draft: EMPTY_PREVIEW_DRAFT,
      updateParagraph: noopUpdateParagraph,
      headerTitle: selectedTemplate?.templateName ?? '양식 미리보기',
      editorKind: previewEditorKind,
      previewLayout: genericA4Options?.previewLayout,
      a4RenderMode: genericA4Options?.a4RenderMode,
      hideParagraphRequiredChrome: genericA4Options?.hideParagraphRequiredChrome,
    })
  }, [
    isProgramInstructorApplicationTemplate,
    isApplicantRecruitInstitutionTemplate,
    isUjatRecruitInstitutionTemplate,
    isApplicantRecruitIndividualTemplate,
    isRecruitFormInstructorTemplate,
    isRecruitFormVolunteerTemplate,
    isUjatRecruitFormVolunteerTemplate,
    isUjatProgramApplicationInstitutionTemplate,
    isUjatProgramApplicationVolunteerTemplate,
    isProgramParticipantApplicationTemplate,
    isProgramVolunteerApplicationTemplate,
    isProgramRegistrationTemplate,
    isUjatProgramRegistrationTemplate,
    ujatProgramRegistrationVm,
    openWritingUserPreview,
    previewEditorKind,
    programParticipantApplicationVm,
    programRegistrationVm,
    selectedTemplate?.templateName,
    useA4PreviewForWritingTemplate,
    setParams,
    isWritingSurveyListTemplate,
    surveyListEditor,
  ])

  const agreementExpenseRow = useMemo(
    () =>
      params.mode === 'edit' && params.id === 'agreement-expense'
        ? findWritingTemplateRowByDefinitionId('agreement-expense')
        : undefined,
    [params.mode, params.id]
  )

  if (params.mode === 'new' && params.type === 'survey') {
    return <NewSurveyForm />
  }
  if (params.mode === 'new' && params.type === 'agreement') {
    return <NewAgreementForm />
  }
  if (params.mode === 'new' && params.type === 'horizontal_table') {
    return <NewHorizontalTableForm />
  }

  if (params.mode === 'edit' && params.id === 'agreement-expense' && agreementExpenseRow) {
    return (
      <AgreementWritingFormShell
        initialDraft={createEducatorFacilitatorPledgeDraft}
        defaultActiveParagraphId={EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title}
        modalTitle={agreementExpenseRow.templateName}
        modalDescription="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
        writingPreviewHeaderTitle={agreementExpenseRow.templateName}
        previewLayout="a4-document"
        a4RenderMode="contentOnly"
        onClose={handleCloseTemplatePreview}
      />
    )
  }

  if (params.mode === 'edit' && params.id === 'agreement-notice') {
    const agreementNoticeRow = findWritingTemplateRowByDefinitionId('agreement-notice')
    const noticeTitle = agreementNoticeRow?.templateName ?? '행정정보 공동이용 사전동의서'
    return (
      <AgreementWritingFormShell
        initialDraft={createAgreementNoticeDraft}
        defaultActiveParagraphId={AGREEMENT_NOTICE_PARAGRAPH_IDS.title}
        modalTitle={noticeTitle}
        modalDescription="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
        writingPreviewHeaderTitle={noticeTitle}
        structureLockedParagraphIds={AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS}
        hideDragHandleForParagraphIds={AGREEMENT_NOTICE_HIDDEN_DRAG_HANDLE_IDS}
        previewLayout="a4-document"
        a4HiddenParagraphIds={AGREEMENT_NOTICE_A4_HIDDEN_PARAGRAPH_IDS}
        a4RenderMode="contentOnly"
        a4ParagraphGapPx={getAgreementNoticeA4ParagraphGap}
        onClose={handleCloseTemplatePreview}
      />
    )
  }

  if (params.mode === 'edit' && params.id === 'agreement-portrait') {
    const agreementPortraitRow = findWritingTemplateRowByDefinitionId('agreement-portrait')
    const portraitTitle = agreementPortraitRow?.templateName ?? '초상권 수집·이용 동의'
    return (
      <AgreementWritingFormShell
        initialDraft={createAgreementPortraitDraft}
        defaultActiveParagraphId={AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title}
        modalTitle={portraitTitle}
        modalDescription="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
        writingPreviewHeaderTitle={portraitTitle}
        structureLockedParagraphIds={AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS}
        hideDragHandleForParagraphIds={AGREEMENT_PORTRAIT_HIDDEN_DRAG_HANDLE_IDS}
        previewLayout="a4-document"
        a4HiddenParagraphIds={AGREEMENT_PORTRAIT_A4_HIDDEN_PARAGRAPH_IDS}
        a4RenderMode="contentOnly"
        a4ParagraphGapPx={getAgreementPortraitA4ParagraphGap}
        onClose={handleCloseTemplatePreview}
      />
    )
  }

  if (params.mode === 'edit' && params.id === AGREEMENT_PAYMENT_STATEMENT_PRE_CONSENT_ID) {
    const preConsentRow = findWritingTemplateRowByDefinitionId(
      AGREEMENT_PAYMENT_STATEMENT_PRE_CONSENT_ID
    )
    const preConsentTitle = preConsentRow?.templateName ?? '지급조서 사전 동의서'
    return (
      <AgreementWritingFormShell
        initialDraft={createPaymentStatementPreConsentDraft}
        defaultActiveParagraphId={PAYMENT_STATEMENT_PRE_CONSENT_IDS.title}
        modalTitle={preConsentTitle}
        modalDescription="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
        writingPreviewHeaderTitle={preConsentTitle}
        structureLockedParagraphIds={PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS}
        hideDragHandleForParagraphIds={PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS}
        previewLayout="a4-document"
        a4HiddenParagraphIds={PAYMENT_STATEMENT_PRE_CONSENT_A4_HIDDEN_PARAGRAPH_IDS}
        a4RenderMode="contentOnly"
        a4ParagraphGapPx={getPaymentStatementPreConsentA4ParagraphGap}
        paragraphBodyOptions={PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS}
        onClose={handleCloseTemplatePreview}
      />
    )
  }

  return (
    <>
      <div className="template-form-tab__content">
        {writingSections.map(section => (
          <TemplateListCard
            key={section.key}
            title={section.title}
            description={section.description}
          >
            <TemplateTable rows={section.rows} onPreview={handleOpenTemplatePreview} />
          </TemplateListCard>
        ))}
      </div>

      <CrimeRecordConsentDocumentFullpageModal
        open={isCrimeConsentDetail}
        onClose={handleCloseTemplatePreview}
      />

      <TemplateFullpageModal
        open={isPreviewOpen && !isCrimeConsentDetail && selectedTemplate != null}
        onClose={handleCloseTemplatePreview}
        title={selectedTemplate?.templateName ?? '양식 미리보기'}
        description="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
        templateTabType="writing"
        onPreview={handlePreview}
        onSave={
          isProgramRegistrationTemplate
            ? programRegistrationVm.handleSave
            : isUjatProgramRegistrationTemplate
              ? ujatProgramRegistrationVm.handleSave
              : isWritingSurveyListTemplate
                ? surveyListEditor.handleSave
                : isApplicantRecruitInstitutionTemplate ||
                    isUjatRecruitInstitutionTemplate ||
                    isApplicantRecruitIndividualTemplate ||
                    isRecruitFormInstructorTemplate ||
                    isRecruitFormVolunteerTemplate ||
                    isUjatRecruitFormVolunteerTemplate ||
                    isUjatProgramApplicationInstitutionTemplate ||
                    isUjatProgramApplicationVolunteerTemplate ||
                    isProgramParticipantApplicationTemplate ||
                    isProgramInstructorApplicationTemplate ||
                    isProgramVolunteerApplicationTemplate
                  ? programParticipantApplicationVm.handleSave
                  : undefined
        }
        leftContent={
          isUjatProgramRegistrationTemplate ? (
            <UjatProgramRegistrationEditorLeftColumn vm={ujatProgramRegistrationVm} />
          ) : isProgramRegistrationTemplate ? (
            <ProgramRegistrationEditorLeftColumn vm={programRegistrationVm} />
          ) : isProgramInstructorApplicationTemplate ? (
            <ProgramApplicationFormInstructorEditorLeftColumn
              vm={programParticipantApplicationVm}
            />
          ) : isProgramVolunteerApplicationTemplate ? (
            <ProgramApplicationFormVolunteerEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isUjatProgramApplicationInstitutionTemplate ? (
            <UjatProgramApplicationFormInstitutionEditorLeftColumn
              vm={programParticipantApplicationVm}
            />
          ) : isUjatProgramApplicationVolunteerTemplate ? (
            <UjatProgramApplicationFormVolunteerEditorLeftColumn
              vm={programParticipantApplicationVm}
            />
          ) : isApplicantRecruitIndividualTemplate ? (
            <ApplicantRecruitFormIndividualEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isRecruitFormVolunteerTemplate ? (
            <RecruitFormVolunteerEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isUjatRecruitFormVolunteerTemplate ? (
            <UjatRecruitFormVolunteerEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isRecruitFormInstructorTemplate ? (
            <RecruitFormInstructorEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isUjatRecruitInstitutionTemplate ? (
            <UjatRecruitFormInstitutionEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isApplicantRecruitInstitutionTemplate ? (
            <ApplicantRecruitFormInstitutionEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isProgramParticipantApplicationTemplate ? (
            programParticipantApplicationVariant === 'institution' ? (
              <ProgramApplicationFormInstitutionEditorLeftColumn
                vm={programParticipantApplicationVm}
              />
            ) : (
              <ProgramParticipantApplicationEditorLeftColumn vm={programParticipantApplicationVm} />
            )
          ) : isWritingSurveyListTemplate ? (
            <FormEditorLeftPanel
              paragraphs={surveyListEditor.draft.paragraphs}
              titleNumbering={surveyListEditor.draft.formSettings.titleNumbering}
              selectedCardId={surveyListEditor.activeParagraphId}
              onSelectCard={surveyListEditor.handleSelectCard}
              onReorderMiddle={surveyListEditor.onReorderMiddle}
              updateParagraph={surveyListEditor.updateParagraph}
              editorKind="survey"
              singleItemListActiveItemId={surveyListEditor.singleItemListActiveItemId}
              onSelectSingleItemListItem={surveyListEditor.onSelectSingleItemListItem}
              horizontalTableRowSelectionsByParagraphId={
                surveyTableRowSelection.horizontalTableRowSelectionsByParagraphId
              }
              onHorizontalTableRowSelectionChange={
                surveyTableRowSelection.onHorizontalTableRowSelectionChange
              }
              verticalTableBodyRowSelection={surveyTableRowSelection.verticalTableBodyRowSelection}
              onVerticalTableBodyRowSelectionChange={
                surveyTableRowSelection.onVerticalTableBodyRowSelectionChange
              }
              middleParagraphActions={surveyListEditor.middleParagraphActions}
            />
          ) : (
            <TemplateModalLeftContent
              config={orderedLeftContentConfig}
              selectedCardId={activeCardId}
              onSelectCard={setActiveCardId}
              onReorderCards={cards => applyOrderedCards(cards.map(card => card.id))}
            />
          )
        }
        rightNavigation={
          isUjatProgramRegistrationTemplate ? (
            <UjatProgramRegistrationEditorRightColumn vm={ujatProgramRegistrationVm} />
          ) : isProgramRegistrationTemplate ? (
            <ProgramRegistrationEditorRightColumn vm={programRegistrationVm} />
          ) : isProgramInstructorApplicationTemplate ? (
            <ProgramApplicationFormInstructorEditorRightColumn
              vm={programParticipantApplicationVm}
            />
          ) : isProgramVolunteerApplicationTemplate ? (
            <ProgramApplicationFormVolunteerEditorRightColumn
              vm={programParticipantApplicationVm}
            />
          ) : isUjatProgramApplicationInstitutionTemplate ? (
            <UjatProgramApplicationFormInstitutionEditorRightColumn
              vm={programParticipantApplicationVm}
            />
          ) : isUjatProgramApplicationVolunteerTemplate ? (
            <UjatProgramApplicationFormVolunteerEditorRightColumn
              vm={programParticipantApplicationVm}
            />
          ) : isApplicantRecruitIndividualTemplate ? (
            <ApplicantRecruitFormIndividualEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isRecruitFormVolunteerTemplate ? (
            <RecruitFormVolunteerEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isUjatRecruitFormVolunteerTemplate ? (
            <UjatRecruitFormVolunteerEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isRecruitFormInstructorTemplate ? (
            <RecruitFormInstructorEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isUjatRecruitInstitutionTemplate ? (
            <UjatRecruitFormInstitutionEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isApplicantRecruitInstitutionTemplate ? (
            <ApplicantRecruitFormInstitutionEditorRightColumn
              vm={programParticipantApplicationVm}
            />
          ) : isProgramParticipantApplicationTemplate ? (
            programParticipantApplicationVariant === 'institution' ? (
              <ProgramApplicationFormInstitutionEditorRightColumn
                vm={programParticipantApplicationVm}
              />
            ) : (
              <ProgramParticipantApplicationEditorRightColumn
                vm={programParticipantApplicationVm}
              />
            )
          ) : isWritingSurveyListTemplate ? (
            <FormEditorFieldNav
              sectionTitle="커스텀 필드"
              pinnedTop={surveyListEditor.pinnedTop}
              sortableMiddle={surveyListEditor.sortableMiddle}
              pinnedBottom={surveyListEditor.pinnedBottom}
              selectedItemId={surveyListEditor.activeParagraphId}
              onSelectItem={surveyListEditor.handleSelectCard}
              onReorderMiddle={surveyListEditor.onReorderMiddle}
              fieldListBottomSlot={
                <FormEditorTitleNumberingField
                  value={surveyListEditor.draft.formSettings.titleNumbering}
                  onChange={surveyListEditor.onTitleNumberingChange}
                />
              }
            >
              <FormEditorRightPanel
                draft={surveyListEditor.draft}
                activeParagraphId={surveyListEditor.activeParagraphId}
                onTitleNumberingChange={surveyListEditor.onTitleNumberingChange}
                updateParagraph={surveyListEditor.updateParagraph}
                editorKind="survey"
                showTitleNumbering={false}
                singleItemListActiveItemId={surveyListEditor.singleItemListActiveItemId}
                horizontalTableRowSelection={
                  surveyTableRowSelection.activeHorizontalTableRowSelection
                }
                onHorizontalTableBodyRowDeleted={
                  surveyTableRowSelection.focusHorizontalTableBodyRow
                }
                verticalTableBodyRowSelection={
                  surveyTableRowSelection.verticalTableBodyRowSelection
                }
                onVerticalTableBodyRowDeleted={surveyTableRowSelection.focusVerticalTableBodyRow}
              />
            </FormEditorFieldNav>
          ) : (
            <TemplateModalRightNavigation
              config={rightNavigationConfig}
              selectedItemId={activeCardId}
              onSelectItem={setActiveCardId}
              onReorderItems={items => applyOrderedCards(items.map(item => item.id))}
            />
          )
        }
      />
    </>
  )
}
