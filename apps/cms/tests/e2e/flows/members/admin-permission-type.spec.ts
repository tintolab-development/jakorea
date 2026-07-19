import { test, expect } from '../../fixtures/test'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'
import {
  ADMIN_PERMISSION_LABELS,
  AdminPermissionTypePage,
} from '../../pages/admin-permission-type.page'

/**
 * 관리자 회원 목록 → 권한 유형 드롭다운 변경
 *
 * FE: `PATCH /api/admin/admin-accounts/{adminId}/role` (changeAdminRole)
 * 기존 목록 행을 사용하며, 검증 후 원래 유형으로 되돌립니다.
 */
test.describe('관리자 권한 유형 변경', () => {
  test('목록에서 권한 유형을 변경하면 배지가 갱신된다', async ({ page }) => {
    test.setTimeout(180_000)

    const perm = new AdminPermissionTypePage(page)
    await perm.gotoAdminsList()
    await expectAuthenticatedShell(page)

    const row = await perm.firstPermissionRow()
    const originalLabel = await perm.readPermissionLabel(row)
    const next = perm.pickNextVariant(originalLabel)
    const originalVariant =
      originalLabel === ADMIN_PERMISSION_LABELS.manager
        ? 'manager'
        : originalLabel === ADMIN_PERMISSION_LABELS.partner
          ? 'partner'
          : 'viewer'

    await perm.changePermissionOnRow(row, next)
    await expect(perm.permissionTrigger(row)).toContainText(ADMIN_PERMISSION_LABELS[next])

    await perm.changePermissionOnRow(row, originalVariant)
    await expect(perm.permissionTrigger(row)).toContainText(originalLabel)
  })
})
