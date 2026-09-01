import { test, expect } from '../../fixtures/test'
import {
  UjatProgramRegistrationPage,
  type UjatRegistrationCompleteResult,
} from '../../pages/ujat-program-registration.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

/**
 * Phase 3 — UJAT 프로그램 신규 등록
 *
 * 1) 등록 완료 → 2) 목록 확인 (`serial`)
 * 제목: `Playwright UJAT 테스트·{hash}`
 *
 * 전제: auth.setup · programs/ujatPrograms 실 API · 후원사 목록
 */
test.describe.configure({ mode: 'serial' })

test.describe('UJAT 프로그램 신규 등록', () => {
  let registration: UjatProgramRegistrationPage | undefined
  let created: UjatRegistrationCompleteResult | undefined

  test('1) 등록 완료', async ({ page }) => {
    test.setTimeout(360_000)

    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    registration = new UjatProgramRegistrationPage(page)
    await expect(page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })
    await registration.openNewRegistration()
    await registration.fillCommonInfo()
    await registration.goToRecruitment()
    await registration.fillRecruitmentInfo()
    await registration.goToApplication()
    await registration.fillApplicationInfo()

    created = await registration.completeRegistration()
    await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeHidden({
      timeout: 30_000,
    })
    expect(created.programId.length).toBeGreaterThan(0)
    expect(created.programTitle).toContain('Playwright UJAT 테스트')
  })

  test('2) 목록 확인', async ({ page }) => {
    test.setTimeout(180_000)

    expect(created, '1) 등록 완료 결과가 필요합니다').toBeDefined()
    registration = new UjatProgramRegistrationPage(page)
    await registration.expectProgramVisibleInList(created!)
  })
})
