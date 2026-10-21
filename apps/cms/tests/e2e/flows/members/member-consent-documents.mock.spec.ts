import { test, expect } from '../../fixtures/test'
import {
  createAgreementNoticeDraft,
  createAgreementPortraitDraft,
  createEducatorFacilitatorPledgeDraft,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'
import { createPaymentStatementPreConsentDraft } from '@jakorea/form-schema/paragraph-ids'

const memberId = 701
const memberName = 'Mock 동의서 회원'
const memberBId = 702
const memberBName = 'Mock 회원 B'
const consentTypes = [
  'PAYMENT_STATEMENT_PRE_CONSENT',
  'PORTRAIT_RIGHTS',
  'FACILITATOR_PLEDGE',
  'ADMINISTRATIVE_INFO_CONSENT',
  'CRIMINAL_HISTORY_CHECK_CONSENT',
]

function filledSchema(consentType: string) {
  const draft: WritingFormDraft =
    consentType === 'PAYMENT_STATEMENT_PRE_CONSENT'
      ? createPaymentStatementPreConsentDraft()
      : consentType === 'PORTRAIT_RIGHTS'
        ? createAgreementPortraitDraft()
      : consentType === 'FACILITATOR_PLEDGE'
          ? createEducatorFacilitatorPledgeDraft()
          : createAgreementNoticeDraft()
  const marker = `MOCK-${consentType}-SUBMISSION`
  const explanation = draft.paragraphs.find(
    paragraph => paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text'
  )
  if (explanation?.kind === 'single_item' && explanation.variant === 'agreement_explanation_text') {
    explanation.bodyText = marker
  }
  const title = draft.paragraphs.find(
    paragraph => paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'
  )
  if (title?.kind === 'description' && title.variant === 'survey_title_with_period') {
    title.surveyTitle = marker
  }
  return JSON.stringify({
    schemaVersion: 1,
    formSettings: draft.formSettings,
    paragraphs: draft.paragraphs,
  })
}

async function expectSubmittedMarkerVisible(
  page: import('@playwright/test').Page,
  marker: string
) {
  const markerText = page.getByText(marker, { exact: true })
  await expect
    .poll(
      () => markerText.evaluateAll(elements => elements.some(element => element.checkVisibility())),
      { timeout: 30_000 }
    )
    .toBe(true)
}

async function openMember(page: import('@playwright/test').Page, unavailablePortrait = false) {
  const apiCalls: string[] = []
  await page.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (!url.pathname.startsWith('/api/')) return route.continue()
    apiCalls.push(`${request.method()} ${url.pathname}${url.search}`)
    const pathname = url.pathname
    if (pathname === '/api/admin/me') {
      return route.fulfill({ json: { adminAccountId: 171601, name: 'Mock 관리자', roleCode: 'MASTER', permissionCodes: ['*'] } })
    }
    if ((pathname === '/api/admin/users' || pathname === '/api/admin/members/all') && request.method() === 'GET') {
      return route.fulfill({ json: { items: [memberId, memberBId].map((id, index) => ({ id: String(id), memberId: id, accountId: id, accountType: 'MEMBER', name: index === 0 ? memberName : memberBName, email: `mock-member-${id}@example.invalid`, roles: ['INSTRUCTOR'], status: 'ACTIVE' })), page: 0, size: 20, totalElements: 2, totalPages: 1 } })
    }
    const memberPathMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\//)
    const requestedMemberId = memberPathMatch ? Number(memberPathMatch[1]) : memberId
    const detailMatch = pathname.match(/^\/api\/admin\/users\/(701|702)\/instructor$/)
    if (detailMatch) {
      return route.fulfill({ json: { member: { memberId: requestedMemberId, name: requestedMemberId === memberId ? memberName : memberBName, email: `mock-member-${requestedMemberId}@example.invalid`, roles: ['INSTRUCTOR'], status: 'ACTIVE' }, termsAgreements: consentTypes.map(termsType => ({ termsType, agreed: true, agreedAt: '2026-01-01T00:00:00Z' })) } })
    }
    if (pathname === `/api/admin/users/${requestedMemberId}/consents`) {
      return route.fulfill({ json: consentTypes.map(termsType => ({ consentType: termsType, agreed: true, agreedAt: '2026-01-01T00:00:00Z' })) })
    }
    if (pathname === `/api/admin/users/${requestedMemberId}/consent-records`) {
      return route.fulfill({ json: consentTypes.map((consentType, index) => ({ consentType, consentValue: true, formResponseId: 900 + index, filledDocumentId: 1000 + index, filledDocumentAvailable: true })) })
    }
    if (/\/api\/admin\/users\/\d+\/comments$/.test(pathname)) return route.fulfill({ json: [] })
    if (/\/api\/admin\/users\/\d+\/external-identifiers$/.test(pathname)) {
      return route.fulfill({ json: [] })
    }
    if (pathname.endsWith('/filled-document') && request.method() === 'POST') {
      const consentType = pathname.split('/').at(-2) ?? ''
      if (unavailablePortrait && consentType === 'PORTRAIT_RIGHTS') {
        return route.fulfill({ status: 410, json: { code: 'PORTRAIT_CONSENT_CONTENT_UNAVAILABLE', message: 'Unavailable mock submission' } })
      }
      const requestMemberId = Number(pathname.match(/users\/(\d+)\//)?.[1] ?? memberId)
      return route.fulfill({ json: { memberId: requestMemberId, consentType, filledDocumentId: 1000, schemaJson: filledSchema(consentType) } })
    }
    // This test must never reach an API server or an unhandled endpoint.
    return route.fulfill({ status: 404, json: { message: 'Unmocked E2E API request' } })
  })

  await page.goto('/users/list?kind=all')
  await expect(page.getByText(memberName).first()).toBeVisible({ timeout: 30_000 })
  await page.getByText(memberName).first().click()
  await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('지급조서 사전 동의서').first()).toBeVisible({ timeout: 30_000 })
  return apiCalls
}

test.describe('회원 상세 동의서 Mock 브라우저 회귀', () => {
  test('E01 지급조서 작성본을 열람한다', async ({ page }) => {
    const calls = await openMember(page)
    await page.getByRole('button', { name: '동의서 보기' }).nth(1).click()
    await expect(page.getByText(/열람 사유/).first()).toBeVisible()
    const reason = page.getByPlaceholder('열람 사유를 입력해 주세요')
    await reason.fill('Mock E2E 검증')
    await page.getByRole('button', { name: '정보 열람' }).click()
    await expectSubmittedMarkerVisible(page, 'MOCK-PAYMENT_STATEMENT_PRE_CONSENT-SUBMISSION')
    expect(calls.filter(call => call.includes('/filled-document')).length).toBe(1)
  })

  test('E02 초상권 제출본 조회에 기록 ID를 포함한다', async ({ page }) => {
    const calls = await openMember(page)
    await page.getByRole('button', { name: '동의서 보기' }).first().click()
    await expectSubmittedMarkerVisible(page, 'MOCK-PORTRAIT_RIGHTS-SUBMISSION')
    expect(calls.some(call => call.includes('consentRecordId='))).toBe(false)
  })

  test('E03 교육진행자 서약서 작성 내용이 DOM에 표시된다', async ({ page }) => {
    await openMember(page)
    await page.getByRole('button', { name: '동의서 보기' }).nth(2).click()
    await expectSubmittedMarkerVisible(page, 'MOCK-FACILITATOR_PLEDGE-SUBMISSION')
  })

  test('E04 행정정보 공동이용 작성 내용을 표시한다', async ({ page }) => {
    await openMember(page)
    await page.getByRole('button', { name: '동의서 보기' }).nth(3).click()
    await expect(page.getByText(/열람 사유/).first()).toBeVisible()
    await page.getByPlaceholder('열람 사유를 입력해 주세요').fill('Mock E2E 검증')
    await page.getByRole('button', { name: '정보 열람' }).click()
    await expectSubmittedMarkerVisible(page, 'MOCK-ADMINISTRATIVE_INFO_CONSENT-SUBMISSION')
  })

  test('E05 초상권 410 오류에 안내를 보이고 상태를 유지한다', async ({ page }) => {
    await openMember(page, true)
    await page.getByRole('button', { name: '동의서 보기' }).first().click()
    const unavailableMessage = page.locator('.member-consent-agreement-modal__error')
    await expect(unavailableMessage).toBeVisible({ timeout: 30_000 })
    await expect(unavailableMessage).not.toBeEmpty()
    await expect(page.getByText('동의', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/MOCK-PORTRAIT_RIGHTS-SUBMISSION/)).toHaveCount(0)
  })

  test('E06 성범죄 제출본이 없을 때 조회 요청과 템플릿 미리보기가 없다', async ({ page }) => {
    const calls = await openMember(page)
    await page.getByRole('button', { name: '동의서 보기' }).nth(4).click()
    await expect(page.locator('.member-consent-agreement-modal__error')).toContainText('원본')
    await expect(page.getByText(/MOCK-CRIMINAL_HISTORY_CHECK_CONSENT-SUBMISSION/)).toHaveCount(0)
    expect(calls.filter(call => call.includes('/filled-document'))).toHaveLength(0)
  })

  test('E07 회원을 바꾸면 이전 작성본이 남지 않는다', async ({ page }) => {
    await openMember(page)
    await page.getByRole('button', { name: '동의서 보기' }).nth(1).click()
    await page.getByPlaceholder('열람 사유를 입력해 주세요').fill('Mock E2E 검증')
    await page.getByRole('button', { name: '정보 열람' }).click()
    await expectSubmittedMarkerVisible(page, 'MOCK-PAYMENT_STATEMENT_PRE_CONSENT-SUBMISSION')
    await page.getByRole('button', { name: '닫기' }).last().click()
    await page.getByRole('button', { name: '닫기' }).first().click()
    await expect(page.getByText(/MOCK-PAYMENT_STATEMENT_PRE_CONSENT-SUBMISSION/)).toHaveCount(0)
    await page.getByText(memberBName).first().click()
    await expect(page.getByRole('dialog').first()).toBeVisible()
    await expect(page.getByText(memberBName).first()).toBeVisible()
    await expect(page.getByText(/MOCK-PAYMENT_STATEMENT_PRE_CONSENT-SUBMISSION/)).toHaveCount(0)
  })

  test('E08 한 번 보기 동작에서 작성본 중복 조회가 없다', async ({ page }) => {
    const calls = await openMember(page)
    await page.getByRole('button', { name: '동의서 보기' }).nth(2).click()
    await expectSubmittedMarkerVisible(page, 'MOCK-FACILITATOR_PLEDGE-SUBMISSION')
    await expect.poll(() => calls.filter(call => call.includes('/filled-document')).length).toBe(1)
  })
})
