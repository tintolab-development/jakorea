import { describe, expect, it } from 'vitest'
import {
  alimtalkSendHistorySearchParamsKey,
  mailSendHistorySearchParamsKey,
  smsSendHistorySearchParamsKey,
} from './send-history-search-params-key'

describe('send-history-search-params-key', () => {
  it('ignores send-modal UI params for mail history', () => {
    const withModal = new URLSearchParams('tab=send-history&modal=send&mail_subject=hello')
    const withoutModal = new URLSearchParams('tab=send-history&mail_subject=hello')
    expect(mailSendHistorySearchParamsKey(withModal)).toBe(
      mailSendHistorySearchParamsKey(withoutModal)
    )
    expect(mailSendHistorySearchParamsKey(withModal)).toContain('mail_subject=hello')
    expect(mailSendHistorySearchParamsKey(withModal)).not.toContain('modal=')
  })

  it('ignores send=1 UI params for sms history', () => {
    const withSend = new URLSearchParams('tab=send-history&send=1&sms_content=hi')
    const withoutSend = new URLSearchParams('tab=send-history&sms_content=hi')
    expect(smsSendHistorySearchParamsKey(withSend)).toBe(smsSendHistorySearchParamsKey(withoutSend))
    expect(smsSendHistorySearchParamsKey(withSend)).not.toContain('send=')
  })

  it('ignores modal=send UI params for alimtalk history', () => {
    const withModal = new URLSearchParams('tab=send-history&modal=send&template_name=otp')
    const withoutModal = new URLSearchParams('tab=send-history&template_name=otp')
    expect(alimtalkSendHistorySearchParamsKey(withModal)).toBe(
      alimtalkSendHistorySearchParamsKey(withoutModal)
    )
    expect(alimtalkSendHistorySearchParamsKey(withModal)).not.toContain('modal=')
  })
})
