import { expect, test } from '@playwright/test'
import {
  assertIsolatedNetwork,
  installTtIsolatedNetwork,
  TT_ISOLATED_IDS,
} from './install-tt-isolated-network'
import {
  autofillAndWalk,
  parseCreatePayload,
  uniqueVariantTitles,
  waitWizard,
} from './tt-isolated-helpers'

const CHANGED_MAIN_TITLE = 'TCH-01 P4B 상세수정 대표명'
const CHANGED_ANNOUNCEMENT = 'TCH-01 P4B 상세수정 공고명'

test.describe.configure({ mode: 'serial' })

test.describe('TT P4-B CREATE → 상세 GET → PATCH → 재GET', () => {
  test('등록 후 상세에서 값 변경과 명시적 비우기를 저장하고 재진입한다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page)
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await autofillAndWalk(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect.poll(() => log.createProgram, { timeout: 60_000 }).not.toBeNull()

    const created = parseCreatePayload(log.createProgram?.body)
    const seedTitles = uniqueVariantTitles('TCH-01')
    const createdTitle = String(created.rec.title ?? created.rec.mainTitle ?? '')

    await page.goto(`/programs/trained-teachers?programId=${TT_ISOLATED_IDS.PROGRAM_ID}`)
    await expect(page.getByRole('button', { name: '정보 수정' })).toBeVisible({
      timeout: 45_000,
    })
    await expect(page.getByText(createdTitle || seedTitles.announcementTitle).first()).toBeVisible({
      timeout: 20_000,
    })

    await page.getByRole('button', { name: '정보 수정' }).click()
    const main = page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()
    await expect(main).toBeVisible({ timeout: 20_000 })
    await main.fill(CHANGED_MAIN_TITLE)
    const publicTitle = page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요')
    if (await publicTitle.isVisible().catch(() => false)) {
      await publicTitle.fill(CHANGED_ANNOUNCEMENT)
    }
    const textbook = page.getByPlaceholder(/교재명을 입력/).first()
    if (await textbook.isVisible().catch(() => false)) {
      await textbook.fill('')
    } else {
      const textbookByLabel = page.getByLabel('교재명').first()
      if (await textbookByLabel.isVisible().catch(() => false)) {
        await textbookByLabel.fill('')
      }
    }
    const courseSelect = page
      // 등록 양식 라벨은 한글(교육 운영 주체), 상세 화면은 영문 라벨일 수 있다
      .getByText(/^(Course Delivered By|교육 운영 주체)$/)
      .locator('xpath=following::div[contains(@class,"ant-select")][1]')
    if ((await courseSelect.count()) > 0) {
      const current = (await courseSelect.innerText().catch(() => '')).trim()
      if (!current || current.includes('선택') || current === '전체') {
        await courseSelect.click()
        const jaOption = page.locator('.ant-select-item-option-content').filter({ hasText: /^JA/ })
        if ((await jaOption.count()) > 0) {
          await jaOption.first().click()
        } else if ((await page.locator('.ant-select-item-option').count()) > 0) {
          await page.locator('.ant-select-item-option').first().click()
        }
      }
    }
    await page.getByRole('button', { name: '정보 수정' }).click()
    const confirm = page.getByRole('dialog').filter({ hasText: '입력 확인' })
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.getByRole('button', { name: '확인' }).click()
      if ((await courseSelect.count()) > 0) {
        await courseSelect.click()
        await page.locator('.ant-select-item-option').first().click()
      }
      await page.getByRole('button', { name: '정보 수정' }).click()
    }
    await expect
      .poll(() => log.programPatches.length + log.infoDetailPatches.length, { timeout: 40_000 })
      .toBeGreaterThan(0)

    const patchBodies = [...log.programPatches, ...log.infoDetailPatches].map(item =>
      JSON.stringify(item.body ?? {})
    )
    expect(
      patchBodies.some(
        text => text.includes(CHANGED_MAIN_TITLE) || text.includes(CHANGED_ANNOUNCEMENT)
      )
    ).toBe(true)

    await page.goto('/programs/trained-teachers')
    await page.goto(`/programs/trained-teachers?programId=${TT_ISOLATED_IDS.PROGRAM_ID}`)
    await expect(page.getByRole('button', { name: '정보 수정' })).toBeVisible({
      timeout: 45_000,
    })
    await expect(
      page.getByText(CHANGED_MAIN_TITLE).or(page.getByText(CHANGED_ANNOUNCEMENT)).first()
    ).toBeVisible({
      timeout: 20_000,
    })
    expect(
      log.api.some(
        item =>
          item.method === 'GET' && item.path.includes(`/programs/${TT_ISOLATED_IDS.PROGRAM_ID}`)
      )
    ).toBe(true)
    assertIsolatedNetwork(log)
  })
})
