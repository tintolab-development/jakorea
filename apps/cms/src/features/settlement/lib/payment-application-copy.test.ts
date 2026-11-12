import { describe, expect, it } from 'vitest'
import { getPaymentApplicationCopy } from './payment-application-copy'

describe('getPaymentApplicationCopy', () => {
  it('기본은 강사 지급조서(강의비) 문구이다', () => {
    expect(getPaymentApplicationCopy(undefined)).toEqual({
      confirmSubject: '강의비 지급조서',
      rejectSubject: '지급조서',
      payee: '강의비',
    })
  })

  it('참여자·봉사자는 영수증(실비) 문구이다', () => {
    expect(getPaymentApplicationCopy('receipt')).toEqual({
      confirmSubject: '영수증',
      rejectSubject: '영수증',
      payee: '실비',
    })
  })
})
