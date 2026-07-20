import { test, expect } from '../../fixtures/test'

/**
 * 로그인·MFA 는 `auth.setup.ts` 에서 1회 수행 후 storageState 로 공유합니다.
 * 이 스펙은 저장된 세션이 대시보드로 복원되는지 검증합니다.
 *
 * (전체 스위트 병렬 시 동일 계정 MFA 재로그인 → MFA_CHALLENGE_INVALID 방지)
 */
test.describe('로그인 → MFA → 대시보드', () => {
  test('저장된 어드민 세션으로 대시보드에 진입한다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '대시보드 홈' })).toBeVisible()
    await expect(page.getByRole('button', { name: '대시보드 설정' })).toBeVisible()
  })
})
