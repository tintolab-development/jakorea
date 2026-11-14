/**
 * UJAT 설문 관리 — 설문조사 / 봉사단·학교 만족도 / 강의평가
 * 일반 프로그램과 동일 remote form-binding 계약. LNB 4탭 URL은 유지.
 */

import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Spin } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { ContentModal } from '@/shared/ui/content-modal'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { handleError } from '@/shared/utils/error-handler'
import type { Program } from '@/types/domain'
import {
  findWritingTemplateRowByDefinitionId,
} from '@/features/template/lib/writing-template-create-helpers'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { usePushUserPreviewHistoryWhenOpen } from '@/features/template/hooks/use-push-user-preview-history-when-open'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { useClipboard } from '@/features/template/hooks/use-clipboard'
import {
  defaultSatisfactionAudienceForSurveyTab,
  getSatisfactionAudienceLabel,
  getSatisfactionAudienceTabsForSurveyTab,
  getSatisfactionDeleteModalSubject,
  isUjatSatisfactionSurveyTab,
  resolveUjatSatisfactionBindingTargetRole,
  UJAT_SATISFACTION_TEMPLATE_BY_AUDIENCE,
  type UjatRegisteredSurvey,
  type UjatSatisfactionAudienceKey,
  type UjatSatisfactionSurveyByAudience,
} from '../lib/ujat-satisfaction-survey'
import {
  UJAT_SURVEY_POLL_ACTION_LABELS,
  UJAT_SURVEY_POLL_EMPTY_COPY,
  UJAT_SURVEY_POLL_NO_RESPONSE_COPY,
  UJAT_SURVEY_POLL_DOWNLOAD_MODAL_COPY,
  UJAT_SURVEY_POLL_SHARE_TOAST_COPY,
  UJAT_SATISFACTION_DOWNLOAD_MODAL_COPY,
  UJAT_SATISFACTION_SHARE_TOAST_COPY,
  UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY,
  UJAT_LECTURE_EVAL_DOWNLOAD_MODAL_COPY,
  UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY,
  UJAT_LECTURE_EVAL_RESPONSE_DELETE_COPY,
} from '../lib/ujat-survey-copy'
import type { UjatSurveyPollRawResponse } from '@/features/program/ujat/model/ujat-survey-poll'
import {
  buildLectureEvalFormDraft,
  canEditLectureEvalResponse,
  clearLectureEvalFormAnswers,
  draftToLectureEvalPollResponse,
  draftToLectureEvalSubmitAnswers,
  UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
  UJAT_LECTURE_EVAL_TEMPLATE_ID,
  isLectureEvalResultsTabAccessible,
  validateLectureEvalFormDraft,
  type UjatLectureEvalTabKey,
} from '../lib/ujat-lecture-eval-survey'
import {
  applyLectureEvalAnswersToDraft,
  canDownloadLectureEvalResults,
  findOwnLectureEvalResponse,
  parseOwnLectureEvalFormResponseId,
} from '@/features/program/shared/lib/survey-management/lecture-eval-survey'
import { isLectureEvalStaleStateError } from '@/features/program/shared/lib/survey-management/lecture-eval-api-error'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  buildLectureEvalResultsPdfFileName,
  exportLectureEvalResultsPdf,
} from '../lib/export-lecture-eval-results-pdf'
import { exportSurveyResultsExcel } from '@/features/program/shared/lib/survey-management/export-survey-results-excel'
import {
  SurveyResultsDownloadModal,
  type SurveyResultsDownloadFormat,
} from '@/features/program/shared/ui/survey-management/survey-results-download-modal'
import { getSurveyWritingTemplateSelectOptions } from '../lib/ujat-survey-template-options'
import {
  buildUjatSurveyWritingPreviewSession,
} from '../lib/open-ujat-survey-writing-preview'
import { resolveSatisfactionSurveyDisplayTitle } from '@/features/program/shared/lib/survey-management/satisfaction-survey-display-title'
import {
  findSatisfactionScheduleById,
  resolveSatisfactionCreateSubmissionPeriod,
  resolveSatisfactionPreviewPeriod,
  type SatisfactionFormEditPeriod,
} from '@/features/program/shared/lib/survey-management/satisfaction-form-edit-period'
import { UjatSurveyTemplateEditModal } from './ujat-survey-template-edit-modal'
import {
  SurveyTemplateEditModal,
  type ProgramSurveyFormEdit,
} from '@/features/program/shared/ui/survey-management/survey-template-edit-modal'
import {
  buildProgramSurveyFormEditTarget,
  canEditRegisteredSurveyForm,
} from '@/features/program/shared/lib/survey-management/save-program-survey-form-edit'
import { UjatSatisfactionSurveyView } from './ujat-satisfaction-survey-view'
import { UjatLectureEvalSurveyView } from './ujat-lecture-eval-survey-view'
import { UjatSurveyEmptyState } from './ujat-survey-empty-state'
import { UjatSurveyNoResponseState } from './ujat-survey-no-response-state'
import { UjatSurveyPollResultsView } from './ujat-survey-poll-results-view'
import { UjatSurveyRegisteredActions } from './ujat-survey-registered-actions'
import { SurveyShareCopyToast } from '@/features/program/shared/ui/survey-management/survey-share-copy-toast'
import {
  useGeneralProgramSurveyFormBindingMutations,
  useGeneralProgramSurveyResponses,
  useGeneralProgramSurveys,
  useGeneralProgramSurveySummary,
} from '@/features/program/general/hooks/use-general-program-posts-surveys'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import {
  resolvePublishedSurveyBinding,
  surveyBindingResolutionAlert,
} from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'
import { ensureSurveyCreateSubmissionPeriod } from '@/features/program/shared/lib/survey-management/survey-binding-period'
import { resolveSurveyPollBindingTarget } from '@/features/program/shared/lib/survey-management/resolve-survey-poll-binding-target'
import {
  SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE,
  disableSurveyPollScheduleOptionsWithSurvey,
  isSurveyPollBindingTargetScheduleAlreadyRegistered,
  pickLastSurveyPollEducationSlot,
} from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import { resolveUjatSurveyScheduleFieldFromOptions } from '../lib/ujat-survey-schedule-register'
import { loadProgramSurveyFormEditForCreate } from '@/features/program/shared/lib/survey-management/load-program-survey-form-edit'
import { isSatisfactionPerScheduleWritingPeriodLocked } from '@/features/program/shared/lib/survey-management/satisfaction-binding-contract'
import { useProgramSurveyScheduleOptions } from '@/features/program/shared/hooks/use-program-survey-schedule-options'
import { SurveyPollRegisterModal } from '@/features/program/shared/ui/survey-management/survey-poll-register-modal'
import {
  describeSurveyShareClipboardFailure,
  resolveLectureEvalSubmitContext,
  resolveSurveyResultsParticipantTotal,
  resolveSurveyShareClipboardUrl,
} from '@/features/program/general/api/adapters/program-survey-adapters'
import { getPlatformPublicOrigin } from '@/features/program/general/lib/public-survey-origin'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import {
  createGeneralProgramSurveyShareLink,
  submitGeneralProgramFormResponse,
  updateGeneralProgramFormResponse,
  deleteGeneralProgramFormResponse,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { loadFormTemplateVersionDraftByVersionId } from '@/features/template/api/admin-form-templates-service'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import { resolveUjatProgramDisplayTitle } from '@/features/program/ujat/lib/ujat-program-list-display'
import { toSurveyTemplateVersionId } from '@/features/program/shared/lib/survey-management/survey-template-version-id'


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

const EMPTY_UJAT_REGISTERED_SURVEYS: UjatRegisteredSurvey[] = []

const EMPTY_UJAT_SATISFACTION_SURVEYS: UjatSatisfactionSurveyByAudience = {}

const EMPTY_UJAT_LECTURE_EVAL_SURVEY: UjatRegisteredSurvey | null = null

function buildUjatSatisfactionResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '만족도조사'
  return `${safeProgram}_${safeSurvey}_만족도조사결과.pdf`
}

function buildUjatSurveyPollResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '설문조사'
  return `${safeProgram}_${safeSurvey}_설문조사결과.pdf`
}

export function UjatSurveyManagementView({
  program,
  activeTab,
}: {
  program: Program
  activeTab: string
}) {
  const programId = program.id
  const displayProgram = program
  const queryClient = useQueryClient()
  /** 강의평가 「내 응답」 판정 — 응답 `submittedByAdminId`와 비교 */
  const adminAccountId = useAuthStore(state => state.user?.adminAccountId ?? null)
  const {
    registeredSurveys: remoteRegisteredSurveys,
    classifiedBindings,
    rawSurveys,
    initialLoading: surveysLoading,
    isRemoteDataSource: surveysRemote,
  } = useGeneralProgramSurveys(programId, true)
  const { createBinding, deleteBinding, invalidateSurveyCaches } =
    useGeneralProgramSurveyFormBindingMutations(programId)

  const [surveyCreateModalOpen, setSurveyCreateModalOpen] = useState(false)
  const [selectedSurveyTemplateId, setSelectedSurveyTemplateId] = useState<string | null>(null)
  const [selectedSurveyScheduleValue, setSelectedSurveyScheduleValue] = useState<string | null>(
    null
  )
  const [submittingSurveyTemplate, setSubmittingSurveyTemplate] = useState(false)
  const [surveyDeleteModalOpen, setSurveyDeleteModalOpen] = useState(false)
  const [surveyDeleteConfirmWord, setSurveyDeleteConfirmWord] = useState('')
  const [pollDownloadModalOpen, setPollDownloadModalOpen] = useState(false)
  const [downloadingPollResults, setDownloadingPollResults] = useState(false)
  const pollResultsExportRef = useRef<HTMLDivElement>(null)
  const [registeredSurveys, setRegisteredSurveys] = useState<UjatRegisteredSurvey[]>(
    EMPTY_UJAT_REGISTERED_SURVEYS
  )
  const [activeRegisteredSurveyId, setActiveRegisteredSurveyId] = useState<string | null>(
    EMPTY_UJAT_REGISTERED_SURVEYS[0]?.id ?? null
  )
  const [satisfactionSurveysByAudience, setSatisfactionSurveysByAudience] =
    useState<UjatSatisfactionSurveyByAudience>(EMPTY_UJAT_SATISFACTION_SURVEYS)
  const [activeSatisfactionAudience, setActiveSatisfactionAudience] =
    useState<UjatSatisfactionAudienceKey>('teacher')
  const [satisfactionCreateModalOpen, setSatisfactionCreateModalOpen] = useState(false)
  const [submittingSatisfactionSurvey, setSubmittingSatisfactionSurvey] = useState(false)
  const [satisfactionDeleteModalOpen, setSatisfactionDeleteModalOpen] = useState(false)
  const [satisfactionDeleteConfirmWord, setSatisfactionDeleteConfirmWord] = useState('')
  const [lectureEvalDeleteModalOpen, setLectureEvalDeleteModalOpen] = useState(false)
  const [lectureEvalDeleteConfirmWord, setLectureEvalDeleteConfirmWord] = useState('')
  const [satisfactionDownloadModalOpen, setSatisfactionDownloadModalOpen] = useState(false)
  const [downloadingSatisfactionResults, setDownloadingSatisfactionResults] = useState(false)
  const [shareToastOpen, setShareToastOpen] = useState(false)
  const [shareToastLines, setShareToastLines] = useState<{ line1: string; line2: string }>(
    UJAT_SATISFACTION_SHARE_TOAST_COPY
  )
  const shareToastTimerRef = useRef<number | null>(null)
  const satisfactionResultsExportRef = useRef<HTMLDivElement>(null)
  const [surveyTemplateEditOpen, setSurveyTemplateEditOpen] = useState(false)
  const [surveyTemplateEditId, setSurveyTemplateEditId] = useState<string | null>(null)
  const [programFormEdit, setProgramFormEdit] = useState<ProgramSurveyFormEdit | null>(null)
  const [selectedSatisfactionTemplateId, setSelectedSatisfactionTemplateId] = useState<string | null>(
    null
  )
  const [lectureEvalSurvey, setLectureEvalSurvey] = useState<UjatRegisteredSurvey | null>(
    EMPTY_UJAT_LECTURE_EVAL_SURVEY
  )
  const [lectureEvalSubmitted, setLectureEvalSubmitted] = useState(false)
  const [lectureEvalFormDraft, setLectureEvalFormDraft] = useState<WritingFormDraft | null>(null)
  const lectureEvalDraftRef = useRef<WritingFormDraft | null>(null)
  const [lectureEvalResponses, setLectureEvalResponses] = useState<UjatSurveyPollRawResponse[]>([])
  const [activeLectureEvalTab, setActiveLectureEvalTab] = useState<UjatLectureEvalTabKey>('eval')
  const [lectureEvalCreateModalOpen, setLectureEvalCreateModalOpen] = useState(false)
  const [lectureEvalIncompleteModalOpen, setLectureEvalIncompleteModalOpen] = useState(false)
  const [lectureEvalResponseDeleteOpen, setLectureEvalResponseDeleteOpen] = useState(false)
  const [deletingLectureEvalResponse, setDeletingLectureEvalResponse] = useState(false)
  const [selectedLectureEvalTemplateId, setSelectedLectureEvalTemplateId] = useState<string | null>(
    null
  )
  const [submittingLectureEvalSurvey, setSubmittingLectureEvalSurvey] = useState(false)
  const [downloadingLectureEvalResults, setDownloadingLectureEvalResults] = useState(false)
  const [lectureEvalDownloadModalOpen, setLectureEvalDownloadModalOpen] = useState(false)
  const lectureEvalResultsExportRef = useRef<HTMLDivElement>(null)
  const { openWritingUserPreview, closeWritingUserPreview, isWritingUserPreviewOpen } =
    useTemplateWritingPreview()
  const requestPreviewHistoryPush = usePushUserPreviewHistoryWhenOpen(isWritingUserPreviewOpen)
  const { copyText } = useClipboard()
  const { showAlert } = useCmsAlert()

  const openUjatSurveyTemplatePreview = useCallback(
    (
      survey: { id: string; templateId: string; title: string; bindingId?: string },
      options?: {
        allowEdit?: boolean
        displayTitle?: string
        overwriteTitle?: boolean
        displayPeriod?: SatisfactionFormEditPeriod | null
        lockWritingPeriodInput?: boolean
      }
    ) => {
      const catalogRow = findWritingTemplateRowByDefinitionId(survey.templateId)
      const allowEdit = options?.allowEdit ?? true
      const editTarget =
        allowEdit && displayProgram != null
          ? buildProgramSurveyFormEditTarget(String(displayProgram.id), survey)
          : null
      const onEditForm =
        allowEdit && editTarget == null && catalogRow != null
          ? () => {
              closeWritingUserPreview()
              setSurveyTemplateEditId(survey.templateId)
              setSurveyTemplateEditOpen(true)
            }
          : undefined
      void buildUjatSurveyWritingPreviewSession({
        templateId: survey.templateId,
        title: options?.displayTitle ?? survey.title,
        versionId: survey.id,
        overwriteTitle: options?.overwriteTitle,
        displayPeriod: options?.displayPeriod,
        onEditForm,
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
          handleError(error, { context: 'ujatSurveyPreview' })
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
      displayProgram,
      openWritingUserPreview,
      requestPreviewHistoryPush,
      showAlert,
    ]
  )

  const showShareCopyToast = useCallback(
    (lines: { line1: string; line2: string } = UJAT_SATISFACTION_SHARE_TOAST_COPY) => {
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

  useEffect(() => {
    return () => {
      if (shareToastTimerRef.current != null) {
        window.clearTimeout(shareToastTimerRef.current)
      }
    }
  }, [])

  const handleCloseSurveyTemplateEdit = useCallback(() => {
    setSurveyTemplateEditOpen(false)
    setSurveyTemplateEditId(null)
  }, [])

  useEffect(() => {
    if (!surveysRemote || !remoteRegisteredSurveys) return
    setRegisteredSurveys(remoteRegisteredSurveys)
    setActiveRegisteredSurveyId(prev =>
      prev && remoteRegisteredSurveys.some(s => s.id === prev)
        ? prev
        : (remoteRegisteredSurveys[0]?.id ?? null)
    )
  }, [remoteRegisteredSurveys, surveysRemote])

  useEffect(() => {
    if (!surveysRemote || !classifiedBindings) return
    const nextSatisfaction: UjatSatisfactionSurveyByAudience = {}
    let nextLecture: UjatRegisteredSurvey | null = null
    for (const item of classifiedBindings) {
      if (item.kind === 'satisfaction' && item.satisfactionAudience) {
        const audience = item.satisfactionAudience
        if (
          audience === 'teacher' ||
          audience === 'volunteer_h1' ||
          audience === 'volunteer_h2'
        ) {
          nextSatisfaction[audience] = item.survey
        }
      }
      if (item.kind === 'lecture_evaluation') {
        nextLecture = item.survey
      }
    }
    setSatisfactionSurveysByAudience(nextSatisfaction)
    setLectureEvalSurvey(nextLecture)
  }, [classifiedBindings, surveysRemote])

  const surveyTemplateOptions = useMemo(() => getSurveyWritingTemplateSelectOptions(), [])
  const registerScheduleModalOpen =
    surveyCreateModalOpen || satisfactionCreateModalOpen || lectureEvalCreateModalOpen
  const surveyScheduleOptionsQuery = useProgramSurveyScheduleOptions(
    displayProgram,
    registerScheduleModalOpen || isUjatSatisfactionSurveyTab(activeTab)
  )
  const registerScheduleOptions = useMemo(() => {
    const raw = surveyScheduleOptionsQuery.options ?? []
    if (satisfactionCreateModalOpen) {
      return disableSurveyPollScheduleOptionsWithSurvey(raw, classifiedBindings, {
        formType: 'SATISFACTION',
        targetRole: resolveUjatSatisfactionBindingTargetRole(activeSatisfactionAudience),
      })
    }
    if (lectureEvalCreateModalOpen) {
      return disableSurveyPollScheduleOptionsWithSurvey(raw, classifiedBindings, {
        formType: 'LECTURE_EVALUATION',
      })
    }
    return disableSurveyPollScheduleOptionsWithSurvey(raw, classifiedBindings)
  }, [
    activeSatisfactionAudience,
    classifiedBindings,
    lectureEvalCreateModalOpen,
    satisfactionCreateModalOpen,
    surveyScheduleOptionsQuery.options,
  ])
  const registerScheduleField = useMemo(
    () => resolveUjatSurveyScheduleFieldFromOptions(registerScheduleOptions),
    [registerScheduleOptions]
  )
  const showUjatRegisterScheduleField = registerScheduleField.showScheduleField
  useEffect(() => {
    if (!registerScheduleModalOpen) return
    if (showUjatRegisterScheduleField) return
    if (registerScheduleField.singleScheduleValue) {
      setSelectedSurveyScheduleValue(registerScheduleField.singleScheduleValue)
    }
  }, [
    registerScheduleField.singleScheduleValue,
    registerScheduleModalOpen,
    showUjatRegisterScheduleField,
  ])
  useEffect(() => {
    if (!showUjatRegisterScheduleField || !registerScheduleModalOpen) return
    const selectable = registerScheduleOptions.filter(
      option => option.value && option.disabled !== true
    )
    if (selectable.length === 1 && selectable[0]?.value) {
      setSelectedSurveyScheduleValue(String(selectable[0].value))
    }
  }, [registerScheduleModalOpen, registerScheduleOptions, showUjatRegisterScheduleField])

  const resolveRegisterScheduleTarget = useCallback(
    (
      formType: 'SURVEY' | 'SATISFACTION' | 'LECTURE_EVALUATION',
      targetRole?: string
    ):
      | { ok: true; target: ReturnType<typeof resolveSurveyPollBindingTarget> }
      | { ok: false; message: string } => {
      if (surveyScheduleOptionsQuery.isLoading) {
        return { ok: false, message: '교육 일정을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.' }
      }
      if (
        showUjatRegisterScheduleField &&
        (selectedSurveyScheduleValue == null || selectedSurveyScheduleValue === '')
      ) {
        return { ok: false, message: '교육 일정을 선택해 주세요.' }
      }
      const selected = showUjatRegisterScheduleField
        ? selectedSurveyScheduleValue
        : registerScheduleField.singleScheduleValue
      if (selected == null || selected === '') {
        return {
          ok: false,
          message: '교육 일정을 먼저 등록한 뒤 다시 시도해 주세요.',
        }
      }
      try {
        const target = resolveSurveyPollBindingTarget(selected)
        if (
          isSurveyPollBindingTargetScheduleAlreadyRegistered(target, classifiedBindings, {
            formType,
            targetRole,
          })
        ) {
          return {
            ok: false,
            message:
              formType === 'SATISFACTION'
                ? '이미 만족도조사가 등록된 일정입니다.'
                : formType === 'LECTURE_EVALUATION'
                  ? '이미 강의평가가 등록된 일정입니다.'
                  : SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE,
          }
        }
        return { ok: true, target }
      } catch {
        return { ok: false, message: '교육 일정을 다시 선택해 주세요.' }
      }
    },
    [
      classifiedBindings,
      registerScheduleField.singleScheduleValue,
      selectedSurveyScheduleValue,
      showUjatRegisterScheduleField,
      surveyScheduleOptionsQuery.isLoading,
    ]
  )

  const activeRegisteredSurvey = useMemo(
    () => registeredSurveys.find(item => item.id === activeRegisteredSurveyId) ?? null,
    [registeredSurveys, activeRegisteredSurveyId]
  )
  const pollResponseVersionId = activeRegisteredSurveyId ?? undefined
  const satisfactionResponseVersionId =
    satisfactionSurveysByAudience[activeSatisfactionAudience]?.id ?? undefined
  const lectureResponseVersionId = lectureEvalSurvey?.id ?? undefined
  const pollBindingId = activeRegisteredSurvey?.bindingId
  const satisfactionBindingId =
    satisfactionSurveysByAudience[activeSatisfactionAudience]?.bindingId
  const lectureBindingId = lectureEvalSurvey?.bindingId

  const {
    pollResponses: remotePollResponses,
    initialLoading: pollResponsesLoading,
    isRemoteDataSource: pollResponsesRemote,
  } = useGeneralProgramSurveyResponses(programId, pollResponseVersionId, {
    bindingId: pollBindingId,
  })
  const {
    pollResponses: remoteSatisfactionResponses,
    initialLoading: satisfactionResponsesLoading,
    isRemoteDataSource: satisfactionResponsesRemote,
  } = useGeneralProgramSurveyResponses(programId, satisfactionResponseVersionId, {
    bindingId: satisfactionBindingId,
  })
  const {
    pollResponses: remoteLectureResponses,
    initialLoading: lectureResponsesLoading,
    isRemoteDataSource: lectureResponsesRemote,
  } = useGeneralProgramSurveyResponses(programId, lectureResponseVersionId, {
    bindingId: lectureBindingId,
  })
  const { totalResponseCount: remotePollSummaryCount } = useGeneralProgramSurveySummary(
    programId,
    pollResponseVersionId,
    pollBindingId
  )

  const pollResponses = useMemo((): UjatSurveyPollRawResponse[] => {
    if (pollResponsesRemote) return remotePollResponses ?? []
    return []
  }, [pollResponsesRemote, remotePollResponses])
  const activeSatisfactionSurvey = useMemo(
    () => satisfactionSurveysByAudience[activeSatisfactionAudience] ?? null,
    [satisfactionSurveysByAudience, activeSatisfactionAudience]
  )
  const satisfactionResponses = useMemo((): UjatSurveyPollRawResponse[] => {
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
  }, [
    activeRegisteredSurveyId,
    pollResponsesRemote,
    remotePollResponses,
    remotePollSummaryCount,
  ])

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

  const satisfactionAudienceTabs = useMemo(
    () => getSatisfactionAudienceTabsForSurveyTab(activeTab),
    [activeTab]
  )

  useEffect(() => {
    if (!isUjatSatisfactionSurveyTab(activeTab)) return
    const allowed = new Set(satisfactionAudienceTabs.map(tab => tab.key))
    if (!allowed.has(activeSatisfactionAudience)) {
      setActiveSatisfactionAudience(defaultSatisfactionAudienceForSurveyTab(activeTab))
    }
  }, [activeTab, activeSatisfactionAudience, satisfactionAudienceTabs])
  const handleOpenSurveyCreateModal = useCallback(() => {
    setSelectedSurveyTemplateId(null)
    setSelectedSurveyScheduleValue(null)
    setSubmittingSurveyTemplate(false)
    setSurveyCreateModalOpen(true)
  }, [])

  const handleCloseSurveyCreateModal = useCallback(() => {
    if (submittingSurveyTemplate) return
    setSurveyCreateModalOpen(false)
  }, [submittingSurveyTemplate])

  const handleSubmitSurveyTemplate = useCallback(async () => {
    if (selectedSurveyTemplateId == null || selectedSurveyTemplateId === '') return
    if (showUjatRegisterScheduleField) {
      if (
        selectedSurveyScheduleValue == null ||
        selectedSurveyScheduleValue === '' ||
        registerScheduleOptions.length === 0
      ) {
        return
      }
    }
    setSubmittingSurveyTemplate(true)
    try {
      const next = findWritingTemplateRowByDefinitionId(selectedSurveyTemplateId)

      if (surveysRemote) {
        const resolved = await resolvePublishedSurveyBinding(selectedSurveyTemplateId)
        if (!resolved.ok) {
          void showAlert({
            title: '등록 실패',
            content: surveyBindingResolutionAlert(resolved.reason),
          })
          return
        }
        const scheduleTarget = resolveRegisterScheduleTarget('SURVEY')
        if (!scheduleTarget.ok) {
          void showAlert({ title: '등록 실패', content: scheduleTarget.message })
          return
        }
        const targetScopePayload: Pick<ProgramFormBindingRequest, 'targetScope' | 'targetScopeId'> =
          scheduleTarget.target
        const payload: ProgramFormBindingRequest = {
          formType: 'SURVEY',
          templateId: resolved.templateId,
          templateVersionId: resolved.templateVersionId,
          ...ensureSurveyCreateSubmissionPeriod(resolved),
          active: true,
          required: false,
          ...targetScopePayload,
        }
        if (displayProgram == null) return
        // 등록 버튼에서는 바인딩을 만들지 않는다. 에디터 「저장」 때 양식 게시 후 바인딩을 만든다.
        const editLoad = await loadProgramSurveyFormEditForCreate(
          String(displayProgram.id),
          [payload],
          selectedSurveyTemplateId,
          createBinding,
          { schedules: surveyScheduleOptionsQuery.schedules }
        )
        if (!editLoad.ok) {
          void showAlert({ title: '양식 편집', content: editLoad.message })
          return
        }
        setSurveyCreateModalOpen(false)
        setSelectedSurveyScheduleValue(null)
        setProgramFormEdit(editLoad.edit)
        return
      }

      void next
      void showAlert({
        title: '등록 불가',
        content: '설문 등록은 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      setSurveyCreateModalOpen(false)
    } catch (error) {
      handleError(error, { context: 'ujatSurveyTemplate.create' })
      void showAlert({
        title: '등록 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '설문 등록에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    } finally {
      setSubmittingSurveyTemplate(false)
    }
  }, [
    classifiedBindings,
    createBinding,
    displayProgram,
    registerScheduleOptions.length,
    registeredSurveys.length,
    resolveRegisterScheduleTarget,
    selectedSurveyScheduleValue,
    selectedSurveyTemplateId,
    showAlert,
    showUjatRegisterScheduleField,
    surveyScheduleOptionsQuery.schedules,
    surveysRemote,
  ])

  const handleDeleteRegisteredSurvey = useCallback(async () => {
    if (!activeRegisteredSurvey || activeRegisteredSurvey.status !== 'before_start') return
    if (surveysRemote && activeRegisteredSurvey.bindingId) {
      const result = await deleteBinding(activeRegisteredSurvey.bindingId)
      if (!result.ok) {
        void showAlert({ title: '삭제 실패', content: result.message })
        return
      }
      return
    }
    void showAlert({
      title: '삭제 불가',
      content: '설문 삭제는 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
    })
  }, [activeRegisteredSurvey, deleteBinding, showAlert, surveysRemote])

  const handleOpenSurveyDeleteModal = useCallback(() => {
    if (!activeRegisteredSurvey || activeRegisteredSurvey.status !== 'before_start') return
    setSurveyDeleteConfirmWord('')
    setSurveyDeleteModalOpen(true)
  }, [activeRegisteredSurvey])

  const handleCloseSurveyDeleteModal = useCallback(() => {
    setSurveyDeleteModalOpen(false)
    setSurveyDeleteConfirmWord('')
  }, [])

  const handleConfirmSurveyDelete = useCallback(() => {
    if (surveyDeleteConfirmWord !== '삭제') return
    void handleDeleteRegisteredSurvey()
    setSurveyDeleteModalOpen(false)
    setSurveyDeleteConfirmWord('')
  }, [surveyDeleteConfirmWord, handleDeleteRegisteredSurvey])

  const handleOpenRegisteredSurveyTemplatePreview = useCallback(() => {
    if (!activeRegisteredSurvey) return
    openUjatSurveyTemplatePreview(activeRegisteredSurvey, {
      allowEdit: canEditRegisteredSurveyForm(activeRegisteredSurvey),
    })
  }, [activeRegisteredSurvey, openUjatSurveyTemplatePreview])

  const handleShareRegisteredSurvey = useCallback(() => {
    if (!activeRegisteredSurvey || programId == null) return
    if (!surveysRemote) {
      void showAlert({
        title: '공유',
        content: '공개 설문 공유를 사용하려면 설문 API 연결이 필요합니다.',
      })
      return
    }
    const bindingId = activeRegisteredSurvey.bindingId?.trim()
    if (!bindingId) {
      void showAlert({
        title: '공유',
        content: '공유할 설문 연결 정보를 찾지 못했습니다.',
      })
      return
    }
    void (async () => {
      try {
        const response = await createGeneralProgramSurveyShareLink(programId, bindingId)
        const platformOrigin = getPlatformPublicOrigin()
        const url = response
          ? resolveSurveyShareClipboardUrl(response, platformOrigin)
          : null
        if (!url) {
          void showAlert({
            title: '공유',
            content: describeSurveyShareClipboardFailure(response, platformOrigin, 'survey'),
          })
          return
        }
        void copyText(url)
        showShareCopyToast(UJAT_SURVEY_POLL_SHARE_TOAST_COPY)
      } catch (error) {
        handleError(error, { context: 'ujatSurveyShareLink' })
        void showAlert({
          title: '공유',
          content: getGeneralProgramApiErrorMessage(
            error,
            '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
          ),
        })
      }
    })()
  }, [activeRegisteredSurvey, copyText, programId, showAlert, showShareCopyToast, surveysRemote])

  const handleDownloadPollResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (activeRegisteredSurvey == null || displayProgram == null) return
      setDownloadingPollResults(true)
      try {
        if (format === 'pdf') {
          const root = pollResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(
            root,
            buildUjatSurveyPollResultsPdfFileName(
              resolveUjatProgramDisplayTitle(displayProgram),
              activeRegisteredSurvey.title
            )
          )
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: activeRegisteredSurvey.title,
            templateId: activeRegisteredSurvey.templateId,
            responseCount: activeRegisteredSurvey.responseCount,
            participantTotal: activeRegisteredSurvey.participantTotal,
            responses: pollResponses,
          })
        }
        setPollDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'ujatSurveyPollResultsDownload' })
        void showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingPollResults(false)
      }
    },
    [activeRegisteredSurvey, displayProgram, pollResponses, showAlert]
  )

  const handleOpenSatisfactionCreateModal = useCallback(() => {
    setSubmittingSatisfactionSurvey(false)
    setSelectedSurveyScheduleValue(null)
    setSelectedSatisfactionTemplateId(
      UJAT_SATISFACTION_TEMPLATE_BY_AUDIENCE[activeSatisfactionAudience]
    )
    setSatisfactionCreateModalOpen(true)
  }, [activeSatisfactionAudience])

  const handleCloseSatisfactionCreateModal = useCallback(() => {
    if (submittingSatisfactionSurvey) return
    setSatisfactionCreateModalOpen(false)
  }, [submittingSatisfactionSurvey])

  const handleSubmitSatisfactionSurvey = useCallback(async () => {
    if (selectedSatisfactionTemplateId == null || selectedSatisfactionTemplateId === '') return
    setSubmittingSatisfactionSurvey(true)
    try {
      const next = findWritingTemplateRowByDefinitionId(selectedSatisfactionTemplateId)

      if (surveysRemote) {
        const resolved = await resolvePublishedSurveyBinding(selectedSatisfactionTemplateId)
        if (!resolved.ok) {
          void showAlert({
            title: '등록 실패',
            content: surveyBindingResolutionAlert(resolved.reason),
          })
          return
        }
        const targetRole = resolveUjatSatisfactionBindingTargetRole(activeSatisfactionAudience)
        const scheduleTarget = resolveRegisterScheduleTarget('SATISFACTION', targetRole)
        if (!scheduleTarget.ok) {
          void showAlert({ title: '등록 실패', content: scheduleTarget.message })
          return
        }
        const period = resolveSatisfactionCreateSubmissionPeriod(
          findSatisfactionScheduleById(
            surveyScheduleOptionsQuery.schedules,
            scheduleTarget.target.targetScopeId
          ) ?? pickLastSurveyPollEducationSlot(surveyScheduleOptionsQuery.schedules),
          7
        )
        const payload: ProgramFormBindingRequest = {
          formType: 'SATISFACTION',
          templateId: resolved.templateId,
          templateVersionId: resolved.templateVersionId,
          ...(period ?? {}),
          targetRole,
          ...scheduleTarget.target,
          active: true,
          required: false,
          duplicatePolicy: 'ONE_SUBMITTED_PER_CONTEXT',
          satisfactionRunMode: 'PER_SCHEDULE',
          satisfactionWindowDays: 7,
          startAtLocked: false,
          startImmediately: false,
        } as ProgramFormBindingRequest
        if (displayProgram == null) return
        // 등록 버튼에서는 바인딩을 만들지 않는다. 에디터 「저장」 때 양식 게시 후 바인딩을 만든다.
        const editLoad = await loadProgramSurveyFormEditForCreate(
          String(displayProgram.id),
          [payload],
          selectedSatisfactionTemplateId,
          createBinding,
          {
            schedules: surveyScheduleOptionsQuery.schedules,
            windowDays: 7,
            targetScope: payload.targetScope ?? undefined,
            targetScopeId: payload.targetScopeId ?? undefined,
          }
        )
        if (!editLoad.ok) {
          void showAlert({ title: '양식 편집', content: editLoad.message })
          return
        }
        setSatisfactionCreateModalOpen(false)
        setProgramFormEdit(editLoad.edit)
        return
      }

      void next
      void showAlert({
        title: '등록 불가',
        content: '만족도조사 등록은 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      setSatisfactionCreateModalOpen(false)
    } catch (error) {
      handleError(error, { context: 'ujatSatisfactionSurvey.create' })
      void showAlert({
        title: '등록 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '만족도조사 등록에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    } finally {
      setSubmittingSatisfactionSurvey(false)
    }
  }, [
    activeSatisfactionAudience,
    createBinding,
    displayProgram,
    resolveRegisterScheduleTarget,
    selectedSatisfactionTemplateId,
    showAlert,
    surveyScheduleOptionsQuery.schedules,
    surveysRemote,
  ])

  const handleDeleteSatisfactionSurvey = useCallback(async () => {
    if (!activeSatisfactionSurvey || activeSatisfactionSurvey.status !== 'before_start') return
    if (surveysRemote && activeSatisfactionSurvey.bindingId) {
      const result = await deleteBinding(activeSatisfactionSurvey.bindingId)
      if (!result.ok) {
        void showAlert({ title: '삭제 실패', content: result.message })
        return
      }
      return
    }
    void showAlert({
      title: '삭제 불가',
      content: '만족도조사 삭제는 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
    })
  }, [
    activeSatisfactionAudience,
    activeSatisfactionSurvey,
    deleteBinding,
    showAlert,
    surveysRemote,
  ])

  const handleOpenSatisfactionDeleteModal = useCallback(() => {
    if (!activeSatisfactionSurvey || activeSatisfactionSurvey.status !== 'before_start') return
    setSatisfactionDeleteConfirmWord('')
    setSatisfactionDeleteModalOpen(true)
  }, [activeSatisfactionSurvey])

  const handleCloseSatisfactionDeleteModal = useCallback(() => {
    setSatisfactionDeleteModalOpen(false)
    setSatisfactionDeleteConfirmWord('')
  }, [])

  const handleConfirmSatisfactionDelete = useCallback(() => {
    if (satisfactionDeleteConfirmWord !== '삭제') return
    void handleDeleteSatisfactionSurvey()
    setSatisfactionDeleteModalOpen(false)
    setSatisfactionDeleteConfirmWord('')
  }, [satisfactionDeleteConfirmWord, handleDeleteSatisfactionSurvey])

  /** 강의평가 진행 전 — 등록된 매핑 삭제 (설문조사·만족도조사와 동일) */
  const handleDeleteLectureEvalSurvey = useCallback(async () => {
    if (!lectureEvalSurvey || lectureEvalSurvey.status !== 'before_start') return
    if (surveysRemote && lectureEvalSurvey.bindingId) {
      const result = await deleteBinding(lectureEvalSurvey.bindingId)
      if (!result.ok) {
        void showAlert({ title: '삭제 실패', content: result.message })
      }
      return
    }
    void showAlert({
      title: '삭제 불가',
      content: '강의평가 삭제는 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
    })
  }, [deleteBinding, lectureEvalSurvey, showAlert, surveysRemote])

  const handleOpenLectureEvalDeleteModal = useCallback(() => {
    if (!lectureEvalSurvey || lectureEvalSurvey.status !== 'before_start') return
    setLectureEvalDeleteConfirmWord('')
    setLectureEvalDeleteModalOpen(true)
  }, [lectureEvalSurvey])

  const handleCloseLectureEvalDeleteModal = useCallback(() => {
    setLectureEvalDeleteModalOpen(false)
    setLectureEvalDeleteConfirmWord('')
  }, [])

  const handleConfirmLectureEvalDelete = useCallback(() => {
    if (lectureEvalDeleteConfirmWord.trim() !== '삭제') return
    void handleDeleteLectureEvalSurvey()
    setLectureEvalDeleteModalOpen(false)
    setLectureEvalDeleteConfirmWord('')
  }, [handleDeleteLectureEvalSurvey, lectureEvalDeleteConfirmWord])

  const handleOpenSatisfactionTemplatePreview = useCallback(() => {
    if (!activeSatisfactionSurvey) return
    openUjatSurveyTemplatePreview(activeSatisfactionSurvey, {
      allowEdit: canEditRegisteredSurveyForm(activeSatisfactionSurvey),
      displayTitle: resolveSatisfactionSurveyDisplayTitle(
        activeSatisfactionSurvey,
        surveyScheduleOptionsQuery.schedules
      ),
      overwriteTitle: true,
      displayPeriod: resolveSatisfactionPreviewPeriod(
        activeSatisfactionSurvey,
        surveyScheduleOptionsQuery.schedules
      ),
      lockWritingPeriodInput: isSatisfactionPerScheduleWritingPeriodLocked({
        formType: 'SATISFACTION',
        runMode: activeSatisfactionSurvey.satisfactionRunMode,
        targetScope: activeSatisfactionSurvey.targetScope,
      }),
    })
  }, [
    activeSatisfactionSurvey,
    openUjatSurveyTemplatePreview,
    surveyScheduleOptionsQuery.schedules,
  ])

  const handleShareSatisfactionSurvey = useCallback(() => {
    if (!activeSatisfactionSurvey || programId == null) return
    if (!surveysRemote) {
      void showAlert({
        title: '공유',
        content: '공개 만족도조사 공유를 사용하려면 설문 API 연결이 필요합니다.',
      })
      return
    }
    const bindingId = activeSatisfactionSurvey.bindingId?.trim()
    if (!bindingId) {
      void showAlert({
        title: '공유',
        content: '공유할 만족도조사 연결 정보를 찾지 못했습니다.',
      })
      return
    }
    void (async () => {
      try {
        const response = await createGeneralProgramSurveyShareLink(programId, bindingId)
        const platformOrigin = getPlatformPublicOrigin()
        const url = response
          ? resolveSurveyShareClipboardUrl(response, platformOrigin)
          : null
        if (!url) {
          void showAlert({
            title: '공유',
            content: describeSurveyShareClipboardFailure(
              response,
              platformOrigin,
              'satisfaction'
            ),
          })
          return
        }
        void copyText(url)
        showShareCopyToast()
      } catch (error) {
        handleError(error, { context: 'ujatSatisfactionShareLink' })
        void showAlert({
          title: '공유',
          content: getGeneralProgramApiErrorMessage(
            error,
            '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
          ),
        })
      }
    })()
  }, [
    activeSatisfactionAudience,
    activeSatisfactionSurvey,
    copyText,
    programId,
    showAlert,
    showShareCopyToast,
    surveysRemote,
  ])

  const handleDownloadSatisfactionResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (activeSatisfactionSurvey == null || displayProgram == null) return
      setDownloadingSatisfactionResults(true)
      try {
        if (format === 'pdf') {
          const root = satisfactionResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(
            root,
            buildUjatSatisfactionResultsPdfFileName(
              resolveUjatProgramDisplayTitle(displayProgram),
              activeSatisfactionSurvey.title
            )
          )
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: activeSatisfactionSurvey.title,
            templateId: activeSatisfactionSurvey.templateId,
            responseCount: activeSatisfactionSurvey.responseCount,
            participantTotal: activeSatisfactionSurvey.participantTotal,
            responses: satisfactionResponses,
          })
        }
        setSatisfactionDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'ujatSatisfactionResultsDownload' })
        void showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingSatisfactionResults(false)
      }
    },
    [activeSatisfactionSurvey, displayProgram, satisfactionResponses, showAlert]
  )

  const ensureLectureEvalFormDraft = useCallback(() => {
    if (lectureEvalSurvey == null) return
    const templateId = lectureEvalSurvey.templateId || UJAT_LECTURE_EVAL_TEMPLATE_ID
    const versionId = Number(lectureEvalSurvey.id)
    const loadDraft = async () => {
      if (
        findWritingTemplateRowByDefinitionId(templateId) == null &&
        Number.isFinite(versionId) &&
        versionId > 0
      ) {
        const record = await loadFormTemplateVersionDraftByVersionId(
          templateId,
          Math.trunc(versionId)
        )
        // 저장된 응답이 없을 때 시작 상태 — 양식에 박힌 미리보기 선택(척도 「매우 그렇다」 등)을 비운다.
        if (record?.draft != null) return clearLectureEvalFormAnswers(record.draft)
      }
      // 등록된 강의평가는 바인딩 version으로 연다(템플릿 목록 미조회 — 뷰어 403 방지).
      return buildLectureEvalFormDraft(templateId, versionId)
    }
    void loadDraft()
      .catch(() => buildLectureEvalFormDraft(templateId, versionId))
      .then(draft => {
        lectureEvalDraftRef.current = lectureEvalDraftRef.current ?? draft
        setLectureEvalFormDraft(prev => prev ?? draft)
      })
  }, [lectureEvalSurvey])

  // 답변 수정 — 내 응답을 폼에 채운다(일반 프로그램과 동일). 양식이 늦게 로드돼도 다시 채운다.
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
      setLectureEvalResponses([])
      setLectureEvalSubmitted(false)
      setActiveLectureEvalTab('eval')
      return
    }
    if (
      lectureEvalSurvey.status === 'in_progress' ||
      lectureEvalSurvey.status === 'finished'
    ) {
      ensureLectureEvalFormDraft()
    }
  }, [lectureEvalSurvey, ensureLectureEvalFormDraft])

  const handleOpenLectureEvalCreateModal = useCallback(() => {
    setSubmittingLectureEvalSurvey(false)
    setSelectedSurveyScheduleValue(null)
    setSelectedLectureEvalTemplateId(UJAT_LECTURE_EVAL_TEMPLATE_ID)
    setLectureEvalCreateModalOpen(true)
  }, [])

  const handleCloseLectureEvalCreateModal = useCallback(() => {
    if (submittingLectureEvalSurvey) return
    setLectureEvalCreateModalOpen(false)
  }, [submittingLectureEvalSurvey])

  const handleSubmitLectureEvalRegister = useCallback(async () => {
    if (selectedLectureEvalTemplateId == null || selectedLectureEvalTemplateId === '') return
    setSubmittingLectureEvalSurvey(true)
    try {
      const next = findWritingTemplateRowByDefinitionId(selectedLectureEvalTemplateId)

      if (surveysRemote) {
        const resolved = await resolvePublishedSurveyBinding(selectedLectureEvalTemplateId)
        if (!resolved.ok) {
          void showAlert({
            title: '등록 실패',
            content: surveyBindingResolutionAlert(resolved.reason),
          })
          return
        }
        const scheduleTarget = resolveRegisterScheduleTarget('LECTURE_EVALUATION')
        if (!scheduleTarget.ok) {
          void showAlert({ title: '등록 실패', content: scheduleTarget.message })
          return
        }
        const payload: ProgramFormBindingRequest = {
          formType: 'LECTURE_EVALUATION',
          templateId: resolved.templateId,
          templateVersionId: resolved.templateVersionId,
          submissionStartAt: resolved.submissionStartAt,
          submissionEndAt: resolved.submissionEndAt,
          targetRole: 'ADMIN',
          ...scheduleTarget.target,
          active: true,
          required: false,
        }
        if (displayProgram == null) return
        // 설문조사와 같이 에디터 「저장」 때 양식 게시 후 바인딩을 만든다(취소 시 미등록).
        const editLoad = await loadProgramSurveyFormEditForCreate(
          String(displayProgram.id),
          [payload],
          selectedLectureEvalTemplateId,
          createBinding,
          { schedules: surveyScheduleOptionsQuery.schedules }
        )
        if (!editLoad.ok) {
          void showAlert({ title: '양식 편집', content: editLoad.message })
          return
        }
        setLectureEvalCreateModalOpen(false)
        setSelectedSurveyScheduleValue(null)
        setProgramFormEdit(editLoad.edit)
        return
      }

      void next
      void showAlert({
        title: '등록 불가',
        content: '강의평가 등록은 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      setLectureEvalCreateModalOpen(false)
    } catch (error) {
      handleError(error, { context: 'ujatLectureEval.register' })
      void showAlert({
        title: '등록 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '강의평가 등록에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    } finally {
      setSubmittingLectureEvalSurvey(false)
    }
  }, [
    createBinding,
    displayProgram,
    resolveRegisterScheduleTarget,
    selectedLectureEvalTemplateId,
    showAlert,
    surveyScheduleOptionsQuery.schedules,
    surveysRemote,
  ])

  const handleOpenLectureEvalPreview = useCallback(() => {
    if (!lectureEvalSurvey) return
    const row = findWritingTemplateRowByDefinitionId(lectureEvalSurvey.templateId)
    const editTarget =
      canEditRegisteredSurveyForm(lectureEvalSurvey) && displayProgram != null
        ? buildProgramSurveyFormEditTarget(String(displayProgram.id), lectureEvalSurvey)
        : null
    const onEditForm =
      canEditRegisteredSurveyForm(lectureEvalSurvey) && editTarget == null && row != null
        ? () => {
            closeWritingUserPreview()
            setSurveyTemplateEditId(row.id)
            setSurveyTemplateEditOpen(true)
          }
        : undefined

    void (async () => {
      if (row != null) {
        const entry = lookupTemplateRegistry(row.id)
        if (entry == null || !isSurveyRegistryEntry(entry)) return null
        const draft = await buildLectureEvalFormDraft(row.id)
        return {
          draft,
          updateParagraph: () => {},
          headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
          editorKind: 'survey' as const,
          paragraphBodyOptions: UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
          ...(onEditForm != null ? { onEditForm } : {}),
        }
      }
      const versionId = Number(lectureEvalSurvey.id)
      if (!Number.isFinite(versionId) || versionId <= 0) return null
      const record = await loadFormTemplateVersionDraftByVersionId(
        lectureEvalSurvey.templateId,
        Math.trunc(versionId)
      )
      if (record?.draft == null) return null
      return {
        draft: record.draft,
        updateParagraph: () => {},
        headerTitle: lectureEvalSurvey.title.trim() || '강의평가',
        editorKind: 'survey' as const,
        paragraphBodyOptions: UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
      }
    })()
      .then(session => {
        if (session == null) {
          void showAlert({
            title: '양식 보기',
            content: '강의평가 양식을 불러오지 못했습니다. 다시 시도해 주세요.',
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
                  setProgramFormEdit({ target: editTarget, initialDraft: session.draft })
                },
              }
            : session
        )
      })
      .catch(error => {
        handleError(error, { context: 'ujatLectureEvalPreview' })
        void showAlert({
          title: '양식 보기',
          content: getGeneralProgramApiErrorMessage(
            error,
            '강의평가 양식을 불러오지 못했습니다. 다시 시도해 주세요.'
          ),
        })
      })
  }, [
    lectureEvalSurvey,
    displayProgram,
    closeWritingUserPreview,
    openWritingUserPreview,
    requestPreviewHistoryPush,
    showAlert,
  ])

  const handleConfirmLectureEvalResponseDelete = useCallback(async () => {
    if (lectureEvalSurvey == null || !canEditLectureEvalResponse(lectureEvalSurvey)) return
    const responseId = parseOwnLectureEvalFormResponseId(lectureEvalResponses, adminAccountId)
    if (!surveysRemote || responseId == null) {
      setLectureEvalResponseDeleteOpen(false)
      void showAlert({
        title: '삭제 실패',
        content: '삭제할 강의평가 답변을 찾지 못했습니다. 화면을 다시 불러온 뒤 확인해 주세요.',
      })
      return
    }
    setDeletingLectureEvalResponse(true)
    try {
      await deleteGeneralProgramFormResponse(responseId)
    } catch (error) {
      handleError(error, { context: 'ujatLectureEvalResponseDelete' })
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
    ensureLectureEvalFormDraft()
    setLectureEvalResponseDeleteOpen(false)
    void invalidateSurveyCaches()
    void showAlert({
      title: UJAT_LECTURE_EVAL_RESPONSE_DELETE_COPY.completeTitle,
      content: UJAT_LECTURE_EVAL_RESPONSE_DELETE_COPY.completeContent,
    })
  }, [
    adminAccountId,
    ensureLectureEvalFormDraft,
    invalidateSurveyCaches,
    lectureEvalResponses,
    lectureEvalSurvey,
    showAlert,
    surveysRemote,
  ])

  const handleLectureEvalTabChange = useCallback(
    (tab: UjatLectureEvalTabKey) => {
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

  const handleLectureEvalDraftChange = useCallback((draft: WritingFormDraft) => {
    lectureEvalDraftRef.current = draft
  }, [])

  const handleLectureEvalSubmit = useCallback(async () => {
    const lectureEvalFormDraft = lectureEvalDraftRef.current
    if (lectureEvalSurvey == null || lectureEvalFormDraft == null) return
    const validation = validateLectureEvalFormDraft(lectureEvalFormDraft)
    if (!validation.valid) {
      // 필수 항목 미입력 — 공통 「필수 항목 미입력 안내」 모달(항목별 문구 대신, 2026-11-13 요청)
      void showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }

    setLectureEvalFormDraft(lectureEvalFormDraft)
    const pollResponse = draftToLectureEvalPollResponse(lectureEvalFormDraft)
    // 서버 제출용 — 설문자 정보는 단락 id 아래 객체로 묶는다(평면 키 금지)
    const submitAnswers = draftToLectureEvalSubmitAnswers(lectureEvalFormDraft)
    const surveyVersionId = Number(lectureEvalSurvey.id)
    const templateVersionId =
      Number.isFinite(surveyVersionId) && surveyVersionId > 0
        ? Math.trunc(surveyVersionId)
        : resolveBindingIds(lectureEvalSurvey.templateId).templateVersionId
    const programIdNum = Number(programId)

    if (!surveysRemote) {
      void showAlert({
        title: '제출 불가',
        content: '강의평가 제출은 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      return
    }
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
          answers: submitAnswers,
        })
      } else {
        const created = await submitGeneralProgramFormResponse({
          templateVersionId,
          programId: programIdNum,
          contextType: submitContext.contextType,
          contextId: submitContext.contextId,
          answers: submitAnswers,
        })
        if (created?.formResponseId != null) {
          pollResponse.respondentId = String(created.formResponseId)
        }
      }
      await queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.surveyResponses(
          String(programId),
          String(templateVersionId),
          lectureEvalSurvey.bindingId ?? ''
        ),
      })
    } catch (error) {
      handleError(error, { context: 'ujatLectureEvalSubmit' })
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

    setLectureEvalSubmitted(true)
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
      return {
        ...prev,
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
    program.totalParticipants,
    programId,
    queryClient,
    rawSurveys,
    showAlert,
    surveysRemote,
  ])

  const handleLectureEvalEditResponse = useCallback(() => {
    if (!lectureEvalSurvey || lectureEvalFormDraft == null) return
    if (!canEditLectureEvalResponse(lectureEvalSurvey)) return
    setLectureEvalSubmitted(false)
  }, [lectureEvalSurvey, lectureEvalFormDraft])

  const handleDownloadLectureEvalResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (
        lectureEvalSurvey == null ||
        displayProgram == null ||
        !canDownloadLectureEvalResults(lectureEvalSurvey)
      ) {
        return
      }
      setDownloadingLectureEvalResults(true)
      try {
        if (format === 'pdf') {
          const root = lectureEvalResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(
            root,
            buildLectureEvalResultsPdfFileName(resolveUjatProgramDisplayTitle(displayProgram))
          )
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: lectureEvalSurvey.title,
            templateId: lectureEvalSurvey.templateId,
            responseCount: lectureEvalSurvey.responseCount,
            participantTotal: lectureEvalSurvey.participantTotal,
            responses: lectureEvalResponses,
          })
        }
        setLectureEvalDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'ujatLectureEvalResultsDownload' })
        void showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingLectureEvalResults(false)
      }
    },
    [displayProgram, lectureEvalResponses, lectureEvalSurvey, showAlert]
  )

  const handleCloseLectureEvalIncompleteModal = useCallback(() => {
    setLectureEvalIncompleteModalOpen(false)
  }, [])

  const surveyPanelSpinner = (
    <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
      <Spin size="large" />
    </div>
  )

  return (
    <>
            {(activeTab === 'survey-poll' ? (
              surveysRemote && surveysLoading && registeredSurveys.length === 0 ? (
                surveyPanelSpinner
              ) : registeredSurveys.length === 0 ? (
                <UjatSurveyEmptyState
                  title={UJAT_SURVEY_POLL_EMPTY_COPY.title}
                  description={UJAT_SURVEY_POLL_EMPTY_COPY.description}
                  registerButtonLabel={UJAT_SURVEY_POLL_EMPTY_COPY.registerButton}
                  showRegisterButton
                  onRegisterClick={handleOpenSurveyCreateModal}
                />
              ) : (
                <div className="program-detail-fullpage-modal__info-tab ujat-survey-registered">
                  <CmsTextTabs
                    className="ujat-survey-registered__tabs"
                    variant="list"
                    activeKey={activeRegisteredSurveyId ?? ''}
                    onChange={setActiveRegisteredSurveyId}
                    items={registeredSurveys.map(item => ({ key: item.id, label: item.title }))}
                    trailing={
                      activeRegisteredSurvey != null ? (
                        <UjatSurveyRegisteredActions
                          survey={activeRegisteredSurvey}
                          labels={UJAT_SURVEY_POLL_ACTION_LABELS}
                          showAddButton
                          onShareClick={handleShareRegisteredSurvey}
                          onAddClick={handleOpenSurveyCreateModal}
                          onOpenTemplatePreview={handleOpenRegisteredSurveyTemplatePreview}
                          onDownloadClick={() => setPollDownloadModalOpen(true)}
                        />
                      ) : null
                    }
                  />
                  {pollResponsesRemote && pollResponsesLoading && activeRegisteredSurvey != null ? (
                    <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
                      <Spin size="large" />
                    </div>
                  ) : activeRegisteredSurvey != null &&
                  (activeRegisteredSurvey.status === 'before_start' ||
                    (activeRegisteredSurvey.status === 'finished' &&
                      activeRegisteredSurvey.responseCount === 0)) ? (
                    <UjatSurveyNoResponseState
                      title={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.title}
                      description={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.description}
                      deleteButtonLabel={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.deleteButton}
                      previewButtonLabel={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.previewButton}
                      canDelete={activeRegisteredSurvey.status === 'before_start'}
                      showDeleteButton
                      embedded
                      onDeleteClick={handleOpenSurveyDeleteModal}
                      onOpenTemplatePreview={handleOpenRegisteredSurveyTemplatePreview}
                    />
                  ) : activeRegisteredSurvey != null ? (
                    <div ref={pollResultsExportRef}>
                      <UjatSurveyPollResultsView
                        templateId={activeRegisteredSurvey.templateId}
                        templateVersionId={toSurveyTemplateVersionId(
                          activeRegisteredSurvey,
                          surveysRemote
                        )}
                        responseCount={activeRegisteredSurvey.responseCount}
                        participantTotal={activeRegisteredSurvey.participantTotal}
                        responses={pollResponses}
                        pdfTitle="설문조사 결과"
                      />
                    </div>
                  ) : null}
                </div>
              )
            ) : isUjatSatisfactionSurveyTab(activeTab) ? (
              surveysRemote && surveysLoading ? (
                surveyPanelSpinner
              ) : satisfactionResponsesRemote && satisfactionResponsesLoading ? (
                surveyPanelSpinner
              ) : (
              <UjatSatisfactionSurveyView
                surveysByAudience={satisfactionSurveysByAudience}
                resultsTemplateVersionId={toSurveyTemplateVersionId(
                  activeSatisfactionSurvey,
                  surveysRemote
                )}
                activeAudience={activeSatisfactionAudience}
                onAudienceChange={setActiveSatisfactionAudience}
                onRegisterClick={handleOpenSatisfactionCreateModal}
                onShareClick={handleShareSatisfactionSurvey}
                onDeleteClick={handleOpenSatisfactionDeleteModal}
                onOpenTemplatePreview={handleOpenSatisfactionTemplatePreview}
                onDownloadClick={() => setSatisfactionDownloadModalOpen(true)}
                resultsExportRef={satisfactionResultsExportRef}
                resultsResponses={satisfactionResponses}
                audienceTabs={satisfactionAudienceTabs}
              />
              )
            ) : activeTab === 'survey-lecture-eval' ? (
              surveysRemote && surveysLoading ? (
                surveyPanelSpinner
              ) : lectureResponsesRemote && lectureResponsesLoading ? (
                surveyPanelSpinner
              ) : (
              <UjatLectureEvalSurveyView
                survey={lectureEvalSurvey}
                resultsTemplateVersionId={toSurveyTemplateVersionId(lectureEvalSurvey, surveysRemote)}
                submitted={lectureEvalSubmitted}
                formDraft={lectureEvalFormDraft}
                pollResponses={lectureEvalResponses}
                activeTab={activeLectureEvalTab}
                downloadingResults={downloadingLectureEvalResults}
                resultsExportRef={lectureEvalResultsExportRef}
                onTabChange={handleLectureEvalTabChange}
                onRegisterClick={handleOpenLectureEvalCreateModal}
                onDeleteClick={handleOpenLectureEvalDeleteModal}
                onOpenTemplatePreview={handleOpenLectureEvalPreview}
                onFormDraftChange={handleLectureEvalDraftChange}
                onSubmitClick={handleLectureEvalSubmit}
                onEditResponseClick={handleLectureEvalEditResponse}
                onDeleteResponseClick={() => setLectureEvalResponseDeleteOpen(true)}
                onDownloadResultsClick={() => setLectureEvalDownloadModalOpen(true)}
              />
              )
            ) : null)}

      <ConfirmModal
        open={lectureEvalResponseDeleteOpen}
        title={UJAT_LECTURE_EVAL_RESPONSE_DELETE_COPY.title}
        content={UJAT_LECTURE_EVAL_RESPONSE_DELETE_COPY.content}
        confirmText={UJAT_LECTURE_EVAL_RESPONSE_DELETE_COPY.confirmButton}
        cancelText={UJAT_LECTURE_EVAL_RESPONSE_DELETE_COPY.cancelButton}
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
        open={surveyCreateModalOpen}
        className="ujat-survey-create-modal"
        submitting={submittingSurveyTemplate}
        templateOptions={surveyTemplateOptions}
        templateValue={selectedSurveyTemplateId}
        onTemplateChange={setSelectedSurveyTemplateId}
        scheduleOptions={registerScheduleOptions}
        scheduleValue={selectedSurveyScheduleValue}
        onScheduleChange={setSelectedSurveyScheduleValue}
        schedulesLoading={surveyScheduleOptionsQuery.isLoading}
        hasSessionSchedules={registerScheduleOptions.length > 0}
        showScheduleField={showUjatRegisterScheduleField}
        scheduleLabel="교육 일정"
        onCancel={handleCloseSurveyCreateModal}
        onSubmit={() => {
          void handleSubmitSurveyTemplate()
        }}
      />
      <ContentModal
        open={surveyDeleteModalOpen}
        onCancel={handleCloseSurveyDeleteModal}
        title="설문조사 삭제 안내"
        width={600}
        modalStyles={{
          content: { minHeight: 310 },
        }}
        className="ujat-survey-delete-modal"
        description={`**[${activeRegisteredSurvey?.title ?? '설문조사'}]** 설문을 삭제하시겠습니까?\n삭제 시 설문 결과를 포함한 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.`}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={handleCloseSurveyDeleteModal} >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              disabled={surveyDeleteConfirmWord.trim() !== '삭제'}
              onClick={handleConfirmSurveyDelete} >
              삭제
            </CmsButton>
          </>
        }
      >
        <div className="ujat-survey-delete-modal__field">
          <CmsInput
            width="100%"
            placeholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요"
            value={surveyDeleteConfirmWord}
            onChange={e => setSurveyDeleteConfirmWord(e.target.value)}
          />
        </div>
      </ContentModal>
      <ContentModal
        open={lectureEvalDeleteModalOpen}
        onCancel={handleCloseLectureEvalDeleteModal}
        title="강의평가 삭제 안내"
        width={600}
        modalStyles={{
          content: { minHeight: 310 },
        }}
        className="ujat-survey-delete-modal"
        description={`**[${lectureEvalSurvey?.title ?? '강의평가'}]** 설문을 삭제하시겠습니까?\n삭제 시 설문 결과를 포함한 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.`}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={handleCloseLectureEvalDeleteModal} >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              disabled={lectureEvalDeleteConfirmWord.trim() !== '삭제'}
              onClick={handleConfirmLectureEvalDelete} >
              삭제
            </CmsButton>
          </>
        }
      >
        <div className="ujat-survey-delete-modal__field">
          <CmsInput
            width="100%"
            placeholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요"
            value={lectureEvalDeleteConfirmWord}
            onChange={e => setLectureEvalDeleteConfirmWord(e.target.value)}
          />
        </div>
      </ContentModal>
      <SurveyPollRegisterModal
        open={satisfactionCreateModalOpen}
        className="ujat-survey-create-modal"
        submitting={submittingSatisfactionSurvey}
        title="신규 만족도조사 등록"
        description={
          showUjatRegisterScheduleField
            ? `${getSatisfactionAudienceLabel(activeSatisfactionAudience)}용 만족도조사를 등록하시겠습니까?\n사용할 템플릿 유형과 교육 일정을 선택해 주세요.`
            : `${getSatisfactionAudienceLabel(activeSatisfactionAudience)}용 만족도조사를 등록하시겠습니까?\n사용할 템플릿 유형을 선택해 주세요.`
        }
        templateOptions={surveyTemplateOptions}
        templateValue={selectedSatisfactionTemplateId}
        onTemplateChange={setSelectedSatisfactionTemplateId}
        scheduleOptions={registerScheduleOptions}
        scheduleValue={selectedSurveyScheduleValue}
        onScheduleChange={setSelectedSurveyScheduleValue}
        schedulesLoading={surveyScheduleOptionsQuery.isLoading}
        hasSessionSchedules={registerScheduleOptions.length > 0}
        showScheduleField={showUjatRegisterScheduleField}
        scheduleLabel="교육 일정"
        onCancel={handleCloseSatisfactionCreateModal}
        onSubmit={() => {
          void handleSubmitSatisfactionSurvey()
        }}
      />
      <ContentModal
        open={satisfactionDeleteModalOpen}
        onCancel={handleCloseSatisfactionDeleteModal}
        title={`${getSatisfactionDeleteModalSubject(activeSatisfactionAudience)} 삭제 안내`}
        width={600}
        modalStyles={{
          content: { minHeight: 310 },
        }}
        className="ujat-survey-delete-modal"
        description={`**[${getSatisfactionDeleteModalSubject(activeSatisfactionAudience)}]** 설문을 삭제하시겠습니까?\n삭제 시 설문 결과를 포함한 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.`}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              type="button"
              onClick={handleCloseSatisfactionDeleteModal} >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              disabled={satisfactionDeleteConfirmWord.trim() !== '삭제'}
              onClick={handleConfirmSatisfactionDelete} >
              삭제
            </CmsButton>
          </>
        }
      >
        <div className="ujat-survey-delete-modal__field">
          <CmsInput
            width="100%"
            placeholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요"
            value={satisfactionDeleteConfirmWord}
            onChange={e => setSatisfactionDeleteConfirmWord(e.target.value)}
          />
        </div>
      </ContentModal>
      <SurveyPollRegisterModal
        open={lectureEvalCreateModalOpen}
        className="ujat-survey-create-modal"
        submitting={submittingLectureEvalSurvey}
        title={UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.title}
        description={
          showUjatRegisterScheduleField
            ? '강의평가를 등록하시겠습니까?\n사용할 템플릿 유형과 교육 일정을 선택해 주세요.'
            : '강의평가를 등록하시겠습니까?\n사용할 템플릿 유형을 선택해 주세요.'
        }
        confirmLabel={UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.confirmButton}
        templateOptions={surveyTemplateOptions}
        templateValue={selectedLectureEvalTemplateId}
        onTemplateChange={setSelectedLectureEvalTemplateId}
        scheduleOptions={registerScheduleOptions}
        scheduleValue={selectedSurveyScheduleValue}
        onScheduleChange={setSelectedSurveyScheduleValue}
        schedulesLoading={surveyScheduleOptionsQuery.isLoading}
        hasSessionSchedules={registerScheduleOptions.length > 0}
        showScheduleField={showUjatRegisterScheduleField}
        scheduleLabel="교육 일정"
        onCancel={handleCloseLectureEvalCreateModal}
        onSubmit={() => {
          void handleSubmitLectureEvalRegister()
        }}
      />
      <ContentModal
        open={lectureEvalIncompleteModalOpen}
        onCancel={handleCloseLectureEvalIncompleteModal}
        title={UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.title}
        width={600}
        className="ujat-lecture-eval-incomplete-modal"
        description={UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.description}
        footer={
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={handleCloseLectureEvalIncompleteModal} >
            {UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.confirmButton}
          </CmsButton>
        }
      >
        <span className="ujat-lecture-eval-incomplete-modal__body-placeholder" />
      </ContentModal>
      <SurveyResultsDownloadModal
        open={lectureEvalDownloadModalOpen}
        downloading={downloadingLectureEvalResults}
        copy={UJAT_LECTURE_EVAL_DOWNLOAD_MODAL_COPY}
        onCancel={() => setLectureEvalDownloadModalOpen(false)}
        onDownload={handleDownloadLectureEvalResults}
      />
      <SurveyResultsDownloadModal
        open={pollDownloadModalOpen}
        downloading={downloadingPollResults}
        copy={UJAT_SURVEY_POLL_DOWNLOAD_MODAL_COPY}
        onCancel={() => setPollDownloadModalOpen(false)}
        onDownload={handleDownloadPollResults}
      />
      <SurveyResultsDownloadModal
        open={satisfactionDownloadModalOpen}
        downloading={downloadingSatisfactionResults}
        copy={UJAT_SATISFACTION_DOWNLOAD_MODAL_COPY}
        onCancel={() => setSatisfactionDownloadModalOpen(false)}
        onDownload={handleDownloadSatisfactionResults}
      />
      <SurveyShareCopyToast
        open={shareToastOpen}
        line1={shareToastLines.line1}
        line2={shareToastLines.line2}
      />
    {surveyTemplateEditId != null ? (
      <UjatSurveyTemplateEditModal
        open={surveyTemplateEditOpen}
        templateId={surveyTemplateEditId}
        onClose={handleCloseSurveyTemplateEdit}
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

    </>
  )
}
