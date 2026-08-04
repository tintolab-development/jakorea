/**
 * UJAT 프로그램 신규 등록 POM
 *
 * 플로우: 공통 → 모집(참여자·상/하반기 봉사) → 신청(학교·봉사) → 등록 완료
 */

import { type Page, expect } from '@playwright/test'
import {
  checkCheckboxIfVisible,
  checkRadioIfVisible,
  clickRegistrationTabIfVisible,
  clickSectionNavIfVisible,
  fillAllByPlaceholder,
  fillByPlaceholderIfVisible,
  fillParagraphDateByPlaceholder,
  fillVisibleFreeTextFields,
  selectByPlaceholderIfVisible,
  selectNearLabelIfVisible,
  uploadTinyPngIfPresent,
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

  constructor(private readonly page: Page) {
    this.programTitle = createUniqueProgramTitle()
  }

  async openNewRegistration() {
    await this.page.getByRole('button', { name: '프로그램 신규 등록' }).click()

    const draftDialog = this.page.getByRole('dialog').filter({ hasText: '임시저장 이력 안내' })
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
    await this.page
      .waitForResponse(res => /sponsor/i.test(res.url()) && res.ok(), { timeout: 20_000 })
      .catch(() => undefined)
  }

  async fillCommonInfo() {
    await clickSectionNavIfVisible(this.page, '기본 정보')

    // 국문·영문 대표명이 동일 placeholder 2개
    const titleInputs = this.page.getByPlaceholder('대표 프로그램명을 입력하세요')
    await expect(titleInputs.first()).toBeVisible({ timeout: 15_000 })
    await titleInputs.nth(0).fill(this.programTitle)
    if ((await titleInputs.count()) >= 2) {
      await titleInputs.nth(1).fill(PROGRAM_EN_NAME)
    }

    await fillByPlaceholderIfVisible(
      this.page,
      '모집 시 노출될 프로그램명을 입력하세요',
      PROGRAM_PUBLIC_NAME
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '프로그램 관리명을 입력하세요',
      `관리·${this.programTitle}`
    )

    await selectByPlaceholderIfVisible(this.page, '세부 프로그램명을 선택하세요')
    await fillParagraphDateByPlaceholder(
      this.page,
      '사업 운영 기간을 선택하세요',
      'range',
      OPERATION_DATE_OPTS
    )

    await selectByPlaceholderIfVisible(this.page, '사업 분야를 선택하세요', '경제금융')
    await selectNearLabelIfVisible(this.page, '사업 분야', '경제금융')
    await selectNearLabelIfVisible(this.page, '후원사')
    await selectNearLabelIfVisible(this.page, '후원사 담당자')
    await selectByPlaceholderIfVisible(this.page, '후원사를 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '후원사 담당자를 선택하세요')

    await fillByPlaceholderIfVisible(
      this.page,
      '교육이 진행될 상세 장소를 입력해 주세요',
      EDUCATION_PLACE
    )

    await checkCheckboxIfVisible(this.page, '설문조사')
    await checkCheckboxIfVisible(this.page, '만족도조사')

    await clickSectionNavIfVisible(this.page, '교육 진행 (커리큘럼)')
    await fillAllByPlaceholder(this.page, '단원명을 입력하세요', CURRICULUM_UNIT)
    await fillAllByPlaceholder(this.page, '교육 내용을 작성하세요', CURRICULUM_CONTENT)

    await clickSectionNavIfVisible(this.page, '교육 진행 일정 설정')
    await checkRadioIfVisible(this.page, '날짜 지정')
    await fillParagraphDateByPlaceholder(
      this.page,
      '일정을 선택하세요',
      'single',
      OPERATION_DATE_OPTS
    )
    await fillParagraphDateByPlaceholder(
      this.page,
      '기간을 선택하세요',
      'range',
      OPERATION_DATE_OPTS
    )

    await clickSectionNavIfVisible(this.page, '사업 KPI 목표')
    await fillAllByPlaceholder(this.page, '목표값 입력', KPI_VALUE)

    await clickSectionNavIfVisible(this.page, '임금 정보')
    await fillAllByPlaceholder(this.page, '직접 입력', WAGE_VALUE)
    await selectByPlaceholderIfVisible(this.page, '지급 항목을 선택하세요')

    await clickSectionNavIfVisible(this.page, '기본 정보')
  }

  async goToRecruitment() {
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).scrollIntoViewIfNeeded()
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/ujatStep=recruit-/)
    await expect(this.page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** 모집 — 참여자 + 상/하반기 봉사자 */
  async fillRecruitmentInfo() {
    await this.fillRecruitSharedFields()
    await clickRegistrationTabIfVisible(this.page, '상반기 봉사자 모집 정보')
    await this.fillRecruitSharedFields()
    await clickRegistrationTabIfVisible(this.page, '하반기 봉사자 모집 정보')
    await this.fillRecruitSharedFields()
    await clickRegistrationTabIfVisible(this.page, '참여자 모집 정보')
  }

  private async fillRecruitSharedFields() {
    await checkRadioIfVisible(this.page, '면접 없음')
    await checkRadioIfVisible(this.page, '게시')

    await fillParagraphDateByPlaceholder(
      this.page,
      '프로그램 운영 기간을 선택하세요',
      'range',
      OPERATION_DATE_OPTS
    )
    await selectByPlaceholderIfVisible(this.page, '교육 대상을 선택하세요')
    await selectByPlaceholderIfVisible(this.page, '모집 대상을 선택하세요')
    await fillByPlaceholderIfVisible(
      this.page,
      '상세 교육 대상을 입력하세요',
      EDUCATION_TARGET_DETAIL
    )
    await fillByPlaceholderIfVisible(
      this.page,
      '상세 모집 대상을 입력하세요',
      EDUCATION_TARGET_DETAIL
    )
    await fillParagraphDateByPlaceholder(
      this.page,
      '모집 기간을 선택하세요',
      'range',
      RECRUIT_DATE_OPTS
    )
    await fillParagraphDateByPlaceholder(
      this.page,
      '합격자 발표일',
      'single',
      ANNOUNCE_DATE_OPTS
    )
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
    await fillByPlaceholderIfVisible(this.page, '모집 안내를 작성하세요', 'E2E UJAT 모집 안내입니다.')
    await fillVisibleFreeTextFields(this.page, 'E2E UJAT 모집 상세')
    await uploadTinyPngIfPresent(this.page)
  }

  async goToApplication() {
    await this.page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/ujatStep=application-/)
    await expect(this.page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
      timeout: 30_000,
    })
  }

  async fillApplicationInfo() {
    await this.fillApplicationConsentIfPresent()
    await fillVisibleFreeTextFields(this.page, 'E2E UJAT 학교 신청')
    await clickRegistrationTabIfVisible(this.page, '봉사자 신청 정보')
    await this.fillApplicationConsentIfPresent()
    await fillVisibleFreeTextFields(this.page, 'E2E UJAT 봉사자 신청')
    await uploadTinyPngIfPresent(this.page)
    await clickRegistrationTabIfVisible(this.page, '참여자 신청 정보')
  }

  private async fillApplicationConsentIfPresent() {
    const checkboxes = this.page.getByRole('checkbox')
    const count = await checkboxes.count()
    for (let i = 0; i < count; i += 1) {
      const box = checkboxes.nth(i)
      if (!(await box.isVisible().catch(() => false))) continue
      if (await box.isChecked().catch(() => false)) continue
      await box.check({ force: true }).catch(() => undefined)
    }
  }

  async completeRegistration(): Promise<UjatRegistrationCompleteResult> {
    const failDialog = this.page.getByRole('dialog').filter({ hasText: /등록 실패/ })
    const successDialog = this.page
      .getByRole('dialog')
      .filter({ hasText: '신규 프로그램 등록이 완료되었습니다.' })

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
      await successDialog.getByRole('button', { name: /확인|닫기/ }).click().catch(() => undefined)
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
    return { programId, programTitle: this.programTitle }
  }

  async expectProgramVisibleInList(created: UjatRegistrationCompleteResult) {
    await this.page.goto(LIST_PATH)
    await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
      timeout: 30_000,
    })

    const titleFilter = this.page.getByPlaceholder(/프로그램명/)
    if ((await titleFilter.count()) > 0) {
      await titleFilter.fill(created.programTitle)
      await this.page.getByRole('button', { name: '조회' }).click().catch(() => undefined)
    }

    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row')
      .filter({ hasText: created.programTitle })
      .first()
    await expect(row).toBeVisible({ timeout: 60_000 })
  }
}
