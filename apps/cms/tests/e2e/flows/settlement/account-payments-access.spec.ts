import { test, expect } from '../../fixtures/test'

const ACCESS_DENIED_TITLE = '접근 권한이 없습니다.'
const PM_ME = {
  adminAccountId: 171601,
  uuid: 'mock-md-admin-171601',
  email: 'admin1@jakorea.org',
  name: 'PM 관리자',
  roleCode: 'PM',
  status: 'ACTIVE',
  permissionCodes: ['PROGRAM_READ'],
}

async function stubPmSession(page: import('@playwright/test').Page) {
  await page.route('**/api/admin/me', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: PM_ME,
    })
  )
  await page.addInitScript(() => {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return
    const user = JSON.parse(raw) as { roleCode?: string; adminLevel?: string }
    user.roleCode = 'PM'
    user.adminLevel = 'ADMIN'
    localStorage.setItem('auth_user', JSON.stringify(user))
  })
}

async function expectAccessDeniedAlert(page: import('@playwright/test').Page) {
  await expect(page.getByText(ACCESS_DENIED_TITLE, { exact: true })).toBeVisible()
  await expect(
    page.getByText('해당 화면은 권한이 있는 사용자만 이용할 수 있습니다.')
  ).toBeVisible()
  await expect(page.getByText('마스터 관리자에게 문의해 주세요.')).toBeVisible()
  await expect(page.getByText('해당 기능은 현재 준비 중입니다.')).toHaveCount(0)
}

test.describe('C-162 계좌 지급 권한 없음 안내', () => {
  test('화면 안에서 계좌 지급으로 이동하면 안내가 뜨고 확인 후 이전 화면으로 돌아간다', async ({
    page,
  }) => {
    await stubPmSession(page)
    await page.goto('/settlement-management/payment-orders')
    await page.evaluate(() => {
      const raw = localStorage.getItem('auth_user')
      if (!raw) return
      const user = JSON.parse(raw) as { roleCode?: string; adminLevel?: string }
      user.roleCode = 'PM'
      user.adminLevel = 'ADMIN'
      localStorage.setItem('auth_user', JSON.stringify(user))
    })
    await page.reload()
    await expect(page).toHaveURL(/\/settlement-management\/payment-orders/)

    await page.goto('/settlement-management/account-payments')
    await expectAccessDeniedAlert(page)
    await expect(page).toHaveURL(/\/settlement-management\/account-payments/)

    await page.getByRole('button', { name: '확인' }).click()
    await expect(page).toHaveURL(/\/settlement-management\/payment-orders/)
    await expect(page.getByText(ACCESS_DENIED_TITLE, { exact: true })).toHaveCount(0)
  })

  test('전체 페이지 로드로 계좌 지급 URL에 들어오면 확인을 누를 때까지 안내가 남는다', async ({
    page,
  }) => {
    await stubPmSession(page)
    await page.goto('/settlement-management/account-payments?ap_detail=row-1')

    await expectAccessDeniedAlert(page)
    await expect(page).toHaveURL(/\/settlement-management\/account-payments/)
    await expect(page).toHaveURL(/ap_detail=row-1/)

    await page.getByRole('button', { name: '확인' }).click()
    await expect(page).not.toHaveURL(/account-payments/)
    await expect(page.getByText(ACCESS_DENIED_TITLE, { exact: true })).toHaveCount(0)
  })
})
