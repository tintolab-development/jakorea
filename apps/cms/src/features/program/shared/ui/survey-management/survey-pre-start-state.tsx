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
    ? 'ujat-survey-registered-empty-state ujat-survey-pre-start-state'
    : 'program-detail-fullpage-modal__info-tab ujat-survey-registered-empty-state ujat-survey-pre-start-state'

  return (
    <div className={rootClassName}>
      <div className="ujat-survey-registered-empty-state__content">
        <span className="ujat-survey-registered-empty-state__icon" aria-hidden>
          <SurveyEmptyIcon maskId="survey-pre-start-icon-mask" />
        </span>
        <div className="ujat-survey-registered-empty-state__texts">
          <p className="ujat-survey-registered-empty-state__title">{title}</p>
          <p className="ujat-survey-registered-empty-state__description">{description}</p>
        </div>
        <CmsButton
          className="ujat-survey-pre-start-state__preview-button"
          width={180}
          onClick={onOpenTemplatePreview}
        >
          {previewButtonLabel}
        </CmsButton>
      </div>
    </div>
  )
}
