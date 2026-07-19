import { test, expect } from '../fixtures/test'

test.describe('CMS application smoke', () => {
  // 로그인 페이지 검증 — setup storageState(어드민 세션)를 쓰지 않음
  test.use({ storageState: { cookies: [], origins: [] } })

  test('login page loads with core UI', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle('JAKorea CMS')
    await expect(
      page.getByText('인가된 관리자만 접속 가능하며, 중요 활동의 경우 로그로 기록됩니다.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인하기' })).toBeVisible()
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
  })
})
