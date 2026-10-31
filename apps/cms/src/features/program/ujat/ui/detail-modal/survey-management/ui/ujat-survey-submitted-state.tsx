import { CheckCircleOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'

export type UjatSurveySubmittedStateProps = {
  title: string
  description: string
  editButtonLabel: string
  canEdit: boolean
  /** false면 수정 버튼을 숨긴다 */
  showEditButton?: boolean
  onEditClick: () => void
  className?: string
  icon?: ReactNode
}

export function UjatSurveySubmittedState({
  title,
  description,
  editButtonLabel,
  canEdit,
  showEditButton = true,
  onEditClick,
  className,
  icon,
}: UjatSurveySubmittedStateProps) {
  const rootClassName = ['ujat-survey-submitted-state', className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <div className="ujat-survey-submitted-state__content">
        <span className="ujat-survey-submitted-state__icon" aria-hidden>
          {icon ?? <CheckCircleOutlined />}
        </span>
        <div className="ujat-survey-submitted-state__texts">
          <p className="ujat-survey-submitted-state__title">{title}</p>
          <p className="ujat-survey-submitted-state__description">{description}</p>
        </div>
        {showEditButton ? (
          <CmsButton className="ujat-survey-submitted-state__edit-button"
            disabled={!canEdit}
            onClick={onEditClick} >
            {editButtonLabel}
          </CmsButton>
        ) : null}
      </div>
    </div>
  )
}
