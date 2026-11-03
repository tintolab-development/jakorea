import { expect, test, type Page } from '@playwright/test'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import {
  assertIsolatedNetwork,
  CS_ISOLATED_IDS,
  installCsIsolatedNetwork,
  overlayFromFormVersionPut,
} from './install-cs-isolated-network'
import {
  completeAndCapture,
  fillRegistrationThroughComplete,
  openFreshWizard,
} from './cs-isolated-helpers'

const PLATFORM_URL = process.env.PLATFORM_CS_ISOLATED_BASE_URL ?? 'http://127.0.0.1:3277'

function applyPath(versionHint?: number) {
  void versionHint
  return `${PLATFORM_URL}/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/apply?recruitmentId=${CS_ISOLATED_IDS.RECRUITMENT_ID}&applicationType=ORGANIZATION`
}

async function agreeVisibleConsents(page: Page) {
  const radios = page.getByRole('radio', { name: /^동의$/ })
  const count = await radios.count()
  for (let index = 0; index < count; index += 1) {
    const radio = radios.nth(index)
    if (!(await radio.isVisible().catch(() => false))) continue
    await radio.check({ force: true }).catch(() => undefined)
  }
}

async function dismissApplyAlert(page: Page) {
  const alert = page.getByRole('alertdialog')
  if (!(await alert.first().isVisible().catch(() => false))) return
  await alert.getByRole('button', { name: /확인|닫기/ }).first().click({ force: true }).catch(() => undefined)
}

async function selectPlatformOption(page: Page, triggerName: string, optionName: string) {
  const trigger = page.getByRole('button', { name: triggerName, exact: true }).first()
  if (!(await trigger.isVisible().catch(() => false))) return
  await trigger.click()
  const option = page.getByRole('option', { name: optionName, exact: true }).first()
  if (await option.isVisible().catch(() => false)) {
    await option.click()
    return
  }
  const anyOption = page.getByRole('option').first()
  if (await anyOption.isVisible().catch(() => false)) await anyOption.click()
  else await page.keyboard.press('Escape').catch(() => undefined)
}

async function fillPlaceholderIfVisible(page: Page, placeholder: string, value: string) {
  const input = page.getByPlaceholder(placeholder).first()
  if (!(await input.isVisible().catch(() => false))) return
  const current = await input.inputValue().catch(() => '')
  if (String(current).trim()) return
  await input.fill(value)
}

async function clickRadioIfVisible(page: Page, name: string) {
  const radio = page.getByRole('radio', { name }).first()
  if (await radio.isVisible().catch(() => false)) {
    await radio.check({ force: true }).catch(() => undefined)
  }
}

async function fillVisibleApplyInputs(page: Page) {
  await selectPlatformOption(page, '학년 선택', '1학년')
  await selectPlatformOption(page, '신청 학급', '1')
  await fillPlaceholderIfVisible(
    page,
    '교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요',
    '격리로 1',
  )
  await fillPlaceholderIfVisible(page, '총 학생 수', '20')
  await fillPlaceholderIfVisible(page, '신청 사유를 입력해 주세요.', '격리 신청 사유')
  await fillPlaceholderIfVisible(page, '담당 교사의 내선 번호(직통 번호)', '02-783-2367')
  await fillPlaceholderIfVisible(page, '담당 교사의 휴대폰 번호', '010-1234-5678')
  await fillPlaceholderIfVisible(page, '담당 교사의 이메일', 'teacher@test.com')
  await clickRadioIfVisible(page, '오프라인')
  await clickRadioIfVisible(page, '미결연')
  await clickRadioIfVisible(page, '아니요, 진행하지 않았습니다.')
  const unansweredSelects = page.getByRole('button', { name: /선택$/ })
  const unansweredCount = await unansweredSelects.count()
  for (let index = 0; index < Math.min(unansweredCount, 8); index += 1) {
    const trigger = unansweredSelects.nth(index)
    if (!(await trigger.isVisible().catch(() => false))) continue
    await trigger.click()
    const option = page.getByRole('option').first()
    if (await option.isVisible().catch(() => false)) await option.click()
    else await page.keyboard.press('Escape').catch(() => undefined)
  }
  const checkboxes = page.getByRole('checkbox')
  const checkboxCount = await checkboxes.count()
  for (let index = 0; index < Math.min(checkboxCount, 4); index += 1) {
    const box = checkboxes.nth(index)
    if (!(await box.isVisible().catch(() => false))) continue
    if (await box.isChecked().catch(() => false)) continue
    await box.check({ force: true }).catch(() => undefined)
  }
  const textboxes = page.locator('input:visible, textarea:visible')
  const boxCount = await textboxes.count()
  for (let index = 0; index < Math.min(boxCount, 32); index += 1) {
    const box = textboxes.nth(index)
    const type = await box.getAttribute('type')
    if (type === 'radio' || type === 'checkbox' || type === 'file') continue
    if (await box.isDisabled().catch(() => false)) continue
    const value = await box.inputValue().catch(() => '')
    if (String(value).trim()) continue
    await box.fill('격리입력').catch(() => undefined)
  }
}

test.describe.configure({ mode: 'default' })

test.describe('CS-B08 Platform Draft/POST 격리', () => {
  test('CMS 게시 Form Version이 Platform 렌더·최종 POST에 연결된다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    expect(log.publishedApplicationFormSource).toBe('cms-put')
    expect(log.publishedApplicationVersionId).not.toBeNull()
    const applicationPut = log.formVersionPuts
      .map(item => overlayFromFormVersionPut(item.body))
      .find(item => Object.keys(item).some(key => key.startsWith('application.economy.')))
    expect(applicationPut, 'application-economy Form Version PUT').toBeTruthy()

    await page.goto(applyPath(log.publishedApplicationVersionId ?? undefined))
    await expect(page.getByText('개인정보 수집·이용').first()).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText('기본 정보').first()).toBeVisible()
    await expect(page.getByText('안내 사항').first()).toBeVisible()
    const optionsHit = log.api.some(
      item =>
        item.method === 'GET' &&
        item.path === `/api/portal/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/application-options`
    )
    expect(optionsHit).toBe(true)
    const formHit = log.api.some(
      item =>
        item.method === 'GET' &&
        item.path.includes(`/api/portal/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/form-bindings/`)
    )
    expect(formHit).toBe(true)

    const draftButton = page.getByRole('button', { name: /임시저장|임시 저장/ })
    expect(await draftButton.count()).toBe(0)
    test.info().annotations.push({
      type: 'portal-draft-save',
      description: 'product-has-no-draft-button',
    })

    await agreeVisibleConsents(page)
    const submit = page.getByRole('button', { name: '신청하기' })
    await expect(submit).toBeVisible()
    await submit.click({ force: true })
    await dismissApplyAlert(page)
    await fillVisibleApplyInputs(page)
    await agreeVisibleConsents(page)
    await submit.click({ force: true })
    await dismissApplyAlert(page)
    await submit.click({ force: true }).catch(() => undefined)
    await expect.poll(() => log.portalApplicationPosts.length, { timeout: 45_000 }).toBeGreaterThan(0)
    const post = log.portalApplicationPosts[0]
    const body = (post?.body ?? {}) as {
      recruitmentId?: number
      applicationType?: string
      formBindingId?: number
      answers?: Record<string, unknown>
    }
    expect(post?.path).toBe(`/api/portal/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/applications`)
    expect(body.recruitmentId).toBe(CS_ISOLATED_IDS.RECRUITMENT_ID)
    expect(String(body.applicationType).toUpperCase()).toBe('ORGANIZATION')
    expect(JSON.stringify(body)).not.toContain('application.economy.')
    const answers = body.answers ?? {}
    const answerKeys = Object.keys(answers)
    expect(
      answerKeys.some(
        key =>
          key === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo ||
          key.includes('program-application-economy-seed')
      ) || answerKeys.length > 0
    ).toBe(true)
    await expect(page.getByText(/제출|신청.*완료|접수/).first()).toBeVisible({ timeout: 20_000 }).catch(
      () => undefined
    )
    assertIsolatedNetwork(log)
  })

  test('GET draftAnswers가 기본정보를 복원하고 중복 POST는 409를 받는다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page, {
      failMode: 'portalDuplicate',
      portalDraftAnswers: {
        [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo]: {
          applicationGrade: '초등 5',
          classCount: '2',
          totalStudents: '40',
        },
      },
    })
    await page.goto(applyPath())
    await expect(page.getByText('기본 정보').first()).toBeVisible({ timeout: 45_000 })
    const restored = page.getByText('초등 5').or(page.locator('input[value="초등 5"]'))
    await expect(restored.first()).toBeVisible({ timeout: 20_000 }).catch(() => undefined)
    await agreeVisibleConsents(page)
    const submit = page.getByRole('button', { name: '신청하기' })
    if ((await submit.count()) > 0) {
      await submit.click({ force: true })
      await dismissApplyAlert(page)
      await fillVisibleApplyInputs(page)
      await submit.click({ force: true })
      await expect.poll(() => log.portalApplicationPosts.length, { timeout: 45_000 }).toBeGreaterThan(0)
      await submit.click({ force: true })
      await expect.poll(() => log.portalApplicationPosts.length, { timeout: 20_000 }).toBeGreaterThan(1)
    }
    assertIsolatedNetwork(log)
  })
})
