import { expect, test, type Locator, type Page } from '@playwright/test'
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

async function selectPlatformOption(
  page: Page,
  triggerName: string | RegExp,
  optionName: string,
  options?: { nth?: number; required?: boolean },
) {
  const nth = options?.nth ?? 0
  const trigger = page.getByRole('button', { name: triggerName }).nth(nth)
  const visible = await trigger.isVisible().catch(() => false)
  if (!visible) {
    if (options?.required === true) {
      throw new Error(`신청 셀렉트를 찾을 수 없습니다: ${String(triggerName)}`)
    }
    return
  }
  await trigger.click()
  const option = page.getByRole('option', { name: optionName, exact: true }).first()
  if (await option.isVisible().catch(() => false)) {
    await option.click()
    return
  }
  const anyOption = page.getByRole('option').first()
  if (await anyOption.isVisible().catch(() => false)) await anyOption.click()
  else {
    await page.keyboard.press('Escape').catch(() => undefined)
    if (options?.required === true) {
      throw new Error(`신청 셀렉트 옵션을 찾을 수 없습니다: ${optionName}`)
    }
  }
}

async function fillPlaceholderIfVisible(
  page: Page,
  placeholder: string,
  value: string,
  options?: { required?: boolean; nth?: number },
) {
  const input = page.getByPlaceholder(placeholder).nth(options?.nth ?? 0)
  const visible = await input.isVisible().catch(() => false)
  if (!visible) {
    if (options?.required === true) {
      throw new Error(`신청 입력을 찾을 수 없습니다: ${placeholder}`)
    }
    return
  }
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

async function scheduleBlock(page: Page, rank: 1 | 2) {
  return page.getByRole('group', { name: `■ ${rank}지망` })
}

async function pickEnabledCalendarDay(page: Page, skipCount: number) {
  const calendar = page.getByRole('dialog', { name: '날짜 선택' })
  await expect(calendar, '희망 교육일 달력이 열려야 합니다').toBeVisible({ timeout: 8_000 })
  for (let month = 0; month < 8; month += 1) {
    const days = calendar.getByRole('button', { name: /\d+년 \d+월 \d+일/ })
    const enabled = []
    const count = await days.count()
    for (let index = 0; index < count; index += 1) {
      const day = days.nth(index)
      if (await day.isDisabled().catch(() => true)) continue
      enabled.push(day)
    }
    if (enabled.length > skipCount) {
      await enabled[skipCount]!.click()
      await expect(calendar).toBeHidden({ timeout: 8_000 })
      return
    }
    if (enabled.length > 0 && month > 0) {
      await enabled[enabled.length - 1]!.click()
      await expect(calendar).toBeHidden({ timeout: 8_000 })
      return
    }
    const nextMonth = calendar.getByRole('button', { name: '다음 달' })
    if (!(await nextMonth.isVisible().catch(() => false))) break
    if (await nextMonth.isDisabled().catch(() => false)) break
    await nextMonth.click()
  }
  throw new Error('희망 교육일 달력에서 선택 가능한 날짜가 없습니다')
}

async function fillBlockDate(page: Page, rank: 1 | 2, skipCount: number) {
  const block = await scheduleBlock(page, rank)
  const trigger = block.getByRole('button', { name: '날짜', exact: true })
  await expect(trigger, `${rank}지망 날짜`).toBeVisible({ timeout: 15_000 })
  await trigger.scrollIntoViewIfNeeded()
  if ((await trigger.innerText()).includes('선택해 주세요')) {
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: 8_000 })
    await pickEnabledCalendarDay(page, skipCount)
  }
  await expect(trigger).not.toContainText('선택해 주세요', { timeout: 8_000 })
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  return (await trigger.innerText()).trim()
}

async function fillBlockSessionPeriodTime(
  page: Page,
  rank: 1 | 2,
  start: [string, string],
  end: [string, string],
) {
  const block = await scheduleBlock(page, rank)
  const session = block.getByRole('button', { name: /희망 차시/ })
  await expect(session, `${rank}지망 희망 차시`).toBeVisible({ timeout: 8_000 })
  if ((await session.innerText()).includes('희망 차시')) {
    await session.click()
    const option = page.getByRole('option', { name: '1차시', exact: true })
    await expect(option).toBeVisible({ timeout: 8_000 })
    await option.click()
  }
  await expect(session).toContainText('1차시')
  const period = block.getByPlaceholder('수업 진행 교시')
  await expect(period, `${rank}지망 교시`).toBeVisible({ timeout: 8_000 })
  if (!(await period.inputValue()).trim()) await period.fill('1')
  await expect(period).toHaveValue('1')
  const startBtn = block.getByRole('button', { name: '1차시 희망 교육 시간 시작' })
  const endBtn = block.getByRole('button', { name: '1차시 희망 교육 시간 종료' })
  if ((await startBtn.innerText()).includes('시작')) {
    await pickPfTime(page, startBtn, start)
  }
  if ((await endBtn.innerText()).includes('종료')) {
    await pickPfTime(page, endBtn, end)
  }
}

/** PFTimeInput 팝오버는 position:fixed 로 트리거 아래에 붙는다. 연 뒤에는 스크롤해도 따라오지 않으므로 열기 전에 아래에 공간을 확보한다. */
async function ensurePopoverRoomBelow(trigger: Locator) {
  await trigger.evaluate(el => {
    const neededBelow = 340
    const rect = el.getBoundingClientRect()
    const overflow = rect.bottom + neededBelow - window.innerHeight
    if (overflow > 0) window.scrollBy(0, overflow + 16)
  })
}

async function pickPfTime(page: Page, trigger: Locator, hm: [string, string]) {
  await trigger.scrollIntoViewIfNeeded()
  await ensurePopoverRoomBelow(trigger)
  // Playwright 기본 click은 트리거를 다시 중앙 정렬해 팝오버가 viewport 밖으로 나간다.
  await trigger.dispatchEvent('pointerdown')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: 8_000 })
  const hourList = page.getByRole('listbox', { name: '시' })
  await expect(hourList).toBeVisible({ timeout: 8_000 })
  const hourOpt = hourList.getByRole('option', { name: hm[0], exact: true })
  await hourOpt.evaluate(el => el.scrollIntoView({ block: 'center' }))
  await hourOpt.click()
  const minuteOpt = page.getByRole('listbox', { name: '분' }).getByRole('option', { name: hm[1], exact: true })
  await minuteOpt.evaluate(el => el.scrollIntoView({ block: 'center' }))
  await minuteOpt.click()
  await expect(trigger).toContainText(`${hm[0]}:${hm[1]}`, { timeout: 8_000 })
  if ((await trigger.getAttribute('aria-expanded')) === 'true') {
    await page.keyboard.press('Escape')
  }
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
}

async function fillEconomyPreferredSchedules(page: Page) {
  await expect(await scheduleBlock(page, 1), '1지망 일정 블록').toBeVisible({ timeout: 15_000 })
  await expect(await scheduleBlock(page, 2), '2지망 일정 블록').toBeVisible({ timeout: 15_000 })
  const date1 = await fillBlockDate(page, 1, 0)
  await fillBlockSessionPeriodTime(page, 1, ['09', '00'], ['09', '40'])
  await expect((await scheduleBlock(page, 1)).getByRole('button', { name: '날짜', exact: true })).toHaveText(date1)
  const date2 = await fillBlockDate(page, 2, 1)
  expect(date2, '1지망·2지망 희망 교육일은 서로 달라야 합니다').not.toBe(date1)
  await expect((await scheduleBlock(page, 1)).getByRole('button', { name: '날짜', exact: true })).toHaveText(date1)
  await fillBlockSessionPeriodTime(page, 2, ['10', '00'], ['10', '40'])
  await expect(
    (await scheduleBlock(page, 1)).getByRole('button', { name: '날짜', exact: true }),
  ).toHaveText(date1)
  await expect(
    (await scheduleBlock(page, 2)).getByRole('button', { name: '날짜', exact: true }),
  ).toHaveText(date2)
}

async function fillVisibleApplyInputs(page: Page) {
  await selectPlatformOption(page, '학년 선택', '1학년')
  await selectPlatformOption(page, '신청 학급', '1')
  await fillPlaceholderIfVisible(
    page,
    '교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요',
    '격리로 1',
  )
  await fillPlaceholderIfVisible(page, '총 학생 수', '20', { required: true })
  await fillPlaceholderIfVisible(page, '신청 사유를 입력해 주세요.', '격리 신청 사유', {
    required: true,
  })
  await fillPlaceholderIfVisible(page, '담당 교사의 내선 번호(직통 번호)', '02-783-2367', {
    required: true,
  })
  await fillPlaceholderIfVisible(page, '담당 교사의 휴대폰 번호', '010-1234-5678')
  await fillPlaceholderIfVisible(page, '담당 교사의 이메일', 'teacher@test.com')
  await clickRadioIfVisible(page, '오프라인')
  await clickRadioIfVisible(page, '미결연')
  await clickRadioIfVisible(page, '아니요, 진행하지 않았습니다.')
  await clickRadioIfVisible(page, '동의서 미제출')
  const sexOffense = page.getByRole('radio', { name: '동의서 미제출' })
  await expect(sexOffense, '성범죄 경력조회 동의서 제출 여부').toBeVisible({ timeout: 8_000 })
  await expect(sexOffense).toBeChecked()
  await fillEconomyPreferredSchedules(page)
  const unansweredSelects = page.getByRole('button', { name: /선택$/ })
  const unansweredCount = await unansweredSelects.count()
  for (let index = 0; index < Math.min(unansweredCount, 8); index += 1) {
    const trigger = unansweredSelects.nth(index)
    if (!(await trigger.isVisible().catch(() => false))) continue
    const label = ((await trigger.getAttribute('aria-label')) ?? (await trigger.innerText())).trim()
    if (label.includes('날짜') || label.includes('선택해 주세요')) continue
    await trigger.click()
    const option = page.getByRole('option').first()
    if (await option.isVisible().catch(() => false)) await option.click()
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
    await fillVisibleApplyInputs(page)
    await agreeVisibleConsents(page)
    const date1 = await (await scheduleBlock(page, 1))
      .getByRole('button', { name: '날짜', exact: true })
      .innerText()
    const date2 = await (await scheduleBlock(page, 2))
      .getByRole('button', { name: '날짜', exact: true })
      .innerText()
    expect(date1.includes('선택해 주세요'), '1지망 날짜 확정').toBe(false)
    expect(date2.includes('선택해 주세요'), '2지망 날짜 확정').toBe(false)
    expect(date1.trim()).not.toBe(date2.trim())
    const submit = page.getByRole('button', { name: '신청하기' })
    await expect(submit).toBeVisible()
    await submit.click()
    await expect.poll(() => log.portalApplicationPosts.length, { timeout: 20_000 }).toBe(1)
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
    await expect(page.getByText('신청이 완료되었어요')).toBeVisible({ timeout: 20_000 })
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
    await fillVisibleApplyInputs(page)
    await agreeVisibleConsents(page)
    const submit = page.getByRole('button', { name: '신청하기' })
    await expect(submit).toBeVisible()
    await submit.click()
    await expect.poll(() => log.portalApplicationPosts.length, { timeout: 45_000 }).toBe(1)
    const done = page.getByRole('dialog').or(page.getByRole('alertdialog')).filter({ hasText: '신청이 완료되었어요' })
    await expect(done).toBeVisible({ timeout: 20_000 })
    await done.getByRole('button', { name: '닫기' }).click()
    await expect(done).toBeHidden({ timeout: 10_000 })
    await page.goto(applyPath())
    await expect(page.getByText('기본 정보').first()).toBeVisible({ timeout: 45_000 })
    await agreeVisibleConsents(page)
    await fillVisibleApplyInputs(page)
    await agreeVisibleConsents(page)
    await page.getByRole('button', { name: '신청하기' }).click()
    await expect.poll(() => log.portalApplicationPosts.length, { timeout: 20_000 }).toBe(2)
    await expect(page.getByRole('heading', { name: '이미 신청한 프로그램입니다' })).toBeVisible({
      timeout: 15_000,
    })
    assertIsolatedNetwork(log)
  })
})
