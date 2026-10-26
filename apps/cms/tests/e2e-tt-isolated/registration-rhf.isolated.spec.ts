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
    // P2(방안 C): 양식 PUT/publish는 CREATE 이후에 나간다.
    await expect.poll(() => log.formVersionPublishes.length, { timeout: 30_000 }).toBeGreaterThan(0)
    // 등록·모집·신청 양식이 순차 적용되므로 신청 양식 PUT까지 끝날 때까지 기다린다.
    await expect(() => assertFormVersionSplit(log)).toPass({ timeout: 30_000 })
    assertIsolatedNetwork(log)
    expect(log.formVersionPuts.length).toBeGreaterThan(0)
    createBodyHasNoApplication(log.createProgram?.body)
    const create = log.createProgram?.body as { programType?: string; title?: string }
    expect(create.programType).toBe('TRAINED_TEACHER')
    // 방안 C: 양식마다 COPY→PUT→publish→바인딩 POST가 순차로 나가고 log.formBindings는 마지막 POST로 덮인다.
    // 신청 양식 바인딩 POST가 나갈 때까지 전체 바인딩 요청을 본다.
    await expect
      .poll(
        () =>
          JSON.stringify(
            log.mutations
              .filter(item => item.path.includes('/form-bindings'))
              .map(item => item.body)
          ),
        { timeout: 30_000 }
      )
      .toContain('APPLICATION')
  })

  test('Form Version PUT 실패 시 CREATE는 유지되고 일부 양식 적용 실패 안내가 뜬다', async ({
    page,
  }) => {
    // 방안 C(P2): 양식은 CREATE 후 프로그램 전용 COPY로 적용한다 → PUT 실패는 CREATE 이후 부분 실패.
    const log = await installTtIsolatedNetwork(page, { failMode: 'put' })
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await autofillAndWalk(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect.poll(() => log.createProgram, { timeout: 60_000 }).not.toBeNull()
    await expect.poll(() => log.formVersionPuts.length, { timeout: 20_000 }).toBeGreaterThan(0)
    await expect(page.getByText('일부 양식 적용 실패').first()).toBeVisible({ timeout: 20_000 })
    expect(log.formVersionPublishes).toHaveLength(0)
    assertIsolatedNetwork(log)
  })

  test('publish 실패 시 CREATE는 유지되고 일부 양식 적용 실패 안내가 뜬다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, { failMode: 'publish' })
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await autofillAndWalk(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect.poll(() => log.createProgram, { timeout: 60_000 }).not.toBeNull()
    await expect.poll(() => log.formVersionPublishes.length, { timeout: 20_000 }).toBeGreaterThan(0)
    await expect(page.getByText('일부 양식 적용 실패').first()).toBeVisible({ timeout: 20_000 })
    assertIsolatedNetwork(log)
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
