import { CmsButton } from '@/shared/ui/cms-button'
import { UjatSurveyEmptyIcon } from './ujat-survey-empty-icon'

export type UjatSurveyEmptyStateProps = {
  title: string
  description: string
  secondaryDescription?: string
  registerButtonLabel: string
  embedded?: boolean
  onRegisterClick: () => void
}

export function UjatSurveyEmptyState({
  title,
  description,
  secondaryDescription,
  registerButtonLabel,
  embedded = false,
  onRegisterClick,
}: UjatSurveyEmptyStateProps) {
  const rootClassName = embedded
    ? 'ujat-survey-poll-empty ujat-survey-poll-empty--embedded'
    : 'program-detail-fullpage-modal__info-tab ujat-survey-poll-empty'

  return (
    <div className={rootClassName}>
      <div className="ujat-survey-poll-empty__content">
        <span className="ujat-survey-poll-empty__icon" aria-hidden>
          <UjatSurveyEmptyIcon maskId="ujat-survey-empty-icon-mask" />
        </span>
        <div className="ujat-survey-poll-empty__texts">
          <p className="ujat-survey-poll-empty__title">{title}</p>
          <p className="ujat-survey-poll-empty__description">{description}</p>
          {secondaryDescription != null && secondaryDescription !== '' ? (
            <p className="ujat-survey-poll-empty__secondary-description">{secondaryDescription}</p>
          ) : null}
        </div>
        <CmsButton className="ujat-survey-poll-empty__register-button" onClick={onRegisterClick}>
          {registerButtonLabel}
        </CmsButton>
      </div>
    </div>
  )
}
