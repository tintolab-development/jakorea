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

test.describe.configure({ mode: 'default' })

function parseService(body: unknown): Record<string, unknown> {
  if (body == null || typeof body !== 'object') return {}
  const raw = (body as { serviceDetailJson?: unknown }).serviceDetailJson
  if (typeof raw !== 'string' || !raw.trim()) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

test.describe('CS-B04/B05 상세 GET→PATCH→재GET', () => {
  test('CS-B04 공통정보 일부 수정 PATCH가 overlay를 통째 교체해도 ID·강사비·KPI가 유지된다', async ({
    page,
  }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    const createdOverlay = createOverlay(log)
    expect(createdOverlay['economyRegistration.wageInfo.paymentItemValues']).toBeTruthy()

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 45_000,
    })
    await expect(page.getByText(VALUES_B.title).first()).toBeVisible()
    await expect(page.getByText(VALUES_B.announcement).first()).toBeVisible()

    await page.getByRole('button', { name: '정보 수정' }).first().click()
    await expect(
      page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()
    ).toBeVisible({
      timeout: 20_000,
    })
    await page
      .getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요')
      .first()
      .fill('RHF-B-공고명-PATCH')
    await clickSaveIfVisible(page)
    await expect.poll(() => log.programPatches.length, { timeout: 30_000 }).toBeGreaterThan(0)

    const patch = log.programPatches[0]?.body as Record<string, unknown>
    expect(patch.applicationStartDate).toBeUndefined()
    const patchJson = JSON.stringify(patch)
    expect(patchJson).not.toContain('application.economy.')
    const service = parseService(patch)
    const registration = (service.registration ?? {}) as { overlay?: Record<string, unknown> }
    const overlay = registration.overlay ?? {}
    expect(overlay['economyRegistration.basicInfo.publicProgramTitle']).toBe('RHF-B-공고명-PATCH')
    expect(overlay['economyRegistration.wageInfo.paymentItemValues']).toEqual(
      createdOverlay['economyRegistration.wageInfo.paymentItemValues']
    )
    expect(overlay['economyRegistration.wageInfo.grade1Fee']).toBe(
      createdOverlay['economyRegistration.wageInfo.grade1Fee']
    )
    expect(
      overlay['economyRecruit.detailInfo.thumbFileObjectId'] ??
        overlay['recruit.detailInfo.thumbFileObjectId']
    ).toEqual(
      createdOverlay['economyRecruit.detailInfo.thumbFileObjectId'] ??
        createdOverlay['recruit.detailInfo.thumbFileObjectId']
    )

    await expect(page.getByText('RHF-B-공고명-PATCH').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(VALUES_B.title).first()).toBeVisible()
    assertIsolatedNetwork(log)
  })

  test('CS-B05 모집 PATCH는 공통 지급항목 ID를 지우지 않고 행 없는 CREATE는 행을 만들지 않는다', async ({
    page,
  }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    const created = log.createProgram?.body as { recruitments?: unknown }
    expect(
      created.recruitments == null ||
        created.recruitments === undefined ||
        (Array.isArray(created.recruitments) && created.recruitments.length === 0)
    ).toBe(true)

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await openCompanySchoolRecruitNav(page)
    await expect(page.getByText('모집 기간').first()).toBeVisible({ timeout: 20_000 })
    const edit = page.getByRole('button', { name: '정보 수정' }).first()
    await expect(edit).toBeVisible({ timeout: 30_000 })
    await edit.click()
    const notes = page.getByPlaceholder('비고란을 작성하세요 (없으면 -로 입력)')
    if (
      await notes
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await notes.first().fill('RHF-B-모집비고-PATCH')
    }
    await clickSaveIfVisible(page)
    await expect.poll(() => log.programPatches.length, { timeout: 30_000 }).toBeGreaterThan(0)
    const lastPatch = log.programPatches.at(-1)?.body
    const overlay = overlayFromCreateBody(lastPatch)
    const createdOverlay = createOverlay(log)
    if (Object.keys(overlay).length > 0) {
      expect(overlay['economyRegistration.wageInfo.paymentItemValues']).toEqual(
        createdOverlay['economyRegistration.wageInfo.paymentItemValues']
      )
      expect(JSON.stringify(overlay)).not.toContain('application.economy.')
    }
    assertIsolatedNetwork(log)
  })

  test('CS-B05 recruitments[] 행이 있으면 행 기간이 표시 정본이다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page, { includeRecruitmentRow: true })
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await completeAndCapture(page, log)
    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 45_000,
    })
    await openCompanySchoolRecruitNav(page)
    await expect(page.getByText('모집 기간').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(VALUES_B.title).first()).toBeVisible({ timeout: 30_000 })
    const body = page.locator('body')
    const text = await body.innerText()
    expect(
      text.includes('2026.02') ||
        text.includes('2026-02') ||
        text.includes('02.01') ||
        text.includes('2026. 02')
    ).toBe(true)
    void CS_ISOLATED_IDS
    assertIsolatedNetwork(log)
  })
})
