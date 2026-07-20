import type { RefObject } from 'react'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { RegisteredSurvey, SurveyAudienceTab, SurveyPollRawResponse } from '../../lib/survey-management/survey-management-types'
import type { SurveyActionLabels, SurveyEmptyCopy, SurveyNoResponseCopy } from '../../lib/survey-management/survey-copy'
import { SurveyEmptyState } from './survey-empty-state'
import { SurveyNoResponseState } from './survey-no-response-state'
import { SurveyPollResultsView } from './survey-poll-results-view'
import { SurveyRegisteredActions } from './survey-registered-actions'

export type SatisfactionSurveyViewProps<TKey extends string> = {
  surveysByAudience: Partial<Record<TKey, RegisteredSurvey>>
  activeAudience: TKey
  audienceTabs: ReadonlyArray<SurveyAudienceTab<TKey>>
  className?: string
  emptyCopy: SurveyEmptyCopy
  noResponseCopy: SurveyNoResponseCopy
  actionLabels: SurveyActionLabels
  showAudienceTabs?: boolean
  showShareButton?: boolean
  onAudienceChange: (audience: TKey) => void
  onRegisterClick: () => void
  onShareClick: () => void
  onDeleteClick: () => void
  onOpenTemplatePreview: () => void
  onDownloadClick: () => void
  resultsExportRef?: RefObject<HTMLDivElement | null>
  resultsResponses?: SurveyPollRawResponse[]
}

export function SatisfactionSurveyView<TKey extends string>({
  surveysByAudience,
  activeAudience,
  audienceTabs,
  className,
  emptyCopy,
  noResponseCopy,
  actionLabels,
  showAudienceTabs = true,
  showShareButton = true,
  onAudienceChange,
  onRegisterClick,
  onShareClick,
  onDeleteClick,
  onOpenTemplatePreview,
  onDownloadClick,
  resultsExportRef,
  resultsResponses,
}: SatisfactionSurveyViewProps<TKey>) {
  const activeSurvey = surveysByAudience[activeAudience]
  const rootClassName = [
    'program-detail-fullpage-modal__info-tab',
    activeSurvey == null
      ? 'survey-management-satisfaction'
      : 'survey-management-registered survey-management-satisfaction',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const trailingActions =
    activeSurvey != null ? (
      <SurveyRegisteredActions
        survey={activeSurvey}
        labels={actionLabels}
        layout="satisfaction"
        showAddButton={false}
        showShareButton={showShareButton}
        onShareClick={onShareClick}
        onOpenTemplatePreview={onOpenTemplatePreview}
        onDownloadClick={onDownloadClick}
      />
    ) : null

  const audienceTabRow = showAudienceTabs ? (
    <CmsTextTabs
      className="survey-management-registered__tabs"
      variant="list"
      activeKey={activeAudience}
      onChange={key => onAudienceChange(key as TKey)}
      items={audienceTabs.map(tab => ({ key: tab.key, label: tab.label }))}
      trailing={trailingActions}
    />
  ) : activeSurvey != null ? (
    <div className="survey-management-registered__tabs">{trailingActions}</div>
  ) : null

  if (activeSurvey == null) {
    return (
      <div className={rootClassName}>
        {showAudienceTabs ? audienceTabRow : null}
        <SurveyEmptyState
          title={emptyCopy.title}
          description={emptyCopy.description}
          secondaryDescription={emptyCopy.secondaryDescription}
          registerButtonLabel={emptyCopy.registerButton}
          embedded
          onRegisterClick={onRegisterClick}
        />
      </div>
    )
  }

  const activeAudienceLabel =
    audienceTabs.find(tab => tab.key === activeAudience)?.label ?? '참여자'

  return (
    <div className={rootClassName}>
      {audienceTabRow}
      {activeSurvey.status === 'before_start' ? (
        <SurveyNoResponseState
          title={noResponseCopy.title ?? `${activeAudienceLabel}용 만족도조사는 아직 진행 전입니다.`}
          description={noResponseCopy.description}
          deleteButtonLabel={noResponseCopy.deleteButton}
          previewButtonLabel={noResponseCopy.previewButton}
          canDelete={activeSurvey.status === 'before_start'}
          embedded
          onDeleteClick={onDeleteClick}
          onOpenTemplatePreview={onOpenTemplatePreview}
        />
      ) : (
        <div ref={resultsExportRef}>
          <SurveyPollResultsView
            templateId={activeSurvey.templateId}
            responseCount={activeSurvey.responseCount}
            participantTotal={activeSurvey.participantTotal}
            responses={resultsResponses}
            pdfTitle="만족도조사 결과"
          />
        </div>
      )}
    </div>
  )
}
