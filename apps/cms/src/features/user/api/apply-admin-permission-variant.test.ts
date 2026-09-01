import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import {
  applyAdminPermissionVariantToUser,
  resolveAdminAccountIdForPermissionPatch,
} from './apply-admin-permission-variant'

function adminUser(partial: Partial<Omit<User, 'password'>> = {}): Omit<User, 'password'> {
  return {
    id: 'admin-account-172231',
    name: '직접등록관리자',
    email: 'admin@local.demo',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2024-08-28T00:00:00.000Z',
    updatedAt: '2024-08-28T00:00:00.000Z',
    adminAccountId: 172231,
    listMetrics: { adminPermissionVariant: 'viewer' },
    ...partial,
  }
}

describe('resolveAdminAccountIdForPermissionPatch', () => {
  it('existing.adminAccountId를 우선한다', () => {
    expect(
      resolveAdminAccountIdForPermissionPatch({
        userId: 'uuid-admin',
        existing: { adminAccountId: 172231 },
      })
    ).toBe(172231)
  })

  it('admin-account-{id} userId에서 파싱한다', () => {
    expect(
      resolveAdminAccountIdForPermissionPatch({
        userId: 'admin-account-172231',
      })
    ).toBe(172231)
  })
})

describe('applyAdminPermissionVariantToUser', () => {
  it('권한 유형만 overlay하고 기존 필드를 유지한다', () => {
    const next = applyAdminPermissionVariantToUser(adminUser(), 'partner', 172231)
    expect(next.listMetrics?.adminPermissionVariant).toBe('partner')
    expect(next.adminAccountId).toBe(172231)
    expect(next.name).toBe('직접등록관리자')
  })
})
