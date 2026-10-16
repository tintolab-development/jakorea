import { expect, type Browser, type Page } from '@playwright/test'
import { test } from '../../fixtures/test'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../helpers/with-authenticated-page'
import {
  activateCmsProgramRecruitmentsForIntegration,
  fetchCmsProgramSnapshot,
  recruitmentForType,
  runPlatformApplication,
  type CmsProgramSnapshot,
  type PlatformAccount,
  type PortalApplicationResult,
} from '../../pages/platform-application-flow.page'
import {
  GeneralProgramRegistrationPage,
  type RegistrationCase,
} from '../../pages/general-program-registration.page'

test.describe.configure({ mode: 'serial' })

type JsonRecord = Record<string, unknown>

type ProgramSchedule = {
  id?: number
  scheduleId?: number
  sessionNo?: number
  allDay?: boolean
}

type ProgramFixture = {
  program: CmsProgramSnapshot
  schedules: ProgramSchedule[]
}

type ApprovalFixture = ProgramFixture & {
  organization: PortalApplicationResult
  instructor: PortalApplicationResult
  volunteer: PortalApplicationResult
}

type RejectionFixture = ProgramFixture & {
  organization: PortalApplicationResult
  instructor: PortalApplicationResult
  volunteerDocument: PortalApplicationResult
  volunteerFinal: PortalApplicationResult
}

type RunFixture = {
  approval: ApprovalFixture
  rejection: RejectionFixture
}

const APPROVAL_ORGANIZATION: PlatformAccount = {
  email: 'teacher@test.com',
  applicationType: 'ORGANIZATION',
  mypagePath: '/mypage/education',
}

const APPROVAL_INSTRUCTOR: PlatformAccount = {
  email: 'general.instructor@test.com',
  applicationType: 'INSTRUCTOR',
  mypagePath: '/mypage/lectures',
}

const APPROVAL_VOLUNTEER: PlatformAccount = {
  // volunteer@test.com은 반복 실행으로 기존 기관형 봉사 배정 일정과
  // 겹칠 수 있으므로, 상대적으로 배정 이력이 적은 계정을 사용한다.
  email: 'general@test.com',
  applicationType: 'VOLUNTEER',
  mypagePath: '/mypage/volunteer',
}

const REJECTION_ORGANIZATION: PlatformAccount = {
  email: 'teacher2@test.com',
  applicationType: 'ORGANIZATION',
  mypagePath: '/mypage/education',
}

const REJECTION_INSTRUCTOR: PlatformAccount = {
  email: 'teacher.instructor@test.com',
  applicationType: 'INSTRUCTOR',
  mypagePath: '/mypage/lectures',
}

const REJECTION_VOLUNTEER_DOCUMENT: PlatformAccount = {
  email: 'general@test.com',
  applicationType: 'VOLUNTEER',
  mypagePath: '/mypage/volunteer',
}

const REJECTION_VOLUNTEER_FINAL: PlatformAccount = {
  email: 'volunteer@test.com',
  applicationType: 'VOLUNTEER',
  mypagePath: '/mypage/volunteer',
}

function uniqueProgramTitle(kind: 'APPROVAL' | 'REJECTION') {
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
  return `E2E-승인반려-진행검증-${kind}-${timestamp}-${random}`
}

function unwrap(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const row = value as JsonRecord
  if (row.success === true && 'data' in row) return unwrap(row.data)
  return value
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function asPositiveNumber(value: unknown, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label}가 응답에 없습니다.`)
  }
  return parsed
}

function itemsOf(value: unknown): JsonRecord[] {
  const body = unwrap(value)
  if (Array.isArray(body)) return body.map(asRecord)
  const record = asRecord(body)
  return Array.isArray(record.items) ? record.items.map(asRecord) : []
}

function applicationStatus(value: JsonRecord): string {
  return String(value.applicationStatus ?? value.status ?? value.toStatus ?? '').toUpperCase()
}

function participantSourceApplicationId(value: JsonRecord): number | null {
  const candidate =
    value.sourceApplicationId ??
    value.applicationId ??
    asRecord(value.sourceApplication).id ??
    asRecord(value.application).id
  const parsed = Number(candidate)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function volunteerScreeningStatus(value: JsonRecord, key: 'documentStatus' | 'finalResultStatus') {
  return String(asRecord(value.screening)[key] ?? value[key] ?? '').toUpperCase()
}

async function parseResponse(response: {
  ok(): boolean
  status(): number
  text(): Promise<string>
}) {
  const text = await response.text()
  let payload: unknown
  try {
    payload = JSON.parse(text) as unknown
  } catch {
    payload = text
  }
  if (!response.ok()) {
    const body = asRecord(payload)
    const error = asRecord(body.error)
    throw new Error(
      `관리자 API 실패: HTTP ${response.status()} ${String(body.message ?? text.slice(0, 300))} ` +
        `code=${String(error.code ?? '')}`
    )
  }
  return payload
}

async function adminRequest(
  page: Page,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH',
  data?: unknown
) {
  if (page.url() === 'about:blank') {
    await page.goto('/')
  }
  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  if (!token) throw new Error('CMS 관리자 auth_token이 없습니다.')
  const response = await page.request.fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    ...(data === undefined ? {} : { data }),
  })
  return parseResponse(response)
}

async function fetchSchedules(page: Page, programId: number): Promise<ProgramSchedule[]> {
  const payload = await adminRequest(page, `/api/admin/programs/${programId}/schedules`, 'GET')
  const body = unwrap(payload)
  if (!Array.isArray(body)) throw new Error(`프로그램 일정 응답이 배열이 아닙니다: ${programId}`)
  return body.map(asRecord) as ProgramSchedule[]
}

function toIsoAtLocalDate(daysFromToday: number, hour: number): string {
  const value = new Date()
  value.setDate(value.getDate() + daysFromToday)
  value.setHours(hour, 0, 0, 0)
  return value.toISOString()
}

function scheduleTitleHash(programTitle: string): number {
  return [...programTitle].reduce((total, character) => {
    return (total * 31 + character.charCodeAt(0)) % 500
  }, 0)
}

function uniqueScheduleOffsets(programTitle: string): [number, number] {
  // 기관형 봉사자 배정은 같은 날짜의 다른 활성 봉사 배정을 허용하지 않는다.
  // 반복 실행 간에도 기존 QA 데이터와 겹치지 않도록 고유 프로그램명에서
  // 다음 달의 한 달 안에서 서로 다른 날짜를 사용한다. 캘린더가 운영
  // 종료월부터 열리는 Platform 동작과도 맞고, 실행 간 충돌 범위도 분산된다.
  const hash = scheduleTitleHash(programTitle)
  const today = new Date()
  const firstDate = new Date(today.getFullYear(), today.getMonth() + 1, 10 + (hash % 9))
  const firstOffset = Math.round((firstDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  return [firstOffset, firstOffset + 7]
}

function uniqueScheduleStartHour(programTitle: string): number {
  return 9 + (scheduleTitleHash(programTitle) % 4) * 3
}

function localDateKeyFromOffset(daysFromToday: number): string {
  const value = new Date()
  value.setDate(value.getDate() + daysFromToday)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function educationScheduleLine(dateKey: string, startHour: number, endHour: number): string {
  const date = new Date(`${dateKey}T00:00:00+09:00`)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getUTCDay()]
  const [year, month, day] = dateKey.split('-')
  return `${year.slice(-2)}년 ${Number(month)}월 ${Number(day)}일(${weekday}) ${String(startHour).padStart(2, '0')}:00 ~ ${String(endHour).padStart(2, '0')}:00`
}

function serviceDetailWithEducationScheduleLines(
  serviceDetailJson: string,
  dateKeys: [string, string],
  startHour: number
): string {
  let parsed: JsonRecord
  try {
    parsed = JSON.parse(serviceDetailJson) as JsonRecord
  } catch {
    throw new Error('통합 E2E 프로그램의 serviceDetailJson을 JSON으로 해석할 수 없습니다.')
  }
  const common =
    parsed.generalCommonInfo && typeof parsed.generalCommonInfo === 'object'
      ? (parsed.generalCommonInfo as JsonRecord)
      : parsed
  common.educationScheduleLines = [
    educationScheduleLine(dateKeys[0], startHour, startHour + 2),
    educationScheduleLine(dateKeys[1], startHour + 3, startHour + 5),
  ]
  return JSON.stringify(parsed)
}

async function ensureEducationSchedules(
  page: Page,
  program: CmsProgramSnapshot,
  _schedules: ProgramSchedule[]
): Promise<ProgramSchedule[]> {
  // 등록 UI가 serviceDetailJson의 교육 일정 라인은 저장했지만
  // program_schedule 실체를 만들지 못하는 환경에서는, 동일 관리자 권한의
  // 공식 프로그램 수정 API로 실제 회차를 생성한다. 이미 회차가 있더라도
  // 새 테스트의 일정 공간으로 교체해 반복 실행 간 회원별 날짜 충돌을
  // 방지한다. DB 직접 삽입은 하지 않는다.
  const [firstDayOffset, secondDayOffset] = uniqueScheduleOffsets(program.title)
  const operationStartDate = localDateKeyFromOffset(1)
  const operationEndDate = localDateKeyFromOffset(secondDayOffset + 1)
  const scheduleStartHour = uniqueScheduleStartHour(program.title)
  const scheduleDateKeys = [
    localDateKeyFromOffset(firstDayOffset),
    localDateKeyFromOffset(secondDayOffset),
  ] as [string, string]
  await adminRequest(page, `/api/admin/programs/${program.programId}`, 'PATCH', {
    businessStartDate: operationStartDate,
    businessEndDate: operationEndDate,
    // 신청 폼의 동적 일정 선택지는 canonical educationScheduleLines와
    // 실제 program_schedule의 날짜가 겹칠 때만 노출된다. 일정만 추가하면
    // UI에서 선택 카드가 비어 있으므로 두 원본을 같은 공식 PATCH로 맞춘다.
    serviceDetailJson: serviceDetailWithEducationScheduleLines(
      program.serviceDetailJson,
      scheduleDateKeys,
      scheduleStartHour
    ),
    schedules: [
      {
        sessionNo: 1,
        scheduleName: `${program.title} 교육 1회차`,
        startAt: toIsoAtLocalDate(firstDayOffset, scheduleStartHour),
        endAt: toIsoAtLocalDate(firstDayOffset, scheduleStartHour + 2),
        allDay: false,
        locationName: null,
        address: null,
        addressDetail: null,
        maxParticipantCount: 30,
        completionRequired: true,
      },
      {
        sessionNo: 2,
        scheduleName: `${program.title} 교육 2회차`,
        startAt: toIsoAtLocalDate(secondDayOffset, scheduleStartHour + 3),
        endAt: toIsoAtLocalDate(secondDayOffset, scheduleStartHour + 5),
        allDay: false,
        locationName: null,
        address: null,
        addressDetail: null,
        maxParticipantCount: 30,
        completionRequired: true,
      },
    ],
  })

  const updatedSchedules = await fetchSchedules(page, program.programId)
  expect(
    updatedSchedules.filter(schedule => schedule.allDay === false).length,
    `실제 교육 회차가 없습니다: ${program.programId}`
  ).toBeGreaterThanOrEqual(2)
  return updatedSchedules
}

function scheduleId(schedule: ProgramSchedule): number {
  return asPositiveNumber(schedule.id ?? schedule.scheduleId, 'scheduleId')
}

function selectEducationScheduleId(schedules: ProgramSchedule[]): number {
  // 일정형 일반 프로그램에는 사업 운영기간을 나타내는 all-day 행이
  // 함께 포함될 수 있다. 실제 교육 회차(allDay=false)를 우선 사용한다.
  const educationSchedules = schedules.filter(schedule => schedule.allDay === false)
  const educationSchedule = educationSchedules.at(-1)
  return scheduleId(educationSchedule ?? schedules[0])
}

function assertRoleApplicationMapping(
  program: CmsProgramSnapshot,
  application: PortalApplicationResult,
  applicationType: 'ORGANIZATION' | 'INSTRUCTOR' | 'VOLUNTEER'
) {
  const recruitment = recruitmentForType(program, applicationType)
  expect(application.applicationType).toBe(applicationType)
  expect(application.recruitmentId).toBe(recruitment.recruitmentId)
  expect(application.formBindingId).toBe(recruitment.formBindingId)
  expect(application.applicationId).toBeGreaterThan(0)
}

async function createProgram(page: Page, kind: 'APPROVAL' | 'REJECTION'): Promise<ProgramFixture> {
  const registrationCase: RegistrationCase = {
    audience: 'organization',
    structure: 'schedule',
    session: 'multi',
    label: `승인반려_${kind}`,
  }
  const registration = new GeneralProgramRegistrationPage(page, registrationCase, {
    openRecruitment: true,
    // case 5는 실제 교육 회차가 2개 생성되는 일정형 preset이다. 각 wizard는
    // 별도 컨텍스트에서 실행하므로 동일 preset을 사용해도 입력 상태가 섞이지 않는다.
    devAutofillCaseId: 5,
    safeWagePaymentItems: true,
    skipOptionalUploads: true,
    skipApplicationFormEdits: true,
    ensureFutureDates: true,
    programTitle: uniqueProgramTitle(kind),
  })

  await page.goto('/programs/general')
  await expectAuthenticatedShell(page)
  await registration.openNewRegistration()
  await registration.fillCommonInfo()
  await registration.goToRecruitment()
  await registration.fillRecruitmentInfo()
  await registration.goToApplication()
  await registration.fillApplicationInfo()

  const created = await registration.completeRegistration()
  const program = await fetchCmsProgramSnapshot(page, created.programId)
  expect(program.programType).toBe('GENERAL_ORGANIZATION')
  expect(program.recruitments).toHaveLength(3)

  for (const applicationType of ['ORGANIZATION', 'INSTRUCTOR', 'VOLUNTEER'] as const) {
    const recruitment = recruitmentForType(program, applicationType)
    expect(recruitment.recruitmentId).toBeGreaterThan(0)
    expect(recruitment.formBindingId).toBeGreaterThan(0)
  }

  await activateCmsProgramRecruitmentsForIntegration(page, program)
  const initialSchedules = await fetchSchedules(page, program.programId)
  const schedules = await ensureEducationSchedules(page, program, initialSchedules)
  expect(
    schedules.filter(schedule => schedule.allDay === false).length,
    `실제 교육 회차가 없습니다: ${program.programId}`
  ).toBeGreaterThan(0)
  expect(schedules.length, `프로그램 일정이 없습니다: ${program.programId}`).toBeGreaterThan(0)
  return { program, schedules }
}

async function submitPlatformApplication(
  browser: Browser,
  program: CmsProgramSnapshot,
  account: PlatformAccount,
  password: string
) {
  const context = await browser.newContext({ baseURL: process.env.PLATFORM_BASE_URL })
  try {
    const recruitment = recruitmentForType(program, account.applicationType)
    return await runPlatformApplication(
      context,
      process.env.PLATFORM_BASE_URL!.trim(),
      password,
      program,
      account,
      recruitment,
      0
    )
  } finally {
    await context.close()
  }
}

async function createElapsedInterviewSlot(page: Page, programId: number): Promise<number> {
  const end = new Date(Date.now() - 10 * 60 * 1000)
  const start = new Date(end.getTime() - 30 * 60 * 1000)
  const slotDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(start)
  const payload = await adminRequest(page, `/api/admin/programs/${programId}/interview-slots`, 'POST', {
    slotDate,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    maxAssignCount: 10,
    exceptionSlot: true,
  })
  const body = asRecord(unwrap(payload))
  return asPositiveNumber(body.id ?? body.interviewSlotId, 'interviewSlotId')
}

async function approveOrganization(page: Page, applicationId: number) {
  const payload = await adminRequest(
    page,
    `/api/admin/organization-applications/${applicationId}/approve`,
    'POST',
    { timing: 'IMMEDIATE' }
  )
  expect(applicationStatus(asRecord(unwrap(payload)))).toBe('APPROVED')
}

async function rejectOrganization(page: Page, applicationId: number) {
  const payload = await adminRequest(
    page,
    `/api/admin/organization-applications/${applicationId}/reject`,
    'POST',
    { reason: 'E2E 기관 반려 검증', timing: 'IMMEDIATE' }
  )
  expect(applicationStatus(asRecord(unwrap(payload)))).toBe('REJECTED')
}

async function assignOrganizationSchedule(
  page: Page,
  programId: number,
  applicationId: number,
  scheduleId: number
) {
  const payload = await adminRequest(
    page,
    `/api/admin/programs/${programId}/organization-applications/${applicationId}/schedule-assignments`,
    'PUT',
    {
      slots: [{ scheduleId, grade: '1학년', className: '1반' }],
      changeReason: 'E2E 승인 후 기관 일정 배정',
    }
  )
  const body = asRecord(unwrap(payload))
  const slots = Array.isArray(body.slots) ? body.slots.map(asRecord) : []
  expect(slots.some(slot => Number(slot.scheduleId) === scheduleId)).toBe(true)
}

async function approveInstructor(
  page: Page,
  applicationId: number,
  organizationApplicationId: number,
  scheduleId: number
) {
  const payload = await adminRequest(
    page,
    `/api/admin/instructor-applications/${applicationId}/approve`,
    'POST',
    {
      assignments: [{ scheduleId, organizationApplicationId, scheduleLead: true }],
      feePolicy: {
        basisType: 'PROGRAM',
        measure: 'PER_HOUR',
        amount: 1,
        instructorFeeGrade: 'GRADE_1',
      },
      notification: { timing: 'IMMEDIATE', scheduledAt: null },
    }
  )
  expect(applicationStatus(asRecord(unwrap(payload)))).toBe('APPROVED')
}

async function rejectInstructor(page: Page, applicationId: number) {
  const payload = await adminRequest(
    page,
    `/api/admin/instructor-applications/${applicationId}/reject`,
    'POST',
    {
      reason: 'E2E 강사 반려 검증',
      notification: { timing: 'IMMEDIATE', scheduledAt: null },
    }
  )
  expect(applicationStatus(asRecord(unwrap(payload)))).toBe('REJECTED')
}

async function setVolunteerDocumentResult(
  page: Page,
  applicationId: number,
  result: 'PASS' | 'FAIL'
) {
  const payload = await adminRequest(
    page,
    `/api/admin/volunteer-applications/${applicationId}/document-result`,
    'POST',
    {
      result,
      ...(result === 'FAIL' ? { reason: 'E2E 봉사자 서류 반려 검증' } : {}),
      notifyTiming: 'IMMEDIATE',
    }
  )
  const body = asRecord(unwrap(payload))
  expect(applicationStatus(body)).not.toBe('')
  return body
}

async function assignInterview(page: Page, applicationId: number, interviewSlotId: number) {
  const payload = await adminRequest(page, '/api/admin/interview-assignments', 'POST', {
    volunteerApplicationId: applicationId,
    interviewSlotId,
    notifyTiming: 'IMMEDIATE',
  })
  const body = asRecord(unwrap(payload))
  return asPositiveNumber(
    body.interviewAssignmentId ?? body.id ?? body.assignmentId,
    'interviewAssignmentId'
  )
}

async function evaluateInterview(page: Page, assignmentId: number) {
  await adminRequest(page, `/api/admin/interview-assignments/${assignmentId}/evaluations`, 'POST', {
    managerAScore: 5,
    managerBScore: 5,
    comment: 'E2E 면접 평가 완료',
  })
}

async function setVolunteerFinalResult(
  page: Page,
  applicationId: number,
  result: 'PASS' | 'FAIL'
) {
  const payload = await adminRequest(
    page,
    `/api/admin/volunteer-applications/${applicationId}/final-result`,
    'POST',
    {
      result,
      ...(result === 'FAIL' ? { reason: 'E2E 봉사자 최종 반려 검증' } : {}),
      notifyTiming: 'IMMEDIATE',
    }
  )
  expect(applicationStatus(asRecord(unwrap(payload)))).not.toBe('')
}

async function assignVolunteerOrganizations(
  page: Page,
  programId: number,
  participantId: number,
  organizationApplicationId: number
) {
  await adminRequest(
    page,
    `/api/admin/programs/${programId}/participants/${participantId}/assigned-organizations`,
    'PUT',
    {
      organizationApplicationIds: [organizationApplicationId],
      reason: 'E2E 승인 봉사자 기관 배정',
    }
  )
}

async function fetchDetail(page: Page, path: string): Promise<JsonRecord> {
  return asRecord(unwrap(await adminRequest(page, path, 'GET')))
}

async function fetchParticipants(page: Page, programId: number): Promise<JsonRecord[]> {
  return itemsOf(
    await adminRequest(page, `/api/admin/programs/${programId}/participants?page=0&size=100`, 'GET')
  )
}

async function assertParticipantForApplication(
  page: Page,
  programId: number,
  applicationId: number,
  participantType: string
) {
  const participants = await fetchParticipants(page, programId)
  const participant = participants.find(
    row =>
      participantSourceApplicationId(row) === applicationId &&
      String(row.participantType ?? '').toUpperCase() === participantType
  )
  expect(participant, `participant sourceApplicationId=${applicationId}`).toBeTruthy()
  return participant!
}

async function assertNoParticipantForApplication(page: Page, programId: number, applicationId: number) {
  const participants = await fetchParticipants(page, programId)
  expect(participants.some(row => participantSourceApplicationId(row) === applicationId)).toBe(false)
}

async function assertProgressScreen(page: Page, programId: number) {
  await page.goto(
    `/programs/general?programId=${programId}&lnb=progress&tab=progress_participants`
  )
  await expectAuthenticatedShell(page)
  await expect(page).toHaveURL(/lnb=progress/)

  const progressNavigation = page.getByRole('navigation', { name: '일반 프로그램 상세 메뉴' })
  await expect(progressNavigation).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/참여 기관|교육 참여 기관 목록/).first()).toBeVisible({
    timeout: 30_000,
  })

  for (const [tab, label] of [
    ['progress_instructors', '참여 강사'],
    ['progress_volunteers', '참여 봉사자'],
  ] as const) {
    await page.goto(`/programs/general?programId=${programId}&lnb=progress&tab=${tab}`)
    await expect(page).toHaveURL(/lnb=progress/)
    await expect(page.getByText(new RegExp(label)).first()).toBeVisible({ timeout: 30_000 })
  }
}

async function attachSummary(summary: unknown) {
  await test.info().attach('approval-progress-summary.json', {
    body: JSON.stringify(summary, null, 2),
    contentType: 'application/json',
  })
}

test.describe('기관·강사·봉사자 승인/반려 및 진행 현황 통합 E2E', () => {
  let fixture: RunFixture

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(1_800_000)
    const platformBaseUrl = process.env.PLATFORM_BASE_URL?.trim()
    const password = process.env.E2E_PLATFORM_PASSWORD?.trim()
    if (!platformBaseUrl) throw new Error('PLATFORM_BASE_URL 환경변수가 필요합니다.')
    if (!password) throw new Error('E2E_PLATFORM_PASSWORD 환경변수가 필요합니다.')

    // 각 등록 wizard를 새 관리자 컨텍스트에서 실행해 이전 프로그램의
    // 지급 항목·모집 입력 상태가 다음 프로그램에 누적되지 않도록 한다.
    const approval = await withAuthenticatedPage(browser, page =>
      createProgram(page, 'APPROVAL')
    )
    const approvalOrganization = await submitPlatformApplication(
      browser,
      approval.program,
      APPROVAL_ORGANIZATION,
      password
    )
    const approvalInstructor = await submitPlatformApplication(
      browser,
      approval.program,
      APPROVAL_INSTRUCTOR,
      password
    )
    const approvalVolunteer = await submitPlatformApplication(
      browser,
      approval.program,
      APPROVAL_VOLUNTEER,
      password
    )

    const rejection = await withAuthenticatedPage(browser, page =>
      createProgram(page, 'REJECTION')
    )
    const rejectionOrganization = await submitPlatformApplication(
      browser,
      rejection.program,
      REJECTION_ORGANIZATION,
      password
    )
    const rejectionInstructor = await submitPlatformApplication(
      browser,
      rejection.program,
      REJECTION_INSTRUCTOR,
      password
    )
    const rejectionVolunteerDocument = await submitPlatformApplication(
      browser,
      rejection.program,
      REJECTION_VOLUNTEER_DOCUMENT,
      password
    )
    const rejectionVolunteerFinal = await submitPlatformApplication(
      browser,
      rejection.program,
      REJECTION_VOLUNTEER_FINAL,
      password
    )

    // 각 신규 프로그램이 역할별 독립 신청을 모두 보유하는지, 다른 모집 ID가
    // 섞이지 않았는지를 fixture 확정 전에 검증한다.
    assertRoleApplicationMapping(approval.program, approvalOrganization, 'ORGANIZATION')
    assertRoleApplicationMapping(approval.program, approvalInstructor, 'INSTRUCTOR')
    assertRoleApplicationMapping(approval.program, approvalVolunteer, 'VOLUNTEER')
    assertRoleApplicationMapping(rejection.program, rejectionOrganization, 'ORGANIZATION')
    assertRoleApplicationMapping(rejection.program, rejectionInstructor, 'INSTRUCTOR')
    assertRoleApplicationMapping(rejection.program, rejectionVolunteerDocument, 'VOLUNTEER')
    assertRoleApplicationMapping(rejection.program, rejectionVolunteerFinal, 'VOLUNTEER')

    fixture = {
      approval: {
        ...approval,
        organization: approvalOrganization,
        instructor: approvalInstructor,
        volunteer: approvalVolunteer,
      },
      rejection: {
        ...rejection,
        organization: rejectionOrganization,
        instructor: rejectionInstructor,
        volunteerDocument: rejectionVolunteerDocument,
        volunteerFinal: rejectionVolunteerFinal,
      },
    }
  })

  test('승인 플로우가 participant·배정·출석 조회·진행현황까지 도달한다', async ({ page }) => {
    test.setTimeout(600_000)
    const { program, schedules, organization, instructor, volunteer } = fixture.approval
    const educationScheduleId = selectEducationScheduleId(schedules)

    await approveOrganization(page, organization.applicationId)
    const organizationDetail = await fetchDetail(
      page,
      `/api/admin/organization-applications/${organization.applicationId}`
    )
    expect(applicationStatus(organizationDetail)).toBe('APPROVED')
    await assignOrganizationSchedule(page, program.programId, organization.applicationId, educationScheduleId)

    await approveInstructor(
      page,
      instructor.applicationId,
      organization.applicationId,
      educationScheduleId
    )
    const instructorDetail = await fetchDetail(
      page,
      `/api/admin/instructor-applications/${instructor.applicationId}`
    )
    expect(applicationStatus(instructorDetail)).toBe('APPROVED')

    await setVolunteerDocumentResult(page, volunteer.applicationId, 'PASS')
    const interviewSlotId = await createElapsedInterviewSlot(page, program.programId)
    const interviewAssignmentId = await assignInterview(page, volunteer.applicationId, interviewSlotId)
    await evaluateInterview(page, interviewAssignmentId)

    // 일반 기관 봉사자 최종 결과는 면접 종료·평가 완료 후에만 처리할 수 있다.
    await setVolunteerFinalResult(page, volunteer.applicationId, 'PASS')
    const volunteerDetail = await fetchDetail(
      page,
      `/api/admin/volunteer-applications/${volunteer.applicationId}`
    )
    expect(applicationStatus(volunteerDetail)).toBe('APPROVED')

    const organizationParticipant = await assertParticipantForApplication(
      page,
      program.programId,
      organization.applicationId,
      'ORGANIZATION'
    )
    const instructorParticipant = await assertParticipantForApplication(
      page,
      program.programId,
      instructor.applicationId,
      'INSTRUCTOR'
    )
    const volunteerParticipant = await assertParticipantForApplication(
      page,
      program.programId,
      volunteer.applicationId,
      'VOLUNTEER'
    )

    const participantId = asPositiveNumber(
      volunteerParticipant.participantId ?? volunteerParticipant.id,
      'volunteer participantId'
    )
    await assignVolunteerOrganizations(
      page,
      program.programId,
      participantId,
      organization.applicationId
    )

    const instructorAssignments = itemsOf(
      await adminRequest(
        page,
        `/api/admin/program-execution/instructor-assignments?programId=${program.programId}&page=0&size=100`,
        'GET'
      )
    )
    expect(
      instructorAssignments.some(
        row => Number(row.scheduleId) === educationScheduleId && Number(row.organizationApplicationId) === organization.applicationId
      )
    ).toBe(true)

    const organizationAssignments = asRecord(
      unwrap(
        await adminRequest(
          page,
          `/api/admin/programs/${program.programId}/organization-applications/${organization.applicationId}/schedule-assignments`,
          'GET'
        )
      )
    )
    const assignedSlots = Array.isArray(organizationAssignments.slots)
      ? organizationAssignments.slots.map(asRecord)
      : []
    expect(assignedSlots.some(row => Number(row.scheduleId) === educationScheduleId)).toBe(true)

    const attendanceRows = itemsOf(
      await adminRequest(
        page,
        `/api/admin/program-execution/programs/${program.programId}/attendances`,
        'GET'
      )
    )
    for (const row of attendanceRows) {
      expect(Number(row.scheduleId)).toBe(educationScheduleId)
    }
    const scheduleAttendance = await adminRequest(
      page,
      `/api/admin/program-execution/programs/${program.programId}/schedules/${educationScheduleId}/attendances`,
      'GET'
    )
    expect(Array.isArray(unwrap(scheduleAttendance)) || Array.isArray(asRecord(unwrap(scheduleAttendance)).items)).toBe(true)

    await assertProgressScreen(page, program.programId)
    await page.reload()
    await expect(page).toHaveURL(/programId=/)

    await attachSummary({
      programId: program.programId,
      applicationIds: {
        organization: organization.applicationId,
        instructor: instructor.applicationId,
        volunteer: volunteer.applicationId,
      },
      participantIds: {
        organization: organizationParticipant.participantId ?? organizationParticipant.id,
        instructor: instructorParticipant.participantId ?? instructorParticipant.id,
        volunteer: volunteerParticipant.participantId ?? volunteerParticipant.id,
      },
      scheduleId: educationScheduleId,
    })
  })

  test('반려 플로우는 상태만 반영되고 participant·진행현황에는 진입하지 않는다', async ({ page }) => {
    test.setTimeout(600_000)
    const { program, organization, instructor, volunteerDocument, volunteerFinal } = fixture.rejection

    await rejectOrganization(page, organization.applicationId)
    const rejectedOrganization = await fetchDetail(
      page,
      `/api/admin/organization-applications/${organization.applicationId}`
    )
    expect(applicationStatus(rejectedOrganization)).toBe('REJECTED')
    await assertNoParticipantForApplication(page, program.programId, organization.applicationId)

    await rejectInstructor(page, instructor.applicationId)
    const rejectedInstructor = await fetchDetail(
      page,
      `/api/admin/instructor-applications/${instructor.applicationId}`
    )
    expect(applicationStatus(rejectedInstructor)).toBe('REJECTED')
    await assertNoParticipantForApplication(page, program.programId, instructor.applicationId)

    await setVolunteerDocumentResult(page, volunteerDocument.applicationId, 'FAIL')
    const rejectedDocumentVolunteer = await fetchDetail(
      page,
      `/api/admin/volunteer-applications/${volunteerDocument.applicationId}`
    )
    // document-result 요청의 FAIL은 상세 read model에서 REJECTED로 정규화된다.
    expect(volunteerScreeningStatus(rejectedDocumentVolunteer, 'documentStatus')).toBe('REJECTED')
    await assertNoParticipantForApplication(page, program.programId, volunteerDocument.applicationId)

    await setVolunteerDocumentResult(page, volunteerFinal.applicationId, 'PASS')
    const interviewSlotId = await createElapsedInterviewSlot(page, program.programId)
    const assignmentId = await assignInterview(page, volunteerFinal.applicationId, interviewSlotId)
    await evaluateInterview(page, assignmentId)
    await setVolunteerFinalResult(page, volunteerFinal.applicationId, 'FAIL')

    const rejectedFinalVolunteer = await fetchDetail(
      page,
      `/api/admin/volunteer-applications/${volunteerFinal.applicationId}`
    )
    expect(volunteerScreeningStatus(rejectedFinalVolunteer, 'documentStatus')).toMatch(
      /^(PASS|DOCUMENT_PASSED)$/
    )
    expect(volunteerScreeningStatus(rejectedFinalVolunteer, 'finalResultStatus')).toBe('FAIL')
    await assertNoParticipantForApplication(page, program.programId, volunteerFinal.applicationId)

    const instructorAssignments = itemsOf(
      await adminRequest(
        page,
        `/api/admin/program-execution/instructor-assignments?programId=${program.programId}&page=0&size=100`,
        'GET'
      )
    )
    expect(
      instructorAssignments.some(row => Number(row.instructorApplicationId) === instructor.applicationId)
    ).toBe(false)

    await page.goto(
      `/programs/general?programId=${program.programId}&lnb=progress&tab=progress_participants`
    )
    await expectAuthenticatedShell(page)
    await expect(page).toHaveURL(/lnb=progress/)
    await expect(page.getByText(/참여 기관|교육 참여 기관 목록/).first()).toBeVisible({
      timeout: 30_000,
    })

    await attachSummary({
      programId: program.programId,
      rejectedApplicationIds: {
        organization: organization.applicationId,
        instructor: instructor.applicationId,
        volunteerDocument: volunteerDocument.applicationId,
        volunteerFinal: volunteerFinal.applicationId,
      },
    })
  })
})
