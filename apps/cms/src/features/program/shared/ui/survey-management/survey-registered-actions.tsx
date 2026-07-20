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
  const showProgressHeaderActions = survey.status !== 'before_start'
  const downloadEnabled = canDownloadSurveyResults(survey)
  const rootClassName =
    layout === 'satisfaction'
      ? 'survey-management-registered-actions survey-management-registered-actions--satisfaction'
      : 'survey-management-registered-actions'

  if (!showProgressHeaderActions) {
    return (
      <div className={rootClassName}>
        {showShareButton ? (
          <CmsButton
            className="survey-management-registered-actions__share-button"
            width={layout === 'satisfaction' ? 180 : 160}
            onClick={onShareClick}
          >
            {labels.share}
          </CmsButton>
        ) : null}
        {showAddButton && onAddClick != null && labels.add != null ? (
          <CmsButton
            className="survey-management-registered-actions__add-button"
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
        className="survey-management-registered-actions__download-button cms-button--no-label-ellipsis"
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
        className="survey-management-registered-actions__preview-button"
        variant="secondary"
        size="large"
        onClick={onOpenTemplatePreview}
      >
        {labels.preview}
      </CmsButton>
      {showShareButton ? (
        <CmsButton
          className="survey-management-registered-actions__share-button"
          width={layout === 'satisfaction' ? 180 : 160}
          onClick={onShareClick}
        >
          {labels.share}
        </CmsButton>
      ) : null}
      {showAddButton && onAddClick != null && labels.add != null ? (
        <CmsButton
          className="survey-management-registered-actions__add-button"
          width={160}
          onClick={onAddClick}
        >
          {labels.add}
        </CmsButton>
      ) : null}
    </div>
  )
}
