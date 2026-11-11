import { CheckCircleOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import './survey-management.css'

export type SurveySubmittedStateProps = {
  title: string
  description: string
  editButtonLabel: string
  canEdit: boolean
  /** false면 수정 버튼을 숨긴다(강의평가 종료 후) */
  showEditButton?: boolean
  onEditClick: () => void
  /** 강의평가 — 본인 답변 삭제(진행 중·마감 전). 라벨이 ' 삭제'로 끝나 상세 액션 가드가 쓰기로 막는다. */
  deleteButtonLabel?: string
  showDeleteButton?: boolean
  onDeleteClick?: () => void
  className?: string
  icon?: ReactNode
}

export function SurveySubmittedState({
  title,
  description,
  editButtonLabel,
  canEdit,
  showEditButton = true,
  onEditClick,
  deleteButtonLabel,
  showDeleteButton = false,
  onDeleteClick,
  className,
  icon,
}: SurveySubmittedStateProps) {
  const rootClassName = ['ujat-survey-submitted-state', className].filter(Boolean).join(' ')
  const showDelete = showDeleteButton && deleteButtonLabel != null && onDeleteClick != null
  const editButton = showEditButton ? (
    <CmsButton className="ujat-survey-submitted-state__edit-button"
      disabled={!canEdit}
      onClick={onEditClick} >
      {editButtonLabel}
    </CmsButton>
  ) : null

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
        {showDelete ? (
          <div className="ujat-survey-submitted-state__actions">
            <CmsButton className="ujat-survey-submitted-state__delete-button"
              variant="secondary"
              onClick={onDeleteClick} >
              {deleteButtonLabel}
            </CmsButton>
            {editButton}
          </div>
        ) : (
          editButton
        )}
      </div>
    </div>
  )
}
