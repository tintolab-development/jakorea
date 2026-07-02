import { SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS } from '@/features/template/model/writing-form-draft.schema'
import {
  isParticipantApplicationRegistryEntry,
  isRegistrationRegistryEntry,
  isSurveyRegistryEntry,
} from '@/features/template/model/template-registry/template-registry'
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
  GeminiVisitingTrainingApplicationFormInstitutionEditorLeftColumn,
  GeminiVisitingTrainingApplicationFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/gemini-institution'
import {
  GeminiVisitingTrainingApplicationFormInstructorEditorLeftColumn,
  GeminiVisitingTrainingApplicationFormInstructorEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/gemini-instructor'
import {
  ProgramApplicationFormInstitutionEditorLeftColumn,
  ProgramApplicationFormInstitutionEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/institution'
import {
  EconomyProgramApplicationEditorLeftColumn,
  EconomyProgramApplicationEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/1c-1s'
import {
  TrainedTeachersProgramApplicationEditorLeftColumn,
  TrainedTeachersProgramApplicationEditorRightColumn,
} from '@/features/template/ui/form-set/application-form/trained-teachers'
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
} from '@/features/template/ui/form-set/registration-form/UJAT'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/left-panel/form-editor-field-nav'
import { FormEditorLeftPanel } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel'
import { TemplateModalLeftContent } from '@/features/template/ui/template-management/template-modal-left-content'
import { TemplateModalRightNavigation } from '@/features/template/ui/template-management/template-modal-right-navigation'
import type { TemplateRendererContext, TemplateRendererPanels } from './template-renderer-types'

function resolveParticipantApplicationLeft(
  variant: string | undefined,
  vm: TemplateRendererContext['editorVm']['programParticipantApplicationVm']
) {
  switch (variant) {
    case 'gemini-application-instructor':
      return <GeminiVisitingTrainingApplicationFormInstructorEditorLeftColumn vm={vm} />
    case 'instructor':
      return <ProgramApplicationFormInstructorEditorLeftColumn vm={vm} />
    case 'volunteer':
      return <ProgramApplicationFormVolunteerEditorLeftColumn vm={vm} />
    case 'gemini-application-institution':
      return <GeminiVisitingTrainingApplicationFormInstitutionEditorLeftColumn vm={vm} />
    case 'ujat-application-institution':
      return <UjatProgramApplicationFormInstitutionEditorLeftColumn vm={vm} />
    case 'ujat-application-volunteer':
      return <UjatProgramApplicationFormVolunteerEditorLeftColumn vm={vm} />
    case 'economy-application-institution':
      return <EconomyProgramApplicationEditorLeftColumn vm={vm} />
    case 'trained-teachers-application-institution':
      return <TrainedTeachersProgramApplicationEditorLeftColumn vm={vm} />
    case 'applicant-recruit-individual':
      return <ApplicantRecruitFormIndividualEditorLeftColumn vm={vm} />
    case 'recruit-volunteer':
      return <RecruitFormVolunteerEditorLeftColumn vm={vm} />
    case 'ujat-recruit-volunteer':
      return <UjatRecruitFormVolunteerEditorLeftColumn vm={vm} />
    case 'recruit-instructor':
      return <RecruitFormInstructorEditorLeftColumn vm={vm} />
    case 'ujat-recruit-institution':
      return <UjatRecruitFormInstitutionEditorLeftColumn vm={vm} />
    case 'applicant-recruit-institution':
      return <ApplicantRecruitFormInstitutionEditorLeftColumn vm={vm} />
    case 'institution':
      return <ProgramApplicationFormInstitutionEditorLeftColumn vm={vm} />
    case 'individual':
    default:
      return <ProgramParticipantApplicationEditorLeftColumn vm={vm} />
  }
}

function resolveParticipantApplicationRight(
  variant: string | undefined,
  vm: TemplateRendererContext['editorVm']['programParticipantApplicationVm']
) {
  switch (variant) {
    case 'gemini-application-instructor':
      return <GeminiVisitingTrainingApplicationFormInstructorEditorRightColumn vm={vm} />
    case 'instructor':
      return <ProgramApplicationFormInstructorEditorRightColumn vm={vm} />
    case 'volunteer':
      return <ProgramApplicationFormVolunteerEditorRightColumn vm={vm} />
    case 'gemini-application-institution':
      return <GeminiVisitingTrainingApplicationFormInstitutionEditorRightColumn vm={vm} />
    case 'ujat-application-institution':
      return <UjatProgramApplicationFormInstitutionEditorRightColumn vm={vm} />
    case 'ujat-application-volunteer':
      return <UjatProgramApplicationFormVolunteerEditorRightColumn vm={vm} />
    case 'economy-application-institution':
      return <EconomyProgramApplicationEditorRightColumn vm={vm} />
    case 'trained-teachers-application-institution':
      return <TrainedTeachersProgramApplicationEditorRightColumn vm={vm} />
    case 'applicant-recruit-individual':
      return <ApplicantRecruitFormIndividualEditorRightColumn vm={vm} />
    case 'recruit-volunteer':
      return <RecruitFormVolunteerEditorRightColumn vm={vm} />
    case 'ujat-recruit-volunteer':
      return <UjatRecruitFormVolunteerEditorRightColumn vm={vm} />
    case 'recruit-instructor':
      return <RecruitFormInstructorEditorRightColumn vm={vm} />
    case 'ujat-recruit-institution':
      return <UjatRecruitFormInstitutionEditorRightColumn vm={vm} />
    case 'applicant-recruit-institution':
      return <ApplicantRecruitFormInstitutionEditorRightColumn vm={vm} />
    case 'institution':
      return <ProgramApplicationFormInstitutionEditorRightColumn vm={vm} />
    case 'individual':
    default:
      return <ProgramParticipantApplicationEditorRightColumn vm={vm} />
  }
}

function resolveSurveyPanels(ctx: TemplateRendererContext): TemplateRendererPanels {
  const { editorVm } = ctx
  const { surveyListEditor, surveyTableRowSelection } = editorVm

  return {
    leftContent: (
      <FormEditorLeftPanel
        paragraphs={surveyListEditor.draft.paragraphs}
        titleNumbering={surveyListEditor.draft.formSettings.titleNumbering}
        selectedCardId={surveyListEditor.activeParagraphId}
        onSelectCard={surveyListEditor.handleSelectCard}
        onReorderMiddle={surveyListEditor.onReorderMiddle}
        updateParagraph={surveyListEditor.updateParagraph}
        hideDragHandleForParagraphIds={SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS}
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
    ),
    rightNavigation: (
      <FormEditorFieldNav
        sectionTitle="커스텀 필드"
        pinnedTop={surveyListEditor.pinnedTop}
        sortableMiddle={surveyListEditor.sortableMiddle}
        pinnedBottom={surveyListEditor.pinnedBottom}
        hideSortableDragHandleForIds={SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS}
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
          horizontalTableRowSelection={surveyTableRowSelection.activeHorizontalTableRowSelection}
          onHorizontalTableBodyRowDeleted={surveyTableRowSelection.focusHorizontalTableBodyRow}
          verticalTableBodyRowSelection={surveyTableRowSelection.verticalTableBodyRowSelection}
          onVerticalTableBodyRowDeleted={surveyTableRowSelection.focusVerticalTableBodyRow}
        />
      </FormEditorFieldNav>
    ),
  }
}

function resolveRegistrationPanels(ctx: TemplateRendererContext): TemplateRendererPanels {
  const { registryEntry, editorVm } = ctx
  if (registryEntry?.registrationEditor === 'ujat') {
    return {
      leftContent: <UjatProgramRegistrationEditorLeftColumn vm={editorVm.ujatProgramRegistrationVm} />,
      rightNavigation: (
        <UjatProgramRegistrationEditorRightColumn vm={editorVm.ujatProgramRegistrationVm} />
      ),
    }
  }
  return {
    leftContent: <ProgramRegistrationEditorLeftColumn vm={editorVm.programRegistrationVm} />,
    rightNavigation: <ProgramRegistrationEditorRightColumn vm={editorVm.programRegistrationVm} />,
  }
}

function resolveGenericPanels(ctx: TemplateRendererContext): TemplateRendererPanels {
  const { generic } = ctx
  return {
    leftContent: (
      <TemplateModalLeftContent
        config={generic.orderedLeftContentConfig}
        selectedCardId={generic.activeCardId}
        onSelectCard={generic.setActiveCardId}
        onReorderCards={cards => generic.applyOrderedCards(cards.map(card => card.id))}
      />
    ),
    rightNavigation: (
      <TemplateModalRightNavigation
        config={generic.rightNavigationConfig}
        selectedItemId={generic.activeCardId}
        onSelectItem={generic.setActiveCardId}
        onReorderItems={items => generic.applyOrderedCards(items.map(item => item.id))}
      />
    ),
  }
}

export function resolveTemplateEditorPanels(ctx: TemplateRendererContext): TemplateRendererPanels {
  const { registryEntry, editorVm } = ctx

  if (isRegistrationRegistryEntry(registryEntry)) {
    return resolveRegistrationPanels(ctx)
  }

  if (registryEntry && isParticipantApplicationRegistryEntry(registryEntry)) {
    const vm = editorVm.programParticipantApplicationVm
    const variant = registryEntry.editorVariant
    return {
      leftContent: resolveParticipantApplicationLeft(variant, vm),
      rightNavigation: resolveParticipantApplicationRight(variant, vm),
    }
  }

  if (isSurveyRegistryEntry(registryEntry)) {
    return resolveSurveyPanels(ctx)
  }

  return resolveGenericPanels(ctx)
}
