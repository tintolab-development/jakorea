import { installIsolatedAuthRefreshRoutes } from '../../../../helpers/isolated-auth-session'
import { test, expect } from '../../../../fixtures/test'
import type { Page } from '@playwright/test'

const PROGRAM_ID = '186001'
const APPLICATION_ID = '928514'
const STOP_SCHEDULE_ID = 928513
const GIVE_UP_PATH = `/api/admin/programs/${PROGRAM_ID}/trained-teacher/organization-applications/${APPLICATION_ID}/give-up`

type GiveUpScenario = {
  status: number
  code?: string
}

function applicationDto(withdrawn: boolean) {
  return {
    id: Number(APPLICATION_ID),
    programId: Number(PROGRAM_ID),
    schoolName: 'C-07 Mock 기관',
    regionName: '서울 강남구',
    educationGrade: '초등학교 5학년',
    classCount: 2,
    studentCount: 40,
    requestedEducationFormat: 'OFFLINE',
    approvalStatus: 'APPROVED',
    progressLabel: withdrawn ? '활동 포기' : '교육 진행 중',
    activityWithdrawn: withdrawn,
    availableActions: withdrawn ? ['VIEW'] : ['VIEW', 'GIVE_UP'],
    preferredScheduleBlocks: [
      {
        preferenceRank: 1,
        date: '2026-10-20',
        dayOfWeek: '화',
        sessionCount: 1,
        sessionTimes: [{ sessionIndex: 1, classPeriod: '1교시', timeRange: '09:00~10:00' }],
      },
    ],
    detail: {
      applicationReason: '브라우저 계약 검증',
      otherRequests: '',
      educationType: '대면',
      addressDetail: '테스트 주소',
    },
  }
}

async function installC07NetworkMock(page: Page, scenario: GiveUpScenario) {
  // TT remote API capability는 mock-jwt-token을 실제 JWT로 간주하지 않는다.
  // 테스트 API는 전부 route mock이므로 서버로 전송되지 않는 JWT-shaped 토큰만 주입한다.
  await page.addInitScript(() => {
    // QA-0137: access token은 메모리 전용 — refresh token만 넣고 복원 refresh는 mock이 답한다
    localStorage.setItem('auth_refresh_token', 'e2e.mock.refresh')
    localStorage.setItem('auth_expires_at', new Date(Date.now() + 60 * 60 * 1000).toISOString())
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'c07-e2e-admin',
        email: 'c07-e2e-admin@jakorea.org',
        name: 'C-07 E2E 관리자',
        role: 'ADMIN',
        adminLevel: 'MASTER',
        roleCode: 'MASTER',
        isActive: true,
        programRoles: {},
      })
    )
  })

  const state = {
    withdrawn: false,
    requests: [] as Array<Record<string, unknown>>,
    detailReads: 0,
  }

  await page.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    // `/src/.../api/...` Vite module URLs도 `**/api/**`에 매칭되므로
    // 실제 API 경로가 아니면 기존 라우팅으로 넘긴다.
    if (!path.startsWith('/api/')) {
      await route.fallback()
      return
    }

    if (method === 'POST' && path === GIVE_UP_PATH) {
      const body = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>
      state.requests.push(body)
      if (scenario.status >= 400) {
        await route.fulfill({
          status: scenario.status,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: scenario.code ?? 'VALIDATION_ERROR',
              message: scenario.status === 409 ? '이미 활동 포기 처리된 기관입니다.' : '검증 오류',
            },
          }),
        })
        return
      }
      state.withdrawn = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(applicationDto(true)),
      })
      return
    }

    if (method === 'GET' && path.endsWith('/trained-teacher/organization-applications')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [applicationDto(state.withdrawn)],
          page: 0,
          size: 20,
          totalElements: 1,
        }),
      })
      return
    }

    if (
      method === 'GET' &&
      path.endsWith(`/trained-teacher/organization-applications/${APPLICATION_ID}`)
    ) {
      state.detailReads += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(applicationDto(state.withdrawn)),
      })
      return
    }

    if (method === 'GET' && path.endsWith(`/programs/${PROGRAM_ID}/schedules`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: STOP_SCHEDULE_ID,
            scheduleName: '1차 교육',
            sessionNo: 1,
            startAt: '2026-10-20T09:00:00+09:00',
            endAt: '2026-10-20T10:00:00+09:00',
          },
        ]),
      })
      return
    }

    if (method === 'GET' && path === '/api/admin/programs') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: Number(PROGRAM_ID),
              title: 'C-07 Mock 교육받은 교사 프로그램',
              programType: 'TRAINED_TEACHER',
              periodStatus: 'IN_PROGRESS',
              lifecycleStatus: 'education_in_progress',
              startDate: '2026-10-01',
              endDate: '2026-12-31',
            },
          ],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        }),
      })
      return
    }

    if (method === 'GET' && path === `/api/admin/programs/${PROGRAM_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: Number(PROGRAM_ID),
          title: 'C-07 Mock 교육받은 교사 프로그램',
          programType: 'TRAINED_TEACHER',
          lifecycleStatus: 'EDUCATION_IN_PROGRESS',
          startDate: '2026-10-01',
          endDate: '2026-12-31',
          serviceDetailJson: '{}',
        }),
      })
      return
    }

    if (method === 'GET' && path === `/api/admin/programs/${PROGRAM_ID}/navigation`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ lnb: [] }),
      })
      return
    }

    if (method === 'GET' && path === `/api/admin/programs/${PROGRAM_ID}/sponsors`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
      return
    }

    if (method === 'GET' && path === `/api/admin/programs/${PROGRAM_ID}/trained-teacher/detail`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
      return
    }

    if (
      method === 'GET' &&
      path === `/api/admin/programs/${PROGRAM_ID}/trained-teacher/performance-summary`
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ programId: Number(PROGRAM_ID), availableActions: [] }),
      })
      return
    }

    if (method === 'GET' && path === '/api/admin/programs/overview-stages') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 1, scheduled: 0, inProgress: 1, completed: 0 }),
      })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })

  await installIsolatedAuthRefreshRoutes(page)
  return state
}

async function openInstitutionDetail(page: Page) {
  await page.goto(
    `/programs/trained-teachers?programId=${PROGRAM_ID}&lnb=progress&tab=institutions&schoolId=${APPLICATION_ID}&schoolTab=application`
  )
  await expect(page.getByText('C-07 Mock 기관', { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByRole('button', { name: '활동 포기', exact: true })).toBeVisible({
    timeout: 15_000,
  })
}

async function fillWithdrawForm(page: Page, faultParty: 'USER' | 'ADMIN', reason: string) {
  await page.getByRole('button', { name: '활동 포기', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '활동 포기' })).toBeVisible()
  await page.getByRole('combobox', { name: '교육 일정' }).click()
  await page
    .getByText(/1차 교육/)
    .last()
    .click()
  await page.getByLabel(faultParty === 'USER' ? '사용자 귀책' : '관리자 귀책').check()
  await page.getByLabel('활동 포기 사유').fill(reason)
}

test.describe('C-07 TT 활동 포기 브라우저 계약(Mock)', () => {
  test('USER payload와 성공 후 캐시 재조회/상태 갱신', async ({ page }) => {
    const state = await installC07NetworkMock(page, { status: 200 })
    await openInstitutionDetail(page)
    await fillWithdrawForm(page, 'USER', '테스트용 활동 포기 사유')

    await Promise.all([
      page.waitForResponse(
        response => response.url().includes(GIVE_UP_PATH) && response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: '활동 포기', exact: true }).last().click(),
    ])

    expect(state.requests).toEqual([
      { stopScheduleId: STOP_SCHEDULE_ID, reason: '테스트용 활동 포기 사유', faultParty: 'USER' },
    ])
    await expect(page.getByRole('button', { name: '활동 포기', exact: true })).toHaveCount(0)
    expect(state.detailReads).toBeGreaterThan(1)

    await page.reload()
    await expect(page.getByText('활동 포기', { exact: true }).first()).toBeVisible({
      timeout: 20_000,
    })
  })

  test('ADMIN payload와 409 실패 시 완료 UI 미표시', async ({ page }) => {
    const state = await installC07NetworkMock(page, {
      status: 409,
      code: 'TRAINED_TEACHER_ACTIVITY_ALREADY_GIVEN_UP',
    })
    await openInstitutionDetail(page)
    await fillWithdrawForm(page, 'ADMIN', '관리자 귀책 테스트')
    await page.getByRole('button', { name: '활동 포기', exact: true }).last().click()

    await expect(page.getByText('활동 포기 실패', { exact: true })).toBeVisible({ timeout: 10_000 })
    expect(state.requests).toEqual([
      { stopScheduleId: STOP_SCHEDULE_ID, reason: '관리자 귀책 테스트', faultParty: 'ADMIN' },
    ])
    await expect(page.getByRole('dialog', { name: '활동 포기' })).toBeHidden()
    await expect(page.getByRole('button', { name: '활동 포기', exact: true })).toBeVisible()
  })
})
