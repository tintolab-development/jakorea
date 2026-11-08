import { expect, test, type Page, type Route } from '@playwright/test'
import { installIsolatedRegistrationNetwork } from './install-isolated-network'
import { deepMerge } from './general-detail-mock'

/**
 * STEP 4.2 PHASE 2 — Gemini 모집 저장은 전용 Hook(`updateGeminiRecruitmentRemote`)을 쓴다.
 * 일반 프로그램 overlay 제거 경로를 타지 않아야 한다.
 */
const PROGRAM_ID = 88001
const LIST_PATH = '/programs/gemini/visiting-training'
const DETAIL_PATH = `${LIST_PATH}?recruitmentId=${PROGRAM_ID}`
const API_PREFIX = '/api/admin/gemini/trainings/recruitments'

function parseJson(v: unknown): Record<string, any> {
  if (v == null) return {}
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {}
}

function seedDetail() {
  return {
    programId: PROGRAM_ID,
    programCode: 'GEMINI-ISO-88001',
    programType: 'GEMINI_TRAINING',
    draftStatus: 'PUBLISHED',
    nameKo: '격리 Gemini 모집',
    description: '기존 프로그램 설명',
    applicationStartDate: '2027-03-01',
    applicationEndDate: '2027-03-31',
    trainingRequestStartDate: '2027-04-01',
    trainingRequestEndDate: '2027-04-30',
    businessStartDate: '2027-03-01',
    businessEndDate: '2027-04-30',
    minimumParticipantCount: 20,
    targetLevels: ['adult'],
    recruitmentTargetDetail: '기존 상세 대상',
    educationForm: 'offline',
    educationStructure: 'SCHEDULE',
    contactName: '연수팀',
    contactPhone: '02-0000-0000',
    contactEmail: 'gemini-iso@jakorea.org',
    remarks: '기존 비고',
    otherMatters: '기존 비고',
    recruitmentGuide: '기존 모집 안내',
    applicationMethod: '온라인 신청',
    learningSupportContent: '기존 학습 지원',
    additionalContentHtml: '기존 추가',
    attachmentFileNames: [],
    createdAt: '2027-01-01T00:00:00.000Z',
    createdByName: '격리 E2E 관리자',
    updatedAt: '2027-01-02T00:00:00.000Z',
    updatedByName: '격리 E2E 관리자',
  }
}

async function installGeminiRecruitMock(page: Page) {
  const detail = seedDetail()
  let sidecar = {
    geminiRecruitment: {
      title: detail.nameKo,
      notes: detail.remarks,
      educationForm: detail.educationForm,
      educationTargetDetail: detail.recruitmentTargetDetail,
      keepUnknown: 'sidecar-keep',
    },
  }
  const mutations: Array<{ method: string; path: string; body: any }> = []

  await page.route(`**/api/admin/gemini/trainings/**`, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    const pathname = url.pathname
    if (method === 'GET' && pathname === API_PREFIX) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              programId: PROGRAM_ID,
              programType: 'GEMINI_TRAINING',
              nameKo: detail.nameKo,
              draftStatus: detail.draftStatus,
              applicationStartDate: detail.applicationStartDate,
              applicationEndDate: detail.applicationEndDate,
              trainingRequestStartDate: detail.trainingRequestStartDate,
              trainingRequestEndDate: detail.trainingRequestEndDate,
            },
          ],
          page: 0,
          size: 20,
          totalElements: 1,
        }),
      })
      return
    }
    if (method === 'GET' && pathname === `${API_PREFIX}/${PROGRAM_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
      return
    }
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], items: [], page: 0, size: 20, totalElements: 0 }),
      })
      return
    }
    let body: any = null
    try {
      body = req.postDataJSON()
    } catch {
      body = req.postData()
    }
    mutations.push({ method, path: pathname, body })
    if (method === 'PATCH' && pathname === `${API_PREFIX}/${PROGRAM_ID}` && body && typeof body === 'object') {
      sidecar = deepMerge(sidecar, parseJson(body.serviceDetailJson))
      const persist = parseJson(body.serviceDetailJson).geminiRecruitment ?? {}
      if (typeof body.title === 'string') detail.nameKo = body.title
      if (body.recruitmentTargetDetail !== undefined || persist.educationTargetDetail !== undefined) {
        detail.recruitmentTargetDetail = body.recruitmentTargetDetail ?? persist.educationTargetDetail
      }
      if (body.educationForm !== undefined) detail.educationForm = body.educationForm
      if (body.applicationStartDate !== undefined) detail.applicationStartDate = body.applicationStartDate
      if (body.applicationEndDate !== undefined) detail.applicationEndDate = body.applicationEndDate
      if (body.description !== undefined) detail.description = body.description
      if (body.otherMatters !== undefined) {
        detail.otherMatters = body.otherMatters
        detail.remarks = body.otherMatters
      }
      detail.updatedAt = new Date().toISOString()
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: PROGRAM_ID, title: detail.nameKo, programType: 'GEMINI_TRAINING' }),
    })
  })

  return {
    mutations,
    getDetail: () => detail,
    getSidecar: () => sidecar,
  }
}

async function dismissSaved(page: Page) {
  const saved = page.getByRole('dialog').filter({ hasText: /수정 완료|수정되었습니다/ })
  if (await saved.first().isVisible().catch(() => false)) {
    await saved.getByRole('button', { name: '확인' }).first().click()
  }
}

test('Gemini 모집정보 1필드 수정 저장: 전용 PATCH·sidecar 유지·기간/교육형태 유지', async ({ page }) => {
  await installIsolatedRegistrationNetwork(page)
  const { mutations, getDetail, getSidecar } = await installGeminiRecruitMock(page)
  await page.goto(DETAIL_PATH)
  await expect(page.getByRole('navigation', { name: '찾아가는 연수 상세 메뉴' })).toBeVisible({
    timeout: 45_000,
  })
  await expect(page.getByText('기존 상세 대상').first()).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: '정보 수정' }).first().click()
  await expect(page).toHaveURL(/edit=info/, { timeout: 15_000 })
  const input = page.getByPlaceholder('상세 교육 대상을 입력해 주세요').first()
  await input.fill('GEMINI 상세 대상 수정')
  await expect(input).toHaveValue('GEMINI 상세 대상 수정')
  const before = mutations.length
  await page.getByRole('button', { name: '저장', exact: true }).first().click()
  await expect
    .poll(() => mutations.slice(before).some(m => m.method === 'PATCH'), { timeout: 30_000 })
    .toBeTruthy()
  await dismissSaved(page)

  const patches = mutations.slice(before).filter(m => m.method === 'PATCH')
  expect(patches.map(p => p.path)).toEqual([`${API_PREFIX}/${PROGRAM_ID}`])
  const body = patches[0].body as Record<string, any>
  expect(JSON.stringify(body)).toContain('GEMINI 상세 대상 수정')
  expect(body.educationForm, '교육 형태 불필요 변경 없음').toBe('offline')
  expect(String(body.applicationStartDate ?? '')).toContain('2027-03-01')
  expect(String(body.applicationEndDate ?? '')).toContain('2027-03-31')
  const sdj = parseJson(body.serviceDetailJson)
  expect(sdj.geminiRecruitment, 'geminiRecruitment sidecar 전송').toBeTruthy()
  expect(sdj.registration?.overlay, '일반 overlay 제거 경로를 Gemini에 적용하지 않음').toBeUndefined()

  const after = getDetail()
  expect(after.recruitmentTargetDetail).toBe('GEMINI 상세 대상 수정')
  expect(after.educationForm).toBe('offline')
  expect(after.applicationStartDate).toBe('2027-03-01')
  expect(after.description).toBe('기존 프로그램 설명')
  expect(getSidecar().geminiRecruitment.keepUnknown).toBe('sidecar-keep')

  await page.goto(DETAIL_PATH)
  await expect(page.getByText('GEMINI 상세 대상 수정').first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('기존 프로그램 설명').first()).toBeVisible()
})
