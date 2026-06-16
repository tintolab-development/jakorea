import { DownloadOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import type { RefObject } from 'react'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsButton } from '@/shared/ui/cms-button'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { RegisteredSurvey, SurveyPollRawResponse } from '../../lib/survey-management/survey-management-types'
import {
  canEditLectureEvalResponse,
  isLectureEvalFormPhase,
  isLectureEvalResultsTabAccessible,
  LECTURE_EVAL_TABS,
  type LectureEvalTabKey,
} from '../../lib/survey-management/lecture-eval-survey'
import type {
  LectureEvalActionLabels,
  LectureEvalEmptyCopy,
  LectureEvalPreStartCopy,
  LectureEvalSubmittedCopy,
} from '../../lib/survey-management/survey-copy'
import { canDownloadSurveyResults } from './survey-registered-actions'
import { SurveyEmptyState } from './survey-empty-state'
import { SurveyPreStartState } from './survey-pre-start-state'
import { LectureEvalSubmittedIcon } from './lecture-eval-submitted-icon'
import { SurveySubmittedState } from './survey-submitted-state'
import { LectureEvalFormView } from './lecture-eval-form-view'
import { SurveyPollResultsView } from './survey-poll-results-view'
import './survey-management.css'

export type LectureEvalSurveyViewProps = {
  survey: RegisteredSurvey | null
  submitted: boolean
  formDraft: WritingFormDraft | null
  pollResponses: SurveyPollRawResponse[]
  activeTab: LectureEvalTabKey
  downloadingResults: boolean
  resultsExportRef: RefObject<HTMLDivElement | null>
  emptyCopy: LectureEvalEmptyCopy
  preStartCopy: LectureEvalPreStartCopy
  submittedCopy: LectureEvalSubmittedCopy
  actionLabels: LectureEvalActionLabels
  onTabChange: (tab: LectureEvalTabKey) => void
  onRegisterClick: () => void
  onOpenTemplatePreview: () => void
  onFormDraftChange: (draft: WritingFormDraft) => void
  onSubmitClick: () => void
  onEditResponseClick: () => void
  onDownloadResultsClick: () => void
}

export function LectureEvalSurveyView({
  survey,
  submitted,
  formDraft,
  pollResponses,
  activeTab,
  downloadingResults,
  resultsExportRef,
  emptyCopy,
  preStartCopy,
  submittedCopy,
  actionLabels,
  onTabChange,
  onRegisterClick,
  onOpenTemplatePreview,
  onFormDraftChange,
  onSubmitClick,
  onEditResponseClick,
  onDownloadResultsClick,
}: LectureEvalSurveyViewProps) {
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
        {actionLabels.submit}
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
        {actionLabels.download}
      </CmsButton>
    ) : null

  const evalTabBody =
    survey == null ? (
      <SurveyEmptyState
        title={emptyCopy.title}
        description={emptyCopy.description}
        registerButtonLabel={emptyCopy.registerButton}
        embedded
        onRegisterClick={onRegisterClick}
      />
    ) : showPreStart ? (
      <SurveyPreStartState
        title={preStartCopy.title}
        description={preStartCopy.description}
        previewButtonLabel={preStartCopy.previewButton}
        embedded
        onOpenTemplatePreview={onOpenTemplatePreview}
      />
    ) : showSubmitted ? (
      <SurveySubmittedState
        className="ujat-lecture-eval-submitted"
        icon={<LectureEvalSubmittedIcon />}
        title={submittedCopy.title}
        description={submittedCopy.description}
        editButtonLabel={submittedCopy.editButton}
        canEdit={canEditLectureEvalResponse(survey, formDraft)}
        onEditClick={onEditResponseClick}
      />
    ) : showForm && formDraft != null ? (
      <LectureEvalFormView
        draft={formDraft}
        submitButtonLabel={actionLabels.submit}
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
        onChange={key => onTabChange(key as LectureEvalTabKey)}
        items={LECTURE_EVAL_TABS.map(tab => ({ key: tab.key, label: tab.label }))}
        trailing={trailingActions}
      />
      {activeTab === 'eval' ? evalTabBody : null}
      {activeTab === 'results' && resultsAccessible ? (
        <div ref={resultsExportRef} className="ujat-lecture-eval-survey__results">
          <SurveyPollResultsView
            templateId={survey!.templateId}
            responseCount={survey!.responseCount}
            participantTotal={survey!.participantTotal}
            responses={pollResponses.length > 0 ? pollResponses : undefined}
            pdfTitle="강의평가 결과"
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
