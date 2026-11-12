import { readBrowserAccessToken } from '../../../../helpers/browser-access-token'
import { test, expect } from '../../../../fixtures/test'
import { UjatProgramDetailPage } from '../../../../pages/ujat-program-detail.page'
import { UJAT_DETAIL_SEED_CANDIDATES } from '../../../../pages/ujat-program-seed-titles'
import { expectAuthenticatedShell } from '../../../../helpers/authenticated-shell'
import { withAuthenticatedPage } from '../../../../helpers/with-authenticated-page'

type ApiEnvelope = {
  data?: unknown
  success?: boolean
  message?: string
}

function unwrap(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body
  const envelope = body as ApiEnvelope
  return envelope.data ?? body
}

function isVolunteerApplicationsRequest(url: string): boolean {
  return /\/api\/admin\/programs\/[^/]+\/volunteer-applications(?:\?|$)/.test(url)
}

function recruitHalf(url: string): string | null {
  return new URL(url).searchParams.get('recruitHalf')
}

/**
 * UJAT 상세의 API 정합성 보강 스모크.
 *
 * 기존 셸 스모크와 달리 다음을 직접 확인한다.
 * - 상세 GET이 성공하고 programId가 응답에 포함되는지
 * - 상·하반기 봉사자 화면이 서로 다른 recruitHalf를 요청하는지
 * - 하반기 화면도 상반기와 동일한 실제 탭 집합을 통과하는지
 *
 * 실제 UJAT 데이터가 없거나 상세 셸을 열 수 없는 환경은 PASS가 아니라 skip으로 기록한다.
 * 실행 보고서에서는 해당 실행을 BLOCKED로 분류할 수 있도록 원인을 함께 남긴다.
 */
test.describe('UJAT 프로그램 상세 API 정합성', () => {
  let programId = ''

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(240_000)
    await withAuthenticatedPage(browser, async page => {
      await page.goto('/programs/ujat')
      await expectAuthenticatedShell(page)
      const detail = new UjatProgramDetailPage(page)
      const opened = await detail.tryOpenPreferredDetailSeed()
      if (opened) programId = opened.programId
    })
  })

  test.beforeEach(() => {
    test.skip(
      !programId,
      `시드 없음 또는 상세 셸 실패: ${UJAT_DETAIL_SEED_CANDIDATES.join(' | ')}`
    )
  })

  test('상세 GET 응답의 식별자와 URL programId가 일치한다', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)
    const token = await readBrowserAccessToken(page, 'cms')
    expect(token, '화면 요청에서 관리자 access token을 찾지 못했습니다').toBeTruthy()
    const apiOrigin = process.env.E2E_API_PROXY_TARGET?.replace(/\/$/, '') ?? ''
    const response = await page.request.get(
      `${apiOrigin}/api/admin/programs/${encodeURIComponent(programId)}`,
      {
      headers: { Authorization: `Bearer ${token}` },
      }
    )
    expect(response.ok(), `상세 API HTTP ${response.status()}`).toBe(true)

    const payload = unwrap(await response.json())
    expect(payload).toBeTruthy()
    expect(JSON.stringify(payload)).toContain(programId)

    const detail = new UjatProgramDetailPage(page)
    expect(await detail.gotoDetail(programId, 'info', 'info')).toBe(true)
    expect(new URL(page.url()).searchParams.get('programId')).toBe(programId)
  })

  test('상·하반기 봉사자 목록 요청이 recruitHalf로 분리된다', async ({ page }) => {
    test.setTimeout(180_000)
    await page.goto('/programs/ujat')
    await expectAuthenticatedShell(page)

    const volunteerRequests: string[] = []
    const volunteerResponses: Array<{ url: string; status: number }> = []
    const handleRequest = (request: import('@playwright/test').Request) => {
      if (isVolunteerApplicationsRequest(request.url())) volunteerRequests.push(request.url())
    }
    const handleResponse = (response: import('@playwright/test').Response) => {
      if (isVolunteerApplicationsRequest(response.url())) {
        volunteerResponses.push({ url: response.url(), status: response.status() })
      }
    }
    page.on('request', handleRequest)
    page.on('response', handleResponse)

    try {
      const detail = new UjatProgramDetailPage(page)
      const h1Opened = await detail.openAnyTabs(programId, 'volunteer_h1', [
        'vh1_all',
        'vh1_doc1',
        'vh1_doc_passed',
        'vh1_interview2',
      ])
      const h2Opened = await detail.openAnyTabs(programId, 'volunteer_h2', [
        'vh2_all',
        'vh2_doc1',
        'vh2_doc_passed',
        'vh2_interview2',
      ])

      test.info().annotations.push({
        type: 'api-integrity',
        description: `programId=${programId} h1=${h1Opened.join(',') || 'none'} h2=${h2Opened.join(',') || 'none'}`,
      })

      const h1Requests = volunteerRequests.filter(url => recruitHalf(url) === 'FIRST_HALF')
      const h2Requests = volunteerRequests.filter(url => recruitHalf(url) === 'SECOND_HALF')
      const h1Responses = volunteerResponses.filter(item => recruitHalf(item.url) === 'FIRST_HALF')
      const h2Responses = volunteerResponses.filter(item => recruitHalf(item.url) === 'SECOND_HALF')

      expect(h1Opened).toContain('vh1_all')
      expect(h2Opened).toContain('vh2_all')
      expect(h1Requests.length, '상반기 봉사자 API에 FIRST_HALF가 필요합니다').toBeGreaterThan(0)
      expect(h2Requests.length, '하반기 봉사자 API에 SECOND_HALF가 필요합니다').toBeGreaterThan(0)
      expect(h1Responses.length, '상반기 봉사자 API 응답이 없습니다').toBeGreaterThan(0)
      expect(h2Responses.length, '하반기 봉사자 API 응답이 없습니다').toBeGreaterThan(0)
      expect(
        volunteerResponses.every(item => item.status === 200),
        '봉사자 목록 API가 모두 HTTP 200이어야 합니다'
      ).toBe(true)
      expect(volunteerRequests.some(url => recruitHalf(url) === null)).toBe(false)
    } finally {
      page.off('request', handleRequest)
      page.off('response', handleResponse)
    }
  })
})
