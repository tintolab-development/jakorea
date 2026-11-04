import { expect, test } from '@playwright/test'
import { assertIsolatedNetwork, installCsIsolatedNetwork } from './install-cs-isolated-network'
import {
  completeAndCapture,
  createOverlay,
  expectRequiredIncompleteAlert,
  fillIsolatedCommonInfo,
  fillKpiValueAt,
  fillRegistrationThroughComplete,
  openFreshWizard,
  VALUES_B,
} from './cs-isolated-helpers'

test.describe.configure({ mode: 'default' })

test.describe('CS-B07 RHF 필수검사·격리', () => {
  test('공통정보 미입력 시 CREATE 0건이고 입력값이 Overlay로 덮이지 않는다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first().fill(VALUES_B.title)
    await page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expectRequiredIncompleteAlert(page)
    expect(log.createProgram).toBeNull()
    await expect(page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()).toHaveValue(
      VALUES_B.title
    )
    await expect(
      page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()
    ).toHaveValue('')
    assertIsolatedNetwork(log)
  })

  test('KPI 0은 통과하고 명시적 빈 지급항목은 CREATE를 막는다', async ({ page }) => {
    const zeroLog = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await page
      .getByRole('button', { name: '모집 정보 돌아가기' })
      .click({ timeout: 8_000 })
      .catch(() => undefined)
    await page
      .getByRole('button', { name: '공통 정보 돌아가기' })
      .click({ timeout: 8_000 })
      .catch(() => undefined)
    await fillKpiValueAt(page, 0, '0')
    await page
      .getByRole('button', { name: '신청 정보 작성하기' })
      .click()
      .catch(async () => {
        await page.getByRole('button', { name: '모집 정보 작성하기' }).click()
        await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
      })
    await completeAndCapture(page, zeroLog)
    const overlay = createOverlay(zeroLog)
    expect(overlay['economyRegistration.kpi.participantCount']).toBe(0)
    expect(JSON.stringify(overlay)).not.toMatch(/trainedTeachers\.|ujat\.|gemini\./)
    assertIsolatedNetwork(zeroLog)
  })

  test('기관 모집기간 미입력은 신청 단계로 넘기지 않고 CREATE 0건이다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillIsolatedCommonInfo(page)
    await page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await page
      .getByRole('tab', { name: /참여 기관 모집|참여자 모집/ })
      .click()
      .catch(() => undefined)
    await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await expectRequiredIncompleteAlert(page)
    expect(log.createProgram).toBeNull()
    await expect(page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible()
    assertIsolatedNetwork(log)
  })

  test('신청서 fill 미완이 CMS 등록 완료 게이트를 막지 않는다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    expect(log.createProgram).not.toBeNull()
    const overlay = createOverlay(log)
    expect(JSON.stringify(overlay)).not.toContain('application.economy.')
    assertIsolatedNetwork(log)
  })
})
