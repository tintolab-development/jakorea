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

  it('hasProgramAssignmentHistory를 listMetrics에 그대로 매핑한다', () => {
    const withHistory = mapAdminAccountListItemToUser({
      adminAccountId: 165002,
      uuid: 'admin-uuid-2',
      roleCode: 'MASTER',
      managedProgramCount: 0,
      hasProgramAssignmentHistory: true,
    })
    const withoutField = mapAdminAccountListItemToUser({
      adminAccountId: 165003,
      uuid: 'admin-uuid-3',
      roleCode: 'MASTER',
    })

    expect(withHistory.listMetrics?.hasProgramAssignmentHistory).toBe(true)
    expect(withoutField.listMetrics?.hasProgramAssignmentHistory).toBeUndefined()
  })
})
