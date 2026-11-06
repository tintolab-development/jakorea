import { expect, test } from '@playwright/test'
import { assertIsolatedNetwork, installTtIsolatedNetwork } from './install-tt-isolated-network'
import { clickDevAutofill, parseCreatePayload, waitWizard } from './tt-isolated-helpers'

const CASE_01 = {
  mainTitle: '임시저장-대표명-A',
  announcementTitle: '임시저장-공고명-B',
  titleEn: 'Draft-Title-C',
} as const

const CASE_05 = {
  mainTitle: '임시저장-대표명-B',
  announcementTitle: '임시저장-공고명-B2',
  titleEn: 'Draft-Title-B',
} as const

const DRAFT_KEY_PREFIX = 'registration-wizard:TRAINED_TEACHER:'

async function fillCaseTitles(
  page: import('@playwright/test').Page,
  titles: { mainTitle: string; announcementTitle: string; titleEn: string }
) {
  const main = page.getByPlaceholder('대표 프로그램명을 입력해 주세요')
  await expect(main.first()).toBeVisible({ timeout: 15_000 })
  await main.first().fill(titles.mainTitle)
  if ((await main.count()) > 1) {
    await main.nth(1).fill(titles.titleEn)
  }
  const publicTitle = page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요')
  await expect(publicTitle).toBeVisible({ timeout: 10_000 })
  await publicTitle.fill(titles.announcementTitle)
}

async function ensureCommonInfoStep(page: import('@playwright/test').Page) {
  const main = page.getByPlaceholder('대표 프로그램명을 입력해 주세요')
  if (
    await main
      .first()
      .isVisible()
      .catch(() => false)
  )
    return
  const common = page.getByRole('button', { name: '공통 정보' }).first()
  if (await common.isVisible().catch(() => false)) await common.click()
}

async function expectCaseTitles(
  page: import('@playwright/test').Page,
  titles: { mainTitle: string; announcementTitle: string; titleEn: string }
) {
  await ensureCommonInfoStep(page)
  const main = page.getByPlaceholder('대표 프로그램명을 입력해 주세요')
  await expect(main.first()).toHaveValue(titles.mainTitle)
  if ((await main.count()) > 1) {
    await expect(main.nth(1)).toHaveValue(titles.titleEn)
  }
  await expect(page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요')).toHaveValue(
    titles.announcementTitle
  )
}

async function dismissDraftDialogs(page: import('@playwright/test').Page) {
  const overwrite = page.getByRole('dialog').filter({ hasText: '임시 저장본 덮어쓰기' })
  if (await overwrite.isVisible().catch(() => false)) {
    await overwrite.getByRole('button', { name: '임시 저장' }).click()
    await expect(overwrite).toBeHidden({ timeout: 10_000 })
  }
  const leftover = page.getByRole('dialog').filter({ hasText: /임시 저장/ })
  if (await leftover.isVisible().catch(() => false)) {
    const confirm = leftover.getByRole('button', { name: '확인' }).first()
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click()
      await expect(leftover).toBeHidden({ timeout: 10_000 }).catch(() => undefined)
    }
  }
}

async function saveDraft(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '임시저장' }).click()
  const draftDialog = page.getByRole('dialog').filter({ hasText: /임시 저장/ })
  await expect(draftDialog.first()).toBeVisible({ timeout: 20_000 })
  await dismissDraftDialogs(page)
}

async function closeWizard(page: import('@playwright/test').Page) {
  await dismissDraftDialogs(page)
  await page
    .getByRole('banner')
    .filter({ hasText: '교육받은 교사 프로그램 등록' })
    .getByLabel('닫기')
    .click()
}

async function readCanonicalCommon(page: import('@playwright/test').Page) {
  return page.evaluate(prefix => {
    const bagRaw = localStorage.getItem('cms.jakorea.writingFormTemplateSaves.v1')
    if (bagRaw) {
      try {
        const bag = JSON.parse(bagRaw) as {
          byTemplateId?: Record<
            string,
            {
              settingsJson?: {
                trainedTeachersRegistrationCanonical?: { common?: Record<string, unknown> }
              }
            }
          >
        }
        const match = Object.entries(bag.byTemplateId ?? {}).find(([templateId]) =>
          templateId.startsWith(prefix)
        )
        const common = match?.[1]?.settingsJson?.trainedTeachersRegistrationCanonical?.common
        if (common != null) return common
      } catch {
        // fall through
      }
    }
    const key = Object.keys(localStorage).find(item => item.startsWith(prefix))
    if (!key) return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as {
        settingsJson?: {
          trainedTeachersRegistrationCanonical?: { common?: Record<string, unknown> }
        }
      }
      return parsed.settingsJson?.trainedTeachersRegistrationCanonical?.common ?? null
    } catch {
      return null
    }
  }, DRAFT_KEY_PREFIX)
}

async function reopenContinue(page: import('@playwright/test').Page) {
  await page.goto('/programs/trained-teachers?new=1&registrationDraft=continue')
  await waitWizard(page)
}

test.describe.configure({ mode: 'serial' })

test.describe('TT 등록 임시저장 복원', () => {
  test('CASE-01 제목 3종이 닫기·재진입·2차 저장 후에도 섞이지 않는다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page)
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await clickDevAutofill(page)
    await fillCaseTitles(page, CASE_01)
    await saveDraft(page)

    const saved = await readCanonicalCommon(page)
    expect(saved?.mainTitle).toBe(CASE_01.mainTitle)
    expect(saved?.announcementTitle).toBe(CASE_01.announcementTitle)
    expect(saved?.titleEn).toBe(CASE_01.titleEn)

    await closeWizard(page)
    await reopenContinue(page)
    await expectCaseTitles(page, CASE_01)

    await saveDraft(page)
    await closeWizard(page)
    await reopenContinue(page)
    await expectCaseTitles(page, CASE_01)

    await fillCaseTitles(page, CASE_05)
    await saveDraft(page)
    await closeWizard(page)
    await reopenContinue(page)
    await expectCaseTitles(page, CASE_05)

    await page.reload()
    const notice = page.getByRole('dialog').filter({ hasText: '임시저장 이력 안내' })
    if (await notice.isVisible().catch(() => false)) {
      await notice.getByRole('radio', { name: '이어서 작성' }).check()
      await notice.getByRole('button', { name: '이어서 작성' }).click()
    }
    await waitWizard(page)
    await expectCaseTitles(page, CASE_05)

    await page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expect(page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
    await saveDraft(page)
    await closeWizard(page)
    await reopenContinue(page)
    await expectCaseTitles(page, CASE_05)

    assertIsolatedNetwork(log)
  })

  test('저장본 없이 새 작성하면 이전 TT 제목이 남지 않는다', async ({ page }) => {
    await installTtIsolatedNetwork(page)
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    const main = page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()
    await expect(main).toBeVisible({ timeout: 15_000 })
    await expect(main).not.toHaveValue(CASE_05.mainTitle)
    await expect(main).not.toHaveValue(CASE_01.mainTitle)
  })

  test('CREATE body에 교육 형태 common / IPS perSchedule 모드가 실린다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page)
    await page.goto('/programs/trained-teachers?new=1&registrationDraft=fresh')
    await waitWizard(page)
    await clickDevAutofill(page)
    const ipsPerSchedule = page.getByRole('radio', { name: '일정 별 상이' })
    if (await ipsPerSchedule.isVisible().catch(() => false)) {
      await ipsPerSchedule.check()
    }
    await page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expect(page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect.poll(() => log.createProgram, { timeout: 60_000 }).not.toBeNull()
    const created = parseCreatePayload(log.createProgram?.body)
    expect(created.common.educationFormScheduleDetail).toBe('common')
    expect(created.common.ipsScheduleDetail).toBe('perSchedule')
    assertIsolatedNetwork(log)
  })
})
