import { type Locator, type Page, expect } from '@playwright/test'
import {
  checkCheckboxIfVisible,
  checkRadioIfVisible,
  checkVisibleEnabledConsentCheckboxes,
  clickRegistrationTabIfVisible,
  clickSectionNavIfVisible,
  fillAllByPlaceholder,
  datePickerDialog,
  enabledCalendarMiniDayButtons,
  fillAllParagraphDatesByPlaceholder,
  fillByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  fillParagraphTimeIfVisible,
  revealEnabledCalendarMiniDays,
  fillVisibleFreeTextFields,
  selectByPlaceholder,
  selectByPlaceholderIfVisible,
  selectNearLabel,
  selectNearLabelIfVisible,
  uploadTinyPngIfPresent,
} from './form-helpers'
import type { GeneralRegistrationDevAutofillCaseId } from '@/features/program/general/lib/registration-dev-autofill-cases'

/** 등록 폼 8종 — 대분류(audience) × 중분류(structure) × 소분류(session) */
export type RegistrationCase = {
  audience: 'organization' | 'individual'
  structure: 'curriculum' | 'schedule'
  session: 'single' | 'multi'
  /** 제목·테스트명용 짧은 라벨 */
  label: string
}

export const REGISTRATION_CASES: readonly RegistrationCase[] = [
  {
    audience: 'organization',
    structure: 'curriculum',
    session: 'single',
    label: '기관_커리큘럼형_단일',
  },
  {
    audience: 'organization',
    structure: 'curriculum',
    session: 'multi',
    label: '기관_커리큘럼형_복수',
  },
  {
    audience: 'individual',
    structure: 'curriculum',
    session: 'single',
    label: '개인_커리큘럼형_단일',
  },
  {
    audience: 'individual',
    structure: 'curriculum',
    session: 'multi',
    label: '개인_커리큘럼형_복수',
  },
  {
    audience: 'organization',
    structure: 'schedule',
    session: 'single',
    label: '기관_일정형_단일',
  },
  {
    audience: 'organization',
    structure: 'schedule',
    session: 'multi',
    label: '기관_일정형_복수',
  },
  {
    audience: 'individual',
    structure: 'schedule',
    session: 'single',
    label: '개인_일정형_단일',
  },
  {
    audience: 'individual',
    structure: 'schedule',
    session: 'multi',
    label: '개인_일정형_복수',
  },
] as const

function createUniqueProgramTitle(caseLabel: string) {
  const hash = Date.now().toString(36)
  return `Playwright 테스트(${caseLabel})·${hash}`
}

const PROGRAM_EN_NAME = 'JA Entrepreneurship Classroom 2026 E2E'
const PROGRAM_PUBLIC_NAME = 'JA 기업가정신 교실 참여자 모집'
const EDUCATION_PLACE = '서울시 중구 JA Korea 교육장'
const KPI_VALUE = '30'
const WAGE_VALUE = '150000'
const CONTACT_NAME = 'JA Korea 프로그램 운영팀'
const CONTACT_TEL = '02-1234-5678'
const CONTACT_EMAIL = 'program-e2e@jakorea.org'
const REMARK = 'E2E 자동 등록 테스트용 비고'
const EDUCATION_TARGET_DETAIL = '초·중·고 학생 대상 기업가정신 체험 교육'
const ANNOUNCE_METHOD = '이메일 및 CMS 알림으로 개별 안내'
const CURRICULUM_UNIT = 'E2E 1차시 단원 — 기업가정신 기초'
const CURRICULUM_CONTENT = 'E2E 교육 내용 — 창업 마인드셋과 경제 기초를 학습합니다.'
const SCHEDULE_DETAIL_NAME = 'E2E 세부 일정 — 오리엔테이션'

/** 사업/프로그램 운영(시작) 기간 — 현재일 기준 +2개월 (수정 가능 정책 유지) */
const OPERATION_MONTH_OFFSET = 2
/** 모집·참여 기간 — 시작기간 기준 1개월 전 (= 현재일 +1개월) */
const RECRUIT_MONTH_OFFSET = 1
const OPERATION_DATE_OPTS = { futureMonthClicks: OPERATION_MONTH_OFFSET } as const
const RECRUIT_DATE_OPTS = { futureMonthClicks: RECRUIT_MONTH_OFFSET } as const
/** 발표일 — 모집(+1) 이후·운영(+2) 이전 */
const ANNOUNCE_DATE_OPTS = {
  futureMonthClicks: RECRUIT_MONTH_OFFSET,
  preferLaterDays: true,
} as const

export type RegistrationCompleteResult = {
  programId: string
  programTitle: string
  caseLabel: string
}

export type GeneralProgramRegistrationOptions = {
  /** 통합 E2E처럼 실행 시점에 바로 신청해야 하는 경우 모집 기간을 현재 월로 연다. */
  openRecruitment?: boolean
  /** 기획된 통합 E2E 이름을 그대로 사용하기 위한 제목 override. */
  programTitle?: string
  /** DEV 등록 화면의 자동입력 케이스를 사용한다. 날짜·기본값은 화면의 자동입력 로직을 따른다. */
  devAutofillCaseId?: GeneralRegistrationDevAutofillCaseId
  /** 통합 신청 E2E에서는 API 계약과 무관한 선택 파일 업로드를 생략한다. */
  skipOptionalUploads?: boolean
  /** 일반 기관 프로그램 생성 정책에 맞는 지급 항목만 선택한다. */
  safeWagePaymentItems?: boolean
  /** 기존 시스템 신청 양식은 편집하지 않고 생성된 binding으로 바로 신청한다. */
  skipApplicationFormEdits?: boolean
  /** 자동입력 케이스의 과거 날짜를 실행 시점 이후로 다시 맞춘다. */
  ensureFutureDates?: boolean
  /** 지정 시 세부 프로그램을 이 라벨로 실제 클릭 선택하고 값 반영을 검증한다(첫 옵션 임의 선택 금지). */
  detailedProgramLabel?: string
  /** 지정 시 후원사를 이 라벨로 실제 클릭 선택한다. */
  sponsorLabel?: string
  /** 지정 시 후원사 담당자를 이 라벨로 실제 클릭 선택한다. 못 찾으면 skip 없이 실패한다. */
  sponsorManagerLabel?: string
  /** 지정 시 필수 「지급 항목」을 이 라벨로 실제 클릭 선택한다. */
  paymentItemLabel?: string
}

async function clickButtonIfVisible(page: Page, name: string | RegExp) {
  const button = page.getByRole('button', { name }).first()
  if ((await button.count()) === 0) return
  if (!(await button.isVisible().catch(() => false))) return
  if (await button.isDisabled().catch(() => true)) return
  await button.click()
}

/**
 * 일반 프로그램 목록 → 신규 등록 풀페이지 모달 플로우
 * `REGISTRATION_CASES` 8종(기관/개인 × 커리큘럼/일정 × 단일/복수)을 variant로 채운다.
 */
export class GeneralProgramRegistrationPage {
  readonly programTitle: string
  readonly regCase: RegistrationCase

  constructor(
    private readonly page: Page,
    regCase: RegistrationCase,
    options?: GeneralProgramRegistrationOptions
  ) {
    this.regCase = regCase
    this.programTitle = options?.programTitle ?? createUniqueProgramTitle(regCase.label)
    this.openRecruitment = options?.openRecruitment === true
    this.devAutofillCaseId = options?.devAutofillCaseId
    this.skipOptionalUploads = options?.skipOptionalUploads === true
    this.safeWagePaymentItems = options?.safeWagePaymentItems === true
    this.skipApplicationFormEdits = options?.skipApplicationFormEdits === true
    this.ensureFutureDates = options?.ensureFutureDates === true
    this.detailedProgramLabel = options?.detailedProgramLabel
    this.sponsorLabel = options?.sponsorLabel
    this.sponsorManagerLabel = options?.sponsorManagerLabel
    this.paymentItemLabel = options?.paymentItemLabel
  }

  private readonly openRecruitment: boolean
  private readonly devAutofillCaseId?: GeneralRegistrationDevAutofillCaseId
  private readonly skipOptionalUploads: boolean
  private readonly safeWagePaymentItems: boolean
  private readonly skipApplicationFormEdits: boolean
  private readonly ensureFutureDates: boolean
  private readonly detailedProgramLabel?: string
  private readonly sponsorLabel?: string
  private readonly sponsorManagerLabel?: string
  private readonly paymentItemLabel?: string

  private async selectSafeWagePaymentItemIfNeeded() {
    if (!this.safeWagePaymentItems) return

    await clickSectionNavIfVisible(this.page, '임금 정보')
    const field = this.page
      .locator('.detail-info-form__field')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', {
          hasText: /^지급 항목$/,
        }),
      })
      .first()
    const trigger = field.locator('.cms-select-multi__trigger').first()
    if ((await trigger.count()) === 0 || !(await trigger.isVisible().catch(() => false))) return

    await trigger.click()
    const panel = this.page.locator('.cms-select-multi__panel:visible').last()
    await expect(panel).toBeVisible({ timeout: 10_000 })
    const rows = panel.locator('.cms-select-multi__row')
    await expect(rows.first()).toBeVisible({ timeout: 10_000 })

    const rowCount = await rows.count()
    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index)
      if ((await row.locator('.ant-checkbox-checked').count()) === 0) continue
      await row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first().click()
    }

    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index)
      const text = (await row.innerText()).trim()
      if (!text || /숙박비|lodging/i.test(text) || /해당 없음/.test(text)) continue
      await row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first().click()
      break
    }
    await trigger.click({ force: true })
  }

  private async applyDevAutofillCase() {
    const caseId = this.devAutofillCaseId
    if (caseId == null) return false

    const caseSelect = this.page.locator('[aria-label="개발용 자동입력 케이스"]').first()
    await expect(caseSelect).toBeVisible({ timeout: 10_000 })
    await caseSelect.click()
    const option = this.page
      .locator('.cms-select-dropdown .ant-select-item-option')
      .filter({ hasText: new RegExp(`^${caseId}\\.`) })
      .first()
    await expect(option).toBeVisible({ timeout: 5_000 })
    await option.click()

    // 자동입력 훅은 호출 시점의 참여자 상태로 모집 overlay 대상을 계산한다.
    // 기관·강사·봉사자 모집을 모두 만들 통합 케이스이므로 먼저 상태를 확정한다.
    await checkCheckboxIfVisible(this.page, '학교/기관')
    await checkCheckboxIfVisible(this.page, '교사/강사')
    await checkCheckboxIfVisible(this.page, '봉사자')
    await this.page.waitForTimeout(300)
    await this.page.getByRole('button', { name: '자동입력(개발용)' }).click()
    // 자동입력은 controlled 참여자 상태와 overlay를 함께 갱신하므로
    // 다음 체크박스 조작 전에 한 번의 렌더 사이클을 기다린다.
    await this.page.waitForTimeout(500)

    // 자동입력 후 제목을 덮어쓰는 controlled state 동기화가 끝난 뒤
    // 마지막에 고유한 제목을 주입한다.
    const titleField = (label: string) =>
      this.page
        .locator('.detail-info-form__field')
        .filter({
          has: this.page.locator('.detail-info-form__field-label-text', { hasText: label }),
        })
        .first()
    // 케이스 preset은 기관을 고정하고 교사·봉사자는 현재 선택값을 유지한다.
    // 통합 신청 플로우에서는 세 모집을 모두 생성해야 하므로 명시적으로 켠다.
    await checkCheckboxIfVisible(this.page, '학교/기관')
    await checkCheckboxIfVisible(this.page, '교사/강사')
    await checkCheckboxIfVisible(this.page, '봉사자')
    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', KPI_VALUE)
    await this.selectSafeWagePaymentItemIfNeeded()
    await clickSectionNavIfVisible(this.page, '기본 정보')
    await expect(titleField('대표 프로그램명 (국문)')).toBeVisible({ timeout: 10_000 })
    await titleField('대표 프로그램명 (국문)')
      .getByPlaceholder('대표 프로그램명을 입력해 주세요')
      .fill(this.programTitle)
    await titleField('대표 프로그램명 (영문)')
      .getByPlaceholder('대표 프로그램명을 입력해 주세요')
      .fill(PROGRAM_EN_NAME)

    // DEV 자동입력 케이스의 기본값은 복수 회차라도 한 개의 상세 일정만
    // 만들 수 있다. 통합 신청 검증은 실제 회차 매핑을 확인해야 하므로,
    // 일정형 케이스는 생성 화면에서 일정 입력을 한 번 더 수행한다.
    if (this.regCase.structure === 'schedule') {
      await this.fillEducationProgress()
    }
    return true
  }

  /** 대시보드에서 LNB: 프로그램 관리 → 일반 프로그램 */
  async goToGeneralProgramsViaMenu() {
    const programMenu = this.page.getByRole('menuitem', { name: '프로그램 관리' })
    await expect(programMenu).toBeVisible()
    const expanded = await programMenu.getAttribute('aria-expanded')
    if (expanded !== 'true') {
      await programMenu.click()
    }
    await this.page.getByRole('menuitem', { name: '일반 프로그램' }).click()
    await expect(this.page).toHaveURL(/\/programs\/general/)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })
  }

  async openNewRegistration() {
    await this.page.getByRole('button', { name: /^(프로그램 )?신규 등록$/ }).click()

    const draftDialog = this.page.getByRole('dialog').filter({ hasText: '임시 저장 이력 안내' })
    // 임시저장 안내 모달은 클릭 직후 비동기로 뜰 수 있다 — 위저드 URL 또는 모달 중 먼저 오는 쪽을 기다린다.
    await Promise.race([
      draftDialog.waitFor({ state: 'visible', timeout: 10_000 }),
      this.page.waitForURL(/\/programs\/general\?.*new=1/, { timeout: 10_000 }),
    ]).catch(() => undefined)
    if (await draftDialog.isVisible().catch(() => false)) {
      await draftDialog.getByRole('radio', { name: '신규 등록' }).check()
      await draftDialog.getByRole('button', { name: '프로그램 등록' }).click()
    }

    await expect(this.page).toHaveURL(/\/programs\/general\?.*new=1/)
    await expect(this.page.getByText('일반 프로그램 등록', { exact: true })).toBeVisible()
    await expect(this.page.getByRole('button', { name: '모집 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
    await this.page
      .waitForResponse(res => /sponsor/i.test(res.url()) && res.ok(), { timeout: 20_000 })
      .catch(() => undefined)
  }

  /**
   * 후원사 선택 후 담당자 자동선택(useEffect)을 기다린다.
   * 담당자 없는 후원사면 multi 목록에서 다음 후원사로 바꿔 재시도한다.
   */
  /** 엄격 모드: 라벨로 담당자를 실제 클릭 선택하고, 미선택 sentinel이 남지 않았는지 확인한다. */
  private async selectSponsorManagerStrict(label: string) {
    await selectNearLabel(this.page, '후원사 담당자', label)
    const field = this.page
      .locator('.detail-info-form__field')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', { hasText: /^후원사 담당자$/ }),
      })
      .first()
    const shown = field.locator('.cms-select-multi__trigger, .ant-select').first()
    await expect(shown).toContainText(label)
    await expect(shown).not.toContainText('미선택')
    // Escape 는 풀페이지 등록 모달의 「작성 취소 안내」를 띄우므로 쓰지 않는다. 열린 패널만 라벨 클릭으로 닫는다.
    const openPanel = this.page.locator('.cms-select-multi__panel:visible')
    if ((await openPanel.count()) > 0) {
      await field.locator('.detail-info-form__field-label-text').first().click()
    }
    await expect(openPanel).toHaveCount(0)
    await expect(this.page.getByText('작성 취소 안내')).toHaveCount(0)
    await expect(shown).toContainText(label)
  }

  /**
   * 엄격 모드: 「교육 진행 일정 선택」은 목록 추가형 피커다. 트리거는 의도적으로 placeholder를 유지하고
   * (paragraph-date-picker.tsx omitTriggerSurfaceDisplay) 선택값은 「교육 진행 예정일」 목록에 한 줄로 추가된다.
   * 운영 기간 안의 첫 활성일을 명시 클릭하고, 시작<종료 시간을 확인한 뒤 목록 증가로 검증한다.
   */
  private async addEducationScheduleDateStrict() {
    const field = this.page
      .locator('.detail-info-form__field')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', { hasText: /^교육 진행 일정 선택$/ }),
      })
      .first()
    const listItems = this.page.locator('.education-schedule-preview-lines__item')
    const before = await listItems.count()
    const trigger = field.locator('.paragraph-date-picker__trigger').first()
    await expect(trigger).toBeVisible()
    await trigger.click()
    const dialog = this.page
      .locator('.date-time-picker-popover[role="dialog"]')
      .filter({ has: this.page.locator('.calendar-mini') })
      .last()
    await expect(dialog).toBeVisible()
    const enabledDays = dialog.locator(
      'button.calendar-mini-cell:not(.calendar-mini-cell--disabled):not(.calendar-mini-cell--other-month):not([aria-disabled="true"])'
    )
    await expect(enabledDays.first()).toBeVisible()
    const dayText = (await enabledDays.first().innerText()).trim()
    await enabledDays.first().click()
    const times = (await dialog.locator('.ant-select-selection-item').allInnerTexts()).map(t =>
      Number(t.replace(/[^0-9]/g, ''))
    )
    expect(times, '시작시·분·종료시·분 4개').toHaveLength(4)
    expect(times[2] * 60 + times[3], '종료 시간이 시작 시간보다 늦어야 한다').toBeGreaterThan(
      times[0] * 60 + times[1]
    )
    await dialog.getByRole('button', { name: '설정' }).click()
    await expect(dialog).toBeHidden()
    await expect(listItems).toHaveCount(before + 1)
    const added = (await listItems.nth(before).innerText()).trim()
    expect(added, `추가된 예정일(${added})에 선택한 일(${dayText})이 보여야 한다`).toContain(dayText)
    await expect(trigger).toHaveText('일정을 선택해 주세요')
  }

  /**
   * 엄격 모드: 일정형 세부 일정의 진행 일정 트리거를 하나씩 채운다.
   * 「교육 진행 일정 선택」 추가형 피커는 설계상 placeholder 유지라 제외(addEducationScheduleDateStrict가 담당).
   * aria-label은 값과 무관하게 placeholder라 role 이름 대신 표시 텍스트로 미입력 트리거를 고른다.
   */
  private async fillScheduleDetailDatesStrict() {
    const placeholder = '일정을 선택해 주세요'
    const pendingIndex = () =>
      this.page.locator('.paragraph-date-picker__trigger').evaluateAll(
        (els, ph) =>
          els.findIndex(el => {
            const r = (el as HTMLElement).getBoundingClientRect()
            if (r.width === 0 && r.height === 0) return false
            if ((el.textContent ?? '').trim() !== ph) return false
            const label = el
              .closest('.detail-info-form__field')
              ?.querySelector('.detail-info-form__field-label-text')
              ?.textContent?.trim()
            return label !== '교육 진행 일정 선택'
          }),
        placeholder
      )
    let filled = 0
    for (let guard = 0; guard < 10; guard += 1) {
      const idx = await pendingIndex()
      if (idx < 0) break
      const trigger = this.page.locator('.paragraph-date-picker__trigger').nth(idx)
      await trigger.scrollIntoViewIfNeeded()
      await trigger.click()
      const dialog = this.page
        .locator('.date-time-picker-popover[role="dialog"]')
        .filter({ has: this.page.locator('.calendar-mini') })
        .last()
      await expect(dialog).toBeVisible()
      const enabledDays = dialog.locator(
        'button.calendar-mini-cell:not(.calendar-mini-cell--disabled):not(.calendar-mini-cell--other-month):not([aria-disabled="true"])'
      )
      await expect(enabledDays.first()).toBeVisible()
      const dayText = (await enabledDays.first().innerText()).trim()
      await enabledDays.first().click()
      await dialog.getByRole('button', { name: '설정' }).click()
      await expect(dialog).toBeHidden()
      await expect(trigger).not.toHaveText(placeholder)
      await expect(trigger).toContainText(dayText)
      filled += 1
    }
    console.log('[STEP41] 일정형 세부 일정 날짜 트리거 입력 수', filled)
  }

  /**
   * 기관·일정형·복수에서 educationScheduleLines는 「교육 진행 (일정형)」 세부 일정의
   * 진행 일정에서 만든다. 「교육 진행 일정 선택」 추가형 피커는 이 유형에서 숨겨질 수 있다.
   * DEV 자동입력이 현재 연도에서 고른 날짜는, 사업 운영 기간을 미래로 다시 잡으면
   * 기간 밖이 되어 등록이 거절될 수 있다. 이미 값이 있는 트리거를 다시 열어
   * 달력에서 활성화된(운영 기간 안) 날짜 2개를 고른다.
   */
  async realignScheduleDetailDatesWithinOpenPeriod() {
    const heading = this.page.getByText(/교육 진행 \(일정형\)/).first()
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toBeVisible({ timeout: 15_000 })

    const nameInputs = this.page.getByPlaceholder('행사 일정명을 작성하세요')
    if ((await nameInputs.count()) < 2) {
      const add = this.page.getByRole('button', { name: /강의 세부 일정 추가|강의 행사 일정 추가/ })
      await expect(add.first()).toBeVisible({ timeout: 10_000 })
      await add.first().click()
      await expect.poll(async () => nameInputs.count(), { timeout: 10_000 }).toBeGreaterThanOrEqual(2)
    }
    expect(await nameInputs.count(), '일정형 세부 일정이 2개 이상이어야 한다').toBeGreaterThanOrEqual(2)

    const inputCount = await nameInputs.count()
    for (let i = 0; i < inputCount; i += 1) {
      const input = nameInputs.nth(i)
      if (!(await input.isVisible().catch(() => false))) continue
      if (!(await input.inputValue()).trim()) {
        await input.fill(SCHEDULE_DETAIL_NAME)
      }
    }

    const groups = this.page.getByRole('group', { name: '교육 진행 (일정형)' })
    await expect(groups.first()).toBeVisible({ timeout: 10_000 })
    expect(await groups.count(), '일정형 세부 일정 그룹이 2개 이상이어야 한다').toBeGreaterThanOrEqual(2)

    const usedDayTexts: string[] = []
    for (let i = 0; i < 2; i += 1) {
      const group = groups.nth(i)
      const trigger = group
        .locator('.paragraph-date-picker__trigger')
        .or(
          group.getByRole('button').filter({ hasText: /\d{4}\.\d{2}\.\d{2}|일정을 선택해 주세요/ })
        )
        .first()
      await trigger.scrollIntoViewIfNeeded()
      await expect(trigger).toBeVisible({ timeout: 10_000 })
      await trigger.click()

      const dialog = datePickerDialog(this.page)
      await expect(dialog).toBeVisible({ timeout: 10_000 })
      await revealEnabledCalendarMiniDays(dialog, 0)
      const enabledDays = enabledCalendarMiniDayButtons(dialog)
      await expect(enabledDays.first()).toBeVisible({ timeout: 10_000 })
      const dayCount = await enabledDays.count()
      expect(dayCount, '사업 운영 기간 안에 선택 가능한 날짜가 있어야 한다').toBeGreaterThan(0)

      let index = Math.min(i, dayCount - 1)
      for (let candidate = 0; candidate < dayCount; candidate += 1) {
        const text = (await enabledDays.nth(candidate).innerText()).trim()
        if (!usedDayTexts.includes(text)) {
          index = candidate
          break
        }
      }
      const chosen = enabledDays.nth(index)
      const dayText = (await chosen.innerText()).trim()
      await chosen.click()
      await dialog.getByRole('button', { name: '설정' }).click()
      await expect(dialog).toBeHidden({ timeout: 10_000 })
      await expect(trigger).not.toHaveText('일정을 선택해 주세요')
      await expect(trigger).toContainText(dayText)
      usedDayTexts.push(dayText)
    }
  }

  private recruitField(label: string) {
    return this.page
      .locator('.detail-info-form__field:visible')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', {
          hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        }),
      })
      .first()
  }

  private async expectMultiFieldShows(label: string, option: string) {
    const field = this.recruitField(label)
    await expect(field, `${label} 필드`).toBeVisible()
    await expect(field.locator('.cms-select-multi__trigger, .ant-select').first()).toContainText(option)
  }

  /**
   * PHASE 3 탭 왕복 보존: 모집 탭을 기관→강사→봉사자→기관→봉사자→강사 순으로 오가며
   * 각 탭에서 입력한 값이 유지되고 다른 역할 값이 섞이지 않는지 화면에서 확인한다.
   */
  async assertRecruitTabRoundTripStrict() {
    const checks: Record<string, () => Promise<void>> = {
      '참여 기관 모집 정보': async () => {
        await this.expectMultiFieldShows('교육 대상', '고등학생')
        const t = this.recruitField('교육 대상').locator('.cms-select-multi__trigger, .ant-select').first()
        await expect(t).not.toContainText('대학(원)생')
        await expect(t).not.toContainText('성인')
        await expect(this.recruitField('배정 가능 최대 강사 수').getByPlaceholder('최대값 입력').first()).toHaveValue(/^2/)
        await expect(this.recruitField('신청 가능 최대 학급 수').getByPlaceholder('최대값 입력').first()).toHaveValue(/^3/)
      },
      '강사 모집 정보': async () => {
        await this.expectMultiFieldShows('모집 대상', '성인')
        const t = this.recruitField('모집 대상').locator('.cms-select-multi__trigger, .ant-select').first()
        await expect(t).not.toContainText('대학(원)생')
        await expect(t).not.toContainText('고등학생')
      },
      '봉사자 모집 정보': async () => {
        await this.expectMultiFieldShows('모집 대상', '대학(원)생')
        const t = this.recruitField('모집 대상').locator('.cms-select-multi__trigger, .ant-select').first()
        await expect(t).not.toContainText('성인')
        await expect(t).not.toContainText('고등학생')
        await expect(this.page.locator('.paragraph-chip--selected:visible')).toHaveCount(2)
      },
    }
    const order = ['참여 기관 모집 정보', '강사 모집 정보', '봉사자 모집 정보', '참여 기관 모집 정보', '봉사자 모집 정보', '강사 모집 정보']
    let visited = 0
    for (const tab of order) {
      const t = this.page.getByRole('tab', { name: tab })
      if ((await t.count()) === 0) continue
      await t.first().click()
      await expect(t.first()).toHaveAttribute('aria-selected', 'true')
      await checks[tab]()
      visited += 1
    }
    console.log('[STEP41] 모집 탭 왕복 확인 수', visited)
    return visited
  }

  /** 엄격 모드 공용: 라벨 필드의 cms-select-multi를 실제 클릭 선택하고 패널 닫힘·표시값을 검증한다. */
  private async selectMultiFieldStrict(label: string, option: string) {
    const field = this.page
      .locator('.detail-info-form__field:visible')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', {
          hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        }),
      })
      .first()
    await expect(field, `${label} 필드`).toBeVisible()
    await selectNearLabel(this.page, label, option)
    if ((await this.page.locator('.cms-select-multi__panel:visible').count()) > 0) {
      await field.locator('.detail-info-form__field-label-text').first().click()
    }
    await expect(this.page.locator('.cms-select-multi__panel:visible')).toHaveCount(0)
    await expect(field.locator('.cms-select-multi__trigger, .ant-select').first()).toContainText(option)
  }

  /** 엄격 모드: 라벨 필드의 「최대값 입력」에 값을 넣고 반영을 확인한다. */
  private async fillMaxValueStrict(label: string, value: string) {
    const field = this.page
      .locator('.detail-info-form__field:visible')
      .filter({ has: this.page.locator('.detail-info-form__field-label-text', { hasText: label }) })
      .first()
    await expect(field, `${label} 필드`).toBeVisible()
    const input = field.getByPlaceholder('최대값 입력').first()
    await input.fill(value)
    await expect(input).toHaveValue(new RegExp(`^${value}`))
  }

  /**
   * 엄격 모드 감사: 현재 화면에서 값이 비어 있는 보이는 필드 라벨 목록.
   * 텍스트·숫자 입력 빈값, placeholder 상태 Select·날짜, 선택 없는 라디오 그룹, 체크 없는 체크박스 그룹을 찾는다.
   */
  async auditEmptyVisibleFields(): Promise<string[]> {
    return this.page.evaluate(() => {
      const visible = (el: Element) => {
        const r = (el as HTMLElement).getBoundingClientRect()
        const st = getComputedStyle(el as HTMLElement)
        return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'
      }
      const out: string[] = []
      const modal = document.querySelector('.ant-modal-wrap:not([style*="display: none"]) .ant-modal-body') ?? document
      for (const field of Array.from(modal.querySelectorAll('.detail-info-form__field'))) {
        if (!visible(field)) continue
        const label = (field.querySelector('.detail-info-form__field-label-text') as HTMLElement | null)?.innerText.trim() ?? '?'
        const reasons: string[] = []
        for (const inp of Array.from(field.querySelectorAll('input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea'))) {
          const i = inp as HTMLInputElement
          if (!visible(i) || i.disabled || i.readOnly) continue
          if (i.closest('.ant-select')) continue
          if ((i.value ?? '').trim() === '') reasons.push(`input(${i.placeholder || i.name || '-'})`)
        }
        for (const ed of Array.from(field.querySelectorAll('[contenteditable="true"]'))) {
          if (visible(ed) && (ed as HTMLElement).innerText.trim() === '') reasons.push('editor')
        }
        for (const ph of Array.from(field.querySelectorAll('.ant-select-selection-placeholder, .paragraph-date-picker__trigger-text--placeholder'))) {
          if (visible(ph)) reasons.push(`placeholder(${(ph as HTMLElement).innerText.trim()})`)
        }
        for (const t of Array.from(field.querySelectorAll('.cms-select-multi__trigger'))) {
          const tx = (t as HTMLElement).innerText.trim()
          if (visible(t) && (tx === '' || tx.includes('선택해 주세요'))) reasons.push(`multi(${tx})`)
        }
        const radios = Array.from(field.querySelectorAll('input[type=radio]')).filter(r => visible(r.closest('label') ?? r))
        if (radios.length > 0 && !radios.some(r => (r as HTMLInputElement).checked)) reasons.push('radio-none')
        if (reasons.length) out.push(`${label}: ${reasons.join(', ')}`)
      }
      return out
    })
  }

  /** 엄격 모드: 봉사자 면접 진행 가능 시간·단위·시간대(필수: registration-recruitment-required-fields.ts:303-321) */
  private async fillVolunteerInterviewScheduleStrict() {
    const section = this.page.locator('.volunteer-interview-available-schedule:visible').first()
    await expect(section, '면접 진행 가능 일정 섹션').toBeVisible()
    const timeTrigger = section.locator('.paragraph-time-picker__trigger').first()
    await timeTrigger.scrollIntoViewIfNeeded()
    await timeTrigger.click()
    const pop = this.page.locator('[aria-label="시간 설정"]:visible').last()
    await expect(pop).toBeVisible()
    // 기본값이 00:00~00:00이라 시작 10:00, 종료 12:00을 실제 Select 클릭으로 지정한다.
    const selects = pop.locator('.ant-select')
    await expect(selects).toHaveCount(4)
    const pick = async (index: number, n: number, unit: '시' | '분') => {
      const select = selects.nth(index)
      await select.click()
      const dropdown = this.page.locator('.ant-select-dropdown:visible').last()
      await expect(dropdown).toBeVisible()
      const title = `${n}${unit}`
      const padded = `${String(n).padStart(2, '0')}${unit}`
      const option = dropdown.locator(`.ant-select-item-option[title="${title}"], .ant-select-item-option[title="${padded}"]`).first()
      const holder = dropdown.locator('.rc-virtual-list-holder').first()
      await expect(holder).toBeVisible()
      // 가상 리스트: 대상 옵션이 렌더될 때까지 목록 위에서 휠 스크롤(실제 마우스 조작)
      await expect(dropdown).not.toHaveClass(/ant-slide-up-appear|ant-slide-down-appear/)
      for (let i = 0; i < 40 && (await option.count()) === 0; i += 1) {
        const box = await holder.boundingBox()
        if (box) await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await this.page.mouse.wheel(0, n === 0 ? -160 : 160)
      }
      await expect(option, `옵션 ${title}`).toBeVisible()
      await option.click()
      await expect(select).toContainText(new RegExp(`0?${n}${unit}`))
    }
    await pick(0, 10, '시')
    await pick(1, 0, '분')
    await pick(2, 12, '시')
    await pick(3, 0, '분')
    const t = (await pop.locator('.ant-select-selection-item').allInnerTexts()).map(x => Number(x.replace(/[^0-9]/g, '')))
    console.log('[STEP41] 면접 가능 시간 기본값', JSON.stringify(t))
    expect(t.length, '시작·종료 시/분 select').toBeGreaterThanOrEqual(4)
    expect(t[2] * 60 + t[3], '면접 종료 시간 > 시작 시간').toBeGreaterThan(t[0] * 60 + t[1])
    await pop.getByRole('button', { name: '설정' }).click()
    await expect(pop).toBeHidden()
    await expect(timeTrigger).not.toContainText('시간을 선택해 주세요')
    const unit = section.getByRole('radio', { name: '30분 단위' })
    await unit.check()
    await expect(unit).toBeChecked()
    const chips = section.locator('.volunteer-interview-available-schedule__time-slot')
    await expect(chips.first()).toBeVisible()
    const labels = (await chips.allInnerTexts()).map(x => x.trim())
    // 시작 시각부터 두 칸(라벨로 지정 클릭)
    for (const label of labels.slice(0, 2)) {
      const chip = chips.filter({ hasText: label }).first()
      await chip.click()
      await expect(chip).toHaveClass(/paragraph-chip--selected/)
    }
    console.log('[STEP41] 면접 시간대 선택', JSON.stringify(labels.slice(0, 2)))
  }

  private managerField() {
    return this.page
      .locator('.detail-info-form__field')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', {
          hasText: /^후원사 담당자$/,
        }),
      })
      .first()
  }

  private async readLabeledSelectText(field: Locator): Promise<string> {
    const multi = field.locator('.cms-select-multi__trigger-text, .cms-select-multi__trigger').first()
    if ((await multi.count()) > 0 && (await multi.isVisible().catch(() => false))) {
      return (await multi.innerText()).trim()
    }
    const item = field.locator('.ant-select-selection-item').first()
    if ((await item.count()) > 0) {
      return (await item.innerText()).trim()
    }
    const button = field.getByRole('button').first()
    if ((await button.count()) > 0 && (await button.isVisible().catch(() => false))) {
      return (await button.innerText())
        .trim()
        .replace(/\s*선택 초기화\s*$/g, '')
        .trim()
    }
    return ''
  }

  private isChosenSelectValue(text: string) {
    const value = text.replace(/\s+/g, ' ').trim()
    if (!value) return false
    if (value === '전체' || value === '해당 없음' || value === '미선택') return false
    if (value.includes('미선택') || value.includes('선택해 주세요')) return false
    return true
  }

  private async closeOpenSelectOverlays() {
    const openMulti = this.page.locator('.cms-select-multi__panel:visible')
    const openDrop = this.page.locator('.ant-select-dropdown:visible')
    if ((await openMulti.count()) === 0 && (await openDrop.count()) === 0) return
    const label = this.page.locator('.detail-info-form__field-label-text').filter({
      hasText: /^후원사 담당자$|^후원사$/,
    }).first()
    if (await label.isVisible().catch(() => false)) {
      await label.click()
    }
    await expect(this.page.getByText('작성 취소 안내')).toHaveCount(0)
    await expect(openMulti).toHaveCount(0, { timeout: 5_000 }).catch(() => undefined)
    await expect(openDrop).toHaveCount(0, { timeout: 5_000 }).catch(() => undefined)
  }

  private async pickFirstRealOpenOption(currentValue?: string) {
    const dropdown = this.page.locator('.ant-select-dropdown:visible').last()
    if (await dropdown.isVisible().catch(() => false)) {
      const empty = dropdown.getByText(/No data|데이터 없음|검색 결과 없음/)
      if ((await empty.count()) > 0) return false
      const options = dropdown.locator(
        '.ant-select-item-option:not(.ant-select-item-option-disabled)'
      )
      const count = await options.count()
      for (let i = 0; i < count; i += 1) {
        const text = (await options.nth(i).innerText()).trim()
        if (!this.isChosenSelectValue(text)) continue
        if (
          currentValue &&
          this.isChosenSelectValue(currentValue) &&
          (text === currentValue || text.includes(currentValue) || currentValue.includes(text))
        ) {
          continue
        }
        await options.nth(i).scrollIntoViewIfNeeded().catch(() => undefined)
        await options.nth(i).click({ force: true })
        await expect(dropdown).toBeHidden({ timeout: 5_000 }).catch(() => undefined)
        return true
      }
      return false
    }

    const panel = this.page.locator('.cms-select-multi__panel:visible').last()
    if (!(await panel.isVisible().catch(() => false))) return false
    const rows = panel.locator('.cms-select-multi__row')
    const count = await rows.count()
    for (let i = 0; i < count; i += 1) {
      const text = (
        await rows
          .nth(i)
          .locator('.cms-select-multi__label-pill')
          .innerText()
          .catch(() => '')
      ).trim()
      if (!this.isChosenSelectValue(text)) continue
      if (
        currentValue &&
        this.isChosenSelectValue(currentValue) &&
        (text === currentValue || text.includes(currentValue) || currentValue.includes(text))
      ) {
        continue
      }
      const row = rows.nth(i)
      const alreadyChecked =
        (await row.locator('.ant-checkbox-checked').count().catch(() => 0)) > 0
      if (!alreadyChecked) {
        await row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first().click()
      }
      await this.closeOpenSelectOverlays()
      return true
    }
    return false
  }

  private async openFieldSelect(field: Locator) {
    await field.scrollIntoViewIfNeeded()
    const trigger = field
      .locator('.cms-select-multi__trigger:visible, .ant-select:visible, button:visible')
      .first()
    await expect(trigger).toBeVisible({ timeout: 10_000 })
    await trigger.click()
    const opened = await expect(async () => {
      const drop = await this.page.locator('.ant-select-dropdown:visible').count()
      const panel = await this.page.locator('.cms-select-multi__panel:visible').count()
      if (drop + panel > 0) return
      throw new Error('후원사 선택 목록이 열리지 않았습니다')
    })
      .toPass({ timeout: 8_000 })
      .then(() => true)
      .catch(() => false)
    return opened
  }

  private async ensureOrganizationAudience() {
    const personal = this.page.getByRole('checkbox', { name: /^개인$/ }).first()
    const organization = this.page.getByRole('checkbox', { name: '학교/기관' }).first()
    await expect(organization).toBeVisible({ timeout: 10_000 })
    if ((await personal.count()) > 0 && (await personal.isChecked().catch(() => false))) {
      await personal.click()
      await expect(personal).not.toBeChecked({ timeout: 5_000 })
    }
    await expect(organization).toBeEnabled({ timeout: 10_000 })
    if (!(await organization.isChecked())) {
      await organization.click()
    }
    await expect(organization).toBeChecked({ timeout: 5_000 })
    if ((await personal.count()) > 0) {
      await expect(personal).not.toBeChecked()
    }
    await checkCheckboxIfVisible(this.page, '교사/강사')
    await checkCheckboxIfVisible(this.page, '봉사자')
    await expect(this.page.getByRole('checkbox', { name: '교사/강사' }).first()).toBeChecked({
      timeout: 5_000,
    })
    await expect(this.page.getByRole('checkbox', { name: '봉사자' }).first()).toBeChecked({
      timeout: 5_000,
    })
  }

  private async ensureSponsorManagerSelected(sponsorField: Locator) {
    if (this.sponsorManagerLabel) {
      await this.selectSponsorManagerStrict(this.sponsorManagerLabel)
      return
    }

    const managerField = this.managerField()
    const managerFilled = async () => this.isChosenSelectValue(await this.readLabeledSelectText(managerField))

    if (
      await expect
        .poll(managerFilled, { timeout: 8_000 })
        .toBeTruthy()
        .then(() => true)
        .catch(() => false)
    ) {
      await this.closeOpenSelectOverlays()
      return
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await this.closeOpenSelectOverlays()
      if (await this.openFieldSelect(managerField)) {
        if (await this.pickFirstRealOpenOption()) {
          if (await managerFilled()) {
            await this.closeOpenSelectOverlays()
            return
          }
        }
        await this.closeOpenSelectOverlays()
      }

      const currentSponsor = await this.readLabeledSelectText(sponsorField)
      if (await this.openFieldSelect(sponsorField)) {
        const switched = await this.pickFirstRealOpenOption(currentSponsor)
        await this.closeOpenSelectOverlays()
        if (switched) {
          if (
            await expect
              .poll(managerFilled, { timeout: 8_000 })
              .toBeTruthy()
              .then(() => true)
              .catch(() => false)
          ) {
            return
          }
        }
      }
    }

    await selectNearLabelIfVisible(this.page, '후원사 담당자')
    await this.closeOpenSelectOverlays()
    const managerText = await this.readLabeledSelectText(managerField)
    expect(
      this.isChosenSelectValue(managerText),
      `후원사 담당자가 선택되지 않았습니다: "${managerText}"`
    ).toBe(true)
  }

    /** 공통 정보 — 케이스별 대·중·소분류 + 보이는 입력 채움 */
  async fillCommonInfo() {
    const { audience, structure, session } = this.regCase

    await clickSectionNavIfVisible(this.page, '기본 정보')

    if (await this.applyDevAutofillCase()) {
      // DEV 자동입력은 교육 일정이 현재 연도 안에서 무작위로 생성될 수 있다.
      // 통합 E2E에서는 공통 운영 기간을 넓게 다시 잡아 교육 일정이 운영 기간
      // 밖으로 밀리지 않도록 한다.
      if (this.ensureFutureDates) {
        await fillParagraphDateByPlaceholder(this.page, '사업 운영 기간을 선택해 주세요', 'range', {
          futureStartWindow: true,
        })
      }
      return
    }

    await fillByPlaceholder(this.page, '대표 프로그램명을 입력해 주세요', this.programTitle)
    const representativeProgramNameInputs =
      this.page.getByPlaceholder('대표 프로그램명을 입력해 주세요')
    if ((await representativeProgramNameInputs.count()) > 1) {
      await representativeProgramNameInputs.nth(1).fill(PROGRAM_EN_NAME)
    } else {
      await fillByPlaceholder(this.page, '대표 프로그램명(영문)을 입력해 주세요', PROGRAM_EN_NAME)
    }
    await fillByPlaceholder(
      this.page,
      '모집 시 노출될 프로그램명을 입력해 주세요',
      PROGRAM_PUBLIC_NAME
    )

    await selectByPlaceholderIfVisible(
      this.page,
      '세부 프로그램명을 선택해 주세요',
      this.detailedProgramLabel
    )
    await selectByPlaceholderIfVisible(
      this.page,
      '상세 프로그램명을 선택해 주세요',
      this.detailedProgramLabel
    )
    await selectNearLabelIfVisible(this.page, '세부 프로그램명', this.detailedProgramLabel)
    await selectNearLabelIfVisible(this.page, '상세 프로그램명', this.detailedProgramLabel)
    await fillParagraphDateByPlaceholder(
      this.page,
      '사업 운영 기간을 선택해 주세요',
      'range',
      OPERATION_DATE_OPTS
    )

    // 대분류 — 개인/학교·기관은 상호 배타. 기본값이 개인이면 학교/기관이 비활성이라
    // 먼저 개인을 해제한 뒤 학교/기관을 켜야 한다.
    if (audience === 'organization') {
      await this.ensureOrganizationAudience()
    } else {
      await checkCheckboxIfVisible(this.page, /^개인$/)
      await checkCheckboxIfVisible(this.page, '교사/강사')
      await checkCheckboxIfVisible(this.page, '봉사자')
    }

    await selectByPlaceholder(this.page, '사업 분야를 선택해 주세요', '기업가정신')
    await selectNearLabelIfVisible(this.page, '사업 분야', '기업가정신')
    // 복원된 정상 후원사를 임의의 다른 옵션으로 바꾸지 않는다.
    // 값이 없을 때만 첫 번째 선택 가능한 후원사를 고른다.
    await selectNearLabel(this.page, '후원사', this.sponsorLabel)
    const sponsorField = this.page
      .locator('.detail-info-form__field')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', {
          hasText: /^후원사$/,
        }),
      })
      .first()
    const sponsorMultiText = sponsorField.locator('.cms-select-multi__trigger-text').first()
    if ((await sponsorMultiText.count()) > 0) {
      await expect(sponsorMultiText).toBeVisible({ timeout: 10_000 })
      const sponsorSelected = (await sponsorMultiText.innerText()).trim()
      expect(sponsorSelected.length).toBeGreaterThan(0)
      expect(sponsorSelected).not.toContain('선택해 주세요')
      expect(sponsorSelected).not.toBe('전체')
    } else {
      await expect(sponsorField.locator('.ant-select-selection-item')).toBeVisible({
        timeout: 10_000,
      })
      const sponsorSelected = (
        await sponsorField.locator('.ant-select-selection-item').innerText()
      ).trim()
      expect(sponsorSelected.length).toBeGreaterThan(0)
      expect(sponsorSelected).not.toContain('선택해 주세요')
      expect(sponsorSelected).not.toBe('전체')
    }

    await this.ensureSponsorManagerSelected(sponsorField)

    if (this.sponsorManagerLabel) {
      // 엄격 모드: force 클릭 없이 실제 클릭(actionability 검사) 후 체크 확인
      const insideRadio = this.page.getByRole('radio', { name: '기관 안' }).first()
      await insideRadio.check()
      await expect(insideRadio).toBeChecked()
    } else {
      await checkRadioIfVisible(this.page, '기관 안')
    }
    await fillByPlaceholder(this.page, '교육이 진행될 상세 장소를 입력해 주세요', EDUCATION_PLACE)

    await checkCheckboxIfVisible(this.page, '설문조사')
    await checkCheckboxIfVisible(this.page, '만족도조사')
    await checkCheckboxIfVisible(this.page, '강의평가')

    await selectNearLabelIfVisible(this.page, '교육 과정', 'Traditional (Paper)')
    await selectNearLabelIfVisible(this.page, 'IP 소유 기관', 'JA')
    await selectNearLabelIfVisible(this.page, '교육 운영 주체', 'JA')
    await checkRadioIfVisible(this.page, 'Yes')

    // 중·소분류 — 프로그램 유형 설정
    await clickSectionNavIfVisible(this.page, '프로그램 유형 설정')
    await checkRadioIfVisible(this.page, structure === 'curriculum' ? '커리큘럼형' : '일정형')
    await checkRadioIfVisible(this.page, session === 'single' ? '단일 회차' : '복수 회차')

    // 유형 전환 후 교육 진행 섹션이 바뀔 때까지 대기
    const educationSectionTitle =
      structure === 'curriculum' ? '교육 진행 (커리큘럼)' : '교육 진행 (일정형)'
    await expect(this.page.getByText(educationSectionTitle, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    })

    if (session === 'single') {
      await checkRadioIfVisible(this.page, '온라인')
      // 참여 방식 — 개인 대분류일 때만 노출
      await checkRadioIfVisible(this.page, /^개인$/)
    } else {
      await checkRadioIfVisible(this.page, '일정 공통')
      await selectByPlaceholderIfVisible(this.page, '교육 형태', '온라인')
      await selectByPlaceholderIfVisible(this.page, '참여 방식', '개인')
    }
    await selectNearLabelIfVisible(this.page, 'IPS 유형', 'Inspire')
    await selectByPlaceholderIfVisible(this.page, '프로그램 채널을 선택해 주세요')
    await selectByPlaceholderIfVisible(this.page, '프로그램 종류를 선택해 주세요')
    await selectByPlaceholderIfVisible(this.page, 'IPS 유형', 'Inspire')

    await this.fillEducationProgress()

    await clickSectionNavIfVisible(this.page, '교육 진행 일정 설정')
    await checkRadioIfVisible(this.page, '날짜 지정')
    // 교육 진행 일정 — 운영(시작) 기간(+2개월)과 맞춤
    if (this.sponsorManagerLabel) {
      await this.addEducationScheduleDateStrict()
    } else {
      await fillParagraphDateByPlaceholder(
        this.page,
        '일정을 선택해 주세요',
        'single',
        OPERATION_DATE_OPTS
      )
    }
    await fillParagraphDateByPlaceholder(
      this.page,
      '날짜를 선택해 주세요',
      'single',
      OPERATION_DATE_OPTS
    )
    await fillParagraphDateByPlaceholder(
      this.page,
      '기간을 선택해 주세요',
      'range',
      OPERATION_DATE_OPTS
    )

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', KPI_VALUE)

    await clickSectionNavIfVisible(this.page, '임금 정보')
    await fillAllByPlaceholder(this.page, '직접 입력', WAGE_VALUE)
    if (this.paymentItemLabel) {
      // 엄격 모드: 필수 「지급 항목」을 라벨로 실제 클릭 선택(placeholder IfVisible은 cms-select-multi를 못 찾아 조용히 skip했음)
      await selectNearLabel(this.page, '지급 항목', this.paymentItemLabel)
      const payField = this.page
        .locator('.detail-info-form__field')
        .filter({ has: this.page.locator('.detail-info-form__field-label-text', { hasText: /^지급 항목$/ }) })
        .first()
      if ((await this.page.locator('.cms-select-multi__panel:visible').count()) > 0) {
        await payField.locator('.detail-info-form__field-label-text').first().click()
      }
      await expect(this.page.locator('.cms-select-multi__panel:visible')).toHaveCount(0)
      await expect(payField.locator('.cms-select-multi__trigger').first()).toContainText(this.paymentItemLabel)
    } else {
      await selectByPlaceholderIfVisible(this.page, '지급 항목을 선택해 주세요')
    }

    await clickSectionNavIfVisible(this.page, '기본 정보')
  }

  private async fillEducationProgress() {
    const { structure, session } = this.regCase

    if (structure === 'curriculum') {
      await clickSectionNavIfVisible(this.page, '교육 진행 (커리큘럼)')
      if (session === 'multi') {
        await clickButtonIfVisible(this.page, '강의 진행 회차 추가')
      }
      await fillAllByPlaceholder(this.page, '단원명을 입력해 주세요', CURRICULUM_UNIT)
      await fillAllByPlaceholder(this.page, '교육 내용을 작성하세요', CURRICULUM_CONTENT)
      return
    }

    await clickSectionNavIfVisible(this.page, '교육 진행 (일정형)')
    if (session === 'multi') {
      const detailNameInputs = this.page.getByPlaceholder('행사 일정명을 작성하세요')
      const existingDetailCount = await detailNameInputs.count()
      if (existingDetailCount < 2) {
        await clickButtonIfVisible(this.page, /강의 세부 일정 추가|강의 행사 일정 추가/)
        await this.page.waitForTimeout(300)
      }
    }
    await fillAllByPlaceholder(this.page, '세부 일정명을 작성하세요', SCHEDULE_DETAIL_NAME)
    await fillAllByPlaceholder(this.page, '행사 일정명을 작성하세요', SCHEDULE_DETAIL_NAME)
    if (this.sponsorManagerLabel) {
      await this.fillScheduleDetailDatesStrict()
    } else {
      await fillAllParagraphDatesByPlaceholder(
        this.page,
        '일정을 선택해 주세요',
        'single',
        OPERATION_DATE_OPTS
      )
    }
    // 진행 시간 — ParagraphTimePicker(버튼 트리거)
    const timeTriggers = this.page
      .locator('.paragraph-time-picker__trigger:visible')
      .filter({ hasText: '시간 선택' })
    const timeCount = await timeTriggers.count()
    for (let i = 0; i < Math.min(timeCount, 4); i += 1) {
      await fillParagraphTimeIfVisible(this.page, '시간 선택')
    }
    if (this.sponsorManagerLabel) {
      const detail = this.page.getByPlaceholder('일정 상세 내용을 작성하세요')
      const detailCount = await detail.count()
      for (let i = 0; i < detailCount; i += 1) {
        if (!(await detail.nth(i).isVisible())) continue
        await detail.nth(i).fill('격리 E2E 일정 상세')
        await expect(detail.nth(i)).toHaveValue('격리 E2E 일정 상세')
      }
      await expect(
        this.page.locator('.paragraph-time-picker__trigger:visible').filter({ hasText: /^시간 선택$/ }),
        '진행 시간 트리거가 모두 채워져야 한다'
      ).toHaveCount(0)
    }
  }

  async goToRecruitment() {
    if (this.sponsorManagerLabel) {
      const managerField = this.page
        .locator('.detail-info-form__field')
        .filter({
          has: this.page.locator('.detail-info-form__field-label-text', {
            hasText: /^후원사 담당자$/,
          }),
        })
        .first()
      await expect(managerField.locator('.cms-select-multi__trigger, .ant-select').first()).toContainText(
        this.sponsorManagerLabel,
        { timeout: 20_000 }
      )
    }
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).scrollIntoViewIfNeeded()
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/generalStep=recruit-/)
    await expect(this.page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 모집 정보 — 참여자·강사·봉사자 탭 전부 채움 */
  async fillRecruitmentInfo() {
    await this.fillRecruitParticipantTab()
    await clickRegistrationTabIfVisible(this.page, '강사 모집 정보')
    await this.fillRecruitInstructorTab()
    await clickRegistrationTabIfVisible(this.page, '봉사자 모집 정보')
    await this.fillRecruitVolunteerTab()
    await clickRegistrationTabIfVisible(this.page, '참여자 모집 정보')
    await clickRegistrationTabIfVisible(this.page, '참여 기관 모집 정보')
  }

  private async fillRecruitSharedFields(options?: {
    interviewYes?: boolean
    role?: 'participant' | 'instructor' | 'volunteer'
  }) {
    if (options?.interviewYes) {
      await checkRadioIfVisible(this.page, '면접 있음')
    } else {
      await checkRadioIfVisible(this.page, '면접 없음')
    }
    await checkRadioIfVisible(this.page, '게시')

    const operationDateOptions = this.ensureFutureDates
      ? { futureStartWindow: true }
      : OPERATION_DATE_OPTS
    if (!this.devAutofillCaseId || this.ensureFutureDates) {
      await fillParagraphDateByPlaceholder(
        this.page,
        '프로그램 운영 기간을 선택해 주세요',
        'range',
        this.ensureFutureDates ? { futureStartWindow: true } : operationDateOptions
      )
    }
    if (this.sponsorManagerLabel) {
      // 엄격 모드: 필수 「교육 대상」(cms-select-multi)을 실제 클릭 선택. placeholder IfVisible은 .ant-select만 찾아 조용히 skip했음
      // 역할별로 다른 값을 골라 역할 간 혼입을 CREATE·overlay에서 구분할 수 있게 한다(EDUCATION_TARGET_OPTIONS 라벨).
      // 강사 모집 대상은 화면 기본값 「성인」을 건드리지 않고 표시만 확인한다(기본값 저장 검증용, 클릭 우회 금지)
      if (options?.role === 'instructor') await this.expectMultiFieldShows('모집 대상', '성인')
      else if (options?.role === 'volunteer') await this.selectMultiFieldStrict('모집 대상', '대학(원)생')
      else {
        await this.selectMultiFieldStrict('교육 대상', '고등학생')
        if (this.regCase.audience === 'organization') {
          // 기관 모집 「최대값 입력」 2칸 — 라벨 기준으로 명시 입력 후 값 확인
          await this.fillMaxValueStrict('배정 가능 최대 강사 수', '2')
          await this.fillMaxValueStrict('신청 가능 최대 학급 수', '3')
        }
      }
    } else {
      await selectByPlaceholderIfVisible(this.page, '교육 대상을 선택해 주세요')
      await selectByPlaceholderIfVisible(this.page, '모집 대상을 선택해 주세요')
    }
    await fillByPlaceholderIfVisible(
      this.page,
      '상세 교육 대상을 입력해 주세요',
      EDUCATION_TARGET_DETAIL
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '상세 모집 대상을 입력해 주세요',
      EDUCATION_TARGET_DETAIL
    )
    const recruitmentDateOptions = this.openRecruitment
      ? { currentMonthWindow: true }
      : RECRUIT_DATE_OPTS

    await fillParagraphDateByPlaceholder(
      this.page,
      '모집 기간을 선택해 주세요',
      'range',
      recruitmentDateOptions
    )
    await fillParagraphDateByPlaceholder(this.page, '합격자 발표일', 'single', ANNOUNCE_DATE_OPTS)
    await fillParagraphDateByPlaceholder(this.page, '발표일', 'single', ANNOUNCE_DATE_OPTS)
    await fillByPlaceholderIfVisible(this.page, '발표 방법 안내', ANNOUNCE_METHOD)
    await fillByPlaceholderIfVisible(this.page, '담당 문의처', CONTACT_NAME)
    await fillByPlaceholderIfVisible(this.page, '문의처 전화번호', CONTACT_TEL)
    await fillByPlaceholderIfVisible(this.page, '문의처 이메일', CONTACT_EMAIL)
    await fillByPlaceholderIfVisible(this.page, '비고란을 작성하세요 (없으면 -로 입력)', REMARK)
    await fillByPlaceholderIfVisible(this.page, '비고란을 작성하세요', REMARK)

    await fillByPlaceholderIfVisible(
      this.page,
      '프로그램 설명을 작성하세요',
      'E2E 프로그램 설명입니다.'
    )
    await fillByPlaceholderIfVisible(this.page, '프로그램명을 작성하세요', this.programTitle)
    await fillByPlaceholderIfVisible(this.page, '모집 안내를 작성하세요', 'E2E 모집 안내입니다.')
    await fillByPlaceholderIfVisible(this.page, '지원 방법을 작성하세요', 'CMS에서 신청해 주세요.')
    await fillByPlaceholderIfVisible(
      this.page,
      '학습 지원 내용을 작성하세요',
      'E2E 학습 지원 내용입니다.'
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '기타 안내 사항을 작성하세요',
      'E2E 기타 안내입니다.'
    )
    await fillVisibleFreeTextFields(this.page, 'E2E 모집 상세')
    if (!this.skipOptionalUploads) await uploadTinyPngIfPresent(this.page)
  }

  private async fillRecruitParticipantTab() {
    await this.fillRecruitSharedFields({ interviewYes: false, role: 'participant' })
  }

  private async fillRecruitInstructorTab() {
    await this.fillRecruitSharedFields({ interviewYes: false, role: 'instructor' })
  }

  private async fillRecruitVolunteerTab() {
    // 면접 유무 전환 시 봉사자 모집 폼이 재구성되므로, 먼저 「면접 있음」을 선택한 뒤 채운다.
    await this.fillRecruitSharedFields({ interviewYes: true, role: 'volunteer' })
    await fillAllParagraphDatesByPlaceholder(
      this.page,
      '모집 기간을 선택해 주세요',
      'range',
      this.openRecruitment ? { currentMonthWindow: true } : RECRUIT_DATE_OPTS
    )
    await fillParagraphDateByPlaceholder(this.page, '발표일', 'single', ANNOUNCE_DATE_OPTS)
    await fillParagraphDateByPlaceholder(
      this.page,
      '면접 기간을 선택해 주세요',
      'range',
      this.openRecruitment || this.ensureFutureDates
        ? { currentMonthWindow: true }
        : RECRUIT_DATE_OPTS
    )
    if (this.sponsorManagerLabel) {
      // 엄격 모드: 면접 유형은 CmsSelect(INTERVIEW_METHOD_OPTIONS) — 텍스트 fill IfVisible은 조용히 skip했음
      await selectByPlaceholder(this.page, '면접 유형', '온라인')
    } else {
      await fillByPlaceholderIfVisible(this.page, '면접 유형', '대면 면접')
    }
    await fillParagraphDateByPlaceholder(this.page, '합격자 발표일', 'single', ANNOUNCE_DATE_OPTS)
    await fillAllByPlaceholder(this.page, '발표 방법 안내', ANNOUNCE_METHOD)
    if (this.sponsorManagerLabel) await this.fillVolunteerInterviewScheduleStrict()
  }

  async goToApplication() {
    await this.page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/generalStep=application-/)
    await expect(this.page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 신청 정보 — 참여자·강사·봉사자 탭 전부 채움 */
  async fillApplicationInfo() {
    if (this.skipApplicationFormEdits) return
    if (this.sponsorManagerLabel) {
      // 엄격 모드: 신청 정보 단계는 신청 양식 미리보기(신청자 답변란)라 관리자가 값을 넣는 곳이 아니다.
      // 미리보기 라디오에 force 클릭하던 기존 동작을 하지 않고, 탭별 빈 관리자 입력 필드만 감사 로그로 남긴다.
      for (const tab of ['참여자 신청 정보', '참여 기관 신청 정보', '강사 신청 정보', '봉사자 신청 정보']) {
        const t = this.page.getByRole('tab', { name: tab })
        if ((await t.count()) === 0) continue
        await t.first().click()
        // 관리자 입력: 제3자 「제공받는 곳」 셀(application-form-third-party-recipient 필수)
        // 미입력 셀은 값 대신 placeholder 문구를 텍스트로 렌더한다(horizontal-table-paragraph-body.tsx:1182-1184)
        const emptyCells = this.page
          .locator('.form-editor-horizontal-table__td--field')
          .filter({ hasText: /^제공받는 곳을 입력해 주세요$/ })
        const cellCount = await emptyCells.count()
        for (let i = 0; i < cellCount; i += 1) {
          const cell = emptyCells.first()
          const area = this.page.locator('.form-editor-horizontal-table__td--field .text-cell-input textarea, .form-editor-horizontal-table__td--field .text-cell-input input').first()
          // 1차 클릭: 단락 카드 선택(편집 모드 진입), 2차 클릭: 셀 TextCellInput 활성화
          await expect(async () => {
            if (!(await area.isVisible())) await cell.click()
            await expect(area).toBeVisible({ timeout: 1_500 })
          }).toPass({ timeout: 10_000 })
          await area.fill('격리 협력 기관')
          await area.press('Tab')
          await expect(
            this.page.locator('.form-editor-horizontal-table__td--field').filter({ hasText: /^격리 협력 기관$/ })
          ).toHaveCount(i + 1)
        }
        console.log(`[AUDIT application ${tab}]`, JSON.stringify({ recipientCells: cellCount, empty: await this.auditEmptyVisibleFields() }))
      }
      return
    }
    await this.fillApplicationParticipantTab()
    await clickRegistrationTabIfVisible(this.page, '강사 신청 정보')
    await this.fillApplicationInstructorTab()
    await clickRegistrationTabIfVisible(this.page, '봉사자 신청 정보')
    await this.fillApplicationVolunteerTab()
    await clickRegistrationTabIfVisible(this.page, '참여자 신청 정보')
  }

  private async fillApplicationConsentIfPresent() {
    await checkVisibleEnabledConsentCheckboxes(this.page)
  }

  private async fillApplicationParticipantTab() {
    await this.fillApplicationConsentIfPresent()
    await fillByPlaceholderIfVisible(this.page, '팀 명을 입력해 주세요', 'JA E2E 탐험대')
    await selectByPlaceholderIfVisible(this.page, '인원 수')
    await fillByPlaceholderIfVisible(this.page, '팀원 수를 입력해 주세요', '4')
    await checkRadioIfVisible(this.page, '팀장')
    await fillByPlaceholderIfVisible(
      this.page,
      '자유롭게 작성해 주세요',
      'E2E 자기소개 및 지원동기입니다.'
    )
    await fillVisibleFreeTextFields(this.page, 'E2E 신청 정보')
  }

  private async fillApplicationInstructorTab() {
    await this.fillApplicationConsentIfPresent()
    await fillVisibleFreeTextFields(this.page, 'E2E 강사 신청')
    if (!this.skipOptionalUploads) await uploadTinyPngIfPresent(this.page)
  }

  private async fillApplicationVolunteerTab() {
    await this.fillApplicationConsentIfPresent()
    await checkRadioIfVisible(this.page, '있음')
    await fillByPlaceholderIfVisible(this.page, '진행년도', '2025')
    await fillByPlaceholderIfVisible(this.page, '프로그램명', 'E2E 이전 JA 프로그램')
    await fillAllByPlaceholder(
      this.page,
      '자유롭게 작성해 주세요',
      'E2E 봉사자 자유 작성 답변입니다.'
    )
    await fillParagraphDateByPlaceholder(
      this.page,
      '날짜를 선택해 주세요',
      'single',
      RECRUIT_DATE_OPTS
    )
    await fillParagraphTimeIfVisible(this.page, '시간을 선택해 주세요')
    await fillVisibleFreeTextFields(this.page, 'E2E 봉사자 신청')
    if (!this.skipOptionalUploads) await uploadTinyPngIfPresent(this.page)
  }

  /** 실 API 등록 완료 → programId 반환. 실패 모달이면 에러 */
  async completeRegistration(): Promise<RegistrationCompleteResult> {
    const failDialog = this.page.getByRole('dialog').filter({ hasText: /등록 실패/ })
    // 풀페이지 모달 footer 「프로그램 등록 완료」 버튼과 구분
    const successDialog = this.page.getByRole('dialog').filter({ hasText: '등록되었습니다.' })

    // POST가 안 나가고 실패 모달만 뜨는 경우(템플릿 draft 500 등)도 잡기 위해 race
    const outcomePromise = Promise.race([
      this.page
        .waitForResponse(
          res =>
            res.request().method() === 'POST' &&
            /\/api\/admin\/programs\/?$/.test(new URL(res.url()).pathname),
          { timeout: 90_000 }
        )
        .then(res => ({ kind: 'response' as const, res })),
      failDialog.waitFor({ state: 'visible', timeout: 90_000 }).then(async () => {
        const message = (
          await failDialog
            .locator('.alert-modal__content, .ant-modal-body p, .ant-modal-body')
            .first()
            .innerText()
        ).trim()
        return { kind: 'fail' as const, message }
      }),
    ])

    await this.page.getByRole('button', { name: '프로그램 등록 완료' }).click()

    const outcome = await outcomePromise
    if (outcome.kind === 'fail') {
      throw new Error(`프로그램 등록 실패(실 API): ${outcome.message || '(메시지 없음)'}`)
    }

    const createResponse = outcome.res
    if (!createResponse.ok()) {
      const body = await createResponse.text().catch(() => '')
      throw new Error(
        `프로그램 등록 API 실패: HTTP ${createResponse.status()} ${body.slice(0, 400)}`
      )
    }

    let programId = ''
    try {
      const json = (await createResponse.json()) as { data?: { id?: string | number } }
      programId = String(json?.data?.id ?? '')
    } catch {
      programId = ''
    }

    await expect(successDialog).toBeVisible({ timeout: 30_000 })
    await successDialog.getByRole('button', { name: '확인' }).click()

    if (!programId) {
      // 실 API 성공 후에도 현재 화면을 목록에 남겨 두는 환경이 있으므로,
      // URL 전환을 전제로 하지 않고 생성 제목으로 다시 연다.
      await this.page.goto('/programs/general')
      const row = this.page
        .locator('tbody.ant-table-tbody tr.ant-table-row')
        .filter({ hasText: this.programTitle })
        .first()
      await expect(row).toBeVisible({ timeout: 60_000 })
      await row.click()
      await expect(this.page).toHaveURL(/programId=/, { timeout: 30_000 })
      programId = new URL(this.page.url()).searchParams.get('programId') ?? ''
    }

    expect(programId).toMatch(/^\d+$/)

    return {
      programId,
      programTitle: this.programTitle,
      caseLabel: this.regCase.label,
    }
  }

  /** 상세 모달 닫고 목록으로 — 작성한 프로그램 행 존재 확인 */
  async expectProgramVisibleInList(result: RegistrationCompleteResult) {
    const closeButton = this.page.getByRole('button', { name: '닫기' }).first()
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click()
    }

    await this.page.goto('/programs/general')
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const titleFilter = this.page.getByPlaceholder('프로그램명을 입력해 주세요')
    await expect(titleFilter).toBeVisible({ timeout: 15_000 })
    await titleFilter.fill(result.programTitle)
    await this.page.getByRole('button', { name: '조회' }).click()
    await this.page
      .waitForResponse(
        res =>
          res.request().method() === 'GET' &&
          /\/api\/admin\/programs/.test(new URL(res.url()).pathname) &&
          res.ok(),
        { timeout: 30_000 }
      )
      .catch(() => undefined)

    await expect(async () => {
      const byId = this.page.locator(`tr[data-row-key="${result.programId}"]`)
      if ((await byId.count()) > 0) {
        await expect(byId).toBeVisible({ timeout: 5_000 })
        await expect(byId).toContainText(result.programTitle)
        return
      }
      const byTitle = this.page
        .locator('tbody.ant-table-tbody tr.ant-table-row')
        .filter({ hasText: result.programTitle })
        .first()
      await expect(byTitle).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 15_000 })
  }
}
