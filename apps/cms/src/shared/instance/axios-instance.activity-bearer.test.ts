/** @vitest-environment jsdom */
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert: vi.fn() }))
vi.mock('@/features/e2e-error-log/lib/record-from-axios-error', () => ({
  recordBackendErrorForE2e: vi.fn(),
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { axiosClient } from './axios-instance'

const bearer = 'fixture-admin-access-token'
const adapterMock = vi.fn()

function ok(config: InternalAxiosRequestConfig) {
  return { data: { updated: true }, status: 200, statusText: 'OK', headers: {}, config }
}

describe('ADMIN Activity Bearer and Refresh separation', () => {
  const originalAdapter = axiosClient.defaults.adapter

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: bearer, expiresAt: null })
    axiosClient.defaults.adapter = adapterMock as unknown as AxiosAdapter
  })

  afterEach(() => {
    axiosClient.defaults.adapter = originalAdapter
  })

  it('sends a valid-looking ADMIN Bearer on Activity', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config))
    const response = await axiosClient.post('/api/admin/auth/activity')
    expect(response.status).toBe(200)
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect((adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig).headers.get('Authorization'))
      .toBe(`Bearer ${bearer}`)
  })

  it('Activity 401 does not initiate refresh or retry', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, null, {
        status: 401, statusText: 'Unauthorized', headers: {}, config,
        data: { error: { code: 'UNAUTHORIZED' } },
      })
    })
    await expect(axiosClient.post('/api/admin/auth/activity')).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect((adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig).headers.get('Authorization'))
      .toBe(`Bearer ${bearer}`)
  })

  it('Refresh endpoint stays anonymous when skipAuth is set', async () => {
    adapterMock.mockImplementation(async (config: InternalAxiosRequestConfig) => ok(config))
    await axiosClient.post('/api/admin/auth/refresh', { refreshToken: 'fixture' }, {
      skipAuth: true, skipRefresh: true,
    } as never)
    expect(adapterMock).toHaveBeenCalledTimes(1)
    expect((adapterMock.mock.calls[0][0] as InternalAxiosRequestConfig).headers.get('Authorization'))
      .toBeUndefined()
  })
})
