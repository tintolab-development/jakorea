import { expect, test, type Page } from '@playwright/test'
import {
  assertIsolatedNetwork,
  installTtIsolatedNetwork,
  TT_ISOLATED_IDS,
} from './install-tt-isolated-network'
const PLATFORM_URL = process.env.PLATFORM_TT_ISOLATED_BASE_URL ?? 'http://127.0.0.1:3288'
const APPLY_PATH = `${PLATFORM_URL}/programs/${TT_ISOLATED_IDS.PROGRAM_ID}/apply?recruitmentId=${TT_ISOLATED_IDS.RECRUITMENT_ID}&applicationType=ORGANIZATION`

async function openApplyForm(page: Page) {
  await page.goto(APPLY_PATH)
  await expect(page.getByText('개인정보 수집·이용').first()).toBeVisible({ timeout: 45_000 })
  await expect(page.getByText('개인정보 제3자').first()).toBeVisible()
  await expect(page.getByText('기본 정보').first()).toBeVisible()
  await expect(page.getByText('진행 희망 교육 일정').first()).toBeVisible()
}

async function agreeRequiredConsents(page: Page) {
  const agreeRadios = page.getByRole('radio', { name: /^동의$/ })
  const count = await agreeRadios.count()
  for (let index = 0; index < count; index += 1) {
    await agreeRadios.nth(index).check()
  }
}

async function fillRequiredBasicInfo(page: Page) {
  const gradeTrigger = page.getByRole('button', { name: '학년 선택' })
  if (await gradeTrigger.isVisible().catch(() => false)) {
    await gradeTrigger.click()
    await page.getByRole('option', { name: '1학년' }).click()
  }
  const address = page.getByPlaceholder('교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요')
  if (await address.isVisible().catch(() => false)) {
    await address.fill('격리로 1')
  }
  const classTrigger = page.getByRole('button', { name: '신청 학급' })
  if (await classTrigger.isVisible().catch(() => false)) {
    await classTrigger.click()
    await page.getByRole('option', { name: '1', exact: true }).click()
  }
  const student = page.getByPlaceholder('총 학생 수')
  if (await student.isVisible().catch(() => false)) {
    await student.fill('20')
  }
  const offline = page.getByRole('radio', { name: '오프라인' })
  if ((await offline.count()) > 0) {
    await offline.first().click({ force: true })
  }
  const reason = page.getByPlaceholder('신청 사유를 입력해 주세요.')
  await expect(reason).toBeVisible()
  await reason.fill('격리 P4B 신청 사유')
}

async function selectPreferredSchedule(page: Page) {
  const firstDate = page.getByRole('checkbox', { name: /2026년 4월 1일/ })
  if ((await firstDate.count()) > 0) {
    await firstDate.first().click({ force: true })
    return
  }
  const anyDate = page.getByRole('checkbox', { name: /2026년 4월/ }).first()
  if ((await anyDate.count()) > 0) {
    await anyDate.click({ force: true })
  }
}

async function fillCompleteApplyForm(page: Page) {
  await agreeRequiredConsents(page)
  await fillRequiredBasicInfo(page)
  await selectPreferredSchedule(page)
}

test.describe('TT 격리 Portal 신청', () => {
  test('Mock Form Binding으로 4단락을 렌더하고 Application POST body를 캡처한다', async ({
    page,
  }) => {
    const log = await installTtIsolatedNetwork(page)
    await openApplyForm(page)

    const draftButton = page.getByRole('button', { name: /임시저장|임시 저장/ })
    expect(await draftButton.count()).toBe(0)

    await fillCompleteApplyForm(page)
    const submit = page.getByRole('button', { name: '신청하기' })
    await expect(submit).toBeVisible()
    await submit.click()

    await expect.poll(() => log.portalApplicationPosts.length, { timeout: 30_000 }).toBe(1)
    const posted = log.portalApplicationPosts[0]?.body as {
      recruitmentId?: number
      applicationType?: string
      formBindingId?: number
      answers?: Record<string, unknown>
      preferredScheduleBlocks?: unknown
    }
    expect(posted.recruitmentId).toBe(TT_ISOLATED_IDS.RECRUITMENT_ID)
    expect(posted.applicationType).toBe('ORGANIZATION')
    expect(posted.formBindingId).toBe(TT_ISOLATED_IDS.BINDING_ID)
    expect(posted.answers).toBeTruthy()
    const answerKeys = Object.keys(posted.answers ?? {})
    expect(answerKeys.some(key => key.includes('personal-info') || key.includes('basic-info'))).toBe(
      true
    )
    expect(answerKeys.join(',')).not.toContain('hidden')
    expect(JSON.stringify(posted.answers)).toContain('격리 P4B 신청 사유')
    expect(JSON.stringify(posted)).toMatch(/tt-sched-1|2026-04-01/)
    expect(JSON.stringify(posted)).not.toContain('$d')
    expect(JSON.stringify(posted)).not.toContain('blob:')
    await expect(page.getByText(/신청이 완료|신청 완료|신청되었습니다/).first()).toBeVisible({
      timeout: 20_000,
    }).catch(async () => {
      await expect(page.getByRole('button', { name: /신청 내역|확인/ }).first()).toBeVisible({
        timeout: 10_000,
      })
    })
    assertIsolatedNetwork(log)
  })

  test('필수 누락 시 Application POST가 나가지 않는다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page)
    await openApplyForm(page)
    await page.getByRole('button', { name: '신청하기' }).click()
    await expect(page.getByText(/필수|확인해 주세요|입력해 주세요/).first()).toBeVisible({
      timeout: 15_000,
    })
    expect(log.portalApplicationPosts).toHaveLength(0)
    assertIsolatedNetwork(log)
  })

  test('Application POST 실패 시 입력값이 유지된다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, { failMode: 'portalPost' })
    await openApplyForm(page)
    await fillCompleteApplyForm(page)
    await page.getByRole('button', { name: '신청하기' }).click()
    await expect.poll(() => log.portalApplicationPosts.length, { timeout: 30_000 }).toBe(1)
    await expect(page.getByPlaceholder('신청 사유를 입력해 주세요.')).toHaveValue(
      '격리 P4B 신청 사유'
    )
    await expect(page.getByRole('button', { name: '신청하기' })).toBeEnabled()
    assertIsolatedNetwork(log)
  })
})
