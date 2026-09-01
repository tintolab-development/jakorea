import { CmsButton } from '@/shared/ui/cms-button'
import { SurveyEmptyIcon } from './survey-empty-icon'
import './survey-management.css'

export type SurveyEmptyStateProps = {
  title: string
  description: string
  secondaryDescription?: string
  registerButtonLabel: string
  registerButtonWidth?: number | string
  embedded?: boolean
  onRegisterClick: () => void
}

export function SurveyEmptyState({
  title,
  description,
  secondaryDescription,
  registerButtonLabel,
  registerButtonWidth = 180,
  embedded = false,
  onRegisterClick,
}: SurveyEmptyStateProps) {
  const rootClassName = embedded
    ? 'survey-management-empty survey-management-empty--embedded'
    : 'program-detail-fullpage-modal__info-tab survey-management-empty'
  const descriptionLines = [description, secondaryDescription].filter(
    (line): line is string => line != null && line !== ''
  )

  return (
    <div className={rootClassName}>
      <div className="survey-management-empty__content">
        <span className="survey-management-empty__icon" aria-hidden>
          <SurveyEmptyIcon maskId="survey-empty-icon-mask" />
        </span>
        <div className="survey-management-empty__texts">
          <p className="survey-management-empty__title">{title}</p>
          <p className="survey-management-empty__description">
            {descriptionLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {index > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        </div>
        <CmsButton
          className="survey-management-empty__register-button"
          size="large"
          width={registerButtonWidth}
          onClick={onRegisterClick}
        >
          {registerButtonLabel}
        </CmsButton>
      </div>
    </div>
  )
}
