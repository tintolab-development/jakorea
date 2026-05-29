import { CheckCircleOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'

export type UjatSurveySubmittedStateProps = {
  title: string
  description: string
  editButtonLabel: string
  canEdit: boolean
  onEditClick: () => void
}

export function UjatSurveySubmittedState({
  title,
  description,
  editButtonLabel,
  canEdit,
  onEditClick,
}: UjatSurveySubmittedStateProps) {
  return (
    <div className="ujat-survey-submitted-state">
      <div className="ujat-survey-submitted-state__content">
        <span className="ujat-survey-submitted-state__icon" aria-hidden>
          <CheckCircleOutlined />
        </span>
        <div className="ujat-survey-submitted-state__texts">
          <p className="ujat-survey-submitted-state__title">{title}</p>
          <p className="ujat-survey-submitted-state__description">{description}</p>
        </div>
        <CmsButton
          className="ujat-survey-submitted-state__edit-button"
          width={180}
          disabled={!canEdit}
          onClick={onEditClick}
        >
          {editButtonLabel}
        </CmsButton>
      </div>
    </div>
  )
}
