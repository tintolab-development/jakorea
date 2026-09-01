/**
 * 알림 메시지 관리 > 알림톡 관리
 */

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlimtalkTemplateList } from '@/features/notifications/ui/alimtalk-template/list'
import { SendFullpageModal } from '@/features/notifications/ui/alimtalk-send/fullpage-modal'
import { Page as AlimtalkSendHistoryPage } from '@/features/notifications/ui/alimtalk-send-history/page'
import type { KakaoAlimtalkTabKey } from '@/features/notifications/model/alimtalk-template/types'
import { CmsButton } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import './kakao-alimtalk-page.css'

const TAB_PARAM = 'tab'
const SEND_MODAL_PARAM = 'modal'
const SEND_MODAL_VALUE = 'send'

const TAB_ITEMS: { key: KakaoAlimtalkTabKey; label: string }[] = [
  { key: 'template', label: '알림톡 템플릿' },
  { key: 'send-history', label: '알림톡 발송 조회' },
]

function parseTabKey(raw: string | null): KakaoAlimtalkTabKey {
  if (raw === 'send-history' || raw === 'results') return 'send-history'
  return 'template'
}

export function KakaoAlimtalkPage() {
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

  const handleSendAlimtalk = useCallback(() => {
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
    <div className="kakao-alimtalk-page">
      <CmsTextTabs
        className="kakao-alimtalk-page__tabs"
        variant="list"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        trailing={
          <CmsButton variant="primary" size="large" type="button" onClick={handleSendAlimtalk}>
            알림톡 발송
          </CmsButton>
        }
      />
      {activeKey === 'template' ? (
        <AlimtalkTemplateList />
      ) : (
        <AlimtalkSendHistoryPage />
      )}
      <SendFullpageModal open={sendOpen} onClose={handleCloseSend} />
    </div>
  )
}
