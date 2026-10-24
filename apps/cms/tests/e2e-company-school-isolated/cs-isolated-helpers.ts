import { Buffer } from 'node:buffer'
import { expect, type Locator, type Page } from '@playwright/test'
import { CompanySchoolRegistrationPage } from '../e2e/pages/company-school-registration.page'
import {
  checkVisibleEnabledAgreeRadios,
  clickSectionNavIfVisible,
  detailInfoField,
  fillAllByPlaceholder,
  fillByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  selectByPlaceholder,
  selectNearLabel,
  selectNearLabelIfVisible,
} from '../e2e/pages/form-helpers'
import {
  overlayFromCreateBody,
  overlayFromFormVersionPut,
  type IsolatedNetworkLog,
} from './install-cs-isolated-network'

export const VALUES_B = {
  title: 'RHF-B-일사일교',
  announcement: 'RHF-B-공고명',
  titleEn: 'RHF-B English Title',
  kpiParticipants: '20',
  kpiInstructors: '2',
  kpiSchools: '1',
  kpiClasses: '2',
  wages: ['111000', '112000', '121000', '122000', '131000', '132000'] as const,
}

export const VALUES_A = {
  title: 'OVERLAY-A',
  announcement: 'OVERLAY-A-공고',
}

export async function waitWizard(page: Page) {
  await expect(page).toHaveURL(/\/programs\/company-school\?.*new=1/, { timeout: 45_000 })
  await expect(page.getByText('1사1교 프로그램 등록', { exact: true })).toBeVisible({
    timeout: 45_000,
  })
  await expect(page.getByRole('button', { name: '모집 정보 작성하기' })).toBeVisible({
    timeout: 45_000,
  })
}

export async function openFreshWizard(page: Page) {
  await page.goto('/programs/company-school?new=1&registrationDraft=fresh')
  const draftDialog = page.getByRole('dialog').filter({ hasText: '임시저장 이력 안내' })
  if (await draftDialog.isVisible().catch(() => false)) {
    await draftDialog.getByRole('radio', { name: '신규 등록' }).check()
    await draftDialog.getByRole('button', { name: '프로그램 등록' }).click()
  }
  await waitWizard(page)
}

async function fillTextNearLabel(page: Page, label: string, placeholder: string, value: string) {
  const field = detailInfoField(page, label)
  await expect(field).toBeVisible({ timeout: 15_000 })
  await field.getByPlaceholder(placeholder).fill(value)
}

async function selectPaymentItemsB(page: Page) {
  await clickSectionNavIfVisible(page, '임금 정보')
  const trigger = page.getByRole('button', { name: '지급 항목을 선택하세요' }).first()
  const fieldTrigger = detailInfoField(page, '지급 항목').locator('.cms-select-multi__trigger').first()
  const opener = (await trigger.isVisible().catch(() => false)) ? trigger : fieldTrigger
  if (!(await opener.isVisible().catch(() => false))) return
  await opener.click()
  const panel = page.locator('.cms-select-multi__panel:visible').last()
  await expect(panel).toBeVisible({ timeout: 10_000 })
  const rows = panel.locator('.cms-select-multi__row')
  await expect(rows.first()).toBeVisible({ timeout: 10_000 })
  const count = await rows.count()
  for (let index = 0; index < count; index += 1) {
    const row = rows.nth(index)
    const text = (await row.innerText()).trim()
    const checked = (await row.locator('.ant-checkbox-checked').count()) > 0
    const wanted = /RHF-B/.test(text) && !/Overlay-A|구 Overlay/.test(text)
    if (wanted !== checked) {
      await row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first().click()
    }
  }
  await opener.click({ force: true }).catch(() => undefined)
}

/** 현재 RHF 공통정보 UI (국문/영문/공고용)에 맞춘 격리 입력. live page object의 구 placeholder는 쓰지 않는다. */
export async function fillIsolatedCommonInfo(page: Page) {
  await clickSectionNavIfVisible(page, '기본 정보')
  await fillTextNearLabel(page, '대표 프로그램명 (국문)', '대표 프로그램명을 입력하세요', VALUES_B.title)
  await fillTextNearLabel(page, '대표 프로그램명 (영문)', '대표 프로그램명을 입력하세요', VALUES_B.titleEn)
  await fillTextNearLabel(
    page,
    '공고용 프로그램명',
    '모집 시 노출될 프로그램명을 입력하세요',
    VALUES_B.announcement
  )
  await selectByPlaceholder(page, '세부 프로그램명을 선택하세요')
  await fillParagraphDateByPlaceholder(page, '사업 운영 기간을 선택하세요', 'range', {
    futureMonthClicks: 2,
  })
  await selectNearLabel(page, '후원사', 'RHF-B-후원사')
  await selectNearLabel(page, '후원사 담당자')
  await selectNearLabelIfVisible(page, '교육 과정', 'Traditional (Paper)')
  const course = detailInfoField(page, '교육 과정')
  if (await course.isVisible().catch(() => false)) {
    const selected = await course.locator('.ant-select-selection-item').innerText().catch(() => '')
    if (!selected.trim() || selected.includes('전체') || selected.includes('선택')) {
      await selectNearLabel(page, '교육 과정')
    }
  }
  await clickSectionNavIfVisible(page, '사업 KPI 목표')
  await fillDistinctKpiAndWage(page)
  await clickSectionNavIfVisible(page, '임금 정보')
  const wageInputs = page.getByPlaceholder('직접 입력')
  const wageCount = await wageInputs.count()
  for (let index = 0; index < Math.min(wageCount, VALUES_B.wages.length); index += 1) {
    const input = wageInputs.nth(index)
    if (await input.isVisible().catch(() => false)) {
      await input.fill(VALUES_B.wages[index] ?? '')
    }
  }
  await selectPaymentItemsB(page)
  await clickSectionNavIfVisible(page, '교육 진행 일정 설정')
  await fillParagraphDateByPlaceholder(page, '진행 기간을 선택하세요', 'range', {
    futureMonthClicks: 2,
  })
  await clickSectionNavIfVisible(page, '기본 정보')
}

export async function fillDistinctKpiAndWage(page: Page) {
  const kpiInputs = page.getByPlaceholder('목표값 입력')
  const kpiCount = await kpiInputs.count()
  const kpiValues = [
    VALUES_B.kpiParticipants,
    VALUES_B.kpiInstructors,
    VALUES_B.kpiSchools,
    VALUES_B.kpiClasses,
  ]
  for (let index = 0; index < Math.min(kpiCount, kpiValues.length); index += 1) {
    const input = kpiInputs.nth(index)
    if (await input.isVisible().catch(() => false)) {
      await input.fill(kpiValues[index] ?? '')
    }
  }
  const wageInputs = page.getByPlaceholder('직접 입력')
  const wageCount = await wageInputs.count()
  for (let index = 0; index < Math.min(wageCount, VALUES_B.wages.length); index += 1) {
    const input = wageInputs.nth(index)
    if (await input.isVisible().catch(() => false)) {
      await input.fill(VALUES_B.wages[index] ?? '')
    }
  }
}

async function fillIsolatedInstitutionRecruitExtras(page: Page) {
  await page.getByRole('tab', { name: /참여 기관 모집/ }).click().catch(() => undefined)
  const maxInputs = page.getByPlaceholder('최대값 입력')
  const maxCount = await maxInputs.count()
  const maxValues = ['5', '20']
  for (let index = 0; index < Math.min(maxCount, maxValues.length); index += 1) {
    const input = maxInputs.nth(index)
    if (await input.isVisible().catch(() => false)) {
      await input.fill(maxValues[index] ?? '1')
    }
  }
  await selectNearLabelIfVisible(page, '교육 대상')
  const targetTrigger = page.getByRole('button', { name: /교육 대상을 선택하세요/ }).first()
  if (await targetTrigger.isVisible().catch(() => false)) {
    await targetTrigger.click()
    const panel = page.locator('.cms-select-multi__panel:visible').last()
    if (await panel.isVisible().catch(() => false)) {
      const row = panel.locator('.cms-select-multi__row').first()
      if (await row.isVisible().catch(() => false)) {
        await row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first().click()
      }
      await targetTrigger.click({ force: true }).catch(() => undefined)
    }
  }
  await fillVisibleRecruitNotes(page)
}

async function waitActiveWizardTabPanel(page: Page, tab?: Locator) {
  if (tab && (await tab.isVisible().catch(() => false))) {
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 })
  }
  const panel = page.locator('[role="tabpanel"]:visible').first()
  if ((await panel.count()) > 0) {
    await expect(panel).toBeVisible({ timeout: 10_000 })
  }
}

async function fillVisibleRecruitNotes(page: Page) {
  await waitActiveWizardTabPanel(page)
  const notes = page.getByPlaceholder(/비고란을 작성하세요/)
  const count = await notes.count()
  for (let index = 0; index < count; index += 1) {
    const input = notes.nth(index)
    if (!(await input.isVisible().catch(() => false))) continue
    const value = await input.inputValue({ timeout: 2000 }).catch(() => '')
    if (!value.trim()) await input.fill('-')
  }
}

export async function fillRegistrationThroughComplete(page: Page) {
  const registration = new CompanySchoolRegistrationPage(page)
  await fillIsolatedCommonInfo(page)
  await registration.goToRecruitment()
  await registration.fillRecruitmentInfo()
  await fillIsolatedInstitutionRecruitExtras(page)
  const instructorRecruitTab = page.getByRole('tab', { name: /강사 모집/ })
  await instructorRecruitTab.click().catch(() => undefined)
  await waitActiveWizardTabPanel(page, instructorRecruitTab.first())
  await fillVisibleRecruitNotes(page)
  const institutionRecruitTab = page.getByRole('tab', { name: /참여 기관 모집|참여자 모집/ })
  await institutionRecruitTab.click().catch(() => undefined)
  await waitActiveWizardTabPanel(page, institutionRecruitTab.first())
  await fillIsolatedInstitutionRecruitExtras(page)
  const requiredDialog = page.getByRole('dialog').filter({ hasText: '필수 항목 미입력' })
  if (await requiredDialog.isVisible().catch(() => false)) {
    await requiredDialog.getByRole('button', { name: '확인' }).click()
  }
  await registration.goToApplication()
  await registration.fillApplicationInfo()
  await checkApplicationAgreeRadios(page)
  return registration
}

async function fillThirdPartyRecipientIfEmpty(page: Page) {
  await waitActiveWizardTabPanel(page)
  const grids = page.getByRole('grid')
  const gridCount = await grids.count()
  for (let gridIndex = 0; gridIndex < gridCount; gridIndex += 1) {
    const grid = grids.nth(gridIndex)
    if (!(await grid.getByRole('columnheader', { name: /제공받는 곳/ }).count())) continue
    const inputs = grid.locator('input, textarea, [contenteditable="true"]')
    const inputCount = await inputs.count()
    for (let index = 0; index < inputCount; index += 1) {
      const input = inputs.nth(index)
      if (!(await input.isVisible().catch(() => false))) continue
      const value = await input
        .inputValue({ timeout: 2000 })
        .catch(async () => (await input.innerText()).trim())
      if (String(value ?? '').trim()) continue
      await input.fill('JA코리아').catch(() => undefined)
      break
    }
  }
}

async function visitApplicationTabsAndFillRequired(page: Page) {
  const tabNames = [/참여 기관 신청/, /참여자 신청/, /강사 신청/]
  for (const name of tabNames) {
    const tab = page.getByRole('tab', { name }).first()
    if (await tab.isVisible().catch(() => false)) {
      await tab.click()
      await waitActiveWizardTabPanel(page, tab)
    }
    await fillThirdPartyRecipientIfEmpty(page)
    await checkVisibleEnabledAgreeRadios(page)
  }
}

async function checkApplicationAgreeRadios(page: Page) {
  await visitApplicationTabsAndFillRequired(page)
}

export async function completeAndCapture(page: Page, log: IsolatedNetworkLog) {
  const requiredDialog = page.getByRole('dialog').filter({ hasText: '필수 항목 미입력' })
  if (await requiredDialog.isVisible().catch(() => false)) {
    await requiredDialog.getByRole('button', { name: '확인' }).click()
    await checkApplicationAgreeRadios(page)
  }
  await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
  if (await requiredDialog.isVisible().catch(() => false)) {
    await requiredDialog.getByRole('button', { name: '확인' }).click()
    await checkApplicationAgreeRadios(page)
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
  }
  await expect.poll(() => log.createProgram, { timeout: 90_000 }).not.toBeNull()
  const successDialog = page.getByRole('dialog').filter({ hasText: '등록되었습니다.' })
  if (await successDialog.isVisible().catch(() => false)) {
    await successDialog.getByRole('button', { name: '확인' }).click()
  }
}

export function createOverlay(log: IsolatedNetworkLog) {
  return overlayFromCreateBody(log.createProgram?.body)
}

export function applicationFormVersionOverlays(log: IsolatedNetworkLog) {
  return log.formVersionPuts.map(item => overlayFromFormVersionPut(item.body))
}

export function bindingCodes(log: IsolatedNetworkLog): string {
  return JSON.stringify(log.formBindings)
}

export async function dismissVisibleDialogs(page: Page) {
  const dialog = page.getByRole('dialog').filter({ hasText: /임시 저장|필수 항목|입력 확인|등록 실패/ })
  if (!(await dialog.first().isVisible().catch(() => false))) return
  const confirm = dialog.getByRole('button', { name: '확인' }).first()
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click().catch(() => undefined)
  }
}

export async function expectWizardCommonTitle(page: Page, value: string) {
  await dismissVisibleDialogs(page)
  await page
    .getByRole('button', { name: '모집 정보 돌아가기' })
    .click({ timeout: 3_000 })
    .catch(() => undefined)
  await page
    .getByRole('button', { name: '공통 정보 돌아가기' })
    .click({ timeout: 8_000 })
    .catch(() => undefined)
  await clickSectionNavIfVisible(page, '기본 정보')
  await expect(page.getByPlaceholder('대표 프로그램명을 입력하세요').first()).toHaveValue(value, {
    timeout: 20_000,
  })
}

export async function openCompanySchoolRecruitNav(page: Page) {
  const recruit = page.getByRole('button', { name: '모집 정보', exact: true }).first()
  await expect(recruit).toBeVisible({ timeout: 20_000 })
  await recruit.click()
}

export async function clickSaveIfVisible(page: Page) {
  const save = page.getByRole('button', { name: /^저장/ }).first()
  if (await save.isVisible().catch(() => false)) {
    await save.click()
    return
  }
  const editSave = page.getByRole('button', { name: '정보 수정' }).first()
  await expect(editSave).toBeVisible({ timeout: 15_000 })
  await editSave.click()
}

export async function saveWizardDraft(page: Page) {
  const draft = page.getByRole('button', { name: /임시저장|임시 저장/ }).first()
  await expect(draft).toBeVisible({ timeout: 15_000 })
  await draft.click()
  const done = page.getByRole('dialog').filter({ hasText: /임시 저장 완료|임시 저장 실패|임시 저장/ })
  await expect(done.first()).toBeVisible({ timeout: 20_000 })
  const confirm = done.getByRole('button', { name: '확인' }).first()
  if (await confirm.isVisible().catch(() => false)) await confirm.click()
}

export async function expectFieldValue(page: Page, placeholder: string, value: string) {
  await expect(page.getByPlaceholder(placeholder).first()).toHaveValue(value)
}

const ISOLATED_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

export async function fillInstitutionRecruitMedia(page: Page) {
  await page.getByRole('tab', { name: /참여 기관 모집|참여자 모집/ }).first().click().catch(() => undefined)
  await clickSectionNavIfVisible(page, '상세 정보')
  await expect(page.getByText('썸네일 이미지').first()).toBeVisible({ timeout: 20_000 })
  const thumbRemove = page.locator('.thumbnail-upload-field').getByRole('button', { name: /삭제/ })
  if (await thumbRemove.first().isVisible().catch(() => false)) {
    await thumbRemove.first().click()
  }
  const thumb = page.locator('.thumbnail-upload-field input[type="file"]').first()
  await expect(thumb).toBeAttached({ timeout: 20_000 })
  await thumb.setInputFiles({
    name: 'cs-thumb.png',
    mimeType: 'image/png',
    buffer: ISOLATED_PNG_BUFFER,
  })
  await expect(page.getByText('cs-thumb.png').first()).toBeVisible({ timeout: 25_000 })
  await expect(page.locator('.file-upload-overlay')).toHaveCount(0, { timeout: 20_000 })
}

export async function expectRequiredIncompleteAlert(page: Page) {
  const dialog = page.getByRole('dialog').filter({ hasText: '필수 항목 미입력' })
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(dialog.getByText(/필수 항목을 모두 작성/)).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()
}

export async function fillKpiValueAt(page: Page, index: number, value: string) {
  await clickSectionNavIfVisible(page, '사업 KPI 목표')
  const kpiInputs = page.getByPlaceholder('목표값 입력')
  await expect(kpiInputs.nth(index)).toBeVisible({ timeout: 10_000 })
  await kpiInputs.nth(index).fill(value)
}

export { fillAllByPlaceholder }
