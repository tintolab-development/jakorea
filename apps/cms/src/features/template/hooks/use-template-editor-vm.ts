import { useCallback, useMemo } from 'react'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  isParticipantApplicationRegistryEntry,
  isRegistrationRegistryEntry,
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
  type TemplateRegistryDefinition,
} from '@/features/template/model/template-registry/template-registry'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { useProgramRegistrationEditor } from '@/features/template/hooks/use-program-registration-editor'
import { useUjatProgramRegistrationEditor } from '@/features/template/ui/form-set/registration-form/UJAT'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'

export type TemplateEditorVmInput = {
  isPreviewOpen: boolean
  templateId: string | undefined
  templateName: string | undefined
  registryEntry: TemplateRegistryDefinition | undefined
  /** 템플릿 draft 저장 확인 후 편집 모달 닫기 */
  onTemplateDraftSaveConfirmed?: () => void
}

export function useTemplateEditorVm({
  isPreviewOpen,
  templateId,
  templateName,
  registryEntry,
  onTemplateDraftSaveConfirmed,
}: TemplateEditorVmInput) {
  const entry = registryEntry ?? lookupTemplateRegistry(templateId)

  const isProgramRegistration = isPreviewOpen && entry?.registrationEditor === 'general'
  const isUjatProgramRegistration = isPreviewOpen && entry?.registrationEditor === 'ujat'
  const isParticipantApplication = isPreviewOpen && isParticipantApplicationRegistryEntry(entry)
  const isWritingSurveyList = Boolean(
    isPreviewOpen && entry != null && isSurveyRegistryEntry(entry)
  )

  const registrationPreviewTitle = resolvePreviewHeaderTitle(entry, templateName)

  const programRegistrationVm = useProgramRegistrationEditor(
    isProgramRegistration,
    registrationPreviewTitle,
    {
      restrictCurriculumSessionStructure: true,
      programRegistrationFormVariant: entry?.registrationFormVariant ?? 'general',
      templateCode:
        entry?.registrationEditor === 'general' ? (entry.id ?? templateId) : undefined,
      onTemplateDraftSaveConfirmed,
    }
  )

  const ujatProgramRegistrationVm = useUjatProgramRegistrationEditor(
    isUjatProgramRegistration,
    registrationPreviewTitle,
    { onTemplateDraftSaveConfirmed }
  )

  const participantPreviewTitle = resolvePreviewHeaderTitle(entry, templateName)
  const participantVariant = entry?.editorVariant ?? 'individual'

  const programParticipantApplicationVm = useProgramParticipantApplicationEditor(
    isParticipantApplication,
    participantPreviewTitle,
    participantVariant,
    {
      onTemplateDraftSaveConfirmed,
      templateCode: isParticipantApplication ? (entry?.id ?? templateId) : undefined,
    }
  )

  const getSurveyListInitialDraft = useCallback((): WritingFormDraft => {
    const base = createDefaultSurveyDraft()
    const name = templateName?.trim()
    if (name == null || name === '') return base
    return {
      ...base,
      paragraphs: base.paragraphs.map(p =>
        p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title ? { ...p, surveyTitle: name } : p
      ),
    }
  }, [templateName])

  const getSurveyListDefaultParagraphId = useCallback((_draft: WritingFormDraft) => {
    return DEFAULT_SURVEY_PARAGRAPH_IDS.title
  }, [])

  const surveyListEditor = useWritingFormEditorWithUserPreview({
    open: isWritingSurveyList,
    getInitialDraft: getSurveyListInitialDraft,
    getDefaultActiveParagraphId: getSurveyListDefaultParagraphId,
    previewHeaderTitle: resolvePreviewHeaderTitle(entry, templateName),
    editorKind: 'survey',
    templateCode: isWritingSurveyList ? (entry?.id ?? templateId) : undefined,
    onTemplateDraftSaveConfirmed,
  })

  const surveyTableRowSelection = useTableRowSelectionState({
    paragraphs: isWritingSurveyList ? surveyListEditor.draft.paragraphs : [],
    activeParagraphId: isWritingSurveyList ? surveyListEditor.activeParagraphId : null,
  })

  const handleSave = useMemo(() => {
    if (entry && isRegistrationRegistryEntry(entry) && entry.registrationEditor === 'general') {
      return programRegistrationVm.handleSave
    }
    if (entry?.registrationEditor === 'ujat') {
      return ujatProgramRegistrationVm.handleSave
    }
    if (isWritingSurveyList) {
      return surveyListEditor.handleSave
    }
    if (isParticipantApplicationRegistryEntry(entry)) {
      return programParticipantApplicationVm.handleSave
    }
    return undefined
  }, [
    entry,
    isWritingSurveyList,
    programParticipantApplicationVm.handleSave,
    programRegistrationVm.handleSave,
    surveyListEditor.handleSave,
    ujatProgramRegistrationVm.handleSave,
  ])

  return {
    registryEntry: entry,
    isProgramRegistration,
    isUjatProgramRegistration,
    isParticipantApplication,
    isWritingSurveyList,
    programRegistrationVm,
    ujatProgramRegistrationVm,
    programParticipantApplicationVm,
    surveyListEditor,
    surveyTableRowSelection,
    handleSave,
  }
}
