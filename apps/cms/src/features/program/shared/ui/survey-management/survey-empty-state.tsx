import { CmsButton } from '@/shared/ui/cms-button'
import { SurveyEmptyIcon } from './survey-empty-icon'
import './survey-management.css'

export type SurveyEmptyStateProps = {
  title: string
  description: string
  secondaryDescription?: string
  registerButtonLabel: string
  embedded?: boolean
  onRegisterClick: () => void
}

export function SurveyEmptyState({
  title,
  description,
  secondaryDescription,
  registerButtonLabel,
  embedded = false,
  onRegisterClick,
}: SurveyEmptyStateProps) {
  const rootClassName = embedded
    ? 'ujat-survey-poll-empty ujat-survey-poll-empty--embedded'
    : 'program-detail-fullpage-modal__info-tab ujat-survey-poll-empty'

  return (
    <div className={rootClassName}>
      <div className="ujat-survey-poll-empty__content">
        <span className="ujat-survey-poll-empty__icon" aria-hidden>
          <SurveyEmptyIcon maskId="survey-empty-icon-mask" />
        </span>
        <div className="ujat-survey-poll-empty__texts">
          <p className="ujat-survey-poll-empty__title">{title}</p>
          <p className="ujat-survey-poll-empty__description">{description}</p>
          {secondaryDescription != null && secondaryDescription !== '' ? (
            <p className="ujat-survey-poll-empty__secondary-description">{secondaryDescription}</p>
          ) : null}
        </div>
        <CmsButton
          className="ujat-survey-poll-empty__register-button"
          size="large"
          onClick={onRegisterClick}
        >
          {registerButtonLabel}
        </CmsButton>
      </div>
    </div>
  )
}
