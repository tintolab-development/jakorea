import { CmsButton } from '@/shared/ui/cms-button'
import { SurveyEmptyIcon } from './survey-empty-icon'
import './survey-management.css'

export type SurveyPreStartStateProps = {
  title: string
  description: string
  previewButtonLabel: string
  embedded?: boolean
  onOpenTemplatePreview: () => void
}

export function SurveyPreStartState({
  title,
  description,
  previewButtonLabel,
  embedded = false,
  onOpenTemplatePreview,
}: SurveyPreStartStateProps) {
  const rootClassName = embedded
    ? 'survey-management-status-state survey-management-pre-start-state'
    : 'program-detail-fullpage-modal__info-tab survey-management-status-state survey-management-pre-start-state'

  return (
    <div className={rootClassName}>
      <div className="survey-management-status-state__content">
        <span className="survey-management-status-state__icon" aria-hidden>
          <SurveyEmptyIcon maskId="survey-pre-start-icon-mask" />
        </span>
        <div className="survey-management-status-state__texts">
          <p className="survey-management-status-state__title">{title}</p>
          <p className="survey-management-status-state__description">{description}</p>
        </div>
        <CmsButton
          className="survey-management-pre-start-state__preview-button"
          width={180}
          onClick={onOpenTemplatePreview}
        >
          {previewButtonLabel}
        </CmsButton>
      </div>
    </div>
  )
}
