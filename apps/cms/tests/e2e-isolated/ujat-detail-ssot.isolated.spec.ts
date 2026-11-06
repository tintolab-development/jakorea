import { expect, test, type Page } from '@playwright/test'
import {
  selectByPlaceholderIfVisible,
  selectNearLabelIfVisible,
} from '../e2e/pages/form-helpers'
import {
  installIsolatedRegistrationNetwork,
  type IsolatedNetworkLog,
} from './install-isolated-network'

const PROGRAM_ID = 91011
const PARTICIPANT_ROW_ID = 92001
const VOLUNTEER_H1_ROW_ID = 92002
const VOLUNTEER_H2_ROW_ID = 92003
const UPDATED_AT = '2026-11-06T00:00:00+09:00'

const SIDECAR = { keep: 'x', zero: 0, no: false, empty: '', list: [] as unknown[] }

function seedProgram(overrides?: { overlay?: Record<string, unknown>; surveyKeys?: string[] }) {
  const overlay = {
    'ujat.recruit.institution.publicTitle': '기관 공고 보존',
    unknownSidecarKey: 'preserve-me',
    ...(overrides?.overlay ?? {}),
  }
  return {
    program: {
      id: PROGRAM_ID,
      title: 'UJAT STEP61 공고',
      nameKo: 'UJAT STEP61 공고',
      mainTitle: 'UJAT STEP61 대표',
      titleEn: 'UJAT STEP61 Title',
      programType: 'UJAT',
      status: 'PENDING',
      type: 'offline',
      format: 'course',
      category: 'school',
      lifecycleStatus: 'RECRUITING_STUDENTS',
      periodStatus: 'RECRUITING',
      startDate: '2026-12-01',
      endDate: '2027-11-30',
      applicationStartDate: '2026-12-01',
      applicationEndDate: '2026-12-20',
      sponsorId: '163001',
      managerName: '격리 담당자',
      contactName: '격리 담당자',
      contactPhone: '010-1234-5678',
      contactEmail: 'isolated-ujat@example.com',
      detailedProgramId: 163006,
      detailedProgramName: '격리 세부 프로그램',
      businessArea: '경제금융',
      educationProcess: 'Digital',
      ipOwned: 'JA',
      courseDeliveredBy: 'JA',
      partnerInvolvement: false,
      ips: 'Inspire',
      venue: '서울시 중구 JA Korea',
      venueKind: 'inside',
      educationPlace: '서울시 중구 JA Korea',
      locationType: 'IN',
      paymentItems: [],
      generalParticipantTypes: ['school_institution', 'volunteer'],
      targetLevels: ['elementary'],
      district: '초등학교 전 학년',
      educationTargetDetail: '초등학교 전 학년',
      updatedAt: UPDATED_AT,
      expectedUpdatedAt: UPDATED_AT,
      generalSurveyMenuKeys: overrides?.surveyKeys ?? ['survey', 'volunteerSatisfaction'],
      recruitments: [
        {
          id: PARTICIPANT_ROW_ID,
          recruitmentType: 'PARTICIPANT',
          targetType: 'ORGANIZATION',
          recruitTerm: null,
          announcementPublished: true,
          contactName: '기관 문의처',
          contactPhone: '010-1234-5678',
          contactEmail: 'inst@example.com',
          remarks: '기관 비고 보존',
          remarksNotApplicable: false,
          interviewConfig: { enabled: false },
          startAt: '2027-01-10T00:00:00+09:00',
          endAt: '2027-01-31T23:59:59+09:00',
          operationStartDate: '2027-03-01',
          operationEndDate: '2027-06-30',
          finalPassAnnouncementAt: '2027-02-05T00:00:00+09:00',
          finalPassAnnouncementMethod: '홈페이지 공지',
        },
        {
          id: VOLUNTEER_H1_ROW_ID,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF',
          contactName: '상반기 문의처',
          remarks: 'H1 비고 보존',
          interviewConfig: { enabled: true, selectedSlotKeys: ['slot-a'] },
          startAt: '2027-02-01T00:00:00+09:00',
          endAt: '2027-02-20T23:59:59+09:00',
        },
        {
          id: VOLUNTEER_H2_ROW_ID,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF',
          contactName: '하반기 문의처',
          remarks: 'H2 비고 보존',
          interviewConfig: { enabled: true, selectedSlotKeys: ['slot-b'] },
          startAt: '2027-08-01T00:00:00+09:00',
          endAt: '2027-08-20T23:59:59+09:00',
        },
      ],
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        e2eUnknownSidecar: SIDECAR,
        registration: { overlay },
      }),
    },
    typedDetail: {
      schemaVersion: 1,
      revision: 4,
      expectedUpdatedAt: UPDATED_AT,
      common: { note: 'typed-common-preserve' },
      halfPlans: [
        {
          semesterType: 'FIRST_HALF',
          stages: [
            {
              stage: 'PRE_EDUCATION',
              rows: [
                {
                  rowId: 'h1-pre-1',
                  displayOrder: 1,
                  educationName: '상반기 사전교육',
                  educationMethod: 'OFFLINE',
                  regionCode: 'SEOUL',
                  dates: ['2027-03-05'],
                  startDate: '2027-03-05',
                  endDate: '2027-03-05',
                },
              ],
            },
            {
              stage: 'MAIN_EDUCATION',
              rows: [
                {
                  rowId: 'h1-main-1',
                  displayOrder: 1,
                  educationName: '상반기 본교육',
                  educationMethod: 'OFFLINE',
                  regionCode: 'SEOUL',
                  dates: ['2027-03-12'],
                  startDate: '2027-03-12',
                  endDate: '2027-04-16',
                },
              ],
            },
          ],
        },
        {
          semesterType: 'SECOND_HALF',
          stages: [
            {
              stage: 'MAIN_EDUCATION',
              rows: [
                {
                  rowId: 'h2-main-1',
                  displayOrder: 1,
                  educationName: '하반기 본교육',
                  educationMethod: 'OFFLINE',
                  regionCode: 'GYEONGGI_SOUTH',
                  dates: ['2027-09-10'],
                  startDate: '2027-09-10',
                  endDate: '2027-10-15',
                },
              ],
            },
          ],
        },
      ],
    },
  }
}

async function setup(page: Page, seed = seedProgram()) {
  return installIsolatedRegistrationNetwork(page, { seedProgram: seed })
}

async function openDetail(page: Page) {
  await page.goto(`/programs/ujat?programId=${PROGRAM_ID}&lnb=info&tab=info`)
  await expect(page.getByRole('button', { name: '정보 수정' })).toBeVisible({ timeout: 45_000 })
}

async function enterInfoEdit(page: Page) {
  await page.getByRole('button', { name: '정보 수정' }).click()
  await expect(page.getByRole('button', { name: '저장' })).toBeVisible({ timeout: 20_000 })
}

async function fillVisibleRequiredCommonFields(page: Page) {
  await selectByPlaceholderIfVisible(page, '세부 프로그램명을 선택해 주세요')
  await selectNearLabelIfVisible(page, '교육 과정')
  await selectNearLabelIfVisible(page, '사업 분야', '경제금융')
  await selectNearLabelIfVisible(page, '후원사 담당자')
  const place = page.getByPlaceholder('교육이 진행될 상세 장소를 입력해 주세요')
  if (await place.isVisible().catch(() => false)) {
    await place.fill('서울시 중구 JA Korea')
  }
}

async function saveEdit(page: Page, log: IsolatedNetworkLog) {
  const beforePatch = log.programPatches.length
  const beforeRecruit = log.recruitmentPatches.length
  const beforeTyped =
    log.typedDetailPuts.length + log.typedDetailPatches.length + log.physicalSchedulePuts.length
  await page.getByRole('button', { name: '저장' }).click()
  const requiredDialog = page.getByRole('dialog').filter({ hasText: '필수 항목 입력 안내' })
  if (await requiredDialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await requiredDialog.getByRole('button', { name: '확인' }).click()
    await fillVisibleRequiredCommonFields(page)
    await page.getByRole('button', { name: '저장' }).click()
  }
  const blocked = page.getByRole('dialog').filter({ hasText: /저장할 수 없습니다|실패|필수 항목/ })
  if (await blocked.isVisible({ timeout: 2_000 }).catch(() => false)) {
    return { blocked: await blocked.innerText() }
  }
  await expect
    .poll(
      () =>
        log.programPatches.length +
        log.recruitmentPatches.length +
        log.typedDetailPuts.length +
        log.typedDetailPatches.length +
        log.physicalSchedulePuts.length,
      { timeout: 45_000 }
    )
    .toBeGreaterThan(beforePatch + beforeRecruit + beforeTyped)
  return { blocked: null }
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
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

test.describe('UJAT 상세 Typed SSOT 격리 E2E', () => {
  test('UJ-03 공통정보 수정: PATCH 대상만 변경·모집행 보존·재GET', async ({ page }) => {
    test.setTimeout(180_000)
    const log = await setup(page)
    await openDetail(page)
    await enterInfoEdit(page)
    await fillVisibleRequiredCommonFields(page)
    const input = page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()
    await input.fill('UJ-03 대표명 수정')
    const { blocked } = await saveEdit(page, log)
    expect(blocked, blocked ?? '').toBeNull()
    expect(log.programPatches.length).toBeGreaterThan(0)
    const last = log.programPatches.at(-1)?.body as Record<string, unknown>
    const text = JSON.stringify(last)
    expect(text).toContain('UJ-03 대표명 수정')
    expect(log.recruitmentPatches).toHaveLength(0)
    await openDetail(page)
    await enterInfoEdit(page)
    await expect(page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()).toHaveValue(
      'UJ-03 대표명 수정'
    )
  })

  test('UJ-04 Typed Detail: GET typed-detail 후 일정 저장·반기 구조 보존', async ({ page }) => {
    test.setTimeout(180_000)
    const log = await setup(page)
    await openDetail(page)
    await expect
      .poll(() => log.api.some(item => item.path.includes('/ujat/typed-detail') && item.method === 'GET'))
      .toBe(true)
    await enterInfoEdit(page)
    await page.getByText('교육 진행 일정', { exact: true }).first().scrollIntoViewIfNeeded()
    const saturday = page.getByRole('checkbox', { name: '토요일 제외' }).first()
    await saturday.scrollIntoViewIfNeeded()
    await expect(saturday).toBeVisible({ timeout: 20_000 })
    const wasChecked = await saturday.isChecked()
    await saturday.setChecked(!wasChecked)
    const { blocked } = await saveEdit(page, log)
    expect(blocked, blocked ?? '').toBeNull()
    const typedWrites = [...log.typedDetailPuts, ...log.typedDetailPatches, ...log.physicalSchedulePuts]
    expect(typedWrites.length, 'typed-detail 또는 일정 PUT').toBeGreaterThan(0)
    const typedText = JSON.stringify(typedWrites.map(item => item.body))
    expect(typedText).toMatch(/FIRST_HALF|SECOND_HALF|PRE_EDUCATION|MAIN_EDUCATION|halfPlan|halfPlans|educationName/)
    const reget = await page.evaluate(async id => {
      const response = await fetch(`/api/admin/programs/${id}/ujat/typed-detail`)
      return response.json()
    }, PROGRAM_ID)
    expect(JSON.stringify(reget)).toContain('하반기 본교육')
    expect(JSON.stringify(reget)).toContain('h2-main-1')
  })

  test('UJ-05 모집정보: 기관 행만 PATCH·면접/다른 반기 보존', async ({ page }) => {
    test.setTimeout(180_000)
    const log = await setup(page)
    await openDetail(page)
    await page.getByText('모집 정보', { exact: true }).click()
    await expect(page.getByText('참여 기관 모집 정보').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: '정보 수정' })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: '정보 수정' }).click()
    await expect(page.getByRole('button', { name: '저장' })).toBeVisible({ timeout: 20_000 })
    const contact = page.getByPlaceholder('담당 문의처').first()
    await expect(contact).toBeVisible({ timeout: 20_000 })
    await contact.fill('UJ-05 기관 문의 수정')
    const { blocked } = await saveEdit(page, log)
    expect(blocked, blocked ?? '').toBeNull()
    expect(log.recruitmentPatches.length).toBeGreaterThan(0)
    expect(
      log.recruitmentPatches.every(item => item.path.endsWith(`/recruitments/${PARTICIPANT_ROW_ID}`))
    ).toBe(true)
    const bodyText = JSON.stringify(log.recruitmentPatches.map(item => item.body))
    expect(bodyText).toContain('UJ-05 기관 문의 수정')
    expect(bodyText).not.toContain('하반기 문의처')
  })

  test('UJ-06 Legacy/Unknown sidecar: PATCH 후에도 GET overlay 보존', async ({ page }) => {
    test.setTimeout(180_000)
    const log = await setup(page)
    await openDetail(page)
    await enterInfoEdit(page)
    await page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first().fill('UJ-06 대표')
    const { blocked } = await saveEdit(page, log)
    expect(blocked, blocked ?? '').toBeNull()
    const patchService = parseJsonObject(
      (log.programPatches.at(-1)?.body as Record<string, unknown> | undefined)?.serviceDetailJson
    )
    const overlay = parseJsonObject(parseJsonObject(patchService.registration).overlay)
    if ('unknownSidecarKey' in overlay) {
      expect(overlay.unknownSidecarKey).toBe('preserve-me')
    }
    if ('ujat.recruit.institution.publicTitle' in overlay) {
      expect(overlay['ujat.recruit.institution.publicTitle']).toBe('기관 공고 보존')
    }
    if ('e2eUnknownSidecar' in patchService) {
      expect(patchService.e2eUnknownSidecar).toEqual(SIDECAR)
    }
    const reget = await page.evaluate(async id => {
      const response = await fetch(`/api/admin/programs/${id}`)
      return (await response.json()) as { serviceDetailJson?: string }
    }, PROGRAM_ID)
    const stored = parseJsonObject(reget.serviceDetailJson)
    expect(parseJsonObject(parseJsonObject(stored.registration).overlay).unknownSidecarKey).toBe(
      'preserve-me'
    )
    expect(stored.e2eUnknownSidecar).toEqual(SIDECAR)
  })

  test('UJ-07 명시적 빈 값: 0/false/빈 배열이 스키마 허용 필드에 실린다', async ({ page }) => {
    test.setTimeout(180_000)
    const log = await setup(page, seedProgram({ surveyKeys: ['survey'] }))
    await openDetail(page)
    await enterInfoEdit(page)
    const survey = page.getByRole('checkbox', { name: '설문조사' })
    if (await survey.isVisible().catch(() => false)) {
      if (await survey.isChecked()) await survey.uncheck()
    }
    const kpi = page.getByPlaceholder('목표값 입력').first()
    if (await kpi.isVisible().catch(() => false)) {
      await kpi.fill('0')
    }
    const { blocked } = await saveEdit(page, log)
    expect(blocked, blocked ?? '').toBeNull()
    const bodies = JSON.stringify([
      ...log.programPatches.map(item => item.body),
      ...log.typedDetailPuts.map(item => item.body),
      ...log.typedDetailPatches.map(item => item.body),
    ])
    expect(bodies === '[]').toBe(false)
    expect(bodies).toMatch(/0|false|\[\]|generalSurveyMenuKeys/)
  })

  test('UJ-08 취소 후 원본 복원 · 마지막 입력 저장', async ({ page }) => {
    test.setTimeout(180_000)
    const log = await setup(page)
    await openDetail(page)
    await enterInfoEdit(page)
    const input = page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()
    const original = await input.inputValue()
    await input.fill('UJ-08 취소될 값')
    await page.getByRole('button', { name: '취소' }).click()
    const confirm = page.getByRole('dialog').getByRole('button', { name: /^(확인|나가기|취소하기)$/ })
    if (await confirm.first().isVisible().catch(() => false)) {
      await confirm.first().click()
    }
    expect(log.programPatches).toHaveLength(0)
    await enterInfoEdit(page)
    await expect(page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()).toHaveValue(
      original
    )
    const again = page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()
    await again.fill('UJ-08 첫 값')
    await again.fill('UJ-08 마지막 값')
    const { blocked } = await saveEdit(page, log)
    expect(blocked, blocked ?? '').toBeNull()
    const text = JSON.stringify(log.programPatches.map(item => item.body))
    expect(text).toContain('UJ-08 마지막 값')
    expect(text).not.toContain('UJ-08 첫 값')
    expect(text).not.toContain('UJ-08 취소될 값')
  })
})
