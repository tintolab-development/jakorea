/**
 * 알림 메시지 관리 > 메일 관리
 */

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MailTemplateList } from '@/features/notifications/ui/mail-template/list'
import type { MailTabKey } from '@/features/notifications/model/mail-template/types'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import './mail-page.css'

const TAB_PARAM = 'tab'

const TAB_ITEMS: { key: MailTabKey; label: string }[] = [
  { key: 'template', label: '메일 템플릿' },
  { key: 'send-history', label: '메일 발송 조회' },
]

function parseTabKey(raw: string | null): MailTabKey {
  if (raw === 'send-history' || raw === 'results') return 'send-history'
  return 'template'
}

export function MailPage() {
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

  const handleSendMail = useCallback(() => {
    showAlert({
      title: '준비 중',
      content: '메일 발송 기능은 현재 준비 중입니다.',
    })
  }, [showAlert])

  return (
    <div className="mail-page">
      <CmsTextTabs
        className="mail-page__tabs"
        variant="list"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        trailing={
          <CmsButton variant="primary" size="large" type="button" onClick={handleSendMail}>
            메일 발송
          </CmsButton>
        }
      />
      {activeKey === 'template' ? (
        <MailTemplateList />
      ) : (
        <div className="notification-coming-soon-tab-panel">메일 발송 조회 기능은 현재 준비 중입니다.</div>
      )}
    </div>
  )
}
