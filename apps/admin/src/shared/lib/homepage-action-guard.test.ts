import { describe, expect, it } from 'vitest'
import {
  classifyHomepageActionLabel,
  resolveHomepageActionPermissions,
} from './homepage-action-guard'

describe('classifyHomepageActionLabel', () => {
  it.each([
    '수정',
    '저장',
    '선택 삭제',
    '선택 확인',
    '신청 확인',
    '신청 삭제',
    '공지사항 등록',
    '항목 추가',
    '구성원 수정',
    '이미지 업로드',
    '순서 변경',
  ])('「%s」은 쓰기 버튼이다', label => {
    expect(classifyHomepageActionLabel(label)).toBe('write')
  })

  it.each(['조회', '검색', '목록', '닫기', '취소', '확인', '다운로드', '카테고리 관리', '교육 대상 관리'])(
    '「%s」은 조회·닫기 버튼이라 막지 않는다',
    label => {
      expect(classifyHomepageActionLabel(label)).toBeNull()
    }
  )
})

describe('resolveHomepageActionPermissions', () => {
  it('Program Viewer(HOMEPAGE_VIEW만)는 쓰기·신청자 개인정보가 막힌다', () => {
    expect(
      resolveHomepageActionPermissions({
        resolved: true,
        roleCode: 'PROGRAM_VIEWER',
        permissions: ['HOMEPAGE_VIEW', 'HOMEPAGE_STATS_VIEW'],
      })
    ).toEqual({ write: false, pii: false })
  })

  it('Program Manager는 편집·개인정보 권한이 있으면 허용한다', () => {
    expect(
      resolveHomepageActionPermissions({
        resolved: true,
        roleCode: 'PROGRAM_MANAGER',
        permissions: ['HOMEPAGE_VIEW', 'HOMEPAGE_EDIT', 'HOMEPAGE_PUBLISH', 'HOMEPAGE_PII_VIEW'],
      })
    ).toEqual({ write: true, pii: true })
  })

  it('Master와 프로필 조회 전은 막지 않는다', () => {
    expect(resolveHomepageActionPermissions({ resolved: true, roleCode: 'MASTER' })).toEqual({
      write: true,
      pii: true,
    })
    expect(resolveHomepageActionPermissions({ resolved: false })).toEqual({
      write: true,
      pii: true,
    })
  })
})
