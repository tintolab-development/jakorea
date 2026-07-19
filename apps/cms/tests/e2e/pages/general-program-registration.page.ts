import { type Page, expect } from '@playwright/test'
import { fillByPlaceholder, selectByPlaceholder, selectNearLabel } from './form-helpers'

function createUniqueProgramTitle() {
  return `JA E2E 기업가정신 교실 ${Date.now()}`
}

const PROGRAM_EN_NAME = 'JA Entrepreneurship Classroom 2026 E2E'
const PROGRAM_PUBLIC_NAME = 'JA 기업가정신 교실 참여자 모집'
const EDUCATION_PLACE = '서울시 중구 JA Korea 교육장'
const KPI_PARTICIPANT = '30'
const CONTACT_TEL = '02-1234-5678'
const CONTACT_EMAIL = 'program-e2e@jakorea.org'
const REMARK = 'E2E 자동 등록 테스트용 비고'
const EDUCATION_TARGET_DETAIL = '초·중·고 학생 대상 기업가정신 체험 교육'

export type RegistrationCompleteResult = {
  programId: string
  programTitle: string
}

/**
 * 일반 프로그램 목록 → 신규 등록 풀페이지 모달 플로우
 */
export class GeneralProgramRegistrationPage {
  readonly programTitle: string

  constructor(private readonly page: Page) {
    this.programTitle = createUniqueProgramTitle()
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
    await this.page.getByRole('button', { name: '프로그램 신규 등록' }).click()

    const draftDialog = this.page.getByRole('dialog').filter({ hasText: '임시저장 이력 안내' })
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

  /** 공통 정보 — 고유 프로그램명·후원사 등 (후원사는 원격 등록 필수) */
  async fillCommonInfo() {
    await fillByPlaceholder(this.page, '대표 프로그램명을 입력하세요', this.programTitle)
    await fillByPlaceholder(this.page, '상세 프로그램명을 입력하세요', PROGRAM_EN_NAME)
    await fillByPlaceholder(this.page, '모집 시 노출될 프로그램명을 입력하세요', PROGRAM_PUBLIC_NAME)

    await selectByPlaceholder(this.page, '세부 프로그램명을 선택하세요')
    await selectByPlaceholder(this.page, '사업 분야를 선택하세요', '기업가정신')

    const basicNav = this.page.getByText('기본 정보', { exact: true }).first()
    if (await basicNav.isVisible().catch(() => false)) {
      await basicNav.click()
    }
    await selectNearLabel(this.page, '후원사')
    const sponsorField = this.page
      .locator('.detail-info-form__field')
      .filter({
        has: this.page.locator('.detail-info-form__field-label-text', {
          hasText: /^후원사$/,
        }),
      })
      .first()
    await expect(sponsorField.locator('.ant-select-selection-item')).toBeVisible({
      timeout: 10_000,
    })
    const sponsorSelected = (
      await sponsorField.locator('.ant-select-selection-item').innerText()
    ).trim()
    expect(sponsorSelected.length).toBeGreaterThan(0)
    expect(sponsorSelected).not.toContain('선택하세요')
    expect(sponsorSelected).not.toBe('전체')

    const contactPlaceholder = this.page.locator('.ant-select-selection-placeholder', {
      hasText: '후원사 담당자를 선택하세요',
    })
    if ((await contactPlaceholder.count()) > 0) {
      const contactSelect = this.page
        .locator('.ant-select:visible')
        .filter({ has: contactPlaceholder })
        .first()
      const className = (await contactSelect.getAttribute('class')) ?? ''
      if (!className.includes('ant-select-disabled')) {
        await selectByPlaceholder(this.page, '후원사 담당자를 선택하세요')
      }
    } else {
      await selectNearLabel(this.page, '후원사 담당자').catch(() => undefined)
    }

    await fillByPlaceholder(
      this.page,
      '교육이 진행될 상세 장소를 입력해 주세요',
      EDUCATION_PLACE
    )

    const survey = this.page.getByRole('checkbox', { name: '설문조사' })
    if (await survey.isVisible().catch(() => false)) {
      await survey.check()
    }

    const kpiNav = this.page.getByText('사업 KPI 목표', { exact: true }).first()
    if (await kpiNav.isVisible().catch(() => false)) {
      await kpiNav.click()
    }
    const participantKpi = this.page.getByPlaceholder('목표값 입력').first()
    if (await participantKpi.isVisible().catch(() => false)) {
      await participantKpi.fill(KPI_PARTICIPANT)
    }

    const wageNav = this.page.getByText('임금 정보', { exact: true }).first()
    if (await wageNav.isVisible().catch(() => false)) {
      await wageNav.click()
    }
    const wageInput = this.page.getByPlaceholder('직접 입력').first()
    if (await wageInput.isVisible().catch(() => false)) {
      await wageInput.fill('150000')
    }

    if (await basicNav.isVisible().catch(() => false)) {
      await basicNav.click()
    }
  }

  async goToRecruitment() {
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).scrollIntoViewIfNeeded()
    await this.page.getByRole('button', { name: '모집 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/generalStep=recruit-/)
    await expect(this.page.getByRole('button', { name: '신청 정보 작성하기' })).toBeVisible({
      timeout: 30_000,
    })
  }

  async fillRecruitmentInfo() {
    const educationTarget = this.page.locator('.ant-select-selection-placeholder', {
      hasText: '교육 대상을 선택하세요',
    })
    if ((await educationTarget.count()) > 0) {
      await selectByPlaceholder(this.page, '교육 대상을 선택하세요')
    }

    const detail = this.page.getByPlaceholder('상세 교육 대상을 입력하세요')
    if (await detail.isVisible().catch(() => false)) {
      await detail.fill(EDUCATION_TARGET_DETAIL)
    }

    const announceMethod = this.page.getByPlaceholder('발표 방법 안내')
    if (await announceMethod.isVisible().catch(() => false)) {
      await announceMethod.fill('이메일 및 CMS 알림으로 개별 안내')
    }

    const contact = this.page.getByPlaceholder('담당 문의처')
    if (await contact.isVisible().catch(() => false)) {
      await contact.fill('JA Korea 프로그램 운영팀')
    }
    const tel = this.page.getByPlaceholder('문의처 전화번호')
    if (await tel.isVisible().catch(() => false)) {
      await tel.fill(CONTACT_TEL)
    }
    const email = this.page.getByPlaceholder('문의처 이메일')
    if (await email.isVisible().catch(() => false)) {
      await email.fill(CONTACT_EMAIL)
    }
    const remark = this.page.getByPlaceholder('비고란을 작성하세요 (없으면 -로 입력)')
    if (await remark.isVisible().catch(() => false)) {
      await remark.fill(REMARK)
    }
  }

  async goToApplication() {
    await this.page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await expect(this.page).toHaveURL(/generalStep=application-/)
    await expect(this.page.getByRole('button', { name: '프로그램 등록 완료' })).toBeVisible({
      timeout: 30_000,
    })
  }

  async fillApplicationInfo() {
    const teamName = this.page.getByPlaceholder('팀 명을 입력하세요')
    if (await teamName.isVisible().catch(() => false)) {
      await teamName.fill('JA E2E 탐험대')
    }
    const teamSize = this.page.getByPlaceholder('인원 수')
    if (await teamSize.isVisible().catch(() => false)) {
      await teamSize.fill('5')
    }
    const teamMemberHint = this.page.getByPlaceholder('팀원 수를 입력해 주세요')
    if (await teamMemberHint.isVisible().catch(() => false)) {
      await teamMemberHint.fill('4')
    }

    const textareas = this.page.locator('textarea:visible')
    const count = await textareas.count()
    for (let i = 0; i < Math.min(count, 2); i += 1) {
      await textareas.nth(i).fill(`E2E 신청 정보 작성 ${i + 1} — JA 기업가정신 교실`)
    }
  }

  /** 실 API 등록 완료 → programId 반환. 실패 모달이면 에러 */
  async completeRegistration(): Promise<RegistrationCompleteResult> {
    const failDialog = this.page.getByRole('dialog').filter({ hasText: '등록 실패' })

    const createResponsePromise = this.page.waitForResponse(
      res =>
        res.request().method() === 'POST' &&
        /\/api\/admin\/programs\/?$/.test(new URL(res.url()).pathname),
      { timeout: 60_000 }
    )

    await this.page.getByRole('button', { name: '프로그램 등록 완료' }).click()

    await Promise.race([
      this.page.waitForURL(/programId=/, { timeout: 60_000 }),
      failDialog.waitFor({ state: 'visible', timeout: 60_000 }).then(async () => {
        const message = (
          await failDialog.locator('.ant-modal-body, p, [class*="content"]').first().innerText()
        ).trim()
        throw new Error(`프로그램 등록 실패(실 API): ${message || '(메시지 없음)'}`)
      }),
    ])

    const createResponse = await createResponsePromise
    if (!createResponse.ok()) {
      const body = await createResponse.text().catch(() => '')
      throw new Error(
        `프로그램 등록 API 실패: HTTP ${createResponse.status()} ${body.slice(0, 400)}`
      )
    }

    await expect(this.page).toHaveURL(/programId=/)
    await expect(this.page).not.toHaveURL(/new=1/)

    const programId = new URL(this.page.url()).searchParams.get('programId')
    if (!programId) {
      throw new Error('등록 후 URL에 programId 가 없습니다.')
    }

    return { programId, programTitle: this.programTitle }
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

    // 목록 재조회 반영 대기 — rowKey=id
    await expect(async () => {
      const row = this.page.locator(`tr[data-row-key="${result.programId}"]`)
      if ((await row.count()) === 0) {
        await this.page.reload()
        await expect(this.page.getByRole('button', { name: '프로그램 신규 등록' })).toBeVisible({
          timeout: 30_000,
        })
      }
      await expect(this.page.locator(`tr[data-row-key="${result.programId}"]`)).toBeVisible({
        timeout: 10_000,
      })
      await expect(this.page.locator(`tr[data-row-key="${result.programId}"]`)).toContainText(
        result.programTitle
      )
    }).toPass({ timeout: 90_000 })
  }
}
