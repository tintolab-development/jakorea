import type { ReactNode } from 'react'
import { CmsButton } from '@/shared/ui'
import './section-card.css'

type MainContentSectionCardProps = {
  title: string
  description?: string
  isEditing: boolean
  saving?: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  children: ReactNode
}

export function MainContentSectionCard({
  title,
  description,
  isEditing,
  saving = false,
  onEdit,
  onCancel,
  onSave,
  children,
}: MainContentSectionCardProps) {
  return (
    <div className="admin-list-card main-content-section-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper main-content-section-card__title-wrap">
          <span className="table-title">{title}</span>
          {description ? (
            <span className="table-description main-content-section-card__description">
              {description}
            </span>
          ) : null}
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="medium"
                type="button"
                onClick={onCancel}
                disabled={saving}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                type="button"
                loading={saving}
                onClick={onSave}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="medium" type="button" onClick={onEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>
      <div className="main-content-section-card__body">{children}</div>
    </div>
  )
}
