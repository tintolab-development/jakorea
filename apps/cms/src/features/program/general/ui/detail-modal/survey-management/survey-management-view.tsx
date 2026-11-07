import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Spin } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { handleError } from '@/shared/utils/error-handler'
import { loadFormTemplateVersionDraftByVersionId } from '@/features/template/api/admin-form-templates-service'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import { useClipboard } from '@/features/template/hooks/use-clipboard'
import {
  useTemplateWritingPreview,
  type TemplateWritingUserPreviewSession,
} from '@/features/template/context/template-writing-preview-context'
import { usePushUserPreviewHistoryWhenOpen } from '@/features/template/hooks/use-push-user-preview-history-when-open'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { getSurveyWritingTemplateSelectOptions } from '@/features/program/shared/lib/survey-management/survey-template-options'
import {
  findWritingTemplateRowByDefinitionId,
  getWritingTemplateRowsByCategory,
} from '@/features/template/lib/writing-template-create-helpers'
import {
  applyLectureEvalAnswersToDraft,
  buildLectureEvalFormDraft,
  canEditLectureEvalResponse,
  draftToLectureEvalPollResponse,
  isLectureEvalResultsTabAccessible,
  LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT,
  parseLectureEvalFormResponseId,
  LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
  LECTURE_EVAL_TEMPLATE_ID,
  validateLectureEvalFormDraft,
  type LectureEvalTabKey,
} from '@/features/program/shared/lib/survey-management/lecture-eval-survey'
import {
  buildLectureEvalResultsPdfFileName,
  exportLectureEvalResultsPdf,
} from '@/features/program/shared/lib/survey-management/export-lecture-eval-results-pdf'
import type { Program } from '@/types/domain'
import {
  GENERAL_LECTURE_EVAL_ACTION_LABELS,
  GENERAL_LECTURE_EVAL_DOWNLOAD_MODAL_COPY,
  GENERAL_LECTURE_EVAL_EMPTY_COPY,
  GENERAL_LECTURE_EVAL_INCOMPLETE_MODAL_COPY,
  GENERAL_LECTURE_EVAL_PRE_START_COPY,
  GENERAL_LECTURE_EVAL_REGISTER_MODAL_COPY,
  GENERAL_LECTURE_EVAL_SUBMITTED_COPY,
  GENERAL_SATISFACTION_DOWNLOAD_MODAL_COPY,
  GENERAL_SATISFACTION_NO_RESPONSE_COPY,
  GENERAL_SATISFACTION_SHARE_TOAST_COPY,
  GENERAL_SURVEY_POLL_ACTION_LABELS,
  GENERAL_SURVEY_MENU_EMPTY_COPY,
  GENERAL_SURVEY_POLL_EMPTY_COPY,
  GENERAL_SURVEY_POLL_NO_RESPONSE_COPY,
  GENERAL_SURVEY_POLL_SHARE_TOAST_COPY,
} from '@/features/program/shared/lib/survey-management/survey-copy'
import type {
  RegisteredSurvey,
  SurveyPollRawResponse,
} from '@/features/program/shared/lib/survey-management/survey-management-types'
import {
  applySurveyDisplayTitleToDraft,
  resolveSurveyWritingDraft,
} from '@/features/program/shared/lib/survey-management/survey-writing-draft'
import {
  applySurveyTitleCustomPeriodToDraft,
  resolveSatisfactionPreviewPeriod,
  type SatisfactionFormEditPeriod,
} from '@/features/program/shared/lib/survey-management/satisfaction-form-edit-period'
import {
  resolvePublishedSurveyBinding,
  surveyBindingResolutionAlert,
  type SurveySubmissionPeriod,
} from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'
import { ensureSurveyCreateSubmissionPeriod } from '@/features/program/shared/lib/survey-management/survey-binding-period'
import { resolveLectureEvalBindingTargetForCreate } from '@/features/program/shared/lib/survey-management/resolve-lecture-eval-binding-target'
import { resolveSurveyPollBindingTarget } from '@/features/program/shared/lib/survey-management/resolve-survey-poll-binding-target'
import {
  SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE,
  collectUnboundSurveyPollScheduleValues,
  isSurveyPollBindingTargetScheduleAlreadyRegistered,
  pickLastSurveyPollEducationSlot,
  sortSatisfactionScheduleDisplayItemsAsc,
} from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import {
  resolveSurveyPollBindingTargetWhenScheduleFieldHidden,
  shouldShowSurveyPollScheduleSelectField,
} from '@/features/program/shared/lib/survey-management/should-show-survey-poll-schedule-field'
import { loadProgramSurveyFormEditAfterBinding } from '@/features/program/shared/lib/survey-management/load-program-survey-form-edit'
import {
  findSatisfactionScheduleById,
  resolveSatisfactionCreateSubmissionPeriod,
} from '@/features/program/shared/lib/survey-management/satisfaction-form-edit-period'
import { resolveSatisfactionSurveyDisplayTitle } from '@/features/program/shared/lib/survey-management/satisfaction-survey-display-title'
import { useProgramSurveyScheduleOptions } from '@/features/program/shared/hooks/use-program-survey-schedule-options'
import { SurveyPollRegisterModal } from '@/features/program/shared/ui/survey-management/survey-poll-register-modal'
import { SatisfactionRegisterModal } from '@/features/program/shared/ui/survey-management/satisfaction-register-modal'
import {
  DEFAULT_SATISFACTION_WINDOW_DAYS,
  SATISFACTION_RUN_MODE_ONCE_AT_END,
  SATISFACTION_RUN_MODE_PER_SCHEDULE,
  buildSatisfactionBindingWriteFields,
  canDownloadSatisfactionResults,
  formatSatisfactionOnceAtEndScheduleLabel,
  isSatisfactionPerScheduleWritingPeriodLocked,
  type SatisfactionFormBindingRequest,
  type SatisfactionRunMode,
  type SatisfactionWindowDays,
} from '@/features/program/shared/lib/survey-management/satisfaction-binding-contract'
import { SurveyEmptyState } from '@/features/program/shared/ui/survey-management/survey-empty-state'
import { SurveyNoResponseState } from '@/features/program/shared/ui/survey-management/survey-no-response-state'
import { SurveyPollResultsView } from '@/features/program/shared/ui/survey-management/survey-poll-results-view'
import { SurveyRegisteredActions } from '@/features/program/shared/ui/survey-management/survey-registered-actions'
import { SatisfactionSurveyView } from '@/features/program/shared/ui/survey-management/satisfaction-survey-view'
import { LectureEvalSurveyView } from '@/features/program/shared/ui/survey-management/lecture-eval-survey-view'
import {
  SurveyTemplateEditModal,
  type ProgramSurveyFormEdit,
} from '@/features/program/shared/ui/survey-management/survey-template-edit-modal'
import {
  buildProgramSurveyFormEditTarget,
  canEditRegisteredSurveyForm,
} from '@/features/program/shared/lib/survey-management/save-program-survey-form-edit'
import { SurveyShareCopyToast } from '@/features/program/shared/ui/survey-management/survey-share-copy-toast'
import {
  SurveyResultsDownloadModal,
  type SurveyResultsDownloadFormat,
} from '@/features/program/shared/ui/survey-management/survey-results-download-modal'
import { exportSurveyResultsExcel } from '@/features/program/shared/lib/survey-management/export-survey-results-excel'
import {
  GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE,
  getDefaultGeneralSatisfactionAudience,
  getEnabledGeneralSatisfactionAudienceTabs,
  getGeneralSatisfactionActionLabels,
  getGeneralSatisfactionAudienceLabel,
  getGeneralSatisfactionCreateDescription,
  getGeneralSatisfactionDeleteModalTitle,
  getGeneralSatisfactionEmptyCopy,
  isGeneralIndividualProgram,
  isInstitutionTeacherOnlySatisfactionProgram,
  isGeneralSatisfactionSurveyNavTab,
  isTrainedTeachersProgram,
  resolveGeneralSatisfactionAudienceFromNavTab,
  resolveSatisfactionFormBindingTargetRole,
  type GeneralSatisfactionAudienceKey,
} from '@/features/program/general/lib/survey-audience'
import { buildGeneralSurveyEmptyState } from './survey-empty-state'
import {
  useGeneralProgramSurveyFormBindingMutations,
  useGeneralProgramSurveyResponses,
  useGeneralProgramSurveys,
  useGeneralProgramSurveySummary,
} from '@/features/program/general/hooks/use-general-program-posts-surveys'
import {
  createGeneralProgramSurveyShareLink,
  submitGeneralProgramFormResponse,
  updateGeneralProgramFormResponse,
} from '@/features/program/general/api/admin-general-programs-service'
import {
  groupSatisfactionSurveysByAudience,
  isSurveyTemplateOptionForKind,
  pickLectureEvalSurveyFromRemote,
  resolveLectureEvalSubmitContext,
  resolveSurveyResultsParticipantTotal,
  describeSurveyShareClipboardFailure,
  resolveSurveyShareClipboardUrl,
} from '@/features/program/general/api/adapters/program-survey-adapters'
import { getPlatformPublicOrigin } from '@/features/program/general/lib/public-survey-origin'
import {
  getGeneralProgramApiErrorMessage,
  getProgramFormBindingErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'
import { formatSatisfactionPerScheduleDisplayName } from '@/shared/lib/education-schedule-name'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { getGeneralSurveyMenuItems } from '@/features/program/general/lib/detail-meta'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useQueryClient } from '@tanstack/react-query'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import '@/features/program/shared/ui/survey-management/survey-management.css'
import './survey-management.css'

type CreateModalKind = 'survey' | 'satisfaction' | 'lecture'
type DeleteModalKind = 'survey' | 'satisfaction'

export type GeneralSurveyManagementViewProps = {
  program: Program
  activeTab: string
}

async function buildPreviewSession(args: {
  templateId: string
  title?: string
  versionId?: string
  lecture?: boolean
  overwriteTitle?: boolean
  displayPeriod?: SatisfactionFormEditPeriod | null
  onEditForm?: () => void
  paragraphBodyOptions?: TemplateWritingUserPreviewSession['paragraphBodyOptions']
}): Promise<TemplateWritingUserPreviewSession | null> {
  const row = findWritingTemplateRowByDefinitionId(args.templateId)
  if (row != null) {
    const entry = lookupTemplateRegistry(row.id)
    if (entry == null || !isSurveyRegistryEntry(entry)) return null
    const draft = args.lecture
      ? await buildLectureEvalFormDraft(row.id)
      : await resolveSurveyWritingDraft(args.templateId, {
          templateName: args.title?.trim() || row.templateName,
        })
    return {
      draft: applySurveyTitleCustomPeriodToDraft(
        applySurveyDisplayTitleToDraft(draft, args.title, {
          overwrite: args.overwriteTitle === true,
        }),
        args.displayPeriod
      ),
      updateParagraph: () => {},
      headerTitle: args.title?.trim() || resolvePreviewHeaderTitle(entry, row.templateName),
      editorKind: 'survey',
      ...(args.paragraphBodyOptions != null
        ? { paragraphBodyOptions: args.paragraphBodyOptions }
        : {}),
      ...(args.onEditForm != null ? { onEditForm: args.onEditForm } : {}),
    }
  }

  const versionId = Number(args.versionId)
  if (!Number.isFinite(versionId) || versionId <= 0) return null
  const record = await loadFormTemplateVersionDraftByVersionId(
    args.templateId,
    Math.trunc(versionId)
  )
  if (record?.draft == null) return null
  return {
    draft: applySurveyTitleCustomPeriodToDraft(
      applySurveyDisplayTitleToDraft(record.draft, args.title, {
        overwrite: args.overwriteTitle === true,
      }),
      args.displayPeriod
    ),
    updateParagraph: () => {},
    headerTitle: args.title?.trim() || '설문조사',
    editorKind: 'survey',
    ...(args.paragraphBodyOptions != null
      ? { paragraphBodyOptions: args.paragraphBodyOptions }
      : {}),
    ...(args.onEditForm != null ? { onEditForm: args.onEditForm } : {}),
  }
}

function buildSurveyPollResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '설문조사'
  return `${safeProgram}_${safeSurvey}_설문조사결과.pdf`
}

function pickRegisteredSurveyTemplateId(
  preferredId: string,
  rows: { id: string; templateName: string }[],
  nameIncludes?: string
): string {
  const exact = rows.find(row => row.id === preferredId)
  if (exact) return exact.id
  if (nameIncludes) {
    const named = rows.find(row => row.templateName.includes(nameIncludes))
    if (named) return named.id
  }
  return preferredId
}

/** remote 설문 id = 바인딩 templateVersionId */
function toRemoteSurveyVersionId(
  survey: Pick<RegisteredSurvey, 'id'> | null | undefined,
  remote: boolean
): number | undefined {
  if (!remote || survey == null) return undefined
  const value = Number(survey.id)
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : undefined
}

function buildSatisfactionResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '만족도조사'
  return `${safeProgram}_${safeSurvey}_만족도조사결과.pdf`
}

export function GeneralSurveyManagementView({
  program,
  activeTab,
}: GeneralSurveyManagementViewProps) {
  const initialMock = useMemo(() => buildGeneralSurveyEmptyState(program), [program])
  const {
    registeredSurveys: remoteRegisteredSurveys,
    classifiedBindings,
    rawSurveys,
    initialLoading: surveysLoading,
    isRemoteDataSource: surveysRemote,
  } = useGeneralProgramSurveys(program.id)
  const {
    createBinding,
    deleteBinding,
    invalidateSurveyCaches,
    isMutating: bindingMutating,
  } = useGeneralProgramSurveyFormBindingMutations(program.id)
  const { sections: writingFormSections, isRemote: writingFormsRemote } = useWritingFormSections()
  const remoteSurveyRows = useMemo(
    () =>
      writingFormsRemote ? getWritingTemplateRowsByCategory('survey', writingFormSections) : [],
    [writingFormSections, writingFormsRemote]
  )
  const [registeredSurveys, setRegisteredSurveys] = useState(() =>
    surveysRemote ? [] : initialMock.registeredSurveys
  )
  const [activeRegisteredSurveyId, setActiveRegisteredSurveyId] = useState<string | null>(() =>
    surveysRemote ? null : initialMock.activeRegisteredSurveyId
  )
  const [satisfactionSurveysByAudience, setSatisfactionSurveysByAudience] = useState<
    Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>>
  >(() => (surveysRemote ? {} : initialMock.satisfactionSurveysByAudience))
  const [satisfactionBindingsByAudience, setSatisfactionBindingsByAudience] = useState<
    Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey[]>>
  >({})
  const [satisfactionScheduleTab, setSatisfactionScheduleTab] = useState<string | null>(null)
  const [satisfactionRunMode, setSatisfactionRunMode] = useState<SatisfactionRunMode>(
    SATISFACTION_RUN_MODE_PER_SCHEDULE
  )
  const [satisfactionWindowDays, setSatisfactionWindowDays] = useState<SatisfactionWindowDays>(
    DEFAULT_SATISFACTION_WINDOW_DAYS
  )
  const [activeSatisfactionAudience, setActiveSatisfactionAudience] = useState(() =>
    getDefaultGeneralSatisfactionAudience(program)
  )
  const [pendingSatisfactionAudience, setPendingSatisfactionAudience] =
    useState<GeneralSatisfactionAudienceKey | null>(null)
  const [lectureEvalSurvey, setLectureEvalSurvey] = useState<RegisteredSurvey | null>(() =>
    surveysRemote ? null : initialMock.lectureEvalSurvey
  )
  const [lectureEvalSubmitted, setLectureEvalSubmitted] = useState(() =>
    surveysRemote ? false : initialMock.lectureEvalSubmitted
  )
  const [lectureEvalFormDraft, setLectureEvalFormDraft] = useState<WritingFormDraft | null>(null)
  const lectureEvalDraftRef = useRef<WritingFormDraft | null>(null)
  const [lectureEvalResponses, setLectureEvalResponses] = useState<SurveyPollRawResponse[]>(() =>
    surveysRemote ? [] : initialMock.lectureEvalResponses
  )
  const [activeLectureEvalTab, setActiveLectureEvalTab] = useState<LectureEvalTabKey>(() =>
    surveysRemote ? 'eval' : initialMock.initialLectureEvalTab
  )
  const [createModalKind, setCreateModalKind] = useState<CreateModalKind | null>(null)
  const [deleteModalKind, setDeleteModalKind] = useState<DeleteModalKind | null>(null)
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedSurveyScheduleValue, setSelectedSurveyScheduleValue] = useState<string | null>(
    null
  )
  const [submitting, setSubmitting] = useState(false)
  const [createFieldError, setCreateFieldError] = useState<{
    field: string
    message: string
  } | null>(null)
  const [lectureEvalIncompleteModalOpen, setLectureEvalIncompleteModalOpen] = useState(false)
  const [downloadingLectureEvalResults, setDownloadingLectureEvalResults] = useState(false)
  const [templateEditId, setTemplateEditId] = useState<string | null>(null)
  const [programFormEdit, setProgramFormEdit] = useState<ProgramSurveyFormEdit | null>(null)
  const [shareToastOpen, setShareToastOpen] = useState(false)
  const [shareToastLines, setShareToastLines] = useState<{ line1: string; line2: string }>({
    line1: GENERAL_SURVEY_POLL_SHARE_TOAST_COPY.line1,
    line2: GENERAL_SURVEY_POLL_SHARE_TOAST_COPY.line2,
  })
  const [lectureEvalDownloadModalOpen, setLectureEvalDownloadModalOpen] = useState(false)
  const [pollDownloadModalOpen, setPollDownloadModalOpen] = useState(false)
  const [satisfactionDownloadModalOpen, setSatisfactionDownloadModalOpen] = useState(false)
  const [downloadingPollResults, setDownloadingPollResults] = useState(false)
  const [downloadingSatisfactionResults, setDownloadingSatisfactionResults] = useState(false)
  const lectureEvalResultsExportRef = useRef<HTMLDivElement>(null)
  const pollResultsExportRef = useRef<HTMLDivElement>(null)
  const satisfactionResultsExportRef = useRef<HTMLDivElement>(null)
  const shareToastTimerRef = useRef<number | null>(null)
  const { openWritingUserPreview, closeWritingUserPreview, isWritingUserPreviewOpen } =
    useTemplateWritingPreview()
  const requestPreviewHistoryPush = usePushUserPreviewHistoryWhenOpen(isWritingUserPreviewOpen)
  const { copyText } = useClipboard()
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const surveyMenuEmpty = getGeneralSurveyMenuItems(program).length === 0
  const surveyPollCreateModalOpen = createModalKind === 'survey'
  const satisfactionCreateModalOpen = createModalKind === 'satisfaction'
  const surveyScheduleOptionsQuery = useProgramSurveyScheduleOptions(
    program,
    surveyPollCreateModalOpen,
    classifiedBindings
  )
  const satisfactionScheduleOptionsQuery = useProgramSurveyScheduleOptions(
    program,
    satisfactionCreateModalOpen || isGeneralSatisfactionSurveyNavTab(activeTab),
    classifiedBindings,
    {
      formType: 'SATISFACTION',
      targetRole: resolveSatisfactionFormBindingTargetRole(program, pendingSatisfactionAudience),
    }
  )
  const satisfactionUnboundScheduleValues = useMemo(
    () => collectUnboundSurveyPollScheduleValues(satisfactionScheduleOptionsQuery.options),
    [satisfactionScheduleOptionsQuery.options]
  )
  const lastSatisfactionEducationScheduleLabel = useMemo(() => {
    const last = pickLastSurveyPollEducationSlot(satisfactionScheduleOptionsQuery.schedules)
    return last == null ? null : formatSatisfactionOnceAtEndScheduleLabel(last)
  }, [satisfactionScheduleOptionsQuery.schedules])
  const showSurveyPollScheduleSelectField = useMemo(
    () => shouldShowSurveyPollScheduleSelectField(program),
    [program]
  )

  useEffect(() => {
    if (!surveyPollCreateModalOpen || !showSurveyPollScheduleSelectField) return
    const options = surveyScheduleOptionsQuery.options ?? []
    if (options.length === 1 && options[0]?.value && !options[0].disabled) {
      setSelectedSurveyScheduleValue(String(options[0].value))
    }
  }, [
    surveyPollCreateModalOpen,
    showSurveyPollScheduleSelectField,
    surveyScheduleOptionsQuery.options,
  ])

  const audienceSatisfactionBindingsForQuery =
    satisfactionBindingsByAudience[activeSatisfactionAudience] ??
    (satisfactionSurveysByAudience[activeSatisfactionAudience]
      ? [satisfactionSurveysByAudience[activeSatisfactionAudience]!]
      : [])
  const satisfactionScheduleTabsForQuery = (() => {
    const items = sortSatisfactionScheduleDisplayItemsAsc(
      audienceSatisfactionBindingsForQuery.map(survey => {
        const slot = satisfactionScheduleOptionsQuery.schedules.find(
          row => row.id === survey.targetScopeId
        )
        return {
          key: survey.bindingId ?? survey.id,
          label: formatSatisfactionPerScheduleDisplayName({
            scheduleName: slot?.scheduleName ?? survey.targetScopeLabel,
            sessionNo: slot?.sessionNo,
            startAt: slot?.startAt ?? slot?.startDate ?? null,
          }),
          sessionNo: slot?.sessionNo,
          startAt: slot?.startAt ?? slot?.startDate ?? null,
        }
      })
    ).map(({ key, label }) => ({ key, label }))
    return items
  })()
  const resolvedSatisfactionScheduleTabForQuery =
    satisfactionScheduleTab != null &&
    satisfactionScheduleTabsForQuery.some(tab => tab.key === satisfactionScheduleTab)
      ? satisfactionScheduleTab
      : (satisfactionScheduleTabsForQuery[0]?.key ?? null)
  const selectedSatisfactionBindingForQuery =
    audienceSatisfactionBindingsForQuery.find(
      survey => (survey.bindingId ?? survey.id) === resolvedSatisfactionScheduleTabForQuery
    ) ??
    audienceSatisfactionBindingsForQuery[0] ??
    null
  const activeSatisfactionSurveyId = selectedSatisfactionBindingForQuery?.id
  const pollResponseVersionId =
    activeTab === 'survey' ? (activeRegisteredSurveyId ?? undefined) : undefined
  const satisfactionResponseVersionId = isGeneralSatisfactionSurveyNavTab(activeTab)
    ? activeSatisfactionSurveyId
    : undefined
  const lectureResponseVersionId =
    activeTab === 'lecture_evaluation' ? lectureEvalSurvey?.id : undefined
  const pollBindingId =
    activeTab === 'survey'
      ? registeredSurveys.find(item => item.id === activeRegisteredSurveyId)?.bindingId
      : undefined
  const satisfactionBindingId = isGeneralSatisfactionSurveyNavTab(activeTab)
    ? selectedSatisfactionBindingForQuery?.bindingId
    : undefined
  const lectureBindingId =
    activeTab === 'lecture_evaluation' ? lectureEvalSurvey?.bindingId : undefined

  const {
    pollResponses: remotePollResponses,
    initialLoading: pollResponsesLoading,
    isRemoteDataSource: pollResponsesRemote,
  } = useGeneralProgramSurveyResponses(program.id, pollResponseVersionId, {
    detailPolicy: 'public-text-only',
    bindingId: pollBindingId,
  })
  const {
    pollResponses: remoteSatisfactionResponses,
    isRemoteDataSource: satisfactionResponsesRemote,
  } = useGeneralProgramSurveyResponses(program.id, satisfactionResponseVersionId, {
    detailPolicy: 'public-text-only',
    bindingId: satisfactionBindingId,
  })
  const {
    pollResponses: remoteLectureResponses,
    isRemoteDataSource: lectureResponsesRemote,
  } = useGeneralProgramSurveyResponses(program.id, lectureResponseVersionId, {
    bindingId: lectureBindingId,
  })
  const {
    totalResponseCount: remotePollSummaryCount,
    questionSummaries: pollQuestionSummaries,
  } = useGeneralProgramSurveySummary(program.id, pollResponseVersionId, pollBindingId)
  const { questionSummaries: satisfactionQuestionSummaries } = useGeneralProgramSurveySummary(
    program.id,
    satisfactionResponseVersionId,
    satisfactionBindingId
  )

  useEffect(() => {
    // remote ON이면 mock으로 덮어쓰지 않음 — remote 목록 effect가 채움
    if (surveysRemote) return
    const next = buildGeneralSurveyEmptyState(program)
    setRegisteredSurveys(next.registeredSurveys)
    setActiveRegisteredSurveyId(next.activeRegisteredSurveyId)
    setSatisfactionSurveysByAudience(next.satisfactionSurveysByAudience)
    setPendingSatisfactionAudience(null)
    setActiveSatisfactionAudience(getDefaultGeneralSatisfactionAudience(program))
    setLectureEvalSurvey(next.lectureEvalSurvey)
    setLectureEvalSubmitted(next.lectureEvalSubmitted)
    setLectureEvalFormDraft(null)
    setLectureEvalResponses(next.lectureEvalResponses)
    setActiveLectureEvalTab(next.initialLectureEvalTab)
  }, [program, surveysRemote])

  useEffect(() => {
    if (!surveysRemote) return
    if (!remoteRegisteredSurveys) return
    setRegisteredSurveys(remoteRegisteredSurveys)
    setActiveRegisteredSurveyId(prev =>
      prev && remoteRegisteredSurveys.some(s => s.id === prev)
        ? prev
        : (remoteRegisteredSurveys[0]?.id ?? null)
    )
  }, [remoteRegisteredSurveys, surveysRemote])

  useEffect(() => {
    if (!surveysRemote || !classifiedBindings) return
    const fallbackSatisfactionAudience = getDefaultGeneralSatisfactionAudience(program)
    const grouped = groupSatisfactionSurveysByAudience(
      classifiedBindings,
      fallbackSatisfactionAudience
    )
    const nextSatisfaction: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>> = {}
    for (const [audience, surveys] of Object.entries(grouped) as Array<
      [GeneralSatisfactionAudienceKey, RegisteredSurvey[] | undefined]
    >) {
      if (surveys?.[0]) nextSatisfaction[audience] = surveys[0]
    }
    setSatisfactionBindingsByAudience(grouped)
    setSatisfactionSurveysByAudience(nextSatisfaction)
    setLectureEvalSurvey(
      pickLectureEvalSurveyFromRemote({
        classified: classifiedBindings,
        surveys: rawSurveys ?? [],
      })
    )
  }, [classifiedBindings, program, rawSurveys, surveysRemote])

  useEffect(() => {
    if (!isGeneralSatisfactionSurveyNavTab(activeTab)) return
    setActiveSatisfactionAudience(prev =>
      resolveGeneralSatisfactionAudienceFromNavTab(activeTab, program, prev)
    )
  }, [activeTab, program])

  useEffect(() => {
    return () => {
      if (shareToastTimerRef.current != null) {
        window.clearTimeout(shareToastTimerRef.current)
      }
    }
  }, [])

  const surveyTemplateOptions = useMemo(() => {
    if (remoteSurveyRows.length > 0) {
      return remoteSurveyRows
        .filter(
          row => createModalKind == null || isSurveyTemplateOptionForKind(row, createModalKind)
        )
        .map(row => ({
          label: row.templateName,
          value: row.id,
        }))
    }
    const options = getSurveyWritingTemplateSelectOptions()
    if (createModalKind == null) return options
    return options.filter(option =>
      isSurveyTemplateOptionForKind(
        { id: option.value, templateName: option.label },
        createModalKind
      )
    )
  }, [createModalKind, remoteSurveyRows])
  const activeRegisteredSurvey = useMemo(
    () => registeredSurveys.find(item => item.id === activeRegisteredSurveyId) ?? null,
    [registeredSurveys, activeRegisteredSurveyId]
  )
  const individualProgram = isGeneralIndividualProgram(program)
  const satisfactionAudienceTabs = useMemo(
    () => getEnabledGeneralSatisfactionAudienceTabs(program),
    [program]
  )
  const isInstitutionTeacherOnlySatisfaction = isInstitutionTeacherOnlySatisfactionProgram(program)
  const isTrainedTeacherSatisfaction = isTrainedTeachersProgram(program)
  const showSatisfactionAudienceTabs =
    !isInstitutionTeacherOnlySatisfaction && satisfactionAudienceTabs.length > 0
  const satisfactionScheduleTabs = satisfactionScheduleTabsForQuery
  const resolvedSatisfactionScheduleTab = resolvedSatisfactionScheduleTabForQuery
  const selectedSatisfactionBinding = selectedSatisfactionBindingForQuery
  const activeSatisfactionSurvey = selectedSatisfactionBinding
  const satisfactionDownloadEnabled = canDownloadSatisfactionResults(activeSatisfactionSurvey ?? {})
  const satisfactionSurveysForView = useMemo(() => {
    const next: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>> = {}
    const programTotal = isTrainedTeacherSatisfaction ? undefined : program.totalParticipants
    for (const [key, survey] of Object.entries(satisfactionSurveysByAudience) as Array<
      [GeneralSatisfactionAudienceKey, RegisteredSurvey | undefined]
    >) {
      if (survey == null) continue
      next[key] = {
        ...survey,
        participantTotal: resolveSurveyResultsParticipantTotal(survey, programTotal),
      }
    }
    return next
  }, [isTrainedTeacherSatisfaction, program.totalParticipants, satisfactionSurveysByAudience])
  const lectureEvalSurveyForView =
    lectureEvalSurvey == null
      ? null
      : {
          ...lectureEvalSurvey,
          participantTotal: resolveSurveyResultsParticipantTotal(
            lectureEvalSurvey,
            program.totalParticipants
          ),
        }

  const pollResponses = useMemo((): SurveyPollRawResponse[] => {
    if (pollResponsesRemote) return remotePollResponses ?? []
    return buildGeneralSurveyEmptyState(program).responses
  }, [pollResponsesRemote, program, remotePollResponses])

  const satisfactionResponses = useMemo((): SurveyPollRawResponse[] => {
    if (satisfactionResponsesRemote) return remoteSatisfactionResponses ?? []
    return []
  }, [remoteSatisfactionResponses, satisfactionResponsesRemote])

  useEffect(() => {
    if (!pollResponsesRemote || !activeRegisteredSurveyId) return
    const count = remotePollSummaryCount || (remotePollResponses?.length ?? 0)
    setRegisteredSurveys(prev =>
      prev.map(survey =>
        survey.id === activeRegisteredSurveyId ? { ...survey, responseCount: count } : survey
      )
    )
  }, [activeRegisteredSurveyId, pollResponsesRemote, remotePollResponses, remotePollSummaryCount])

  useEffect(() => {
    if (!lectureResponsesRemote) return
    if (remoteLectureResponses && remoteLectureResponses.length > 0) {
      setLectureEvalResponses(remoteLectureResponses)
      setLectureEvalSubmitted(true)
    }
  }, [lectureResponsesRemote, remoteLectureResponses])

  useEffect(() => {
    if (!lectureEvalSubmitted) return
    const answers = lectureEvalResponses[0]?.answers
    if (answers == null || Object.keys(answers).length === 0) return
    const current = lectureEvalDraftRef.current
    if (current == null) return
    const next = applyLectureEvalAnswersToDraft(current, answers)
    lectureEvalDraftRef.current = next
    setLectureEvalFormDraft(next)
  }, [lectureEvalResponses, lectureEvalSubmitted])

  useEffect(() => {
    if (lectureEvalSurvey == null) {
      lectureEvalDraftRef.current = null
      setLectureEvalFormDraft(null)
      if (!lectureResponsesRemote) {
        setLectureEvalResponses([])
        setLectureEvalSubmitted(false)
      }
      setActiveLectureEvalTab('eval')
      return
    }
    if (lectureEvalSurvey.status === 'in_progress' || lectureEvalSurvey.status === 'finished') {
      if (lectureEvalDraftRef.current != null) return
      let cancelled = false
      const versionId = Number(lectureEvalSurvey.id)
      const loadDraft = async () => {
        if (
          findWritingTemplateRowByDefinitionId(lectureEvalSurvey.templateId) == null &&
          Number.isFinite(versionId) &&
          versionId > 0
        ) {
          const record = await loadFormTemplateVersionDraftByVersionId(
            lectureEvalSurvey.templateId,
            Math.trunc(versionId)
          )
          if (record?.draft != null) return record.draft
        }
        return buildLectureEvalFormDraft(lectureEvalSurvey.templateId)
      }
      void loadDraft()
        .catch(() => buildLectureEvalFormDraft(lectureEvalSurvey.templateId))
        .then(draft => {
          if (!cancelled) {
            lectureEvalDraftRef.current = lectureEvalDraftRef.current ?? draft
            setLectureEvalFormDraft(prev => prev ?? draft)
          }
        })
      return () => {
        cancelled = true
      }
    }
  }, [lectureEvalSurvey, lectureResponsesRemote])

  function resolveBindingIds(templateCode: string): {
    templateId?: number
    templateVersionId?: number
  } {
    const cached = getFormTemplateVersionCacheEntry(templateCode)
    if (cached) {
      return {
        templateId: cached.templateId,
        templateVersionId: cached.templateVersionId ?? cached.latestVersionId,
      }
    }
    const numeric = Number(templateCode)
    if (Number.isFinite(numeric) && numeric > 0) {
      return { templateId: Math.trunc(numeric) }
    }
    return {}
  }

  function buildFormBindingPayload(
    kind: CreateModalKind,
    ids: { templateId: number; templateVersionId?: number } & SurveySubmissionPeriod,
    audience?: GeneralSatisfactionAudienceKey | null
  ): SatisfactionFormBindingRequest {
    const formType =
      kind === 'satisfaction'
        ? 'SATISFACTION'
        : kind === 'lecture'
          ? 'LECTURE_EVALUATION'
          : 'SURVEY'
    const targetRole =
      kind === 'satisfaction'
        ? resolveSatisfactionFormBindingTargetRole(program, audience)
        : kind === 'lecture'
          ? 'ADMIN'
          : undefined
    const submissionPeriod: SurveySubmissionPeriod =
      kind === 'survey'
        ? ensureSurveyCreateSubmissionPeriod(ids)
        : kind === 'satisfaction'
          ? {}
          : ids
    return {
      formType,
      templateId: ids.templateId,
      templateVersionId: ids.templateVersionId,
      ...(submissionPeriod.submissionStartAt != null
        ? { submissionStartAt: submissionPeriod.submissionStartAt }
        : {}),
      ...(submissionPeriod.submissionEndAt != null
        ? { submissionEndAt: submissionPeriod.submissionEndAt }
        : {}),
      targetRole,
      ...(audience === 'volunteer_h1'
        ? { targetScope: 'TERM', targetScopeId: 1 }
        : audience === 'volunteer_h2'
          ? { targetScope: 'TERM', targetScopeId: 2 }
          : {}),
      active: true,
      required: false,
      duplicatePolicy: kind === 'satisfaction' ? 'ONE_SUBMITTED_PER_CONTEXT' : undefined,
    }
  }

  const openTemplatePreview = useCallback(
    (
      survey: Pick<RegisteredSurvey, 'id' | 'templateId' | 'title' | 'bindingId'>,
      options?: {
        allowEdit?: boolean
        lecture?: boolean
        displayTitle?: string
        overwriteTitle?: boolean
        displayPeriod?: SatisfactionFormEditPeriod | null
        lockWritingPeriodInput?: boolean
        paragraphBodyOptions?: TemplateWritingUserPreviewSession['paragraphBodyOptions']
      }
    ) => {
      const allowEdit = options?.allowEdit === true
      const editTarget = allowEdit
        ? buildProgramSurveyFormEditTarget(String(program.id), survey)
        : null
      const catalogRow = findWritingTemplateRowByDefinitionId(survey.templateId)
      const onCatalogEditForm =
        allowEdit && editTarget == null && catalogRow != null
          ? () => {
              closeWritingUserPreview()
              setTemplateEditId(survey.templateId)
            }
          : undefined
      void buildPreviewSession({
        templateId: survey.templateId,
        title: options?.displayTitle ?? survey.title,
        versionId: survey.id,
        lecture: options?.lecture,
        overwriteTitle: options?.overwriteTitle,
        displayPeriod: options?.displayPeriod,
        onEditForm: onCatalogEditForm,
        paragraphBodyOptions: options?.paragraphBodyOptions,
      })
        .then(session => {
          if (session == null) {
            void showAlert({
              title: '양식 보기',
              content: '설문 양식을 불러오지 못했습니다. 다시 시도해 주세요.',
            })
            return
          }
          requestPreviewHistoryPush()
          openWritingUserPreview(
            editTarget != null
              ? {
                  ...session,
                  onEditForm: () => {
                    closeWritingUserPreview()
                    setProgramFormEdit({
                      target: editTarget,
                      initialDraft: session.draft,
                      displayPeriod: options?.displayPeriod,
                      lockWritingPeriodInput: options?.lockWritingPeriodInput,
                    })
                  },
                }
              : session
          )
        })
        .catch(error => {
          handleError(error, { context: 'generalSurveyManagement.preview' })
          void showAlert({
            title: '양식 보기',
            content: getGeneralProgramApiErrorMessage(
              error,
              '설문 양식을 불러오지 못했습니다. 다시 시도해 주세요.'
            ),
          })
        })
    },
    [
      closeWritingUserPreview,
      openWritingUserPreview,
      program.id,
      requestPreviewHistoryPush,
      showAlert,
    ]
  )

  const showShareCopyToast = useCallback(
    (lines: { line1: string; line2: string } = GENERAL_SURVEY_POLL_SHARE_TOAST_COPY) => {
      setShareToastLines(lines)
      setShareToastOpen(true)
      if (shareToastTimerRef.current != null) {
        window.clearTimeout(shareToastTimerRef.current)
      }
      shareToastTimerRef.current = window.setTimeout(() => {
        setShareToastOpen(false)
        shareToastTimerRef.current = null
      }, 4000)
    },
    []
  )

  const openCreateModal = useCallback(
    (kind: CreateModalKind, satisfactionAudience?: GeneralSatisfactionAudienceKey) => {
      setSubmitting(false)
      setCreateFieldError(null)
      if (kind === 'satisfaction' && satisfactionAudience != null) {
        setPendingSatisfactionAudience(satisfactionAudience)
        setSatisfactionRunMode(SATISFACTION_RUN_MODE_PER_SCHEDULE)
        setSatisfactionWindowDays(DEFAULT_SATISFACTION_WINDOW_DAYS)
        setSelectedTemplateId(
          pickRegisteredSurveyTemplateId(
            GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE[satisfactionAudience],
            remoteSurveyRows,
            '만족도'
          )
        )
      } else if (kind === 'lecture') {
        setPendingSatisfactionAudience(null)
        setSelectedTemplateId(
          pickRegisteredSurveyTemplateId(LECTURE_EVAL_TEMPLATE_ID, remoteSurveyRows, '강의평가')
        )
      } else {
        setPendingSatisfactionAudience(null)
        setSelectedTemplateId(null)
        setSelectedSurveyScheduleValue(null)
      }
      setCreateModalKind(kind)
    },
    [remoteSurveyRows]
  )

  useEffect(() => {
    if (createModalKind == null || remoteSurveyRows.length === 0) return
    setSelectedTemplateId(prev => {
      if (prev != null && remoteSurveyRows.some(row => row.id === prev)) return prev
      if (createModalKind === 'lecture') {
        return pickRegisteredSurveyTemplateId(
          LECTURE_EVAL_TEMPLATE_ID,
          remoteSurveyRows,
          '강의평가'
        )
      }
      if (createModalKind === 'satisfaction' && pendingSatisfactionAudience != null) {
        return pickRegisteredSurveyTemplateId(
          GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE[pendingSatisfactionAudience],
          remoteSurveyRows,
          '만족도'
        )
      }
      return prev
    })
  }, [createModalKind, pendingSatisfactionAudience, remoteSurveyRows])

  const closeCreateModal = useCallback(() => {
    if (submitting) return
    setCreateModalKind(null)
    setCreateFieldError(null)
  }, [submitting])

  const submitCreateModal = useCallback(async () => {
    if (createModalKind == null || selectedTemplateId == null || selectedTemplateId === '') return
    if (createModalKind === 'survey' && showSurveyPollScheduleSelectField) {
      if (
        selectedSurveyScheduleValue == null ||
        selectedSurveyScheduleValue === '' ||
        !surveyScheduleOptionsQuery.hasSessionSchedules
      ) {
        return
      }
    }
    if (
      createModalKind === 'satisfaction' &&
      satisfactionRunMode === SATISFACTION_RUN_MODE_PER_SCHEDULE
    ) {
      if (satisfactionScheduleOptionsQuery.isLoading) {
        return
      }
      if (satisfactionUnboundScheduleValues.length === 0) {
        void showAlert({
          title: '등록 실패',
          content:
            satisfactionScheduleOptionsQuery.options.length === 0
              ? '확정된 교육 일정이 없습니다. 프로그램 일정을 먼저 등록한 뒤 다시 시도해 주세요.'
              : '이미 만족도조사가 등록된 일정입니다.',
        })
        return
      }
    }
    if (!surveyTemplateOptions.some(option => option.value === selectedTemplateId)) {
      void showAlert({
        title: '등록 불가',
        content:
          createModalKind === 'satisfaction'
            ? '만족도조사 양식만 선택할 수 있습니다. 템플릿을 다시 선택해 주세요.'
            : createModalKind === 'lecture'
              ? '강의평가 양식만 선택할 수 있습니다. 템플릿을 다시 선택해 주세요.'
              : '설문조사 양식만 선택할 수 있습니다. 템플릿을 다시 선택해 주세요.',
      })
      return
    }
    setSubmitting(true)
    setCreateFieldError(null)
    let surveyBindingTargetScope: string | undefined
    try {
      void findWritingTemplateRowByDefinitionId(selectedTemplateId)

      if (surveysRemote) {
        const resolved = await resolvePublishedSurveyBinding(selectedTemplateId)
        if (!resolved.ok) {
          void showAlert({
            title: '등록 실패',
            content: surveyBindingResolutionAlert(resolved.reason),
          })
          return
        }
        const payload = buildFormBindingPayload(
          createModalKind,
          resolved,
          pendingSatisfactionAudience
        )
        if (createModalKind === 'lecture') {
          const lectureTarget = await resolveLectureEvalBindingTargetForCreate(String(program.id))
          payload.targetScope = lectureTarget.targetScope
          if (lectureTarget.targetScopeId != null) {
            payload.targetScopeId = lectureTarget.targetScopeId
          } else {
            delete payload.targetScopeId
          }
        }
        if (createModalKind === 'survey') {
          if (showSurveyPollScheduleSelectField) {
            try {
              Object.assign(payload, resolveSurveyPollBindingTarget(selectedSurveyScheduleValue!))
            } catch {
              void showAlert({
                title: '등록 실패',
                content: '설문 대상 일정을 다시 선택해 주세요.',
              })
              return
            }
          } else {
            const surveyTarget =
              await resolveSurveyPollBindingTargetWhenScheduleFieldHidden(program)
            if (surveyTarget == null) {
              void showAlert({
                title: '등록 실패',
                content:
                  '설문조사는 교육 일정(회차)에 연결해야 합니다. 프로그램 일정을 먼저 등록한 뒤 다시 시도해 주세요.',
              })
              return
            }
            if (
              isSurveyPollBindingTargetScheduleAlreadyRegistered(surveyTarget, classifiedBindings)
            ) {
              void showAlert({
                title: '등록 실패',
                content: SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE,
              })
              return
            }
            payload.targetScope = surveyTarget.targetScope
            if (surveyTarget.targetScopeId != null) {
              payload.targetScopeId = surveyTarget.targetScopeId
            }
          }
          surveyBindingTargetScope = payload.targetScope ?? undefined
        }
        const satisfactionPayloads: SatisfactionFormBindingRequest[] = []
        if (createModalKind === 'satisfaction') {
          const writeFields = buildSatisfactionBindingWriteFields({
            runMode: satisfactionRunMode,
            windowDays: satisfactionWindowDays,
            startImmediately: false,
            startAtLocked: false,
          })
          Object.assign(payload, writeFields)
          if (satisfactionRunMode === SATISFACTION_RUN_MODE_ONCE_AT_END) {
            payload.targetScope = 'PROGRAM'
            delete payload.targetScopeId
            const lastSlot = pickLastSurveyPollEducationSlot(
              satisfactionScheduleOptionsQuery.schedules
            )
            const period = resolveSatisfactionCreateSubmissionPeriod(
              lastSlot,
              satisfactionWindowDays
            )
            if (period != null) Object.assign(payload, period)
            satisfactionPayloads.push(payload)
          } else {
            for (const scheduleValue of satisfactionUnboundScheduleValues) {
              try {
                const target = resolveSurveyPollBindingTarget(scheduleValue)
                const schedule = findSatisfactionScheduleById(
                  satisfactionScheduleOptionsQuery.schedules,
                  target.targetScopeId
                )
                const period = resolveSatisfactionCreateSubmissionPeriod(
                  schedule,
                  satisfactionWindowDays
                )
                if (period == null) {
                  void showAlert({
                    title: '등록 실패',
                    content:
                      '일정 종료 시각을 확인할 수 없습니다. 프로그램 일정을 확인한 뒤 다시 시도해 주세요.',
                  })
                  return
                }
                satisfactionPayloads.push({
                  ...payload,
                  ...writeFields,
                  ...target,
                  ...period,
                })
              } catch {
                void showAlert({
                  title: '등록 실패',
                  content: '만족도조사 대상 일정을 다시 선택해 주세요.',
                })
                return
              }
            }
          }
        }
        let result: Awaited<ReturnType<typeof createBinding>> | null = null
        if (createModalKind === 'satisfaction') {
          for (const item of satisfactionPayloads) {
            result = await createBinding(item as ProgramFormBindingRequest)
            if (!result.ok) break
          }
        } else {
          result = await createBinding(payload)
        }
        if (!result?.ok) {
          await invalidateSurveyCaches()
          if (result?.field === 'targetRole') {
            setCreateFieldError({ field: result.field, message: result.message })
            return
          }
          void showAlert({ title: '등록 실패', content: result?.message ?? '등록에 실패했습니다.' })
          return
        }
        if (
          (createModalKind === 'survey' || createModalKind === 'satisfaction') &&
          result.binding != null
        ) {
          const lastSatisfactionPayload =
            createModalKind === 'satisfaction' ? satisfactionPayloads.at(-1) : undefined
          const editLoad = await loadProgramSurveyFormEditAfterBinding(
            String(program.id),
            {
              ...result.binding,
              formType: result.binding.formType ?? payload.formType,
              targetScope:
                result.binding.targetScope ?? lastSatisfactionPayload?.targetScope,
              targetScopeId:
                result.binding.targetScopeId ?? lastSatisfactionPayload?.targetScopeId,
            },
            selectedTemplateId,
            {
              schedules:
                createModalKind === 'satisfaction'
                  ? satisfactionScheduleOptionsQuery.schedules
                  : surveyScheduleOptionsQuery.schedules,
              windowDays:
                createModalKind === 'satisfaction' ? satisfactionWindowDays : undefined,
              targetScope:
                result.binding.targetScope ?? lastSatisfactionPayload?.targetScope,
              targetScopeId:
                result.binding.targetScopeId ?? lastSatisfactionPayload?.targetScopeId,
            }
          )
          setCreateModalKind(null)
          setSelectedSurveyScheduleValue(null)
          if (editLoad.ok) {
            setProgramFormEdit(editLoad.edit)
          } else {
            void showAlert({ title: '양식 편집', content: editLoad.message })
          }
          return
        }
        setCreateModalKind(null)
        return
      }

      notifyProgramApiUnavailable('general-survey-create-binding', '설문 관리 · 설문 등록')
      setCreateModalKind(null)
    } catch (error) {
      handleError(error, { context: 'generalSurveyManagement.createSurvey' })
      void showAlert({
        title: '등록 실패',
        content:
          createModalKind === 'survey'
            ? getProgramFormBindingErrorMessage(
                error,
                '설문 등록에 실패했습니다. 다시 시도해 주세요.',
                { formType: 'SURVEY', targetScope: surveyBindingTargetScope }
              )
            : getGeneralProgramApiErrorMessage(
                error,
                '설문 등록에 실패했습니다. 다시 시도해 주세요.'
              ),
      })
    } finally {
      setSubmitting(false)
    }
  }, [
    classifiedBindings,
    createBinding,
    createModalKind,
    invalidateSurveyCaches,
    individualProgram,
    pendingSatisfactionAudience,
    program.id,
    program.totalParticipants,
    registeredSurveys.length,
    selectedSurveyScheduleValue,
    selectedTemplateId,
    satisfactionRunMode,
    satisfactionScheduleOptionsQuery.isLoading,
    satisfactionScheduleOptionsQuery.options.length,
    satisfactionScheduleOptionsQuery.schedules,
    surveyScheduleOptionsQuery.schedules,
    satisfactionUnboundScheduleValues,
    satisfactionWindowDays,
    showAlert,
    showSurveyPollScheduleSelectField,
    surveyScheduleOptionsQuery.hasSessionSchedules,
    surveysRemote,
    surveyTemplateOptions,
  ])

  const confirmDelete = useCallback(async () => {
    if (deleteConfirmWord.trim() !== '삭제') return
    if (deleteModalKind === 'survey' && activeRegisteredSurvey != null) {
      if (activeRegisteredSurvey.status !== 'before_start') return
      if (surveysRemote) {
        const bindingId = activeRegisteredSurvey.bindingId
        if (!bindingId) {
          void showAlert({
            title: '삭제 실패',
            content: '삭제할 설문 바인딩 ID를 찾지 못했습니다.',
          })
          return
        }
        const result = await deleteBinding(bindingId)
        if (!result.ok) {
          void showAlert({ title: '삭제 실패', content: result.message })
          return
        }
        setDeleteModalKind(null)
        setDeleteConfirmWord('')
        return
      }
      setRegisteredSurveys(prev => {
        const next = prev.filter(item => item.id !== activeRegisteredSurvey.id)
        setActiveRegisteredSurveyId(current =>
          current === activeRegisteredSurvey.id ? (next[0]?.id ?? null) : current
        )
        return next
      })
    }
    if (
      deleteModalKind === 'satisfaction' &&
      activeSatisfactionSurvey != null &&
      activeSatisfactionAudience != null
    ) {
      if (activeSatisfactionSurvey.status !== 'before_start') return
      if (surveysRemote) {
        const bindingId = activeSatisfactionSurvey.bindingId
        if (!bindingId) {
          void showAlert({
            title: '삭제 실패',
            content: '삭제할 만족도조사 바인딩 ID를 찾지 못했습니다.',
          })
          return
        }
        const result = await deleteBinding(bindingId)
        if (!result.ok) {
          void showAlert({ title: '삭제 실패', content: result.message })
          return
        }
        setDeleteModalKind(null)
        setDeleteConfirmWord('')
        return
      }
      setSatisfactionSurveysByAudience(prev => {
        const next = { ...prev }
        delete next[activeSatisfactionAudience]
        return next
      })
    }
    setDeleteModalKind(null)
    setDeleteConfirmWord('')
  }, [
    activeRegisteredSurvey,
    activeSatisfactionAudience,
    activeSatisfactionSurvey,
    deleteBinding,
    deleteConfirmWord,
    deleteModalKind,
    showAlert,
    surveysRemote,
  ])

  const shareRegisteredSurveyUrl = useCallback(
    async (survey: RegisteredSurvey) => {
      const bindingId = survey.bindingId?.trim()
      if (!bindingId) {
        notifyProgramApiUnavailable('general-survey-share-link', '설문 관리 · 설문 공유')
        return
      }
      try {
        const response = await createGeneralProgramSurveyShareLink(program.id, bindingId)
        const platformOrigin = getPlatformPublicOrigin()
        const url = response ? resolveSurveyShareClipboardUrl(response, platformOrigin) : null
        if (!url) {
          void showAlert({
            title: '공유',
            content: describeSurveyShareClipboardFailure(response, platformOrigin, 'survey'),
          })
          return
        }
        void copyText(url)
        void queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.surveys(program.id),
          exact: true,
        })
        showShareCopyToast()
      } catch (error) {
        handleError(error, { context: 'generalSurveyShareLink' })
        showAlert({
          title: '공유',
          content: getGeneralProgramApiErrorMessage(
            error,
            '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
          ),
        })
      }
    },
    [copyText, program.id, queryClient, showAlert, showShareCopyToast]
  )

  const shareSatisfactionSurveyUrl = useCallback(
    async (audience: GeneralSatisfactionAudienceKey) => {
      const survey =
        audience === activeSatisfactionAudience
          ? activeSatisfactionSurvey
          : satisfactionSurveysByAudience[audience]
      const bindingId = survey?.bindingId?.trim()
      if (!bindingId) {
        notifyProgramApiUnavailable(
          'general-satisfaction-share-link',
          '설문 관리 · 만족도조사 공유'
        )
        return
      }
      try {
        const response = await createGeneralProgramSurveyShareLink(program.id, bindingId)
        const platformOrigin = getPlatformPublicOrigin()
        const url = response ? resolveSurveyShareClipboardUrl(response, platformOrigin) : null
        if (!url) {
          void showAlert({
            title: '공유',
            content: describeSurveyShareClipboardFailure(response, platformOrigin, 'satisfaction'),
          })
          return
        }
        void copyText(url)
        void queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.surveys(program.id),
          exact: true,
        })
        showShareCopyToast(GENERAL_SATISFACTION_SHARE_TOAST_COPY)
      } catch (error) {
        handleError(error, { context: 'generalSatisfactionShareLink' })
        showAlert({
          title: '공유',
          content: getGeneralProgramApiErrorMessage(
            error,
            '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
          ),
        })
      }
    },
    [
      activeSatisfactionAudience,
      activeSatisfactionSurvey,
      copyText,
      program.id,
      queryClient,
      satisfactionSurveysByAudience,
      showAlert,
      showShareCopyToast,
    ]
  )

  const handleDownloadSatisfactionResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (activeSatisfactionSurvey == null) return
      setDownloadingSatisfactionResults(true)
      try {
        if (format === 'pdf') {
          const root = satisfactionResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(
            root,
            buildSatisfactionResultsPdfFileName(program.title, activeSatisfactionSurvey.title)
          )
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: activeSatisfactionSurvey.title,
            templateId: activeSatisfactionSurvey.templateId,
            templateVersionId: toRemoteSurveyVersionId(activeSatisfactionSurvey, surveysRemote),
            responseCount: activeSatisfactionSurvey.responseCount,
            participantTotal: resolveSurveyResultsParticipantTotal(
              activeSatisfactionSurvey,
              program.totalParticipants
            ),
            responses: satisfactionResponses,
            questionSummaries: satisfactionQuestionSummaries,
          })
        }
        setSatisfactionDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'generalSatisfactionResultsDownload' })
        showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingSatisfactionResults(false)
      }
    },
    [
      activeSatisfactionSurvey,
      program.title,
      program.totalParticipants,
      satisfactionQuestionSummaries,
      satisfactionResponses,
      showAlert,
      surveysRemote,
    ]
  )

  const handleDownloadPollResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (activeRegisteredSurvey == null) return
      setDownloadingPollResults(true)
      try {
        if (format === 'pdf') {
          const root = pollResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(
            root,
            buildSurveyPollResultsPdfFileName(program.title, activeRegisteredSurvey.title)
          )
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: activeRegisteredSurvey.title,
            templateId: activeRegisteredSurvey.templateId,
            templateVersionId: toRemoteSurveyVersionId(activeRegisteredSurvey, surveysRemote),
            responseCount: activeRegisteredSurvey.responseCount,
            participantTotal: resolveSurveyResultsParticipantTotal(
              activeRegisteredSurvey,
              program.totalParticipants
            ),
            responses: pollResponses,
            questionSummaries: pollQuestionSummaries,
          })
        }
        setPollDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'generalSurveyPollResultsDownload' })
        showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingPollResults(false)
      }
    },
    [
      activeRegisteredSurvey,
      pollQuestionSummaries,
      pollResponses,
      program.title,
      program.totalParticipants,
      showAlert,
      surveysRemote,
    ]
  )

  const handleLectureEvalDraftChange = useCallback((draft: WritingFormDraft) => {
    lectureEvalDraftRef.current = draft
  }, [])

  const handleLectureEvalSubmit = useCallback(async () => {
    const lectureEvalFormDraft = lectureEvalDraftRef.current
    if (lectureEvalSurvey == null || lectureEvalFormDraft == null) return
    const validation = validateLectureEvalFormDraft(lectureEvalFormDraft)
    if (!validation.valid) {
      void showAlert({ title: '입력 확인', content: validation.message })
      return
    }

    setLectureEvalFormDraft(lectureEvalFormDraft)
    const pollResponse = draftToLectureEvalPollResponse(lectureEvalFormDraft)
    const surveyVersionId = Number(lectureEvalSurvey.id)
    const templateVersionId =
      Number.isFinite(surveyVersionId) && surveyVersionId > 0
        ? Math.trunc(surveyVersionId)
        : resolveBindingIds(lectureEvalSurvey.templateId).templateVersionId
    const programIdNum = Number(program.id)

    if (surveysRemote) {
      if (templateVersionId == null || !Number.isFinite(programIdNum)) {
        void showAlert({
          title: '제출 실패',
          content: '강의평가 양식 버전을 찾지 못했습니다. 다시 시도해 주세요.',
        })
        return
      }
      const existingResponseId = parseLectureEvalFormResponseId(lectureEvalResponses)
      const lectureBinding = classifiedBindings?.find(
        item => item.kind === 'lecture_evaluation'
      )?.binding
      const lectureSurveyDto =
        rawSurveys?.find(
          row =>
            String(row.templateVersionId ?? '') === lectureEvalSurvey.id ||
            String(row.templateId ?? '') === lectureEvalSurvey.templateId
        ) ??
        rawSurveys?.find(
          row => row.bindingId != null && String(row.bindingId) === lectureEvalSurvey.bindingId
        )
      const submitContext = resolveLectureEvalSubmitContext({
        binding: lectureBinding,
        surveyDto: lectureSurveyDto,
      })
      try {
        if (existingResponseId != null) {
          await updateGeneralProgramFormResponse(existingResponseId, {
            answers: pollResponse.answers,
          })
        } else {
          const created = await submitGeneralProgramFormResponse({
            templateVersionId,
            programId: programIdNum,
            contextType: submitContext.contextType,
            contextId: submitContext.contextId,
            answers: pollResponse.answers,
          })
          if (created?.formResponseId != null) {
            pollResponse.respondentId = String(created.formResponseId)
          }
        }
        await queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.surveyResponses(
            String(program.id),
            String(templateVersionId)
          ),
        })
      } catch (error) {
        handleError(error, { context: 'generalLectureEvalSubmit' })
        void showAlert({
          title: existingResponseId != null ? '수정 실패' : '제출 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            existingResponseId != null
              ? '강의평가 수정 중 오류가 발생했습니다. 다시 시도해 주세요.'
              : '강의평가 제출 중 오류가 발생했습니다. 다시 시도해 주세요.'
          ),
        })
        return
      }
    }

    setLectureEvalSubmitted(true)
    setLectureEvalResponses(prev => {
      const existingId = parseLectureEvalFormResponseId(prev)
      return [
        {
          ...pollResponse,
          respondentId: existingId != null ? String(existingId) : pollResponse.respondentId,
        },
      ]
    })
    setLectureEvalSurvey(prev => {
      if (prev == null) return prev
      const nextStatus =
        !surveysRemote && LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT && prev.status === 'in_progress'
          ? 'finished'
          : prev.status
      return {
        ...prev,
        status: nextStatus,
        responseCount: Math.max(prev.responseCount, 1),
        participantTotal: resolveSurveyResultsParticipantTotal(prev, program.totalParticipants),
      }
    })
  }, [
    classifiedBindings,
    lectureEvalResponses,
    lectureEvalSurvey,
    program.id,
    program.totalParticipants,
    queryClient,
    rawSurveys,
    showAlert,
    surveysRemote,
  ])

  const handleLectureEvalTabChange = useCallback(
    (tab: LectureEvalTabKey) => {
      const resultsReady =
        lectureEvalSurvey != null &&
        (isLectureEvalResultsTabAccessible(lectureEvalSurvey) ||
          lectureEvalSubmitted ||
          lectureEvalResponses.length > 0)
      if (tab === 'results' && !resultsReady) {
        setLectureEvalIncompleteModalOpen(true)
        return
      }
      setActiveLectureEvalTab(tab)
    },
    [lectureEvalResponses.length, lectureEvalSubmitted, lectureEvalSurvey]
  )

  const handleLectureEvalPreview = useCallback(() => {
    if (lectureEvalSurvey == null) return
    openTemplatePreview(lectureEvalSurvey, {
      allowEdit: canEditRegisteredSurveyForm(lectureEvalSurvey),
      lecture: true,
      paragraphBodyOptions: LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
    })
  }, [lectureEvalSurvey, openTemplatePreview])

  const handleDownloadLectureEvalResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (lectureEvalSurvey == null) return
      setDownloadingLectureEvalResults(true)
      try {
        if (format === 'pdf') {
          const root = lectureEvalResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(root, buildLectureEvalResultsPdfFileName(program.title))
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: lectureEvalSurvey.title,
            templateId: lectureEvalSurvey.templateId,
            responseCount: lectureEvalSurvey.responseCount,
            participantTotal: resolveSurveyResultsParticipantTotal(
              lectureEvalSurvey,
              program.totalParticipants
            ),
            responses: lectureEvalResponses,
          })
        }
        setLectureEvalDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'generalLectureEvalResultsDownload' })
        showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingLectureEvalResults(false)
      }
    },
    [lectureEvalResponses, lectureEvalSurvey, program.title, program.totalParticipants, showAlert]
  )

  const renderPoll = () => {
    if (surveysRemote && surveysLoading && registeredSurveys.length === 0) {
      return (
        <div className="survey-management-loading" role="status">
          <Spin size="large" />
        </div>
      )
    }
    if (registeredSurveys.length === 0) {
      return (
        <SurveyEmptyState
          title={GENERAL_SURVEY_POLL_EMPTY_COPY.title}
          description={GENERAL_SURVEY_POLL_EMPTY_COPY.description}
          registerButtonLabel={GENERAL_SURVEY_POLL_EMPTY_COPY.registerButton}
          onRegisterClick={() => openCreateModal('survey')}
        />
      )
    }
    return (
      <div className="program-detail-fullpage-modal__info-tab survey-management-registered">
        <CmsTextTabs
          className="survey-management-registered__tabs"
          variant="list"
          activeKey={activeRegisteredSurveyId ?? ''}
          onChange={setActiveRegisteredSurveyId}
          items={registeredSurveys.map(item => ({ key: item.id, label: item.title }))}
          trailing={
            activeRegisteredSurvey != null ? (
              <SurveyRegisteredActions
                survey={{
                  ...activeRegisteredSurvey,
                  participantTotal: resolveSurveyResultsParticipantTotal(
                    activeRegisteredSurvey,
                    program.totalParticipants
                  ),
                }}
                labels={GENERAL_SURVEY_POLL_ACTION_LABELS}
                onShareClick={() => shareRegisteredSurveyUrl(activeRegisteredSurvey)}
                onAddClick={() => openCreateModal('survey')}
                onOpenTemplatePreview={() =>
                  openTemplatePreview(activeRegisteredSurvey, {
                    allowEdit: canEditRegisteredSurveyForm(activeRegisteredSurvey),
                  })
                }
                onDownloadClick={() => setPollDownloadModalOpen(true)}
              />
            ) : null
          }
        />
        {pollResponsesRemote && pollResponsesLoading && activeRegisteredSurvey != null ? (
          <div className="survey-management-loading" role="status">
            <Spin size="large" />
          </div>
        ) : activeRegisteredSurvey != null &&
          (activeRegisteredSurvey.status === 'before_start' ||
            (activeRegisteredSurvey.status === 'finished' &&
              activeRegisteredSurvey.responseCount === 0)) ? (
          <SurveyNoResponseState
            title={GENERAL_SURVEY_POLL_NO_RESPONSE_COPY.title}
            description={GENERAL_SURVEY_POLL_NO_RESPONSE_COPY.description}
            deleteButtonLabel={GENERAL_SURVEY_POLL_NO_RESPONSE_COPY.deleteButton}
            previewButtonLabel={GENERAL_SURVEY_POLL_NO_RESPONSE_COPY.previewButton}
            canDelete={activeRegisteredSurvey.status === 'before_start'}
            embedded
            onDeleteClick={() => {
              if (activeRegisteredSurvey.status !== 'before_start') return
              setDeleteConfirmWord('')
              setDeleteModalKind('survey')
            }}
            onOpenTemplatePreview={() =>
              openTemplatePreview(activeRegisteredSurvey, {
                allowEdit: canEditRegisteredSurveyForm(activeRegisteredSurvey),
              })
            }
          />
        ) : activeRegisteredSurvey != null ? (
          <div ref={pollResultsExportRef}>
            <SurveyPollResultsView
              templateId={activeRegisteredSurvey.templateId}
              templateVersionId={toRemoteSurveyVersionId(activeRegisteredSurvey, surveysRemote)}
              responseCount={activeRegisteredSurvey.responseCount}
              participantTotal={resolveSurveyResultsParticipantTotal(
                activeRegisteredSurvey,
                program.totalParticipants
              )}
              responses={pollResponses}
              questionSummaries={pollQuestionSummaries}
              pdfTitle="설문조사 결과"
            />
          </div>
        ) : null}
      </div>
    )
  }

  const renderEmptyMain = () => (
    <div className="program-detail-fullpage-modal__info-tab survey-management__empty-main">
      <div className="survey-management__empty-main-card">
        <p className="survey-management__empty-main-title">
          {GENERAL_SURVEY_MENU_EMPTY_COPY.title}
        </p>
        <p className="survey-management__empty-main-description">
          {GENERAL_SURVEY_MENU_EMPTY_COPY.description}
        </p>
      </div>
    </div>
  )

  const createTitle =
    createModalKind === 'satisfaction' && pendingSatisfactionAudience != null
      ? `신규 만족도조사 등록`
      : createModalKind === 'lecture'
        ? GENERAL_LECTURE_EVAL_REGISTER_MODAL_COPY.title
        : '신규 설문조사 등록'
  const createDescription =
    createModalKind === 'satisfaction' && pendingSatisfactionAudience != null
      ? getGeneralSatisfactionCreateDescription()
      : createModalKind === 'lecture'
        ? GENERAL_LECTURE_EVAL_REGISTER_MODAL_COPY.description
        : ''

  const renderSatisfactionView = () => {
    if (surveysRemote && surveysLoading) {
      return (
        <div className="survey-management-loading" role="status">
          <Spin size="large" />
        </div>
      )
    }
    return (
      <SatisfactionSurveyView
        surveysByAudience={satisfactionSurveysForView}
        activeAudience={activeSatisfactionAudience}
        audienceTabs={satisfactionAudienceTabs}
        className={
          isInstitutionTeacherOnlySatisfaction ? 'company-school-satisfaction-survey' : undefined
        }
        emptyCopy={getGeneralSatisfactionEmptyCopy(activeSatisfactionAudience, program)}
        noResponseCopy={GENERAL_SATISFACTION_NO_RESPONSE_COPY}
        actionLabels={getGeneralSatisfactionActionLabels()}
        showAudienceTabs={showSatisfactionAudienceTabs}
        showShareButton
        onAudienceChange={setActiveSatisfactionAudience}
        onRegisterClick={() => openCreateModal('satisfaction', activeSatisfactionAudience)}
        onShareClick={() => shareSatisfactionSurveyUrl(activeSatisfactionAudience)}
        onDeleteClick={() => {
          const survey = activeSatisfactionSurvey
          if (survey?.status !== 'before_start') return
          setDeleteConfirmWord('')
          setDeleteModalKind('satisfaction')
        }}
        onOpenTemplatePreview={() => {
          const survey = activeSatisfactionSurvey
          if (survey != null) {
            openTemplatePreview(survey, {
              allowEdit: canEditRegisteredSurveyForm(survey),
              displayTitle: resolveSatisfactionSurveyDisplayTitle(
                survey,
                satisfactionScheduleOptionsQuery.schedules
              ),
              overwriteTitle: true,
              displayPeriod: resolveSatisfactionPreviewPeriod(
                survey,
                satisfactionScheduleOptionsQuery.schedules
              ),
              lockWritingPeriodInput: isSatisfactionPerScheduleWritingPeriodLocked({
                formType: 'SATISFACTION',
                runMode: survey.satisfactionRunMode,
                targetScope: survey.targetScope,
              }),
            })
          }
        }}
        onDownloadClick={() => setSatisfactionDownloadModalOpen(true)}
        downloadEnabled={satisfactionDownloadEnabled}
        scheduleTabs={satisfactionScheduleTabs}
        activeScheduleKey={resolvedSatisfactionScheduleTab ?? undefined}
        onScheduleTabChange={setSatisfactionScheduleTab}
        resultsExportRef={satisfactionResultsExportRef}
        resultsResponses={satisfactionResponses}
        resultsTemplateVersionId={toRemoteSurveyVersionId(activeSatisfactionSurvey, surveysRemote)}
        resultsQuestionSummaries={satisfactionQuestionSummaries}
      />
    )
  }

  return (
    <>
      {surveyMenuEmpty || activeTab === 'main' ? renderEmptyMain() : null}
      {!surveyMenuEmpty && activeTab === 'survey' ? renderPoll() : null}
      {!surveyMenuEmpty &&
      isGeneralSatisfactionSurveyNavTab(activeTab) &&
      satisfactionAudienceTabs.length > 0
        ? renderSatisfactionView()
        : null}
      {!surveyMenuEmpty && activeTab === 'lecture_evaluation' ? (
        surveysRemote && surveysLoading ? (
          <div className="survey-management-loading" role="status">
            <Spin size="large" />
          </div>
        ) : (
          <LectureEvalSurveyView
            survey={lectureEvalSurveyForView}
            submitted={lectureEvalSubmitted}
            formDraft={lectureEvalFormDraft}
            pollResponses={lectureEvalResponses}
            activeTab={activeLectureEvalTab}
            downloadingResults={downloadingLectureEvalResults}
            resultsExportRef={lectureEvalResultsExportRef}
            emptyCopy={GENERAL_LECTURE_EVAL_EMPTY_COPY}
            preStartCopy={GENERAL_LECTURE_EVAL_PRE_START_COPY}
            submittedCopy={GENERAL_LECTURE_EVAL_SUBMITTED_COPY}
            actionLabels={GENERAL_LECTURE_EVAL_ACTION_LABELS}
            onTabChange={handleLectureEvalTabChange}
            onRegisterClick={() => openCreateModal('lecture')}
            onOpenTemplatePreview={handleLectureEvalPreview}
            onFormDraftChange={handleLectureEvalDraftChange}
            onSubmitClick={handleLectureEvalSubmit}
            onEditResponseClick={() => {
              if (
                lectureEvalSurvey != null &&
                canEditLectureEvalResponse(lectureEvalSurvey, lectureEvalFormDraft)
              ) {
                setLectureEvalSubmitted(false)
              }
            }}
            onDownloadResultsClick={() => setLectureEvalDownloadModalOpen(true)}
            resultsAccessible={
              lectureEvalSurvey != null &&
              (isLectureEvalResultsTabAccessible(lectureEvalSurvey) ||
                lectureEvalSubmitted ||
                lectureEvalResponses.length > 0)
            }
          />
        )
      ) : null}

      <SurveyPollRegisterModal
        open={surveyPollCreateModalOpen}
        submitting={submitting}
        templateOptions={surveyTemplateOptions}
        templateValue={selectedTemplateId}
        onTemplateChange={setSelectedTemplateId}
        scheduleOptions={surveyScheduleOptionsQuery.options}
        scheduleValue={selectedSurveyScheduleValue}
        onScheduleChange={setSelectedSurveyScheduleValue}
        schedulesLoading={surveyScheduleOptionsQuery.isLoading}
        hasSessionSchedules={surveyScheduleOptionsQuery.hasSessionSchedules}
        showScheduleField={showSurveyPollScheduleSelectField}
        onCancel={closeCreateModal}
        onSubmit={() => {
          void submitCreateModal()
        }}
      />

      <SatisfactionRegisterModal
        open={satisfactionCreateModalOpen}
        submitting={submitting}
        title={createTitle}
        description={createDescription}
        templateOptions={surveyTemplateOptions}
        templateValue={selectedTemplateId}
        onTemplateChange={setSelectedTemplateId}
        audienceOptions={
          isTrainedTeacherSatisfaction
            ? [
                { label: '교사', value: 'teacher' },
                { label: '학생', value: 'student' },
              ]
            : undefined
        }
        audienceValue={pendingSatisfactionAudience}
        onAudienceChange={value => {
          if (value === 'teacher' || value === 'student') {
            setPendingSatisfactionAudience(value)
          }
        }}
        audienceError={createFieldError?.field === 'targetRole' ? createFieldError.message : null}
        runMode={satisfactionRunMode}
        onRunModeChange={setSatisfactionRunMode}
        windowDays={satisfactionWindowDays}
        onWindowDaysChange={setSatisfactionWindowDays}
        schedulesLoading={satisfactionScheduleOptionsQuery.isLoading}
        hasSessionSchedules={satisfactionUnboundScheduleValues.length > 0}
        lastEducationScheduleLabel={lastSatisfactionEducationScheduleLabel}
        onCancel={closeCreateModal}
        onSubmit={() => {
          void submitCreateModal()
        }}
      />

      <ContentModal
        open={createModalKind === 'lecture'}
        onCancel={closeCreateModal}
        title={createTitle}
        width={600}
        className="survey-management-create-modal"
        description={createDescription}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={closeCreateModal}
              disabled={submitting}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              onClick={() => {
                void submitCreateModal()
              }}
              disabled={selectedTemplateId == null || selectedTemplateId === ''}
              loading={submitting}
            >
              신규 등록
            </CmsButton>
          </>
        }
      >
        <div className="survey-management-create-modal__fields">
          <CmsSelect
            width="100%"
            withAllOption={false}
            allowClear={false}
            label="템플릿 유형"
            required
            placeholder="사용할 설문 양식을 선택해 주세요"
            options={surveyTemplateOptions}
            value={selectedTemplateId ?? undefined}
            onChange={value => setSelectedTemplateId(value ?? null)}
          />
        </div>
      </ContentModal>

      <ContentModal
        open={deleteModalKind != null}
        onCancel={() => {
          setDeleteModalKind(null)
          setDeleteConfirmWord('')
        }}
        title={
          deleteModalKind === 'satisfaction' && activeSatisfactionAudience != null
            ? getGeneralSatisfactionDeleteModalTitle(activeSatisfactionAudience)
            : '설문조사 삭제 안내'
        }
        width={600}
        modalStyles={{ content: { minHeight: 310 } }}
        className="survey-management-delete-modal"
        description={`**[${
          deleteModalKind === 'satisfaction' && activeSatisfactionAudience != null
            ? `${getGeneralSatisfactionAudienceLabel(activeSatisfactionAudience)} 만족도조사`
            : (activeRegisteredSurvey?.title ?? '설문조사')
        }]** ${
          deleteModalKind === 'satisfaction' && activeSatisfactionAudience != null
            ? `${getGeneralSatisfactionAudienceLabel(activeSatisfactionAudience)} 만족도조사`
            : '설문조사'
        }를 삭제하시겠습니까?\n삭제 시 해당 양식의 내용은 모두 삭제됩니다.\n삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?`}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={() => {
                setDeleteModalKind(null)
                setDeleteConfirmWord('')
              }}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              disabled={deleteConfirmWord.trim() !== '삭제' || bindingMutating}
              loading={bindingMutating}
              onClick={() => {
                void confirmDelete()
              }}
            >
              삭제
            </CmsButton>
          </>
        }
      >
        <div className="survey-management-delete-modal__field">
          <CmsInput
            width="100%"
            placeholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요."
            value={deleteConfirmWord}
            onChange={e => setDeleteConfirmWord(e.target.value)}
          />
        </div>
      </ContentModal>

      <ContentModal
        open={lectureEvalIncompleteModalOpen}
        onCancel={() => setLectureEvalIncompleteModalOpen(false)}
        title={GENERAL_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.title}
        width={600}
        className="ujat-lecture-eval-incomplete-modal"
        description={GENERAL_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.description}
        footer={
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={() => setLectureEvalIncompleteModalOpen(false)}
          >
            {GENERAL_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.confirmButton}
          </CmsButton>
        }
      >
        <span className="ujat-lecture-eval-incomplete-modal__body-placeholder" />
      </ContentModal>

      {templateEditId != null ? (
        <SurveyTemplateEditModal
          open={templateEditId != null}
          templateId={templateEditId}
          onClose={() => setTemplateEditId(null)}
        />
      ) : null}

      {programFormEdit != null ? (
        <SurveyTemplateEditModal
          open
          templateId={String(programFormEdit.target.sourceVersionId)}
          programEdit={programFormEdit}
          onBindingsStale={() => void invalidateSurveyCaches()}
          onClose={() => setProgramFormEdit(null)}
          onSaved={newVersionId => {
            const sourceId = String(programFormEdit.target.sourceVersionId)
            setActiveRegisteredSurveyId(prev => (prev === sourceId ? newVersionId : prev))
            setProgramFormEdit(null)
            void invalidateSurveyCaches()
          }}
        />
      ) : null}

      <SurveyResultsDownloadModal
        open={pollDownloadModalOpen}
        downloading={downloadingPollResults}
        onCancel={() => setPollDownloadModalOpen(false)}
        onDownload={handleDownloadPollResults}
      />

      <SurveyResultsDownloadModal
        open={satisfactionDownloadModalOpen}
        downloading={downloadingSatisfactionResults}
        copy={GENERAL_SATISFACTION_DOWNLOAD_MODAL_COPY}
        onCancel={() => setSatisfactionDownloadModalOpen(false)}
        onDownload={handleDownloadSatisfactionResults}
      />

      <SurveyResultsDownloadModal
        open={lectureEvalDownloadModalOpen}
        downloading={downloadingLectureEvalResults}
        copy={GENERAL_LECTURE_EVAL_DOWNLOAD_MODAL_COPY}
        onCancel={() => setLectureEvalDownloadModalOpen(false)}
        onDownload={handleDownloadLectureEvalResults}
      />

      <SurveyShareCopyToast
        open={shareToastOpen}
        line1={shareToastLines.line1}
        line2={shareToastLines.line2}
      />
    </>
  )
}
