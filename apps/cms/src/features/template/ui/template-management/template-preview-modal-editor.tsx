import { useCallback, useMemo, type ReactNode } from 'react'
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
import {
  isRecruitmentEditorVariant,
  useProgramParticipantApplicationEditor,
} from '@/features/template/hooks/use-program-participant-application-editor'
import { HideParagraphSelectionChromeContext } from '@/features/template/context/paragraph-selection-chrome-context'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'
import { useFormTemplateModalTitle } from '@/features/template/hooks/use-form-template-modal-title'
import { useUjatProgramRegistrationEditor } from '@/features/template/ui/form-set/registration-form/UJAT'
import {
  isCatalogOperationalWritingTemplateCode,
  isRecruitmentWritingTemplateCode,
} from '@/features/template/lib/form-template-delete-policy'
import { useCmsAlert } from '@/shared/ui'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  useTemplatePreviewController,
  type TemplatePreviewControllerParams,
} from '@/features/template/hooks/use-template-preview-controller'
import {
  createSurveyTemplateSeedDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

/** 시안(5767:42989·5767:43362)에서 설문 제목이 빈 칸(「설문 제목 입력」)인 카탈로그 설문 */
const SURVEY_SEED_EMPTY_TITLE_TEMPLATE_CODES = new Set<string>(['survey-default', 'survey-student'])

export type CatalogOriginalSaveRestrictionNotice = { title: string; content: string }

const CATALOG_ORIGINAL_SAVE_RESTRICTION_TITLE = '양식 수정 제한 안내'

/**
 * 기본(CATALOG) 등록·모집·신청 양식 저장 클릭 시 안내. 저장 API는 호출하지 않는다.
 * 복사본(카탈로그 밖 code)·사용자 등록 모드는 null → 기존 저장 그대로.
 */
export function resolveCatalogOriginalSaveRestrictionNotice(args: {
  templateId: string | undefined
  registrationUserMode?: boolean
}): CatalogOriginalSaveRestrictionNotice | null {
  if (args.registrationUserMode) return null
  if (!isCatalogOperationalWritingTemplateCode(args.templateId)) return null
  const code = args.templateId?.trim() ?? ''
  if (code.startsWith('registration-')) {
    return {
      title: CATALOG_ORIGINAL_SAVE_RESTRICTION_TITLE,
      content: '등록 양식은 항목 추가 및 삭제, 수정이 불가합니다.',
    }
  }
  const formLabel = isRecruitmentWritingTemplateCode(code) ? '모집' : '신청'
  return {
    title: CATALOG_ORIGINAL_SAVE_RESTRICTION_TITLE,
    content: `${formLabel} 폼 기본 양식은 항목 추가 및 삭제, 수정이 불가합니다.\n신규 템플릿 생성으로 복사본 생성 후 수정해주세요.`,
  }
}

/** 기본 양식이면 안내 팝업, 아니면 기존 handleSave */
function useCatalogOriginalGuardedSave(args: {
  templateId: string | undefined
  registrationUserMode?: boolean
  handleSave: () => unknown
}): () => void {
  const { showAlert } = useCmsAlert()
  const { templateId, registrationUserMode, handleSave } = args
  return useCallback(() => {
    const notice = resolveCatalogOriginalSaveRestrictionNotice({
      templateId,
      registrationUserMode,
    })
    if (notice) {
      showAlert(notice)
      return
    }
    void handleSave()
  }, [handleSave, registrationUserMode, showAlert, templateId])
}

type TemplatePreviewModalEditorProps = {
  title: string
  onClose: () => void
  showDeleteButton?: boolean
  onDelete?: () => void
  deleteLoading?: boolean
  registryEntry: TemplateRegistryDefinition | undefined
  templateId: string | undefined
  templateVersionId?: number
  templateName: string | undefined
  systemTemplate?: boolean
  forceUserEditable?: boolean
  onTemplateDraftSaveConfirmed?: () => void
  onTitleCommit?: (nextTitle: string) => void
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
  showSave?: boolean
  onTitleCommit?: (nextTitle: string) => void
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
  showSave = true,
  onTitleCommit,
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
      showSave={showSave}
      onTitleCommit={onTitleCommit}
      showDeleteButton={showDeleteButton}
      onDelete={onDelete}
      deleteLoading={deleteLoading}
      registrationUserMode={registrationUserMode}
      // 템플릿 관리 편집기: 상단 「닫기」 없이 미리보기·저장, 닫기는 우측 상단 X (QA 261113 #11·#44)
      showHeaderCloseButton={registrationUserMode}
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
  systemTemplate,
  forceUserEditable = false,
  onTemplateDraftSaveConfirmed,
  registrationUserMode,
  footerAction,
  generic,
  previewControllerBase,
  ...shellProps
}: TemplatePreviewModalEditorProps & { registryEntry: TemplateRegistryDefinition }) {
  const previewTitle = resolvePreviewHeaderTitle(registryEntry, templateName)
  const programRegistrationVm = useProgramRegistrationEditor(true, previewTitle, {
    restrictCurriculumSessionStructure: false,
    programRegistrationFormVariant: registryEntry.registrationFormVariant ?? 'general',
    templateCode: registryEntry.id ?? templateId,
    systemTemplate,
    forceUserEditable,
    onTemplateDraftSaveConfirmed,
  })

  const { handlePreview } = useTemplatePreviewController({
    ...previewControllerBase,
    runPreview: programRegistrationVm.handlePreview,
  })
  const guardedSave = useCatalogOriginalGuardedSave({
    templateId,
    registrationUserMode,
    handleSave: programRegistrationVm.handleSave,
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
      onSave={guardedSave}
      isDraftLoading={programRegistrationVm.isDraftLoading}
      leftContent={leftContent}
      rightNavigation={rightNavigation}
    />
  )
}

function UjatRegistrationTemplatePreviewEditor({
  title,
  registryEntry,
  templateId,
  templateName,
  systemTemplate,
  forceUserEditable = false,
  onTemplateDraftSaveConfirmed,
  registrationUserMode,
  footerAction,
  generic,
  previewControllerBase,
  ...shellProps
}: TemplatePreviewModalEditorProps & { registryEntry: TemplateRegistryDefinition }) {
  const previewTitle = resolvePreviewHeaderTitle(registryEntry, templateName)
  const ujatProgramRegistrationVm = useUjatProgramRegistrationEditor(true, previewTitle, {
    templateCode: templateId,
    systemTemplate,
    forceUserEditable,
    onTemplateDraftSaveConfirmed,
  })

  const { handlePreview } = useTemplatePreviewController({
    ...previewControllerBase,
    runPreview: ujatProgramRegistrationVm.handlePreview,
  })
  const guardedSave = useCatalogOriginalGuardedSave({
    templateId,
    registrationUserMode,
    handleSave: ujatProgramRegistrationVm.handleSave,
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
      onSave={guardedSave}
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
  templateVersionId,
  templateName,
  systemTemplate,
  forceUserEditable = false,
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
      templateVersionId,
      systemTemplate,
      forceUserEditable,
    }
  )

  const { handlePreview } = useTemplatePreviewController({
    ...previewControllerBase,
    runPreview: programParticipantApplicationVm.handlePreview,
  })
  const guardedSave = useCatalogOriginalGuardedSave({
    templateId,
    registrationUserMode,
    handleSave: programParticipantApplicationVm.handleSave,
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
  const isRecruitment = isRecruitmentEditorVariant(variant)

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
      onSave={guardedSave}
      isDraftLoading={programParticipantApplicationVm.isDraftLoading}
      leftContent={
        isRecruitment ? (
          <HideParagraphSelectionChromeContext.Provider value>
            {leftContent}
          </HideParagraphSelectionChromeContext.Provider>
        ) : (
          leftContent
        )
      }
      rightNavigation={isRecruitment ? null : rightNavigation}
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
  const surveySeedTemplateCode = registryEntry.id ?? templateId
  const getSurveyListInitialDraft = useCallback((): WritingFormDraft => {
    const base = createSurveyTemplateSeedDraft(surveySeedTemplateCode)
    if (SURVEY_SEED_EMPTY_TITLE_TEMPLATE_CODES.has(surveySeedTemplateCode ?? '')) return base
    const name = templateName?.trim()
    if (name == null || name === '') return base
    return {
      ...base,
      paragraphs: base.paragraphs.map(p =>
        p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title ? { ...p, surveyTitle: name } : p
      ),
    }
  }, [templateName, surveySeedTemplateCode])

  const getSurveyListDefaultParagraphId = useCallback((_draft: WritingFormDraft) => {
    return DEFAULT_SURVEY_PARAGRAPH_IDS.title
  }, [])

  const surveyListEditor = useWritingFormEditorWithUserPreview({
    open: true,
    getInitialDraft: getSurveyListInitialDraft,
    getDefaultActiveParagraphId: getSurveyListDefaultParagraphId,
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
  const templateCode = props.templateId?.trim() || entry?.id
  const { displayName, commitTitle } = useFormTemplateModalTitle({
    templateCode,
    initialName: props.title,
  })
  const titledProps: TemplatePreviewModalEditorProps = {
    ...props,
    title: displayName,
    onTitleCommit: commitTitle,
  }

  if (entry && isRegistrationRegistryEntry(entry) && entry.registrationEditor === 'general') {
    return <GeneralRegistrationTemplatePreviewEditor {...titledProps} registryEntry={entry} />
  }
  if (entry?.registrationEditor === 'ujat') {
    return <UjatRegistrationTemplatePreviewEditor {...titledProps} registryEntry={entry} />
  }
  if (entry && isParticipantApplicationRegistryEntry(entry)) {
    return <ParticipantApplicationTemplatePreviewEditor {...titledProps} registryEntry={entry} />
  }
  if (entry && isSurveyRegistryEntry(entry)) {
    return <SurveyTemplatePreviewEditor {...titledProps} registryEntry={entry} />
  }
  return <GenericTemplatePreviewEditor {...titledProps} registryEntry={entry} />
}
