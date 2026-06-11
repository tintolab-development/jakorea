import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'
import './survey-management.css'

export type SurveyRegisteredActionsSurvey = {
  status: 'before_start' | 'in_progress' | 'finished'
  responseCount: number
  participantTotal: number
}

export type SurveyRegisteredActionLabels = {
  share: string
  add?: string
  download: string
  preview: string
}

type SurveyRegisteredActionsProps = {
  survey: SurveyRegisteredActionsSurvey
  labels: SurveyRegisteredActionLabels
  layout?: 'poll' | 'satisfaction'
  showAddButton?: boolean
  showShareButton?: boolean
  onShareClick: () => void
  onAddClick?: () => void
  onOpenTemplatePreview: () => void
  onDownloadClick?: () => void
}

export function canDownloadSurveyResults(survey: SurveyRegisteredActionsSurvey): boolean {
  return survey.status === 'finished' || survey.responseCount >= survey.participantTotal
}

export function SurveyRegisteredActions({
  survey,
  labels,
  layout = 'poll',
  showAddButton = true,
  showShareButton = true,
  onShareClick,
  onAddClick,
  onOpenTemplatePreview,
  onDownloadClick,
}: SurveyRegisteredActionsProps) {
  const hasResponses = survey.responseCount > 0
  const downloadEnabled = canDownloadSurveyResults(survey)
  const rootClassName =
    layout === 'satisfaction'
      ? 'ujat-survey-registered-actions ujat-survey-registered-actions--satisfaction'
      : 'ujat-survey-registered-actions'

  if (!hasResponses) {
    return (
      <div className={rootClassName}>
        {showShareButton ? (
          <CmsButton
            className="ujat-survey-registered-actions__share-button"
            width={layout === 'satisfaction' ? undefined : 160}
            onClick={onShareClick}
          >
            {labels.share}
          </CmsButton>
        ) : null}
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
        className="ujat-survey-registered-actions__download-button cms-button--no-label-ellipsis"
        variant="secondary"
        size="large"
        width="auto"
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
      {showShareButton ? (
        <CmsButton
          className="ujat-survey-registered-actions__share-button"
          width={layout === 'satisfaction' ? undefined : 160}
          onClick={onShareClick}
        >
          {labels.share}
        </CmsButton>
      ) : null}
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
