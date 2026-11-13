import { describe, expect, it } from 'vitest'
import {
  buildSponsorDeleteMessageLines,
  resolveSponsorDeleteModalConfirmText,
  resolveSponsorDeleteModalTitle,
} from './sponsor-delete-guide-messages'

const IMPACT_LINE = '삭제 시 모든 정보가 삭제되며, 삭제된 정보는 되돌릴 수 없습니다.'

describe('buildSponsorDeleteMessageLines (list)', () => {
  it('단건 — [이름]를 삭제하시겠습니까?', () => {
    expect(buildSponsorDeleteMessageLines(['삼성전자'], 'list')).toEqual([
      '[삼성전자]를 삭제하시겠습니까?',
      IMPACT_LINE,
    ])
  })

  it('단건 — 받침 있는 이름은 을', () => {
    expect(buildSponsorDeleteMessageLines(['제이에이코리아재단'], 'list')).toEqual([
      '[제이에이코리아재단]을 삭제하시겠습니까?',
      IMPACT_LINE,
    ])
  })

  it('다건 — [이름] 외 N개를 삭제하시겠습니까?', () => {
    expect(buildSponsorDeleteMessageLines(['삼성전자', 'LG전자', 'SK하이닉스'], 'list')).toEqual([
      '**[삼성전자] 외 2개**를 삭제하시겠습니까?',
      IMPACT_LINE,
    ])
  })
})

describe('buildSponsorDeleteMessageLines (detail)', () => {
  it('단건 — 목록과 같은 문구(후원사에서 삭제 문구 없음)', () => {
    expect(buildSponsorDeleteMessageLines(['삼성전자'], 'detail')).toEqual([
      '[삼성전자]를 삭제하시겠습니까?',
      IMPACT_LINE,
    ])
    expect(buildSponsorDeleteMessageLines(['우리은행'], 'detail')).toEqual([
      '[우리은행]을 삭제하시겠습니까?',
      IMPACT_LINE,
    ])
  })
})

describe('resolveSponsorDeleteModalTitle', () => {
  it('목록 단건/일괄 제목', () => {
    expect(resolveSponsorDeleteModalTitle('list', 1)).toBe('후원사 삭제 안내')
    expect(resolveSponsorDeleteModalTitle('list', 2)).toBe('후원사 일괄 삭제 안내')
  })

  it('상세 제목', () => {
    expect(resolveSponsorDeleteModalTitle('detail', 1)).toBe('후원사 삭제 안내')
  })
})

describe('resolveSponsorDeleteModalConfirmText', () => {
  it('목록·상세 모두 삭제', () => {
    expect(resolveSponsorDeleteModalConfirmText('list')).toBe('삭제')
    expect(resolveSponsorDeleteModalConfirmText('detail')).toBe('삭제')
  })
})
