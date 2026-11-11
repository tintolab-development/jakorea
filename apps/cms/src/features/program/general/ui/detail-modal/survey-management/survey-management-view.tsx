import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Spin } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
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
  canDownloadLectureEvalResults,
  canEditLectureEvalResponse,
  draftToLectureEvalPollResponse,
  findOwnLectureEvalResponse,
  isLectureEvalResultsTabAccessible,
  LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT,
  parseOwnLectureEvalFormResponseId,
  LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
  LECTURE_EVAL_TEMPLATE_ID,
  validateLectureEvalFormDraft,
  type LectureEvalTabKey,
} from '@/features/program/shared/lib/survey-management/lecture-eval-survey'
import {
  buildLectureEvalResultsPdfFileName,
  exportLectureEvalResultsPdf,
} from '@/features/program/shared/lib/survey-management/export-lecture-eval-results-pdf'
import { isLectureEvalStaleStateError } from '@/features/program/shared/lib/survey-management/lecture-eval-api-error'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { Program } from '@/types/domain'
import { generateFilename } from '@/shared/utils/file-download'
import {
  GENERAL_LECTURE_EVAL_ACTION_LABELS,
  GENERAL_LECTURE_EVAL_CLOSED_COPY,
  GENERAL_LECTURE_EVAL_DOWNLOAD_MODAL_COPY,
  GENERAL_LECTURE_EVAL_EMPTY_COPY,
  GENERAL_LECTURE_EVAL_INCOMPLETE_MODAL_COPY,
  GENERAL_LECTURE_EVAL_PRE_START_COPY,
  GENERAL_LECTURE_EVAL_REGISTER_MODAL_COPY,
  GENERAL_LECTURE_EVAL_RESPONSE_DELETE_COPY,
  GENERAL_LECTURE_EVAL_SUBMIT_COMPLETE_COPY,
  GENERAL_LECTURE_EVAL_SUBMITTED_COPY,
  GENERAL_SATISFACTION_DOWNLOAD_MODAL_COPY,
  GENERAL_SATISFACTION_NO_RESPONSE_COPY,
  GENERAL_SATISFACTION_SHARE_ALL_SCHEDULES_COPY,
  GENERAL_SATISFACTION_SHARE_EMPTY_COPY,
  GENERAL_SATISFACTION_SHARE_TOAST_COPY,
  GENERAL_SURVEY_POLL_ACTION_LABELS,
  GENERAL_SURVEY_FORM_HEADER_TITLE,
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
import { loadProgramSurveyFormEditForCreate } from '@/features/program/shared/lib/survey-management/load-program-survey-form-edit'
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
  useGeneralProgramSurveyResultsForBindings,
  useGeneralProgramSurveys,
  useGeneralProgramSurveySummary,
} from '@/features/program/general/hooks/use-general-program-posts-surveys'
import {
  createGeneralProgramSurveyShareLink,
  submitGeneralProgramFormResponse,
  updateGeneralProgramFormResponse,
  deleteGeneralProgramFormResponse,
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
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'
import { isReadOnlyAdminRoleCode } from '@/shared/lib/admin-role-policy'

type CreateModalKind = 'survey' | 'satisfaction' | 'lecture'
type DeleteModalKind = 'survey' | 'satisfaction' | 'lecture'

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
      headerTitle: GENERAL_SURVEY_FORM_HEADER_TITLE,
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
    headerTitle: GENERAL_SURVEY_FORM_HEADER_TITLE,
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
  return generateFilename(`${safeProgram}_${safeSurvey}_설문조사결과`, 'pdf')
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

/** 만족도조사 일정 선택 — 「전체 일정 (결과 합산)」 (시안 1141:267627 · 16057:317204) */
const SATISFACTION_ALL_SCHEDULES_TAB_KEY = '__all_schedules__'
const SATISFACTION_ALL_SCHEDULES_TAB_LABEL = '전체 일정 (결과 합산)'

/**
 * 일정별 바인딩을 합산한 표시용 설문. 응답 수는 일정별 합, 상태는 하나라도 진행 중이면 진행 중.
 * `bindingId`를 비워 공유·삭제 등 단건 바인딩 작업에 쓰이지 않게 한다.
 */
function buildSatisfactionAllSchedulesSurvey(
  bindings: readonly RegisteredSurvey[]
): RegisteredSurvey | null {
  const first = bindings[0]
  if (first == null) return null
  const statuses = bindings.map(survey => survey.status)
  const status = statuses.every(value => value === 'before_start')
    ? 'before_start'
    : statuses.every(value => value === 'finished')
      ? 'finished'
      : 'in_progress'
  const expectedCounts = bindings.map(survey => survey.expectedRespondentCount)
  const expectedRespondentCount = expectedCounts.every(
    (value): value is number => typeof value === 'number'
  )
    ? expectedCounts.reduce((sum, value) => sum + value, 0)
    : null
  return {
    ...first,
    bindingId: undefined,
    status,
    responseCount: bindings.reduce((sum, survey) => sum + survey.responseCount, 0),
    participantTotal: bindings.reduce((sum, survey) => sum + survey.participantTotal, 0),
    expectedRespondentCount,
    targetScopeId: null,
    targetScopeLabel: null,
  }
}

function buildSatisfactionResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '만족도조사'
  return generateFilename(`${safeProgram}_${safeSurvey}_만족도조사결과`, 'pdf')
}

export function GeneralSurveyManagementView({
  program,
  activeTab,
}: GeneralSurveyManagementViewProps) {
  const initialMock = useMemo(() => buildGeneralSurveyEmptyState(program), [program])
  /** 강의평가 「내 응답」 판정 — 응답 `submittedByAdminId`와 비교 */
  const adminAccountId = useAuthStore(state => state.user?.adminAccountId ?? null)
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
  // 템플릿 목록은 신규 등록 모달의 양식 선택에만 쓴다. 조회 전용(Program Viewer)은 등록 불가이고
  // 목록 API(FORM_TEMPLATE_READ)가 403이라, 진입 시 접근 불가 팝업이 뜨지 않도록 부르지 않는다.
  const sessionRoleCode = useSessionAdminRoleCode()
  const { sections: writingFormSections, isRemote: writingFormsRemote } = useWritingFormSections({
    enabled: !isReadOnlyAdminRoleCode(sessionRoleCode),
  })
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
  /** 설문 진행 기간 — 시안 13609:155708: 기본 미선택. 종료 시 1회 진행은 기간 선택이 없어 기본 일수로 마감을 잡는다 */
  const [satisfactionWindowDays, setSatisfactionWindowDays] =
    useState<SatisfactionWindowDays | null>(null)
  const effectiveSatisfactionWindowDays =
    satisfactionWindowDays ?? DEFAULT_SATISFACTION_WINDOW_DAYS
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
  const [lectureEvalResponseDeleteOpen, setLectureEvalResponseDeleteOpen] = useState(false)
  const [deletingLectureEvalResponse, setDeletingLectureEvalResponse] = useState(false)
  /** 답변 삭제 후 빈 양식을 다시 만들기 위한 키 */
  const [lectureEvalDraftReloadKey, setLectureEvalDraftReloadKey] = useState(0)
  const [downloadingLectureEvalResults, setDownloadingLectureEvalResults] = useState(false)
  const [templateEditId, setTemplateEditId] = useState<string | null>(null)
  const [programFormEdit, setProgramFormEdit] = useState<ProgramSurveyFormEdit | null>(null)
  const [lectureEvalDownloadModalOpen, setLectureEvalDownloadModalOpen] = useState(false)
  const [pollDownloadModalOpen, setPollDownloadModalOpen] = useState(false)
  const [satisfactionDownloadModalOpen, setSatisfactionDownloadModalOpen] = useState(false)
  const [downloadingPollResults, setDownloadingPollResults] = useState(false)
  const [downloadingSatisfactionResults, setDownloadingSatisfactionResults] = useState(false)
  const lectureEvalResultsExportRef = useRef<HTMLDivElement>(null)
  const pollResultsExportRef = useRef<HTMLDivElement>(null)
  const satisfactionResultsExportRef = useRef<HTMLDivElement>(null)
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

  const audienceSatisfactionBindingsForQuery = useMemo(
    (): RegisteredSurvey[] =>
      satisfactionBindingsByAudience[activeSatisfactionAudience] ??
      (satisfactionSurveysByAudience[activeSatisfactionAudience]
        ? [satisfactionSurveysByAudience[activeSatisfactionAudience]!]
        : []),
    [activeSatisfactionAudience, satisfactionBindingsByAudience, satisfactionSurveysByAudience]
  )
  /** 일정별 진행 — 일정 선택에 「전체 일정 (결과 합산)」을 두고 기본값으로 쓴다 (시안 1141:267627) */
  const satisfactionPerScheduleMode = audienceSatisfactionBindingsForQuery.some(
    survey =>
      survey.satisfactionRunMode === SATISFACTION_RUN_MODE_PER_SCHEDULE ||
      survey.targetScope === 'SCHEDULE'
  )
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
    return satisfactionPerScheduleMode
      ? [
          {
            key: SATISFACTION_ALL_SCHEDULES_TAB_KEY,
            label: SATISFACTION_ALL_SCHEDULES_TAB_LABEL,
          },
          ...items,
        ]
      : items
  })()
  const resolvedSatisfactionScheduleTabForQuery =
    satisfactionScheduleTab != null &&
    satisfactionScheduleTabsForQuery.some(tab => tab.key === satisfactionScheduleTab)
      ? satisfactionScheduleTab
      : (satisfactionScheduleTabsForQuery[0]?.key ?? null)
  const satisfactionAllSchedulesSelected =
    satisfactionPerScheduleMode &&
    resolvedSatisfactionScheduleTabForQuery === SATISFACTION_ALL_SCHEDULES_TAB_KEY
  const selectedSatisfactionBindingForQuery = satisfactionAllSchedulesSelected
    ? buildSatisfactionAllSchedulesSurvey(audienceSatisfactionBindingsForQuery)
    : (audienceSatisfactionBindingsForQuery.find(
        survey => (survey.bindingId ?? survey.id) === resolvedSatisfactionScheduleTabForQuery
      ) ??
      audienceSatisfactionBindingsForQuery[0] ??
      null)
  const selectedSatisfactionScheduleLabel = satisfactionAllSchedulesSelected
    ? null
    : (satisfactionScheduleTabsForQuery.find(
        tab => tab.key === resolvedSatisfactionScheduleTabForQuery
      )?.label ?? null)
  const satisfactionAllSchedulesTargets = useMemo(
    () =>
      satisfactionAllSchedulesSelected
        ? audienceSatisfactionBindingsForQuery.flatMap(survey =>
            survey.bindingId != null && survey.bindingId !== ''
              ? [{ templateVersionId: survey.id, bindingId: survey.bindingId }]
              : []
          )
        : [],
    [audienceSatisfactionBindingsForQuery, satisfactionAllSchedulesSelected]
  )
  const activeSatisfactionSurveyId = satisfactionAllSchedulesSelected
    ? undefined
    : selectedSatisfactionBindingForQuery?.id
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
  const satisfactionBindingId =
    isGeneralSatisfactionSurveyNavTab(activeTab) && !satisfactionAllSchedulesSelected
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
  const { questionSummaries: satisfactionSingleQuestionSummaries } =
    useGeneralProgramSurveySummary(program.id, satisfactionResponseVersionId, satisfactionBindingId)
  const {
    pollResponses: remoteSatisfactionAllResponses,
    questionSummaries: satisfactionAllQuestionSummaries,
    isRemoteDataSource: satisfactionAllResponsesRemote,
  } = useGeneralProgramSurveyResultsForBindings(program.id, satisfactionAllSchedulesTargets, {
    detailPolicy: 'public-text-only',
    enabled: isGeneralSatisfactionSurveyNavTab(activeTab),
  })
  const satisfactionQuestionSummaries = satisfactionAllSchedulesSelected
    ? satisfactionAllQuestionSummaries
    : satisfactionSingleQuestionSummaries

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
      // 활성 대상은 선택한 일정(또는 전체 일정 합산) 설문으로 상태·응답 수를 보여준다
      const viewSurvey =
        key === activeSatisfactionAudience && activeSatisfactionSurvey != null
          ? activeSatisfactionSurvey
          : survey
      if (viewSurvey == null) continue
      next[key] = {
        ...viewSurvey,
        participantTotal: resolveSurveyResultsParticipantTotal(viewSurvey, programTotal),
      }
    }
    return next
  }, [
    activeSatisfactionAudience,
    activeSatisfactionSurvey,
    isTrainedTeacherSatisfaction,
    program.totalParticipants,
    satisfactionSurveysByAudience,
  ])
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
    if (satisfactionAllSchedulesSelected) {
      return satisfactionAllResponsesRemote ? (remoteSatisfactionAllResponses ?? []) : []
    }
    if (satisfactionResponsesRemote) return remoteSatisfactionResponses ?? []
    return []
  }, [
    remoteSatisfactionAllResponses,
    remoteSatisfactionResponses,
    satisfactionAllResponsesRemote,
    satisfactionAllSchedulesSelected,
    satisfactionResponsesRemote,
  ])

  useEffect(() => {
    if (!pollResponsesRemote || !activeRegisteredSurveyId) return
    const count = remotePollSummaryCount || (remotePollResponses?.length ?? 0)
    setRegisteredSurveys(prev =>
      prev.map(survey =>
        survey.id === activeRegisteredSurveyId ? { ...survey, responseCount: count } : survey
      )
    )
  }, [activeRegisteredSurveyId, pollResponsesRemote, remotePollResponses, remotePollSummaryCount])

  // 종료 전 목록은 서버가 본인 응답만 준다. 종료 후에는 전체라서 submittedByAdminId로 내 응답을 고른다.
  useEffect(() => {
    if (!lectureResponsesRemote || remoteLectureResponses == null) return
    setLectureEvalResponses(remoteLectureResponses)
    setLectureEvalSubmitted(findOwnLectureEvalResponse(remoteLectureResponses, adminAccountId) != null)
  }, [adminAccountId, lectureResponsesRemote, remoteLectureResponses])

  const ownLectureEvalResponse = useMemo(
    () => findOwnLectureEvalResponse(lectureEvalResponses, adminAccountId),
    [adminAccountId, lectureEvalResponses]
  )

  // 양식이 응답보다 늦게 로드돼도 내 답변을 다시 채운다.
  const lectureEvalDraftReady = lectureEvalFormDraft != null
  useEffect(() => {
    if (!lectureEvalSubmitted) return
    const answers = ownLectureEvalResponse?.answers
    if (answers == null || Object.keys(answers).length === 0) return
    const current = lectureEvalDraftRef.current
    if (current == null) return
    const next = applyLectureEvalAnswersToDraft(current, answers)
    lectureEvalDraftRef.current = next
    setLectureEvalFormDraft(next)
  }, [lectureEvalDraftReady, lectureEvalSubmitted, ownLectureEvalResponse])

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
        // 등록된 강의평가는 바인딩 version으로 연다(템플릿 목록 미조회 — 뷰어 403 방지).
        return buildLectureEvalFormDraft(lectureEvalSurvey.templateId, versionId)
      }
      void loadDraft()
        .catch(() => buildLectureEvalFormDraft(lectureEvalSurvey.templateId, versionId))
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
  }, [lectureEvalDraftReloadKey, lectureEvalSurvey, lectureResponsesRemote])

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

  /** 공유 링크 복사 완료 — 「설문조사 공유」·「만족도조사 공유」 안내 팝업 (시안 9767:119096 · 16057:321961) */
  const showShareCopiedAlert = useCallback(
    (
      copy: { title: string; line1: string; line2: string } = GENERAL_SURVEY_POLL_SHARE_TOAST_COPY
    ) => {
      void showAlert({ title: copy.title, content: `${copy.line1}\n${copy.line2}` })
    },
    [showAlert]
  )

  const openCreateModal = useCallback(
    (kind: CreateModalKind, satisfactionAudience?: GeneralSatisfactionAudienceKey) => {
      setSubmitting(false)
      setCreateFieldError(null)
      if (kind === 'satisfaction' && satisfactionAudience != null) {
        setPendingSatisfactionAudience(satisfactionAudience)
        setSatisfactionRunMode(SATISFACTION_RUN_MODE_PER_SCHEDULE)
        setSatisfactionWindowDays(null)
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
      if (satisfactionScheduleOptionsQuery.isLoading || satisfactionWindowDays == null) {
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
            windowDays: effectiveSatisfactionWindowDays,
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
              effectiveSatisfactionWindowDays
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
                  effectiveSatisfactionWindowDays
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
        // 등록 버튼에서는 바인딩을 만들지 않는다. 에디터 「저장」 때 양식 게시 후 바인딩을 만든다.
        const createPayloads: ProgramFormBindingRequest[] =
          createModalKind === 'satisfaction'
            ? (satisfactionPayloads as ProgramFormBindingRequest[])
            : [payload as ProgramFormBindingRequest]
        const lastCreatePayload = createPayloads.at(-1)
        const editLoad = await loadProgramSurveyFormEditForCreate(
          String(program.id),
          createPayloads,
          selectedTemplateId,
          createBinding,
          {
            title: surveyTemplateOptions.find(option => option.value === selectedTemplateId)?.label,
            schedules:
              createModalKind === 'satisfaction'
                ? satisfactionScheduleOptionsQuery.schedules
                : surveyScheduleOptionsQuery.schedules,
            windowDays:
              createModalKind === 'satisfaction' ? effectiveSatisfactionWindowDays : undefined,
            targetScope: lastCreatePayload?.targetScope ?? undefined,
            targetScopeId: lastCreatePayload?.targetScopeId ?? undefined,
          }
        )
        if (!editLoad.ok) {
          void showAlert({ title: '양식 편집', content: editLoad.message })
          return
        }
        setCreateModalKind(null)
        setSelectedSurveyScheduleValue(null)
        setProgramFormEdit(editLoad.edit)
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
    effectiveSatisfactionWindowDays,
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
    if (deleteModalKind === 'lecture' && lectureEvalSurvey != null) {
      if (lectureEvalSurvey.status !== 'before_start') return
      if (surveysRemote) {
        const bindingId = lectureEvalSurvey.bindingId
        if (!bindingId) {
          void showAlert({
            title: '삭제 실패',
            content: '삭제할 강의평가 바인딩 ID를 찾지 못했습니다.',
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
      setLectureEvalSurvey(null)
    }
    setDeleteModalKind(null)
    setDeleteConfirmWord('')
  }, [
    activeRegisteredSurvey,
    activeSatisfactionAudience,
    activeSatisfactionSurvey,
    deleteBinding,
    lectureEvalSurvey,
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
        showShareCopiedAlert()
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
    [copyText, program.id, queryClient, showAlert, showShareCopiedAlert]
  )

  const shareSatisfactionSurveyUrl = useCallback(
    async (audience: GeneralSatisfactionAudienceKey) => {
      const survey =
        audience === activeSatisfactionAudience
          ? activeSatisfactionSurvey
          : satisfactionSurveysByAudience[audience]
      if (survey == null) {
        void showAlert(GENERAL_SATISFACTION_SHARE_EMPTY_COPY)
        return
      }
      if (audience === activeSatisfactionAudience && satisfactionAllSchedulesSelected) {
        void showAlert(GENERAL_SATISFACTION_SHARE_ALL_SCHEDULES_COPY)
        return
      }
      const bindingId = survey.bindingId?.trim()
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
        showShareCopiedAlert(GENERAL_SATISFACTION_SHARE_TOAST_COPY)
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
      satisfactionAllSchedulesSelected,
      satisfactionSurveysByAudience,
      showAlert,
      showShareCopiedAlert,
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
      const existingResponseId = parseOwnLectureEvalFormResponseId(
        lectureEvalResponses,
        adminAccountId
      )
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
            String(templateVersionId),
            lectureEvalSurvey.bindingId ?? ''
          ),
        })
      } catch (error) {
        handleError(error, { context: 'generalLectureEvalSubmit' })
        // 소유권·작성 기간 거절 — 진행 상태·내 응답을 서버 기준으로 다시 맞춘다.
        if (isLectureEvalStaleStateError(error)) void invalidateSurveyCaches()
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
    void showAlert(GENERAL_LECTURE_EVAL_SUBMIT_COMPLETE_COPY)
    setLectureEvalResponses(prev => {
      const own = findOwnLectureEvalResponse(prev, adminAccountId)
      const existingId = parseOwnLectureEvalFormResponseId(prev, adminAccountId)
      return [
        ...prev.filter(row => row !== own),
        {
          ...pollResponse,
          respondentId: existingId != null ? String(existingId) : pollResponse.respondentId,
          ...(adminAccountId != null ? { submittedByAdminId: adminAccountId } : {}),
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
    adminAccountId,
    classifiedBindings,
    invalidateSurveyCaches,
    lectureEvalResponses,
    lectureEvalSurvey,
    program.id,
    program.totalParticipants,
    queryClient,
    rawSurveys,
    showAlert,
    surveysRemote,
  ])

  const handleConfirmLectureEvalResponseDelete = useCallback(async () => {
    if (lectureEvalSurvey == null || !canEditLectureEvalResponse(lectureEvalSurvey)) return
    const responseId = parseOwnLectureEvalFormResponseId(lectureEvalResponses, adminAccountId)
    if (surveysRemote && responseId == null) {
      setLectureEvalResponseDeleteOpen(false)
      void showAlert({
        title: '삭제 실패',
        content: '삭제할 강의평가 답변을 찾지 못했습니다. 화면을 다시 불러온 뒤 확인해 주세요.',
      })
      return
    }
    setDeletingLectureEvalResponse(true)
    try {
      if (surveysRemote && responseId != null) {
        await deleteGeneralProgramFormResponse(responseId)
      }
    } catch (error) {
      handleError(error, { context: 'generalLectureEvalResponseDelete' })
      if (isLectureEvalStaleStateError(error)) void invalidateSurveyCaches()
      setLectureEvalResponseDeleteOpen(false)
      void showAlert({
        title: '삭제 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '강의평가 답변 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.'
        ),
      })
      return
    } finally {
      setDeletingLectureEvalResponse(false)
    }
    // 삭제된 응답(CANCELLED)은 목록·제출 수에서 빠진다 — 미제출로 돌리고 빈 양식을 다시 연다.
    setLectureEvalResponses(prev => {
      const own = findOwnLectureEvalResponse(prev, adminAccountId)
      return prev.filter(row => row !== own)
    })
    setLectureEvalSubmitted(false)
    lectureEvalDraftRef.current = null
    setLectureEvalFormDraft(null)
    setLectureEvalDraftReloadKey(key => key + 1)
    setLectureEvalResponseDeleteOpen(false)
    if (surveysRemote) void invalidateSurveyCaches()
    void showAlert({
      title: GENERAL_LECTURE_EVAL_RESPONSE_DELETE_COPY.completeTitle,
      content: GENERAL_LECTURE_EVAL_RESPONSE_DELETE_COPY.completeContent,
    })
  }, [
    adminAccountId,
    invalidateSurveyCaches,
    lectureEvalResponses,
    lectureEvalSurvey,
    showAlert,
    surveysRemote,
  ])

  const handleLectureEvalTabChange = useCallback(
    (tab: LectureEvalTabKey) => {
      // 결과는 강의평가 종료(FINISHED) 후에만 — 제출 여부와 무관
      const resultsReady =
        lectureEvalSurvey != null && isLectureEvalResultsTabAccessible(lectureEvalSurvey)
      if (tab === 'results' && !resultsReady) {
        setLectureEvalIncompleteModalOpen(true)
        return
      }
      setActiveLectureEvalTab(tab)
    },
    [lectureEvalSurvey]
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
      if (lectureEvalSurvey == null || !canDownloadLectureEvalResults(lectureEvalSurvey)) return
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
              statusBadge={activeRegisteredSurvey.status}
            />
          </div>
        ) : null}
      </div>
    )
  }

  /** 설문 진행 항목 없음 — 안내 팝업과 같은 문구 (시안 9767:118918) */
  const renderEmptyMain = () => (
    <SurveyEmptyState
      title={GENERAL_SURVEY_MENU_EMPTY_COPY.title}
      description={GENERAL_SURVEY_MENU_EMPTY_COPY.description}
      registerButtonLabel=""
      showRegisterButton={false}
      onRegisterClick={() => {}}
    />
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
              // 전체 일정(합산)은 바인딩이 여럿이라 양식 수정 대상이 하나로 정해지지 않는다
              allowEdit: !satisfactionAllSchedulesSelected && canEditRegisteredSurveyForm(survey),
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
        showShareButtonWhenEmpty
        showResultsStatusBadge
        {...(satisfactionPerScheduleMode
          ? {
              // 일정별 진행: 상단에 다운로드·양식 보기·공유를 항상 두고, 진행 전 본문은 삭제만 (시안 16057:315805)
              headerActionsStatus: 'in_progress' as const,
              showNoResponsePreviewButton: false,
              showNoResponseDeleteButton: !satisfactionAllSchedulesSelected,
              noResponseTitle:
                selectedSatisfactionScheduleLabel != null
                  ? `${selectedSatisfactionScheduleLabel}의 만족도조사는 아직 진행 전입니다.`
                  : '전체 일정의 만족도조사는 아직 진행 전입니다.',
            }
          : {})}
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
            resultsTemplateVersionId={toRemoteSurveyVersionId(lectureEvalSurveyForView, surveysRemote)}
            submitted={lectureEvalSubmitted}
            formDraft={lectureEvalFormDraft}
            pollResponses={lectureEvalResponses}
            activeTab={activeLectureEvalTab}
            downloadingResults={downloadingLectureEvalResults}
            resultsExportRef={lectureEvalResultsExportRef}
            emptyCopy={GENERAL_LECTURE_EVAL_EMPTY_COPY}
            preStartCopy={GENERAL_LECTURE_EVAL_PRE_START_COPY}
            closedCopy={GENERAL_LECTURE_EVAL_CLOSED_COPY}
            submittedCopy={GENERAL_LECTURE_EVAL_SUBMITTED_COPY}
            actionLabels={GENERAL_LECTURE_EVAL_ACTION_LABELS}
            onTabChange={handleLectureEvalTabChange}
            onRegisterClick={() => openCreateModal('lecture')}
            onDeleteClick={() => {
              if (lectureEvalSurvey?.status !== 'before_start') return
              setDeleteConfirmWord('')
              setDeleteModalKind('lecture')
            }}
            onOpenTemplatePreview={handleLectureEvalPreview}
            onFormDraftChange={handleLectureEvalDraftChange}
            onSubmitClick={handleLectureEvalSubmit}
            onEditResponseClick={() => {
              if (lectureEvalSurvey != null && canEditLectureEvalResponse(lectureEvalSurvey)) {
                setLectureEvalSubmitted(false)
              }
            }}
            onDeleteResponseClick={() => setLectureEvalResponseDeleteOpen(true)}
            onDownloadResultsClick={() => setLectureEvalDownloadModalOpen(true)}
          />
        )
      ) : null}

      <ConfirmModal
        open={lectureEvalResponseDeleteOpen}
        title={GENERAL_LECTURE_EVAL_RESPONSE_DELETE_COPY.title}
        content={GENERAL_LECTURE_EVAL_RESPONSE_DELETE_COPY.content}
        confirmText={GENERAL_LECTURE_EVAL_RESPONSE_DELETE_COPY.confirmButton}
        cancelText={GENERAL_LECTURE_EVAL_RESPONSE_DELETE_COPY.cancelButton}
        danger
        confirmLoading={deletingLectureEvalResponse}
        onCancel={() => {
          if (!deletingLectureEvalResponse) setLectureEvalResponseDeleteOpen(false)
        }}
        onConfirm={() => {
          void handleConfirmLectureEvalResponseDelete()
        }}
      />

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
            : deleteModalKind === 'lecture'
              ? '강의평가 삭제 안내'
              : '설문조사 삭제 안내'
        }
        width={600}
        modalStyles={{ content: { minHeight: 310 } }}
        className="survey-management-delete-modal"
        description={`**[${
          deleteModalKind === 'satisfaction' && activeSatisfactionAudience != null
            ? (selectedSatisfactionScheduleLabel ??
              `${getGeneralSatisfactionAudienceLabel(activeSatisfactionAudience)} 만족도조사`)
            : deleteModalKind === 'lecture'
              ? (lectureEvalSurvey?.title ?? '강의평가')
              : (activeRegisteredSurvey?.title ?? '설문조사')
        }]** 설문을 삭제하시겠습니까?\n삭제 시 설문 결과를 포함한 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.`}
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
            placeholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요"
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
          variant="general"
          templateId={templateEditId}
          onClose={() => setTemplateEditId(null)}
        />
      ) : null}

      {programFormEdit != null ? (
        <SurveyTemplateEditModal
          open
          variant="general"
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
        variant="general"
        open={pollDownloadModalOpen}
        downloading={downloadingPollResults}
        onCancel={() => setPollDownloadModalOpen(false)}
        onDownload={handleDownloadPollResults}
      />

      <SurveyResultsDownloadModal
        variant="general"
        open={satisfactionDownloadModalOpen}
        downloading={downloadingSatisfactionResults}
        copy={GENERAL_SATISFACTION_DOWNLOAD_MODAL_COPY}
        onCancel={() => setSatisfactionDownloadModalOpen(false)}
        onDownload={handleDownloadSatisfactionResults}
      />

      <SurveyResultsDownloadModal
        variant="general"
        open={lectureEvalDownloadModalOpen}
        downloading={downloadingLectureEvalResults}
        copy={GENERAL_LECTURE_EVAL_DOWNLOAD_MODAL_COPY}
        onCancel={() => setLectureEvalDownloadModalOpen(false)}
        onDownload={handleDownloadLectureEvalResults}
      />
    </>
  )
}
