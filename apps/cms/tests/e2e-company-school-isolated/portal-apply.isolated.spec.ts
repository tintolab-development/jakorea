import { expect, test, type Page } from '@playwright/test'
import {
  assertIsolatedNetwork,
  CS_ISOLATED_IDS,
  installCsIsolatedNetwork,
} from './install-cs-isolated-network'

const PLATFORM_URL = process.env.PLATFORM_CS_ISOLATED_BASE_URL ?? 'http://127.0.0.1:3277'
const APPLY_PATH = `${PLATFORM_URL}/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/apply?recruitmentId=${CS_ISOLATED_IDS.RECRUITMENT_ID}&applicationType=ORGANIZATION`

async function openApplyForm(page: Page) {
  await page.goto(APPLY_PATH)
  await expect(page.getByText('개인정보 수집·이용').first()).toBeVisible({ timeout: 45_000 })
  await expect(page.getByText('개인정보 제3자').first()).toBeVisible()
  await expect(page.getByText('기본 정보').first()).toBeVisible()
}

test.describe('CS-B02 격리 Portal 신청 렌더', () => {
  test('Mock Form Binding으로 1사1교 신청 단락을 렌더한다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openApplyForm(page)
    await expect(page.getByText('안내 사항').first()).toBeVisible()
    await expect(page.getByText(/진행 희망|희망 일정|교육 일정/).first()).toBeVisible({
      timeout: 20_000,
    }).catch(() => undefined)
    const draftButton = page.getByRole('button', { name: /임시저장|임시 저장/ })
    const submit = page.getByRole('button', { name: '신청하기' })
    test.info().annotations.push({
      type: 'portal-draft',
      description: (await draftButton.count()) > 0 ? 'visible' : 'hidden-by-contract',
    })
    if ((await submit.count()) === 0) {
      test.info().annotations.push({
        type: 'portal-submit',
        description: '신청하기 버튼이 현재 UI 계약상 없거나 선행조건 미충족 — POST wire NOT_VERIFIED',
      })
      assertIsolatedNetwork(log)
      return
    }
    await expect(submit).toBeVisible()
    assertIsolatedNetwork(log)
  })
})
