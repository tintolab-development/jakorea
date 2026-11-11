import { describe, expect, it } from 'vitest'
import {
  assignUser1365IdFromDetailAndIdentifiers,
  detail1365Display,
  mapExternalIdentifiersTo1365Display,
} from './map-external-identifiers'

/**
 * Step 6.4 — 1365 식별자 행은 있지만 값이 비어 있는 회원(로컬 QA 54건 중 16건, 예: 190081).
 * 상세 external1365Id가 null인 것이 정상이며, FE는 값을 지어내지 않고 '-'로 둔다(가짜 데이터).
 */
describe('1365 ID — 연결 행만 있고 값이 없는 회원 (DATA_NOT_LINKED)', () => {
  it('상세 null + identifiers 빈 값이면 id1365를 채우지 않는다', () => {
    const user: { id1365?: string } = {}
    assignUser1365IdFromDetailAndIdentifiers(user, null, [
      { provider: '1365', externalIdMasked: '' },
    ])
    expect(user.id1365).toBeUndefined()
    expect(detail1365Display(user.id1365, false)).toBe('-')
    expect(detail1365Display(user.id1365, true)).toBe('-')
  })

  it('표시 모델도 만들지 않는다', () => {
    expect(mapExternalIdentifiersTo1365Display([{ provider: '1365', externalIdMasked: '   ' }], false, null)).toBeUndefined()
  })

  it('값이 있는 회원은 뒤 2자리만 마스킹하고, 이미 마스킹된 BE 값은 다시 가리지 않는다', () => {
    expect(detail1365Display('VOLID12345', false)).toBe('VOLID123**')
    expect(detail1365Display('VOLID123**', false)).toBe('VOLID123**')
    expect(detail1365Display('VOLID12345', true)).toBe('VOLID12345')
  })
})
