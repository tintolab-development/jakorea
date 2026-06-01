import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { RegisteredSurvey, SurveyAudienceTab } from '../../lib/survey-management/survey-management-types'
import type { SurveyActionLabels, SurveyEmptyCopy, SurveyNoResponseCopy } from '../../lib/survey-management/survey-copy'
import { SurveyEmptyState } from './survey-empty-state'
import { SurveyNoResponseState } from './survey-no-response-state'
import { SurveyPollResultsView } from './survey-poll-results-view'
import { SurveyRegisteredActions } from './survey-registered-actions'

export type SatisfactionSurveyViewProps<TKey extends string> = {
  surveysByAudience: Partial<Record<TKey, RegisteredSurvey>>
  activeAudience: TKey
  audienceTabs: ReadonlyArray<SurveyAudienceTab<TKey>>
  emptyCopy: SurveyEmptyCopy
  noResponseCopy: SurveyNoResponseCopy
  actionLabels: SurveyActionLabels
  showAudienceTabs?: boolean
  onAudienceChange: (audience: TKey) => void
  onRegisterClick: () => void
  onShareClick: () => void
  onDeleteClick: () => void
  onOpenTemplatePreview: () => void
  onDownloadClick: () => void
}

export function SatisfactionSurveyView<TKey extends string>({
  surveysByAudience,
  activeAudience,
  audienceTabs,
  emptyCopy,
  noResponseCopy,
  actionLabels,
  showAudienceTabs = true,
  onAudienceChange,
  onRegisterClick,
  onShareClick,
  onDeleteClick,
  onOpenTemplatePreview,
  onDownloadClick,
}: SatisfactionSurveyViewProps<TKey>) {
  const activeSurvey = surveysByAudience[activeAudience]

  const trailingActions =
    activeSurvey != null ? (
      <SurveyRegisteredActions
        survey={activeSurvey}
        labels={actionLabels}
        layout="satisfaction"
        showAddButton={false}
        onShareClick={onShareClick}
        onOpenTemplatePreview={onOpenTemplatePreview}
        onDownloadClick={onDownloadClick}
      />
    ) : null

  const audienceTabRow = showAudienceTabs ? (
    <CmsTextTabs
      className="ujat-survey-registered__tabs"
      variant="list"
      activeKey={activeAudience}
      onChange={key => onAudienceChange(key as TKey)}
      items={audienceTabs.map(tab => ({ key: tab.key, label: tab.label }))}
      trailing={trailingActions}
    />
  ) : activeSurvey != null ? (
    <div className="ujat-survey-registered__tabs">{trailingActions}</div>
  ) : null

  if (activeSurvey == null) {
    return (
      <div className="program-detail-fullpage-modal__info-tab ujat-satisfaction-survey">
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
    <div className="program-detail-fullpage-modal__info-tab ujat-survey-registered ujat-satisfaction-survey">
      {audienceTabRow}
      {activeSurvey.responseCount === 0 ? (
        <SurveyNoResponseState
          title={noResponseCopy.title ?? `${activeAudienceLabel}용 만족도조사는 아직 진행 전입니다.`}
          description={noResponseCopy.description}
          deleteButtonLabel={noResponseCopy.deleteButton}
          previewButtonLabel={noResponseCopy.previewButton}
          canDelete={activeSurvey.status === 'before_start'}
          onDeleteClick={onDeleteClick}
          onOpenTemplatePreview={onOpenTemplatePreview}
        />
      ) : (
        <SurveyPollResultsView
          templateId={activeSurvey.templateId}
          responseCount={activeSurvey.responseCount}
          participantTotal={activeSurvey.participantTotal}
        />
      )}
    </div>
  )
}
