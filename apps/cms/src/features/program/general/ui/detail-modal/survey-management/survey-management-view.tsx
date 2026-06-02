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
import { getSurveyWritingTemplateSelectOptions } from '@/features/program/ujat/ui/detail-modal/survey-management/lib/ujat-survey-template-options'
import {
  buildLectureEvalFormDraft,
  canEditLectureEvalResponse,
  draftToLectureEvalPollResponse,
  UJAT_LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT,
  UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
  UJAT_LECTURE_EVAL_TEMPLATE_ID,
  validateLectureEvalFormDraft,
  type UjatLectureEvalTabKey,
} from '@/features/program/ujat/ui/detail-modal/survey-management/lib/ujat-lecture-eval-survey'
import {
  UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY,
  UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY,
} from '@/features/program/ujat/ui/detail-modal/survey-management/lib/ujat-survey-copy'
import {
  buildLectureEvalResultsPdfFileName,
  exportLectureEvalResultsPdf,
} from '@/features/program/ujat/ui/detail-modal/survey-management/lib/export-lecture-eval-results-pdf'
import { UjatLectureEvalSurveyView } from '@/features/program/ujat/ui/detail-modal/survey-management/ui/ujat-lecture-eval-survey-view'
import type { Program } from '@/types/domain'
import {
  GENERAL_SATISFACTION_ACTION_LABELS,
  GENERAL_SATISFACTION_EMPTY_COPY,
  GENERAL_SATISFACTION_NO_RESPONSE_COPY,
  GENERAL_SURVEY_POLL_ACTION_LABELS,
  GENERAL_SURVEY_POLL_EMPTY_COPY,
  GENERAL_SURVEY_POLL_NO_RESPONSE_COPY,
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
import { SurveyTemplateEditModal } from '@/features/program/shared/ui/survey-management/survey-template-edit-modal'
import {
  GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE,
  getDefaultGeneralSatisfactionAudience,
  getGeneralSatisfactionAudienceLabel,
  getGeneralSatisfactionAudienceTabs,
  isGeneralIndividualProgram,
  type GeneralSatisfactionAudienceKey,
} from '@/features/program/general/lib/survey-audience'
import { buildGeneralSurveyMockState } from './survey-mock'
import './survey-management.css'

type CreateModalKind = 'survey' | 'satisfaction' | 'lecture'
type DeleteModalKind = 'survey' | 'satisfaction'

export type GeneralSurveyManagementViewProps = {
  program: Program
  activeTab: string
}

function buildPreviewSession(templateId: string, onEditForm: () => void) {
  const row = findWritingTemplateRowByDefinitionId(templateId)
  if (row == null) return null
  const entry = lookupTemplateRegistry(row.id)
  if (entry == null || !isSurveyRegistryEntry(entry)) return null
  return {
    draft: resolveSurveyWritingDraft(templateId, { templateName: row.templateName }),
    updateParagraph: () => {},
    headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
    editorKind: 'survey' as const,
    onEditForm,
  }
}

export function GeneralSurveyManagementView({ program, activeTab }: GeneralSurveyManagementViewProps) {
  const initialMock = useMemo(() => buildGeneralSurveyMockState(program), [program])
  const [registeredSurveys, setRegisteredSurveys] = useState(initialMock.registeredSurveys)
  const [activeRegisteredSurveyId, setActiveRegisteredSurveyId] = useState<string | null>(
    initialMock.activeRegisteredSurveyId
  )
  const [satisfactionSurveysByAudience, setSatisfactionSurveysByAudience] = useState(
    initialMock.satisfactionSurveysByAudience
  )
  const [activeSatisfactionAudience, setActiveSatisfactionAudience] =
    useState<GeneralSatisfactionAudienceKey>(() => getDefaultGeneralSatisfactionAudience(program))
  const [lectureEvalSurvey, setLectureEvalSurvey] = useState<RegisteredSurvey | null>(
    initialMock.lectureEvalSurvey
  )
  const [lectureEvalSubmitted, setLectureEvalSubmitted] = useState(false)
  const [lectureEvalFormDraft, setLectureEvalFormDraft] = useState<WritingFormDraft | null>(null)
  const [lectureEvalResponses, setLectureEvalResponses] = useState<SurveyPollRawResponse[]>([])
  const [activeLectureEvalTab, setActiveLectureEvalTab] = useState<UjatLectureEvalTabKey>('eval')
  const [createModalKind, setCreateModalKind] = useState<CreateModalKind | null>(null)
  const [deleteModalKind, setDeleteModalKind] = useState<DeleteModalKind | null>(null)
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [lectureEvalIncompleteModalOpen, setLectureEvalIncompleteModalOpen] = useState(false)
  const [downloadingLectureEvalResults, setDownloadingLectureEvalResults] = useState(false)
  const [templateEditId, setTemplateEditId] = useState<string | null>(null)
  const lectureEvalResultsExportRef = useRef<HTMLDivElement>(null)
  const { openWritingUserPreview } = useTemplateWritingPreview()
  const { copyText } = useClipboard()
  const { showAlert } = useCmsAlert()

  useEffect(() => {
    const next = buildGeneralSurveyMockState(program)
    setRegisteredSurveys(next.registeredSurveys)
    setActiveRegisteredSurveyId(next.activeRegisteredSurveyId)
    setSatisfactionSurveysByAudience(next.satisfactionSurveysByAudience)
    setActiveSatisfactionAudience(getDefaultGeneralSatisfactionAudience(program))
    setLectureEvalSurvey(next.lectureEvalSurvey)
    setLectureEvalSubmitted(false)
    setLectureEvalFormDraft(null)
    setLectureEvalResponses([])
    setActiveLectureEvalTab('eval')
  }, [program])

  const surveyTemplateOptions = useMemo(() => getSurveyWritingTemplateSelectOptions(), [])
  const activeRegisteredSurvey = useMemo(
    () => registeredSurveys.find(item => item.id === activeRegisteredSurveyId) ?? null,
    [registeredSurveys, activeRegisteredSurveyId]
  )
  const audienceTabs = useMemo(() => getGeneralSatisfactionAudienceTabs(program), [program])
  const activeSatisfactionSurvey = satisfactionSurveysByAudience[activeSatisfactionAudience] ?? null
  const individualProgram = isGeneralIndividualProgram(program)

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
    (templateId: string) => {
      const session = buildPreviewSession(templateId, () => setTemplateEditId(templateId))
      if (session != null) openWritingUserPreview(session)
    },
    [openWritingUserPreview]
  )

  const openCreateModal = useCallback(
    (kind: CreateModalKind) => {
      setSubmitting(false)
      if (kind === 'satisfaction') {
        setSelectedTemplateId(GENERAL_SATISFACTION_TEMPLATE_BY_AUDIENCE[activeSatisfactionAudience])
      } else if (kind === 'lecture') {
        setSelectedTemplateId(UJAT_LECTURE_EVAL_TEMPLATE_ID)
      } else {
        setSelectedTemplateId(null)
      }
      setCreateModalKind(kind)
    },
    [activeSatisfactionAudience]
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
      if (row != null && createModalKind === 'satisfaction') {
        const audienceLabel = getGeneralSatisfactionAudienceLabel(activeSatisfactionAudience)
        const nextSurvey: RegisteredSurvey = {
          id: `general-satisfaction-${activeSatisfactionAudience}-${Date.now()}`,
          title: `${audienceLabel} 만족도조사`,
          templateId: row.id,
          status: 'before_start',
          responseCount: 0,
          participantTotal: individualProgram ? 12 : 36,
        }
        setSatisfactionSurveysByAudience(prev => ({
          ...prev,
          [activeSatisfactionAudience]: nextSurvey,
        }))
      }
      if (row != null && createModalKind === 'lecture') {
        const nextSurvey: RegisteredSurvey = {
          id: `general-lecture-eval-${Date.now()}`,
          title: row.templateName,
          templateId: row.id,
          status: 'in_progress',
          responseCount: 0,
          participantTotal: 1,
        }
        setLectureEvalSurvey(nextSurvey)
        setLectureEvalSubmitted(false)
        setLectureEvalResponses([])
        setActiveLectureEvalTab('eval')
        setLectureEvalFormDraft(buildLectureEvalFormDraft(row.id))
      }
      setCreateModalKind(null)
    } catch (error) {
      handleError(error, { context: 'generalSurveyManagement.createSurvey' })
    } finally {
      setSubmitting(false)
    }
  }, [
    activeSatisfactionAudience,
    createModalKind,
    individualProgram,
    registeredSurveys.length,
    selectedTemplateId,
  ])

  const confirmDelete = useCallback(() => {
    if (deleteConfirmWord.trim() !== '삭제') return
    if (deleteModalKind === 'survey' && activeRegisteredSurvey != null) {
      setRegisteredSurveys(prev => {
        const next = prev.filter(item => item.id !== activeRegisteredSurvey.id)
        setActiveRegisteredSurveyId(current =>
          current === activeRegisteredSurvey.id ? next[0]?.id ?? null : current
        )
        return next
      })
    }
    if (deleteModalKind === 'satisfaction' && activeSatisfactionSurvey != null) {
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

  const shareUrl = useCallback(
    (kind: string) => {
      const url = `${window.location.origin}/programs/general?programId=${program.id}&lnb=survey&tab=${kind}`
      void copyText(url)
    },
    [copyText, program.id]
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
        UJAT_LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT && prev.status === 'in_progress'
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
    (tab: UjatLectureEvalTabKey) => {
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
      paragraphBodyOptions: UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
    })
  }, [lectureEvalSurvey, openWritingUserPreview])

  const handleDownloadLectureEvalResults = useCallback(async () => {
    const root = lectureEvalResultsExportRef.current
    if (root == null) return
    setDownloadingLectureEvalResults(true)
    try {
      await exportLectureEvalResultsPdf(root, buildLectureEvalResultsPdfFileName(program.title))
    } catch (error) {
      handleError(error, { context: 'generalLectureEvalResultsPdfDownload' })
    } finally {
      setDownloadingLectureEvalResults(false)
    }
  }, [program.title])

  const renderPoll = () =>
    registeredSurveys.length === 0 ? (
      <SurveyEmptyState
        title={GENERAL_SURVEY_POLL_EMPTY_COPY.title}
        description={GENERAL_SURVEY_POLL_EMPTY_COPY.description}
        registerButtonLabel={GENERAL_SURVEY_POLL_EMPTY_COPY.registerButton}
        onRegisterClick={() => openCreateModal('survey')}
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
              <SurveyRegisteredActions
                survey={activeRegisteredSurvey}
                labels={GENERAL_SURVEY_POLL_ACTION_LABELS}
                onShareClick={() => shareUrl('survey')}
                onAddClick={() => openCreateModal('survey')}
                onOpenTemplatePreview={() => openTemplatePreview(activeRegisteredSurvey.templateId)}
                onDownloadClick={() => undefined}
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
            onDeleteClick={() => {
              setDeleteConfirmWord('')
              setDeleteModalKind('survey')
            }}
            onOpenTemplatePreview={() => openTemplatePreview(activeRegisteredSurvey.templateId)}
          />
        ) : activeRegisteredSurvey != null ? (
          <SurveyPollResultsView
            templateId={activeRegisteredSurvey.templateId}
            responseCount={activeRegisteredSurvey.responseCount}
            participantTotal={activeRegisteredSurvey.participantTotal}
            responses={initialMock.responses}
            pdfTitle="설문조사 결과"
          />
        ) : null}
      </div>
    )

  const renderEmptyMain = () => (
    <div className="program-detail-fullpage-modal__info-tab survey-management__empty-main">
      <div className="survey-management__empty-main-card">
        <p className="survey-management__empty-main-title">설문 관리 항목이 없습니다.</p>
        <p className="survey-management__empty-main-description">
          공통 정보에서 설문 진행 항목을 선택하면 설문조사, 만족도조사, 강의평가를 관리할 수 있습니다.
        </p>
      </div>
    </div>
  )

  const createTitle =
    createModalKind === 'satisfaction'
      ? '신규 만족도조사 등록'
      : createModalKind === 'lecture'
        ? UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.title
        : '신규 설문조사 등록'
  const createDescription =
    createModalKind === 'satisfaction'
      ? `${getGeneralSatisfactionAudienceLabel(activeSatisfactionAudience)}용 만족도조사를 등록하시겠습니까?\n등록 시 해당 프로그램 참여 대상에게 동일하게 노출됩니다.`
      : createModalKind === 'lecture'
        ? UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.description
        : '새로운 설문조사를 진행하시겠습니까?\n설문조사 신규 등록을 위해 사용할 템플릿 유형을 선택해 주세요.'

  return (
    <>
      {activeTab === 'survey' ? renderPoll() : null}
      {activeTab === 'satisfaction' ? (
        <SatisfactionSurveyView
          surveysByAudience={satisfactionSurveysByAudience}
          activeAudience={activeSatisfactionAudience}
          audienceTabs={audienceTabs}
          emptyCopy={GENERAL_SATISFACTION_EMPTY_COPY}
          noResponseCopy={GENERAL_SATISFACTION_NO_RESPONSE_COPY}
          actionLabels={GENERAL_SATISFACTION_ACTION_LABELS}
          showAudienceTabs={!individualProgram}
          onAudienceChange={setActiveSatisfactionAudience}
          onRegisterClick={() => openCreateModal('satisfaction')}
          onShareClick={() => shareUrl('satisfaction')}
          onDeleteClick={() => {
            setDeleteConfirmWord('')
            setDeleteModalKind('satisfaction')
          }}
          onOpenTemplatePreview={() => {
            if (activeSatisfactionSurvey != null) {
              openTemplatePreview(activeSatisfactionSurvey.templateId)
            }
          }}
          onDownloadClick={() => undefined}
        />
      ) : null}
      {activeTab === 'lecture_evaluation' ? (
        <UjatLectureEvalSurveyView
          survey={lectureEvalSurvey}
          submitted={lectureEvalSubmitted}
          formDraft={lectureEvalFormDraft}
          pollResponses={lectureEvalResponses}
          activeTab={activeLectureEvalTab}
          downloadingResults={downloadingLectureEvalResults}
          resultsExportRef={lectureEvalResultsExportRef}
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
          onDownloadResultsClick={() => {
            void handleDownloadLectureEvalResults()
          }}
        />
      ) : null}
      {activeTab === 'main' ? renderEmptyMain() : null}

      <ContentModal
        open={createModalKind != null}
        onCancel={closeCreateModal}
        title={createTitle}
        width={600}
        className="ujat-survey-create-modal"
        description={createDescription}
        footer={
          <div className="ujat-survey-create-modal__footer">
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
          </div>
        }
      >
        <div className="ujat-survey-create-modal__field">
          <p className="ujat-survey-create-modal__label">템플릿 유형</p>
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
        title={deleteModalKind === 'satisfaction' ? '만족도조사 삭제 안내' : '설문조사 삭제 안내'}
        width={600}
        modalStyles={{ content: { minHeight: 310 } }}
        className="ujat-survey-delete-modal"
        description={`**[${
          deleteModalKind === 'satisfaction'
            ? `${getGeneralSatisfactionAudienceLabel(activeSatisfactionAudience)} 만족도조사`
            : activeRegisteredSurvey?.title ?? '설문조사'
        }]** ${deleteModalKind === 'satisfaction' ? '만족도조사' : '설문조사'}를 삭제하시겠습니까?\n삭제 시 해당 양식의 내용은 모두 삭제됩니다.\n삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?`}
        footer={
          <div className="ujat-survey-delete-modal__footer">
            <CmsButton
              variant="secondary"
              size="large"
              width={140}
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
              size="large"
              width={160}
              type="button"
              disabled={deleteConfirmWord.trim() !== '삭제'}
              onClick={confirmDelete}
            >
              삭제
            </CmsButton>
          </div>
        }
      >
        <div className="ujat-survey-delete-modal__field">
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
        title={UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.title}
        width={600}
        className="ujat-lecture-eval-incomplete-modal"
        description={UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.description}
        footer={
          <div className="ujat-lecture-eval-incomplete-modal__footer">
            <CmsButton
              variant="secondary"
              size="medium"
              width={120}
              type="button"
              onClick={() => setLectureEvalIncompleteModalOpen(false)}
            >
              {UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.confirmButton}
            </CmsButton>
          </div>
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
    </>
  )
}
