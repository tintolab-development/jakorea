import { expect, test } from '@playwright/test'
import {
  GeneralProgramRegistrationPage,
  REGISTRATION_CASES,
} from '../e2e/pages/general-program-registration.page'
import {
  ISOLATED_GENERAL_FIXTURE,
  assertIsolatedNetwork,
  installIsolatedRegistrationNetwork,
  type IsolatedNetworkLog,
} from './install-isolated-network'

const ORG_CURRICULUM_SINGLE = REGISTRATION_CASES.find(
  row =>
    row.audience === 'organization' && row.structure === 'curriculum' && row.session === 'single'
)
const INDIVIDUAL_SCHEDULE_SINGLE = REGISTRATION_CASES.find(
  row => row.audience === 'individual' && row.structure === 'schedule' && row.session === 'single'
)

function createTitleFromBody(body: unknown): string {
  if (body == null || typeof body !== 'object') return ''
  const title = (body as { title?: unknown }).title
  return typeof title === 'string' ? title : ''
}

function overlayFromFormVersionPut(body: unknown): Record<string, unknown> {
  if (body == null || typeof body !== 'object') return {}
  const extensionJson = (body as { extensionJson?: unknown }).extensionJson
  if (typeof extensionJson !== 'string' || extensionJson.trim() === '') return {}
  try {
    const parsed = JSON.parse(extensionJson) as { overlay?: Record<string, unknown> }
    return parsed.overlay ?? {}
  } catch {
    return {}
  }
}

async function expectWizardOpen(page: import('@playwright/test').Page) {
  await expect(page).toHaveURL(/\/programs\/general\?.*new=1/, { timeout: 30_000 })
  // 「기본 정보」 단락 제목은 텍스트 노드 매칭이 안정적이지 않아(리치 텍스트 렌더) 대표 입력란으로 확인한다.
  await expect(page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()).toBeVisible({
    timeout: 30_000,
  })
}

async function runRepresentativeCase(
  page: import('@playwright/test').Page,
  log: IsolatedNetworkLog,
  audience: 'organization' | 'individual'
) {
  const regCase = audience === 'organization' ? ORG_CURRICULUM_SINGLE : INDIVIDUAL_SCHEDULE_SINGLE
  if (regCase == null) throw new Error('등록 케이스를 찾지 못했습니다')

  const registration = new GeneralProgramRegistrationPage(page, regCase, {
    skipOptionalUploads: true,
    safeWagePaymentItems: true,
    programTitle: `격리RHF-${regCase.label}-${Date.now()}`,
    detailedProgramLabel: ISOLATED_GENERAL_FIXTURE.detailedProgramName,
    sponsorLabel: ISOLATED_GENERAL_FIXTURE.sponsorName,
    sponsorManagerLabel: ISOLATED_GENERAL_FIXTURE.contactName,
    paymentItemLabel: ISOLATED_GENERAL_FIXTURE.paymentItemName,
  })
  await registration.openNewRegistration()
  await expectWizardOpen(page)
  await registration.fillCommonInfo()
  console.log('[AUDIT common]', JSON.stringify(await registration.auditEmptyVisibleFields()))
  await registration.goToRecruitment()
  await registration.fillRecruitmentInfo()
  for (const tab of ['참여 기관 모집 정보', '참여자 모집 정보', '강사 모집 정보', '봉사자 모집 정보']) {
    const t = page.getByRole('tab', { name: tab }).or(page.getByText(tab, { exact: true })).first()
    if ((await t.count()) === 0) continue
    await t.click()
    await page.waitForTimeout(500)
    console.log(`[AUDIT recruit ${tab}]`, JSON.stringify(await registration.auditEmptyVisibleFields()))
  }
  if (audience === 'organization') {
    expect(await registration.assertRecruitTabRoundTripStrict(), '모집 탭 왕복').toBeGreaterThanOrEqual(6)
  }
  await registration.goToApplication()
  await registration.fillApplicationInfo()
  await registration.completeRegistration()
  assertIsolatedNetwork(log)
  expect(log.createProgram, 'Program CREATE가 캡처되어야 합니다').not.toBeNull()
  const capturedTitle = createTitleFromBody(log.createProgram?.body)
  expect(capturedTitle).toContain(registration.programTitle)
  const createText = JSON.stringify(log.createProgram?.body ?? {})
  expect(createText).not.toContain('application.')
  expect(createText).not.toContain('blob:')
  // 화면에서 클릭한 세부 프로그램·후원사·담당자가 CREATE Body에 직렬화되는지
  console.log('[STEP41] CREATE body', audience, createText.slice(0, 4000))
  expect(createText).toContain(ISOLATED_GENERAL_FIXTURE.sponsorId)
  expect(createText).toContain(ISOLATED_GENERAL_FIXTURE.contactId)
  expect(createText).not.toContain('__sponsor_contact_unselected__')
  // 일정형은 세부 프로그램이 「해당없음」으로 잠긴다(basic-info-paragraph-title-fields.tsx:63-68). 커리큘럼형만 선택 id를 단언한다.
  const isScheduleStructure = createText.includes('\\"generalProgramEducationStructure\\":\\"schedule\\"') ||
    createText.includes('"generalProgramEducationStructure":"schedule"')
  if (isScheduleStructure) {
    expect(createText).toContain('__detailed_program_none__')
  } else {
    expect(
      createText.includes(ISOLATED_GENERAL_FIXTURE.detailedProgramId) ||
        createText.includes(ISOLATED_GENERAL_FIXTURE.detailedProgramName)
    ).toBe(true)
  }
  // 역할별 모집 대상: 직렬화 값과 역할 간 비혼입(PHASE 3), 강사 기본값 「성인」 저장(FIX_VERIFIED 대상)
  const createBody = (log.createProgram?.body ?? {}) as Record<string, unknown>
  const sdjRaw = createBody.serviceDetailJson
  const sdj = (typeof sdjRaw === 'string' ? JSON.parse(sdjRaw) : sdjRaw ?? {}) as Record<string, any>
  const sdjOverlay = JSON.stringify(sdj)
  const recruitments = (createBody.recruitments ?? []) as Array<Record<string, unknown>>
  const findDeep = (obj: unknown, key: string): unknown => {
    if (obj == null || typeof obj !== 'object') return undefined
    if (key in (obj as Record<string, unknown>)) return (obj as Record<string, unknown>)[key]
    for (const v of Object.values(obj as Record<string, unknown>)) {
      const hit = findDeep(v, key)
      if (hit !== undefined) return hit
    }
    return undefined
  }
  if (recruitments.some(r => r.recruitmentType === 'INSTRUCTOR')) {
    expect(findDeep(sdj, 'recruit.instructor.recruitTargets'), '강사 모집 대상 overlay').toEqual(['adult'])
    expect(
      (findDeep(sdj, 'instructorRecruitmentInfo') as Record<string, unknown> | undefined)?.recruitmentTarget,
      '강사 모집 대상 라벨'
    ).toBe('성인')
  }
  if (recruitments.some(r => r.recruitmentType === 'VOLUNTEER')) {
    expect(findDeep(sdj, 'recruit.volunteer.volunteerTargets'), '봉사자 모집 대상').toEqual(['university'])
  }
  if (audience === 'organization') {
    expect(createBody.targetLevels, '기관 교육 대상').toEqual(['high'])
  }
  console.log('[STEP41] role targets', JSON.stringify({
    targetLevels: createBody.targetLevels,
    instructor: findDeep(sdj, 'recruit.instructor.recruitTargets'),
    volunteer: findDeep(sdj, 'recruit.volunteer.volunteerTargets'),
    recruitments: recruitments.map(r => `${r.recruitmentType}/${r.targetType}`),
    sdjBytes: sdjOverlay.length,
  }))
  // P2(방안 C): 양식 PUT/binding은 CREATE 이후에 나간다.
  await expect
    .poll(() => log.formVersionPuts.length + log.formBindings.length, { timeout: 30_000 })
    .toBeGreaterThan(0)
  expect(log.programDraftRequests).toHaveLength(0)
  if (process.env.STEP41_DUMP) {
    // 증거 덤프(환경변수로만 동작): CREATE 전체 Body + 양식 PUT/바인딩
    const fs = await import('node:fs')
    fs.writeFileSync(
      `${process.env.STEP41_DUMP}-${audience}.json`,
      JSON.stringify({ create: log.createProgram, formVersionPuts: log.formVersionPuts, formBindings: log.formBindings, api: log.api }, null, 1)
    )
  }
  return { registration, capturedTitle }
}

test.describe.configure({ mode: 'serial' })

test.describe('일반 신규 등록 RHF 격리 Mock E2E', () => {
  test('외부 origin과 예상하지 못한 API는 차단되고 실제 네트워크 mutation은 0이다', async ({
    page,
  }) => {
    const log = await installIsolatedRegistrationNetwork(page)
    await page.goto('/programs/general')
    await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 45_000 })

    const externalBlocked = await page.evaluate(async () => {
      try {
        await fetch('https://example.com/', { method: 'GET' })
        return false
      } catch {
        return true
      }
    })
    expect(externalBlocked).toBe(true)

    const unexpectedBlocked = await page.evaluate(async () => {
      try {
        await fetch('/api/admin/definitely-not-mocked', {
          method: 'DELETE',
        })
        return false
      } catch {
        return true
      }
    })
    expect(unexpectedBlocked).toBe(true)
    expect(log.unexpected.some(item => item.includes('definitely-not-mocked'))).toBe(true)
    expect(log.blockedExternal.length).toBeGreaterThan(0)
    expect(log.createProgram).toBeNull()
    expect(log.mutations.filter(item => item.path === '/api/admin/programs')).toHaveLength(0)
  })

  test('기관 커리큘럼 단일: 화면 입력과 CREATE·Form Version 캡처가 일치한다', async ({ page }) => {
    const log = await installIsolatedRegistrationNetwork(page)
    await page.goto('/programs/general')
    await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 45_000 })
    const result = await runRepresentativeCase(page, log, 'organization')
    const overlays = log.formVersionPuts.map(item => overlayFromFormVersionPut(item.body))
    const hasInstitutionTel = overlays.some(
      overlay => overlay['application.institution.teacherTel'] != null
    )
    const hasInstitutionScheduleOnIndividual = overlays.some(
      overlay => overlay['application.institution.fixedScheduleSelected'] != null
    )
    if (log.formVersionPuts.length > 0) {
      expect(hasInstitutionScheduleOnIndividual).toBe(false)
    }
    expect(result.capturedTitle.length).toBeGreaterThan(0)
    if (hasInstitutionTel) {
      expect(
        typeof overlays.find(overlay => overlay['application.institution.teacherTel'])?.[
          'application.institution.teacherTel'
        ]
      ).toBe('string')
    }
  })

  test('개인 일정 단일: 개인 일정 키가 기관 키와 섞이지 않는다', async ({ page }) => {
    const log = await installIsolatedRegistrationNetwork(page)
    await page.goto('/programs/general')
    await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 45_000 })
    await runRepresentativeCase(page, log, 'individual')
    const overlays = log.formVersionPuts.map(item => overlayFromFormVersionPut(item.body))
    for (const overlay of overlays) {
      if (overlay['application.individual.fixedScheduleSelected'] != null) {
        expect(overlay['application.institution.fixedScheduleSelected']).toBeUndefined()
      }
    }
  })
})
