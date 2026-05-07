import { useCallback, useEffect, useMemo } from 'react'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
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
import NewAgreementForm from '@/features/template/ui/form-set/new-agreement-form'
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
} from '@/features/template/ui/form-set/program-application-form-individual'
import {
  ApplicantRecruitFormIndividualEditorLeftColumn,
  ApplicantRecruitFormIndividualEditorRightColumn,
} from '@/features/template/ui/form-set/applicant-recruit-form-individual'
import {
  ApplicantRecruitFormInstitutionEditorLeftColumn,
  ApplicantRecruitFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/applicant-recruit-form-institution'
import {
  RecruitFormInstructorEditorLeftColumn,
  RecruitFormInstructorEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form-instructor'
import {
  RecruitFormVolunteerEditorLeftColumn,
  RecruitFormVolunteerEditorRightColumn,
} from '@/features/template/ui/form-set/recruit-form-volunteer'
import {
  ProgramApplicationFormInstitutionEditorLeftColumn,
  ProgramApplicationFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/program-application-form-institution'
import {
  ProgramApplicationFormInstructorEditorLeftColumn,
  ProgramApplicationFormInstructorEditorRightColumn,
} from '@/features/template/ui/form-set/program-application-form-instructor'
import {
  ProgramApplicationFormVolunteerEditorLeftColumn,
  ProgramApplicationFormVolunteerEditorRightColumn,
} from '@/features/template/ui/form-set/program-application-form-volunteer'
import {
  ProgramRegistrationEditorLeftColumn,
  ProgramRegistrationEditorRightColumn,
} from '@/features/template/ui/form-set/program-registration-form'
import { CrimeRecordConsentDocumentFullpageModal } from '@/features/template/ui/crime-record-consent-document-fullpage-modal'
import {
  TEMPLATE_USER_PREVIEW_ACTIVE,
} from '@/features/template/lib/template-user-preview-url'
import { useWritingUserPreviewUrlAuxiliarySync } from '@/features/template/hooks/use-writing-user-preview-url-auxiliary-sync'

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
  const {
    openWritingUserPreview,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

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
  const isApplicantRecruitInstitutionTemplate =
    selectedTemplate?.id === 'recruitment-participant-school'
  const isApplicantRecruitIndividualTemplate =
    selectedTemplate?.id === 'recruitment-participant-individual'
  const isRecruitFormInstructorTemplate = selectedTemplate?.id === 'recruitment-instructor'
  const isRecruitFormVolunteerTemplate = selectedTemplate?.id === 'recruitment-volunteer'
  const isProgramParticipantApplicationTemplate =
    selectedTemplate?.id === 'application-participant-school' ||
    selectedTemplate?.id === 'application-participant-individual'
  const isProgramInstructorApplicationTemplate = selectedTemplate?.id === 'application-instructor'
  const isProgramVolunteerApplicationTemplate =
    selectedTemplate?.id === 'application-volunteer' ||
    selectedTemplate?.id === 'application-ujat-volunteer'
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
  const programParticipantApplicationVm = useProgramParticipantApplicationEditor(
    isPreviewOpen &&
      (isApplicantRecruitInstitutionTemplate ||
        isApplicantRecruitIndividualTemplate ||
        isRecruitFormInstructorTemplate ||
        isRecruitFormVolunteerTemplate ||
        isProgramParticipantApplicationTemplate ||
        isProgramInstructorApplicationTemplate ||
        isProgramVolunteerApplicationTemplate),
    isProgramInstructorApplicationTemplate
      ? (selectedTemplate?.templateName ?? '프로그램 강사 신청 폼')
      : isProgramVolunteerApplicationTemplate
        ? (selectedTemplate?.templateName ?? '프로그램 봉사자 신청 폼')
        : isApplicantRecruitInstitutionTemplate
          ? (selectedTemplate?.templateName ?? '프로그램 참여자 모집 폼 (학교)')
          : isApplicantRecruitIndividualTemplate
            ? (selectedTemplate?.templateName ?? '프로그램 참여자 모집 폼 (개인)')
              : isRecruitFormInstructorTemplate
                ? (selectedTemplate?.templateName ?? '프로그램 강사 모집 폼')
            : isRecruitFormVolunteerTemplate
              ? (selectedTemplate?.templateName ?? '프로그램 봉사자 모집 폼')
            : (selectedTemplate?.templateName ?? '프로그램 참여자 신청 폼'),
    isProgramInstructorApplicationTemplate
      ? 'instructor'
      : isProgramVolunteerApplicationTemplate
        ? 'volunteer'
        : isApplicantRecruitInstitutionTemplate
          ? 'applicant-recruit-institution'
          : isApplicantRecruitIndividualTemplate
            ? 'applicant-recruit-individual'
          : isRecruitFormInstructorTemplate
            ? 'recruit-instructor'
          : isRecruitFormVolunteerTemplate
            ? 'recruit-volunteer'
            : programParticipantApplicationVariant
  )

  const isCrimeConsentDetail =
    isPreviewOpen && selectedTemplate?.id === AGREEMENT_CRIME_TEMPLATE_ID

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

    if (isProgramRegistrationTemplate) {
      programRegistrationVm.handlePreview()
      return
    }
    if (
      isApplicantRecruitInstitutionTemplate ||
      isApplicantRecruitIndividualTemplate ||
      isRecruitFormInstructorTemplate ||
      isProgramParticipantApplicationTemplate ||
      isProgramInstructorApplicationTemplate ||
      isProgramVolunteerApplicationTemplate
    ) {
      programParticipantApplicationVm.handlePreview()
      return
    }
    openWritingUserPreview({
      draft: EMPTY_PREVIEW_DRAFT,
      updateParagraph: noopUpdateParagraph,
      headerTitle: selectedTemplate.templateName ?? '양식 미리보기',
      editorKind: selectedTemplate.id.startsWith('agreement-') === true ? 'agreement' : 'survey',
    })
  }, [
    params.userPreview,
    params.mode,
    isCrimeConsentDetail,
    selectedTemplate,
    isWritingUserPreviewOpen,
    isProgramRegistrationTemplate,
    isApplicantRecruitInstitutionTemplate,
    isApplicantRecruitIndividualTemplate,
    isRecruitFormInstructorTemplate,
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
    if (
      isApplicantRecruitInstitutionTemplate ||
      isApplicantRecruitIndividualTemplate ||
      isRecruitFormInstructorTemplate ||
      isProgramParticipantApplicationTemplate ||
      isProgramInstructorApplicationTemplate ||
      isProgramVolunteerApplicationTemplate
    ) {
      programParticipantApplicationVm.handlePreview()
      return
    }
    openWritingUserPreview({
      draft: EMPTY_PREVIEW_DRAFT,
      updateParagraph: noopUpdateParagraph,
      headerTitle: selectedTemplate?.templateName ?? '양식 미리보기',
      editorKind: previewEditorKind,
    })
  }, [
    isProgramInstructorApplicationTemplate,
    isApplicantRecruitInstitutionTemplate,
    isApplicantRecruitIndividualTemplate,
    isRecruitFormInstructorTemplate,
    isProgramParticipantApplicationTemplate,
    isProgramVolunteerApplicationTemplate,
    isProgramRegistrationTemplate,
    openWritingUserPreview,
    previewEditorKind,
    programParticipantApplicationVm,
    programRegistrationVm,
    selectedTemplate?.templateName,
    setParams,
  ])

  if (params.mode === 'new' && params.type === 'survey') {
    return <NewSurveyForm />
  }
  if (params.mode === 'new' && params.type === 'agreement') {
    return <NewAgreementForm />
  }
  if (params.mode === 'new' && params.type === 'horizontal_table') {
    return <NewHorizontalTableForm />
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
            : isApplicantRecruitInstitutionTemplate ||
                isApplicantRecruitIndividualTemplate ||
                isRecruitFormInstructorTemplate ||
                isRecruitFormVolunteerTemplate ||
                isProgramParticipantApplicationTemplate ||
                isProgramInstructorApplicationTemplate ||
                isProgramVolunteerApplicationTemplate
              ? programParticipantApplicationVm.handleSave
              : undefined
        }
        leftContent={
          isProgramRegistrationTemplate ? (
            <ProgramRegistrationEditorLeftColumn vm={programRegistrationVm} />
          ) : isProgramInstructorApplicationTemplate ? (
            <ProgramApplicationFormInstructorEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isProgramVolunteerApplicationTemplate ? (
            <ProgramApplicationFormVolunteerEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isApplicantRecruitIndividualTemplate ? (
            <ApplicantRecruitFormIndividualEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isRecruitFormVolunteerTemplate ? (
            <RecruitFormVolunteerEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isRecruitFormInstructorTemplate ? (
            <RecruitFormInstructorEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isApplicantRecruitInstitutionTemplate ? (
            <ApplicantRecruitFormInstitutionEditorLeftColumn vm={programParticipantApplicationVm} />
          ) : isProgramParticipantApplicationTemplate ? (
            programParticipantApplicationVariant === 'institution' ? (
              <ProgramApplicationFormInstitutionEditorLeftColumn vm={programParticipantApplicationVm} />
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
          isProgramRegistrationTemplate ? (
            <ProgramRegistrationEditorRightColumn vm={programRegistrationVm} />
          ) : isProgramInstructorApplicationTemplate ? (
            <ProgramApplicationFormInstructorEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isProgramVolunteerApplicationTemplate ? (
            <ProgramApplicationFormVolunteerEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isApplicantRecruitIndividualTemplate ? (
            <ApplicantRecruitFormIndividualEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isRecruitFormVolunteerTemplate ? (
            <RecruitFormVolunteerEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isRecruitFormInstructorTemplate ? (
            <RecruitFormInstructorEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isApplicantRecruitInstitutionTemplate ? (
            <ApplicantRecruitFormInstitutionEditorRightColumn vm={programParticipantApplicationVm} />
          ) : isProgramParticipantApplicationTemplate ? (
            programParticipantApplicationVariant === 'institution' ? (
              <ProgramApplicationFormInstitutionEditorRightColumn vm={programParticipantApplicationVm} />
            ) : (
              <ProgramParticipantApplicationEditorRightColumn vm={programParticipantApplicationVm} />
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
