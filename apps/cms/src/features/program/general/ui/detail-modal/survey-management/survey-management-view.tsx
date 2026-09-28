import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Spin } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { handleError } from '@/shared/utils/error-handler'
import { loadFormTemplateVersionDraftByVersionId } from '@/features/template/api/admin-form-templates-service'
import { duplicateWritingTemplate } from '@/features/template/api/duplicate-writing-template'
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
  buildLectureEvalFormDraft,
  canEditLectureEvalResponse,
  draftToLectureEvalPollResponse,
  LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT,
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
import { resolveSurveyWritingDraft } from '@/features/program/shared/lib/survey-management/survey-writing-draft'
import { resolvePublishedDuplicatedSurveyBinding } from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'
import { resolveLectureEvalBindingTarget } from '@/features/program/shared/lib/survey-management/resolve-lecture-eval-binding-target'
import { SurveyEmptyState } from '@/features/program/shared/ui/survey-management/survey-empty-state'
import { SurveyNoResponseState } from '@/features/program/shared/ui/survey-management/survey-no-response-state'
import { SurveyPollResultsView } from '@/features/program/shared/ui/survey-management/survey-poll-results-view'
import { SurveyRegisteredActions } from '@/features/program/shared/ui/survey-management/survey-registered-actions'
import { SatisfactionSurveyView } from '@/features/program/shared/ui/survey-management/satisfaction-survey-view'
import { LectureEvalSurveyView } from '@/features/program/shared/ui/survey-management/lecture-eval-survey-view'
import { SurveyTemplateEditModal } from '@/features/program/shared/ui/survey-management/survey-template-edit-modal'
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
  resolveGeneralSatisfactionAudienceFromNavTab,
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
} from '@/features/program/general/api/admin-general-programs-service'
import {
  resolveSurveyCreateBindingTemplateCode,
  resolveSurveyShareClipboardUrl,
} from '@/features/program/general/api/adapters/program-survey-adapters'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { getGeneralSurveyMenuItems } from '@/features/program/general/lib/detail-meta'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import { buildTempMockSurveyShareUrl } from '@/features/program/general/lib/temp-mock-local-actions'
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
  onEditForm?: () => void
  paragraphBodyOptions?: TemplateWritingUserPreviewSession['paragraphBodyOptions']
}): Promise<TemplateWritingUserPreviewSession | null> {
  const row = findWritingTemplateRowByDefinitionId(args.templateId)
  if (row != null) {
    const entry = lookupTemplateRegistry(row.id)
    if (entry == null || !isSurveyRegistryEntry(entry)) return null
    const draft = args.lecture
      ? await buildLectureEvalFormDraft(row.id)
      : await resolveSurveyWritingDraft(args.templateId, { templateName: row.templateName })
    return {
      draft,
      updateParagraph: () => {},
      headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
      editorKind: 'survey',
      ...(args.paragraphBodyOptions != null
        ? { paragraphBodyOptions: args.paragraphBodyOptions }
        : {}),
      ...(args.onEditForm != null ? { onEditForm: args.onEditForm } : {}),
    }
  }

  const versionId = Number(args.versionId)
  if (!Number.isFinite(versionId) || versionId <= 0) return null
  const record = await loadFormTemplateVersionDraftByVersionId(args.templateId, Math.trunc(versionId))
  if (record?.draft == null) return null
  return {
    draft: record.draft,
    updateParagraph: () => {},
    headerTitle: args.title?.trim() || '설문조사',
    editorKind: 'survey',
    ...(args.paragraphBodyOptions != null ? { paragraphBodyOptions: args.paragraphBodyOptions } : {}),
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

function buildSatisfactionResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '만족도조사'
  return `${safeProgram}_${safeSurvey}_만족도조사결과.pdf`
}

export function GeneralSurveyManagementView({ program, activeTab }: GeneralSurveyManagementViewProps) {
  const isTempMockProgram = isGeneralProgramTempMockProgramId(program.id)
  const initialMock = useMemo(() => buildGeneralSurveyEmptyState(program), [program])
  const {
    registeredSurveys: remoteRegisteredSurveys,
    classifiedBindings,
    loading: surveysLoading,
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
  const [activeSatisfactionAudience, setActiveSatisfactionAudience] = useState(
    () => getDefaultGeneralSatisfactionAudience(program)
  )
  const [pendingSatisfactionAudience, setPendingSatisfactionAudience] =
    useState<GeneralSatisfactionAudienceKey | null>(null)
  const [lectureEvalSurvey, setLectureEvalSurvey] = useState<RegisteredSurvey | null>(() =>
    surveysRemote ? null : initialMock.lectureEvalSurvey
  )
  const [lectureEvalSubmitted, setLectureEvalSubmitted] = useState(
    () => (surveysRemote ? false : initialMock.lectureEvalSubmitted)
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
  const [submitting, setSubmitting] = useState(false)
  const [lectureEvalIncompleteModalOpen, setLectureEvalIncompleteModalOpen] = useState(false)
  const [downloadingLectureEvalResults, setDownloadingLectureEvalResults] = useState(false)
  const [templateEditId, setTemplateEditId] = useState<string | null>(null)
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
  const { openWritingUserPreview, isWritingUserPreviewOpen } = useTemplateWritingPreview()
  const requestPreviewHistoryPush = usePushUserPreviewHistoryWhenOpen(isWritingUserPreviewOpen)
  const { copyText } = useClipboard()
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const surveyMenuEmpty = getGeneralSurveyMenuItems(program).length === 0

  const activeSatisfactionSurveyId =
    satisfactionSurveysByAudience[activeSatisfactionAudience]?.id ?? undefined
  const pollResponseVersionId = activeTab === 'survey' ? activeRegisteredSurveyId ?? undefined : undefined
  const satisfactionResponseVersionId = isGeneralSatisfactionSurveyNavTab(activeTab)
    ? activeSatisfactionSurveyId
    : undefined
  const lectureResponseVersionId =
    activeTab === 'lecture_evaluation' ? lectureEvalSurvey?.id : undefined

  const {
    pollResponses: remotePollResponses,
    loading: pollResponsesLoading,
    isRemoteDataSource: pollResponsesRemote,
  } = useGeneralProgramSurveyResponses(program.id, pollResponseVersionId)
  const {
    pollResponses: remoteSatisfactionResponses,
    isRemoteDataSource: satisfactionResponsesRemote,
  } = useGeneralProgramSurveyResponses(program.id, satisfactionResponseVersionId)
  const {
    pollResponses: remoteLectureResponses,
    isRemoteDataSource: lectureResponsesRemote,
  } = useGeneralProgramSurveyResponses(program.id, lectureResponseVersionId)
  const { totalResponseCount: remotePollSummaryCount } = useGeneralProgramSurveySummary(
    program.id,
    pollResponseVersionId
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
    const nextSatisfaction: Partial<Record<GeneralSatisfactionAudienceKey, RegisteredSurvey>> = {}
    let nextLecture: RegisteredSurvey | null = null
    const fallbackSatisfactionAudience = getDefaultGeneralSatisfactionAudience(program)
    for (const item of classifiedBindings) {
      if (item.kind === 'satisfaction') {
        const audience = item.satisfactionAudience ?? fallbackSatisfactionAudience
        nextSatisfaction[audience] = item.survey
      }
      if (item.kind === 'lecture_evaluation') {
        nextLecture = item.survey
      }
    }
    setSatisfactionSurveysByAudience(nextSatisfaction)
    setLectureEvalSurvey(nextLecture)
  }, [classifiedBindings, program, surveysRemote])

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
      return remoteSurveyRows.map(row => ({
        label: row.templateName,
        value: row.id,
      }))
    }
    return getSurveyWritingTemplateSelectOptions()
  }, [remoteSurveyRows])
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
  const showSatisfactionAudienceTabs =
    !isInstitutionTeacherOnlySatisfaction && satisfactionAudienceTabs.length > 0
  const activeSatisfactionSurvey = satisfactionSurveysByAudience[activeSatisfactionAudience] ?? null

  const pollResponses = useMemo((): SurveyPollRawResponse[] => {
    if (pollResponsesRemote) return remotePollResponses ?? []
    return buildGeneralSurveyEmptyState(program).responses
  }, [pollResponsesRemote, program, remotePollResponses])

  const satisfactionResponses = useMemo((): SurveyPollRawResponse[] => {
    if (satisfactionResponsesRemote) return remoteSatisfactionResponses ?? []
    return pollResponses
  }, [pollResponses, remoteSatisfactionResponses, satisfactionResponsesRemote])

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

  useEffect(() => {
    if (!lectureResponsesRemote) return
    if (remoteLectureResponses && remoteLectureResponses.length > 0) {
      setLectureEvalResponses(remoteLectureResponses)
      setLectureEvalSubmitted(true)
    }
  }, [lectureResponsesRemote, remoteLectureResponses])

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
    ids: { templateId: number; templateVersionId?: number },
    audience?: GeneralSatisfactionAudienceKey | null
  ): ProgramFormBindingRequest {
    const formType =
      kind === 'satisfaction' ? 'SATISFACTION' : kind === 'lecture' ? 'LECTURE_EVALUATION' : 'SURVEY'
    const targetRole =
      kind === 'satisfaction' && audience
        ? audience === 'teacher'
          ? 'TEACHER'
          : audience === 'student'
            ? 'STUDENT'
            : audience === 'volunteer_h1'
              ? 'VOLUNTEER_H1'
              : audience === 'volunteer_h2'
                ? 'VOLUNTEER_H2'
                : 'INDIVIDUAL'
        : kind === 'lecture'
          ? 'ADMIN'
          : undefined
    return {
      formType,
      templateId: ids.templateId,
      templateVersionId: ids.templateVersionId,
      targetRole,
      active: true,
      required: false,
    }
  }

  const openTemplatePreview = useCallback(
    (
      survey: Pick<RegisteredSurvey, 'id' | 'templateId' | 'title'>,
      options?: {
        allowEdit?: boolean
        lecture?: boolean
        paragraphBodyOptions?: TemplateWritingUserPreviewSession['paragraphBodyOptions']
      }
    ) => {
      const catalogRow = findWritingTemplateRowByDefinitionId(survey.templateId)
      const onEditForm =
        options?.allowEdit === true && catalogRow != null
          ? () => setTemplateEditId(survey.templateId)
          : undefined
      void buildPreviewSession({
        templateId: survey.templateId,
        title: survey.title,
        versionId: survey.id,
        lecture: options?.lecture,
        onEditForm,
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
          openWritingUserPreview(session)
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
    [openWritingUserPreview, requestPreviewHistoryPush, showAlert]
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
      if (kind === 'satisfaction' && satisfactionAudience != null) {
        setPendingSatisfactionAudience(satisfactionAudience)
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
  }, [submitting])

  const submitCreateModal = useCallback(async () => {
    if (createModalKind == null || selectedTemplateId == null || selectedTemplateId === '') return
    setSubmitting(true)
    try {
      const { newTemplateId } = await duplicateWritingTemplate({
        sourceTemplateId: selectedTemplateId,
        category: 'survey',
      })
      const row = findWritingTemplateRowByDefinitionId(newTemplateId)
      const templateCode = resolveSurveyCreateBindingTemplateCode({
        duplicatedTemplateId: newTemplateId,
        catalogTemplateCode: row?.id,
      })

      if (surveysRemote) {
        const resolved = await resolvePublishedDuplicatedSurveyBinding(templateCode)
        if (resolved == null) {
          void showAlert({
            title: '등록 실패',
            content:
              '선택한 템플릿의 서버 ID를 찾지 못했습니다. 양식 관리에서 템플릿을 동기화한 뒤 다시 시도해 주세요.',
          })
          return
        }
        const payload = buildFormBindingPayload(
          createModalKind,
          resolved,
          pendingSatisfactionAudience
        )
        if (createModalKind === 'lecture') {
          const lectureTarget = await resolveLectureEvalBindingTarget(String(program.id))
          if (lectureTarget == null) {
            void showAlert({
              title: '등록 실패',
              content:
                '강의평가는 교육 일정(회차)에 연결해야 합니다. 프로그램 일정을 먼저 등록한 뒤 다시 시도해 주세요.',
            })
            return
          }
          payload.targetScope = lectureTarget.targetScope
          payload.targetScopeId = lectureTarget.targetScopeId
        }
        const result = await createBinding(payload)
        if (!result.ok) {
          await invalidateSurveyCaches()
          void showAlert({ title: '등록 실패', content: result.message })
          return
        }
        setCreateModalKind(null)
        return
      }

      if (isTempMockProgram) {
        const row = findWritingTemplateRowByDefinitionId(newTemplateId)
        const titleBase = row?.templateName ?? '설문조사'
        if (createModalKind === 'survey') {
          const surveyIndex = registeredSurveys.length + 1
          const newSurvey: RegisteredSurvey = {
            id: `temp-mock-org-survey-poll-${Date.now()}`,
            title: `${titleBase} ${String(surveyIndex).padStart(2, '0')}`,
            templateId: newTemplateId,
            status: 'before_start',
            responseCount: 0,
            participantTotal: program.totalParticipants ?? 0,
          }
          setRegisteredSurveys(prev => [...prev, newSurvey])
          setActiveRegisteredSurveyId(newSurvey.id)
        } else if (createModalKind === 'satisfaction' && pendingSatisfactionAudience != null) {
          const newSurvey: RegisteredSurvey = {
            id: `temp-mock-org-survey-satisfaction-${pendingSatisfactionAudience}-${Date.now()}`,
            title: `${titleBase} (${getGeneralSatisfactionAudienceLabel(pendingSatisfactionAudience)})`,
            templateId:
              newTemplateId ||
              GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE[pendingSatisfactionAudience],
            status: 'before_start',
            responseCount: 0,
            participantTotal: program.totalParticipants ?? 0,
          }
          setSatisfactionSurveysByAudience(prev => ({
            ...prev,
            [pendingSatisfactionAudience]: newSurvey,
          }))
        } else if (createModalKind === 'lecture') {
          setLectureEvalSurvey({
            id: `temp-mock-org-survey-lecture-${Date.now()}`,
            title: titleBase,
            templateId: newTemplateId,
            status: 'before_start',
            responseCount: 0,
            participantTotal: 1,
          })
        }
        setCreateModalKind(null)
        return
      }

      notifyProgramApiUnavailable(
        'general-survey-create-binding',
        '설문 관리 · 설문 등록'
      )
      setCreateModalKind(null)
    } catch (error) {
      handleError(error, { context: 'generalSurveyManagement.createSurvey' })
      void showAlert({
        title: '등록 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '설문 등록에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    } finally {
      setSubmitting(false)
    }
  }, [
    createBinding,
    createModalKind,
    invalidateSurveyCaches,
    individualProgram,
    isTempMockProgram,
    pendingSatisfactionAudience,
    program.id,
    program.totalParticipants,
    registeredSurveys.length,
    selectedTemplateId,
    showAlert,
    surveysRemote,
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
          current === activeRegisteredSurvey.id ? next[0]?.id ?? null : current
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
      if (isTempMockProgram) {
        void copyText(buildTempMockSurveyShareUrl(program.id, survey.id))
        showShareCopyToast()
        return
      }
      const bindingId = survey.bindingId?.trim()
      if (!bindingId) {
        notifyProgramApiUnavailable(
          'general-survey-share-link',
          '설문 관리 · 설문 공유'
        )
        return
      }
      try {
        const response = await createGeneralProgramSurveyShareLink(program.id, bindingId)
        const url = response
          ? resolveSurveyShareClipboardUrl(response, window.location.origin)
          : null
        if (!url) {
          notifyProgramApiUnavailable(
            'general-survey-share-link-empty',
            '설문 관리 · 설문 공유'
          )
          return
        }
        void copyText(url)
        showShareCopyToast()
      } catch (error) {
        handleError(error, { context: 'generalSurveyShareLink' })
        showAlert({
          title: '공유',
          content: '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [copyText, isTempMockProgram, program.id, showAlert, showShareCopyToast]
  )

  const shareSatisfactionSurveyUrl = useCallback(
    async (audience: GeneralSatisfactionAudienceKey) => {
      const survey = satisfactionSurveysByAudience[audience]
      if (isTempMockProgram && survey) {
        void copyText(buildTempMockSurveyShareUrl(program.id, survey.id))
        showShareCopyToast(GENERAL_SATISFACTION_SHARE_TOAST_COPY)
        return
      }
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
        const url = response
          ? resolveSurveyShareClipboardUrl(response, window.location.origin)
          : null
        if (!url) {
          notifyProgramApiUnavailable(
            'general-satisfaction-share-link-empty',
            '설문 관리 · 만족도조사 공유'
          )
          return
        }
        void copyText(url)
        showShareCopyToast(GENERAL_SATISFACTION_SHARE_TOAST_COPY)
      } catch (error) {
        handleError(error, { context: 'generalSatisfactionShareLink' })
        showAlert({
          title: '공유',
          content: '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [copyText, isTempMockProgram, program.id, satisfactionSurveysByAudience, showAlert, showShareCopyToast]
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
            responseCount: activeSatisfactionSurvey.responseCount,
            participantTotal: activeSatisfactionSurvey.participantTotal,
            responses: satisfactionResponses,
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
    [activeSatisfactionSurvey, program.title, satisfactionResponses, showAlert]
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
            responseCount: activeRegisteredSurvey.responseCount,
            participantTotal: activeRegisteredSurvey.participantTotal,
            responses: pollResponses,
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
    [activeRegisteredSurvey, pollResponses, program.title, showAlert]
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
      try {
        await submitGeneralProgramFormResponse({
          templateVersionId,
          programId: programIdNum,
          contextType: 'PROGRAM',
          answers: pollResponse.answers,
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.surveyResponses(
            String(program.id),
            String(templateVersionId)
          ),
        })
      } catch (error) {
        handleError(error, { context: 'generalLectureEvalSubmit' })
        void showAlert({
          title: '제출 실패',
          content: '강의평가 제출 중 오류가 발생했습니다. 다시 시도해 주세요.',
        })
        return
      }
    }

    setLectureEvalSubmitted(true)
    setLectureEvalResponses([pollResponse])
    setLectureEvalSurvey(prev => {
      if (prev == null) return prev
      const nextStatus =
        LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT && prev.status === 'in_progress'
          ? 'finished'
          : prev.status
      return {
        ...prev,
        status: nextStatus,
        responseCount: 1,
        participantTotal: Math.max(prev.participantTotal, 1),
      }
    })
  }, [lectureEvalSurvey, program.id, queryClient, showAlert, surveysRemote])

  const handleLectureEvalTabChange = useCallback(
    (tab: LectureEvalTabKey) => {
      if (tab === 'results' && lectureEvalSurvey?.status !== 'finished') {
        setLectureEvalIncompleteModalOpen(true)
        return
      }
      setActiveLectureEvalTab(tab)
    },
    [lectureEvalSurvey?.status]
  )

  const handleLectureEvalPreview = useCallback(() => {
    if (lectureEvalSurvey == null) return
    openTemplatePreview(lectureEvalSurvey, {
      allowEdit: lectureEvalSurvey.status === 'before_start',
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
          await exportLectureEvalResultsPdf(
            root,
            buildLectureEvalResultsPdfFileName(program.title)
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
        handleError(error, { context: 'generalLectureEvalResultsDownload' })
        showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingLectureEvalResults(false)
      }
    },
    [lectureEvalResponses, lectureEvalSurvey, program.title, showAlert]
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
                survey={activeRegisteredSurvey}
                labels={GENERAL_SURVEY_POLL_ACTION_LABELS}
                onShareClick={() => shareRegisteredSurveyUrl(activeRegisteredSurvey)}
                onAddClick={() => openCreateModal('survey')}
                onOpenTemplatePreview={() =>
                  openTemplatePreview(activeRegisteredSurvey, {
                    allowEdit: activeRegisteredSurvey.status === 'before_start',
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
        ) : activeRegisteredSurvey != null && activeRegisteredSurvey.responseCount === 0 ? (
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
              openTemplatePreview(activeRegisteredSurvey, { allowEdit: true })
            }
          />
        ) : activeRegisteredSurvey != null ? (
          <div ref={pollResultsExportRef}>
            <SurveyPollResultsView
              templateId={activeRegisteredSurvey.templateId}
              responseCount={activeRegisteredSurvey.responseCount}
              participantTotal={activeRegisteredSurvey.participantTotal}
              responses={pollResponses}
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
      ? `신규 ${getGeneralSatisfactionAudienceLabel(pendingSatisfactionAudience)} 만족도조사 등록`
      : createModalKind === 'lecture'
        ? GENERAL_LECTURE_EVAL_REGISTER_MODAL_COPY.title
        : '신규 설문조사 등록'
  const createDescription =
    createModalKind === 'satisfaction' && pendingSatisfactionAudience != null
      ? getGeneralSatisfactionCreateDescription(pendingSatisfactionAudience)
      : createModalKind === 'lecture'
        ? GENERAL_LECTURE_EVAL_REGISTER_MODAL_COPY.description
        : '새로운 설문조사를 진행하시겠습니까?\n설문조사 신규 등록을 위해 사용할 템플릿 유형을 선택해 주세요.'

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
      surveysByAudience={satisfactionSurveysByAudience}
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
        const survey = satisfactionSurveysByAudience[activeSatisfactionAudience]
        if (survey?.status !== 'before_start') return
        setDeleteConfirmWord('')
        setDeleteModalKind('satisfaction')
      }}
      onOpenTemplatePreview={() => {
        const survey = satisfactionSurveysByAudience[activeSatisfactionAudience]
        if (survey != null) {
          openTemplatePreview(survey, {
            allowEdit: survey.status === 'before_start',
          })
        }
      }}
      onDownloadClick={() => setSatisfactionDownloadModalOpen(true)}
      resultsExportRef={satisfactionResultsExportRef}
      resultsResponses={satisfactionResponses}
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
          survey={lectureEvalSurvey}
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
        />
        )
      ) : null}

      <ContentModal
        open={createModalKind != null}
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
              width={120}
              type="button"
              onClick={closeCreateModal}
              disabled={submitting}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              width={120}
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
        <div className="survey-management-create-modal__field">
          <p className="survey-management-create-modal__label">템플릿 유형</p>
          <CmsSelect
            width="100%"
            withAllOption={false}
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
            : activeRegisteredSurvey?.title ?? '설문조사'
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
              width={120}
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
              width={120}
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
            width={120}
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

      <SurveyResultsDownloadModal
        open={pollDownloadModalOpen}
        downloading={downloadingPollResults}
        onCancel={() => setPollDownloadModalOpen(false)}
        onDownload={handleDownloadPollResults}
      />

      <SurveyResultsDownloadModal
        open={satisfactionDownloadModalOpen}
        downloading={downloadingSatisfactionResults}
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
