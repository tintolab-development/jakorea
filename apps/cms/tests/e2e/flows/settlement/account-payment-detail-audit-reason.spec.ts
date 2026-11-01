import { test, expect } from '../../fixtures/test'

/**
 * 계좌 지급 상세 진입 시 GET reason 회귀 방지.
 * 시드: accountPaymentId 188701 ([E2E-SETTLE]).
 */
test.describe('계좌 지급 상세 감사 reason', () => {
  test('상세 조회 요청에 reason 쿼리가 포함된다', async ({ page }) => {
    let sawReason = false

    await page.route('**/api/admin/account-payments/188701**', async route => {
      const url = new URL(route.request().url())
      if (url.searchParams.get('reason')?.includes('계좌 지급')) {
        sawReason = true
      }
      await route.continue()
    })

    await page.goto('/settlement-management/account-payments?period=2026-11')
    await expect(page.getByRole('heading', { name: /계좌 지급/ })).toBeVisible({
      timeout: 30_000,
    })

    const row = page.getByRole('row').filter({ hasText: '188701' }).first()
    if ((await row.count()) === 0) {
      // 목록에 ID 컬럼이 없으면 강사명으로 연다
      await page.getByText('[E2E-SETTLE] 김정산').first().click()
    } else {
      await row.click()
    }

    await expect.poll(() => sawReason, { timeout: 20_000 }).toBe(true)
  })
})
