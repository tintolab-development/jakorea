import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  JABACK_LOCAL_DEV_ORIGIN,
  getApiBaseUrlForPath,
} from '../src/shared/lib/api-remote-env'

const NICE_MEMBER_SIGNUP_START =
  '/api/auth/verification-sessions/identity/nice/start'

describe('platform getApiBaseUrlForPath — JABACK NICE start', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('DEV + env 없음 → JABACK :8080 (5173 API host 금지)', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_API_SERVER', '')
    vi.stubEnv('VITE_DEV_PROXY_TARGET', '')
    vi.stubEnv('VITE_NGROK_SERVER', '')

    expect(getApiBaseUrlForPath(NICE_MEMBER_SIGNUP_START)).toBe(JABACK_LOCAL_DEV_ORIGIN)
  })

  it('DEV + VITE_API_SERVER → same-origin proxy (빈 baseURL)', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_API_SERVER', 'http://localhost:8080')

    expect(getApiBaseUrlForPath(NICE_MEMBER_SIGNUP_START)).toBe('')
  })

  it('DEV + VITE_API_BASE_URL → 배포 오리진 직호출', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
    vi.stubEnv('VITE_API_SERVER', '')

    expect(getApiBaseUrlForPath(NICE_MEMBER_SIGNUP_START)).toBe('https://api.example.test')
  })

  it('AGE14 portal 경로는 JABACK dev 라우팅과 분리 (portal prefix)', () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_API_SERVER', '')

    expect(getApiBaseUrlForPath('/api/portal/me/age-transition/nice/start')).toBe(
      JABACK_LOCAL_DEV_ORIGIN,
    )
  })
})
