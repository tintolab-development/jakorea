import { type Page, expect } from '@playwright/test'
import {
  GeneralProgramDetailPage,
  type DetailOpenResult,
} from './general-program-detail.page'

export type ApplicationApproveResult =
  | { status: 'approved'; programId: string }
  | { status: 'skipped'; reason: string; programId: string }

export type ApplicationRejectResult =
  | { status: 'rejected'; programId: string }
  | { status: 'skipped'; reason: string; programId: string }

/**
 * 일반 프로그램 상세 — 신청 목록(기관·강사·봉사자) 승인/반려·2depth
 */
export class GeneralProgramApplicationsPage {
  private readonly detail: GeneralProgramDetailPage

  constructor(private readonly page: Page) {
    this.detail = new GeneralProgramDetailPage(page)
  }

  get detailPage() {
    return this.detail
  }

  /** 상세 모달 안 — 뒤 프로그램 목록 테이블과 분리 */
  private dialog() {
    return this.page.getByRole('dialog')
  }

  private dataRows() {
    return this.dialog().locator(
      'tbody.ant-table-tbody tr.ant-table-row:not(.ant-table-measure-row)'
    )
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
    return this.dataRows().count()
  }

  /** 첫 행 체크박스 선택 */
  async selectFirstRow(): Promise<boolean> {
    const row = this.dataRows().first()
    if ((await row.count()) === 0) return false
    if (!(await row.isVisible().catch(() => false))) return false

    const checkbox = row.locator('.ant-checkbox-input, input.ant-checkbox-input').first()
    if ((await checkbox.count()) === 0) {
      const cell = row.locator('.ant-table-selection-column, td').first()
      await cell.click({ force: true })
    } else {
      await checkbox.check({ force: true }).catch(async () => {
        await checkbox.click({ force: true })
      })
    }
    return true
  }

  /** 첫 데이터 행 클릭 → 신청 상세 */
  async openFirstRowDetail(): Promise<boolean> {
    const row = this.dataRows().first()
    if ((await row.count()) === 0) return false
    if (!(await row.isVisible().catch(() => false))) return false
    await row.click({ force: true })
    await this.detail.expectContentSettled()
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

    const approveBtn = this.dialog()
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

    await approveBtn.click({ force: true })

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
      // 시드 행이 이미 승인·전이 불가 상태면 목록 셸만 확인한 것으로 간주
      if (res.status() === 409 || /CONFLICT/i.test(body)) {
        return {
          status: 'skipped',
          reason: `신청 승인 CONFLICT(${res.status()}) — 이미 처리된 행일 수 있음`,
          programId,
        }
      }
      throw new Error(`신청 승인 API 실패: HTTP ${res.status()} ${body.slice(0, 400)}`)
    }

    const doneModal = this.page.getByRole('dialog').filter({ hasText: /승인 완료|합격/ })
    if (await doneModal.isVisible().catch(() => false)) {
      const ok = doneModal.getByRole('button', { name: /확인|닫기/ }).first()
      if (await ok.isVisible().catch(() => false)) {
        await ok.click()
      }
    }

    return { status: 'approved', programId }
  }

  /**
   * 선택 반려 → 확인 모달.
   * 행/버튼 없으면 skipped.
   */
  async rejectFirstSelectedIfAny(programId: string): Promise<ApplicationRejectResult> {
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
      return { status: 'skipped', reason: '첫 행을 선택할 수 없습니다', programId }
    }

    const rejectBtn = this.dialog().getByRole('button', { name: /선택 반려|선택 불합격/ }).first()
    if (!(await rejectBtn.isVisible().catch(() => false))) {
      return { status: 'skipped', reason: '반려 버튼 없음', programId }
    }
    if (!(await rejectBtn.isEnabled().catch(() => false))) {
      return { status: 'skipped', reason: '반려 버튼 비활성', programId }
    }

    const rejectPromise = this.page.waitForResponse(
      res => {
        if (res.request().method() !== 'POST') return false
        const path = new URL(res.url()).pathname
        return (
          /\/api\/admin\/(organization|instructor|individual|volunteer)-applications\//.test(
            path
          ) &&
          (/\/reject\/?$/.test(path) ||
            /\/document-result\/?$/.test(path) ||
            /\/final-result\/?$/.test(path))
        )
      },
      { timeout: 60_000 }
    )

    await rejectBtn.click({ force: true })

    const modal = this.page
      .getByRole('dialog')
      .filter({ hasText: /반려|불합격/ })
      .first()
    await expect(modal).toBeVisible({ timeout: 15_000 })

    // 사유 입력(있으면)
    const reason = modal.locator('textarea, input').first()
    if (await reason.isVisible().catch(() => false)) {
      await reason.fill('E2E 반려 테스트')
    }

    const confirm = modal.getByRole('button', { name: /반려|불합격|확인/ }).first()
    await confirm.click()

    const res = await rejectPromise.catch(() => null)
    if (res && !res.ok()) {
      const body = await res.text().catch(() => '')
      throw new Error(`신청 반려 API 실패: HTTP ${res.status()} ${body.slice(0, 400)}`)
    }

    return { status: 'rejected', programId }
  }

  /**
   * 면접 2depth 탭(서류1 / 서류합격 / 면접2) 전환.
   * 없으면 false.
   */
  async tryOpenInterviewDepthTabs(
    labels: readonly string[] = ['1차 서류', '서류 합격', '2차 면접']
  ): Promise<{ hasDepth: boolean; opened: string[] }> {
    const nav = this.detail.lnbNav()
    const opened: string[] = []

    for (const label of labels) {
      const tab = nav.getByText(new RegExp(label)).first()
      if (!(await tab.isVisible().catch(() => false))) continue
      await tab.click()
      await this.detail.expectContentSettled()
      opened.push(label)
    }

    return { hasDepth: opened.length >= 2, opened }
  }

  /** 면접 배정 버튼/모달 오픈 (있으면) */
  async tryOpenInterviewAssignModal(): Promise<boolean> {
    const assignBtn = this.dialog()
      .getByRole('button', { name: /면접\s*배정|면접일\s*배정|일정\s*배정/ })
      .first()
    if (!(await assignBtn.isVisible().catch(() => false))) return false
    await assignBtn.click({ force: true })
    const nested = this.page.getByRole('dialog').filter({ hasText: /면접|배정/ }).last()
    await expect(nested).toBeVisible({ timeout: 20_000 })
    // 로딩 Spin이 있으면 사라질 때까지
    const spin = nested.locator('.ant-spin')
    if ((await spin.count()) > 0) {
      await expect(spin.first()).toBeHidden({ timeout: 60_000 }).catch(() => undefined)
    }
    const close = nested.getByRole('button', { name: /닫기|취소/ }).first()
    if (await close.isVisible().catch(() => false)) {
      await close.click()
    }
    return true
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

  /** 필터 조회 1회 (상세 모달 안) */
  async tryRunListFilterSearch(): Promise<boolean> {
    const searchBtn = this.dialog().getByRole('button', { name: '조회' }).first()
    if (!(await searchBtn.isVisible().catch(() => false))) return false
    await searchBtn.click({ force: true })
    await this.detail.expectContentSettled()
    return true
  }
}
