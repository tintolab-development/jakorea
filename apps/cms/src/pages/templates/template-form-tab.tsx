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
  createEducatorFacilitatorPledgeDraft,
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
} from '@/features/template/ui/form-set/recruit-form/applicant-recruit-form-individual'
import {
  ApplicantRecruitFormInstitutionEditorLeftColumn,
  ApplicantRecruitFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/applicant-recruit-form-institution'
import {
  UjatRecruitFormInstitutionEditorLeftColumn,
  UjatRecruitFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution'
import {
  RecruitFormInstructorEditorLeftColumn,
  RecruitFormInstructorEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/recruit-form-instructor'
import {
  RecruitFormVolunteerEditorLeftColumn,
  RecruitFormVolunteerEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form/recruit-form-volunteer'
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
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'
import {
  createContentOnlyA4PreviewOptions,
  shouldUseA4PreviewForWritingTemplate,
} from '@/features/template/lib/a4-preview-template-options'

const AGREEMENT_CRIME_TEMPLATE_ID = 'agreement-crime'

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
  const isProgramInstructorApplicationTemplate = selectedTemplate?.id === 'application-instructor'
  const isProgramVolunteerApplicationTemplate =
    selectedTemplate?.id === 'application-volunteer' ||
    selectedTemplate?.id === 'application-ujat-volunteer'
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
                      : programParticipantApplicationVariant
  )

  const isCrimeConsentDetail = isPreviewOpen && selectedTemplate?.id === AGREEMENT_CRIME_TEMPLATE_ID

  useWritingUserPreviewUrlAuxiliarySync(
    params,
    setParams,
    isWritingUserPreviewOpen,
    closeWritingUserPreview
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
      params.id === 'agreement-portrait'
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
      isProgramParticipantApplicationTemplate ||
      isProgramInstructorApplicationTemplate ||
      isProgramVolunteerApplicationTemplate
    ) {
      programParticipantApplicationVm.handlePreview()
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
    isProgramParticipantApplicationTemplate,
    isProgramInstructorApplicationTemplate,
    isProgramVolunteerApplicationTemplate,
    programRegistrationVm,
    programParticipantApplicationVm,
    openWritingUserPreview,
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
      isProgramParticipantApplicationTemplate ||
      isProgramInstructorApplicationTemplate ||
      isProgramVolunteerApplicationTemplate
    ) {
      programParticipantApplicationVm.handlePreview()
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
        defaultActiveParagraphId={EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.intro}
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
              : isApplicantRecruitInstitutionTemplate ||
                  isUjatRecruitInstitutionTemplate ||
                  isApplicantRecruitIndividualTemplate ||
                  isRecruitFormInstructorTemplate ||
                  isRecruitFormVolunteerTemplate ||
                  isUjatRecruitFormVolunteerTemplate ||
                  isUjatProgramApplicationInstitutionTemplate ||
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
