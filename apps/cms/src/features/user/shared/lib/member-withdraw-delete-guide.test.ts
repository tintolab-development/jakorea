import { describe, expect, it } from 'vitest'
import {
  buildMemberListDeleteGuideLines,
  MEMBER_LIST_WITHDRAW_IMPACT_LINES,
  buildMemberSingleDeleteGuideLines,
  MEMBER_BULK_DELETE_IMPACT_LINE,
  buildMemberWithdrawMessageLines,
  buildSchoolDeleteMessageLines,
  buildSelfWithdrawMessageLines,
} from './member-withdraw-delete-guide'

describe('member-withdraw-delete-guide', () => {
  it('buildMemberWithdrawMessageLines — 표시명 포함', () => {
    const lines = buildMemberWithdrawMessageLines({ displayName: '박민토' })
    expect(lines[0]).toContain('[박민토]')
    expect(lines.some(l => l.includes('탈퇴 처리'))).toBe(true)
  })

  it('buildMemberWithdrawMessageLines — 빈 이름이면 []', () => {
    expect(buildMemberWithdrawMessageLines({ displayName: '  ' })).toEqual([])
    expect(buildMemberWithdrawMessageLines(null)).toEqual([])
  })

  it('buildSchoolDeleteMessageLines — 학교 삭제 문구', () => {
    const lines = buildSchoolDeleteMessageLines({ displayName: '진월초등학교' })
    expect(lines).toEqual([
      '**[진월초등학교]**를 삭제하시겠습니까?',
      '삭제 시 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.',
    ])
  })

  it('buildSelfWithdrawMessageLines — 프로필 본인 탈퇴 문구', () => {
    const lines = buildSelfWithdrawMessageLines()
    expect(lines[0]).toContain('JA KOREA 서비스를 탈퇴')
    expect(lines).toHaveLength(4)
  })

  it('buildMemberSingleDeleteGuideLines — 단건·상세 본문', () => {
    expect(buildMemberSingleDeleteGuideLines('홍길동')).toEqual([
      '**[홍길동] 님**을 삭제하시겠습니까?',
      MEMBER_BULK_DELETE_IMPACT_LINE,
    ])
    expect(buildMemberSingleDeleteGuideLines('  ')).toEqual([])
  })

  it('buildMemberListDeleteGuideLines — 전체 회원 단일은 탈퇴 처리 안내', () => {
    expect(buildMemberListDeleteGuideLines(['홍길동'], 'all')).toEqual([
      '**[홍길동]** 님을 탈퇴 처리하시겠습니까?',
      ...MEMBER_LIST_WITHDRAW_IMPACT_LINES,
    ])
  })

  it('buildMemberListDeleteGuideLines — 개인 회원 단일은 기존 삭제 안내', () => {
    expect(buildMemberListDeleteGuideLines(['홍길동'], 'individual')).toEqual(
      buildMemberSingleDeleteGuideLines('홍길동')
    )
  })

  it('buildMemberListDeleteGuideLines — 강사·관리자 단일은 시안 회원 탈퇴 문구', () => {
    for (const kind of ['instructors', 'admins'] as const) {
      expect(buildMemberListDeleteGuideLines(['홍길동'], kind)).toEqual([
        '**[홍길동]** 님을 탈퇴 처리하시겠습니까?',
        ...MEMBER_LIST_WITHDRAW_IMPACT_LINES,
      ])
    }
  })

  it('buildMemberListDeleteGuideLines — 회원 복수', () => {
    const lines = buildMemberListDeleteGuideLines(['김틴토', 'B', 'C'], 'all')
    expect(lines).toEqual([
      '**[김틴토] 님 외 2명**을 탈퇴 처리하시겠습니까?',
      ...MEMBER_LIST_WITHDRAW_IMPACT_LINES,
    ])
  })

  it('buildMemberListDeleteGuideLines — 강사 복수는 시안 회원 탈퇴 문구', () => {
    expect(buildMemberListDeleteGuideLines(['김틴토', 'B'], 'instructors')).toEqual([
      '**[김틴토] 님 외 1명**을 탈퇴 처리하시겠습니까?',
      ...MEMBER_LIST_WITHDRAW_IMPACT_LINES,
    ])
  })

  it('buildMemberListDeleteGuideLines — 학교 단일은 school delete와 동일', () => {
    expect(buildMemberListDeleteGuideLines(['진월초'], 'institutions')).toEqual(
      buildSchoolDeleteMessageLines({ displayName: '진월초' })
    )
  })

  it('buildMemberListDeleteGuideLines — 학교 복수', () => {
    const lines = buildMemberListDeleteGuideLines(['A초', 'B초'], 'institutions')
    expect(lines).toEqual([
      '**[A초] 외 1개**를 삭제하시겠습니까?',
      '삭제 시 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.',
    ])
  })
})
