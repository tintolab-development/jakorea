import { test } from '../../fixtures/test'
import { runMemberListCrudFlow } from './member-list-crud-flow'

/**
 * 회원 목록 → 관리자 회원 CRUD
 * 한글 성명: 틴토랩-*
 * (회원 권한 관리 제외)
 *
 * 등록: `POST /api/admin/admin-accounts` (`createAdmin`, FE 연결됨)
 * 목록·삭제: users 목록과 admin-accounts ID 공간 불일치 시 RUD 가 깨질 수 있어
 * 당분간 skip — 등록 API 스모크는 createAdmin 응답만으로 별도 확인 가능
 */
test.describe('관리자 회원 관리 CRUD', () => {
  test.skip(
    '틴토랩 관리자를 등록·조회·수정·삭제한다',
    async ({ page }) => {
      test.setTimeout(240_000)
      await runMemberListCrudFlow(page, 'admins')
    }
  )
})
