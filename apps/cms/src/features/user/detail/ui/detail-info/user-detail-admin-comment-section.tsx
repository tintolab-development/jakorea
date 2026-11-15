import type { User } from '@/types/user'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui'
import {
  ADMIN_COMMENT_SENSITIVE_INFO_NOTICE,
  ADMIN_COMMENT_SENSITIVE_INFO_NOTICE_INSTRUCTOR_AND_PERMISSION,
} from '@/features/user/detail/lib/admin-comment-copy'
import './user-detail-admin-comment-section.css'

export type UserDetailAdminCommentSectionProps = {
  user: Omit<User, 'password'>
  memberInfoEditing?: boolean
  adminCommentDraft?: string
  onAdminCommentChange?: (value: string) => void
  /** 강사 회원 상세·권한 승인 신청 상세 — 시안 섹션 설명 문구가 다르다 */
  instructorOrPermissionNotice?: boolean
}

export function UserDetailAdminCommentSection({
  user,
  memberInfoEditing = false,
  adminCommentDraft,
  onAdminCommentChange,
  instructorOrPermissionNotice = false,
}: UserDetailAdminCommentSectionProps) {
  const trimmed = user.adminComment?.trim() ?? ''
  const notice = instructorOrPermissionNotice
    ? ADMIN_COMMENT_SENSITIVE_INFO_NOTICE_INSTRUCTOR_AND_PERMISSION
    : ADMIN_COMMENT_SENSITIVE_INFO_NOTICE

  if (memberInfoEditing && onAdminCommentChange) {
    return (
      <DetailInfoForm
        title="관리자 코멘트"
        description={notice}
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
      description={notice}
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
