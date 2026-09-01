import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldUseRemoteApi } from './capabilities'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn(),
}))

const mockHasJwt = vi.mocked(hasRemoteAdminJwt)
const mockModuleEnabled = vi.mocked(isRealApiModuleEnabled)

describe('UJAT remote capability', () => {
  beforeEach(() => {
    mockHasJwt.mockReturnValue(true)
    mockModuleEnabled.mockReturnValue(true)
  })

  it('JWT와 programs, ujatPrograms opt-in이 모두 있어야 활성화한다', () => {
    expect(shouldUseRemoteApi()).toBe(true)
    expect(mockModuleEnabled).toHaveBeenCalledWith('programs')
    expect(mockModuleEnabled).toHaveBeenCalledWith('ujatPrograms')
  })

  it('UJAT 별도 opt-in이 없으면 기본 OFF다', () => {
    mockModuleEnabled.mockImplementation(module => module === 'programs')
    expect(shouldUseRemoteApi()).toBe(false)
  })

  it('원격 JWT가 없으면 OFF다', () => {
    mockHasJwt.mockReturnValue(false)
    expect(shouldUseRemoteApi()).toBe(false)
  })
})
