import assert from 'node:assert/strict'
import { resolvePortalNotificationPopup } from './resolve-portal-notification-popup.ts'

const base = { linkId: 3, sourceId: 3, sourceDomain: 'MEMBER', programName: null, reason: null }

/** 시스템: 서버 title·message 그대로, 프로그램명 줄·사유 상자 없음 */
assert.deepEqual(
  resolvePortalNotificationPopup({
    ...base,
    eventType: 'MEMBER_CONSENT_EXPIRING',
    linkType: 'MEMBER_CONSENT',
    title: '필수 동의 항목 만료 예정 안내',
    message: '필수 동의 항목의 유효기간이 곧 만료됩니다.\n다시 동의해 주세요.',
  }),
  {
    title: '필수 동의 항목 만료 예정 안내',
    programName: null,
    message: '필수 동의 항목의 유효기간이 곧 만료됩니다.\n다시 동의해 주세요.',
    reason: null,
    actionLabel: '다시 동의하기',
    path: '/mypage/settings?tab=consents',
  },
)

assert.deepEqual(
  resolvePortalNotificationPopup({
    ...base,
    eventType: 'MEMBER_IDENTITY_VERIFIED',
    linkType: 'MEMBER_PROFILE',
    title: '본인인증이 완료되었습니다.',
    message: '본인인증이 완료되었습니다. 회원정보 설정에서 확인할 수 있습니다.',
  }),
  {
    title: '본인인증이 완료되었습니다.',
    programName: null,
    message: '본인인증이 완료되었습니다. 회원정보 설정에서 확인할 수 있습니다.',
    reason: null,
    actionLabel: '내 정보 보기',
    path: '/mypage/settings',
  },
)

/** 프로그램명·사유가 있으면 회색 줄·사유 상자. message는 파싱하지 않는다 */
assert.deepEqual(
  resolvePortalNotificationPopup({
    ...base,
    eventType: 'UJAT_ORGANIZATION_SCHEDULE_REVISION_REQUESTED',
    linkType: 'PROGRAM_APPLICATION',
    title: '일정 수정 요청',
    message: '제출하신 일정에 수정 요청이 있어요.\n수정 요청 내용을 확인해 주세요.',
    programName: ' 2026 UJAT 상반기 ',
    reason: '3월 둘째 주 금요일로 바꿔 주세요.',
  })?.reason,
  { label: '수정 요청', text: '3월 둘째 주 금요일로 바꿔 주세요.' },
)

const cancelled = resolvePortalNotificationPopup({
  ...base,
  eventType: 'ACTIVITY_ORGANIZATION_ASSIGNMENT_CANCELLED',
  linkType: 'PROGRAM',
  linkId: 7,
  title: '활동 기관 배정 취소',
  message: '배정이 취소되었어요.',
  programName: '한빛중학교',
  reason: '기관 사정',
})
assert.equal(cancelled?.programName, '한빛중학교')
assert.deepEqual(cancelled?.reason, { label: '취소 사유', text: '기관 사정' })
assert.equal(cancelled?.actionLabel, '배정 현황 보기')

/** 사유 상자 제목 */
for (const [eventType, label] of [
  ['INSTRUCTOR_ROLE_REJECTED', '반려 사유'],
  ['SETTLEMENT_APPLICATION_REJECTED', '반려 사유'],
  ['INSTRUCTOR_ROLE_TERMINATED', '해제 사유'],
  ['INSTRUCTOR_ROLE_REVOKED', '취소 사유'],
  ['INDIVIDUAL_APPLICATION_APPROVAL_CANCELLED', '취소 사유'],
  ['UJAT_ORGANIZATION_APPLICATION_REJECTED', '거절 사유'],
  ['EXPENSE_RECEIPT_REJECTED', '거절 사유'],
] as const) {
  assert.equal(
    resolvePortalNotificationPopup({ ...base, eventType, linkType: 'SETTLEMENT', title: 't', message: 'm', reason: 'r' })
      ?.reason?.label,
    label,
    eventType,
  )
}

/** reason이 없으면(예전 알림 포함) 상자 없음, 빈 문자열도 없음 */
assert.equal(
  resolvePortalNotificationPopup({ ...base, eventType: 'INSTRUCTOR_ROLE_REJECTED', title: 't', message: 'm' })?.reason,
  null,
)
assert.equal(
  resolvePortalNotificationPopup({ ...base, eventType: 'INSTRUCTOR_ROLE_REJECTED', title: 't', message: 'm', reason: '  ' })
    ?.reason,
  null,
)

/** [관리자 문의]는 1:1 문의로 */
assert.deepEqual(
  (({ actionLabel, path }) => ({ actionLabel, path }))(
    resolvePortalNotificationPopup({ ...base, eventType: 'INSTRUCTOR_ROLE_REJECTED', title: 't', message: 'm' })!,
  ),
  { actionLabel: '관리자 문의', path: '/mypage/inquiries' },
)

/** 이동 위치가 없으면 [닫기]만 */
const noPath = resolvePortalNotificationPopup({
  eventType: 'PROGRAM_START_NOTICE',
  title: 't',
  message: 'm',
  programName: null,
  reason: null,
})
assert.equal(noPath?.path, null)
assert.equal(noPath?.actionLabel, null)

/** 시안 없는 알림은 팝업 없이 바로 이동 */
assert.equal(
  resolvePortalNotificationPopup({ ...base, eventType: 'NOTICE', linkType: 'NOTICE', title: '공지', message: '공지' }),
  null,
)

console.log('resolve-portal-notification-popup.selfcheck: ok')
