import { describe, expect, it } from 'vitest'
import {
  countDroppedAlimtalkSendRecipients,
  createManualRecipient,
  formatAlimtalkPhoneDuplicateMessage,
  listAlimtalkPhoneDuplicateNotices,
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

  it('AT-08 직접 입력 뒤에 같은 번호 회원이 와도 수기 값과 기존 행을 유지한다', () => {
    const manual = createManualRecipient('010-1234-5678', '직접', { '방문 안내': '오전' })
    const incoming = member(9, '01012345678')
    const notices = listAlimtalkPhoneDuplicateNotices([manual], [incoming])
    const merged = mergeAlimtalkSendRecipients([manual], [incoming])
    expect(merged).toEqual([manual])
    expect(merged[0]?.variables).toEqual({ '방문 안내': '오전' })
    expect(merged[0]?.actorId).toBeUndefined()
    expect(notices[0]?.kept.id).toBe(manual.id)
    expect(notices[0]?.skipped.actorId).toBe(9)
    expect(formatAlimtalkPhoneDuplicateMessage(notices)).toContain('유지 직접 입력 직접')
    expect(formatAlimtalkPhoneDuplicateMessage(notices)).toContain('제외 회원 회원9')
  })

  it('AT-09 회원 뒤에 같은 번호 직접 입력이 와도 actorId를 유지하고 수기 값을 덮지 않는다', () => {
    const current = member(4, '010-5555-6666')
    const manual = createManualRecipient('01055556666', '나중', { '방문 안내': '오후' })
    const merged = mergeAlimtalkSendRecipients([current], [manual])
    expect(merged).toEqual([current])
    expect(merged[0]?.actorId).toBe(4)
    expect(merged[0]?.variables).toBeUndefined()
    const notices = listAlimtalkPhoneDuplicateNotices([current], [manual])
    expect(notices[0]?.kept.actorId).toBe(4)
    expect(notices[0]?.skipped.variables).toEqual({ '방문 안내': '오후' })
  })

  it('AT-10 마스킹된 같은 표시 번호는 FE가 중복으로 판단하지 않는다', () => {
    const current = member(1, '010-****-5678')
    const incoming = member(2, '010-****-5678')
    expect(listAlimtalkPhoneDuplicateNotices([current], [incoming])).toEqual([])
    expect(mergeAlimtalkSendRecipients([current], [incoming])).toHaveLength(2)
  })
})
