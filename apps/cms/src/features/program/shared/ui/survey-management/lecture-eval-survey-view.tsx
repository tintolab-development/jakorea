import { Spin } from 'antd'
import type { RefObject } from 'react'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsButton } from '@/shared/ui/cms-button'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { RegisteredSurvey, SurveyPollRawResponse } from '../../lib/survey-management/survey-management-types'
import {
  canDownloadLectureEvalResults,
  canEditLectureEvalResponse,
  isLectureEvalFormPhase,
  isLectureEvalResultsTabAccessible,
  GENERAL_LECTURE_EVAL_TABS,
  type LectureEvalTabKey,
} from '../../lib/survey-management/lecture-eval-survey'
import type {
  LectureEvalActionLabels,
  LectureEvalClosedCopy,
  LectureEvalEmptyCopy,
  LectureEvalPreStartCopy,
  LectureEvalSubmittedCopy,
} from '../../lib/survey-management/survey-copy'
import { SurveyEmptyState } from './survey-empty-state'
import { SurveyNoResponseState } from './survey-no-response-state'
import { LectureEvalSubmittedIcon } from './lecture-eval-submitted-icon'
import { SurveySubmittedState } from './survey-submitted-state'
import { LectureEvalFormView } from './lecture-eval-form-view'
import { SurveyPollResultsView } from './survey-poll-results-view'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './survey-management.css'

export type LectureEvalSurveyViewProps = {
  /** 결과 문항 구성을 바인딩 version으로 조회(템플릿 목록 미조회 — 뷰어 403 방지) */
  resultsTemplateVersionId?: number
  survey: RegisteredSurvey | null
  submitted: boolean
  formDraft: WritingFormDraft | null
  pollResponses: SurveyPollRawResponse[]
  activeTab: LectureEvalTabKey
  downloadingResults: boolean
  resultsExportRef: RefObject<HTMLDivElement | null>
  emptyCopy: LectureEvalEmptyCopy
  preStartCopy: LectureEvalPreStartCopy
  /** 종료 후 내 응답이 없을 때 */
  closedCopy: LectureEvalClosedCopy
  submittedCopy: LectureEvalSubmittedCopy
  actionLabels: LectureEvalActionLabels
  onTabChange: (tab: LectureEvalTabKey) => void
  onRegisterClick: () => void
  /** 진행 전 — 등록된 강의평가 매핑 삭제 */
  onDeleteClick: () => void
  onOpenTemplatePreview: () => void
  onFormDraftChange: (draft: WritingFormDraft) => void
  onSubmitClick: () => void
  onEditResponseClick: () => void
  /** 본인 답변 삭제 — 진행 중·마감 전 */
  onDeleteResponseClick: () => void
  onDownloadResultsClick: () => void
}

export function LectureEvalSurveyView({
  resultsTemplateVersionId,
  survey,
  submitted,
  formDraft,
  pollResponses,
  activeTab,
  downloadingResults,
  resultsExportRef,
  emptyCopy,
  preStartCopy,
  closedCopy,
  submittedCopy,
  actionLabels,
  onTabChange,
  onRegisterClick,
  onDeleteClick,
  onOpenTemplatePreview,
  onFormDraftChange,
  onSubmitClick,
  onEditResponseClick,
  onDeleteResponseClick,
  onDownloadResultsClick,
}: LectureEvalSurveyViewProps) {
  const showForm =
    survey != null && isLectureEvalFormPhase(survey, submitted) && formDraft != null
  const showSubmitted = survey != null && submitted
  const showPreStart = survey != null && survey.status === 'before_start'
  const showClosed = survey != null && survey.status === 'finished' && !submitted
  const resultsAccessible = survey != null && isLectureEvalResultsTabAccessible(survey)
  const downloadEnabled = canDownloadLectureEvalResults(survey)

  const trailingActions =
    activeTab === 'eval' && showForm && !submitted ? (
      <CmsButton
        className="ujat-lecture-eval-survey__submit-trailing"
        size="large"
        onClick={onSubmitClick}
      >
        {actionLabels.submit}
      </CmsButton>
    ) : activeTab === 'results' && resultsAccessible ? (
      <CmsButton className="ujat-lecture-eval-survey__download-trailing"
        variant="secondary"
        size="large"
        icon={<ButtonDownloadIcon />}
        disabled={!downloadEnabled || downloadingResults}
        onClick={onDownloadResultsClick} >
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
      <SurveyNoResponseState
        title={preStartCopy.title}
        description={preStartCopy.description}
        deleteButtonLabel={preStartCopy.deleteButton}
        previewButtonLabel={preStartCopy.previewButton}
        canDelete
        previewButtonAction="write"
        embedded
        onDeleteClick={onDeleteClick}
        onOpenTemplatePreview={onOpenTemplatePreview}
      />
    ) : showSubmitted ? (
      <SurveySubmittedState
        className="ujat-lecture-eval-submitted"
        icon={<LectureEvalSubmittedIcon />}
        title={submittedCopy.title}
        description={submittedCopy.description}
        editButtonLabel={submittedCopy.editButton}
        canEdit={canEditLectureEvalResponse(survey)}
        showEditButton={survey.status !== 'finished'}
        onEditClick={onEditResponseClick}
        deleteButtonLabel={submittedCopy.deleteButton}
        showDeleteButton={canEditLectureEvalResponse(survey)}
        onDeleteClick={onDeleteResponseClick}
      />
    ) : showClosed ? (
      <SurveyNoResponseState
        title={closedCopy.title}
        description={closedCopy.description}
        deleteButtonLabel=""
        previewButtonLabel=""
        canDelete={false}
        showDeleteButton={false}
        showPreviewButton={false}
        embedded
        onDeleteClick={onDeleteClick}
        onOpenTemplatePreview={onOpenTemplatePreview}
      />
    ) : showForm && formDraft != null ? (
      <LectureEvalFormView
        draft={formDraft}
        submitButtonLabel={actionLabels.submit}
        showSubmitButton={false}
        onDraftChange={onFormDraftChange}
        onSubmitClick={onSubmitClick}
      />
    ) : null

  return (
    <div className="program-detail-fullpage-modal__info-tab survey-management-registered ujat-lecture-eval-survey">
      <CmsTextTabs
        className="survey-management-registered__tabs"
        variant="list"
        activeKey={activeTab}
        onChange={key => onTabChange(key as LectureEvalTabKey)}
        items={GENERAL_LECTURE_EVAL_TABS.map(tab => ({ key: tab.key, label: tab.label }))}
        trailing={trailingActions}
      />
      {activeTab === 'eval' ? evalTabBody : null}
      {activeTab === 'results' && resultsAccessible ? (
        <div ref={resultsExportRef} className="ujat-lecture-eval-survey__results">
          <SurveyPollResultsView
            templateId={survey!.templateId}
            templateVersionId={resultsTemplateVersionId}
            responseCount={survey!.responseCount}
            participantTotal={survey!.participantTotal}
            responses={pollResponses.length > 0 ? pollResponses : undefined}
            statusBadge={survey!.status}
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
              강의평가 결과 파일을 준비하고 있어요.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
