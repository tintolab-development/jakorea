import { expect, type Page } from '@playwright/test'

export const FORM_MANAGEMENT_URL = '/templates/form-management?tab=template-form'
export const ISSUANCE_URL = '/templates/form-management?tab=issuance-form'
export const FORM_TEST_URL = '/templates/form-management?tab=form-test'
export const FORM_TEST_TABLES_URL = '/templates/form-test/tables?tab=form-test'

export async function openTemplateByName(
  page: Page,
  templateName: string,
  options?: { expectSaveButton?: boolean }
) {
  const expectSaveButton = options?.expectSaveButton ?? true
  const row = page.locator('tr').filter({ hasText: templateName })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: '양식 상세보기' }).click()
  if (expectSaveButton) {
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible({ timeout: 20_000 })
  }
}

export async function closeTemplateEditor(page: Page) {
  const saveButton = page.getByRole('button', { name: '저장' })
  if (!(await saveButton.isVisible().catch(() => false))) {
    const crimeClose = page.locator('.crime-consent-doc-modal__close')
    if (await crimeClose.isVisible().catch(() => false)) {
      await crimeClose.click()
    }
    return
  }

  await page.locator('.ant-modal-wrap').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})

  const footerClose = page.locator('.full-page-modal').getByRole('button', { name: '닫기' })
  if (await footerClose.isVisible().catch(() => false)) {
    await footerClose.click()
  } else if (await page.locator('.full-page-modal__close').isVisible().catch(() => false)) {
    await page.locator('.full-page-modal__close').click()
  } else {
    await page.keyboard.press('Escape')
  }

  if (await saveButton.isVisible().catch(() => false)) {
    await page.goto(FORM_MANAGEMENT_URL)
  }
}

export async function saveAndConfirm(page: Page) {
  await page.getByRole('button', { name: '저장' }).click()
  const dialog = page.getByRole('dialog').filter({ hasText: '양식이 저장되었습니다' })
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(dialog).toBeHidden()
  await page.locator('.ant-modal-wrap').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
}

/** 우측 커스텀 필드 네비에서 단락 선택 */
export async function selectParagraphByNavLabel(page: Page, label: string | RegExp) {
  const nav = page
    .locator('.template-modal-nav-item, .full-page-modal')
    .locator('button')
    .filter({ hasText: label })
  await expect(nav.first()).toBeVisible({ timeout: 10_000 })
  await nav.first().click()
}

/** 단락 카드 — `data-paragraph-id` */
export function paragraphCardById(page: Page, paragraphId: string) {
  return page.locator(`[data-paragraph-id="${paragraphId}"]`)
}

/** 단락 카드 — 제목 텍스트로 좁힘 */
export function paragraphCardByTitle(page: Page, title: string | RegExp) {
  return page.locator('.paragraph-card').filter({ hasText: title })
}

/** 현재 선택된 단락 카드 본문 범위 */
export function activeParagraphCard(page: Page) {
  return page.locator('.paragraph-card--active')
}

function multipleChoiceRowByLabel(
  root: ReturnType<Page['locator']>,
  optionLabel: string | RegExp
) {
  const labelPattern =
    typeof optionLabel === 'string' ? new RegExp(`^${optionLabel}$`) : optionLabel
  return root.locator('.multiple-choice-row').filter({ hasText: labelPattern })
}

/** CmsRadio + 분리 label — `.multiple-choice-row` 텍스트로 클릭 */
export async function clickMultipleChoiceOption(
  page: Page,
  optionLabel: string | RegExp,
  scope?: ReturnType<typeof paragraphCardByTitle>
) {
  const root = scope ?? page.locator('.full-page-modal')
  const row = multipleChoiceRowByLabel(root, optionLabel)
  await expect(row.first()).toBeVisible({ timeout: 10_000 })
  await row.first().locator('.ant-radio').first().click()
}

export async function expectMultipleChoiceOptionChecked(
  page: Page,
  optionLabel: string | RegExp,
  scope?: ReturnType<typeof paragraphCardByTitle>
) {
  const root = scope ?? page.locator('.full-page-modal')
  const row = multipleChoiceRowByLabel(root, optionLabel)
  await expect(row.first().locator('.ant-radio-checked')).toBeVisible({ timeout: 10_000 })
}

export async function clickRadioInActiveCard(page: Page, name: string | RegExp) {
  await clickMultipleChoiceOption(page, name, activeParagraphCard(page))
}

export async function expectRadioCheckedInActiveCard(page: Page, name: string | RegExp) {
  await expectMultipleChoiceOptionChecked(page, name, activeParagraphCard(page))
}

export async function openWritingPreview(page: Page) {
  await page.getByRole('button', { name: '미리보기' }).click()
  await expect(page.getByRole('button', { name: '미리보기 닫기' })).toBeVisible({ timeout: 15_000 })
}

export async function closeWritingPreview(page: Page) {
  await page.getByRole('button', { name: '미리보기 닫기' }).click()
  await expect(page.getByRole('button', { name: '미리보기 닫기' })).toBeHidden()
}

/** structureLocked 객관식 — 단락 이동 후 선택값 유지 회귀 (data-paragraph-id) */
export async function assertMultipleChoiceSurvivesParagraphSwitchById(
  page: Page,
  paragraphAId: string,
  paragraphBNavLabel: string | RegExp,
  paragraphANavLabel: string | RegExp,
  radioLabel: string | RegExp
) {
  await selectParagraphByNavLabel(page, paragraphANavLabel)
  const cardA = paragraphCardById(page, paragraphAId)
  await clickMultipleChoiceOption(page, radioLabel, cardA)
  await selectParagraphByNavLabel(page, paragraphBNavLabel)
  await selectParagraphByNavLabel(page, paragraphANavLabel)
  await expectMultipleChoiceOptionChecked(page, radioLabel, cardA)
}

/** structureLocked 객관식 — 단락 이동 후 선택값 유지 회귀 */
export async function assertMultipleChoiceSurvivesParagraphSwitch(
  page: Page,
  paragraphALabel: string | RegExp,
  paragraphBLabel: string | RegExp,
  radioLabel: string | RegExp
) {
  await selectParagraphByNavLabel(page, paragraphALabel)
  const cardA = paragraphCardByTitle(page, paragraphALabel)
  await clickMultipleChoiceOption(page, radioLabel, cardA)
  await selectParagraphByNavLabel(page, paragraphBLabel)
  await selectParagraphByNavLabel(page, paragraphALabel)
  await expectMultipleChoiceOptionChecked(page, radioLabel, cardA)
}
