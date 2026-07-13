import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { handleError } from '@/shared/utils/error-handler'
import { duplicateWritingTemplate } from '@/features/template/api/duplicate-writing-template'
import { useClipboard } from '@/features/template/hooks/use-clipboard'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { getSurveyWritingTemplateSelectOptions } from '@/features/program/shared/lib/survey-management/survey-template-options'
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
  GENERAL_SURVEY_POLL_EMPTY_COPY,
  GENERAL_SURVEY_POLL_NO_RESPONSE_COPY,
  GENERAL_SURVEY_POLL_SHARE_TOAST_COPY,
} from '@/features/program/shared/lib/survey-management/survey-copy'
import type {
  RegisteredSurvey,
  SurveyPollRawResponse,
} from '@/features/program/shared/lib/survey-management/survey-management-types'
import { resolveSurveyWritingDraft } from '@/features/program/shared/lib/survey-management/survey-writing-draft'
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
import { buildGeneralSurveyMockState } from './survey-mock'
import { useGeneralProgramSurveys } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import './survey-management.css'

type CreateModalKind = 'survey' | 'satisfaction' | 'lecture'
type DeleteModalKind = 'survey' | 'satisfaction'

export type GeneralSurveyManagementViewProps = {
  program: Program
  activeTab: string
}

function buildPreviewSession(templateId: string, onEditForm?: () => void) {
  const row = findWritingTemplateRowByDefinitionId(templateId)
  if (row == null) return null
  const entry = lookupTemplateRegistry(row.id)
  if (entry == null || !isSurveyRegistryEntry(entry)) return null
  return {
    draft: resolveSurveyWritingDraft(templateId, { templateName: row.templateName }),
    updateParagraph: () => {},
    headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
    editorKind: 'survey' as const,
    ...(onEditForm != null ? { onEditForm } : {}),
  }
}

function buildSurveyPollResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '설문조사'
  return `${safeProgram}_${safeSurvey}_설문조사결과.pdf`
}

function buildSatisfactionResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '만족도조사'
  return `${safeProgram}_${safeSurvey}_만족도조사결과.pdf`
}

export function GeneralSurveyManagementView({ program, activeTab }: GeneralSurveyManagementViewProps) {
  const initialMock = useMemo(() => buildGeneralSurveyMockState(program), [program])
  const { registeredSurveys: remoteRegisteredSurveys } = useGeneralProgramSurveys(program.id)
  const [registeredSurveys, setRegisteredSurveys] = useState(initialMock.registeredSurveys)
  const [activeRegisteredSurveyId, setActiveRegisteredSurveyId] = useState<string | null>(
    initialMock.activeRegisteredSurveyId
  )
  const [satisfactionSurveysByAudience, setSatisfactionSurveysByAudience] = useState(
    initialMock.satisfactionSurveysByAudience
  )
  const [activeSatisfactionAudience, setActiveSatisfactionAudience] = useState(
    () => getDefaultGeneralSatisfactionAudience(program)
  )
  const [pendingSatisfactionAudience, setPendingSatisfactionAudience] =
    useState<GeneralSatisfactionAudienceKey | null>(null)
  const [lectureEvalSurvey, setLectureEvalSurvey] = useState<RegisteredSurvey | null>(
    initialMock.lectureEvalSurvey
  )
  const [lectureEvalSubmitted, setLectureEvalSubmitted] = useState(false)
  const [lectureEvalFormDraft, setLectureEvalFormDraft] = useState<WritingFormDraft | null>(null)
  const [lectureEvalResponses, setLectureEvalResponses] = useState<SurveyPollRawResponse[]>([])
  const [activeLectureEvalTab, setActiveLectureEvalTab] = useState<LectureEvalTabKey>('eval')
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
  const { openWritingUserPreview } = useTemplateWritingPreview()
  const { copyText } = useClipboard()
  const { showAlert } = useCmsAlert()

  useEffect(() => {
    const next = buildGeneralSurveyMockState(program)
    setRegisteredSurveys(next.registeredSurveys)
    setActiveRegisteredSurveyId(next.activeRegisteredSurveyId)
    setSatisfactionSurveysByAudience(next.satisfactionSurveysByAudience)
    setPendingSatisfactionAudience(null)
    setActiveSatisfactionAudience(getDefaultGeneralSatisfactionAudience(program))
    setLectureEvalSurvey(next.lectureEvalSurvey)
    setLectureEvalSubmitted(false)
    setLectureEvalFormDraft(null)
    setLectureEvalResponses([])
    setActiveLectureEvalTab('eval')
  }, [program])

  useEffect(() => {
    if (!remoteRegisteredSurveys || remoteRegisteredSurveys.length === 0) return
    setRegisteredSurveys(remoteRegisteredSurveys)
    setActiveRegisteredSurveyId(prev => prev ?? remoteRegisteredSurveys[0]?.id ?? null)
  }, [remoteRegisteredSurveys])

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

  const surveyTemplateOptions = useMemo(() => getSurveyWritingTemplateSelectOptions(), [])
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
  const pollResponses = useMemo(() => buildGeneralSurveyMockState(program).responses, [program])
  const satisfactionResponses = pollResponses

  useEffect(() => {
    if (lectureEvalSurvey == null) {
      setLectureEvalFormDraft(null)
      setLectureEvalResponses([])
      setLectureEvalSubmitted(false)
      setActiveLectureEvalTab('eval')
      return
    }
    if (lectureEvalSurvey.status === 'in_progress' || lectureEvalSurvey.status === 'finished') {
      setLectureEvalFormDraft(prev => prev ?? buildLectureEvalFormDraft(lectureEvalSurvey.templateId))
    }
  }, [lectureEvalSurvey])

  const openTemplatePreview = useCallback(
    (templateId: string, options?: { allowEdit?: boolean }) => {
      const onEditForm =
        options?.allowEdit === true ? () => setTemplateEditId(templateId) : undefined
      const session = buildPreviewSession(templateId, onEditForm)
      if (session != null) openWritingUserPreview(session)
    },
    [openWritingUserPreview]
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
        setSelectedTemplateId(GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE[satisfactionAudience])
      } else if (kind === 'lecture') {
        setPendingSatisfactionAudience(null)
        setSelectedTemplateId(LECTURE_EVAL_TEMPLATE_ID)
      } else {
        setPendingSatisfactionAudience(null)
        setSelectedTemplateId(null)
      }
      setCreateModalKind(kind)
    },
    []
  )

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
      if (row != null && createModalKind === 'survey') {
        const nextSurvey: RegisteredSurvey = {
          id: `general-survey-${Date.now()}`,
          title: `${row.templateName} ${registeredSurveys.length + 1}`,
          templateId: row.id,
          status: 'before_start',
          responseCount: 0,
          participantTotal: individualProgram ? 12 : 36,
        }
        setRegisteredSurveys(prev => [...prev, nextSurvey])
        setActiveRegisteredSurveyId(nextSurvey.id)
      }
      if (row != null && createModalKind === 'satisfaction' && pendingSatisfactionAudience != null) {
        const audienceLabel = getGeneralSatisfactionAudienceLabel(pendingSatisfactionAudience)
        const nextSurvey: RegisteredSurvey = {
          id: `general-satisfaction-${pendingSatisfactionAudience}-${Date.now()}`,
          title: `${audienceLabel} 만족도조사`,
          templateId: row.id,
          status: 'before_start',
          responseCount: 0,
          participantTotal: individualProgram ? 12 : 36,
        }
        setSatisfactionSurveysByAudience(prev => ({
          ...prev,
          [pendingSatisfactionAudience]: nextSurvey,
        }))
      }
      if (row != null && createModalKind === 'lecture') {
        const nextSurvey: RegisteredSurvey = {
          id: `general-lecture-eval-${Date.now()}`,
          title: row.templateName,
          templateId: row.id,
          status: 'before_start',
          responseCount: 0,
          participantTotal: 1,
        }
        setLectureEvalSurvey(nextSurvey)
        setLectureEvalSubmitted(false)
        setLectureEvalResponses([])
        setActiveLectureEvalTab('eval')
        setLectureEvalFormDraft(null)
      }
      setCreateModalKind(null)
    } catch (error) {
      handleError(error, { context: 'generalSurveyManagement.createSurvey' })
    } finally {
      setSubmitting(false)
    }
  }, [
    createModalKind,
    individualProgram,
    pendingSatisfactionAudience,
    registeredSurveys.length,
    selectedTemplateId,
  ])

  const confirmDelete = useCallback(() => {
    if (deleteConfirmWord.trim() !== '삭제') return
    if (deleteModalKind === 'survey' && activeRegisteredSurvey != null) {
      if (activeRegisteredSurvey.status !== 'before_start') return
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
    deleteConfirmWord,
    deleteModalKind,
  ])

  const shareRegisteredSurveyUrl = useCallback(
    (survey: RegisteredSurvey) => {
      const url = `${window.location.origin}/programs/general/survey?programId=${program.id}&surveyId=${survey.id}`
      void copyText(url)
      showShareCopyToast()
    },
    [copyText, program.id, showShareCopyToast]
  )

  const shareSatisfactionSurveyUrl = useCallback(
    (audience: GeneralSatisfactionAudienceKey) => {
      const url = `${window.location.origin}/programs/general/satisfaction?programId=${program.id}&audience=${audience}`
      void copyText(url)
      showShareCopyToast(GENERAL_SATISFACTION_SHARE_TOAST_COPY)
    },
    [copyText, program.id, showShareCopyToast]
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

  const handleLectureEvalSubmit = useCallback(() => {
    if (lectureEvalSurvey == null || lectureEvalFormDraft == null) return
    const validation = validateLectureEvalFormDraft(lectureEvalFormDraft)
    if (!validation.valid) {
      void showAlert({ title: '입력 확인', content: validation.message })
      return
    }

    setLectureEvalSubmitted(true)
    setLectureEvalResponses([draftToLectureEvalPollResponse(lectureEvalFormDraft)])
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
  }, [lectureEvalFormDraft, lectureEvalSurvey, showAlert])

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
    const row = findWritingTemplateRowByDefinitionId(lectureEvalSurvey.templateId)
    if (row == null) return
    const entry = lookupTemplateRegistry(row.id)
    if (entry == null || !isSurveyRegistryEntry(entry)) return
    openWritingUserPreview({
      draft: buildLectureEvalFormDraft(row.id),
      updateParagraph: () => {},
      headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
      editorKind: 'survey',
      paragraphBodyOptions: LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
      ...(lectureEvalSurvey.status === 'before_start'
        ? { onEditForm: () => setTemplateEditId(row.id) }
        : {}),
    })
  }, [lectureEvalSurvey, openWritingUserPreview])

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

  const renderPoll = () =>
    registeredSurveys.length === 0 ? (
      <SurveyEmptyState
        title={GENERAL_SURVEY_POLL_EMPTY_COPY.title}
        description={GENERAL_SURVEY_POLL_EMPTY_COPY.description}
        registerButtonLabel={GENERAL_SURVEY_POLL_EMPTY_COPY.registerButton}
        onRegisterClick={() => openCreateModal('survey')}
      />
    ) : (
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
                  openTemplatePreview(activeRegisteredSurvey.templateId, {
                    allowEdit: activeRegisteredSurvey.status === 'before_start',
                  })
                }
                onDownloadClick={() => setPollDownloadModalOpen(true)}
              />
            ) : null
          }
        />
        {activeRegisteredSurvey != null && activeRegisteredSurvey.responseCount === 0 ? (
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
              openTemplatePreview(activeRegisteredSurvey.templateId, { allowEdit: true })
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

  const renderEmptyMain = () => (
    <SurveyEmptyState
      title={GENERAL_SURVEY_POLL_EMPTY_COPY.title}
      description={GENERAL_SURVEY_POLL_EMPTY_COPY.description}
      registerButtonLabel={GENERAL_SURVEY_POLL_EMPTY_COPY.registerButton}
      onRegisterClick={() => openCreateModal('survey')}
    />
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

  const renderSatisfactionView = () => (
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
          openTemplatePreview(survey.templateId, {
            allowEdit: survey.status === 'before_start',
          })
        }
      }}
      onDownloadClick={() => setSatisfactionDownloadModalOpen(true)}
      resultsExportRef={satisfactionResultsExportRef}
      resultsResponses={satisfactionResponses}
    />
  )

  return (
    <>
      {activeTab === 'survey' ? renderPoll() : null}
      {isGeneralSatisfactionSurveyNavTab(activeTab) && satisfactionAudienceTabs.length > 0
        ? renderSatisfactionView()
        : null}
      {activeTab === 'lecture_evaluation' ? (
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
          onFormDraftChange={setLectureEvalFormDraft}
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
      ) : null}
      {activeTab === 'main' ? renderEmptyMain() : null}

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
              disabled={deleteConfirmWord.trim() !== '삭제'}
              onClick={confirmDelete}
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
