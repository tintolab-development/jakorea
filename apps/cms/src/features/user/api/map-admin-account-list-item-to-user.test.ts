import { describe, expect, it } from 'vitest'
import { mapAdminAccountListItemToUser } from './map-admin-account-list-item-to-user'

describe('mapAdminAccountListItemToUser', () => {
  it('managedProgramCount를 listMetrics에 매핑한다', () => {
    const user = mapAdminAccountListItemToUser({
      adminAccountId: 165001,
      uuid: 'admin-uuid',
      email: 'pm@ja.org',
      name: 'PM',
      roleCode: 'MASTER',
      managedProgramCount: 7,
    })

    expect(user.listMetrics?.managedProgramCount).toBe(7)
    expect(user.listMetrics?.adminPermissionVariant).toBe('manager')
  })
})
