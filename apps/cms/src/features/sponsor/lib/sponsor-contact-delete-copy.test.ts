import { describe, expect, it } from 'vitest'
import { resolveSponsorContactDeleteConfirmCopy } from './sponsor-contact-delete-copy'

const LINE2 = '삭제된 정보는 되돌릴 수 없습니다.'

describe('resolveSponsorContactDeleteConfirmCopy', () => {
  it('단건', () => {
    expect(resolveSponsorContactDeleteConfirmCopy(['김제이'])).toEqual({
      title: '후원사 담당자 삭제 안내',
      line1: '[김제이] 담당자를 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('일괄', () => {
    expect(resolveSponsorContactDeleteConfirmCopy(['김제이', '이담당', '박담당'])).toEqual({
      title: '후원사 담당자 일괄 삭제 안내',
      line1: '[김제이] 님 외 2명의 담당자를 삭제하시겠습니까?',
      line2: LINE2,
    })
  })
})
