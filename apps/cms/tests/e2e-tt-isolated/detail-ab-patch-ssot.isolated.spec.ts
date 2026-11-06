import { expect, test, type Page } from '@playwright/test'
import {
  assertIsolatedNetwork,
  installTtIsolatedNetwork,
  TT_ISOLATED_IDS,
  type IsolatedNetworkLog,
  type IsolatedTtSeed,
} from './install-tt-isolated-network'

const PROGRAM_ID = TT_ISOLATED_IDS.PROGRAM_ID

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

function aEnvelope(log: IsolatedNetworkLog) {
  const last = log.programPatches.at(-1)
  return parseJsonObject(parseJsonObject(last?.body).serviceDetailJson)
}

function bBody(log: IsolatedNetworkLog) {
  return parseJsonObject(log.infoDetailPatches.at(-1)?.body)
}

function bConfig(log: IsolatedNetworkLog) {
  return parseJsonObject(bBody(log).configJson)
}

function seedCurriculum(options?: {
  overlayOnly?: boolean
  surveyKeys?: string[]
  educationStructure?: 'CURRICULUM' | 'SCHEDULE'
}): IsolatedTtSeed {
  const educationStructure = options?.educationStructure ?? 'CURRICULUM'
  const overlay: Record<string, unknown> = {
    'application.institution.teacherTel': '02-111-1111',
    unknownSidecarKey: 'preserve-me',
  }
  if (options?.overlayOnly) {
    overlay['trainedTeachersRegistration.basicInfo.programTitleKo'] = '레거시 대표명'
    overlay['trainedTeachersRegistration.basicInfo.publicProgramTitle'] = '레거시 공고명'
  }
  const surveyKeys = options?.surveyKeys ?? ['survey', 'satisfaction']
  const programPartial = {
    generalProgramSessionRound: 'multi',
    ...(options?.overlayOnly ? {} : { generalSurveyMenuKeys: surveyKeys }),
    generalCommonInfo: {
      announcementTitle: 'TT STEP50 공고',
      ...(options?.overlayOnly
        ? {}
        : {
            participantRecruitmentInfo: {
              announcementPublished: true,
              inquiryTel: '02-000-0000',
              remarks: '모집 비고 보존',
              maxClassCount: 4,
              contactOrganizationName: '문의기관',
            },
          }),
      kpi: {
        finalParticipants: 30,
        instructorCount: 0,
        volunteerCount: 0,
        finalSchools: 2,
        finalClasses: 3,
      },
    },
  }
  return {
    program: {
      id: PROGRAM_ID,
      title: options?.overlayOnly ? '레거시 공고명' : 'TT STEP50 공고',
      mainTitle: options?.overlayOnly ? '레거시 대표명' : 'TT STEP50 대표',
      titleEn: 'TT STEP50 Title',
      programType: 'TRAINED_TEACHER',
      educationStructure,
      status: 'PENDING',
      lifecycleStatus: 'RECRUITING_STUDENTS',
      periodStatus: 'RECRUITING',
      startDate: '2026-12-01',
      endDate: '2027-11-30',
      applicationStartDate: '2026-12-01',
      applicationEndDate: '2026-12-20',
      sponsorId: 163001,
      textbookName: '격리 교재',
      detailedProgramId: 163006,
      detailedProgramName: '격리 세부 프로그램',
      businessArea: '진로취업',
      educationProcess: 'Digital',
      ipOwned: 'JA',
      courseDeliveredBy: 'JA',
      partnerInvolvement: false,
      totalParticipants: 30,
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        ...(options?.overlayOnly ? {} : { generalSurveyMenuKeys: surveyKeys }),
        program: programPartial,
        registration: { overlay },
      }),
    },
    infoDetail: {
      teacherTrainingEnabled: false,
      educationJournalEnabled: true,
      teacherTrainingScheduleName: '',
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          teacherTrainingEnabled: false,
          educationJournalEnabled: true,
          educationScheduleMode: 'date',
          educationScheduleLines: ['2026.12.10(목)'],
          curriculumSessions: [
            { sessionLabel: '1회차', title: '1차시', description: '내용1' },
            { sessionLabel: '2회차', title: '2차시', description: '내용2' },
          ],
          scheduleDetails: [
            {
              scheduleLabel: '사전 교육',
              name: '사전교육',
              blockKind: 'preEducation',
            },
            {
              scheduleLabel: '세부 일정 01',
              name: '본일정',
              blockKind: 'event',
            },
          ],
        },
      }),
    },
  }
}

async function openDetail(page: Page) {
  await page.goto(`/programs/trained-teachers?programId=${PROGRAM_ID}`)
  await expect(page.getByRole('button', { name: '정보 수정' })).toBeVisible({ timeout: 45_000 })
}

async function enterEdit(page: Page) {
  await page.getByRole('button', { name: '정보 수정' }).click()
  await expect(page.getByRole('button', { name: '저장' })).toBeVisible({ timeout: 20_000 })
}

async function saveEdit(page: Page) {
  await page.getByRole('button', { name: '저장' }).click()
  const confirm = page.getByRole('dialog').filter({ hasText: '입력 확인' })
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.getByRole('button', { name: '확인' }).click()
  }
  const network = page.getByRole('dialog').filter({ hasText: '네트워크 오류' })
  if (await network.isVisible().catch(() => false)) {
    await network.getByRole('button', { name: '확인' }).click()
  }
}

test.describe('TT STEP 5.0 상세 A/B PATCH SSOT', () => {
  test('TT-01 공통정보 단독 수정은 A PATCH 하고 모집·연수 nested 를 보존한다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, { seed: seedCurriculum() })
    await openDetail(page)
    await enterEdit(page)
    await page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first().fill('TT-01 수정 대표')
    await saveEdit(page)
    await expect.poll(() => log.programPatches.length, { timeout: 40_000 }).toBeGreaterThan(0)
    const envelope = aEnvelope(log)
    const common = parseJsonObject(parseJsonObject(envelope.program).generalCommonInfo)
    expect(JSON.stringify(log.programPatches.at(-1)?.body)).toContain('TT-01 수정 대표')
    expect(common.curriculumSessions).toBeUndefined()
    expect(common.teacherTrainingEnabled).toBeUndefined()
    expect(parseJsonObject(common.participantRecruitmentInfo).remarks).toBe('모집 비고 보존')
    if (log.infoDetailPatches.length > 0) {
      expect(bBody(log).teacherTrainingEnabled).toBe(false)
      expect(JSON.stringify(bConfig(log).generalCommonInfo)).toContain('1회차')
    }
    await page.goto(`/programs/trained-teachers?programId=${PROGRAM_ID}`)
    await expect(page.getByText('TT-01 수정 대표').first()).toBeVisible({ timeout: 20_000 })
    assertIsolatedNetwork(log)
  })

  test('TT-02 교육 연수·교육일지 변경은 B PATCH 하고 A 모집정보를 유지한다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, { seed: seedCurriculum() })
    await openDetail(page)
    await enterEdit(page)
    const journalNone = page.getByRole('radio', { name: '없음' }).first()
    await journalNone.click()
    const training = page.getByRole('checkbox', { name: /교육 연수/ }).first()
    if ((await training.count()) > 0) {
      await training.click()
    }
    await saveEdit(page)
    await expect.poll(() => log.infoDetailPatches.length, { timeout: 40_000 }).toBeGreaterThan(0)
    expect(bBody(log).educationJournalEnabled).toBe(false)
    const aCommon = parseJsonObject(parseJsonObject(aEnvelope(log).program).generalCommonInfo)
    expect(parseJsonObject(aCommon.participantRecruitmentInfo).remarks).toBe('모집 비고 보존')
    assertIsolatedNetwork(log)
  })

  test('TT-03 회차(sessionLabel)와 차시(title)를 유지하고 비활성 일정은 [] 로 보낸다', async ({
    page,
  }) => {
    const log = await installTtIsolatedNetwork(page, { seed: seedCurriculum() })
    await openDetail(page)
    await enterEdit(page)
    await page.getByPlaceholder('교육 내용을 작성하세요').first().fill('TT-03 수정 내용')
    await saveEdit(page)
    await expect.poll(() => log.infoDetailPatches.length, { timeout: 40_000 }).toBeGreaterThan(0)
    const configCommon = parseJsonObject(bConfig(log).generalCommonInfo)
    expect(JSON.stringify(configCommon.curriculumSessions)).toContain('TT-03 수정 내용')
    expect(JSON.stringify(configCommon.curriculumSessions)).toContain('1회차')
    expect(JSON.stringify(configCommon.curriculumSessions)).toContain('2회차')
    expect(configCommon.scheduleDetails).toEqual([])
    expect(
      parseJsonObject(parseJsonObject(aEnvelope(log).program).generalCommonInfo).curriculumSessions
    ).toBeUndefined()
    assertIsolatedNetwork(log)
  })

  test('TT-04 설문 전체 해제는 generalSurveyMenuKeys [] 를 보낸다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, { seed: seedCurriculum() })
    await openDetail(page)
    await enterEdit(page)
    for (const name of ['설문조사', '만족도조사', '강의평가']) {
      const box = page.getByRole('checkbox', { name })
      if ((await box.count()) > 0 && (await box.isChecked())) {
        await box.click()
      }
    }
    await saveEdit(page)
    await expect.poll(() => log.programPatches.length, { timeout: 40_000 }).toBeGreaterThan(0)
    expect(aEnvelope(log).generalSurveyMenuKeys).toEqual([])
    const aCommon = parseJsonObject(parseJsonObject(aEnvelope(log).program).generalCommonInfo)
    expect(parseJsonObject(aCommon.participantRecruitmentInfo).remarks).toBe('모집 비고 보존')
    assertIsolatedNetwork(log)
  })

  test('TT-05 Legacy overlay-only GET 은 sidecar 를 PATCH 에 남긴다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, {
      seed: seedCurriculum({ overlayOnly: true }),
    })
    await openDetail(page)
    await enterEdit(page)
    const main = page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()
    await main.fill('TT-05 레거시 이후 대표')
    await saveEdit(page)
    await expect.poll(() => log.programPatches.length, { timeout: 40_000 }).toBeGreaterThan(0)
    const overlay = parseJsonObject(
      parseJsonObject(aEnvelope(log).registration).overlay
    )
    expect(overlay.unknownSidecarKey).toBe('preserve-me')
    expect(overlay['application.institution.teacherTel']).toBe('02-111-1111')
    assertIsolatedNetwork(log)
  })

  test('TT-06 취소는 원본을 복원하고 마지막 입력이 PATCH 에 실린다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page, { seed: seedCurriculum() })
    await openDetail(page)
    await enterEdit(page)
    await page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first().fill('취소될 대표명')
    await page.getByRole('button', { name: '취소' }).click()
    await expect(page.getByText('취소될 대표명')).toHaveCount(0)
    await expect(page.getByText('TT STEP50 대표').first()).toBeVisible()
    await enterEdit(page)
    await page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first().fill('TT-06 마지막 입력')
    await saveEdit(page)
    await expect.poll(() => log.programPatches.length, { timeout: 40_000 }).toBeGreaterThan(0)
    expect(JSON.stringify(log.programPatches.at(-1)?.body)).toContain('TT-06 마지막 입력')
    expect(JSON.stringify(log.programPatches.at(-1)?.body)).not.toContain('취소될 대표명')
    assertIsolatedNetwork(log)
  })
})
