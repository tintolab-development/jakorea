import { readBrowserAccessToken } from '../../../helpers/browser-access-token'
import { test, expect } from '../../../fixtures/test'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'

const FIXTURES = {
  capacityProgramId: '182101',
  scheduleProgramId: '182102',
  organizationApplicationId: '182812',
  scheduleId: 182344,
  attendanceProgramId: '182104',
  attendanceScheduleId: 182381,
  attendanceParticipantId: 183061,
} as const

type Json = Record<string, unknown> | unknown[]
type CapacityRow = {
  educationRegionCode?: string
  maxClassCount?: number
  maxVolunteerCount?: number
}
type TemporaryScheduleSlot = {
  scheduleId?: number
  grade?: string
  className?: string
  studentCount?: number
}
type TemporaryScheduleData = {
  organizationApplicationId?: number
  assignmentRevision?: number
  slots?: TemporaryScheduleSlot[]
}

function unwrap(body: Json): unknown {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    return (body as { data?: unknown }).data
  }
  return body
}

async function apiJson(page: import('@playwright/test').Page, path: string, init?: RequestInit) {
  const targetOrigin = process.env.E2E_API_PROXY_TARGET?.replace(/\/$/, '')
  expect(targetOrigin, '전용 E2E API target이 필요합니다').toBeTruthy()
  const token = await readBrowserAccessToken(page, 'cms')
  expect(token, '화면 요청에서 관리자 access token을 찾지 못했습니다').toBeTruthy()

  const response = await page.request.fetch(`${targetOrigin}${path}`, {
    ...init,
    data: init?.body,
    body: undefined,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
  const text = await response.text()
  let body: Json
  try {
    body = JSON.parse(text) as Json
  } catch {
    throw new Error(`JSON 응답이 아닙니다: HTTP ${response.status()} ${text.slice(0, 300)}`)
  }
  return { response, body, data: unwrap(body) }
}

test.describe.serial('UJAT mutation 저장·재조회 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expectAuthenticatedShell(page)
  })

  test('지역별 정원 PUT 후 GET 재조회', async ({ page }) => {
    const before = await apiJson(
      page,
      `/api/admin/program-execution/programs/${FIXTURES.capacityProgramId}/ujat/region-capacities`
    )
    expect(before.response.ok()).toBe(true)
    const current = Array.isArray(before.data)
      ? (before.data[0] as CapacityRow | undefined)
      : undefined
    expect(current).toBeTruthy()
    if (!current) throw new Error('서울 지역 정원 fixture가 없습니다')

    const currentClass = Number(current.maxClassCount)
    const currentVolunteer = Number(current.maxVolunteerCount)
    const nextClass = currentClass === 22 ? 23 : 22
    const nextVolunteer = currentVolunteer === 44 ? 46 : 44

    const saved = await apiJson(
      page,
      `/api/admin/program-execution/programs/${FIXTURES.capacityProgramId}/ujat/region-capacities`,
      {
        method: 'PUT',
        body: JSON.stringify({
          capacities: [
            {
              semesterType: 'FIRST_HALF',
              educationRegionCode: 'SEOUL',
              maxClassCount: nextClass,
              maxVolunteerCount: nextVolunteer,
            },
          ],
        }),
      }
    )
    expect(saved.response.ok(), `지역 정원 PUT HTTP ${saved.response.status()}`).toBe(true)

    const after = await apiJson(
      page,
      `/api/admin/program-execution/programs/${FIXTURES.capacityProgramId}/ujat/region-capacities`
    )
    expect(after.response.ok()).toBe(true)
    const persisted = Array.isArray(after.data) ? after.data[0] : undefined
    expect(persisted).toMatchObject({
      educationRegionCode: 'SEOUL',
      maxClassCount: nextClass,
      maxVolunteerCount: nextVolunteer,
    })

    await page.goto(
      `/programs/ujat?programId=${FIXTURES.capacityProgramId}&lnb=progress&tab=progress_participants`
    )
    await expect(page).toHaveURL(/programId=182101/)
  })

  test('기관 임시 일정 PUT 후 revision·학생 수 GET 재조회', async ({ page }) => {
    const path = `/api/admin/programs/${FIXTURES.scheduleProgramId}/ujat/organization-applications/${FIXTURES.organizationApplicationId}/temporary-schedule`
    const before = await apiJson(page, path)
    expect(before.response.ok()).toBe(true)
    const schedule = before.data as TemporaryScheduleData | undefined
    const current = schedule?.slots?.find(slot => slot.scheduleId === FIXTURES.scheduleId)
    expect(current).toBeTruthy()
    if (!current) throw new Error('기관 임시 일정 fixture가 없습니다')

    const nextStudentCount = Number(current.studentCount) === 9 ? 10 : 9
    const saved = await apiJson(page, path, {
      method: 'PUT',
      body: JSON.stringify({
        educationRegionCode: 'SEOUL',
        slots: [
          {
            scheduleId: FIXTURES.scheduleId,
            grade: String(current.grade ?? '4'),
            className: String(current.className ?? '1반'),
            studentCount: nextStudentCount,
          },
        ],
      }),
    })
    expect(saved.response.ok(), `임시 일정 PUT HTTP ${saved.response.status()}`).toBe(true)

    const after = await apiJson(page, path)
    expect(after.response.ok()).toBe(true)
    expect(after.data).toMatchObject({
      organizationApplicationId: Number(FIXTURES.organizationApplicationId),
      assignmentRevision: expect.any(Number),
    })
    const persisted = (after.data as TemporaryScheduleData).slots?.find(
      slot => slot.scheduleId === FIXTURES.scheduleId
    )
    expect(persisted).toBeTruthy()
    if (!persisted) throw new Error('저장된 기관 임시 일정 slot이 없습니다')
    expect(persisted.studentCount).toBe(nextStudentCount)
  })

  test('출석 bulk-upsert 후 회차별 GET 재조회', async ({ page }) => {
    const path = `/api/admin/program-execution/programs/${FIXTURES.attendanceProgramId}/attendances:bulk-upsert`
    const saved = await apiJson(page, path, {
      method: 'POST',
      body: JSON.stringify({
        scheduleId: FIXTURES.attendanceScheduleId,
        attendances: [
          {
            participantId: FIXTURES.attendanceParticipantId,
            status: 'LATE',
            arrivalTime: '08:55:00',
          },
        ],
      }),
    })
    expect(saved.response.ok(), `출석 bulk-upsert HTTP ${saved.response.status()}`).toBe(true)
    expect(saved.data).toMatchObject({ savedCount: 1 })

    const after = await apiJson(
      page,
      `/api/admin/program-execution/programs/${FIXTURES.attendanceProgramId}/schedules/${FIXTURES.attendanceScheduleId}/attendances`
    )
    expect(after.response.ok()).toBe(true)
    expect(after.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: FIXTURES.attendanceParticipantId,
          scheduleId: FIXTURES.attendanceScheduleId,
          status: 'LATE',
          internalLate: true,
        }),
      ])
    )
  })

  test('상태 충돌 일정 변경 요청은 409로 차단', async ({ page }) => {
    const result = await apiJson(
      page,
      `/api/admin/programs/${FIXTURES.scheduleProgramId}/ujat/organization-applications/${FIXTURES.organizationApplicationId}/schedule-change-request`,
      {
        method: 'POST',
        body: JSON.stringify({ reason: 'E2E 상태 충돌 검증' }),
      }
    )
    expect(result.response.status()).toBe(409)
    expect(result.body).toMatchObject({
      error: expect.objectContaining({ code: 'UJAT_WORKFLOW_STATE_CONFLICT' }),
    })
  })
})
