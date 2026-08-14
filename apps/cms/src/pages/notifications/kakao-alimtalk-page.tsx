/**
 * 알림 메시지 관리 > 알림톡 관리
 */

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlimtalkTemplateList } from '@/features/notifications/ui/alimtalk-template/list'
import { ComingSoonTabPanel } from '@/features/notifications/ui/coming-soon-tab-panel'
import type { KakaoAlimtalkTabKey } from '@/features/notifications/model/alimtalk-template/types'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import './kakao-alimtalk-page.css'

const TAB_PARAM = 'tab'

const TAB_ITEMS: { key: KakaoAlimtalkTabKey; label: string }[] = [
  { key: 'template', label: '알림톡 템플릿' },
  { key: 'send-history', label: '알림톡 발송 조회' },
]

function parseTabKey(raw: string | null): KakaoAlimtalkTabKey {
  if (raw === 'send-history' || raw === 'results') return 'send-history'
  return 'template'
}

export function KakaoAlimtalkPage() {
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKey = parseTabKey(searchParams.get(TAB_PARAM))

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
    showAlert({
      title: '준비 중',
      content: '알림톡 발송 기능은 현재 준비 중입니다.',
    })
  }, [showAlert])

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
        <ComingSoonTabPanel
          title="알림톡 발송 조회 준비 중"
          description="알림톡 발송 및 수신 결과 조회 기능은 현재 준비 중입니다."
        />
      )}
    </div>
  )
}
