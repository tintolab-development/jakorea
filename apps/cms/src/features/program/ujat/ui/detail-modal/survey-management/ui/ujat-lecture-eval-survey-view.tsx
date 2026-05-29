import { DownloadOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import type { RefObject } from 'react'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  UJAT_LECTURE_EVAL_ACTION_LABELS,
  UJAT_LECTURE_EVAL_EMPTY_COPY,
  UJAT_LECTURE_EVAL_PRE_START_COPY,
  UJAT_LECTURE_EVAL_SUBMITTED_COPY,
} from '../lib/ujat-survey-copy'
import {
  canEditLectureEvalResponse,
  isLectureEvalFormPhase,
  isLectureEvalResultsTabAccessible,
  UJAT_LECTURE_EVAL_TABS,
  type UjatLectureEvalTabKey,
} from '../lib/ujat-lecture-eval-survey'
import type { UjatSurveyPollRawResponse } from '@/data/mock/ujat-survey-poll-responses-mock'
import type { UjatRegisteredSurvey } from '../lib/ujat-satisfaction-survey'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { canDownloadSurveyResults } from './ujat-survey-registered-actions'
import { UjatSurveyEmptyState } from './ujat-survey-empty-state'
import { UjatSurveyPreStartState } from './ujat-survey-pre-start-state'
import { UjatLectureEvalSubmittedIcon } from './ujat-lecture-eval-submitted-icon'
import { UjatSurveySubmittedState } from './ujat-survey-submitted-state'
import { UjatLectureEvalFormView } from './ujat-lecture-eval-form-view'
import { UjatSurveyPollResultsView } from './ujat-survey-poll-results-view'
import './ujat-lecture-eval.css'

export type UjatLectureEvalSurveyViewProps = {
  survey: UjatRegisteredSurvey | null
  submitted: boolean
  formDraft: WritingFormDraft | null
  pollResponses: UjatSurveyPollRawResponse[]
  activeTab: UjatLectureEvalTabKey
  downloadingResults: boolean
  resultsExportRef: RefObject<HTMLDivElement | null>
  onTabChange: (tab: UjatLectureEvalTabKey) => void
  onRegisterClick: () => void
  onOpenTemplatePreview: () => void
  onFormDraftChange: (draft: WritingFormDraft) => void
  onSubmitClick: () => void
  onEditResponseClick: () => void
  onDownloadResultsClick: () => void
}

export function UjatLectureEvalSurveyView({
  survey,
  submitted,
  formDraft,
  pollResponses,
  activeTab,
  downloadingResults,
  resultsExportRef,
  onTabChange,
  onRegisterClick,
  onOpenTemplatePreview,
  onFormDraftChange,
  onSubmitClick,
  onEditResponseClick,
  onDownloadResultsClick,
}: UjatLectureEvalSurveyViewProps) {
  const showForm =
    survey != null && isLectureEvalFormPhase(survey, submitted) && formDraft != null
  const showSubmitted = survey != null && submitted
  const showPreStart = survey != null && survey.status === 'before_start'
  const resultsAccessible = survey != null && isLectureEvalResultsTabAccessible(survey)
  const downloadEnabled = survey != null && canDownloadSurveyResults(survey)

  const trailingActions =
    activeTab === 'eval' && showForm && !submitted ? (
      <CmsButton
        className="ujat-lecture-eval-survey__submit-trailing"
        width={180}
        onClick={onSubmitClick}
      >
        {UJAT_LECTURE_EVAL_ACTION_LABELS.submit}
      </CmsButton>
    ) : activeTab === 'results' && resultsAccessible ? (
      <CmsButton
        className="ujat-lecture-eval-survey__download-trailing cms-button--no-label-ellipsis"
        variant="secondary"
        size="large"
        width="auto"
        icon={<DownloadOutlined />}
        disabled={!downloadEnabled || downloadingResults}
        onClick={onDownloadResultsClick}
      >
        {UJAT_LECTURE_EVAL_ACTION_LABELS.download}
      </CmsButton>
    ) : null

  const evalTabBody =
    survey == null ? (
      <UjatSurveyEmptyState
        title={UJAT_LECTURE_EVAL_EMPTY_COPY.title}
        description={UJAT_LECTURE_EVAL_EMPTY_COPY.description}
        registerButtonLabel={UJAT_LECTURE_EVAL_EMPTY_COPY.registerButton}
        embedded
        onRegisterClick={onRegisterClick}
      />
    ) : showPreStart ? (
      <UjatSurveyPreStartState
        title={UJAT_LECTURE_EVAL_PRE_START_COPY.title}
        description={UJAT_LECTURE_EVAL_PRE_START_COPY.description}
        previewButtonLabel={UJAT_LECTURE_EVAL_PRE_START_COPY.previewButton}
        onOpenTemplatePreview={onOpenTemplatePreview}
      />
    ) : showSubmitted ? (
      <UjatSurveySubmittedState
        className="ujat-lecture-eval-submitted"
        icon={<UjatLectureEvalSubmittedIcon />}
        title={UJAT_LECTURE_EVAL_SUBMITTED_COPY.title}
        description={UJAT_LECTURE_EVAL_SUBMITTED_COPY.description}
        editButtonLabel={UJAT_LECTURE_EVAL_SUBMITTED_COPY.editButton}
        canEdit={canEditLectureEvalResponse(survey, formDraft)}
        onEditClick={onEditResponseClick}
      />
    ) : showForm && formDraft != null ? (
      <UjatLectureEvalFormView
        draft={formDraft}
        submitButtonLabel={UJAT_LECTURE_EVAL_ACTION_LABELS.submit}
        showSubmitButton
        onDraftChange={onFormDraftChange}
        onSubmitClick={onSubmitClick}
      />
    ) : null

  return (
    <div className="program-detail-fullpage-modal__info-tab ujat-survey-registered ujat-lecture-eval-survey">
      <CmsTextTabs
        className="ujat-survey-registered__tabs"
        variant="list"
        activeKey={activeTab}
        onChange={key => onTabChange(key as UjatLectureEvalTabKey)}
        items={UJAT_LECTURE_EVAL_TABS.map(tab => ({ key: tab.key, label: tab.label }))}
        trailing={trailingActions}
      />
      {activeTab === 'eval' ? evalTabBody : null}
      {activeTab === 'results' && resultsAccessible ? (
        <div ref={resultsExportRef} className="ujat-lecture-eval-survey__results">
          <UjatSurveyPollResultsView
            templateId={survey!.templateId}
            responseCount={survey!.responseCount}
            participantTotal={survey!.participantTotal}
            responses={pollResponses.length > 0 ? pollResponses : undefined}
          />
        </div>
      ) : null}
      {downloadingResults ? (
        <div className="ujat-lecture-eval-survey__pdf-loading-overlay" role="status" aria-live="polite">
          <div className="ujat-lecture-eval-survey__pdf-loading-card">
            <Spin size="large" />
            <p className="ujat-lecture-eval-survey__pdf-loading-title">PDF 생성 중입니다.</p>
            <p className="ujat-lecture-eval-survey__pdf-loading-description">
              강의 평가 결과 파일을 준비하고 있어요.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
