import { expect, test } from '@playwright/test'
import {
  assertIsolatedNetwork,
  installTtIsolatedNetwork,
  type IsolatedNetworkLog,
} from './install-tt-isolated-network'
import {
  assertFormVersionSplit,
  autofillAndWalk,
  createBodyHasNoApplication,
  waitWizard,
} from './tt-isolated-helpers'

test.describe.configure({ mode: 'serial' })

test.describe('TT 신규 등록 RHF 격리 E2E', () => {
  test('공통·모집·신청 단계를 지나 CREATE와 Form Version PUT을 캡처한다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page)
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await autofillAndWalk(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect
      .poll(() => log.createProgram, { timeout: 60_000 })
      .not.toBeNull()
    assertIsolatedNetwork(log)
    expect(log.formVersionPuts.length).toBeGreaterThan(0)
    expect(log.formVersionPublishes.length).toBeGreaterThan(0)
    createBodyHasNoApplication(log.createProgram?.body)
    const create = log.createProgram?.body as { programType?: string; title?: string }
    expect(create.programType).toBe('TRAINED_TEACHER')
    assertFormVersionSplit(log)
    const bindings = JSON.stringify(log.formBindings)
    if (log.formBindings.length > 0) {
      expect(bindings).toContain('APPLICATION')
    }
  })

  test('Form Version PUT 실패 시 Program CREATE가 나가지 않는다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, { failMode: 'put' })
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await autofillAndWalk(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect(page.getByText('교육받은 교사 프로그램 등록').first()).toBeVisible()
    await expect.poll(() => log.formVersionPuts.length, { timeout: 20_000 }).toBeGreaterThan(0)
    expect(log.createProgram).toBeNull()
    expect(log.formVersionPublishes).toHaveLength(0)
  })

  test('publish 실패 시 Program CREATE가 나가지 않는다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, { failMode: 'publish' })
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await autofillAndWalk(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect(page.getByText('교육받은 교사 프로그램 등록').first()).toBeVisible()
    await expect.poll(() => log.formVersionPublishes.length, { timeout: 20_000 }).toBeGreaterThan(0)
    expect(log.createProgram).toBeNull()
  })

  test('CREATE 실패 시 입력값이 유지된다', async ({ page }) => {
    const log: IsolatedNetworkLog = await installTtIsolatedNetwork(page, { failMode: 'create' })
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await autofillAndWalk(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect.poll(() => log.createProgram, { timeout: 20_000 }).not.toBeNull()
    await expect(page.getByText('교육받은 교사 프로그램 등록').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '자동입력(개발용)' })).toBeVisible()
  })

  test('등록 위저드 열기/닫기 재진입과 빠른 토글에서 무한 렌더가 없다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page)
    const consoleErrors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', error => {
      consoleErrors.push(error.message)
    })

    for (let index = 0; index < 3; index += 1) {
      await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
      await waitWizard(page)
      await page.goto('/programs/trained-teachers')
      await expect(page).toHaveURL(/\/programs\/trained-teachers/, { timeout: 20_000 })
    }

    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    const training = page.getByRole('switch', { name: '교육 연수' })
    if (await training.isVisible().catch(() => false)) {
      await training.click()
      await training.click()
    }
    const survey = page.getByRole('checkbox', { name: '설문조사' })
    if (await survey.isVisible().catch(() => false)) {
      await survey.click()
      await survey.click()
    }
    await expect(page.getByRole('button', { name: '자동입력(개발용)' })).toBeVisible()
    expect(consoleErrors.filter(text => text.includes('Maximum update depth'))).toHaveLength(0)
    assertIsolatedNetwork(log)
  })
})
