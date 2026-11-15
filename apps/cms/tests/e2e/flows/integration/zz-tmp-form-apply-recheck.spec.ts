/**
 * 임시 재검증(커밋 금지): 일반(기관) 등록 직후 「일부 양식 적용 실패」 재현율·실패 요청·[다시 시도] 복구 확인.
 */
import fs from 'node:fs'
import { type Page, type Response } from '@playwright/test'
import { expect, test } from '../../fixtures/test'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'
import { requireCmsAccessToken } from '../../helpers/browser-access-token'
import { GeneralProgramRegistrationPage } from '../../pages/general-program-registration.page'

const OUT = process.env.FORM_APPLY_RECHECK_OUT ?? 'test-results/form-apply-recheck.json'
const RUNS = Number(process.env.FORM_APPLY_RECHECK_RUNS ?? 3)

type Captured = {
  at: string
  method: string
  url: string
  status: number
  requestBody: string
  responseBody: string
}

function isFormApi(url: string) {
  return /\/api\/admin\/(form-templates|programs\/\d+\/form-bindings|form-template-versions)/.test(url)
}

async function capture(res: Response, sink: Captured[], all: Captured[]) {
  const req = res.request()
  const url = req.url()
  if (!isFormApi(url)) return
  const row: Captured = {
    at: new Date().toISOString(),
    method: req.method(),
    url: url.replace(/^https?:\/\/[^/]+/, ''),
    status: res.status(),
    requestBody: (req.postData() ?? '').slice(0, 600),
    responseBody: res.status() >= 400 ? (await res.text().catch(() => '')).slice(0, 800) : '',
  }
  if (req.method() !== 'GET') all.push({ ...row, requestBody: '', responseBody: '' })
  if (res.status() >= 400) sink.push(row)
}

async function formBindings(page: Page, programId: string) {
  const token = await requireCmsAccessToken(page, '양식 바인딩 조회')
  const res = await page.request.get(`/api/admin/programs/${programId}/form-bindings`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  return { status: res.status(), body: text.slice(0, 3000) }
}

test('일부 양식 적용 실패 재현·[다시 시도] 복구 재검증', async ({ page }) => {
  test.setTimeout(RUNS * 300_000)
  test.skip(process.env.E2E_ALLOW_MUTATION !== '1', '데이터 생성은 E2E_ALLOW_MUTATION=1일 때만')
  const report: unknown[] = []

  for (let run = 1; run <= RUNS; run += 1) {
    const failures: Captured[] = []
    const writes: Captured[] = []
    const onResponse = (res: Response) => {
      void capture(res, failures, writes)
    }
    page.on('response', onResponse)

    await page.goto('/programs/general')
    await expectAuthenticatedShell(page)
    const title = `E2E-양식적용재검증-${Date.now()}-${run}`
    const registration = new GeneralProgramRegistrationPage(
      page,
      { audience: 'organization', structure: 'schedule', session: 'multi', label: `양식재검증_${run}` },
      {
        openRecruitment: true,
        safeWagePaymentItems: true,
        skipOptionalUploads: true,
        skipApplicationFormEdits: true,
        ensureFutureDates: true,
        strictRecruitment: true,
        programTitle: title,
      }
    )
    await registration.openNewRegistration()
    await registration.fillCommonInfo()
    await registration.realignScheduleDetailDatesWithinOpenPeriod()
    await registration.goToRecruitment()
    await registration.fillRecruitmentInfo()
    await registration.goToApplication()
    await registration.fillApplicationInfo()
    const created = await registration.completeRegistration()

    // 「일부 양식 적용 실패」 팝업이 남아 있으면 문구 기록 후 [다시 시도]로 복구를 확인한다.
    const partial = page.getByRole('dialog').filter({ hasText: '일부 양식 적용 실패' })
    const partialShown = await partial
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)
    const firstFailureText = partialShown ? (await partial.innerText()).replace(/\s+/g, ' ') : null
    const retries: Array<{ attempt: number; resultText: string; newFailures: Captured[] }> = []
    if (partialShown) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const before = failures.length
        const retryButton = page.getByRole('dialog').getByRole('button', { name: '다시 시도' })
        if (!(await retryButton.isVisible().catch(() => false))) break
        await retryButton.click()
        // 재적용 완료까지: 실패 팝업이 다시 뜨거나 성공 팝업이 뜨거나 팝업이 닫힐 때까지 기다린다.
        await expect
          .poll(async () => (await retryButton.isEnabled().catch(() => false)) || !(await retryButton.isVisible().catch(() => false)), {
            timeout: 60_000,
          })
          .toBe(true)
        const dialogText = await page
          .getByRole('dialog')
          .last()
          .innerText()
          .catch(() => '(팝업 없음)')
        retries.push({
          attempt,
          resultText: dialogText.replace(/\s+/g, ' ').slice(0, 300),
          newFailures: failures.slice(before),
        })
        if (!dialogText.includes('일부 양식 적용 실패')) break
      }
    }

    page.off('response', onResponse)
    const bindings = created.programId ? await formBindings(page, created.programId) : null
    report.push({
      run,
      title,
      programId: created.programId,
      partialFailureShown: partialShown,
      firstFailureText,
      failedFormRequests: failures,
      formWriteRequests: writes,
      retries,
      bindings,
    })
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
    // 남은 팝업 정리
    const closeButton = page.getByRole('dialog').getByRole('button', { name: /확인|닫기/ }).first()
    if (await closeButton.isVisible().catch(() => false)) await closeButton.click()
  }
  console.log(`[FORM-APPLY-RECHECK] 결과 저장: ${OUT}`)
})
