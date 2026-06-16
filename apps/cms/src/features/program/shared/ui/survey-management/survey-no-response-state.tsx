import { CmsButton } from '@/shared/ui/cms-button'
import { SurveyEmptyIcon } from './survey-empty-icon'
import './survey-management.css'

export type SurveyNoResponseStateProps = {
  title: string
  description: string
  deleteButtonLabel: string
  previewButtonLabel: string
  canDelete: boolean
  embedded?: boolean
  onDeleteClick: () => void
  onOpenTemplatePreview: () => void
}

export function SurveyNoResponseState({
  title,
  description,
  deleteButtonLabel,
  previewButtonLabel,
  canDelete,
  embedded = false,
  onDeleteClick,
  onOpenTemplatePreview,
}: SurveyNoResponseStateProps) {
  const rootClassName = embedded
    ? 'ujat-survey-registered-empty-state'
    : 'program-detail-fullpage-modal__info-tab ujat-survey-registered-empty-state'

  return (
    <div className={rootClassName}>
      <div className="ujat-survey-registered-empty-state__content">
        <span className="ujat-survey-registered-empty-state__icon" aria-hidden>
          <SurveyEmptyIcon maskId="survey-registered-empty-icon-mask" />
        </span>
        <div className="ujat-survey-registered-empty-state__texts">
          <p className="ujat-survey-registered-empty-state__title">{title}</p>
          <p className="ujat-survey-registered-empty-state__description">{description}</p>
        </div>
        <div className="ujat-survey-registered-empty-state__actions">
          <CmsButton
            className="ujat-survey-registered-empty-state__delete-button"
            variant="delete"
            width={140}
            disabled={!canDelete}
            onClick={onDeleteClick}
          >
            {deleteButtonLabel}
          </CmsButton>
          <CmsButton
            className="ujat-survey-registered-empty-state__preview-button"
            width={180}
            onClick={onOpenTemplatePreview}
          >
            {previewButtonLabel}
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
