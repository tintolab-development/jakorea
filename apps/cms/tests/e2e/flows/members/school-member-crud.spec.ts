import { test } from '../../fixtures/test'
import { runMemberListCrudFlow } from './member-list-crud-flow'

/**
 * 회원 목록 → 학교(교사) 회원 CRUD
 * 기관명: 틴토랩-*
 * (회원 권한 관리 제외)
 */
test.describe('학교(교사) 회원 관리 CRUD', () => {
  test('틴토랩 학교를 등록·조회·수정·삭제한다', async ({ page }) => {
    test.setTimeout(240_000)
    await runMemberListCrudFlow(page, 'institutions')
  })
})
