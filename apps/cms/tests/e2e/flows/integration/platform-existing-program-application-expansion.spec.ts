import { readBrowserAccessToken } from '../../helpers/browser-access-token'
import { expect, type Browser } from '@playwright/test'
import { test } from '../../fixtures/test'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'
import {
  fetchCmsProgramSnapshot,
  PlatformApplicationFlowPage,
  recruitmentForType,
  runPlatformApplication,
  type CmsProgramSnapshot,
  type PlatformAccount,
} from '../../pages/platform-application-flow.page'

test.describe.configure({ mode: 'serial' })

const EXISTING_PROGRAM_IDS = [186157, 186158] as const

const ORGANIZATION_ACCOUNTS: PlatformAccount[] = [
  { email: 'general2@test.com', applicationType: 'ORGANIZATION', mypagePath: '/mypage/education' },
  { email: 'teacher.instructor@test.com', applicationType: 'ORGANIZATION', mypagePath: '/mypage/education' },
  { email: 'teacher2@test.com', applicationType: 'ORGANIZATION', mypagePath: '/mypage/education' },
  { email: 'teacher@test.com', applicationType: 'ORGANIZATION', mypagePath: '/mypage/education' },
]

const INSTRUCTOR_ACCOUNTS: PlatformAccount[] = [
  { email: 'teacher.instructor@test.com', applicationType: 'INSTRUCTOR', mypagePath: '/mypage/lectures' },
  { email: 'general.instructor@test.com', applicationType: 'INSTRUCTOR', mypagePath: '/mypage/lectures' },
]

const VOLUNTEER_ACCOUNTS: PlatformAccount[] = [
  { email: 'general@test.com', applicationType: 'VOLUNTEER', mypagePath: '/mypage/volunteer' },
  { email: 'general2@test.com', applicationType: 'VOLUNTEER', mypagePath: '/mypage/volunteer' },
  { email: 'volunteer@test.com', applicationType: 'VOLUNTEER', mypagePath: '/mypage/volunteer' },
  { email: 'teacher.instructor@test.com', applicationType: 'VOLUNTEER', mypagePath: '/mypage/volunteer' },
]

type BlockedApplication = {
  email: string
  blockedReason?: unknown
  existingApplication?: unknown
}

async function assertPlatformAvailable(browser: Browser, baseUrl: string) {
  const context = await browser.newContext({ baseURL: baseUrl })
  try {
    const response = await context.request.get('/')
    expect(response.ok(), `Platform 접속 실패: ${baseUrl}`).toBe(true)
  } finally {
    await context.close()
  }
}

async function submitAllAvailable(
  browser: Browser,
  baseUrl: string,
  password: string,
  program: CmsProgramSnapshot,
  accounts: readonly PlatformAccount[],
  scheduleIndex: number
) {
  const submitted: Array<{
    account: PlatformAccount
    result: Awaited<ReturnType<typeof runPlatformApplication>>
  }> = []
  const blocked: BlockedApplication[] = []

  for (const account of accounts) {
    const recruitment = recruitmentForType(program, account.applicationType)
    const probeContext = await browser.newContext({ baseURL: baseUrl })
    let canApply = false
    let blockedReason: unknown
    let existingApplication: unknown
    try {
      const page = await probeContext.newPage()
      const flow = new PlatformApplicationFlowPage(page, baseUrl, password)
      await flow.signIn(account.email)
      const option = await flow.getApplicationOption(
        program.programId,
        recruitment,
        account.applicationType
      )
      canApply = option.canApply === true
      blockedReason = option.blockedReason
      existingApplication = option.existingApplication
      expect(
        rowFormBindingId(option),
        `${account.email} application-options formBindingId`
      ).toBe(recruitment.formBindingId)
    } finally {
      await probeContext.close()
    }

    if (!canApply) {
      blocked.push({ email: account.email, blockedReason, existingApplication })
      continue
    }

    const submitContext = await browser.newContext({ baseURL: baseUrl })
    try {
      const result = await runPlatformApplication(
        submitContext,
        baseUrl,
        password,
        program,
        account,
        recruitment,
        scheduleIndex
      )
      submitted.push({ account, result })
    } finally {
      await submitContext.close()
    }
  }

  return { submitted, blocked }
}

function rowFormBindingId(option: Record<string, unknown>) {
  return Number(option.formBindingId)
}

test('기존 E2E 프로그램에서 역할별 신청 가능한 계정을 최대한 사용한다', async ({ page, browser }) => {
  test.setTimeout(1_800_000)
  const platformBaseUrl = process.env.PLATFORM_BASE_URL?.trim()
  const password = process.env.E2E_PLATFORM_PASSWORD?.trim()
  if (!platformBaseUrl) throw new Error('PLATFORM_BASE_URL 환경변수가 필요합니다.')
  if (!password) throw new Error('E2E_PLATFORM_PASSWORD 환경변수가 필요합니다.')
  await assertPlatformAvailable(browser, platformBaseUrl)

  const programs: CmsProgramSnapshot[] = []
  for (const programId of EXISTING_PROGRAM_IDS) {
    await page.goto(`/programs/general?programId=${programId}`)
    await expectAuthenticatedShell(page)
    const snapshot = await fetchCmsProgramSnapshot(page, String(programId))
    expect(snapshot.programType).toBe('GENERAL_ORGANIZATION')
    expect(snapshot.recruitments).toHaveLength(3)
    programs.push(snapshot)
  }

  const executionSummary: Record<string, unknown> = {}
  for (const program of programs) {
    const organization = await submitAllAvailable(
      browser,
      platformBaseUrl,
      password,
      program,
      ORGANIZATION_ACCOUNTS,
      0
    )
    const instructor = await submitAllAvailable(
      browser,
      platformBaseUrl,
      password,
      program,
      INSTRUCTOR_ACCOUNTS,
      0
    )
    const volunteer = await submitAllAvailable(
      browser,
      platformBaseUrl,
      password,
      program,
      VOLUNTEER_ACCOUNTS,
      1
    )

    executionSummary[String(program.programId)] = {
      organization: organization.submitted.map(row => ({
        email: row.account.email,
        applicationId: row.result.applicationId,
        recruitmentId: row.result.recruitmentId,
        applicationType: row.result.applicationType,
        scheduleTokens: row.result.scheduleTokens,
      })),
      instructor: instructor.submitted.map(row => ({
        email: row.account.email,
        applicationId: row.result.applicationId,
        recruitmentId: row.result.recruitmentId,
        applicationType: row.result.applicationType,
        scheduleTokens: row.result.scheduleTokens,
      })),
      volunteer: volunteer.submitted.map(row => ({
        email: row.account.email,
        applicationId: row.result.applicationId,
        recruitmentId: row.result.recruitmentId,
        applicationType: row.result.applicationType,
        scheduleTokens: row.result.scheduleTokens,
        activityScheduleTokens: row.result.activityScheduleTokens,
      })),
      blocked: {
        organization: organization.blocked,
        instructor: instructor.blocked,
        volunteer: volunteer.blocked,
      },
    }
  }

  const adminToken = await readBrowserAccessToken(page, 'cms')
  const multiScheduleCheck = await page.evaluate(async ({ programId, token }) => {
    const response = await fetch(`/api/admin/programs/${programId}/schedules`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
    return { ok: response.ok, body: (await response.json()) as unknown }
  }, { programId: EXISTING_PROGRAM_IDS[1], token: adminToken })
  expect(multiScheduleCheck.ok).toBe(true)
  const multiSchedules = multiScheduleCheck.body
  expect(
    Array.isArray(multiSchedules) ? multiSchedules.length : 0,
    `복수 회차 일정 응답이 2건 미만입니다. summary=${JSON.stringify(executionSummary)}`
  ).toBeGreaterThanOrEqual(2)

  for (const [programId, summary] of Object.entries(executionSummary)) {
    const record = summary as Record<string, unknown>
    const blockedByRole = record.blocked as Record<string, unknown>

    for (const role of ['organization', 'instructor', 'volunteer'] as const) {
      const submittedRows = record[role]
      const blockedRows = blockedByRole[role]
      const hasSubmittedApplication = Array.isArray(submittedRows) && submittedRows.length > 0
      const hasVerifiedExistingApplication =
        Array.isArray(blockedRows) &&
        blockedRows.some((row: BlockedApplication) =>
          row.blockedReason === 'ALREADY_APPLIED' && row.existingApplication != null
        )

      expect(
        hasSubmittedApplication || hasVerifiedExistingApplication,
        `${programId} ${role} 신청이 신규 제출 또는 서버 기존 신청 확인으로 검증되지 않았습니다. summary=${JSON.stringify(summary)}`
      ).toBe(true)
    }
  }
  console.log(`[e2e-application-expansion] ${JSON.stringify(executionSummary)}`)
})
