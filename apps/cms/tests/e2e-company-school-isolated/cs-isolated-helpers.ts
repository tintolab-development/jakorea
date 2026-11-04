import { Buffer } from 'node:buffer'
import { expect, type Locator, type Page } from '@playwright/test'
import { CompanySchoolRegistrationPage } from '../e2e/pages/company-school-registration.page'
import {
  checkRadioIfVisible,
  checkVisibleEnabledAgreeRadios,
  clickSectionNavIfVisible,
  detailInfoField,
  fillAllByPlaceholder,
  fillByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  selectByPlaceholder,
  selectByPlaceholderIfVisible,
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
  const trigger = page.getByRole('button', { name: '지급 항목을 선택해 주세요' }).first()
  const fieldTrigger = detailInfoField(page, '지급 항목')
    .locator('.cms-select-multi__trigger')
    .first()
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
  await fillTextNearLabel(
    page,
    '대표 프로그램명 (국문)',
    '대표 프로그램명을 입력해 주세요',
    VALUES_B.title
  )
  await fillTextNearLabel(
    page,
    '대표 프로그램명 (영문)',
    '대표 프로그램명을 입력해 주세요',
    VALUES_B.titleEn
  )
  await fillTextNearLabel(
    page,
    '공고용 프로그램명',
    '모집 시 노출될 프로그램명을 입력해 주세요',
    VALUES_B.announcement
  )
  await selectByPlaceholder(page, '세부 프로그램명을 선택해 주세요')
  await fillParagraphDateByPlaceholder(page, '사업 운영 기간을 선택해 주세요', 'range', {
    futureMonthClicks: 2,
    required: true,
  })
  await selectByPlaceholderIfVisible(page, '사업 분야를 선택해 주세요', '경제금융')
  await selectNearLabelIfVisible(page, '사업 분야', '경제금융')
  await selectNearLabel(page, '후원사', 'RHF-B-후원사')
  await selectNearLabel(page, '후원사 담당자', 'RHF-B-담당자')
  await selectNearLabelIfVisible(page, '교육 과정', 'Traditional (Paper)')
  await selectNearLabelIfVisible(page, 'IP Owned', 'JA')
  await selectNearLabelIfVisible(page, 'Course Delivered By', 'JA')
  await checkRadioIfVisible(page, 'Yes')
  await selectNearLabelIfVisible(page, 'IPS 유형', 'Inspire')
  await selectByPlaceholderIfVisible(page, 'IPS 유형', 'Inspire')
  const course = detailInfoField(page, '교육 과정')
  if (await course.isVisible().catch(() => false)) {
    const selected = await course
      .locator('.ant-select-selection-item')
      .innerText()
      .catch(() => '')
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
  await fillParagraphDateByPlaceholder(page, '진행 기간을 선택해 주세요', 'range', {
    required: true,
    force: true,
    label: '교육 진행 일정 선택',
  })
  await clickSectionNavIfVisible(page, '기본 정보')
  await expect(
    detailInfoField(page, '대표 프로그램명 (국문)').getByPlaceholder(
      '대표 프로그램명을 입력해 주세요'
    )
  ).toHaveValue(VALUES_B.title)
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

async function selectInstructorRecruitTargets(page: Page) {
  const field = detailInfoField(page, '모집 대상')
  await expect(field).toBeVisible({ timeout: 10_000 })
  const trigger = field.locator('.cms-select-multi__trigger').first()
  if (!(await trigger.isVisible().catch(() => false))) {
    await selectNearLabel(page, '모집 대상', undefined, { force: true })
    return
  }
  await trigger.click()
  const panel = page.locator('.cms-select-multi__panel:visible').last()
  await expect(panel).toBeVisible({ timeout: 10_000 })
  const row = panel
    .locator('.cms-select-multi__row')
    .filter({ hasText: /^성인$|성인/ })
    .first()
  await expect(row).toBeVisible({ timeout: 10_000 })
  const checkbox = row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first()
  const checked = (await row.locator('.ant-checkbox-checked').count()) > 0
  await checkbox.click()
  if (checked) await checkbox.click()
  if (await panel.isVisible().catch(() => false)) {
    await trigger.click({ force: true }).catch(() => undefined)
  }
}

async function forceAnnouncementPublished(page: Page) {
  const published = page.getByRole('radio', { name: '게시' }).first()
  await expect(published).toBeVisible({ timeout: 10_000 })
  const unpublished = page.getByRole('radio', { name: '미게시' }).first()
  if (await unpublished.isVisible().catch(() => false)) {
    await unpublished.click({ force: true })
  }
  await published.click({ force: true })
  await expect(published).toBeChecked({ timeout: 5_000 })
}

async function fillIsolatedInstructorRecruit(page: Page) {
  const panel = page.getByRole('group', { name: /강사 모집 정보/ }).filter({
    hasText: '프로그램 운영 기간',
  })
  await expect(panel).toBeVisible({ timeout: 15_000 })
  await forceAnnouncementPublished(page)
  const dateOpts = { futureMonthClicks: 2, root: panel, force: true } as const
  await fillParagraphDateByPlaceholder(
    page,
    '프로그램 운영 기간을 선택해 주세요',
    'range',
    dateOpts
  )
  await selectInstructorRecruitTargets(page)
  await fillByPlaceholder(panel, '상세 모집 대상을 입력해 주세요', '성인 강사')
  await expect(panel.getByPlaceholder('상세 모집 대상을 입력해 주세요')).toHaveValue('성인 강사')
  await fillParagraphDateByPlaceholder(page, '모집 기간을 선택해 주세요', 'range', dateOpts)
  await fillParagraphDateByPlaceholder(page, '합격자 발표일', 'single', {
    ...dateOpts,
    preferLaterDays: true,
  })
  await fillParagraphDateByPlaceholder(page, '발표일', 'single', {
    ...dateOpts,
    preferLaterDays: true,
  })
  await fillByPlaceholder(panel, '발표 방법 안내', '이메일 및 CMS 알림으로 개별 안내')
  await fillByPlaceholder(panel, '담당 문의처', 'JA Korea 1사1교 운영팀')
  await fillByPlaceholder(panel, '문의처 전화번호', '02-1234-5678')
  await fillByPlaceholder(panel, '문의처 이메일', 'company-school-e2e@jakorea.org')
  await fillByPlaceholder(panel, '비고란을 작성하세요', '-')
  await expect(panel.getByPlaceholder('발표 방법 안내')).toHaveValue(
    '이메일 및 CMS 알림으로 개별 안내'
  )
  await expect(panel.getByPlaceholder('담당 문의처')).toHaveValue('JA Korea 1사1교 운영팀')
  await expect(panel.getByPlaceholder('문의처 전화번호')).not.toHaveValue('')
  await expect(panel.getByPlaceholder('문의처 이메일')).toHaveValue(
    'company-school-e2e@jakorea.org'
  )
  await expect(panel.getByPlaceholder('비고란을 작성하세요')).toHaveValue('-')
}

async function fillIsolatedInstitutionRecruitExtras(page: Page) {
  await page
    .getByRole('tab', { name: /참여 기관 모집/ })
    .click()
    .catch(() => undefined)
  await forceAnnouncementPublished(page)
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
  const targetTrigger = page.getByRole('button', { name: /교육 대상을 선택해 주세요/ }).first()
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
  // 탭 템플릿 fetch가 끝나기 전에는 이전 탭 패널 DOM이 잠깐 남는다(G1) — 네트워크가 잠잠해질 때까지 짧게 기다린다.
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
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
  const instructorRecruitTab = page.getByRole('tab', { name: /강사 모집/ }).first()
  await expect(instructorRecruitTab).toBeVisible({ timeout: 15_000 })
  await instructorRecruitTab.click()
  await waitActiveWizardTabPanel(page, instructorRecruitTab)
  await expect(instructorRecruitTab).toHaveAttribute('aria-selected', 'true')
  await fillIsolatedInstructorRecruit(page)
  await fillVisibleRecruitNotes(page)
  await expect(
    page.getByRole('group', { name: /강사 모집 정보/ }).getByPlaceholder('담당 문의처')
  ).toHaveValue('JA Korea 1사1교 운영팀')
  const institutionRecruitTab = page
    .getByRole('tab', { name: /참여 기관 모집|참여자 모집/ })
    .first()
  await expect(institutionRecruitTab).toBeVisible({ timeout: 15_000 })
  await institutionRecruitTab.click()
  await waitActiveWizardTabPanel(page, institutionRecruitTab)
  await fillIsolatedInstitutionRecruitExtras(page)
  const requiredDialog = page.getByRole('dialog').filter({ hasText: '필수 항목 미입력' })
  if (await requiredDialog.isVisible().catch(() => false)) {
    await requiredDialog.getByRole('button', { name: '확인' }).click()
  }
  await registration.goToApplication()
  await registration.fillApplicationInfo()
  await checkApplicationAgreeRadios(page)
  await openAndCloseRegistrationPreview(page)
  await expect(page.getByText(THIRD_PARTY_RECIPIENT_VALUE).first()).toBeVisible()
  return registration
}

async function openAndCloseRegistrationPreview(page: Page) {
  const preview = page.getByRole('button', { name: '미리보기' }).first()
  await expect(preview).toBeVisible({ timeout: 10_000 })
  await preview.click()
  await expect(page.getByText('현재 화면은 미리보기 화면입니다.')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(THIRD_PARTY_RECIPIENT_VALUE).first()).toBeVisible({ timeout: 10_000 })
  const closePreview = page.getByRole('button', { name: '미리보기 닫기' })
  await expect(closePreview).toBeVisible({ timeout: 10_000 })
  await closePreview.click()
  await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
    timeout: 10_000,
  })
}

const THIRD_PARTY_RECIPIENT_VALUE = 'JA코리아'
const THIRD_PARTY_RECIPIENT_PLACEHOLDER = '제공받는 곳을 입력해 주세요'

async function fillThirdPartyRecipientIfEmpty(page: Page) {
  await waitActiveWizardTabPanel(page)
  await clickSectionNavIfVisible(page, '개인정보')
  const card = page.locator('[data-paragraph-id*="third-party"]').first()
  await expect(card, '제3자 동의 단락이 보여야 합니다').toBeVisible({ timeout: 15_000 })
  const table = card.locator('[role="grid"]').first()
  await expect(table, '제3자 동의 「제공받는 곳」 표가 보여야 합니다').toBeVisible({
    timeout: 15_000,
  })
  if (
    await table
      .getByText(THIRD_PARTY_RECIPIENT_VALUE, { exact: true })
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return
  }
  if (
    await table
      .getByText('배정된 교육 대상 학교')
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return
  }

  const editWrap = card.locator('.form-editor-horizontal-table-wrap--system-settings-text-edit')
  if (!(await editWrap.isVisible().catch(() => false))) {
    await card.click()
  }
  if (!(await editWrap.isVisible().catch(() => false))) {
    await card.click()
  }
  await expect(
    editWrap,
    '제3자 동의 단락 선택 후 제공받는 곳 셀을 편집할 수 있어야 합니다'
  ).toBeVisible({ timeout: 10_000 })
  const recipientCell = card.locator('[role="row"]').nth(1).locator('[role="gridcell"]').nth(0)
  await expect(recipientCell, '빈 「제공받는 곳」 셀을 클릭할 수 있어야 합니다').toBeVisible({
    timeout: 10_000,
  })
  await recipientCell.click()
  const editor = card.locator('.text-cell-input textarea')
  await expect(editor.first(), '제공받는 곳 셀 편집기가 열려야 합니다').toBeVisible({
    timeout: 8_000,
  })
  await editor.first().fill(THIRD_PARTY_RECIPIENT_VALUE)
  await editor.first().blur()
  await expect(table.getByText(THIRD_PARTY_RECIPIENT_VALUE, { exact: true }).first()).toBeVisible({
    timeout: 8_000,
  })
}

async function visitApplicationTabsAndFillRequired(page: Page) {
  const institutionTab = page.getByRole('tab', { name: /참여 기관 신청/ }).first()
  await expect(institutionTab).toBeVisible({ timeout: 15_000 })
  await institutionTab.click()
  await waitActiveWizardTabPanel(page, institutionTab)
  await expect(institutionTab).toHaveAttribute('aria-selected', 'true')
  await checkVisibleEnabledAgreeRadios(page)
  await fillThirdPartyRecipientIfEmpty(page)
  await expect(page.getByText(THIRD_PARTY_RECIPIENT_VALUE).first()).toBeVisible()

  const instructorTab = page.getByRole('tab', { name: /강사 신청/ }).first()
  await expect(instructorTab).toBeVisible({ timeout: 15_000 })
  await instructorTab.click()
  await waitActiveWizardTabPanel(page, instructorTab)
  await expect(instructorTab).toHaveAttribute('aria-selected', 'true')
  await checkVisibleEnabledAgreeRadios(page)
  await fillThirdPartyRecipientIfEmpty(page)

  await institutionTab.click()
  await waitActiveWizardTabPanel(page, institutionTab)
  await clickSectionNavIfVisible(page, '개인정보')
  await expect(
    page
      .locator('[data-paragraph-id*="third-party"]')
      .getByText(THIRD_PARTY_RECIPIENT_VALUE)
      .first()
  ).toBeVisible({ timeout: 15_000 })
}

async function checkApplicationAgreeRadios(page: Page) {
  await visitApplicationTabsAndFillRequired(page)
}

export async function completeAndCapture(page: Page, log: IsolatedNetworkLog) {
  const institutionTab = page.getByRole('tab', { name: /참여 기관 신청/ }).first()
  if (await institutionTab.isVisible().catch(() => false)) {
    await institutionTab.click()
    await waitActiveWizardTabPanel(page, institutionTab)
    await clickSectionNavIfVisible(page, '개인정보')
    await expect(
      page
        .locator('[data-paragraph-id*="third-party"]')
        .getByText(THIRD_PARTY_RECIPIENT_VALUE)
        .first()
    ).toBeVisible({ timeout: 15_000 })
  }
  const requiredDialog = page.getByRole('dialog').filter({ hasText: '필수 항목 미입력' })
  await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
  if (await requiredDialog.isVisible().catch(() => false)) {
    throw new Error('등록 완료가 필수 항목 미입력으로 차단되어 CREATE가 호출되지 않았습니다')
  }
  await expect.poll(() => log.createProgram, { timeout: 90_000 }).not.toBeNull()
  await expect
    .poll(() => log.formVersionPublishes.length, { timeout: 30_000 })
    .toBeGreaterThan(0)
    .catch(() => undefined)
  await expect
    .poll(
      () => {
        return log.formVersionPuts.some(item => {
          const overlayKeys = Object.keys(overlayFromFormVersionPut(item.body))
          const raw = JSON.stringify(item.body ?? {})
          return (
            overlayKeys.some(key => key.startsWith('application.economy.')) ||
            raw.includes('program-application-economy-seed')
          )
        })
      },
      { timeout: 60_000 }
    )
    .toBe(true)
  const successDialog = page.getByRole('dialog').filter({ hasText: '등록되었습니다.' })
  await expect(successDialog).toBeVisible({ timeout: 60_000 })
  await successDialog.getByRole('button', { name: '확인' }).click()
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
  const dialog = page
    .getByRole('dialog')
    .filter({ hasText: /임시 저장|필수 항목|입력 확인|등록 실패/ })
  if (
    !(await dialog
      .first()
      .isVisible()
      .catch(() => false))
  )
    return
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
  await expect(page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()).toHaveValue(
    value,
    {
      timeout: 20_000,
    }
  )
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
  const done = page
    .getByRole('dialog')
    .filter({ hasText: /임시 저장 완료|임시 저장 실패|임시 저장/ })
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
  await page
    .getByRole('tab', { name: /참여 기관 모집|참여자 모집/ })
    .first()
    .click()
    .catch(() => undefined)
  await clickSectionNavIfVisible(page, '상세 정보')
  await expect(page.getByText('썸네일 이미지').first()).toBeVisible({ timeout: 20_000 })
  const thumbRemove = page.locator('.thumbnail-upload-field').getByRole('button', { name: /삭제/ })
  if (
    await thumbRemove
      .first()
      .isVisible()
      .catch(() => false)
  ) {
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
