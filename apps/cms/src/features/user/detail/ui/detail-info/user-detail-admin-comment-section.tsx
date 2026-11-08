import type { User } from '@/types/user'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui'
import { ADMIN_COMMENT_SENSITIVE_INFO_NOTICE } from '@/features/user/detail/lib/admin-comment-copy'
import './user-detail-admin-comment-section.css'

export type UserDetailAdminCommentSectionProps = {
  user: Omit<User, 'password'>
  memberInfoEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentChange?: (value: string) => void
}

export function UserDetailAdminCommentSection({
  user,
  memberInfoEditing = false,
  adminCommentDraft,
  onAdminCommentChange,
}: UserDetailAdminCommentSectionProps) {
  const trimmed = user.adminComment?.trim() ?? ''

  if (memberInfoEditing && onAdminCommentChange) {
    return (
      <DetailInfoForm
        title="관리자 코멘트"
        description={ADMIN_COMMENT_SENSITIVE_INFO_NOTICE}
        mode="edit"
        className="user-detail-admin-comment-section user-detail-admin-comment-section--editing"
      >
        <DetailInfoForm.Row type="custom">
          <CmsInput
            value={adminCommentDraft ?? ''}
            onChange={e => onAdminCommentChange(e.target.value)}
            inputSize="small"
            width="100%"
            placeholder="관리자 코멘트를 입력해 주세요"
            aria-label="관리자 코멘트"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    )
  }

  return (
    <DetailInfoForm
      title="관리자 코멘트"
      description={ADMIN_COMMENT_SENSITIVE_INFO_NOTICE}
      mode="view"
      className="user-detail-admin-comment-section"
    >
      <DetailInfoForm.Row type="custom">
        <div
          className={
            trimmed
              ? 'user-detail-admin-comment-section__text'
              : 'user-detail-admin-comment-section__text user-detail-admin-comment-section__text--empty'
          }
          role="region"
          aria-label="관리자 코멘트"
        >
          {trimmed ? user.adminComment : '작성된 코멘트가 없습니다.'}
        </div>
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
