import { test } from '../../fixtures/test'
import { runMemberListCrudFlow } from './member-list-crud-flow'

/**
 * 로그인 → LNB 회원 관리 → 회원 목록 → 전체 회원
 * → 회원 CRUD (Create / Read / Update / Delete)
 *
 * 한글 성명: 틴토랩-*
 * 전제: DEV 어드민 자동 입력 + MFA, `members` 실 API
 *
 * 백엔드 에러는 fixtures/test 가 자동으로 터미널·e2e-error-log-latest.json 에 남깁니다.
 */
test.describe('전체 회원 관리 CRUD', () => {
  test('틴토랩 회원을 등록·조회·수정·삭제한다', async ({ page }) => {
    test.setTimeout(240_000)
    await runMemberListCrudFlow(page, 'all')
  })
})
