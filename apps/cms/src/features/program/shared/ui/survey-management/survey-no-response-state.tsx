import { CmsButton } from '@/shared/ui/cms-button'
import {
  PROGRAM_DETAIL_ACTION_ATTRIBUTE,
  type ProgramDetailActionKind,
} from '@/features/program/shared/lib/program-detail-action-guard'
import { SurveyEmptyIcon } from './survey-empty-icon'
import './survey-management.css'

export type SurveyNoResponseStateProps = {
  title: string
  description: string
  deleteButtonLabel: string
  previewButtonLabel: string
  canDelete: boolean
  /** false면 삭제 버튼을 숨긴다. 기본 true(권한 없을 때와 상태상 비활성을 구분) */
  showDeleteButton?: boolean
  /** false면 「설문 양식 보기」 버튼을 숨긴다(상단에 같은 버튼이 있을 때). 기본 true */
  showPreviewButton?: boolean
  /**
   * 「설문 양식 보기」를 프로그램 상세 액션 가드에 태운다. 강의평가는 `write` —
   * 프로그램 담당자 Viewer는 버튼은 보이되 누르면 접근 권한 안내(권한 설정 V1.2).
   */
  previewButtonAction?: ProgramDetailActionKind
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
  showDeleteButton = true,
  showPreviewButton = true,
  previewButtonAction,
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
          {showDeleteButton ? (
            <CmsButton className="survey-management-status-state__delete-button"
              variant="delete"
              disabled={!canDelete}
              onClick={onDeleteClick} >
              {deleteButtonLabel}
            </CmsButton>
          ) : null}
          {showPreviewButton ? (
            <CmsButton className="survey-management-status-state__preview-button"
              {...(previewButtonAction != null
                ? { [PROGRAM_DETAIL_ACTION_ATTRIBUTE]: previewButtonAction }
                : {})}
              onClick={onOpenTemplatePreview} >
              {previewButtonLabel}
            </CmsButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}
