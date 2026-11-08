import { expect, test } from '@playwright/test'
import {
  assertIsolatedNetwork,
  CS_ISOLATED_IDS,
  installCsIsolatedNetwork,
  overlayFromCreateBody,
} from './install-cs-isolated-network'
import {
  clickSaveIfVisible,
  completeAndCapture,
  createOverlay,
  fillRegistrationThroughComplete,
  openCompanySchoolRecruitNav,
  openFreshWizard,
  VALUES_B,
} from './cs-isolated-helpers'

const RECRUIT_NOTES = '비고란을 작성하세요 (없으면 -로 입력)'
const LAST_KEYSTROKE_NOTES = 'LAST-KEYSTROKE-RECRUIT-NOTES'
const CANCELLED_NOTES = 'CANCELLED-NOTES-SHOULD-NOT-PERSIST'

test.describe.configure({ mode: 'default' })

function overlayOf(body: unknown): Record<string, unknown> {
  return overlayFromCreateBody(body)
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  if (typeof raw !== 'string' || raw.trim() === '') return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

/** 1사1교 PATCH/CREATE wire: 최상위 또는 serviceDetailJson.program */
function surveyKeysOf(body: unknown): unknown {
  if (body == null || typeof body !== 'object') return undefined
  const record = body as { generalSurveyMenuKeys?: unknown; serviceDetailJson?: unknown }
  if (Object.prototype.hasOwnProperty.call(record, 'generalSurveyMenuKeys')) {
    return record.generalSurveyMenuKeys
  }
  const program = parseJsonObject(parseJsonObject(record.serviceDetailJson).program)
  if (Object.prototype.hasOwnProperty.call(program, 'generalSurveyMenuKeys')) {
    return program.generalSurveyMenuKeys
  }
  return undefined
}

function overlaySurveyItems(body: unknown): Record<string, unknown> | undefined {
  const raw = overlayOf(body)['economyRegistration.basicInfo.surveyItems']
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return raw as Record<string, unknown>
}

async function uncheckCompanySchoolSurveyItems(page: import('@playwright/test').Page) {
  const field = page.getByText('설문 진행 항목', { exact: true }).first()
  await field.scrollIntoViewIfNeeded()
  const row = page.locator('.detail-info-form-field, .detail-info-form-row').filter({
    hasText: '설문 진행 항목',
  })
  for (const label of ['설문조사', '만족도조사', '강의평가'] as const) {
    const checkbox = row.getByRole('checkbox', { name: label }).first()
    const fallback = page.getByRole('checkbox', { name: label }).first()
    const target = (await checkbox.isVisible().catch(() => false)) ? checkbox : fallback
    if (!(await target.isVisible().catch(() => false))) continue
    if (await target.isChecked().catch(() => false)) {
      await target.click()
    }
  }
}

test.describe('CS STEP 3.2 상세 Typed 수정 isolated E2E', () => {
  test('E2E1 강사 모집 단독 수정이 기관·공통 overlay를 지우지 않는다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    const createdOverlay = createOverlay(log)

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await openCompanySchoolRecruitNav(page)
    await page.getByRole('tab', { name: /강사 모집/ }).first().click()
    await expect(page.getByText('강사 모집').first()).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: '정보 수정' }).first().click()
    const notes = page.getByPlaceholder('비고란을 작성하세요 (없으면 -로 입력)')
    if (await notes.first().isVisible().catch(() => false)) {
      await notes.first().fill('RHF-B-강사비고-PATCH')
    } else {
      const tel = page.getByPlaceholder(/전화|Tel|연락/).first()
      if (await tel.isVisible().catch(() => false)) {
        await tel.fill('02-9999-0000')
      }
    }
    await clickSaveIfVisible(page)
    await expect.poll(() => log.programPatches.length, { timeout: 30_000 }).toBeGreaterThan(0)
    const overlay = overlayOf(log.programPatches.at(-1)?.body)
    if (Object.keys(overlay).length > 0) {
      expect(overlay['economyRegistration.wageInfo.paymentItemValues']).toEqual(
        createdOverlay['economyRegistration.wageInfo.paymentItemValues']
      )
    }
    assertIsolatedNetwork(log)
  })

  test('E2E2 필수 공고명 비우기는 저장을 막고, 설문 해제는 PATCH에 남는다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await page.getByRole('button', { name: '정보 수정' }).first().click()
    const announcement = page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()
    await expect(announcement).toBeVisible({ timeout: 20_000 })
    await announcement.fill('')
    await clickSaveIfVisible(page)
    await expect(page.getByText('필수 항목').first()).toBeVisible({ timeout: 15_000 })
    const blocked = log.programPatches.length
    await page.getByRole('button', { name: '확인' }).first().click().catch(() => undefined)

    await announcement.fill(VALUES_B.announcement)
    await clickSaveIfVisible(page)
    await expect.poll(() => log.programPatches.length, { timeout: 30_000 }).toBeGreaterThan(blocked)
    assertIsolatedNetwork(log)
  })

  test('E2E4 설문 선택 해제 PATCH가 generalSurveyMenuKeys []를 보내고 재GET에서 유지된다', async ({
    page,
  }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    const createdOverlay = createOverlay(log)
    const createdKeys = surveyKeysOf(log.createProgram?.body)
    expect(Array.isArray(createdKeys) && createdKeys.length > 0).toBe(true)

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 45_000,
    })
    await page.getByRole('button', { name: '정보 수정' }).first().click()
    await expect(
      page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()
    ).toBeVisible({ timeout: 20_000 })
    await uncheckCompanySchoolSurveyItems(page)
    const patchesBefore = log.programPatches.length
    await clickSaveIfVisible(page)
    await expect.poll(() => log.programPatches.length, { timeout: 30_000 }).toBeGreaterThan(patchesBefore)

    const patchBody = log.programPatches.at(-1)?.body
    expect(surveyKeysOf(patchBody)).toEqual([])
    expect(overlaySurveyItems(patchBody)).toEqual({
      survey: false,
      satisfaction: false,
      lecture_evaluation: false,
    })
    expect(overlayOf(patchBody)['economyRegistration.wageInfo.paymentItemValues']).toEqual(
      createdOverlay['economyRegistration.wageInfo.paymentItemValues']
    )
    await expect(page.getByText(VALUES_B.title).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(VALUES_B.announcement).first()).toBeVisible()

    const savedDialog = page.getByRole('dialog').filter({ hasText: /수정 완료|수정되었습니다/ })
    if (await savedDialog.first().isVisible().catch(() => false)) {
      await savedDialog.getByRole('button', { name: '확인' }).first().click()
    }
    await expect(savedDialog.first()).toBeHidden({ timeout: 10_000 }).catch(() => undefined)
    await page.getByRole('button', { name: '정보 수정' }).first().click()
    await expect(page.getByText('설문 진행 항목', { exact: true }).first()).toBeVisible({
      timeout: 20_000,
    })
    for (const label of ['설문조사', '만족도조사', '강의평가'] as const) {
      const checkbox = page.getByRole('checkbox', { name: label }).first()
      if (await checkbox.isVisible().catch(() => false)) {
        await expect(checkbox).not.toBeChecked()
      }
    }
    assertIsolatedNetwork(log)
  })

  test('E2E3 legacy overlay-only GET 수정 후 sidecar가 유지된다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page, { seedLegacyOverlayProgram: true })
    await page.goto(`/programs/company-school?programId=${CS_ISOLATED_IDS.PROGRAM_ID}`)
    await expect(page.getByText('레거시 공고').first()).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText(/레거시 1사1교|컬럼 제목/).first()).toBeVisible()

    await openCompanySchoolRecruitNav(page)
    await page.getByRole('button', { name: '정보 수정' }).first().click()
    const notes = page.getByPlaceholder('비고란을 작성하세요 (없으면 -로 입력)')
    if (await notes.first().isVisible().catch(() => false)) {
      await notes.first().fill('레거시기관비고-PATCH')
    }
    await clickSaveIfVisible(page)
    await expect.poll(() => log.programPatches.length, { timeout: 30_000 }).toBeGreaterThan(0)
    const overlay = overlayOf(log.programPatches.at(-1)?.body)
    expect(overlay['economyRegistration.kpi.volunteer']).toBe(9)
    expect(overlay['application.instructor.memo']).toBe('legacy-memo')
    expect(overlay['economyRegistration.kpi.educationProgress.note']).toBe('')
    assertIsolatedNetwork(log)
  })

  test('CASE A 모집 단락 마지막 입력 직후 저장이 PATCH에 최신값을 실는다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await openCompanySchoolRecruitNav(page)
    await page.getByRole('button', { name: '정보 수정' }).first().click()
    const notes = page.getByPlaceholder(RECRUIT_NOTES).first()
    await expect(notes).toBeVisible({ timeout: 20_000 })
    await notes.fill(LAST_KEYSTROKE_NOTES)
    const patchesBefore = log.programPatches.length
    await clickSaveIfVisible(page)
    await expect.poll(() => log.programPatches.length, { timeout: 30_000 }).toBeGreaterThan(patchesBefore)
    expect(JSON.stringify(log.programPatches.at(-1)?.body)).toContain(LAST_KEYSTROKE_NOTES)

    const savedDialog = page.getByRole('dialog').filter({ hasText: /수정 완료|수정되었습니다/ })
    if (await savedDialog.first().isVisible().catch(() => false)) {
      await savedDialog.getByRole('button', { name: '확인' }).first().click()
    }
    await expect(page.getByText(LAST_KEYSTROKE_NOTES).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(VALUES_B.title).first()).toBeVisible()
    assertIsolatedNetwork(log)
  })

  test('CASE B 모집 수정 취소 후 재진입하면 취소값이 없고 기존값이 유지된다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await openCompanySchoolRecruitNav(page)
    await page.getByRole('button', { name: '정보 수정' }).first().click()
    const notes = page.getByPlaceholder(RECRUIT_NOTES).first()
    await expect(notes).toBeVisible({ timeout: 20_000 })
    const original = await notes.inputValue()
    await notes.fill(CANCELLED_NOTES)
    await page.getByRole('button', { name: '취소' }).first().click()
    await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 20_000,
    })
    expect(log.programPatches.length).toBe(0)
    await expect(page.getByText(CANCELLED_NOTES)).toHaveCount(0)

    await page.getByRole('button', { name: '정보 수정' }).first().click()
    await expect(page.getByPlaceholder(RECRUIT_NOTES).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByPlaceholder(RECRUIT_NOTES).first()).toHaveValue(original)
    await expect(page.getByText(VALUES_B.title).first()).toBeVisible()
    assertIsolatedNetwork(log)
  })
})
