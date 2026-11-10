import { expect, test } from '@playwright/test'
import {
  assertIsolatedNetwork,
  installCsIsolatedNetwork,
  overlayFromFormVersionPut,
} from './install-cs-isolated-network'
import {
  completeAndCapture,
  createOverlay,
  fillRegistrationThroughComplete,
  openFreshWizard,
  expectWizardCommonTitle,
  saveWizardDraft,
  VALUES_A,
  VALUES_B,
  waitWizard,
} from './cs-isolated-helpers'

test.describe.configure({ mode: 'default' })

test.describe('CS-B01/B03/B06/B07 신규 등록 격리 E2E', () => {
  test('CS-B01 공통·모집·신청 입력 후 CREATE와 Form Version을 캡처한다', async ({ page }) => {
    test.setTimeout(240_000)
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    assertIsolatedNetwork(log)

    const create = log.createProgram?.body as {
      programType?: string
      title?: string
      mainTitle?: string
    }
    expect(create.programType).toBe('COMPANY_SCHOOL')
    expect(`${create.title ?? ''} ${create.mainTitle ?? ''}`).toContain(VALUES_B.title)

    const overlay = createOverlay(log)
    expect(JSON.stringify(overlay)).not.toContain('application.economy.')
    expect(JSON.stringify(log.createProgram?.body ?? {})).not.toContain('application.economy.')
    expect(JSON.stringify(overlay)).not.toContain('blob:')
    expect(overlay['economyRegistration.basicInfo.publicProgramTitle']).toBe(VALUES_B.announcement)
    expect(overlay['economyRegistration.kpi.participantCount']).toBe(20)
    expect(overlay['economyRegistration.wageInfo.grade1Fee']).toBe(111000)
    expect(overlay['economyRegistration.wageInfo.grade1DistanceFee']).toBe(112000)
    const paymentIds = overlay['economyRegistration.wageInfo.paymentItemValues']
    expect(Array.isArray(paymentIds)).toBe(true)
    expect(JSON.stringify(paymentIds)).not.toContain('166199')

    expect(log.formVersionPuts.length).toBeGreaterThan(0)
    expect(log.formVersionPublishes.length).toBeGreaterThan(0)
    await expect
      .poll(
        () =>
          log.formVersionPuts.some(item => {
            const overlay = overlayFromFormVersionPut(item.body)
            if (Object.keys(overlay).some(key => key.startsWith('application.economy.'))) {
              return true
            }
            return JSON.stringify(item.body ?? '').includes('program-application-economy-seed')
          }),
        { timeout: 60_000 }
      )
      .toBe(true)
    const overlayPuts = log.formVersionPuts.map(item => overlayFromFormVersionPut(item.body))
    const overlayApplicationPut = overlayPuts.find(item =>
      Object.keys(item).some(key => key.startsWith('application.economy.'))
    )
    const schemaApplicationPut = log.formVersionPuts.find(item =>
      JSON.stringify(item.body ?? {}).includes('program-application-economy-seed')
    )
    expect(
      overlayApplicationPut ?? schemaApplicationPut,
      'application-economy Form Version PUT'
    ).toBeTruthy()
    const applicationPutPayload = log.formVersionPuts
      .map(item => JSON.stringify(item.body ?? {}))
      .join('\n')
    expect(applicationPutPayload).not.toContain('application.institution.sexOffense')
    expect(applicationPutPayload).toContain('JA코리아')
    const firstSchedule = overlayApplicationPut?.['application.economy.schedule.first']
    if (firstSchedule && typeof firstSchedule === 'object') {
      const date = (firstSchedule as { date?: unknown }).date
      const firstStart = (firstSchedule as { firstStart?: unknown }).firstStart
      if (typeof date === 'string' && date.length > 0) {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
      if (typeof firstStart === 'string' && firstStart.length > 0) {
        expect(firstStart).toMatch(/^\d{2}:\d{2}/)
      }
      expect(JSON.stringify(firstSchedule)).not.toContain('$d')
    }

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await expect(page.getByText(VALUES_B.title).first()).toBeVisible({ timeout: 30_000 })
  })

  test('CS-B03 임시저장 후 탭 전환·재진입에서 B 값이 유지된다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    const registration = await fillRegistrationThroughComplete(page)
    void registration
    await page
      .getByRole('button', { name: '모집 정보 작성하기' })
      .click()
      .catch(async () => {
        await page
          .getByRole('tab', { name: /참여자 모집/ })
          .click()
          .catch(() => undefined)
      })
    await saveWizardDraft(page)
    // P2: 임시저장은 localStorage 전용 — 서버 program-draft 요청 0건, registration-wizard:COMPANY_SCHOOL:* 존재
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Object.keys(
              (
                JSON.parse(
                  localStorage.getItem('cms.jakorea.writingFormTemplateSaves.v1') ?? '{}'
                ) as { byTemplateId?: Record<string, unknown> }
              ).byTemplateId ?? {}
            ).some(key => key.startsWith('registration-wizard:COMPANY_SCHOOL:'))
          ),
        { timeout: 20_000 }
      )
      .toBe(true)
    expect(log.programDraftPuts).toHaveLength(0)
    await page.goto('/programs/company-school')
    const createButton = page.getByRole('button', { name: '신규 등록' }).first()
    await expect(createButton).toBeVisible({ timeout: 45_000 })
    await createButton.click()
    const draftDialog = page.getByRole('dialog').filter({ hasText: '임시 저장 이력 안내' })
    await expect(draftDialog).toBeVisible({ timeout: 20_000 })
    await draftDialog.getByRole('radio', { name: '이어서 작성' }).check()
    await draftDialog.getByRole('button', { name: '이어서 작성' }).click()
    await waitWizard(page)
    await expectWizardCommonTitle(page, VALUES_B.title)
    await expect(
      page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()
    ).toHaveValue(VALUES_B.announcement)
    expect(
      await page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first().inputValue()
    ).not.toBe(VALUES_A.title)
    assertIsolatedNetwork(log)
  })

  test('CS-B03 PUT 실패 시 CREATE는 유지되고 일부 양식 적용 실패 안내가 뜬다', async ({ page }) => {
    // 방안 C(P2): 양식은 CREATE 후 프로그램 전용 COPY로 적용 → PUT 실패는 CREATE 이후 부분 실패.
    const log = await installCsIsolatedNetwork(page, { failMode: 'put' })
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect.poll(() => log.createProgram, { timeout: 60_000 }).not.toBeNull()
    await expect.poll(() => log.formVersionPuts.length, { timeout: 60_000 }).toBeGreaterThan(0)
    await expect(page.getByText('일부 양식 적용 실패').first()).toBeVisible({ timeout: 20_000 })
    assertIsolatedNetwork(log)
  })

  test('CS-B03 CREATE 실패 시 입력값이 유지되고 재시도 가능하다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page, { failMode: 'create' })
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    const failTitle = page.getByText('등록 실패', { exact: true }).or(page.getByText('서버 오류', { exact: true }))
    await expect(failTitle.first()).toBeVisible({ timeout: 30_000 })
    const failConfirm = page.locator('.alert-modal').getByRole('button', { name: '확인' })
    if (await failConfirm.isVisible().catch(() => false)) {
      await failConfirm.click()
    }
    await expect(failTitle.first()).toBeHidden({ timeout: 10_000 })
    await expect.poll(() => log.createProgram, { timeout: 60_000 }).not.toBeNull()
    await expect(page.getByText('1사1교 프로그램 등록').first()).toBeVisible()
    await expectWizardCommonTitle(page, VALUES_B.title)
    expect(log.mutations.filter(item => item.path === '/api/admin/programs')).toHaveLength(1)
    await expectWizardCommonTitle(page, VALUES_B.title)
    const complete = page.getByRole('button', { name: '프로그램 등록 완료' })
    if (!(await complete.isVisible().catch(() => false))) {
      const toRecruit = page.getByRole('button', { name: '모집 정보 작성하기' })
      if (await toRecruit.isVisible().catch(() => false)) await toRecruit.click()
      const toApplication = page.getByRole('button', { name: '신청 정보 작성하기' })
      await expect(toApplication).toBeVisible({ timeout: 30_000 })
      await toApplication.click()
    }
    await expect(complete).toBeVisible({ timeout: 30_000 })
    await complete.click()
    await expect
      .poll(
        () => log.mutations.filter(item => item.path === '/api/admin/programs').length,
        { timeout: 60_000 },
      )
      .toBe(2)
    await expect(page.getByRole('heading', { name: '등록 완료' })).toBeVisible({ timeout: 20_000 })
  })

  test('CS-B06 blob URL이 CREATE overlay에 저장되지 않는다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    const overlay = createOverlay(log)
    expect(JSON.stringify(overlay)).not.toContain('blob:')
    expect(JSON.stringify(log.createProgram?.body ?? {})).not.toContain('blob:')
    if (log.filePosts.length > 0) {
      const ids = JSON.stringify(overlay)
      expect(ids.includes('77001') || ids.includes('fileObjectId') || ids.includes('thumb')).toBe(
        true
      )
    }
    assertIsolatedNetwork(log)
  })
})
