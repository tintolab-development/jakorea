/**
 * 알림 메시지 관리 > 문자 관리 (Phase A: 셸 + 발송조회)
 */

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SmsSendHistoryPage } from '@/features/notifications/ui/sms-send-history/page'
import { SendFullpageModal } from '@/features/notifications/ui/sms-send/fullpage-modal'
import { SmsTemplateList } from '@/features/notifications/ui/sms-template/list'
import type { SmsTabKey } from '@/features/notifications/model/sms-send-history/types'
import { CmsButton } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import './sms-page.css'

const TAB_PARAM = 'tab'
const SEND_MODAL_PARAM = 'send'
const SEND_MODAL_VALUE = '1'

const TAB_ITEMS: { key: SmsTabKey; label: string }[] = [
  { key: 'template', label: '문자 템플릿' },
  { key: 'send-history', label: '문자 발송 조회' },
]

function parseTabKey(raw: string | null): SmsTabKey {
  if (raw === 'send-history' || raw === 'results') return 'send-history'
  return 'template'
}

export function SmsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKey = parseTabKey(searchParams.get(TAB_PARAM))
  const sendOpen = searchParams.get(SEND_MODAL_PARAM) === SEND_MODAL_VALUE

  const handleTabChange = useCallback(
    (key: string) => {
      const nextKey = parseTabKey(key)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (nextKey === 'template') {
            next.delete(TAB_PARAM)
          } else {
            next.set(TAB_PARAM, nextKey)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleSendSms = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set(SEND_MODAL_PARAM, SEND_MODAL_VALUE)
        return next
      },
      { replace: false }
    )
  }, [setSearchParams])

  const handleCloseSend = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(SEND_MODAL_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  return (
    <div className="sms-page">
      <CmsTextTabs
        className="sms-page__tabs"
        variant="list"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        trailing={
          <CmsButton variant="primary" size="large" type="button" onClick={handleSendSms}>
            문자 발송
          </CmsButton>
        }
      />
      {activeKey === 'template' ? (
        <SmsTemplateList />
      ) : (
        <SmsSendHistoryPage />
      )}
      <SendFullpageModal open={sendOpen} onClose={handleCloseSend} />
    </div>
  )
}
