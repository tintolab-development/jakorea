import { useMemo, type ReactNode } from 'react'
import {
  TemplateFullpageModal,
  type TemplateFullpageModalFooterAction,
} from '@/features/template/ui/template-management/template-fullpage-modal'
import {
  isParticipantApplicationRegistryEntry,
  isRegistrationRegistryEntry,
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
  TEMPLATE_FORM_MODAL_DESCRIPTION,
  type TemplateRegistryDefinition,
} from '@/features/template/model/template-registry/template-registry'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import type { TemplateRendererContext } from '@/features/template/ui/template-renderers/template-renderer-types'
import { FormDraftLoading } from '@/features/template/ui/form-draft-loading'
import { useProgramRegistrationEditor } from '@/features/template/hooks/use-program-registration-editor'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'
import { useUjatProgramRegistrationEditor } from '@/features/template/ui/form-set/registration-form/UJAT'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  useTemplatePreviewController,
  type TemplatePreviewControllerParams,
} from '@/features/template/hooks/use-template-preview-controller'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

type TemplatePreviewModalEditorProps = {
  title: string
  onClose: () => void
  showDeleteButton?: boolean
  onDelete?: () => void
  deleteLoading?: boolean
  registryEntry: TemplateRegistryDefinition | undefined
  templateId: string | undefined
  templateName: string | undefined
  onTemplateDraftSaveConfirmed?: () => void
  registrationUserMode?: boolean
  footerAction?: TemplateFullpageModalFooterAction
  generic: TemplateRendererContext['generic']
  previewControllerBase: Omit<TemplatePreviewControllerParams, 'runPreview'>
}

type TemplatePreviewModalShellProps = {
  title: string
  onClose: () => void
  description?: ReactNode
  onPreview: () => void
  onSave?: () => void
  showDeleteButton?: boolean
  onDelete?: () => void
  deleteLoading?: boolean
  registrationUserMode?: boolean
  footerAction?: TemplateFullpageModalFooterAction
  isDraftLoading: boolean
  leftContent: ReactNode
  rightNavigation: ReactNode
}

function TemplatePreviewModalShell({
  title,
  onClose,
  description,
  onPreview,
  onSave,
  showDeleteButton,
  onDelete,
  deleteLoading,
  registrationUserMode = false,
  footerAction,
  isDraftLoading,
  leftContent,
  rightNavigation,
}: TemplatePreviewModalShellProps) {
  return (
    <TemplateFullpageModal
      open
      onClose={onClose}
      title={title}
      description={description}
      templateTabType="writing"
      onPreview={onPreview}
      onSave={onSave}
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      deleteLoading={deleteLoading}
      registrationUserMode={registrationUserMode}
      footerAction={footerAction}
      leftContent={isDraftLoading ? <FormDraftLoading /> : leftContent}
      rightNavigation={isDraftLoading ? null : rightNavigation}
    />
  )
}

function useTemplatePreviewModalPanels(
  rendererContext: TemplateRendererContext,
  isDraftLoading: boolean
) {
  const panels = useMemo(
    () => resolveTemplateEditorPanels(rendererContext),
    [rendererContext]
  )
  return {
    leftContent: isDraftLoading ? null : panels.leftContent,
    rightNavigation: isDraftLoading ? null : panels.rightNavigation,
  }
}

function GeneralRegistrationTemplatePreviewEditor({
  title,
  registryEntry,
  templateId,
  templateName,
  onTemplateDraftSaveConfirmed,
  registrationUserMode,
  footerAction,
  generic,
  previewControllerBase,
  ...shellProps
}: TemplatePreviewModalEditorProps & { registryEntry: TemplateRegistryDefinition }) {
  const previewTitle = resolvePreviewHeaderTitle(registryEntry, templateName)
  const programRegistrationVm = useProgramRegistrationEditor(true, previewTitle, {
    restrictCurriculumSessionStructure: true,
    programRegistrationFormVariant: registryEntry.registrationFormVariant ?? 'general',
    templateCode: registryEntry.id ?? templateId,
    onTemplateDraftSaveConfirmed,
  })

  const { handlePreview } = useTemplatePreviewController({
    ...previewControllerBase,
    runPreview: programRegistrationVm.handlePreview,
  })

  const rendererContext = useMemo(
    (): TemplateRendererContext => ({
      registryEntry,
      editorVm: {
        registryEntry,
        isProgramRegistration: true,
        isUjatProgramRegistration: false,
        isParticipantApplication: false,
        isWritingSurveyList: false,
        isDraftLoading: programRegistrationVm.isDraftLoading,
        programRegistrationVm,
        ujatProgramRegistrationVm: programRegistrationVm as never,
        programParticipantApplicationVm: programRegistrationVm as never,
        surveyListEditor: programRegistrationVm as never,
        surveyTableRowSelection: programRegistrationVm as never,
        handleSave: programRegistrationVm.handleSave,
      },
      generic,
    }),
    [generic, programRegistrationVm, registryEntry]
  )

  const { leftContent, rightNavigation } = useTemplatePreviewModalPanels(
    rendererContext,
    programRegistrationVm.isDraftLoading
  )

  return (
    <TemplatePreviewModalShell
      {...shellProps}
      title={title}
      description={
        registrationUserMode
          ? undefined
          : (registryEntry.modalDescription ?? TEMPLATE_FORM_MODAL_DESCRIPTION)
      }
      registrationUserMode={registrationUserMode}
      footerAction={footerAction}
      onPreview={handlePreview}
      onSave={programRegistrationVm.handleSave}
      isDraftLoading={programRegistrationVm.isDraftLoading}
      leftContent={leftContent}
      rightNavigation={rightNavigation}
    />
  )
}

function UjatRegistrationTemplatePreviewEditor({
  title,
  registryEntry,
  templateName,
  onTemplateDraftSaveConfirmed,
  registrationUserMode,
  footerAction,
  generic,
  previewControllerBase,
  ...shellProps
}: TemplatePreviewModalEditorProps & { registryEntry: TemplateRegistryDefinition }) {
  const previewTitle = resolvePreviewHeaderTitle(registryEntry, templateName)
  const ujatProgramRegistrationVm = useUjatProgramRegistrationEditor(true, previewTitle, {
    onTemplateDraftSaveConfirmed,
  })

  const { handlePreview } = useTemplatePreviewController({
    ...previewControllerBase,
    runPreview: ujatProgramRegistrationVm.handlePreview,
  })

  const rendererContext = useMemo(
    (): TemplateRendererContext => ({
      registryEntry,
      editorVm: {
        registryEntry,
        isProgramRegistration: false,
        isUjatProgramRegistration: true,
        isParticipantApplication: false,
        isWritingSurveyList: false,
        isDraftLoading: ujatProgramRegistrationVm.isDraftLoading,
        programRegistrationVm: ujatProgramRegistrationVm as never,
        ujatProgramRegistrationVm,
        programParticipantApplicationVm: ujatProgramRegistrationVm as never,
        surveyListEditor: ujatProgramRegistrationVm as never,
        surveyTableRowSelection: ujatProgramRegistrationVm as never,
        handleSave: ujatProgramRegistrationVm.handleSave,
      },
      generic,
    }),
    [generic, registryEntry, ujatProgramRegistrationVm]
  )

  const { leftContent, rightNavigation } = useTemplatePreviewModalPanels(
    rendererContext,
    ujatProgramRegistrationVm.isDraftLoading
  )

  return (
    <TemplatePreviewModalShell
      {...shellProps}
      title={title}
      description={
        registrationUserMode
          ? undefined
          : (registryEntry.modalDescription ?? TEMPLATE_FORM_MODAL_DESCRIPTION)
      }
      registrationUserMode={registrationUserMode}
      footerAction={footerAction}
      onPreview={handlePreview}
      onSave={ujatProgramRegistrationVm.handleSave}
      isDraftLoading={ujatProgramRegistrationVm.isDraftLoading}
      leftContent={leftContent}
      rightNavigation={rightNavigation}
    />
  )
}

function ParticipantApplicationTemplatePreviewEditor({
  title,
  registryEntry,
  templateId,
  templateName,
  onTemplateDraftSaveConfirmed,
  registrationUserMode,
  footerAction,
  generic,
  previewControllerBase,
  ...shellProps
}: TemplatePreviewModalEditorProps & { registryEntry: TemplateRegistryDefinition }) {
  const previewTitle = resolvePreviewHeaderTitle(registryEntry, templateName)
  const variant = registryEntry.editorVariant ?? 'individual'
  const programParticipantApplicationVm = useProgramParticipantApplicationEditor(
    true,
    previewTitle,
    variant,
    {
      onTemplateDraftSaveConfirmed,
      templateCode: registryEntry.id ?? templateId,
    }
  )

  const { handlePreview } = useTemplatePreviewController({
    ...previewControllerBase,
    runPreview: programParticipantApplicationVm.handlePreview,
  })

  const rendererContext = useMemo(
    (): TemplateRendererContext => ({
      registryEntry,
      editorVm: {
        registryEntry,
        isProgramRegistration: false,
        isUjatProgramRegistration: false,
        isParticipantApplication: true,
        isWritingSurveyList: false,
        isDraftLoading: programParticipantApplicationVm.isDraftLoading,
        programRegistrationVm: programParticipantApplicationVm as never,
        ujatProgramRegistrationVm: programParticipantApplicationVm as never,
        programParticipantApplicationVm,
        surveyListEditor: programParticipantApplicationVm as never,
        surveyTableRowSelection: programParticipantApplicationVm as never,
        handleSave: programParticipantApplicationVm.handleSave,
      },
      generic,
    }),
    [generic, programParticipantApplicationVm, registryEntry]
  )

  const { leftContent, rightNavigation } = useTemplatePreviewModalPanels(
    rendererContext,
    programParticipantApplicationVm.isDraftLoading
  )

  return (
    <TemplatePreviewModalShell
      {...shellProps}
      title={title}
      description={
        registrationUserMode
          ? undefined
          : (registryEntry.modalDescription ?? TEMPLATE_FORM_MODAL_DESCRIPTION)
      }
      registrationUserMode={registrationUserMode}
      footerAction={footerAction}
      onPreview={handlePreview}
      onSave={programParticipantApplicationVm.handleSave}
      isDraftLoading={programParticipantApplicationVm.isDraftLoading}
      leftContent={leftContent}
      rightNavigation={rightNavigation}
    />
  )
}

function SurveyTemplatePreviewEditor({
  title,
  registryEntry,
  templateId,
  templateName,
  onTemplateDraftSaveConfirmed,
  registrationUserMode,
  footerAction,
  generic,
  previewControllerBase,
  ...shellProps
}: TemplatePreviewModalEditorProps & { registryEntry: TemplateRegistryDefinition }) {
  const getSurveyListInitialDraft = (): WritingFormDraft => {
    const base = createDefaultSurveyDraft()
    const name = templateName?.trim()
    if (name == null || name === '') return base
    return {
      ...base,
      paragraphs: base.paragraphs.map(p =>
        p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title ? { ...p, surveyTitle: name } : p
      ),
    }
  }

  const surveyListEditor = useWritingFormEditorWithUserPreview({
    open: true,
    getInitialDraft: getSurveyListInitialDraft,
    getDefaultActiveParagraphId: () => DEFAULT_SURVEY_PARAGRAPH_IDS.title,
    previewHeaderTitle: resolvePreviewHeaderTitle(registryEntry, templateName),
    editorKind: 'survey',
    templateCode: registryEntry.id ?? templateId,
    onTemplateDraftSaveConfirmed,
  })

  const surveyTableRowSelection = useTableRowSelectionState({
    paragraphs: surveyListEditor.draft.paragraphs,
    activeParagraphId: surveyListEditor.activeParagraphId,
  })

  const { handlePreview } = useTemplatePreviewController({
    ...previewControllerBase,
    runPreview: surveyListEditor.handlePreview,
  })

  const rendererContext = useMemo(
    (): TemplateRendererContext => ({
      registryEntry,
      editorVm: {
        registryEntry,
        isProgramRegistration: false,
        isUjatProgramRegistration: false,
        isParticipantApplication: false,
        isWritingSurveyList: true,
        isDraftLoading: surveyListEditor.isDraftLoading,
        programRegistrationVm: surveyListEditor as never,
        ujatProgramRegistrationVm: surveyListEditor as never,
        programParticipantApplicationVm: surveyListEditor as never,
        surveyListEditor,
        surveyTableRowSelection,
        handleSave: surveyListEditor.handleSave,
      },
      generic,
    }),
    [generic, registryEntry, surveyListEditor, surveyTableRowSelection]
  )

  const { leftContent, rightNavigation } = useTemplatePreviewModalPanels(
    rendererContext,
    surveyListEditor.isDraftLoading
  )

  return (
    <TemplatePreviewModalShell
      {...shellProps}
      title={title}
      description={
        registrationUserMode
          ? undefined
          : (registryEntry.modalDescription ?? TEMPLATE_FORM_MODAL_DESCRIPTION)
      }
      registrationUserMode={registrationUserMode}
      footerAction={footerAction}
      onPreview={handlePreview}
      onSave={surveyListEditor.handleSave}
      isDraftLoading={surveyListEditor.isDraftLoading}
      leftContent={leftContent}
      rightNavigation={rightNavigation}
    />
  )
}

function GenericTemplatePreviewEditor({
  title,
  registryEntry,
  templateName,
  registrationUserMode,
  footerAction,
  generic,
  previewControllerBase,
  ...shellProps
}: TemplatePreviewModalEditorProps) {
  const { handlePreview } = useTemplatePreviewController({
    ...previewControllerBase,
    runPreview: () => {},
  })

  const rendererContext = useMemo(
    (): TemplateRendererContext => ({
      registryEntry,
      editorVm: {
        registryEntry,
        isProgramRegistration: false,
        isUjatProgramRegistration: false,
        isParticipantApplication: false,
        isWritingSurveyList: false,
        isDraftLoading: false,
        programRegistrationVm: generic as never,
        ujatProgramRegistrationVm: generic as never,
        programParticipantApplicationVm: generic as never,
        surveyListEditor: generic as never,
        surveyTableRowSelection: generic as never,
        handleSave: undefined,
      },
      generic,
    }),
    [generic, registryEntry]
  )

  const panels = useMemo(() => resolveTemplateEditorPanels(rendererContext), [rendererContext])

  return (
    <TemplatePreviewModalShell
      {...shellProps}
      title={title}
      description={
        registrationUserMode
          ? undefined
          : (registryEntry?.modalDescription ?? TEMPLATE_FORM_MODAL_DESCRIPTION)
      }
      registrationUserMode={registrationUserMode}
      footerAction={footerAction}
      onPreview={handlePreview}
      onSave={undefined}
      isDraftLoading={false}
      leftContent={panels.leftContent}
      rightNavigation={panels.rightNavigation}
    />
  )
}

/** `open === true`일 때만 마운트 — 활성 양식 에디터 훅 1개만 실행 */
export function TemplatePreviewModalEditor(props: TemplatePreviewModalEditorProps) {
  const entry = props.registryEntry ?? lookupTemplateRegistry(props.templateId)

  if (entry && isRegistrationRegistryEntry(entry) && entry.registrationEditor === 'general') {
    return <GeneralRegistrationTemplatePreviewEditor {...props} registryEntry={entry} />
  }
  if (entry?.registrationEditor === 'ujat') {
    return <UjatRegistrationTemplatePreviewEditor {...props} registryEntry={entry} />
  }
  if (entry && isParticipantApplicationRegistryEntry(entry)) {
    return <ParticipantApplicationTemplatePreviewEditor {...props} registryEntry={entry} />
  }
  if (entry && isSurveyRegistryEntry(entry)) {
    return <SurveyTemplatePreviewEditor {...props} registryEntry={entry} />
  }
  return <GenericTemplatePreviewEditor {...props} registryEntry={entry} />
}
