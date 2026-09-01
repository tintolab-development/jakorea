import { test } from '../../fixtures/test'
import { runMemberListCrudFlow } from './member-list-crud-flow'

/**
 * 회원 목록 → 강사 회원 CRUD
 * 한글 성명: 틴토랩-*
 * (회원 권한 관리 제외)
 */
test.describe('강사 회원 관리 CRUD', () => {
  test('틴토랩 강사를 등록·조회·수정·삭제한다', async ({ page }) => {
    test.setTimeout(240_000)
    await runMemberListCrudFlow(page, 'instructors')
  })
})
