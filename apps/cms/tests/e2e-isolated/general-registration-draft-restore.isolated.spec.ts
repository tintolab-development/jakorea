import { expect, test, type Page } from '@playwright/test'
import {
  GeneralProgramRegistrationPage,
  REGISTRATION_CASES,
} from '../e2e/pages/general-program-registration.page'
import { ISOLATED_GENERAL_FIXTURE, installIsolatedRegistrationNetwork } from './install-isolated-network'

/**
 * STEP 4.1 PHASE 5 — GENERAL 임시저장 → 종료 → 이어서 작성 → 복원 → 새로고침 유지.
 * localStorage 전용(서버 임시저장 없음, registration-fullpage-modal.tsx:386).
 */
const ORG = REGISTRATION_CASES.find(
  r => r.audience === 'organization' && r.structure === 'curriculum' && r.session === 'single'
)!
const REMARK = /^비고란을 작성하세요/

async function confirmDraftSave(page: Page) {
  await page.getByRole('button', { name: '임시저장' }).click()
  const overwrite = page.getByRole('dialog').filter({ hasText: '임시 저장본 덮어쓰기' })
  if (await overwrite.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await overwrite.getByRole('button', { name: '임시 저장', exact: true }).click()
  }
  const saved = page.getByRole('dialog').filter({ hasText: '임시 저장 완료' })
  await expect(saved).toBeVisible({ timeout: 20_000 })
  await saved.getByRole('button', { name: '확인' }).click()
}

async function recruitTab(page: Page, name: string) {
  const t = page.getByRole('tab', { name }).first()
  await t.click()
  await expect(t).toHaveAttribute('aria-selected', 'true')
}

async function snapshot(page: Page) {
  await recruitTab(page, '참여 기관 모집 정보')
  const org = await page.getByPlaceholder(REMARK).first().inputValue()
  await recruitTab(page, '강사 모집 정보')
  const inst = await page.getByPlaceholder(REMARK).first().inputValue()
  await recruitTab(page, '봉사자 모집 정보')
  const vol = await page.getByPlaceholder(REMARK).first().inputValue()
  return { org, inst, vol }
}

test('GENERAL 임시저장 → 이어서 작성 복원 → 새로고침 유지', async ({ page }) => {
  test.setTimeout(480_000)
  const log = await installIsolatedRegistrationNetwork(page)
  await page.goto('/programs/general')
  const title = `격리DRAFT-${Date.now()}`
  const reg = new GeneralProgramRegistrationPage(page, ORG, {
    skipOptionalUploads: true,
    safeWagePaymentItems: true,
    programTitle: title,
    detailedProgramLabel: ISOLATED_GENERAL_FIXTURE.detailedProgramName,
    sponsorLabel: ISOLATED_GENERAL_FIXTURE.sponsorName,
    sponsorManagerLabel: ISOLATED_GENERAL_FIXTURE.contactName,
    paymentItemLabel: ISOLATED_GENERAL_FIXTURE.paymentItemName,
  })
  await reg.openNewRegistration()
  await reg.fillCommonInfo()
  const publicName = await page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first().inputValue()
  await reg.goToRecruitment()
  await reg.fillRecruitmentInfo()
  // 역할별 구분 값(마지막 입력) — 빈 Seed로 초기화되면 잡힌다
  for (const [tab, v] of [
    ['참여 기관 모집 정보', 'DRAFT 기관 비고'],
    ['강사 모집 정보', 'DRAFT 강사 비고'],
    ['봉사자 모집 정보', 'DRAFT 봉사 비고'],
  ] as const) {
    await recruitTab(page, tab)
    await page.getByPlaceholder(REMARK).first().fill(v)
  }
  const before = await snapshot(page)
  expect(before).toEqual({ org: 'DRAFT 기관 비고', inst: 'DRAFT 강사 비고', vol: 'DRAFT 봉사 비고' })
  await reg.goToApplication()
  await reg.fillApplicationInfo()

  await confirmDraftSave(page)
  // 양식 초안은 writingFormTemplateSaves.v1 안의 templateId=registration-wizard:GENERAL:{code} (registration-wizard-form-draft.ts:14-16)
  const store = await page.evaluate(() => ({
    saves: localStorage.getItem('cms.jakorea.writingFormTemplateSaves.v1') ?? '',
    program: localStorage.getItem('cms.jakorea.registrationProgramDrafts.v1') ?? '',
  }))
  const wizardIds = [...new Set(store.saves.match(/registration-wizard:GENERAL:[^"\\]+/g) ?? [])]
  console.log('[DRAFT] wizard ids', JSON.stringify(wizardIds), 'programDraft GENERAL', store.program.includes('GENERAL'))
  expect(wizardIds.length, 'registration-wizard:GENERAL:* 키').toBeGreaterThan(0)
  // GENERAL Program Draft는 메타(activeStep·제목)만, 모집 값은 탭별 registration-wizard 초안에 있다
  expect(store.program).toContain(title)
  for (const v of ['DRAFT 기관 비고', 'DRAFT 강사 비고', 'DRAFT 봉사 비고']) expect(store.saves, `초안에 ${v}`).toContain(v)

  await page.getByRole('banner').filter({ hasText: '일반 프로그램 등록' }).getByLabel('닫기').click()
  const leave = page.getByRole('dialog').filter({ hasText: '작성 취소 안내' })
  if (await leave.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await leave.getByRole('button', { name: '저장 안 함' }).click()
  }
  await expect(page.getByRole('button', { name: /신규 등록/ })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: /신규 등록/ }).click()
  const notice = page.getByRole('dialog').filter({ hasText: '임시저장 이력 안내' })
  await expect(notice).toBeVisible({ timeout: 20_000 })
  await notice.getByRole('radio', { name: '이어서 작성' }).check()
  await notice.getByRole('button', { name: '이어서 작성' }).click()
  await expect(page.getByText('일반 프로그램 등록', { exact: true })).toBeVisible({ timeout: 30_000 })
  console.log('[DRAFT] resume URL', page.url())

  const verify = async (label: string) => {
    // 저장 시점 activeStep(application-*)으로 복원된다 → 신청 → 모집 → 공통 순으로 거슬러 확인
    await expect(page.getByRole('button', { name: '모집 정보 돌아가기' }), `${label} 신청 단계 복원`).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('격리 협력 기관').first(), `${label} 신청 양식 제3자 제공받는 곳`).toBeVisible()
    await page.getByRole('button', { name: '모집 정보 돌아가기' }).click()
    await expect(page).toHaveURL(/generalStep=recruit-/, { timeout: 15_000 })
    expect(await snapshot(page), `${label} 모집 비고 복원`).toEqual(before)
    const back = page.getByRole('button', { name: /(공통|기본|프로그램) 정보 돌아가기/ }).first()
    if (await back.isVisible().catch(() => false)) {
      await back.click()
      await expect(page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first(), `${label} 대표명`).toHaveValue(title)
      await expect(page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first(), `${label} 공고명`).toHaveValue(publicName)
      await reg.goToRecruitment()
    } else {
      console.log('[DRAFT] 공통 정보 돌아가기 버튼 없음', label)
    }
    await reg.goToApplication()
  }
  await verify('이어서 작성')
  await page.reload()
  await expect(page.getByText('일반 프로그램 등록', { exact: true })).toBeVisible({ timeout: 45_000 })
  console.log('[DRAFT] reload URL', page.url())
  await verify('새로고침')
  expect(log.unexpected).toEqual([])
})
