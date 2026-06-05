import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  UJAT_SATISFACTION_ACTION_LABELS,
  UJAT_SATISFACTION_EMPTY_COPY,
  UJAT_SATISFACTION_NO_RESPONSE_COPY,
} from '../lib/ujat-survey-copy'
import {
  getSatisfactionAudienceTabs,
  getSatisfactionNoResponseTitle,
  type UjatRegisteredSurvey,
  type UjatSatisfactionAudienceKey,
  type UjatSatisfactionSurveyByAudience,
} from '../lib/ujat-satisfaction-survey'
import { UjatSurveyEmptyState } from './ujat-survey-empty-state'
import { UjatSurveyNoResponseState } from './ujat-survey-no-response-state'
import { UjatSurveyPollResultsView } from './ujat-survey-poll-results-view'
import { UjatSurveyRegisteredActions } from './ujat-survey-registered-actions'

export type UjatSatisfactionSurveyViewProps = {
  surveysByAudience: UjatSatisfactionSurveyByAudience
  activeAudience: UjatSatisfactionAudienceKey
  onAudienceChange: (audience: UjatSatisfactionAudienceKey) => void
  onRegisterClick: () => void
  onShareClick: () => void
  onDeleteClick: () => void
  onOpenTemplatePreview: () => void
  onDownloadClick: () => void
}

export function UjatSatisfactionSurveyView({
  surveysByAudience,
  activeAudience,
  onAudienceChange,
  onRegisterClick,
  onShareClick,
  onDeleteClick,
  onOpenTemplatePreview,
  onDownloadClick,
}: UjatSatisfactionSurveyViewProps) {
  const audienceTabs = getSatisfactionAudienceTabs()
  const activeSurvey: UjatRegisteredSurvey | undefined = surveysByAudience[activeAudience]

  const trailingActions =
    activeSurvey != null ? (
      <UjatSurveyRegisteredActions
        survey={activeSurvey}
        labels={UJAT_SATISFACTION_ACTION_LABELS}
        layout="satisfaction"
        showAddButton={false}
        onShareClick={onShareClick}
        onOpenTemplatePreview={onOpenTemplatePreview}
        onDownloadClick={onDownloadClick}
      />
    ) : null

  if (activeSurvey == null) {
    return (
      <div className="program-detail-fullpage-modal__info-tab ujat-satisfaction-survey">
        <CmsTextTabs
          className="ujat-survey-registered__tabs"
          variant="list"
          activeKey={activeAudience}
          onChange={key => onAudienceChange(key as UjatSatisfactionAudienceKey)}
          items={audienceTabs.map(tab => ({ key: tab.key, label: tab.label }))}
          trailing={null}
        />
        <UjatSurveyEmptyState
          title={UJAT_SATISFACTION_EMPTY_COPY.title}
          description={UJAT_SATISFACTION_EMPTY_COPY.description}
          secondaryDescription={UJAT_SATISFACTION_EMPTY_COPY.secondaryDescription}
          registerButtonLabel={UJAT_SATISFACTION_EMPTY_COPY.registerButton}
          embedded
          onRegisterClick={onRegisterClick}
        />
      </div>
    )
  }

  return (
    <div className="program-detail-fullpage-modal__info-tab ujat-survey-registered ujat-satisfaction-survey">
      <CmsTextTabs
        className="ujat-survey-registered__tabs"
        variant="list"
        activeKey={activeAudience}
        onChange={key => onAudienceChange(key as UjatSatisfactionAudienceKey)}
        items={audienceTabs.map(tab => ({ key: tab.key, label: tab.label }))}
        trailing={trailingActions}
      />
      {activeSurvey.responseCount === 0 ? (
        <UjatSurveyNoResponseState
          title={getSatisfactionNoResponseTitle(activeAudience)}
          description={UJAT_SATISFACTION_NO_RESPONSE_COPY.description}
          deleteButtonLabel={UJAT_SATISFACTION_NO_RESPONSE_COPY.deleteButton}
          previewButtonLabel={UJAT_SATISFACTION_NO_RESPONSE_COPY.previewButton}
          canDelete={activeSurvey.status === 'before_start'}
          onDeleteClick={onDeleteClick}
          onOpenTemplatePreview={onOpenTemplatePreview}
        />
      ) : (
        <UjatSurveyPollResultsView
          templateId={activeSurvey.templateId}
          responseCount={activeSurvey.responseCount}
          participantTotal={activeSurvey.participantTotal}
        />
      )}
    </div>
  )
}
