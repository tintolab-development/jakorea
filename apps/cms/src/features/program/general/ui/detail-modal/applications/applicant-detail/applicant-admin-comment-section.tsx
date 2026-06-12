/**
 * 참여자(개인·기관) 신청 상세 — 관리자 코멘트
 * 회원 상세 User.adminComment 와 저장 경로가 분리된 신청 건별 코멘트입니다.
 */

import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui'
import './applicant-admin-comment-section.css'

export interface ApplicantAdminCommentSectionProps {
  adminComment?: string
  mode?: 'view' | 'edit'
  draftValue?: string
  onDraftChange?: (value: string) => void
  validationError?: string
}

export function ApplicantAdminCommentSection({
  adminComment,
  mode = 'view',
  draftValue = '',
  onDraftChange,
  validationError,
}: ApplicantAdminCommentSectionProps) {
  const trimmed = adminComment?.trim() ?? ''
  const isEditMode = mode === 'edit' && onDraftChange != null

  if (isEditMode) {
    return (
      <DetailInfoForm
        title="관리자 코멘트"
        mode="edit"
        className="applicant-admin-comment-section applicant-admin-comment-section--editing"
      >
        <DetailInfoForm.Row type="custom">
          <CmsInput
            className="applicant-admin-comment-section__input"
            value={draftValue}
            onChange={event => onDraftChange(event.target.value)}
            inputSize="medium"
            width="100%"
            placeholder="관리자 코멘트를 입력하세요"
            aria-label="관리자 코멘트"
          />
          {validationError ? (
            <span className="applicant-admin-comment-section__error">{validationError}</span>
          ) : null}
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  return (
    <DetailInfoForm title="관리자 코멘트" mode="view" className="applicant-admin-comment-section">
      <DetailInfoForm.Row type="custom">
        <div
          className={
            trimmed
              ? 'applicant-admin-comment-section__text'
              : 'applicant-admin-comment-section__text applicant-admin-comment-section__text--empty'
          }
          role="region"
          aria-label="관리자 코멘트"
        >
          {trimmed ? adminComment : '작성된 코멘트가 없습니다.'}
        </div>
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
