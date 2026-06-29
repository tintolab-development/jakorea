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
    ? 'survey-management-status-state'
    : 'program-detail-fullpage-modal__info-tab survey-management-status-state'

  return (
    <div className={rootClassName}>
      <div className="survey-management-status-state__content">
        <span className="survey-management-status-state__icon" aria-hidden>
          <SurveyEmptyIcon maskId="survey-registered-empty-icon-mask" />
        </span>
        <div className="survey-management-status-state__texts">
          <p className="survey-management-status-state__title">{title}</p>
          <p className="survey-management-status-state__description">{description}</p>
        </div>
        <div className="survey-management-status-state__actions">
          <CmsButton
            className="survey-management-status-state__delete-button"
            variant="delete"
            width={140}
            disabled={!canDelete}
            onClick={onDeleteClick}
          >
            {deleteButtonLabel}
          </CmsButton>
          <CmsButton
            className="survey-management-status-state__preview-button"
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
