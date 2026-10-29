import { InstructorRoleReviewRequestChannelType } from '@/shared/api/generated/members/schemas/instructorRoleReviewRequestChannelType'

export type InstructorPermissionRevokeChannelType = InstructorRoleReviewRequestChannelType

export const INSTRUCTOR_PERMISSION_REVOKE_CHANNEL_TYPES = Object.values(
  InstructorRoleReviewRequestChannelType
) as readonly InstructorPermissionRevokeChannelType[]

/** 기존 권한 종료 알림의 기본 발송 채널 정책은 BE에 위임한다. */
export const DEFAULT_INSTRUCTOR_PERMISSION_REVOKE_CHANNEL:
  | InstructorPermissionRevokeChannelType
  | undefined = undefined

export const INSTRUCTOR_PERMISSION_REVOKE_CHANNEL_LABELS: Record<
  InstructorPermissionRevokeChannelType,
  string
> = {
  ALIMTALK: '알림톡',
  SMS: 'SMS',
  EMAIL: '이메일',
}
