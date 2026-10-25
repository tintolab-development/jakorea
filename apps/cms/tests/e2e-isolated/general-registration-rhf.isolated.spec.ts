import { expect, test } from '@playwright/test'
import {
  GeneralProgramRegistrationPage,
  REGISTRATION_CASES,
} from '../e2e/pages/general-program-registration.page'
import {
  assertIsolatedNetwork,
  installIsolatedRegistrationNetwork,
  type IsolatedNetworkLog,
} from './install-isolated-network'

const ORG_CURRICULUM_SINGLE = REGISTRATION_CASES.find(
  row => row.audience === 'organization' && row.structure === 'curriculum' && row.session === 'single'
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
  await expect(page.getByPlaceholder('대표 프로그램명을 입력하세요').first()).toBeVisible({
    timeout: 30_000,
  })
}

async function runRepresentativeCase(
  page: import('@playwright/test').Page,
  log: IsolatedNetworkLog,
  audience: 'organization' | 'individual'
) {
  const regCase =
    audience === 'organization' ? ORG_CURRICULUM_SINGLE : INDIVIDUAL_SCHEDULE_SINGLE
  if (regCase == null) throw new Error('등록 케이스를 찾지 못했습니다')

  const registration = new GeneralProgramRegistrationPage(page, regCase, {
    skipOptionalUploads: true,
    safeWagePaymentItems: true,
    programTitle: `격리RHF-${regCase.label}-${Date.now()}`,
  })
  await registration.openNewRegistration()
  await expectWizardOpen(page)
  await registration.fillCommonInfo()
  await registration.goToRecruitment()
  await registration.fillRecruitmentInfo()
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
  // P2(방안 C): 양식 PUT/binding은 CREATE 이후에 나간다.
  await expect
    .poll(() => log.formVersionPuts.length + log.formBindings.length, { timeout: 30_000 })
    .toBeGreaterThan(0)
  expect(log.programDraftRequests).toHaveLength(0)
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
      expect(typeof overlays.find(overlay => overlay['application.institution.teacherTel'])?.[
        'application.institution.teacherTel'
      ]).toBe('string')
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
