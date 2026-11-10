/**
 * 1사1교 등록 위저드 — 미리보기·임시저장·복원·탭 값 보존·등록 완료/상세·실패 모드 격리 E2E (추가 검증)
 * 기존 isolated mock(install-cs-isolated-network)과 helper만 사용한다. 제품 코드 변경 없음.
 */
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import {
  assertIsolatedNetwork,
  CS_ISOLATED_IDS,
  installCsIsolatedNetwork,
  overlayFromCreateBody,
  overlayFromFormVersionPut,
  type IsolatedNetworkLog,
} from './install-cs-isolated-network'
import {
  completeAndCapture,
  createOverlay,
  dismissVisibleDialogs,
  fillInstitutionRecruitMedia,
  fillRegistrationThroughComplete,
  openFreshWizard,
  saveWizardDraft,
  VALUES_B,
  waitWizard,
} from './cs-isolated-helpers'
import { clickSectionNavIfVisible } from '../e2e/pages/form-helpers'

test.describe.configure({ mode: 'default' })

const RECIPIENT = 'JA코리아'
const CONTACT = 'JA Korea 1사1교 운영팀'
const DRAFT_KEY = 'cms.jakorea.writingFormTemplateSaves.v1'
const META_KEY = 'cms.jakorea.registrationProgramDrafts.v1'
const CS_FORM_KEY_PREFIX = 'registration-wizard:COMPANY_SCHOOL:'

type FieldSnapshot = Record<string, string>

function collectEvidence(page: Page) {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 500))
  })
  page.on('pageerror', err => consoleErrors.push(`pageerror: ${String(err).slice(0, 500)}`))
  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} ${req.failure()?.errorText ?? ''}`)
  })
  return { consoleErrors, failedRequests }
}

async function attachEvidence(
  testInfo: TestInfo,
  page: Page,
  log: IsolatedNetworkLog,
  ev: ReturnType<typeof collectEvidence>,
  extra: Record<string, unknown> = {}
) {
  const activeTabs = await page
    .locator('[role="tab"][aria-selected="true"]')
    .allInnerTexts()
    .catch(() => [])
  const payload = {
    url: page.url(),
    activeTabs,
    consoleErrors: ev.consoleErrors,
    failedRequests: ev.failedRequests,
    unexpected: log.unexpected,
    blockedExternal: log.blockedExternal,
    mutations: log.mutations.map(m => `${m.method} ${m.path}`),
    programDraftRequests: log.programDraftPuts.length,
    ...extra,
  }
  await testInfo.attach('cs-evidence.json', {
    body: JSON.stringify(payload, null, 2),
    contentType: 'application/json',
  })
}

/** 현재 화면에 보이는 입력 DOM 값 스냅샷(다이얼로그 제외, 숨김 탭 제외) */
async function snapshotVisibleFields(page: Page): Promise<FieldSnapshot> {
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  return page.evaluate(() => {
    const out: Record<string, string> = {}
    const counts: Record<string, number> = {}
    const els = Array.from(document.querySelectorAll('input, textarea')) as Array<
      HTMLInputElement | HTMLTextAreaElement
    >
    const isShown = (el: Element | null): boolean => {
      if (!el) return false
      const r = (el as HTMLElement).getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return false
      const s = getComputedStyle(el as HTMLElement)
      return s.visibility !== 'hidden' && s.display !== 'none'
    }
    // 등록 위저드 자체가 full-page dialog이므로 위저드 dialog 내부만 대상으로 하고, 그 위의 알림 dialog는 제외한다.
    const wizard = Array.from(document.querySelectorAll('[role="dialog"]')).filter(d =>
      (d.textContent ?? '').includes('1사1교 프로그램 등록')
    )
    const root = wizard.at(-1) ?? null
    for (const el of els) {
      if (root == null || !root.contains(el)) continue
      if (el.closest('[role="dialog"]') !== root) continue
      if (el.closest('.template-preview-modal')) continue
      const type = (el as HTMLInputElement).type ?? 'textarea'
      if (type === 'file' || type === 'hidden') continue
      const isToggle = type === 'radio' || type === 'checkbox'
      const host = isToggle ? (el.closest('label') ?? el.parentElement) : el
      if (!isShown(host)) continue
      const base =
        el.getAttribute('placeholder') ||
        el.getAttribute('aria-label') ||
        (isToggle
          ? `${type}:${(el.closest('label')?.textContent ?? '').trim().slice(0, 30)}`
          : '') ||
        el.getAttribute('name') ||
        type
      const n = counts[base] ?? 0
      counts[base] = n + 1
      out[`${base}#${n}`] = isToggle
        ? String((el as HTMLInputElement).checked)
        : (el as HTMLInputElement).value
    }
    return out
  })
}

function diffSnapshots(before: FieldSnapshot, after: FieldSnapshot): string[] {
  const diffs: string[] = []
  for (const [key, value] of Object.entries(before)) {
    if (!value || value === 'false') continue
    if (after[key] !== value) diffs.push(`${key}: "${value}" -> "${after[key] ?? '(missing)'}"`)
  }
  return diffs
}

const institutionRecruitTab = (page: Page) =>
  page.getByRole('tab', { name: /참여 기관 모집|참여자 모집/ }).first()
const instructorRecruitTab = (page: Page) => page.getByRole('tab', { name: /강사 모집/ }).first()
const institutionAppTab = (page: Page) => page.getByRole('tab', { name: /참여 기관 신청/ }).first()
const instructorAppTab = (page: Page) => page.getByRole('tab', { name: /강사 신청/ }).first()

async function selectTab(page: Page, tab: ReturnType<typeof institutionRecruitTab>) {
  await expect(tab).toBeVisible({ timeout: 15_000 })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
}

async function goRecruitStepFromApplication(page: Page) {
  await page.getByRole('button', { name: '모집 정보 돌아가기' }).click()
  await expect(page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
    timeout: 30_000,
  })
}

async function goApplicationStepFromRecruit(page: Page) {
  await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
  const required = page.getByRole('dialog').filter({ hasText: '필수 항목 입력 안내' })
  if (await required.isVisible().catch(() => false)) {
    throw new Error('신청 단계 이동이 필수 항목 입력 안내로 차단됨')
  }
  await expect(page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
    timeout: 30_000,
  })
}

async function goCommonStepFromApplication(page: Page) {
  await goRecruitStepFromApplication(page)
  await page.getByRole('button', { name: '공통 정보 돌아가기' }).click()
  await expect(page.getByRole('button', { name: '모집 정보 작성하기' })).toBeVisible({
    timeout: 30_000,
  })
}

const previewShell = (page: Page) =>
  page.locator('.template-preview-modal__shell').filter({ hasText: '미리보기' }).last()

async function openPreviewText(page: Page): Promise<string> {
  const preview = page.getByRole('button', { name: '미리보기' }).first()
  await expect(preview).toBeVisible({ timeout: 10_000 })
  await preview.click()
  const shell = previewShell(page)
  await expect(shell).toBeVisible({ timeout: 15_000 })
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined)
  await page.waitForTimeout(500)
  const shellText = await shell.innerText()
  // 모집 미리보기는 Platform 화면을 same-origin iframe으로 렌더한다 — iframe 본문까지 읽는다.
  const iframe = shell.locator('iframe')
  if ((await iframe.count()) === 0) return shellText
  const frame = shell.frameLocator('iframe').first()
  await expect
    .poll(
      async () =>
        (
          (await frame
            .locator('body')
            .innerText()
            .catch(() => '')) ?? ''
        ).trim().length,
      {
        timeout: 20_000,
      }
    )
    .toBeGreaterThan(20)
  await page.waitForTimeout(1_000)
  const frameText = await frame
    .locator('body')
    .innerText()
    .catch(() => '')
  const frameImages = await frame
    .locator('img')
    .count()
    .catch(() => 0)
  return `${shellText}\n[iframe]\n${frameText}\n[iframe-img-count=${frameImages}]`
}

async function closePreview(page: Page) {
  const close = page.getByRole('button', { name: '미리보기 닫기' })
  if (await close.isVisible().catch(() => false)) {
    await close.click()
  } else {
    await page.locator('.template-preview-modal__title-close').last().click()
  }
  await expect(previewShell(page)).toBeHidden({ timeout: 10_000 })
}

async function readSavedCsRecords(page: Page) {
  return page.evaluate(
    ({ draftKey, metaKey, prefix }) => {
      const saves = JSON.parse(localStorage.getItem(draftKey) ?? '{}') as {
        byTemplateId?: Record<string, unknown>
      }
      const meta = JSON.parse(localStorage.getItem(metaKey) ?? '{}') as {
        byProgramType?: Record<string, unknown>
      }
      const recipientKeys = Object.entries(saves.byTemplateId ?? {})
        .filter(([, record]) => JSON.stringify(record).includes('JA코리아'))
        .map(([key, record]) => {
          const raw = JSON.stringify(record)
          const at = raw.indexOf('JA코리아')
          return `${key} @ ${raw.slice(Math.max(0, at - 160), at + 20)}`
        })
      const storageKeysWithRecipient: string[] = []
      for (const [label, store] of [
        ['local', localStorage],
        ['session', sessionStorage],
      ] as const) {
        for (let i = 0; i < store.length; i += 1) {
          const k = store.key(i)
          if (k && (store.getItem(k) ?? '').includes('JA코리아'))
            storageKeysWithRecipient.push(`${label}:${k}`)
        }
      }
      return {
        storageKeysWithRecipient,
        recipientKeys,
        csFormKeys: Object.keys(saves.byTemplateId ?? {}).filter(k => k.startsWith(prefix)),
        allFormKeys: Object.keys(saves.byTemplateId ?? {}),
        metaTypes: Object.keys(meta.byProgramType ?? {}),
        meta: meta.byProgramType ?? {},
      }
    },
    { draftKey: DRAFT_KEY, metaKey: META_KEY, prefix: CS_FORM_KEY_PREFIX }
  )
}

async function continueDraftFromList(page: Page) {
  await page.goto('/programs/company-school')
  const createButton = page.getByRole('button', { name: '신규 등록' }).first()
  await expect(createButton).toBeVisible({ timeout: 45_000 })
  await createButton.click()
  const draftDialog = page.getByRole('dialog').filter({ hasText: '임시 저장 이력 안내' })
  await expect(draftDialog).toBeVisible({ timeout: 20_000 })
  await draftDialog.getByRole('radio', { name: '이어서 작성' }).check()
  await draftDialog.getByRole('button', { name: '이어서 작성' }).click()
  await waitWizard(page)
}

/** 복원 시 저장된 activeStep(신청 단계 등)으로 열릴 수 있으므로 공통 정보 단계로 되돌린다 */
async function ensureCommonStep(page: Page) {
  // 이어서 작성 직후 저장된 activeStep으로 비동기 전환되므로 단계가 안정될 때까지 기다린다.
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
  await page.waitForTimeout(2_000)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await dismissVisibleDialogs(page)
    const registrationDone = page.getByRole('heading', { name: '등록 완료' })
    if (await registrationDone.isVisible().catch(() => false)) return
    const failOverlay = page.locator('.ant-modal-wrap').filter({ hasText: /등록 실패|서버 오류/ })
    if (await failOverlay.isVisible().catch(() => false)) {
      await failOverlay.getByRole('button', { name: '확인' }).click()
      await expect(failOverlay).toBeHidden({ timeout: 10_000 })
    }
    const recruitBack = page.getByRole('button', { name: '모집 정보 돌아가기' })
    if (await recruitBack.isVisible().catch(() => false)) {
      await recruitBack.click()
      await expect(page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
        timeout: 30_000,
      })
    }
    const commonBack = page.getByRole('button', { name: '공통 정보 돌아가기' })
    if (await commonBack.isVisible().catch(() => false)) {
      await commonBack.click()
    }
    await page.waitForTimeout(1_000)
    const onCommon = await page
      .getByRole('button', { name: '모집 정보 작성하기' })
      .isVisible()
      .catch(() => false)
    const onLaterStep =
      (await page
        .getByRole('button', { name: '모집 정보 돌아가기' })
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByRole('button', { name: '공통 정보 돌아가기' })
        .isVisible()
        .catch(() => false))
    if (onCommon && !onLaterStep) break
  }
  await expect(page.getByRole('button', { name: '모집 정보 작성하기' })).toBeVisible({
    timeout: 30_000,
  })
  await clickSectionNavIfVisible(page, '기본 정보')
  await expect(page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()).toBeVisible({
    timeout: 20_000,
  })
}

const COMMON_SECTIONS = ['기본 정보', '사업 KPI 목표', '임금 정보', '교육 진행 일정 설정'] as const

/** 공통정보는 섹션 네비게이션별로 렌더될 수 있어 섹션마다 스냅샷 후 병합한다 */
async function snapshotCommonSections(page: Page): Promise<FieldSnapshot> {
  const merged: FieldSnapshot = {}
  for (const section of COMMON_SECTIONS) {
    await clickSectionNavIfVisible(page, section)
    await page.waitForTimeout(300)
    const snap = await snapshotVisibleFields(page)
    for (const [key, value] of Object.entries(snap)) {
      if (!(key in merged)) merged[key] = value
      else if (merged[key] !== value) merged[`${section}|${key}`] = value
    }
  }
  await clickSectionNavIfVisible(page, '기본 정보')
  return merged
}

async function snapshotWizardAllSteps(page: Page) {
  // 공통 → 모집(기관/강사) → 신청(기관/강사)
  await ensureCommonStep(page)
  const common = await snapshotCommonSections(page)
  await page.getByRole('button', { name: '모집 정보 작성하기' }).click()
  await expect(page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
    timeout: 30_000,
  })
  await selectTab(page, institutionRecruitTab(page))
  const recruitInstitution = await snapshotVisibleFields(page)
  await selectTab(page, instructorRecruitTab(page))
  const recruitInstructor = await snapshotVisibleFields(page)
  await goApplicationStepFromRecruit(page)
  await selectTab(page, institutionAppTab(page))
  await clickSectionNavIfVisible(page, '개인정보')
  const appInstitutionText = await page
    .locator('[data-paragraph-id*="third-party"]')
    .first()
    .innerText({ timeout: 15_000 })
    .catch(() => '')
  await selectTab(page, instructorAppTab(page))
  await clickSectionNavIfVisible(page, '개인정보')
  const appInstructorText = await page
    .locator('[data-paragraph-id*="third-party"]')
    .first()
    .innerText({ timeout: 15_000 })
    .catch(() => '')
  return { common, recruitInstitution, recruitInstructor, appInstitutionText, appInstructorText }
}

/** 기준선: 기존 helper로 전체 입력 후 신청 단계 · 참여 기관 신청 탭 위치에 둔다 */
async function fillAll(page: Page) {
  await fillRegistrationThroughComplete(page)
}

test.describe('CS 추가 검증 — 탭 값 보존·미리보기·임시저장·복원·완료', () => {
  test('CS-X01 기관→강사→기관→강사→신청 이동 시 모집 값이 유지되고 신청 탭 값·일정 placeholder 확인', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000)
    const ev = collectEvidence(page)
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillAll(page)
    // 신청 단계에서 모집 단계로 돌아가 탭 토글
    await goRecruitStepFromApplication(page)
    await selectTab(page, institutionRecruitTab(page))
    const inst1 = await snapshotVisibleFields(page)
    await selectTab(page, instructorRecruitTab(page))
    const instr1 = await snapshotVisibleFields(page)
    await selectTab(page, institutionRecruitTab(page))
    const inst2 = await snapshotVisibleFields(page)
    await selectTab(page, instructorRecruitTab(page))
    const instr2 = await snapshotVisibleFields(page)
    // 신청 단계 갔다가 다시 모집으로
    await goApplicationStepFromRecruit(page)
    await goRecruitStepFromApplication(page)
    await selectTab(page, instructorRecruitTab(page))
    const instr3 = await snapshotVisibleFields(page)
    await selectTab(page, institutionRecruitTab(page))
    const inst3 = await snapshotVisibleFields(page)

    // 신청 단계: 제공받는 곳, 강의 진행 가능 일정 placeholder
    await goApplicationStepFromRecruit(page)
    await selectTab(page, instructorAppTab(page))
    const instructorAppText = await page.locator('body').innerText()
    const scheduleHint = page
      .getByText('기관 프로그램은 기관이 신청한 희망 일정 및 시간이 노출되며', { exact: false })
      .first()
    const scheduleHintVisible = await scheduleHint.isVisible().catch(() => false)
    await selectTab(page, institutionAppTab(page))
    const thirdParty = page.locator('[data-paragraph-id*="third-party"]').first()
    const recipientVisibleInstitution = await thirdParty
      .getByText(RECIPIENT, { exact: true })
      .first()
      .isVisible()
      .catch(() => false)
    await selectTab(page, instructorAppTab(page))
    const recipientVisibleInstructor = await page
      .locator('[data-paragraph-id*="third-party"]')
      .first()
      .getByText(RECIPIENT, { exact: true })
      .first()
      .isVisible()
      .catch(() => false)

    const diffs = {
      institutionAfterToggle: diffSnapshots(inst1, inst2),
      institutionAfterStepNav: diffSnapshots(inst1, inst3),
      instructorAfterToggle: diffSnapshots(instr1, instr2),
      instructorAfterStepNav: diffSnapshots(instr1, instr3),
    }
    await attachEvidence(testInfo, page, log, ev, {
      diffs,
      inst1,
      instr1,
      scheduleHintVisible,
      recipientVisibleInstitution,
      recipientVisibleInstructor,
      instructorAppTextHead: instructorAppText.slice(0, 2000),
    })
    expect(Object.keys(inst1).length, '기관 모집 탭 입력 필드 수').toBeGreaterThan(3)
    expect(Object.keys(instr1).length, '강사 모집 탭 입력 필드 수').toBeGreaterThan(3)
    expect(instr1['담당 문의처#0']).toBe(CONTACT)
    expect(instr1['상세 모집 대상을 입력해 주세요#0']).toBe('성인 강사')
    expect(diffs.institutionAfterToggle, '기관 모집 값 유지(탭 토글)').toEqual([])
    expect(diffs.instructorAfterToggle, '강사 모집 값 유지(탭 토글) — STEP 2.7 회귀').toEqual([])
    expect(diffs.institutionAfterStepNav, '기관 모집 값 유지(단계 이동)').toEqual([])
    expect(diffs.instructorAfterStepNav, '강사 모집 값 유지(단계 이동)').toEqual([])
    expect(recipientVisibleInstitution, '참여 기관 신청 제공받는 곳 유지').toBe(true)
    expect(scheduleHintVisible, '강의 진행 가능 일정은 등록 모드 placeholder 안내').toBe(true)
    assertIsolatedNetwork(log)
  })

  test('CS-X02 등록 중 미리보기: 내용 표시·닫기 후 값/탭 유지·재진입 동일·최신값 반영', async ({
    page,
  }, testInfo) => {
    test.setTimeout(360_000)
    const ev = collectEvidence(page)
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillAll(page)
    // 미디어(썸네일) 업로드 포함
    await goRecruitStepFromApplication(page)
    await fillInstitutionRecruitMedia(page)

    // 모집 단계 · 기관 탭 미리보기
    await selectTab(page, institutionRecruitTab(page))
    const beforeInst = await snapshotVisibleFields(page)
    const recruitInstPreview1 = await openPreviewText(page)
    const recruitInstImages = await previewShell(page).locator('img').count()
    await closePreview(page)
    await expect(institutionRecruitTab(page)).toHaveAttribute('aria-selected', 'true')
    const afterInst = await snapshotVisibleFields(page)
    const recruitInstPreview2 = await openPreviewText(page)
    await closePreview(page)

    // 모집 단계 · 강사 탭 미리보기
    await selectTab(page, instructorRecruitTab(page))
    const beforeInstr = await snapshotVisibleFields(page)
    const recruitInstrPreview = await openPreviewText(page)
    await closePreview(page)
    await expect(instructorRecruitTab(page)).toHaveAttribute('aria-selected', 'true')
    const afterInstr = await snapshotVisibleFields(page)

    // 신청 단계 · 기관 신청 탭 미리보기
    await goApplicationStepFromRecruit(page)
    await selectTab(page, institutionAppTab(page))
    const appPreview1 = await openPreviewText(page)
    await closePreview(page)
    await expect(institutionAppTab(page)).toHaveAttribute('aria-selected', 'true')
    const appPreview2 = await openPreviewText(page)
    await closePreview(page)
    await selectTab(page, instructorAppTab(page))
    const instructorAppPreview = await openPreviewText(page)
    await closePreview(page)

    // 공통정보 미리보기 + 최신값 반영(stale overlay 확인): 대표 프로그램명 변경 후 재미리보기
    await goCommonStepFromApplication(page)
    const commonPreviewButtonVisible = await page
      .getByRole('button', { name: '미리보기' })
      .first()
      .isVisible()
      .catch(() => false)
    // 플랫폼 미리보기는 공고용 프로그램명을 노출하므로 공고용 프로그램명을 바꿔 최신값 반영(stale overlay 여부)을 본다.
    await clickSectionNavIfVisible(page, '기본 정보')
    const titleInput = page.getByPlaceholder('모집 시 노출될 프로그램명을 입력해 주세요').first()
    const newTitle = 'RHF-C-미리보기최신'
    await titleInput.fill(newTitle)
    await page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expect(page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
    await selectTab(page, institutionRecruitTab(page))
    const recruitPreviewAfterTitleChange = await openPreviewText(page)
    await closePreview(page)

    const presence = (text: string) => ({
      title: text.includes(VALUES_B.title),
      announcement: text.includes(VALUES_B.announcement),
      newTitle: text.includes(newTitle),
      contact: text.includes(CONTACT),
      tel: text.includes('02-1234-5678'),
      email: text.includes('company-school-e2e@jakorea.org'),
      recipient: text.includes(RECIPIENT),
      kpi20: /(^|\D)20(\D|$)/.test(text),
      wage111000: /111,?000/.test(text),
      thumbName: text.includes('cs-thumb.png'),
      periodLike: /20\d\d[.-]\s?\d{1,2}[.-]/.test(text),
    })
    const report = {
      recruitInstitution: presence(recruitInstPreview1),
      recruitInstructor: presence(recruitInstrPreview),
      applicationInstitution: presence(appPreview1),
      applicationInstructor: presence(instructorAppPreview),
      afterTitleChange: presence(recruitPreviewAfterTitleChange),
      recruitInstImages,
      commonPreviewButtonVisible,
      instDiff: diffSnapshots(beforeInst, afterInst),
      instrDiff: diffSnapshots(beforeInstr, afterInstr),
      reopenSameInstitution: recruitInstPreview1 === recruitInstPreview2,
      reopenSameApplication: appPreview1 === appPreview2,
      recruitInstPreviewHead: recruitInstPreview1.slice(0, 3000),
      recruitInstrPreviewHead: recruitInstrPreview.slice(0, 3000),
      appPreviewHead: appPreview1.slice(0, 3000),
      afterTitleChangeHead: recruitPreviewAfterTitleChange.slice(0, 1500),
    }
    await attachEvidence(testInfo, page, log, ev, { preview: report })

    expect(report.instDiff, '미리보기 닫은 뒤 기관 모집 값 유지').toEqual([])
    expect(report.instrDiff, '미리보기 닫은 뒤 강사 모집 값 유지').toEqual([])
    expect(report.reopenSameInstitution, '기관 모집 미리보기 재진입 동일').toBe(true)
    expect(report.reopenSameApplication, '신청 미리보기 재진입 동일').toBe(true)
    expect(report.applicationInstitution.recipient, '신청 미리보기 최신 제공받는 곳').toBe(true)
    expect(
      report.recruitInstitution.contact || report.recruitInstructor.contact,
      '모집 문의처 표시'
    ).toBe(true)
    expect(report.afterTitleChange.newTitle, '미리보기가 최신 공고용 프로그램명을 표시').toBe(true)
    expect(
      report.afterTitleChange.announcement,
      '미리보기가 이전(stale) 공고명을 표시하지 않음'
    ).toBe(false)
    expect(report.recruitInstitution.announcement, '기관 모집 미리보기 프로그램명').toBe(true)
    expect(
      report.recruitInstitution.periodLike || /\d{4}년 \d{1,2}월/.test(recruitInstPreview1),
      '기간 표시'
    ).toBe(true)
    assertIsolatedNetwork(log)
  })

  test('CS-X03 임시저장 → 종료 → 이어서 작성 → 새로고침 → 단계 이동 복원 + 타 유형 draft 격리', async ({
    page,
  }, testInfo) => {
    test.setTimeout(360_000)
    const ev = collectEvidence(page)
    const log = await installCsIsolatedNetwork(page)
    // 다른 프로그램 유형 draft fixture(격리 확인용) — 이 브라우저 컨텍스트 localStorage 한정
    await page.addInitScript(
      ({ metaKey }) => {
        if (sessionStorage.getItem('__cs_x03_seeded')) return
        sessionStorage.setItem('__cs_x03_seeded', '1')
        const meta = JSON.parse(localStorage.getItem(metaKey) ?? '{"version":1,"byProgramType":{}}')
        meta.version = 1
        meta.byProgramType = meta.byProgramType ?? {}
        meta.byProgramType.GENERAL = {
          version: 1,
          activeStep: 'program',
          registrationTemplateCode: 'registration-general',
          formVersions: {},
          savedAt: '2026-11-01T00:00:00.000Z',
          programTitleKo: 'ISOLATION-GENERAL-DRAFT',
        }
        localStorage.setItem(metaKey, JSON.stringify(meta))
      },
      { metaKey: META_KEY }
    )
    await openFreshWizard(page)
    await fillAll(page)
    await goRecruitStepFromApplication(page)
    await fillInstitutionRecruitMedia(page)
    await goApplicationStepFromRecruit(page)
    // 저장 전 기준 스냅샷
    await goCommonStepFromApplication(page)
    const base = await snapshotWizardAllSteps(page)
    await saveWizardDraft(page)
    const savedState = await readSavedCsRecords(page)
    expect(savedState.csFormKeys.length, 'COMPANY_SCHOOL 양식 draft 키').toBeGreaterThan(0)
    expect(log.programDraftPuts).toHaveLength(0)

    // 종료 → 재진입 → 이어서 작성
    await continueDraftFromList(page)
    const restored = await snapshotWizardAllSteps(page)
    // 새로고침 후 복원
    await page.reload()
    const draftDialogAfterReload = page
      .getByRole('dialog')
      .filter({ hasText: '임시 저장 이력 안내' })
    if (await draftDialogAfterReload.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await draftDialogAfterReload.getByRole('radio', { name: '이어서 작성' }).check()
      await draftDialogAfterReload.getByRole('button', { name: '이어서 작성' }).click()
    }
    const urlAfterReload = page.url()
    let refreshed: Awaited<ReturnType<typeof snapshotWizardAllSteps>> | null = null
    let refreshError = ''
    try {
      // 새로고침 시 URL(generalStep=…&registrationDraft=continue)의 단계로 바로 열린다 — 위저드 노출 후 공통 단계로 이동
      await expect(page.getByText('1사1교 프로그램 등록', { exact: true })).toBeVisible({
        timeout: 45_000,
      })
      refreshed = await snapshotWizardAllSteps(page)
    } catch (error) {
      refreshError = String(error).slice(0, 800)
    }
    // 새로고침 경로가 위저드를 유지하지 않으면 목록 재진입으로 2차 복원 확인
    await continueDraftFromList(page)
    const restored2 = await snapshotWizardAllSteps(page)
    const finalState = await readSavedCsRecords(page)

    const diffs = {
      restoreCommon: diffSnapshots(base.common, restored.common),
      restoreRecruitInstitution: diffSnapshots(
        base.recruitInstitution,
        restored.recruitInstitution
      ),
      restoreRecruitInstructor: diffSnapshots(base.recruitInstructor, restored.recruitInstructor),
      baseAppInstitutionRecipient: base.appInstitutionText.includes(RECIPIENT),
      baseAppInstructorRecipient: base.appInstructorText.includes(RECIPIENT),
      restoreAppInstitutionRecipient: restored.appInstitutionText.includes(RECIPIENT),
      refreshAppInstitutionRecipient: refreshed?.appInstitutionText.includes(RECIPIENT) ?? null,
      restoredAppInstitutionTextHead: restored.appInstitutionText.slice(0, 600),
      restoreAppInstructorRecipient: restored.appInstructorText.includes(RECIPIENT),
      refreshCommon: refreshed ? diffSnapshots(base.common, refreshed.common) : ['NOT_RUN'],
      refreshRecruitInstitution: refreshed
        ? diffSnapshots(base.recruitInstitution, refreshed.recruitInstitution)
        : ['NOT_RUN'],
      refreshRecruitInstructor: refreshed
        ? diffSnapshots(base.recruitInstructor, refreshed.recruitInstructor)
        : ['NOT_RUN'],
      restore2Common: diffSnapshots(base.common, restored2.common),
      restore2RecruitInstructor: diffSnapshots(base.recruitInstructor, restored2.recruitInstructor),
      thumbAfterRestore: restored.recruitInstitution,
    }
    const generalMetaAfter = finalState.meta.GENERAL as { programTitleKo?: string } | undefined
    await attachEvidence(testInfo, page, log, ev, {
      diffs,
      urlAfterReload,
      refreshError,
      savedState,
      finalState: { ...finalState, meta: undefined },
      generalMetaAfter,
      baseCommon: base.common,
      baseRecruitInstructor: base.recruitInstructor,
    })
    expect(diffs.restoreCommon, '이어서 작성 — 공통(KPI·강사비 포함)').toEqual([])
    expect(diffs.restoreRecruitInstitution, '이어서 작성 — 기관 모집').toEqual([])
    expect(diffs.restoreRecruitInstructor, '이어서 작성 — 강사 모집').toEqual([])
    expect(diffs.baseAppInstitutionRecipient, '저장 전 제3자 제공받는 곳 입력됨').toBe(true)
    expect(diffs.restoreAppInstitutionRecipient, '이어서 작성 — 제3자 제공받는 곳').toBe(true)
    expect(diffs.refreshAppInstitutionRecipient, '새로고침 — 제3자 제공받는 곳').toBe(true)
    expect(refreshError, '새로고침 후 위저드 복원').toBe('')
    expect(diffs.refreshCommon, '새로고침 — 공통').toEqual([])
    expect(diffs.refreshRecruitInstructor, '새로고침 — 강사 모집').toEqual([])
    expect(diffs.restore2Common).toEqual([])
    expect(diffs.restore2RecruitInstructor).toEqual([])
    expect(generalMetaAfter?.programTitleKo, '일반 프로그램 draft 격리').toBe(
      'ISOLATION-GENERAL-DRAFT'
    )
    expect(
      finalState.allFormKeys.filter(k => k.startsWith('registration-wizard:GENERAL:'))
    ).toEqual([])
    assertIsolatedNetwork(log)
  })

  test('CS-X04 legacy draft(overlay only, canonical 없음) fixture 복원', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000)
    const ev = collectEvidence(page)
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillAll(page)
    await saveWizardDraft(page)
    // 이 테스트 브라우저 컨텍스트의 저장본을 legacy 모양(settingsJson canonical 제거 + economyRegistration overlay)으로 변환
    const converted = await page.evaluate(
      ({ draftKey }) => {
        const file = JSON.parse(localStorage.getItem(draftKey) ?? '{}') as {
          byTemplateId?: Record<string, Record<string, unknown>>
        }
        const key = 'registration-wizard:COMPANY_SCHOOL:registration-economy'
        const record = file.byTemplateId?.[key]
        if (!record) return { ok: false, keys: Object.keys(file.byTemplateId ?? {}) }
        const settings = { ...((record.settingsJson as Record<string, unknown>) ?? {}) }
        const hadCanonical = 'companySchoolRegistrationCanonical' in settings
        delete settings.companySchoolRegistrationCanonical
        record.settingsJson = settings
        record.overlay = {
          'economyRegistration.basicInfo.repKo': 'LEGACY-CS-대표명',
          'economyRegistration.basicInfo.repEn': 'LEGACY CS EN',
          'economyRegistration.basicInfo.publicProgramTitle': 'LEGACY-CS-공고명',
          'economyRegistration.kpi.participantCount': '33',
          'economyRegistration.kpi.instructor': 3,
          'economyRegistration.wageInfo.grade1Fee': 151000,
        }
        localStorage.setItem(draftKey, JSON.stringify(file))
        return { ok: true, hadCanonical, keys: Object.keys(file.byTemplateId ?? {}) }
      },
      { draftKey: DRAFT_KEY }
    )
    expect(converted.ok, `legacy fixture 대상 키 존재: ${JSON.stringify(converted)}`).toBe(true)
    await continueDraftFromList(page)
    const restoredUrl = page.url()
    await ensureCommonStep(page)
    const common = await snapshotCommonSections(page)
    await attachEvidence(testInfo, page, log, ev, { converted, common, restoredUrl })
    expect(common['대표 프로그램명을 입력해 주세요#0']).toBe('LEGACY-CS-대표명')
    expect(common['모집 시 노출될 프로그램명을 입력해 주세요#0']).toBe('LEGACY-CS-공고명')
    expect(common['목표값 입력#0']).toMatch(/^33$/)
    assertIsolatedNetwork(log)
  })

  test('CS-X05 등록 완료: CREATE→Form Version PUT/Publish→등록 완료 모달→확인→상세 URL·값 일치', async ({
    page,
  }, testInfo) => {
    test.setTimeout(360_000)
    const ev = collectEvidence(page)
    const log = await installCsIsolatedNetwork(page)
    const detailGets: Array<{ path: string; body: unknown }> = []
    page.on('response', async response => {
      const url = new URL(response.url())
      if (
        response.request().method() === 'GET' &&
        url.pathname === `/api/admin/programs/${CS_ISOLATED_IDS.PROGRAM_ID}`
      ) {
        detailGets.push({ path: url.pathname, body: await response.json().catch(() => null) })
      }
    })
    await openFreshWizard(page)
    await fillAll(page)
    await goRecruitStepFromApplication(page)
    await fillInstitutionRecruitMedia(page)
    await goApplicationStepFromRecruit(page)
    const requiredDialog = page.getByRole('dialog').filter({ hasText: '필수 항목 입력 안내' })
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await page.waitForTimeout(500)
    const requiredBlocked = await requiredDialog.isVisible().catch(() => false)
    expect(requiredBlocked, '필수 항목 검사 통과').toBe(false)
    await expect.poll(() => log.createProgram, { timeout: 90_000 }).not.toBeNull()
    const successDialog = page.getByRole('dialog').filter({ hasText: '등록되었습니다.' })
    // 비동기 렌더 — 실제 노출까지 대기
    await expect(successDialog).toBeVisible({ timeout: 90_000 })
    await expect(successDialog.getByText('등록 완료', { exact: true })).toBeVisible()
    const successText = await successDialog.innerText()
    await page.screenshot({
      path: testInfo.outputPath('cs-x05-success-modal.png'),
      fullPage: false,
    })
    const putsAtModal = log.formVersionPuts.length
    const publishesAtModal = log.formVersionPublishes.length
    const createIndex = log.mutations.findIndex(
      m => m.method === 'POST' && m.path === '/api/admin/programs'
    )
    const firstPutIndex = log.mutations.findIndex(
      m => m.method === 'PUT' && m.path.includes('/form-template-versions/')
    )
    const firstPublishIndex = log.mutations.findIndex(m => m.path.endsWith('/publish'))
    await successDialog.getByRole('button', { name: '확인' }).click()
    await expect(successDialog).toBeHidden({ timeout: 20_000 })
    await expect(page.getByText('1사1교 프로그램 등록', { exact: true })).toBeHidden({
      timeout: 30_000,
    })
    await expect(page).toHaveURL(new RegExp(`programId=${CS_ISOLATED_IDS.PROGRAM_ID}`), {
      timeout: 60_000,
    })
    const url = new URL(page.url())
    await expect(page.getByRole('button', { name: '정보 수정' }).first()).toBeVisible({
      timeout: 45_000,
    })
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
    await page.screenshot({ path: testInfo.outputPath('cs-x05-detail.png'), fullPage: true })
    const detailText = await page.locator('body').innerText()

    const createBody = (log.createProgram?.body ?? {}) as Record<string, unknown>
    const createRes = (await page.evaluate(() => null)) ?? null
    void createRes
    const createdOverlay = createOverlay(log)
    const lastGet = detailGets.at(-1)?.body as Record<string, unknown> | undefined
    const getOverlay = overlayFromCreateBody(lastGet)
    const compareKeys = Object.keys(createdOverlay)
    const overlayMismatch = compareKeys.filter(
      key => JSON.stringify(createdOverlay[key]) !== JSON.stringify(getOverlay[key])
    )
    const scalarKeys = ['title', 'mainTitle', 'programType', 'programName', 'titleEn']
    const scalarMismatch = scalarKeys.filter(
      key => key in createBody && JSON.stringify(createBody[key]) !== JSON.stringify(lastGet?.[key])
    )
    const applicationPut = log.formVersionPuts.find(item => {
      const overlay = overlayFromFormVersionPut(item.body)
      return (
        Object.keys(overlay).some(key => key.startsWith('application.economy.')) ||
        JSON.stringify(item.body ?? '').includes('program-application-economy-seed')
      )
    })
    const detailPresence = {
      title: detailText.includes(VALUES_B.title),
      announcement: detailText.includes(VALUES_B.announcement),
      titleEn: detailText.includes(VALUES_B.titleEn),
      kpi20: /(^|\D)20(\D|$)/.test(detailText),
      wage111000: /111,?000/.test(detailText),
    }
    await attachEvidence(testInfo, page, log, ev, {
      successText,
      urlParams: Object.fromEntries(url.searchParams.entries()),
      createResponseProgramId: CS_ISOLATED_IDS.PROGRAM_ID,
      putsAtModal,
      publishesAtModal,
      order: { createIndex, firstPutIndex, firstPublishIndex },
      formBindings: log.formBindings,
      detailGetCount: detailGets.length,
      overlayMismatch,
      scalarMismatch,
      detailPresence,
      createKeys: Object.keys(createBody),
      thumbnailPuts: log.thumbnailPuts.map(p => p.body),
    })
    expect(successText).toContain('등록 완료')
    expect(successText).toContain('등록되었습니다.')
    expect(createIndex).toBeGreaterThanOrEqual(0)
    expect(putsAtModal, '모달 시점 Form Version PUT').toBeGreaterThan(0)
    expect(publishesAtModal, '모달 시점 Publish').toBeGreaterThan(0)
    expect(firstPutIndex).toBeGreaterThan(createIndex)
    expect(applicationPut, '신청 Form Version PUT').toBeTruthy()
    expect(url.searchParams.get('programId')).toBe(String(CS_ISOLATED_IDS.PROGRAM_ID))
    expect(url.searchParams.get('lnb')).toBe('info')
    expect(url.searchParams.get('tab')).toBe('info')
    expect(url.searchParams.get('new')).toBeNull()
    expect(detailGets.length, '상세 GET 발생').toBeGreaterThan(0)
    expect(overlayMismatch, 'CREATE overlay vs 상세 GET overlay').toEqual([])
    expect(scalarMismatch, 'CREATE scalar vs 상세 GET').toEqual([])
    expect(detailPresence.title).toBe(true)
    expect(detailPresence.announcement).toBe(true)
    expect(log.thumbnailPuts.length, '썸네일 바인딩 PUT').toBeGreaterThan(0)
    assertIsolatedNetwork(log)
  })

  test('CS-X06 CREATE 실패: 중복 클릭 1건·입력 유지·재시도 가능·성공 모달 없음', async ({
    page,
  }, testInfo) => {
    test.setTimeout(300_000)
    const ev = collectEvidence(page)
    const log = await installCsIsolatedNetwork(page, { failMode: 'create' })
    await openFreshWizard(page)
    await fillAll(page)
    const button = page.getByRole('button', { name: '프로그램 등록 완료' })
    await button.click()
    await button.click({ timeout: 1_000, force: true }).catch(() => undefined)
    await expect.poll(() => log.createProgram, { timeout: 60_000 }).not.toBeNull()
    await page.waitForTimeout(3_000)
    const createsAfterDouble = log.mutations.filter(
      m => m.method === 'POST' && m.path === '/api/admin/programs'
    ).length
    const formVersionPutsAfterFail = log.formVersionPuts.length
    const failDialogText = await page
      .getByRole('dialog')
      .filter({ hasText: /실패|오류/ })
      .first()
      .innerText()
      .catch(() => '')
    const successShown = await page
      .getByRole('dialog')
      .filter({ hasText: '등록되었습니다.' })
      .isVisible()
      .catch(() => false)
    await page.screenshot({ path: testInfo.outputPath('cs-x06-create-fail.png') })
    await dismissVisibleDialogs(page)
    const closeBtn = page
      .getByRole('dialog')
      .filter({ hasText: /실패|오류/ })
      .getByRole('button')
      .first()
    if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click().catch(() => undefined)
    await expect(page.getByText('1사1교 프로그램 등록', { exact: true })).toBeVisible()
    const appStillThere = await page.getByRole('button', { name: '프로그램 등록 완료' }).isVisible()
    await ensureCommonStep(page)
    const common = await snapshotCommonSections(page)
    const toRecruit = page.getByRole('button', { name: '모집 정보 작성하기' })
    if (await toRecruit.isVisible().catch(() => false)) await toRecruit.click()
    const toApplication = page.getByRole('button', { name: '신청 정보 작성하기' })
    await expect(toApplication).toBeVisible({ timeout: 30_000 })
    await toApplication.click()
    await expect(button).toBeVisible({ timeout: 30_000 })
    await button.click()
    await expect
      .poll(
        () =>
          log.mutations.filter(m => m.method === 'POST' && m.path === '/api/admin/programs').length,
        {
          timeout: 30_000,
        }
      )
      .toBe(createsAfterDouble + 1)
    await expect(page.getByRole('heading', { name: '등록 완료' })).toBeVisible({ timeout: 20_000 })
    const draftState = await readSavedCsRecords(page)
    await attachEvidence(testInfo, page, log, ev, {
      createsAfterDouble,
      failDialogText,
      successShown,
      appStillThere,
      commonTitle: common['대표 프로그램명을 입력해 주세요#0'],
      draftState: { ...draftState, meta: undefined },
    })
    expect(createsAfterDouble, '중복 CREATE 방지').toBe(1)
    expect(successShown, '실패 시 성공 모달 없음').toBe(false)
    expect(common['대표 프로그램명을 입력해 주세요#0']).toBe(VALUES_B.title)
    expect(formVersionPutsAfterFail).toBe(0)
    expect(new URL(page.url()).searchParams.get('programId')).toBeNull()
    assertIsolatedNetwork(log)
  })

  for (const mode of ['publish', 'bind', 'media'] as const) {
    test(`CS-X07 ${mode} 실패 모드: 잘못된 성공 화면 없이 실패 안내`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(300_000)
      const ev = collectEvidence(page)
      const log = await installCsIsolatedNetwork(page, { failMode: mode })
      let serverErrorModals = 0
      if (mode === 'media') {
        // 업로드 실패 시 제품은 「서버 오류 / mock media fail」 모달을 띄운다 — 확인 클릭만 하고 횟수를 기록한다.
        await page.addLocatorHandler(
          page.getByRole('dialog').filter({ hasText: 'mock media fail' }),
          async dialog => {
            serverErrorModals += 1
            await dialog.getByRole('button', { name: '확인' }).click()
          }
        )
      }
      await openFreshWizard(page)
      await fillAll(page)
      let mediaError = ''
      if (mode === 'bind' || mode === 'media') {
        await goRecruitStepFromApplication(page)
        try {
          await fillInstitutionRecruitMedia(page)
        } catch (error) {
          mediaError = String(error).slice(0, 600)
        }
        await dismissVisibleDialogs(page)
        await goApplicationStepFromRecruit(page)
      }
      const mediaUiText =
        mode === 'media'
          ? await page
              .locator('body')
              .innerText()
              .then(t => (t.match(/[^\n]*(실패|오류)[^\n]*/g) ?? []).slice(0, 10))
          : []
      await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
      await page.waitForTimeout(1_000)
      if (mode !== 'media') {
        await expect.poll(() => log.createProgram, { timeout: 60_000 }).not.toBeNull()
      }
      await page.waitForTimeout(8_000)
      const dialogs = await page
        .getByRole('dialog')
        .allInnerTexts()
        .catch(() => [])
      const partialNotice = await page
        .getByText('일부 양식 적용 실패')
        .first()
        .isVisible()
        .catch(() => false)
      const successShown = await page
        .getByRole('dialog')
        .filter({ hasText: '등록되었습니다.' })
        .isVisible()
        .catch(() => false)
      await page.screenshot({ path: testInfo.outputPath(`cs-x07-${mode}.png`) })
      const creates = log.mutations.filter(
        m => m.method === 'POST' && m.path === '/api/admin/programs'
      ).length
      const createBlob = JSON.stringify(log.createProgram?.body ?? {}).includes('blob:')
      await attachEvidence(testInfo, page, log, ev, {
        mode,
        dialogs,
        partialNotice,
        successShown,
        creates,
        createBlob,
        mediaError,
        mediaUiText,
        serverErrorModals,
        publishes: log.formVersionPublishes.length,
        thumbnailPuts: log.thumbnailPuts.length,
      })
      expect(creates).toBeLessThanOrEqual(1)
      expect(createBlob).toBe(false)
      if (mode === 'publish') {
        expect(successShown, 'publish 실패 시 성공 단독 모달 금지(부분 실패 안내)').toBe(false)
        expect(partialNotice).toBe(true)
      }
      if (mode === 'bind') {
        expect(
          successShown && !dialogs.some(d => /실패/.test(d)),
          '바인딩 실패가 성공으로만 보이면 안 됨'
        ).toBe(false)
      }
      if (mode === 'media') {
        expect(serverErrorModals, '업로드 실패 안내 노출').toBeGreaterThan(0)
        expect(successShown && log.thumbnailPuts.length > 0).toBe(false)
      }
      assertIsolatedNetwork(log)
    })
  }
})
