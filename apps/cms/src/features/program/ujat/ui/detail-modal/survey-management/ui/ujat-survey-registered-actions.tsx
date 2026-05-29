import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'
import './ujat-survey-poll-results.css'

export type UjatSurveyRegisteredActionsSurvey = {
  status: 'before_start' | 'in_progress' | 'finished'
  responseCount: number
  participantTotal: number
}

export type UjatSurveyActionLabels = {
  share: string
  add?: string
  download: string
  preview: string
}

type UjatSurveyRegisteredActionsProps = {
  survey: UjatSurveyRegisteredActionsSurvey
  labels: UjatSurveyActionLabels
  layout?: 'poll' | 'satisfaction'
  showAddButton?: boolean
  onShareClick: () => void
  onAddClick?: () => void
  onOpenTemplatePreview: () => void
  onDownloadClick?: () => void
}

function canDownloadSurveyResults(survey: UjatSurveyRegisteredActionsSurvey): boolean {
  return survey.status === 'finished' || survey.responseCount >= survey.participantTotal
}

export function UjatSurveyRegisteredActions({
  survey,
  labels,
  layout = 'poll',
  showAddButton = true,
  onShareClick,
  onAddClick,
  onOpenTemplatePreview,
  onDownloadClick,
}: UjatSurveyRegisteredActionsProps) {
  const hasResponses = survey.responseCount > 0
  const downloadEnabled = canDownloadSurveyResults(survey)
  const rootClassName =
    layout === 'satisfaction'
      ? 'ujat-survey-registered-actions ujat-survey-registered-actions--satisfaction'
      : 'ujat-survey-registered-actions'

  if (!hasResponses) {
    return (
      <div className={rootClassName}>
        <CmsButton
          className="ujat-survey-registered-actions__share-button"
          width={layout === 'satisfaction' ? undefined : 160}
          onClick={onShareClick}
        >
          {labels.share}
        </CmsButton>
        {showAddButton && onAddClick != null && labels.add != null ? (
          <CmsButton
            className="ujat-survey-registered-actions__add-button"
            width={160}
            onClick={onAddClick}
          >
            {labels.add}
          </CmsButton>
        ) : null}
      </div>
    )
  }

  return (
    <div className={rootClassName}>
      <CmsButton
        className="ujat-survey-registered-actions__download-button"
        variant="secondary"
        size="large"
        icon={<DownloadOutlined />}
        disabled={!downloadEnabled}
        onClick={onDownloadClick}
      >
        {labels.download}
      </CmsButton>
      <CmsButton
        className="ujat-survey-registered-actions__preview-button"
        variant="secondary"
        size="large"
        onClick={onOpenTemplatePreview}
      >
        {labels.preview}
      </CmsButton>
      <CmsButton
        className="ujat-survey-registered-actions__share-button"
        width={layout === 'satisfaction' ? undefined : 160}
        onClick={onShareClick}
      >
        {labels.share}
      </CmsButton>
      {showAddButton && onAddClick != null && labels.add != null ? (
        <CmsButton
          className="ujat-survey-registered-actions__add-button"
          width={160}
          onClick={onAddClick}
        >
          {labels.add}
        </CmsButton>
      ) : null}
    </div>
  )
}

export { canDownloadSurveyResults }
