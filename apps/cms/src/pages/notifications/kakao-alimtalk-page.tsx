/**
 * 알림 메시지 관리 > 카카오 알림톡 관리
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
  { key: 'alimtalk-template', label: '알림톡 양식' },
  { key: 'brand-template', label: '브랜드 메시지 양식' },
  { key: 'scheduled', label: '예약 발송 목록' },
  { key: 'results', label: '발송 결과' },
]

function parseTabKey(raw: string | null): KakaoAlimtalkTabKey {
  if (raw === 'brand-template' || raw === 'scheduled' || raw === 'results') {
    return raw
  }
  return 'alimtalk-template'
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
          if (nextKey === 'alimtalk-template') {
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

  const handleCreateBrandMessage = useCallback(() => {
    showAlert({
      title: '준비 중',
      content: '브랜드 메시지 작성 기능은 현재 준비 중입니다.',
    })
  }, [showAlert])

  const handleCreateAlimtalk = useCallback(() => {
    showAlert({
      title: '준비 중',
      content: '알림톡 작성 기능은 현재 준비 중입니다.',
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
          activeKey === 'alimtalk-template' ? (
            <>
              <CmsButton variant="secondary" type="button" onClick={handleCreateBrandMessage}>
                브랜드 메시지 작성
              </CmsButton>
              <CmsButton variant="primary" type="button" onClick={handleCreateAlimtalk}>
                알림톡 작성
              </CmsButton>
            </>
          ) : null
        }
      />
      {activeKey === 'alimtalk-template' ? (
        <AlimtalkTemplateList />
      ) : activeKey === 'brand-template' ? (
        <ComingSoonTabPanel
          title="브랜드 메시지 양식 준비 중"
          description="브랜드 메시지 양식 관리 기능은 현재 준비 중입니다."
        />
      ) : activeKey === 'scheduled' ? (
        <ComingSoonTabPanel
          title="예약 발송 목록 준비 중"
          description="예약 발송 목록 기능은 현재 준비 중입니다."
        />
      ) : (
        <ComingSoonTabPanel
          title="발송 결과 준비 중"
          description="발송 결과 조회 기능은 현재 준비 중입니다."
        />
      )}
    </div>
  )
}
