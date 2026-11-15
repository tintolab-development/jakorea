import assert from 'node:assert/strict'
import { resolvePortalNotificationPopup } from './resolve-portal-notification-popup.ts'

const base = { linkId: 3, sourceId: 3, sourceDomain: 'MEMBER' }

assert.deepEqual(
  resolvePortalNotificationPopup({
    ...base,
    eventType: 'MEMBER_CONSENT_COMPLETED',
    linkType: 'MEMBER_CONSENT',
    title: '성범죄 경력조회 동의 동의 완료',
    message: '성범죄 경력조회 동의의 동의 처리가 완료되었어요.',
  }),
  {
    title: '성범죄 경력조회 동의 동의 완료',
    message: '성범죄 경력조회 동의의 동의 처리가 완료되었어요.',
    actionLabel: '동의 내역 보기',
    path: '/mypage/settings?tab=consents',
  },
)

assert.deepEqual(
  resolvePortalNotificationPopup({
    ...base,
    eventType: 'MEMBER_CONSENT_EXPIRING',
    linkType: 'MEMBER_CONSENT',
    title: '필수 동의 항목 만료 예정 안내',
    message: '필수 동의 항목의 유효기간이 곧 만료됩니다. 다시 동의해 주세요.',
  }),
  {
    title: '필수 동의 항목 만료 예정',
    message: '필수 동의 항목의 유효기간이 곧 만료됩니다. 다시 동의해 주세요.',
    actionLabel: '동의 내역 보기',
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
    title: '본인인증 완료',
    message: '본인인증이 완료됐습니다.\n인증 일시와 등록된 정보를 확인해 주세요.',
    actionLabel: '내 정보 보기',
    path: '/mypage/settings',
  },
)

/** 시안 없는 알림은 팝업 없이 바로 이동 */
assert.equal(
  resolvePortalNotificationPopup({
    ...base,
    eventType: 'NOTICE',
    linkType: 'NOTICE',
    title: '공지',
    message: '공지',
  }),
  null,
)

console.log('resolve-portal-notification-popup.selfcheck: ok')
