/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/login-redirect.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  buildSignInPathWithRedirect,
  resolveLoginRedirectTarget,
  resolveSocialLoginReturnPath,
  sanitizeLoginRedirectPath,
} from './login-redirect.ts'

// 내부 경로는 쿼리·해시까지 유지
assert.equal(
  sanitizeLoginRedirectPath('/mypage/lectures/INSTRUCTOR/12?tab=report#top'),
  '/mypage/lectures/INSTRUCTOR/12?tab=report#top'
)
assert.equal(sanitizeLoginRedirectPath('/programs/3/apply?focus=1'), '/programs/3/apply?focus=1')

// 관리자 등록 회원 온보딩 안내는 로그인 후 복귀 대상
assert.equal(
  sanitizeLoginRedirectPath('/auth/admin-registered/notice'),
  '/auth/admin-registered/notice'
)

// 외부·비정상 경로 거부
for (const value of [
  null,
  undefined,
  '',
  '   ',
  'https://evil.com',
  '//evil.com',
  '/\\evil.com',
  '/x?u=https://evil.com',
  'javascript:alert(1)',
  'mypage',
]) {
  assert.equal(sanitizeLoginRedirectPath(value), null, String(value))
}

// 로그인 루프·공개 인증 화면 거부
for (const value of [
  '/',
  '/auth/sign-in',
  '/auth/sign-in?redirect=%2Fmypage',
  '/auth/required?redirect=%2Fmypage',
  '/auth/sign-up/complete',
  '/auth/find-password/reset',
  '/auth/social/complete',
]) {
  assert.equal(sanitizeLoginRedirectPath(value), null, value)
}

assert.equal(
  buildSignInPathWithRedirect('/mypage/settings?tab=1'),
  '/auth/sign-in?redirect=%2Fmypage%2Fsettings%3Ftab%3D1'
)
assert.equal(buildSignInPathWithRedirect('//evil.com'), '/auth/sign-in')

assert.equal(resolveLoginRedirectTarget('/mypage'), '/mypage')
assert.equal(resolveLoginRedirectTarget('https://evil.com'), '/')
assert.equal(resolveLoginRedirectTarget(null), '/')

// 소셜 로그인 복귀: 저장된 returnUrl(login intent) 사용
assert.equal(
  resolveSocialLoginReturnPath({
    queryRedirect: null,
    oauthIntent: 'login',
    storedReturnUrl: '/mypage/settings',
  }),
  '/mypage/settings'
)
// 완료 URL에 redirect가 있으면 우선
assert.equal(
  resolveSocialLoginReturnPath({
    queryRedirect: '/programs/3',
    oauthIntent: 'login',
    storedReturnUrl: '/mypage/settings',
  }),
  '/programs/3'
)
// link intent(가입·연결)의 returnUrl은 로그인 복귀에 쓰지 않음
assert.equal(
  resolveSocialLoginReturnPath({
    queryRedirect: null,
    oauthIntent: 'link',
    storedReturnUrl: '/auth/sign-up/social-connect/complete',
  }),
  '/'
)
// 저장값도 검증
assert.equal(
  resolveSocialLoginReturnPath({
    queryRedirect: null,
    oauthIntent: 'login',
    storedReturnUrl: 'https://evil.com',
  }),
  '/'
)
assert.equal(
  resolveSocialLoginReturnPath({ queryRedirect: null, oauthIntent: null, storedReturnUrl: null }),
  '/'
)

console.log('login-redirect selfcheck ok')
