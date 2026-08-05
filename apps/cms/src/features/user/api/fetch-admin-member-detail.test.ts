import { describe, expect, it, vi } from 'vitest'
import {
  fetchAdminMemberDetailAsUser,
  parseAdminAccountIdFromUserId,
  resolveAdminAccountIdForDetail,
  resolveAdminDetailPathId,
  shouldUseAdminAccountDetailApi,
} from './fetch-admin-member-detail'

vi.mock('@/features/user/api/members-api-client', () => ({
  fetchAdminAccountDetailRemote: vi.fn(),
}))

vi.mock('@/features/user/api/map-admin-account-detail-to-user', () => ({
  mapAdminAccountDetailToUser: vi.fn((detail, opts) => ({
    id: opts?.fallbackId ?? 'mapped',
    role: 'ADMIN',
    adminAccountId: detail.id,
    email: detail.email ?? '-',
    name: detail.name ?? '-',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  })),
}))

import { fetchAdminAccountDetailRemote } from '@/features/user/api/members-api-client'

const fetchAdminAccountDetailRemoteMock = vi.mocked(fetchAdminAccountDetailRemote)

describe('fetch-admin-member-detail', () => {
  it('parseAdminAccountIdFromUserId — admin-account-123', () => {
    expect(parseAdminAccountIdFromUserId('admin-account-123')).toBe(123)
    expect(parseAdminAccountIdFromUserId('uuid-only')).toBeUndefined()
  })

  it('shouldUseAdminAccountDetailApi — numeric adminAccountId 또는 admin-account id만 true', () => {
    expect(shouldUseAdminAccountDetailApi({ adminAccountId: 7 })).toBe(true)
    expect(shouldUseAdminAccountDetailApi({ userId: 'admin-account-3' })).toBe(true)
    expect(shouldUseAdminAccountDetailApi({ role: 'ADMIN', userId: 'local-admin-member-viewer' })).toBe(
      false
    )
  })

  it('resolveAdminDetailPathId — adminAccountId 우선', () => {
    expect(resolveAdminDetailPathId('local-admin-member-viewer', { adminAccountId: 7 })).toBe(7)
  })

  it('resolveAdminDetailPathId — local slug는 거부', () => {
    expect(() => resolveAdminDetailPathId('local-admin-member-viewer')).toThrow(/adminAccountId/)
  })

  it('fetchAdminMemberDetailAsUser — numeric adminId로 상세 GET', async () => {
    fetchAdminAccountDetailRemoteMock.mockResolvedValue({
      id: 7,
      email: 'admin@test.com',
      name: '관리자',
    })

    await fetchAdminMemberDetailAsUser('admin-account-7', {
      adminAccountId: 7,
      memberId: 99,
    })

    expect(fetchAdminAccountDetailRemoteMock).toHaveBeenCalledTimes(1)
    expect(fetchAdminAccountDetailRemoteMock).toHaveBeenCalledWith(7)
  })

  it('resolveAdminAccountIdForDetail — slug 없이 numeric만', async () => {
    await expect(resolveAdminAccountIdForDetail('local-admin-member-viewer')).rejects.toThrow(
      /adminAccountId/
    )
    await expect(resolveAdminAccountIdForDetail('admin-account-12')).resolves.toBe(12)
  })
})
