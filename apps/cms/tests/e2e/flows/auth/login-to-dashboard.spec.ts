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

  test('대시보드 설정 모달이 뷰포트 안에서 푸터까지 보인다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '대시보드 설정' }).click()
    const dialog = page.getByRole('dialog', { name: '대시보드 설정' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: '설정' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: '닫기' })).toBeVisible()

    const box = await dialog.locator('.ant-modal-content').boundingBox()
    const viewport = page.viewportSize()
    expect(box, '모달 패널 박스를 측정할 수 있어야 한다').toBeTruthy()
    expect(viewport).toBeTruthy()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual((viewport?.height ?? 0) + 1)
  })
})
