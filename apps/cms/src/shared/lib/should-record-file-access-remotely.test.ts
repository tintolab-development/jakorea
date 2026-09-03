import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldRecordFileAccessRemotely } from '@/shared/lib/should-record-file-access-remotely'

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn(() => false),
}))

describe('shouldRecordFileAccessRemotely', () => {
  const getItem = vi.fn<(key: string) => string | null>(() => null)

  beforeEach(() => {
    getItem.mockReturnValue(null)
    vi.mocked(isRealApiModuleEnabled).mockReturnValue(false)
    vi.stubGlobal('window', { localStorage: { getItem } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('logs 모듈이 꺼져 있으면 false', () => {
    getItem.mockReturnValue('aaa.bbb.ccc')
    expect(shouldRecordFileAccessRemotely()).toBe(false)
  })

  it('mock JWT면 false', () => {
    vi.mocked(isRealApiModuleEnabled).mockImplementation(module => module === 'logs')
    getItem.mockReturnValue('mock-jwt-token-admin')
    expect(shouldRecordFileAccessRemotely()).toBe(false)
  })

  it('logs 실 API + 관리자 JWT이면 true', () => {
    vi.mocked(isRealApiModuleEnabled).mockImplementation(module => module === 'logs')
    getItem.mockReturnValue('aaa.bbb.ccc')
    expect(shouldRecordFileAccessRemotely()).toBe(true)
  })
})
