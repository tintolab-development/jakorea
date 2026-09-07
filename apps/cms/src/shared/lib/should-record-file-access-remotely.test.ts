import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldRecordFileAccessRemotely } from '@/shared/lib/should-record-file-access-remotely'

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn(() => false),
}))

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(() => false),
}))

describe('shouldRecordFileAccessRemotely', () => {
  beforeEach(() => {
    vi.mocked(isRealApiModuleEnabled).mockReturnValue(false)
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs 모듈이 꺼져 있으면 false', () => {
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    expect(shouldRecordFileAccessRemotely()).toBe(false)
  })

  it('관리자 JWT가 없으면 false', () => {
    vi.mocked(isRealApiModuleEnabled).mockImplementation(module => module === 'logs')
    expect(shouldRecordFileAccessRemotely()).toBe(false)
  })

  it('logs 실 API + 관리자 JWT이면 true', () => {
    vi.mocked(isRealApiModuleEnabled).mockImplementation(module => module === 'logs')
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    expect(shouldRecordFileAccessRemotely()).toBe(true)
  })
})
