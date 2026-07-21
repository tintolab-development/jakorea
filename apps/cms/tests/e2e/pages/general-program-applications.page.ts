import { type Page, expect } from '@playwright/test'
import {
  GeneralProgramDetailPage,
  type DetailOpenResult,
} from './general-program-detail.page'

export type ApplicationApproveResult =
  | { status: 'approved'; programId: string }
  | { status: 'skipped'; reason: string; programId: string }

/**
 * 일반 프로그램 상세 — 신청 목록(기관·강사·봉사자) 승인/반려
 */
export class GeneralProgramApplicationsPage {
  private readonly detail: GeneralProgramDetailPage

  constructor(private readonly page: Page) {
    this.detail = new GeneralProgramDetailPage(page)
  }

  get detailPage() {
    return this.detail
  }

  async openSeed(opened?: DetailOpenResult): Promise<DetailOpenResult> {
    if (opened) {
      await this.detail.gotoDetail(opened.programId, 'info', 'info')
      return opened
    }
    return this.detail.openPreferredDetailSeed()
  }

  /** 테이블 데이터 행(선택 가능) 개수 */
  async countDataRows(): Promise<number> {
    const rows = this.page.locator(
      'tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)'
    )
    return rows.count()
  }

  /** 첫 행 체크박스 선택 */
  async selectFirstRow(): Promise<boolean> {
    const row = this.page
      .locator('tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)')
      .first()
    if ((await row.count()) === 0) return false
    if (!(await row.isVisible().catch(() => false))) return false

    const checkbox = row.locator('.ant-checkbox-input, input.ant-checkbox-input').first()
    if ((await checkbox.count()) === 0) {
      // 체크박스 셀 클릭
      const cell = row.locator('.ant-table-selection-column, td').first()
      await cell.click()
    } else {
      await checkbox.check({ force: true }).catch(async () => {
        await checkbox.click({ force: true })
      })
    }
    return true
  }

  /**
   * 선택 승인 → 확인 모달 → approve API 성공 대기.
   * 행이 없으면 skipped.
   */
  async approveFirstSelectedIfAny(
    programId: string,
    options?: {
      approveButtonName?: RegExp
      modalTitle?: RegExp
      confirmButtonName?: string
      apiPathPattern?: RegExp
    }
  ): Promise<ApplicationApproveResult> {
    const rowCount = await this.countDataRows()
    if (rowCount === 0) {
      return {
        status: 'skipped',
        reason: '신청 목록에 데이터 행이 없습니다 (BE 신청 시드 필요)',
        programId,
      }
    }

    const selected = await this.selectFirstRow()
    if (!selected) {
      return {
        status: 'skipped',
        reason: '첫 행을 선택할 수 없습니다',
        programId,
      }
    }

    const approveBtn = this.page
      .getByRole('button', {
        name: options?.approveButtonName ?? /선택 승인|선택 합격/,
      })
      .first()
    await expect(approveBtn).toBeVisible({ timeout: 15_000 })
    await expect(approveBtn).toBeEnabled({ timeout: 10_000 })

    const apiPattern =
      options?.apiPathPattern ??
      /\/api\/admin\/(organization|instructor|individual|volunteer)-applications\//

    const approvePromise = this.page.waitForResponse(
      res => {
        if (res.request().method() !== 'POST') return false
        const path = new URL(res.url()).pathname
        return (
          apiPattern.test(path) &&
          (/\/approve\/?$/.test(path) ||
            /\/document-result\/?$/.test(path) ||
            /\/final-result\/?$/.test(path))
        )
      },
      { timeout: 60_000 }
    )

    await approveBtn.click()

    const modal = this.page
      .getByRole('dialog')
      .filter({
        hasText: options?.modalTitle ?? /일괄 승인|승인 안내|합격/,
      })
      .first()
    await expect(modal).toBeVisible({ timeout: 15_000 })

    const confirm = modal
      .getByRole('button', { name: options?.confirmButtonName ?? /승인|합격/ })
      .first()
    await confirm.click()

    const res = await approvePromise
    if (!res.ok()) {
      const body = await res.text().catch(() => '')
      throw new Error(`신청 승인 API 실패: HTTP ${res.status()} ${body.slice(0, 400)}`)
    }

    // 완료 모달 닫기
    const doneModal = this.page.getByRole('dialog').filter({ hasText: /승인 완료|합격/ })
    if (await doneModal.isVisible().catch(() => false)) {
      const ok = doneModal.getByRole('button', { name: /확인|닫기/ }).first()
      if (await ok.isVisible().catch(() => false)) {
        await ok.click()
      }
    }

    return { status: 'approved', programId }
  }

  async openInstitutionApplications(programId: string) {
    await this.detail.gotoDetail(programId, 'institution_applications', 'main')
    await this.detail.expectContentSettled()
  }

  async openInstructorApplications(programId: string) {
    await this.detail.gotoDetail(programId, 'instructor_applications', 'main')
    await this.detail.expectContentSettled()
  }

  async openVolunteerApplications(programId: string) {
    await this.detail.gotoDetail(programId, 'volunteer_applications', 'vol_all')
    await this.detail.expectContentSettled()
  }
}
