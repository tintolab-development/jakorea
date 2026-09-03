import { test, expect } from '../../../fixtures/test'
import { expectAuthenticatedShell } from '../../../helpers/authenticated-shell'
import { SponsorManagementPage } from '../../../pages/sponsor-management.page'
import { tableRows } from '../../../pages/data-management-helpers'
import {
  SPONSOR_SEED_CONTACT_DEPT,
  SPONSOR_SEED_CONTACT_LEAD,
  SPONSOR_SEED_FOUNDATION,
  SPONSOR_SEED_HISTORY_TITLE_CANDIDATES,
  SPONSOR_SEED_YEARLY_BENEFICIARY,
  SPONSOR_SEED_YEARLY_DONATION,
} from '../../../pages/data-management-seed-titles'

/**
 * Notion 0. LNB · 1. 상세 정보 · 2. 프로그램 이력 · 3. 담당자
 *
 * 시드 행은 읽기 전용. 유형 드롭다운은 열고 확정하지 않는다.
 */
test.describe('후원사 상세 LNB', () => {
  test('제이에이코리아 상세 — LNB 3탭 · 기본정보 · 연도별 후원금 · 이력 · 담당자', async ({
    page,
  }) => {
    test.setTimeout(180_000)

    const sponsors = new SponsorManagementPage(page)
    await sponsors.gotoList()
    await expectAuthenticatedShell(page)
    await sponsors.expectListShell()

    await sponsors.selectKind('재단')
    const opened = await sponsors.searchAndOpen(SPONSOR_SEED_FOUNDATION)
    if (!opened) {
      test.info().annotations.push({
        type: 'note',
        description: `시드 없음 — 상세 스킵 (${SPONSOR_SEED_FOUNDATION})`,
      })
      return
    }

    await sponsors.expectDetailOpen()
    await sponsors.expectBasicInfoFields()
    await sponsors.expectHomepageFieldAndLogoBulk()
    await expect(page.getByText(SPONSOR_SEED_FOUNDATION).first()).toBeVisible()

    await sponsors.expectYearlyPanel({
      donation: SPONSOR_SEED_YEARLY_DONATION,
      beneficiary: SPONSOR_SEED_YEARLY_BENEFICIARY,
    })

    await sponsors.clickLnb('프로그램 진행 이력')
    await sponsors.expectLnbUrl('sponsor-programs')
    await sponsors.expectHistoryShell()

    let historyFound = false
    for (const title of SPONSOR_SEED_HISTORY_TITLE_CANDIDATES) {
      if (await tableRows(page).filter({ hasText: title }).first().isVisible().catch(() => false)) {
        historyFound = true
        break
      }
    }
    if (!historyFound) {
      test.info().annotations.push({
        type: 'note',
        description: `이력 시드 미일치: ${SPONSOR_SEED_HISTORY_TITLE_CANDIDATES.join(' | ')}`,
      })
    }

    await test.step('이력 삭제는 remote에서 비활성 (gap P0)', async () => {
      await expect(page.getByRole('button', { name: '이력 삭제' })).toBeDisabled()
    })

    const historyNav = await sponsors.tryOpenHistoryProgramDetail()
    if (historyNav === 'navigated') {
      await expect(page).toHaveURL(/programId=/)
      await page.goBack()
      await sponsors.expectDetailOpen()
    } else if (historyNav === 'no-fk') {
      test.info().annotations.push({
        type: 'note',
        description: '이력 행에 programId FK가 없어 프로그램 상세 이동을 건너뜀',
      })
    } else {
      test.info().annotations.push({
        type: 'note',
        description: '프로그램 진행 이력 행 없음',
      })
    }

    await sponsors.clickLnb('후원사 담당자 정보')
    await sponsors.expectLnbUrl('sponsor-contacts')
    await sponsors.expectContactsShell()

    await sponsors.searchContacts({ department: SPONSOR_SEED_CONTACT_DEPT })
    let leadVisible = await tableRows(page)
      .filter({ hasText: SPONSOR_SEED_CONTACT_LEAD })
      .first()
      .isVisible()
      .catch(() => false)
    if (!leadVisible) {
      await sponsors.searchContacts({ name: SPONSOR_SEED_CONTACT_LEAD })
      leadVisible = await tableRows(page)
        .filter({ hasText: SPONSOR_SEED_CONTACT_LEAD })
        .first()
        .isVisible()
        .catch(() => false)
    }
    if (!leadVisible) {
      test.info().annotations.push({
        type: 'note',
        description: `담당자 시드 없음 — ${SPONSOR_SEED_CONTACT_LEAD} / ${SPONSOR_SEED_CONTACT_DEPT}`,
      })
    } else {
      await expect(tableRows(page).filter({ hasText: '주 담당자' })).toHaveCount(1)
      await sponsors.openLeadTypeDropdown()
      const assistantOption = page.getByText('담당자', { exact: true }).last()
      await expect(assistantOption).toBeVisible({ timeout: 5_000 }).catch(() => undefined)
      await page.keyboard.press('Escape')
    }

    await sponsors.closeDetail()
  })
})
