/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/auth-restore-notice.selfcheck.ts
 *
 * QA-0137: 로그인 복원 실패 안내 상태·버튼 구성.
 */
import {
  buildSignInPathWithRedirect,
  confirmAuthRestoreNotice,
  dismissAuthRestoreNotice,
  isSessionExpiredNoticePending,
  getAuthRestoreNotice,
  resetAuthRestoreNoticeForTest,
  resolveAuthRestoreNoticeActions,
  showAuthRestoreNotice,
  showSessionExpiredNotice,
  subscribeAuthRestoreNotice,
} from './auth-restore-notice.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

resetAuthRestoreNoticeForTest()
assert(getAuthRestoreNotice() === null, 'starts without notice')

let notified = 0
const unsubscribe = subscribeAuthRestoreNotice(() => {
  notified += 1
})
showAuthRestoreNotice('unavailable')
assert(getAuthRestoreNotice() === 'unavailable' && notified === 1, 'show notifies')
showAuthRestoreNotice('unavailable')
assert(notified === 1, 'same notice does not re-notify')

// 로그아웃은 '확인 못 함'만 닫는다
dismissAuthRestoreNotice('session-ended')
assert(getAuthRestoreNotice() === 'unavailable', 'dismiss(only) keeps other notice')
showAuthRestoreNotice('session-ended')
assert(getAuthRestoreNotice() === 'session-ended', '② → ① switch')
dismissAuthRestoreNotice('unavailable')
assert(getAuthRestoreNotice() === 'session-ended', 'logout keeps session-ended notice')
dismissAuthRestoreNotice()
assert(getAuthRestoreNotice() === null, 'dismiss closes')
unsubscribe()

// 버튼 구성
assert(same(resolveAuthRestoreNoticeActions('session-ended', '/mypage'), ['close', 'sign-in']), '① 일반 화면: 닫기·로그인')
assert(same(resolveAuthRestoreNoticeActions('session-ended', '/auth/sign-in'), ['confirm']), '① 로그인 화면: 확인만')
assert(same(resolveAuthRestoreNoticeActions('session-ended', '/auth/required'), ['confirm']), '① 로그인 필요 화면: 확인만')
assert(same(resolveAuthRestoreNoticeActions('session-ended', '/auth/sign-up'), ['close', 'sign-in']), '① 다른 auth 화면은 일반')
assert(same(resolveAuthRestoreNoticeActions('unavailable', '/mypage'), ['close', 'retry']), '② 닫기·다시 시도')
assert(same(resolveAuthRestoreNoticeActions('unavailable', '/auth/sign-in'), ['close', 'retry']), '② 로그인 화면도 다시 시도')

// 사용 중 세션 종료(session-expired): 화면에 머문 채 안내하고 [확인] 때만 로그아웃을 한 번 실행
{
  resetAuthRestoreNoticeForTest()
  const calls = { logout: 0, second: 0, silent: 0 }
  showSessionExpiredNotice(() => { calls.logout += 1 })
  showSessionExpiredNotice(() => { calls.second += 1 })
  assert(getAuthRestoreNotice() === 'session-expired' && isSessionExpiredNoticePending(), 'session-expired shown')
  assert(calls.logout < 1, 'logout waits for confirm')
  showAuthRestoreNotice('unavailable')
  assert(getAuthRestoreNotice() === 'session-expired', 'other notices do not replace session-expired')
  dismissAuthRestoreNotice('unavailable')
  assert(getAuthRestoreNotice() === 'session-expired', 'logout cleanup keeps session-expired')
  assert(same(resolveAuthRestoreNoticeActions('session-expired', '/mypage'), ['confirm']), 'session-expired: 확인만')
  confirmAuthRestoreNotice()
  assert(calls.logout === 1 && calls.second === 0, 'confirm runs the first logout once')
  assert(getAuthRestoreNotice() === null && !isSessionExpiredNoticePending(), 'confirm closes')
  confirmAuthRestoreNotice()
  assert(calls.logout === 1, 'confirm again does nothing')

  // 다른 탭 재로그인 등 코드에서 닫으면(새 토큰) 로그아웃하지 않는다
  showSessionExpiredNotice(() => { calls.silent += 1 })
  dismissAuthRestoreNotice()
  assert(getAuthRestoreNotice() === null && calls.silent === 0, 'programmatic dismiss does not logout')
  resetAuthRestoreNoticeForTest()
}

// 로그인 이동: 기존 redirect 규칙
assert(
  buildSignInPathWithRedirect('/mypage/education?tab=1') ===
    '/auth/sign-in?redirect=%2Fmypage%2Feducation%3Ftab%3D1',
  'sign-in keeps current path as redirect',
)
assert(buildSignInPathWithRedirect('') === '/auth/sign-in?redirect=%2F', 'empty path → /')

resetAuthRestoreNoticeForTest()
console.log('auth-restore-notice selfcheck ok')
