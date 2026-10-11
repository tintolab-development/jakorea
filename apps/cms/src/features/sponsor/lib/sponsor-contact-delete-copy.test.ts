import { describe, expect, it } from 'vitest'
import {
  resolveSponsorContactDeleteConfirmCopy,
  resolveSponsorContactDeleteErrorAlert,
  SPONSOR_CONTACT_DELETE_BLOCKED_ALERT_TITLE,
  SPONSOR_CONTACT_DELETE_IN_USE_MESSAGE,
  SPONSOR_CONTACT_IN_USE_ERROR_CODE,
} from './sponsor-contact-delete-copy'

const LINE2 = '삭제된 정보는 되돌릴 수 없습니다.'

describe('resolveSponsorContactDeleteConfirmCopy', () => {
  it('단건', () => {
    expect(resolveSponsorContactDeleteConfirmCopy(['김제이'])).toEqual({
      title: '후원사 담당자 삭제 안내',
      line1: '**[김제이]** 담당자를 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('일괄', () => {
    expect(resolveSponsorContactDeleteConfirmCopy(['김제이', '이담당', '박담당'])).toEqual({
      title: '후원사 담당자 일괄 삭제 안내',
      line1: '**[김제이] 님 외 2명**의 담당자를 삭제하시겠습니까?',
      line2: LINE2,
    })
  })
})

describe('resolveSponsorContactDeleteErrorAlert', () => {
  it('SPONSOR_CONTACT_IN_USE 시 삭제 불가 안내 타이틀', () => {
    const error = {
      response: {
        status: 409,
        data: {
          message: SPONSOR_CONTACT_DELETE_IN_USE_MESSAGE,
          error: {
            code: SPONSOR_CONTACT_IN_USE_ERROR_CODE,
            message: SPONSOR_CONTACT_DELETE_IN_USE_MESSAGE,
          },
        },
      },
    }
    expect(resolveSponsorContactDeleteErrorAlert(error, 'fallback')).toEqual({
      title: SPONSOR_CONTACT_DELETE_BLOCKED_ALERT_TITLE,
      content: SPONSOR_CONTACT_DELETE_IN_USE_MESSAGE,
    })
  })

  it('그 외 오류는 안내 타이틀', () => {
    const alert = resolveSponsorContactDeleteErrorAlert(new Error('network'), '삭제 실패')
    expect(alert.title).toBe('안내')
    expect(alert.content).toBe('network')
  })
})
