import { test } from '../../../fixtures/test'
import {
  PROGRAM_LIST_SMOKE_CATEGORIES,
  ProgramListSmokePage,
} from '../../../pages/program-list-smoke.page'

/**
 * Phase 1 — 프로그램관리 전 카테고리 목록·셸 스모크
 *
 * 시드 행이 있으면 featured title로 상세/모달 오픈까지 soft assert.
 * 없으면 목록 로드만 통과하고 annotation으로 사유를 남깁니다.
 */
test.describe('프로그램관리 카테고리 목록 스모크', () => {
  for (const category of PROGRAM_LIST_SMOKE_CATEGORIES) {
    test(`${category.id}`, async ({ page }) => {
      test.setTimeout(120_000)

      const list = new ProgramListSmokePage(page)
      await list.gotoList(category.path)
      await list.expectListShell(category)

      if (!category.featuredTitles?.length) {
        return
      }

      const openedTitle = await list.tryOpenFeatured(category)
      if (!openedTitle) {
        test.info().annotations.push({
          type: 'note',
          description: `시드 없음 — 목록만 통과 (${category.path}): ${category.featuredTitles.join(' | ')}`,
        })
      }
    })
  }
})
