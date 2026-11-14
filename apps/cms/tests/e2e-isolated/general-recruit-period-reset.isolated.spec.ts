import { expect, test, type Page } from '@playwright/test'
import {
  GeneralProgramRegistrationPage,
  REGISTRATION_CASES,
} from '../e2e/pages/general-program-registration.page'
import { installIsolatedRegistrationNetwork } from './install-isolated-network'

/**
 * 재현: 기관+봉사자 → 모집 단계 「참여 기관 모집 정보」에서 참여자 모집 기간을 다음 달로 넘겨
 * 두 날짜를 고르면 참여 유형·탭이 초기화되지 않아야 한다.
 */
const ORG = REGISTRATION_CASES.find(
  row =>
    row.audience === 'organization' && row.structure === 'curriculum' && row.session === 'single'
)

async function tabs(page: Page) {
  return (await page.getByRole('tab').allInnerTexts()).map(text => text.trim())
}

test('기관+봉사자 — 참여자 모집 기간 선택 후에도 참여 유형·탭 유지', async ({ page }) => {
  if (ORG == null) throw new Error('case')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text().slice(0, 300)}`)
  })
  await installIsolatedRegistrationNetwork(page)
  await page.goto('/programs/general')
  await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 45_000 })
  const registration = new GeneralProgramRegistrationPage(page, ORG, {
    skipOptionalUploads: true,
    safeWagePaymentItems: true,
    devAutofillCaseId: 1,
    ensureFutureDates: true,
    programTitle: `[BOT-TEST-VOL] repro ${Date.now()}`,
  })
  ;(
    registration as unknown as { ensureSponsorManagerSelected: () => Promise<void> }
  ).ensureSponsorManagerSelected = async () => undefined
  await registration.openNewRegistration()
  await expect(page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()).toBeVisible({
    timeout: 30_000,
  })
  await registration.fillCommonInfo()
  const teacher = page.getByRole('checkbox', { name: /^강사$/ }).first()
  if ((await teacher.count()) > 0 && (await teacher.isChecked())) await teacher.click()
  await registration.goToRecruitment()
  await expect(page).toHaveURL(/generalStep=recruit-participant-school/)
  const before = await tabs(page)
  test.info().annotations.push({ type: 'tabs-before', description: JSON.stringify(before) })
  expect(before.some(t => t.includes('봉사자 모집 정보'))).toBe(true)

  const field = page
    .locator('.detail-info-form__field:visible')
    .filter({
      has: page.locator('.detail-info-form__field-label-text', { hasText: '참여자 모집 기간' }),
    })
    .first()
  const trigger = field.locator('.paragraph-date-picker__trigger, button').first()
  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: /날짜/ })
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  await dialog.locator('button.calendar-mini-nav-btn').last().click()
  const cells = () =>
    dialog.locator(
      'button.calendar-mini-cell:not(.calendar-mini-cell--disabled):not(.calendar-mini-cell--other-month)'
    )
  await cells().filter({ hasText: /^1$/ }).first().click()
  await page.waitForTimeout(400)
  const afterFirst = await tabs(page)
  test
    .info()
    .annotations.push({ type: 'tabs-after-first-click', description: JSON.stringify(afterFirst) })
  const endField = dialog
    .locator('.date-time-picker-popover__field')
    .filter({ hasText: '종료일' })
    .first()
  if (await endField.isVisible().catch(() => false)) await endField.click()
  await cells().filter({ hasText: /^20$/ }).first().click()
  await page.waitForTimeout(400)
  const afterSecond = await tabs(page)
  test
    .info()
    .annotations.push({ type: 'tabs-after-second-click', description: JSON.stringify(afterSecond) })
  const setBtn = dialog.getByRole('button', { name: '설정' })
  if (await setBtn.isVisible().catch(() => false)) await setBtn.click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: test.info().outputPath('after-period.png') })
  const after = await tabs(page)
  test.info().annotations.push({ type: 'tabs-after', description: JSON.stringify(after) })
  test.info().annotations.push({ type: 'errors', description: JSON.stringify(errors.slice(0, 20)) })
  test.info().annotations.push({ type: 'url', description: page.url() })
  console.log(
    'REPRO',
    JSON.stringify({
      before,
      afterFirst,
      afterSecond,
      after,
      url: page.url(),
      errors: errors.slice(0, 10),
    })
  )
  expect(
    after.some(t => t.includes('봉사자 모집 정보')),
    JSON.stringify(after)
  ).toBe(true)
  expect(after.includes('참여자 모집 정보'), JSON.stringify(after)).toBe(false)
})
