import { Spin } from 'antd'
import type { RefObject } from 'react'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  UJAT_LECTURE_EVAL_ACTION_LABELS,
  UJAT_LECTURE_EVAL_CLOSED_COPY,
  UJAT_LECTURE_EVAL_EMPTY_COPY,
  UJAT_LECTURE_EVAL_PRE_START_COPY,
  UJAT_LECTURE_EVAL_SUBMITTED_COPY,
} from '../lib/ujat-survey-copy'
import { canDownloadLectureEvalResults } from '@/features/program/shared/lib/survey-management/lecture-eval-survey'
import {
  canEditLectureEvalResponse,
  isLectureEvalFormPhase,
  isLectureEvalResultsTabAccessible,
  UJAT_LECTURE_EVAL_TABS,
  type UjatLectureEvalTabKey,
} from '../lib/ujat-lecture-eval-survey'
import type { UjatSurveyPollRawResponse } from '@/features/program/ujat/model/ujat-survey-poll'
import type { UjatRegisteredSurvey } from '../lib/ujat-satisfaction-survey'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { UjatSurveyEmptyState } from './ujat-survey-empty-state'
import { UjatSurveyNoResponseState } from './ujat-survey-no-response-state'
import { UjatLectureEvalSubmittedIcon } from './ujat-lecture-eval-submitted-icon'
import { UjatSurveySubmittedState } from './ujat-survey-submitted-state'
import { UjatLectureEvalFormView } from './ujat-lecture-eval-form-view'
import { UjatSurveyPollResultsView } from './ujat-survey-poll-results-view'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './ujat-lecture-eval.css'

export type UjatLectureEvalSurveyViewProps = {
  survey: UjatRegisteredSurvey | null
  /** 결과 문항 구성을 바인딩 version으로 조회(템플릿 목록 미조회 — 뷰어 403 방지) */
  resultsTemplateVersionId?: number
  submitted: boolean
  formDraft: WritingFormDraft | null
  pollResponses: UjatSurveyPollRawResponse[]
  activeTab: UjatLectureEvalTabKey
  downloadingResults: boolean
  resultsExportRef: RefObject<HTMLDivElement | null>
  onTabChange: (tab: UjatLectureEvalTabKey) => void
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

export function UjatLectureEvalSurveyView({
  survey,
  resultsTemplateVersionId,
  submitted,
  formDraft,
  pollResponses,
  activeTab,
  downloadingResults,
  resultsExportRef,
  onTabChange,
  onRegisterClick,
  onDeleteClick,
  onOpenTemplatePreview,
  onFormDraftChange,
  onSubmitClick,
  onEditResponseClick,
  onDeleteResponseClick,
  onDownloadResultsClick,
}: UjatLectureEvalSurveyViewProps) {
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
        {UJAT_LECTURE_EVAL_ACTION_LABELS.submit}
      </CmsButton>
    ) : activeTab === 'results' && resultsAccessible ? (
      <CmsButton className="ujat-lecture-eval-survey__download-trailing"
        variant="secondary"
        size="large"
        icon={<ButtonDownloadIcon />}
        disabled={!downloadEnabled || downloadingResults}
        onClick={onDownloadResultsClick} >
        {UJAT_LECTURE_EVAL_ACTION_LABELS.download}
      </CmsButton>
    ) : null

  const evalTabBody =
    survey == null ? (
      <UjatSurveyEmptyState
        title={UJAT_LECTURE_EVAL_EMPTY_COPY.title}
        description={UJAT_LECTURE_EVAL_EMPTY_COPY.description}
        registerButtonLabel={UJAT_LECTURE_EVAL_EMPTY_COPY.registerButton}
        showRegisterButton
        embedded
        onRegisterClick={onRegisterClick}
      />
    ) : showPreStart ? (
      <UjatSurveyNoResponseState
        title={UJAT_LECTURE_EVAL_PRE_START_COPY.title}
        description={UJAT_LECTURE_EVAL_PRE_START_COPY.description}
        deleteButtonLabel={UJAT_LECTURE_EVAL_PRE_START_COPY.deleteButton}
        previewButtonLabel={UJAT_LECTURE_EVAL_PRE_START_COPY.previewButton}
        canDelete
        previewButtonAction="write"
        embedded
        onDeleteClick={onDeleteClick}
        onOpenTemplatePreview={onOpenTemplatePreview}
      />
    ) : showSubmitted ? (
      <UjatSurveySubmittedState
        className="ujat-lecture-eval-submitted"
        icon={<UjatLectureEvalSubmittedIcon />}
        title={UJAT_LECTURE_EVAL_SUBMITTED_COPY.title}
        description={UJAT_LECTURE_EVAL_SUBMITTED_COPY.description}
        editButtonLabel={UJAT_LECTURE_EVAL_SUBMITTED_COPY.editButton}
        canEdit={canEditLectureEvalResponse(survey)}
        showEditButton={survey.status !== 'finished'}
        onEditClick={onEditResponseClick}
        deleteButtonLabel={UJAT_LECTURE_EVAL_SUBMITTED_COPY.deleteButton}
        showDeleteButton={canEditLectureEvalResponse(survey)}
        onDeleteClick={onDeleteResponseClick}
      />
    ) : showClosed ? (
      <UjatSurveyNoResponseState
        title={UJAT_LECTURE_EVAL_CLOSED_COPY.title}
        description={UJAT_LECTURE_EVAL_CLOSED_COPY.description}
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
            templateVersionId={resultsTemplateVersionId}
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
