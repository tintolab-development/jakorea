import { describe, expect, it } from 'vitest'
import {
  countDroppedAlimtalkSendRecipients,
  createManualRecipient,
  mergeAlimtalkSendRecipients,
} from './recipients'
import type { AlimtalkSendRecipient } from './types'

function member(id: number, phone: string): AlimtalkSendRecipient {
  return {
    id: `actor-MEMBER-${id}`,
    participationType: 'participant',
    name: `회원${id}`,
    phone,
    source: 'program',
    actorType: 'MEMBER',
    actorId: id,
  }
}

describe('mergeAlimtalkSendRecipients phone dedupe', () => {
  it('회원 선택끼리 하이픈만 다른 번호를 1건으로 합친다', () => {
    const merged = mergeAlimtalkSendRecipients(
      [member(1, '010-1234-5678')],
      [member(2, '01012345678')]
    )
    expect(merged.map(item => item.id)).toEqual(['actor-MEMBER-1'])
  })

  it('회원과 직접 입력의 같은 번호를 1건으로 합친다', () => {
    const merged = mergeAlimtalkSendRecipients(
      [member(1, '010-1234-5678')],
      [createManualRecipient('01012345678', '직접')]
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]?.source).toBe('program')
  })

  it('직접 입력끼리 중복 번호를 1건으로 합친다', () => {
    const merged = mergeAlimtalkSendRecipients(
      [createManualRecipient('010-1111-2222')],
      [createManualRecipient('01011112222', '나중')]
    )
    expect(merged).toHaveLength(1)
    expect(merged[0]?.id).toBe('manual-01011112222')
  })

  it('마스킹된 번호는 서로 다른 수신자로 유지한다', () => {
    const merged = mergeAlimtalkSendRecipients(
      [member(1, '010-****-5678')],
      [member(2, '010-****-5678')]
    )
    expect(merged.map(item => item.actorId)).toEqual([1, 2])
  })

  it('중복으로 빠진 수신자 수를 센다', () => {
    const current = [member(1, '010-1234-5678')]
    const incoming = [member(2, '01012345678'), member(3, '010-9999-0000')]
    expect(countDroppedAlimtalkSendRecipients(current, incoming)).toBe(1)
  })
})
