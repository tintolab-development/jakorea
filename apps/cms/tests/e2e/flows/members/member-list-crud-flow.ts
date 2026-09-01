import { type Page, expect } from '@playwright/test'
import {
  MemberListCrudPage,
  type MemberListCrudKind,
} from '../../pages/member-crud.page'
import { expectAuthenticatedShell } from '../../helpers/authenticated-shell'

const KIND_LIST_PATH: Record<MemberListCrudKind, string> = {
  all: '/users/list?kind=all',
  institutions: '/users/list?kind=institutions',
  instructors: '/users/list?kind=instructors',
  admins: '/users/list?kind=admins',
}

/**
 * 저장된 어드민 세션(storageState) → kind 목록 Create → RUD
 *
 * 대시보드 홈(`/`)을 거치지 않고 목록 URL로 직행해
 * dashboard 위젯 병렬 호출 타임아웃 폭주를 줄입니다.
 *
 * `POST …/pre-register` 요청 스키마에 role 이 없어, 강사·관리자(및 일부 학교)가
 * kind 필터 목록에 안 보일 수 있습니다. 그 경우 동일 식별자로 전체 회원에서 RUD 합니다.
 * (회원 권한 관리 카테고리는 대상 아님)
 *
 * 로그인·MFA 는 `auth.setup.ts` 에서 1회만 수행합니다.
 */
export async function runMemberListCrudFlow(page: Page, kind: MemberListCrudKind) {
  await page.goto(KIND_LIST_PATH[kind])
  await expectAuthenticatedShell(page)

  const createdOn = new MemberListCrudPage(page, kind)
  await expect(page.getByRole('button', { name: createdOn.ui.createButton })).toBeVisible({
    timeout: 30_000,
  })

  await createdOn.createMember()

  let active = createdOn
  const foundOnKindList = await createdOn.tryFindMemberInList(createdOn.memberName)
  if (!foundOnKindList) {
    if (kind === 'all') {
      throw new Error(
        `전체 회원 목록에서 «${createdOn.memberName}» 를 찾지 못했습니다 (등록 직후 조회 실패).`
      )
    }
    // pre-register role 미매핑 → 전체 회원에서 조회·수정·삭제
    active = createdOn.asKind('all')
    await page.goto(KIND_LIST_PATH.all)
    await expect(page.getByRole('button', { name: active.ui.createButton })).toBeVisible({
      timeout: 30_000,
    })
    await active.expectMemberInList(active.memberName)
  }

  await active.openMemberDetail(active.memberName)

  await active.updateMemberName()
  await active.closeDetail()
  await active.expectMemberInList(active.memberNameUpdated)

  await active.deleteMemberFromList(active.memberNameUpdated)
  await active.expectMemberNotInList(active.memberNameUpdated)
}
