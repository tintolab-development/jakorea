import { expect, type Page } from '@playwright/test'
import {
  overlayFromFormVersionPut,
  schemaFromFormVersionPut,
  type IsolatedNetworkLog,
} from './install-tt-isolated-network'

export type TtP4bVariantId =
  | 'TCH-01'
  | 'TCH-02'
  | 'TCH-03'
  | 'TCH-04'
  | 'TCH-05'
  | 'TCH-06'
  | 'TCH-07'
  | 'TCH-08'

export type TtP4bVariant = {
  id: TtP4bVariantId
  /** DEV 자동입력 7케이스 — date/period 축. 교육연수 ON/OFF와 별개다. */
  autofillCase: 1 | 3 | 5 | 7
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  teacherTrainingEnabled: boolean
  emptySurvey: boolean
}

export const TT_P4B_VARIANTS: readonly TtP4bVariant[] = [
  {
    id: 'TCH-01',
    autofillCase: 1,
    educationStructure: 'curriculum',
    sessionRound: 'single',
    teacherTrainingEnabled: false,
    emptySurvey: true,
  },
  {
    id: 'TCH-02',
    autofillCase: 1,
    educationStructure: 'curriculum',
    sessionRound: 'single',
    teacherTrainingEnabled: true,
    emptySurvey: false,
  },
  {
    id: 'TCH-03',
    autofillCase: 3,
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    teacherTrainingEnabled: false,
    emptySurvey: false,
  },
  {
    id: 'TCH-04',
    autofillCase: 3,
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    teacherTrainingEnabled: true,
    emptySurvey: false,
  },
  {
    id: 'TCH-05',
    autofillCase: 5,
    educationStructure: 'schedule',
    sessionRound: 'single',
    teacherTrainingEnabled: false,
    emptySurvey: false,
  },
  {
    id: 'TCH-06',
    autofillCase: 5,
    educationStructure: 'schedule',
    sessionRound: 'single',
    teacherTrainingEnabled: true,
    emptySurvey: false,
  },
  {
    id: 'TCH-07',
    autofillCase: 7,
    educationStructure: 'schedule',
    sessionRound: 'multi',
    teacherTrainingEnabled: false,
    emptySurvey: false,
  },
  {
    id: 'TCH-08',
    autofillCase: 7,
    educationStructure: 'schedule',
    sessionRound: 'multi',
    teacherTrainingEnabled: true,
    emptySurvey: false,
  },
]

const AUTOFILL_CASE_LABEL: Record<TtP4bVariant['autofillCase'], string> = {
  1: 'TCH-01 · 커리큘럼 · 단일 · 날짜',
  3: 'TCH-03 · 커리큘럼 · 복수 · 날짜',
  5: 'TCH-05 · 일정 · 단일 · 날짜',
  7: 'TCH-07 · 일정 · 복수 · 행사별 일시',
}

export function uniqueVariantTitles(id: TtP4bVariantId) {
  return {
    mainTitle: `${id} P4B 대표명`,
    announcementTitle: `${id} P4B 공고명`,
    applicationNote: `${id} P4B 신청설명`,
  }
}

export async function dismissNetworkError(page: Page) {
  const dialog = page.getByRole('dialog').filter({ hasText: '네트워크 오류' })
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole('button', { name: '확인' }).click()
  }
}

export async function waitWizard(page: Page) {
  await expect(page).toHaveURL(/\/programs\/trained-teachers/, { timeout: 45_000 })
  await expect(page.getByText('교육받은 교사 프로그램 등록').first()).toBeVisible({
    timeout: 45_000,
  })
  await dismissNetworkError(page)
  await expect(page.getByRole('button', { name: '자동입력(개발용)' })).toBeVisible({
    timeout: 45_000,
  })
}

export async function selectAutofillCase(page: Page, caseId: TtP4bVariant['autofillCase']) {
  const select = page
    .locator('.ant-select')
    .filter({ has: page.getByLabel('교육받은 교사 개발용 자동입력 케이스') })
    .first()
  await expect(select).toBeVisible({ timeout: 15_000 })
  await select.click()
  await page
    .locator('.ant-select-item-option')
    .filter({ hasText: AUTOFILL_CASE_LABEL[caseId] })
    .click()
}

export async function clickDevAutofill(page: Page) {
  const autofill = page.getByRole('button', { name: '자동입력(개발용)' })
  await expect(autofill).toBeVisible({ timeout: 30_000 })
  await page.evaluate(() => {
    ;(window as unknown as { __ttAutofillDone?: boolean }).__ttAutofillDone = false
    window.addEventListener(
      'cms:registration-dev-autofill-complete',
      () => {
        ;(window as unknown as { __ttAutofillDone?: boolean }).__ttAutofillDone = true
      },
      { once: true }
    )
  })
  await autofill.click()
  await page.waitForFunction(
    () => (window as unknown as { __ttAutofillDone?: boolean }).__ttAutofillDone === true,
    null,
    { timeout: 30_000 }
  )
}

export async function walkToComplete(page: Page) {
  await page.getByRole('button', { name: '모집 정보 작성하기' }).click()
  await expect(page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
    timeout: 30_000,
  })
  await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
  await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
    timeout: 30_000,
  })
}

export async function autofillAndWalk(page: Page) {
  await clickDevAutofill(page)
  await walkToComplete(page)
}

export async function setTeacherTraining(page: Page, enabled: boolean) {
  const toggle = page.getByRole('switch', { name: '교육 연수' })
  await expect(toggle).toBeVisible({ timeout: 15_000 })
  const checked = await toggle.isChecked()
  if (checked !== enabled) {
    await toggle.click()
  }
  await expect(toggle).toHaveAttribute('aria-checked', enabled ? 'true' : 'false')
}

export async function setEducationJournalOff(page: Page) {
  const journal = page.locator('label, [class*="detail-info"]').filter({ hasText: '교육일지 설정' })
  const noneRadio = page.getByRole('radio', { name: '없음' }).first()
  if (await journal.count()) {
    const scoped = page
      .locator('div')
      .filter({ hasText: /^교육일지 설정/ })
      .getByRole('radio', { name: '없음' })
      .first()
    if (await scoped.isVisible().catch(() => false)) {
      await scoped.check()
      return
    }
  }
  await noneRadio.check()
}

export async function fillUniqueTitles(page: Page, id: TtP4bVariantId) {
  const titles = uniqueVariantTitles(id)
  const main = page.getByPlaceholder('대표 프로그램명을 입력하세요').first()
  await expect(main).toBeVisible({ timeout: 15_000 })
  await main.fill(titles.mainTitle)
  const publicTitle = page.getByPlaceholder('모집 시 노출될 프로그램명을 입력하세요')
  if (await publicTitle.isVisible().catch(() => false)) {
    await publicTitle.fill(titles.announcementTitle)
  }
}

export async function uncheckAllSurveys(page: Page) {
  for (const label of ['설문조사', '만족도조사', '강의평가'] as const) {
    const checkbox = page.getByRole('checkbox', { name: label })
    if (!(await checkbox.isVisible().catch(() => false))) continue
    if (await checkbox.isChecked()) {
      await checkbox.click()
    }
    await expect(checkbox).not.toBeChecked()
  }
}

export function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  if (typeof raw !== 'string' || raw.trim() === '') return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

export function parseCreatePayload(body: unknown) {
  const rec = parseJsonObject(body)
  const service = parseJsonObject(rec.serviceDetailJson)
  const program = parseJsonObject(service.program)
  const common = parseJsonObject(program.generalCommonInfo)
  const surveyKeys = Array.isArray(service.generalSurveyMenuKeys)
    ? service.generalSurveyMenuKeys
    : Array.isArray(program.generalSurveyMenuKeys)
      ? program.generalSurveyMenuKeys
      : undefined
  return {
    rec,
    service,
    program,
    common,
    surveyKeys,
    educationStructure: rec.educationStructure,
    sessionRound: program.generalProgramSessionRound,
    teacherTrainingEnabled: common.teacherTrainingEnabled === true,
    educationJournalEnabled: common.educationJournalEnabled === true,
    curriculumSessions: Array.isArray(common.curriculumSessions)
      ? common.curriculumSessions
      : [],
    scheduleDetails: Array.isArray(common.scheduleDetails) ? common.scheduleDetails : [],
  }
}

export function createBodyHasNoApplication(body: unknown) {
  const text = JSON.stringify(body ?? {})
  expect(text).not.toContain('application.trainedTeachers')
  expect(text).not.toContain('application.institution')
  expect(text).not.toContain('blob:')
  expect(text).not.toContain('$d')
}

export function assertCreatePayloadParity(body: unknown, variant: TtP4bVariant) {
  const parsed = parseCreatePayload(body)
  const titles = uniqueVariantTitles(variant.id)
  expect(parsed.rec.programType).toBe('TRAINED_TEACHER')
  expect(parsed.educationStructure).toBe(
    variant.educationStructure === 'curriculum' ? 'CURRICULUM' : 'SCHEDULE'
  )
  expect(parsed.sessionRound).toBe(variant.sessionRound)
  expect(parsed.teacherTrainingEnabled).toBe(variant.teacherTrainingEnabled)
  expect(parsed.educationJournalEnabled).toBe(false)
  if (variant.educationStructure === 'curriculum') {
    expect(parsed.curriculumSessions.length).toBeGreaterThan(0)
    expect(parsed.scheduleDetails).toEqual([])
  } else {
    expect(parsed.scheduleDetails.length).toBeGreaterThan(0)
    expect(parsed.curriculumSessions).toEqual([])
  }
  if (variant.teacherTrainingEnabled) {
    const first = JSON.stringify(
      variant.educationStructure === 'curriculum'
        ? parsed.curriculumSessions[0]
        : parsed.scheduleDetails[0]
    )
    expect(first).toContain('교육 연수')
  }
  if (variant.emptySurvey) {
    expect(parsed.surveyKeys).toEqual([])
  } else {
    expect(Array.isArray(parsed.surveyKeys)).toBe(true)
  }
  const text = JSON.stringify(parsed.rec)
  expect(text).toContain(titles.mainTitle)
  expect(text).not.toContain('blob:')
  expect(text).not.toContain('$d')
  createBodyHasNoApplication(parsed.rec)
}

export function assertFormVersionSplit(log: IsolatedNetworkLog) {
  expect(log.formVersionPuts.length).toBeGreaterThanOrEqual(2)
  expect(log.formVersionPublishes.length).toBeGreaterThan(0)
  const overlays = log.formVersionPuts.map(item => overlayFromFormVersionPut(item.body))
  const recruitOverlay = overlays.find(
    overlay =>
      overlay['recruit.maxClassCount'] != null ||
      overlay['trainedTeachersRecruit.detailInfo.programDescription'] != null
  )
  const applicationOverlay = overlays.find(
    overlay => overlay['application.trainedTeachers.preferredSchedules'] != null
  )
  expect(recruitOverlay, '모집 Form Version overlay').toBeTruthy()
  expect(applicationOverlay, '신청 Form Version overlay').toBeTruthy()
  expect(JSON.stringify(recruitOverlay)).not.toContain('application.trainedTeachers')
  expect(JSON.stringify(applicationOverlay)).not.toContain('trainedTeachersRecruit')
  expect(JSON.stringify(applicationOverlay)).not.toContain('$d')
  expect(JSON.stringify(applicationOverlay)).not.toContain('blob:')
  const schemas = log.formVersionPuts.map(item => schemaFromFormVersionPut(item.body))
  const applicationSchema = schemas.find(schema =>
    JSON.stringify(schema).includes('program-application-trained-teachers-seed-basic-info')
  )
  if (applicationSchema) {
    expect(JSON.stringify(applicationSchema)).toContain(
      'program-application-trained-teachers-seed-personal-info'
    )
    expect(JSON.stringify(applicationSchema)).toContain(
      'program-application-trained-teachers-seed-third-party'
    )
    expect(JSON.stringify(applicationSchema)).toContain(
      'program-application-trained-teachers-seed-preferred-schedule'
    )
  }
}

export function assertPutBeforePublish(log: IsolatedNetworkLog) {
  const firstPut = log.mutations.findIndex(
    item => item.method === 'PUT' && item.path.includes('/form-template-versions/')
  )
  const firstPublish = log.mutations.findIndex(
    item => item.method === 'POST' && item.path.endsWith('/publish')
  )
  expect(firstPut).toBeGreaterThanOrEqual(0)
  expect(firstPublish).toBeGreaterThan(firstPut)
}
