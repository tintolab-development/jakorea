import { describe, expect, it } from 'vitest'
import {
  APPLICATION_EDIT_MODE_UNMASK_REASON,
  EDIT_MODE_REVEAL,
  MEMBER_EDIT_MODE_UNMASK_REASON,
  privacyUnmaskBody,
} from './privacy-unmask-purpose'

describe('privacyUnmaskBody — 목적은 호출부가 명시할 때만 (CMS-06·CMS-29)', () => {
  it('수동 열람 사유가 「회원 정보 수정」이어도 EDIT_MODE가 아니다', () => {
    expect(privacyUnmaskBody(MEMBER_EDIT_MODE_UNMASK_REASON)).toEqual({ reason: '회원 정보 수정' })
    expect(privacyUnmaskBody(' 회원 정보 수정 ')).not.toHaveProperty('purpose')
  })

  it('수동 열람 사유가 「신청 정보 수정」이어도 EDIT_MODE가 아니다', () => {
    expect(privacyUnmaskBody(APPLICATION_EDIT_MODE_UNMASK_REASON, { programId: 77 })).toEqual({
      reason: '신청 정보 수정',
      programId: 77,
    })
  })

  it('회원 수정 진입은 명시적 EDIT_MODE로만 붙는다', () => {
    expect(privacyUnmaskBody(MEMBER_EDIT_MODE_UNMASK_REASON, EDIT_MODE_REVEAL)).toEqual({
      reason: '회원 정보 수정',
      purpose: 'EDIT_MODE',
    })
  })

  it('신청 수정 진입은 programId와 함께 명시적 EDIT_MODE를 보낸다', () => {
    expect(
      privacyUnmaskBody(APPLICATION_EDIT_MODE_UNMASK_REASON, { programId: 77, ...EDIT_MODE_REVEAL })
    ).toEqual({ reason: '신청 정보 수정', programId: 77, purpose: 'EDIT_MODE' })
  })

  it('일반 사유는 purpose·programId 없이 그대로 보낸다', () => {
    expect(privacyUnmaskBody('회원 문의 대응')).toEqual({ reason: '회원 문의 대응' })
  })
})
