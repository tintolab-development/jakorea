import { expect, type Browser, type Page } from '@playwright/test'
import { test } from '../../fixtures/test'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'
import {
  GeneralProgramRegistrationPage,
  type RegistrationCase,
} from '../../pages/general-program-registration.page'
import {
  activateCmsProgramRecruitmentsForIntegration,
  fetchCmsProgramSnapshot,
  recruitmentForType,
  runPlatformApplication,
  type CmsProgramSnapshot,
  type PlatformAccount,
  type PortalApplicationType,
} from '../../pages/platform-application-flow.page'

test.describe.configure({ mode: 'serial' })

const ORGANIZATION_ACCOUNT: PlatformAccount = {
  // general2@test.com은 학교 FK만 있고 활성 기관 멤버십이 없어
  // 백엔드 application-options에서 ORGANIZATION_MEMBERSHIP_REQUIRED가 된다.
  // 실제 기관 신청이 가능한 테스트 계정은 활성 재직 기관이 연결된 teacher@test.com이다.
  email: 'teacher@test.com',
  applicationType: 'ORGANIZATION',
  mypagePath: '/mypage/education',
}

const INSTRUCTOR_ACCOUNT: PlatformAccount = {
  email: 'general.instructor@test.com',
  applicationType: 'INSTRUCTOR',
  mypagePath: '/mypage/lectures',
}

const VOLUNTEER_ACCOUNT: PlatformAccount = {
  email: 'volunteer@test.com',
  applicationType: 'VOLUNTEER',
  mypagePath: '/mypage/volunteer',
}

function uniqueIntegrationTitle(session: 'SINGLE' | 'MULTI') {
  const now = new Date()
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  const random = Math.random().toString(36).slice(2, 8)
  return `E2E-기관강사봉사자-신청검증-${session}-${timestamp}-${random}`
}

async function createProgram(
  page: Page,
  regCase: RegistrationCase,
  session: 'SINGLE' | 'MULTI'
): Promise<CmsProgramSnapshot> {
  await page.goto('/programs/general')
  await expectAuthenticatedShell(page)

  const registration = new GeneralProgramRegistrationPage(page, regCase, {
    openRecruitment: true,
    devAutofillCaseId: session === 'SINGLE' ? 4 : 5,
    safeWagePaymentItems: true,
    skipOptionalUploads: true,
    skipApplicationFormEdits: true,
    ensureFutureDates: true,
    programTitle: uniqueIntegrationTitle(session),
  })
  await registration.openNewRegistration()
  await registration.fillCommonInfo()
  await registration.goToRecruitment()
  await registration.fillRecruitmentInfo()
  await registration.goToApplication()
  await registration.fillApplicationInfo()

  const created = await registration.completeRegistration()
  expect(created.programId).toMatch(/^\d+$/)
  expect(created.programTitle).toContain(`E2E-기관강사봉사자-신청검증-${session}-`)

  const snapshot = await fetchCmsProgramSnapshot(page, created.programId)
  expect(snapshot.programId).toBe(Number(created.programId))
  expect(snapshot.programType).toBe('GENERAL_ORGANIZATION')
  expect(snapshot.title).toBe(created.programTitle)
  expect(snapshot.recruitments).toHaveLength(3)

  const expectedTypes: readonly [PortalApplicationType, string][] = [
    ['ORGANIZATION', 'PARTICIPANT'],
    ['INSTRUCTOR', 'INSTRUCTOR'],
    ['VOLUNTEER', 'VOLUNTEER'],
  ]
  for (const [applicationType, recruitmentType] of expectedTypes) {
    const recruitment = recruitmentForType(snapshot, applicationType)
    expect(recruitment.recruitmentType).toBe(recruitmentType)
    expect(recruitment.applicationType).toBe(applicationType)
    expect(recruitment.formBindingId).toBeGreaterThan(0)
  }

  await activateCmsProgramRecruitmentsForIntegration(page, snapshot)

  return snapshot
}

async function submitAsRole(
  browser: Browser,
  platformBaseUrl: string,
  password: string,
  program: CmsProgramSnapshot,
  account: PlatformAccount,
  scheduleIndex = 0
) {
  const context = await browser.newContext({ baseURL: platformBaseUrl })
  try {
    return await runPlatformApplication(
      context,
      platformBaseUrl,
      password,
      program,
      account,
      recruitmentForType(program, account.applicationType),
      scheduleIndex
    )
  } finally {
    await context.close()
  }
}

async function assertPlatformAvailable(browser: Browser, platformBaseUrl: string) {
  const context = await browser.newContext({ baseURL: platformBaseUrl })
  try {
    const response = await context.request.get('/')
    if (!response.ok()) {
      throw new Error(
        `PLATFORM_BASE_URL에 연결할 수 없습니다: HTTP ${response.status()} (${platformBaseUrl})`
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('PLATFORM_BASE_URL')) throw error
    throw new Error(`PLATFORM_BASE_URL에 연결할 수 없습니다: ${platformBaseUrl}`, { cause: error })
  } finally {
    await context.close()
  }
}

test('CMS 생성 프로그램을 Platform 역할별로 신청하고 모집 매핑을 검증한다', async ({
  page,
  browser,
}) => {
  test.setTimeout(1_200_000)

  const platformBaseUrl = process.env.PLATFORM_BASE_URL?.trim()
  const password = process.env.E2E_PLATFORM_PASSWORD?.trim()
  if (!platformBaseUrl) throw new Error('PLATFORM_BASE_URL 환경변수가 필요합니다.')
  if (!password) throw new Error('E2E_PLATFORM_PASSWORD 환경변수가 필요합니다.')
  await assertPlatformAvailable(browser, platformBaseUrl)

  const single = await createProgram(
    page,
    {
      audience: 'organization',
      structure: 'schedule',
      session: 'single',
      label: '통합_일정형_단일',
    },
    'SINGLE'
  )

  // 단일 회차: 기관 신청 없이 강사·봉사자 신청 → 기관 신청.
  const singleInstructor = await submitAsRole(
    browser,
    platformBaseUrl,
    password,
    single,
    INSTRUCTOR_ACCOUNT
  )
  const singleVolunteer = await submitAsRole(
    browser,
    platformBaseUrl,
    password,
    single,
    VOLUNTEER_ACCOUNT
  )
  const singleOrganization = await submitAsRole(
    browser,
    platformBaseUrl,
    password,
    single,
    ORGANIZATION_ACCOUNT
  )
  expect(singleInstructor.applicationType).toBe('INSTRUCTOR')
  expect(singleVolunteer.applicationType).toBe('VOLUNTEER')
  expect(singleOrganization.applicationType).toBe('ORGANIZATION')

  const multi = await createProgram(
    page,
    {
      audience: 'organization',
      structure: 'schedule',
      session: 'multi',
      label: '통합_일정형_복수',
    },
    'MULTI'
  )

  // 복수 회차: 기관 신청(일정 배정 없음) → 강사·봉사자 신청.
  const multiOrganization = await submitAsRole(
    browser,
    platformBaseUrl,
    password,
    multi,
    ORGANIZATION_ACCOUNT
  )
  const multiInstructor = await submitAsRole(
    browser,
    platformBaseUrl,
    password,
    multi,
    INSTRUCTOR_ACCOUNT,
    0
  )
  const multiVolunteer = await submitAsRole(
    browser,
    platformBaseUrl,
    password,
    multi,
    VOLUNTEER_ACCOUNT,
    1
  )

  expect(multiOrganization.applicationType).toBe('ORGANIZATION')
  expect(multiInstructor.applicationType).toBe('INSTRUCTOR')
  expect(multiVolunteer.applicationType).toBe('VOLUNTEER')
  expect(multiInstructor.scheduleTokens.length).toBeGreaterThan(0)
  expect(multiVolunteer.scheduleTokens.length).toBeGreaterThan(0)
  expect(multiVolunteer.activityScheduleTokens.length).toBeGreaterThan(0)
  expect(
    multiInstructor.scheduleTokens[0],
    `복수 회차 일정 매핑이 분리되지 않았습니다. programId=${multi.programId} ` +
      `instructor=${JSON.stringify(multiInstructor.scheduleTokens)} ` +
      `volunteerActivity=${JSON.stringify(multiVolunteer.activityScheduleTokens)}`
  ).not.toBe(multiVolunteer.activityScheduleTokens[0])
  expect(multiInstructor.requestBody.recruitmentId).not.toBe(multiOrganization.recruitmentId)
  expect(multiVolunteer.requestBody.recruitmentId).not.toBe(multiOrganization.recruitmentId)
})
