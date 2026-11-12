import { describe, expect, it } from 'vitest'
import {
  buildLoginPathWithRedirect,
  resolveLoginRedirectTarget,
  sanitizeLoginRedirectPath,
} from './login-redirect'

describe('sanitizeLoginRedirectPath', () => {
  it('같은 앱 내부 경로는 쿼리·해시까지 그대로 허용한다', () => {
    expect(sanitizeLoginRedirectPath('/ja-korea/notices?page=2#top')).toBe(
      '/ja-korea/notices?page=2#top'
    )
  })

  it.each([
    [null],
    [undefined],
    [''],
    ['https://evil.com'],
    ['//evil.com'],
    ['/\\evil.com'],
    ['javascript:alert(1)'],
    ['ja-korea/notices'],
  ])('외부·비정상 경로 %s 는 거부한다', value => {
    expect(sanitizeLoginRedirectPath(value)).toBeNull()
  })

  it.each([['/'], ['/login'], ['/register'], ['/find-password'], ['/account/identity/callback']])(
    '로그인·공개 인증 화면 %s 는 거부한다',
    value => {
      expect(sanitizeLoginRedirectPath(value)).toBeNull()
    }
  )
})

describe('buildLoginPathWithRedirect', () => {
  it('안전한 경로는 인코딩해 redirect로 붙인다', () => {
    expect(buildLoginPathWithRedirect('/main/popups?page=1')).toBe(
      '/login?redirect=%2Fmain%2Fpopups%3Fpage%3D1'
    )
  })

  it('안전하지 않은 경로면 /login만 반환한다', () => {
    expect(buildLoginPathWithRedirect('//evil.com')).toBe('/login')
    expect(buildLoginPathWithRedirect('/')).toBe('/login')
  })
})

describe('resolveLoginRedirectTarget', () => {
  it('안전한 경로면 그대로, 아니면 대시보드(/)', () => {
    expect(resolveLoginRedirectTarget('/main/popups')).toBe('/main/popups')
    expect(resolveLoginRedirectTarget('https://evil.com')).toBe('/')
    expect(resolveLoginRedirectTarget(undefined)).toBe('/')
  })
})
