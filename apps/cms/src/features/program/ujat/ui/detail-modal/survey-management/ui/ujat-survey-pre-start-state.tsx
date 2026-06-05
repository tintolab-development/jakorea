import { CmsButton } from '@/shared/ui/cms-button'
import { UjatSurveyEmptyIcon } from './ujat-survey-empty-icon'

export type UjatSurveyPreStartStateProps = {
  title: string
  description: string
  previewButtonLabel: string
  onOpenTemplatePreview: () => void
}

export function UjatSurveyPreStartState({
  title,
  description,
  previewButtonLabel,
  onOpenTemplatePreview,
}: UjatSurveyPreStartStateProps) {
  return (
    <div className="ujat-survey-registered-empty-state ujat-survey-pre-start-state">
      <div className="ujat-survey-registered-empty-state__content">
        <span className="ujat-survey-registered-empty-state__icon" aria-hidden>
          <UjatSurveyEmptyIcon maskId="ujat-survey-pre-start-icon-mask" />
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
