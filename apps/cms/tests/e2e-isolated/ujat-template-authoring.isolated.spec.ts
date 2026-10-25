import { expect, test } from '@playwright/test'
import {
  closeTemplateEditor,
  openTemplateByName,
  FORM_MANAGEMENT_URL,
} from '../e2e/helpers/form-template-editor-helpers'
import {
  expectFormVersionPut,
  installUjatTemplateAuthoringNetwork,
  UJAT_TEMPLATE_AUTHORING_VERSION_IDS,
} from './ujat-template-authoring-network'

async function saveTemplate(page: Parameters<typeof openTemplateByName>[0]) {
  await page.getByRole('button', { name: '저장' }).click()
  const dialog = page.getByRole('dialog').filter({ hasText: '양식이 저장되었습니다' })
  await expect(dialog).toBeVisible({ timeout: 20_000 })
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(dialog).toBeHidden()
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

test.describe.configure({ mode: 'serial' })

test.describe('UJAT Template Authoring Typed 격리 Mock E2E', () => {
  test('기관 모집 — Legacy import → Typed 편집 → settingsJson PUT → GET 재진입', async ({
    page,
  }) => {
    const log = await installUjatTemplateAuthoringNetwork(page)
    await page.goto(FORM_MANAGEMENT_URL)

    await openTemplateByName(page, 'UJAT_참여 기관 모집 폼')
    const title = page.getByPlaceholder('공고용 프로그램명').first()
    await expect(title).toHaveValue('Legacy 기관 모집 제목')

    const editedTitle = '브라우저 기관 모집 제목'
    await title.fill(editedTitle)
    await saveTemplate(page)

    const body = await expectFormVersionPut(
      log,
      UJAT_TEMPLATE_AUTHORING_VERSION_IDS.school
    )
    const settings = parseJsonRecord(body.settingsJson)
    const typed = parseJsonRecord(settings.ujatRecruitment)
    const institution = parseJsonRecord(typed.institution)
    expect(institution.announcementTitle).toBe(editedTitle)
    expect(body.extensionJson).toBeUndefined()

    const schema = parseJsonRecord(body.schemaJson)
    expect(Array.isArray(schema.paragraphs)).toBe(true)
    expect((schema.paragraphs as unknown[]).length).toBeGreaterThanOrEqual(2)

    await closeTemplateEditor(page)
    await openTemplateByName(page, 'UJAT_참여 기관 모집 폼')
    await expect(page.getByPlaceholder('공고용 프로그램명').first()).toHaveValue(editedTitle)
    await closeTemplateEditor(page)

    expect(log.formVersionPuts).toHaveLength(1)
    expect(log.formVersionGets).toContain(UJAT_TEMPLATE_AUTHORING_VERSION_IDS.school)
    expect(log.recruitmentMutations).toEqual([])
  })

  test('봉사자 모집 — 면접 문단 진입·Typed 설정 저장·재진입', async ({ page }) => {
    const log = await installUjatTemplateAuthoringNetwork(page)
    await page.goto(FORM_MANAGEMENT_URL)

    await openTemplateByName(page, 'UJAT_봉사자 모집 폼')
    const title = page.getByPlaceholder('공고용 프로그램명').first()
    await expect(title).toHaveValue('Legacy 봉사자 모집 제목')

    const editedTitle = '브라우저 봉사자 모집 제목'
    await title.fill(editedTitle)
    await expect(page.getByText('면접 진행 가능 일정').last()).toBeVisible()
    await page.locator('.volunteer-interview-available-schedule .paragraph-time-picker__trigger').first().click()
    await page.getByRole('dialog', { name: '시간 설정' }).getByRole('button', { name: '설정' }).click()

    await saveTemplate(page)

    const body = await expectFormVersionPut(
      log,
      UJAT_TEMPLATE_AUTHORING_VERSION_IDS.volunteer
    )
    const settings = parseJsonRecord(body.settingsJson)
    const typed = parseJsonRecord(settings.ujatRecruitment)
    const volunteer = parseJsonRecord(typed.volunteerH2 ?? typed.volunteerH1)
    expect(volunteer.announcementTitle).toBe(editedTitle)
    const interview = parseJsonRecord(typed.interviewH1 ?? typed.interviewH2)
    expect(interview.interviewTimeRange).toEqual(
      expect.arrayContaining([expect.any(String), expect.any(String)])
    )
    expect(body.extensionJson).toBeUndefined()

    await closeTemplateEditor(page)
    await openTemplateByName(page, 'UJAT_봉사자 모집 폼')
    await expect(page.getByPlaceholder('공고용 프로그램명').first()).toHaveValue(editedTitle)
    await expect(page.getByText('면접 진행 가능 일정').last()).toBeVisible()
    await expect(
      page.locator('.volunteer-interview-available-schedule .paragraph-time-picker__trigger').first()
    ).not.toContainText('시간을 선택해 주세요')
    await closeTemplateEditor(page)

    expect(log.formVersionPuts).toHaveLength(1)
    expect(log.formVersionGets).toContain(UJAT_TEMPLATE_AUTHORING_VERSION_IDS.volunteer)
    expect(log.recruitmentMutations).toEqual([])
  })
})
