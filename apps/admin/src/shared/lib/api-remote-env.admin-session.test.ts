import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getApiBaseUrlForPath,
  getApiBaseUrl,
  getHomepageApiBaseUrl,
} from './api-remote-env'

describe('Homepage Admin: JABACK-owned session routing', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('routes Activity, Session, MFA and Refresh to JABACK, not JAHOME', () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_API_BASE_URL', 'https://jaback.example.invalid/')
    vi.stubEnv('VITE_HOMEPAGE_API_BASE_URL', 'https://homeback.example.invalid/')
    expect(getApiBaseUrl()).toBe('https://jaback.example.invalid')
    expect(getHomepageApiBaseUrl()).toBe('https://homeback.example.invalid')
    for (const path of [
      '/api/admin/auth/activity',
      '/api/admin/auth/session',
      '/api/admin/auth/refresh',
      '/api/admin/auth/mfa/verify',
      '/api/admin/auth/logout',
      '/api/admin/me',
      '/api/admin/auth/session?source=visibility',
    ]) {
      expect(getApiBaseUrlForPath(path), path).toBe('https://jaback.example.invalid')
    }
    for (const path of [
      '/api/admin/main/strip-banners',
      '/api/admin/site/settings',
      '/api/public/news',
    ]) {
      expect(getApiBaseUrlForPath(path), path).toBe('https://homeback.example.invalid')
    }
  })

  it('never sends homepage domain CRUD to JABACK when both origins are configured', () => {
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_API_BASE_URL', 'https://jaback.example.invalid')
    vi.stubEnv('VITE_HOMEPAGE_API_BASE_URL', 'https://homeback.example.invalid')
    expect(getApiBaseUrlForPath('/api/admin/gnb-menus')).toBe('https://homeback.example.invalid')
    expect(getApiBaseUrlForPath('/api/admin/auth/activity')).toBe('https://jaback.example.invalid')
  })

  it('development preserves existing Vite proxy routing instead of using homepage origin', () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_HOMEPAGE_API_BASE_URL', 'https://homeback.example.invalid')
    expect(getApiBaseUrlForPath('/api/admin/auth/session')).toBe('')
  })
})
