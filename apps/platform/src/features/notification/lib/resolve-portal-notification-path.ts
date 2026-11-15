import {
  educationApplicationDetailPath,
  instructorApplyPath,
  lectureApplicationDetailPath,
  MYPAGE_EDUCATION_PATH,
  MYPAGE_INQUIRIES_PATH,
  MYPAGE_LECTURE_PATH,
  MYPAGE_SETTINGS_CONSENTS_TAB,
  MYPAGE_SETTINGS_PATH,
  MYPAGE_SETTLEMENT_PATH,
  MYPAGE_VOLUNTEER_PATH,
  volunteerApplicationDetailPath,
} from '../../mypage/lib/constants.ts'
import type { MemberNotificationResponse } from '../api/client.ts'

function upper(value: string | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

function positiveId(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined
}

function hasToken(tokens: readonly string[], needle: string): boolean {
  return tokens.some(token => token === needle || token.includes(needle))
}

/**
 * 포털 알림 클릭 이동.
 * OpenAPI `MemberNotificationResponse`의 linkType·eventType·sourceDomain만 매핑한다.
 * 모르는 값은 이동하지 않는다.
 */
export function resolvePortalNotificationPath(
  item: Pick<
    MemberNotificationResponse,
    'eventType' | 'linkType' | 'linkId' | 'sourceId' | 'programId' | 'sourceDomain'
  >,
): string | null {
  const linkType = upper(item.linkType)
  const eventType = upper(item.eventType)
  const sourceDomain = upper(item.sourceDomain)
  const tokens = [linkType, eventType, sourceDomain]
  const targetId = positiveId(item.linkId) ?? positiveId(item.sourceId)
  const programId = positiveId(item.programId)

  if (hasToken(tokens, 'CONSENT') || hasToken(tokens, 'MARKETING')) {
    return MYPAGE_SETTINGS_CONSENTS_TAB
  }
  /**
   * 본인인증 완료(linkType MEMBER_PROFILE) — 서버 본문 「회원정보 설정에서 확인할 수 있습니다」에 맞춰 회원정보 설정.
   * 같은 MEMBER_PROFILE을 쓰는 가입 완료·휴면·탈퇴·교사 재직 변경 알림은 이동 대상을 정하지 않아 그대로 둔다.
   */
  if (eventType === 'MEMBER_IDENTITY_VERIFIED') {
    return MYPAGE_SETTINGS_PATH
  }
  if (linkType === 'NOTICE' || eventType === 'NOTICE' || sourceDomain === 'NOTICE') {
    return targetId != null ? `/notices/${targetId}` : '/notices'
  }
  if (linkType === 'INQUIRY' || hasToken(tokens, 'INQUIRY')) {
    return MYPAGE_INQUIRIES_PATH
  }
  if (linkType === 'SETTLEMENT' || linkType === 'SETTLEMENT_APPLICATION' || hasToken(tokens, 'SETTLEMENT')) {
    return MYPAGE_SETTLEMENT_PATH
  }
  if (linkType === 'INSTRUCTOR_ROLE_REQUEST' || hasToken(tokens, 'INSTRUCTOR_ROLE')) {
    return instructorApplyPath()
  }
  if (
    linkType === 'VOLUNTEER_APPLICATION' ||
    sourceDomain === 'VOLUNTEER_APPLICATION' ||
    hasToken(tokens, 'VOLUNTEER')
  ) {
    return targetId != null ? volunteerApplicationDetailPath(String(targetId)) : MYPAGE_VOLUNTEER_PATH
  }
  if (
    linkType === 'INSTRUCTOR_APPLICATION' ||
    sourceDomain === 'INSTRUCTOR_APPLICATION' ||
    hasToken(tokens, 'INSTRUCTOR_APPLICATION')
  ) {
    return targetId != null ? lectureApplicationDetailPath(String(targetId)) : MYPAGE_LECTURE_PATH
  }
  if (linkType === 'PROGRAM_APPLICATION' || sourceDomain === 'PROGRAM_APPLICATION') {
    return targetId != null
      ? educationApplicationDetailPath(String(targetId))
      : MYPAGE_EDUCATION_PATH
  }
  if (linkType === 'PROGRAM' || sourceDomain === 'PROGRAM') {
    return programId != null ? `/programs/${programId}` : '/programs'
  }
  return null
}
