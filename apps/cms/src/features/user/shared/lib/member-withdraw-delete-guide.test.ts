import { describe, expect, it } from 'vitest'
import {
  buildMemberListDeleteGuideLines,
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
      '[진월초등학교]를 삭제하시겠습니까?',
      '삭제 시 등록 및 관련된 정보는 모두 삭제됩니다.',
      '삭제된 목록 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
    ])
  })

  it('buildSelfWithdrawMessageLines — 프로필 본인 탈퇴 문구', () => {
    const lines = buildSelfWithdrawMessageLines()
    expect(lines[0]).toContain('JA KOREA 서비스에서 탈퇴')
    expect(lines).toHaveLength(3)
  })

  it('buildMemberListDeleteGuideLines — 회원 단일', () => {
    const lines = buildMemberListDeleteGuideLines(['홍길동'], 'all')
    expect(lines[0]).toBe('[홍길동] 회원을 삭제하시겠습니까?')
  })

  it('buildMemberListDeleteGuideLines — 회원 복수', () => {
    const lines = buildMemberListDeleteGuideLines(['A', 'B', 'C'], 'all')
    expect(lines[0]).toBe('선택한 3명의 회원을 삭제하시겠습니까?')
  })

  it('buildMemberListDeleteGuideLines — 학교 단일은 school delete와 동일', () => {
    expect(buildMemberListDeleteGuideLines(['진월초'], 'institutions')).toEqual(
      buildSchoolDeleteMessageLines({ displayName: '진월초' })
    )
  })

  it('buildMemberListDeleteGuideLines — 학교 복수', () => {
    const lines = buildMemberListDeleteGuideLines(['A초', 'B초'], 'institutions')
    expect(lines[0]).toBe('선택한 2개의 학교를 삭제하시겠습니까?')
  })
})
