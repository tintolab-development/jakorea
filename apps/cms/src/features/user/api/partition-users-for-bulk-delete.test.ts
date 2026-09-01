import { describe, expect, it } from 'vitest'
import { AccountDirectoryItemResponseAccountType } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponseAccountType'
import type { User } from '@/types/user'
import {
  collectAdminAccountIds,
  collectMemberIds,
  collectOrganizationIds,
  toAccountDirectoryBulkDeleteTargets,
} from './partition-users-for-bulk-delete'

function user(partial: Partial<User> & Pick<User, 'id' | 'email' | 'name' | 'role'>): Omit<User, 'password'> {
  return {
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('toAccountDirectoryBulkDeleteTargets', () => {
  it('ADMIN / MEMBER를 typed targets로 나눈다', () => {
    expect(
      toAccountDirectoryBulkDeleteTargets([
        user({ id: 'a', email: 'a@x', name: '관리자', role: 'ADMIN', adminAccountId: 3 }),
        user({ id: 'm', email: 'm@x', name: '회원', role: 'INDIVIDUAL', memberId: 9 }),
      ])
    ).toEqual([
      { accountType: AccountDirectoryItemResponseAccountType.ADMIN_ACCOUNT, id: 3 },
      { accountType: AccountDirectoryItemResponseAccountType.MEMBER, id: 9 },
    ])
  })
})

describe('collect*Ids', () => {
  it('탭별 id를 수집한다', () => {
    expect(
      collectAdminAccountIds([
        user({ id: 'a', email: 'a@x', name: '관리자', role: 'ADMIN', adminAccountId: 1 }),
      ])
    ).toEqual([1])
    expect(
      collectMemberIds([
        user({ id: 'm', email: 'm@x', name: '회원', role: 'INSTRUCTOR', memberId: 5 }),
      ])
    ).toEqual([5])
    expect(
      collectOrganizationIds([
        user({
          id: 'organization-12',
          email: '-',
          name: '테스트고',
          role: 'SCHOOL',
          organizationId: 12,
        }),
      ])
    ).toEqual([12])
  })
})
