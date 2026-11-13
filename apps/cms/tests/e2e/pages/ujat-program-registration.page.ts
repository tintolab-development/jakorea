/**
 * UJAT 프로그램 신규 등록 POM
 *
 * 플로우: 공통 → 모집(참여자·상/하반기 봉사) → 신청(기관·봉사자) → 등록 완료
 */

import { type Page, expect } from '@playwright/test'
import { readBrowserAccessToken } from '../helpers/browser-access-token'
import {
  checkCheckboxIfVisible,
  checkRadioIfVisible,
  clickRegistrationTabIfVisible,
  clickSectionNavIfVisible,
  fillAllByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  fillAllParagraphDatesByPlaceholder,
  fillVisibleFreeTextFields,
  selectByPlaceholderIfVisible,
  selectNearLabelIfVisible,
} from './form-helpers'

const LIST_PATH = '/programs/ujat'

function createUniqueProgramTitle() {
  const hash = Date.now().toString(36)
  return `Playwright UJAT 테스트·${hash}`
}

const PROGRAM_EN_NAME = 'JA UJAT Classroom 2026 E2E'
const PROGRAM_PUBLIC_NAME = 'JA UJAT 참여자 모집'
const EDUCATION_PLACE = '서울시 중구 JA Korea UJAT 교육장'
const KPI_VALUE = '30'
const WAGE_VALUE = '150000'
const CONTACT_NAME = 'JA Korea UJAT 운영팀'
const CONTACT_TEL = '02-1234-5678'
const CONTACT_EMAIL = 'ujat-e2e@jakorea.org'
const REMARK = 'E2E UJAT 자동 등록 테스트용 비고'
const EDUCATION_TARGET_DETAIL = '초등 학교 대상 경제교육'
const ANNOUNCE_METHOD = '이메일 및 CMS 알림으로 개별 안내'
const CURRICULUM_UNIT = 'E2E UJAT 1차시 단원'
const CURRICULUM_CONTENT = 'E2E UJAT 교육 내용입니다.'

const OPERATION_DATE_OPTS = { futureMonthClicks: 2 } as const
const RECRUIT_DATE_OPTS = { futureMonthClicks: 1 } as const
const ANNOUNCE_DATE_OPTS = { futureMonthClicks: 1, preferLaterDays: true } as const

export type UjatRegistrationCompleteResult = {
  programId: string
  programTitle: string
}

export class UjatProgramRegistrationPage {
  readonly programTitle: string
  private devAutofillApplied = false

  constructor(private readonly page: Page) {
    this.programTitle = createUniqueProgramTitle()
  }

  /**
   * complete 이벤트는 클릭 전에 구독한다. 실패 다이얼로그가 뜨면 360s가 아니라 즉시 실패한다.
   */
  private async clickDevAutofill() {
    const autofill = this.page.getByRole('button', { name: '자동입력(개발용)' })
    await this.page.evaluate(() => {
      const w = window as unknown as { __ujatAutofillDone?: boolean }
      w.__ujatAutofillDone = false
      window.addEventListener(
        'cms:registration-dev-autofill-complete',
        () => {
          w.__ujatAutofillDone = true
        },
        { once: true }
      )
    })
    await autofill.click()
    const failDialog = this.page.getByRole('dialog').filter({ hasText: '자동입력 실패' })
    try {
      await this.page.waitForFunction(
        () => (window as unknown as { __ujatAutofillDone?: boolean }).__ujatAutofillDone === true,
        null,
        { timeout: 30_000 }
      )
    } catch (error) {
      const failed = await failDialog.isVisible().catch(() => false)
      if (failed) {
        throw new Error(`UJAT 자동입력 실패: ${(await failDialog.innerText()).trim()}`)
      }
      throw error
    }
  }

  async openNewRegistration() {
    await this.page.getByRole('button', { name: /신규 등록/ }).click()

    const draftDialog = this.page.getByRole('dialog').filter({ hasText: '임시 저장 이력 안내' })
    if (await draftDialog.isVisible().catch(() => false)) {
      await draftDialog.getByRole('radio', { name: '신규 등록' }).check()
      await draftDialog.getByRole('button', { name: '프로그램 등록' }).click()
    }

    await expect(this.page).toHaveURL(/\/programs\/ujat\?.*new=1/)
    await expect(this.page.getByText('UJAT 프로그램 등록', { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    await expect(this.page.getByRole('button', { name: '모집 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
    const networkError = this.page.getByRole('dialog').filter({ hasText: '네트워크 오류' })
    if (await networkError.isVisible().catch(() => false)) {
      await networkError.getByRole('button', { name: '확인' }).click()
    }
    // DEV 전용 자동입력은 화면의 실제 overlay/state를 채우는 공식 개발 도구다.
    // 이후 고유 제목을 다시 입력해 테스트 데이터가 겹치지 않도록 한다.
    const autofill = this.page.getByRole('button', { name: '자동입력(개발용)' })
    if (await autofill.isVisible().catch(() => false)) {
      await this.clickDevAutofill()
      this.devAutofillApplied = true
      await expect(
        this.page.getByPlaceholder('대표 프로그램명을 입력해 주세요').first()
      ).not.toHaveValue('', {
        timeout: 15_000,
      })
      // 자동입력 이벤트가 끝났어도 초기 Form editor hydration이 한 프레임
      // 늦게 끝날 수 있다. 실제 화면에 필수 기간·교육 과정이 반영된 뒤
      // 다음 단계로 진행해야 gate가 정상적으로 같은 overlay를 읽는다.
      await expect(
        this.page.getByRole('button', { name: '사업 운영 기간을 선택해 주세요', exact: true })
      ).toHaveCount(0, { timeout: 15_000 })
      // 자동입력 샘플은 호출마다 교육 과정이 달라질 수 있다. 특정 라벨을
      // 고정하지 않고 실제 교육 과정 Select가 선택값을 가진 시점만 기다린다.
      await expect(
        this.page
          .locator('.detail-info-form__field')
          .filter({ hasText: '교육 과정' })
          .locator('.ant-select-selection-item')
          .first()
      ).toBeVisible({ timeout: 15_000 })
      await this.page
        .getByPlaceholder('대표 프로그램명을 입력해 주세요')
        .first()
        .fill(this.programTitle)
      const autofillAlert = this.page.getByRole('dialog').filter({ hasText: '자동입력 완료' })
      if (await autofillAlert.isVisible().catch(() => false)) {
        await autofillAlert.getByRole('button', { name: '확인' }).click()
      }
    }
    await this.page
      .waitForResponse(res => /sponsor/i.test(res.url()) && res.ok(), { timeout: 20_000 })
      .catch(() => undefined)
  }

  async fillCommonInfo() {
    await clickSectionNavIfVisible(this.page, '기본 정보')

    // 국문·영문 대표명이 동일 placeholder 2개
    const titleInputs = this.page.getByPlaceholder('대표 프로그램명을 입력해 주세요')
    await expect(titleInputs.first()).toBeVisible({ timeout: 15_000 })
    await titleInputs.nth(0).fill(this.programTitle)
    if ((await titleInputs.count()) >= 2) {
      await titleInputs.nth(1).fill(PROGRAM_EN_NAME)
    }

    await fillByPlaceholderIfVisible(
      this.page,
      '모집 시 노출될 프로그램명을 입력해 주세요',
      PROGRAM_PUBLIC_NAME
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '프로그램 관리명을 입력해 주세요',
      `관리·${this.programTitle}`
    )

    await selectByPlaceholderIfVisible(this.page, '세부 프로그램명을 선택해 주세요')
    await selectByPlaceholderIfVisible(this.page, '교육 과정을 선택해 주세요')
    await selectNearLabelIfVisible(this.page, '교육 과정')
    if (!this.devAutofillApplied) {
      await fillParagraphDateByPlaceholder(
        this.page,
        '사업 운영 기간을 선택해 주세요',
        'range',
        OPERATION_DATE_OPTS
      )
    }

    await selectByPlaceholderIfVisible(this.page, '사업 분야를 선택해 주세요', '경제금융')
    await selectNearLabelIfVisible(this.page, '사업 분야', '경제금융')
    await selectNearLabelIfVisible(this.page, '후원사')
    await selectNearLabelIfVisible(this.page, '후원사 담당자')
    await selectByPlaceholderIfVisible(this.page, '후원사를 선택해 주세요')
    await selectByPlaceholderIfVisible(this.page, '후원사 담당자를 선택해 주세요')

    await fillByPlaceholderIfVisible(
      this.page,
      '교육이 진행될 상세 장소를 입력해 주세요',
      EDUCATION_PLACE
    )

    await checkCheckboxIfVisible(this.page, '설문조사')
    await checkCheckboxIfVisible(this.page, '봉사단 만족도조사')
    await checkCheckboxIfVisible(this.page, '학교 만족도조사')
    await checkCheckboxIfVisible(this.page, '강의평가')

    await clickSectionNavIfVisible(this.page, '교육 진행 (커리큘럼)')
    await fillAllByPlaceholder(this.page, '단원명을 입력해 주세요', CURRICULUM_UNIT)
    await fillAllByPlaceholder(this.page, '교육 내용을 작성하세요', CURRICULUM_CONTENT)

    if (this.devAutofillApplied) {
      // 개발 자동입력은 UJAT 반기 일정·지역 정원·KPI·임금까지 함께
      // 채운다. 동일 필드를 다시 조작하면 controlled overlay가 재렌더링
      // 되면서 일정값을 비울 수 있으므로 자동입력 결과를 canonical 값으로
      // 유지하고, 화면 단계 전환/등록 validation을 그대로 검증한다.
      await clickSectionNavIfVisible(this.page, '기본 정보')
      return
    }

    await clickSectionNavIfVisible(this.page, '교육 진행 일정 설정')
    await checkRadioIfVisible(this.page, '날짜 지정')
    await fillAllParagraphDatesByPlaceholder(
      this.page,
      '일정을 선택해 주세요',
      'single',
      OPERATION_DATE_OPTS
    )
    await fillAllParagraphDatesByPlaceholder(
      this.page,
      '기간을 선택해 주세요',
      'range',
      OPERATION_DATE_OPTS
    )

    // UJAT 반기 일정은 사전교육·행사·해단식이 각각 별도 필수 필드다.
    // 같은 화면에 반복 렌더링되므로 현재 보이는 미입력 피커를 모두 채운다.
    await fillAllParagraphDatesByPlaceholder(
      this.page,
      '교육 진행 일정을 선택해 주세요',
      'range',
      OPERATION_DATE_OPTS
    )

    // 행을 채우면 React 상태 갱신으로 다음 행이 다시 렌더링될 수 있으므로
    // 고정 count가 아닌 "남은 placeholder" 기준으로 반복한다. UJAT의
    // 지역 선택기는 시각적으로는 버튼으로 노출되어 `.ant-select` 내부
    // placeholder locator가 잡히지 않는 경우가 있어 접근성 이름을 기준으로 연다.
    for (let i = 0; i < 20; i += 1) {
      const regionButtons = this.page
        .locator('.cms-select-multi__trigger:visible')
        .filter({ hasText: '교육 지역을 선택해 주세요' })
      const count = await regionButtons.count()
      let target = regionButtons.first()
      for (let index = 0; index < count; index += 1) {
        const candidate = regionButtons.nth(index)
        if (await candidate.isVisible().catch(() => false)) {
          target = candidate
          break
        }
      }
      if (!(await target.isVisible().catch(() => false))) break

      await target.scrollIntoViewIfNeeded()
      await target.click({ force: true })
      const panel = this.page.locator('.cms-select-multi__panel:visible').last()
      await expect(panel).toBeVisible({ timeout: 10_000 })
      const row = panel.locator('.cms-select-multi__row').first()
      await expect(row).toBeVisible({ timeout: 10_000 })
      await row.locator('.cms-select-multi__checkbox').first().click({ force: true })
      // 다중 선택 패널은 체크 후에도 열려 있으므로, live locator인
      // `target`을 다시 클릭하지 않고 팝오버 바깥을 클릭해 닫는다.
      await this.page.mouse.click(80, 90)
      await expect(panel)
        .toBeHidden({ timeout: 5_000 })
        .catch(() => undefined)
    }

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', KPI_VALUE)

    await clickSectionNavIfVisible(this.page, '임금 정보')
    await fillAllByPlaceholder(this.page, '직접 입력', WAGE_VALUE)
    await selectByPlaceholderIfVisible(this.page, '지급 항목을 선택해 주세요')

    await clickSectionNavIfVisible(this.page, '지역 별 교육 진행 가능 학급 및 봉사단 수')
    await fillAllByPlaceholder(this.page, '최대 학급 수', '1')
    await fillAllByPlaceholder(this.page, '최대 봉사자 수', '1')

    await clickSectionNavIfVisible(this.page, '기본 정보')
  }

  async goToRecruitment() {
    const nextButton = this.page.getByRole('button', { name: '모집 정보 작성하기' })
    await expect(nextButton).toBeVisible({ timeout: 30_000 })
    await nextButton.click()
    await expect(this.page).toHaveURL(/ujatStep=recruit-/)
    await expect(this.page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 모집 — 참여자 + 상/하반기 봉사자 */
  async fillRecruitmentInfo() {
    const autofill = this.page.getByRole('button', { name: '자동입력(개발용)' })
    if (await autofill.isVisible().catch(() => false)) {
      await this.clickDevAutofill()
      const autofillAlert = this.page.getByRole('dialog').filter({ hasText: '자동입력 완료' })
      if (await autofillAlert.isVisible().catch(() => false)) {
        await autofillAlert.getByRole('button', { name: '확인' }).click()
      }
      await expect(this.page.getByRole('tab', { name: '참여 기관 모집 정보' })).toBeVisible({
        timeout: 15_000,
      })

      // 모집 단계 자동입력은 공통정보 샘플 제목도 함께 갱신한다.
      // 목록 검증용 고유 제목을 유지하기 위해 실제 UI로 공통정보에
      // 돌아가 제목을 복원한 뒤 모집 단계로 다시 진입한다.
      const backToCommon = this.page.getByRole('button', { name: /공통 정보 돌아가기/ })
      await expect(backToCommon).toBeVisible({ timeout: 15_000 })
      await backToCommon.click()
      await expect(this.page).toHaveURL(/ujatStep=program/)

      const titleInputs = this.page.locator(
        'input[placeholder="대표 프로그램명을 입력해 주세요"]:visible'
      )
      await expect(titleInputs.first()).toBeVisible({ timeout: 15_000 })
      await titleInputs.first().fill(this.programTitle)
      await titleInputs.first().press('Tab')
      await expect(titleInputs.first()).toHaveValue(this.programTitle)

      await this.page.getByRole('button', { name: '모집 정보 작성하기' }).click()
      await expect(this.page).toHaveURL(/ujatStep=recruit-/)
    }
    await this.fillRecruitSharedFields()
    await clickRegistrationTabIfVisible(this.page, '상반기 봉사자 모집 정보')
    await this.fillRecruitSharedFields()
    await clickRegistrationTabIfVisible(this.page, '하반기 봉사자 모집 정보')
    await this.fillRecruitSharedFields()
    await clickRegistrationTabIfVisible(this.page, '참여자 모집 정보')
  }

  async goToApplication() {
    const nextButton = this.page.getByRole('button', { name: '신청 정보 작성하기' })
    await expect(nextButton).toBeVisible({ timeout: 30_000 })
    await nextButton.click()
    await expect(this.page).toHaveURL(/ujatStep=application-ujat-/)
    await expect(this.page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(this.page.getByRole('tab', { name: '참여 기관 신청 정보' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(this.page.getByRole('tab', { name: '봉사자 신청 정보' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 신청 — 참여 기관·봉사자 탭 왕복과 overlay/draft 보존을 확인한다. */
  async fillApplicationInfo() {
    await checkRadioIfVisible(this.page, '서울')
    await fillByPlaceholderIfVisible(
      this.page,
      '교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요',
      '서울시 중구 JA Korea UJAT 신청 기관 상세 주소'
    )
    await fillAllByPlaceholder(this.page, '담당 교사의 내선(직통 번호)', '02-1234-0001')
    await fillAllByPlaceholder(this.page, '담당 교사의 휴대폰 번호', '010-1234-0001')
    await fillAllByPlaceholder(this.page, '담당 교사의 이메일', CONTACT_EMAIL)
    await fillVisibleFreeTextFields(this.page, 'E2E UJAT 기관 신청')

    await clickRegistrationTabIfVisible(this.page, '봉사자 신청 정보')
    // UJAT 신청 Form은 등록 화면 진입 시 수료자 봉사자를 기본값으로 사용한다.
    // 지원 형태별 단락 visibility는 전용 단위 테스트에서 검증하고, E2E에서는
    // 기본값을 임의로 바꾸어 controlled radio 상태를 깨지 않도록 한다.
    await checkRadioIfVisible(this.page, '있음')
    await fillByPlaceholderIfVisible(this.page, '학교명을 입력해 주세요', 'JA Korea 대학교')
    await fillByPlaceholderIfVisible(
      this.page,
      '복수전공이나 부전공이 있을 경우, 함께 기재해 주세요',
      '경제학'
    )
    await fillByPlaceholderIfVisible(this.page, '1365 ID', 'UJAT-E2E-1365')
    await fillVisibleFreeTextFields(this.page, 'E2E UJAT 봉사자 신청')

    await clickRegistrationTabIfVisible(this.page, '참여 기관 신청 정보')
  }

  private async fillRecruitSharedFields() {
    await checkRadioIfVisible(this.page, '면접 없음')
    await checkRadioIfVisible(this.page, '게시')

    await fillParagraphDateByPlaceholder(
      this.page,
      '프로그램 운영 기간을 선택해 주세요',
      'range',
      OPERATION_DATE_OPTS
    )
    await selectByPlaceholderIfVisible(this.page, '교육 대상을 선택해 주세요')
    await selectByPlaceholderIfVisible(this.page, '모집 대상을 선택해 주세요')
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
    await fillParagraphDateByPlaceholder(
      this.page,
      '모집 기간을 선택해 주세요',
      'range',
      RECRUIT_DATE_OPTS
    )
    await fillParagraphDateByPlaceholder(this.page, '합격자 발표일', 'single', ANNOUNCE_DATE_OPTS)
    await fillByPlaceholderIfVisible(this.page, '발표 방법 안내', ANNOUNCE_METHOD)
    await fillByPlaceholderIfVisible(this.page, '담당 문의처', CONTACT_NAME)
    await fillByPlaceholderIfVisible(this.page, '문의처 전화번호', CONTACT_TEL)
    await fillByPlaceholderIfVisible(this.page, '문의처 이메일', CONTACT_EMAIL)
    await fillByPlaceholderIfVisible(this.page, '비고란을 작성하세요 (없으면 -로 입력)', REMARK)
    await fillByPlaceholderIfVisible(
      this.page,
      '프로그램 설명을 작성하세요',
      'E2E UJAT 프로그램 설명입니다.'
    )
    await fillByPlaceholderIfVisible(this.page, '프로그램명을 작성하세요', this.programTitle)
    await fillByPlaceholderIfVisible(
      this.page,
      '모집 안내를 작성하세요',
      'E2E UJAT 모집 안내입니다.'
    )
    await fillVisibleFreeTextFields(this.page, 'E2E UJAT 모집 상세')
  }

  async completeRegistration(): Promise<UjatRegistrationCompleteResult> {
    const failDialog = this.page.getByRole('dialog').filter({ hasText: /등록 실패/ })
    const successDialog = this.page.getByRole('dialog').filter({ hasText: '등록되었습니다.' })

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
      successDialog.waitFor({ state: 'visible', timeout: 90_000 }).then(() => ({
        kind: 'successUi' as const,
      })),
    ])

    await this.page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    const outcome = await outcomePromise

    if (outcome.kind === 'fail') {
      throw new Error(`UJAT 프로그램 등록 실패: ${outcome.message || '(메시지 없음)'}`)
    }

    if (outcome.kind === 'response' && !outcome.res.ok()) {
      const body = await outcome.res.text().catch(() => '')
      throw new Error(
        `UJAT 프로그램 등록 API 실패: HTTP ${outcome.res.status()} ${body.slice(0, 400)}`
      )
    }

    let programId = ''
    if (outcome.kind === 'response') {
      try {
        const json = (await outcome.res.json()) as { data?: { id?: string | number } }
        programId = String(json?.data?.id ?? '')
      } catch {
        programId = ''
      }
    }

    if (await successDialog.isVisible().catch(() => false)) {
      await successDialog
        .getByRole('button', { name: /확인|닫기/ })
        .click()
        .catch(() => undefined)
      await expect(successDialog)
        .toBeHidden({ timeout: 10_000 })
        .catch(() => undefined)
    }

    if (!programId) {
      await this.page.goto(LIST_PATH)
      const row = this.page
        .locator('tbody.ant-table-tbody tr.ant-table-row')
        .filter({ hasText: this.programTitle })
        .first()
      await expect(row).toBeVisible({ timeout: 60_000 })
      await row.click()
      await expect(this.page).toHaveURL(/programId=/, { timeout: 30_000 })
      programId = new URL(this.page.url()).searchParams.get('programId') ?? ''
    }

    expect(programId.length).toBeGreaterThan(0)

    const token = await readBrowserAccessToken(this.page, 'cms')
    const detail = await this.page.evaluate(async ({ id, token }) => {
      const response = await fetch(`/api/admin/programs/${encodeURIComponent(id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const body = (await response.json().catch(() => null)) as {
        data?: { id?: string | number; mainTitle?: string; title?: string }
        id?: string | number
        mainTitle?: string
        title?: string
      } | null
      const program = body?.data ?? body
      return {
        status: response.status,
        id: String(program?.id ?? ''),
        mainTitle: program?.mainTitle ?? '',
        title: program?.title ?? '',
      }
    }, { id: programId, token })
    expect(detail.status, '생성된 UJAT 프로그램 상세 GET이 성공해야 합니다').toBe(200)
    expect(detail.id, '상세 GET의 programId가 생성 응답과 일치해야 합니다').toBe(programId)
    expect(
      detail.mainTitle,
      `상세 GET 대표명이 고유 테스트명과 일치해야 합니다 (actual: ${detail.mainTitle})`
    ).toBe(this.programTitle)

    const bindings = await this.page.evaluate(async ({ id, token }) => {
      const response = await fetch(`/api/admin/programs/${encodeURIComponent(id)}/form-bindings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const body = (await response.json().catch(() => null)) as unknown
      const rows = Array.isArray(body)
        ? body
        : Array.isArray((body as { data?: unknown[] } | null)?.data)
          ? (body as { data: unknown[] }).data
          : Array.isArray((body as { items?: unknown[] } | null)?.items)
            ? (body as { items: unknown[] }).items
            : []
      return {
        status: response.status,
        applicationTemplates: rows
          .filter(row => (row as { formType?: string } | null)?.formType === 'APPLICATION')
          .map(row => String((row as { templateName?: string } | null)?.templateName ?? '')),
      }
    }, { id: programId, token })
    expect(bindings.status, '신청 Form binding GET이 성공해야 합니다').toBe(200)
    expect(bindings.applicationTemplates).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/application-ujat-school$/),
        expect.stringMatching(/application-ujat-volunteer$/),
      ])
    )

    return { programId, programTitle: this.programTitle }
  }

  async expectProgramVisibleInList(created: UjatRegistrationCompleteResult) {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: /신규 등록/ })).toBeVisible({
      timeout: 30_000,
    })

    const titleFilter = this.page.getByPlaceholder(/프로그램명/)
    if ((await titleFilter.count()) > 0) {
      await titleFilter.fill(created.programTitle)
      await this.page
        .getByRole('button', { name: '조회' })
        .click()
        .catch(() => undefined)
    }

    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: created.programTitle })
      .first()
    await expect(row).toBeVisible({ timeout: 60_000 })
  }
}
