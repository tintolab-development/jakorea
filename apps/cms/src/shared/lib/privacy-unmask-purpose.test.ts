import { describe, expect, it } from 'vitest'
import {
  APPLICATION_EDIT_MODE_UNMASK_REASON,
  MEMBER_EDIT_MODE_UNMASK_REASON,
  privacyUnmaskBody,
} from './privacy-unmask-purpose'

describe('privacyUnmaskBody (CMS-06·CMS-29 수정 진입)', () => {
  it('회원 정보 수정 진입은 purpose=EDIT_MODE를 붙인다', () => {
    expect(privacyUnmaskBody(MEMBER_EDIT_MODE_UNMASK_REASON)).toEqual({
      reason: '회원 정보 수정',
      purpose: 'EDIT_MODE',
    })
  })

  it('신청 정보 수정 진입은 programId와 함께 purpose=EDIT_MODE를 붙인다', () => {
    expect(privacyUnmaskBody(APPLICATION_EDIT_MODE_UNMASK_REASON, 77)).toEqual({
      reason: '신청 정보 수정',
      programId: 77,
      purpose: 'EDIT_MODE',
    })
  })

  it('수동 사유 입력 열람은 purpose를 보내지 않는다', () => {
    expect(privacyUnmaskBody('회원 문의 대응', 77)).toEqual({ reason: '회원 문의 대응', programId: 77 })
    expect(privacyUnmaskBody('회원 문의 대응')).not.toHaveProperty('purpose')
    expect(privacyUnmaskBody('회원 문의 대응')).not.toHaveProperty('programId')
  })
})
