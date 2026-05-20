/**
 * 프로그램 관리 > Gemini 프로그램 > 찾아가는 연수
 * 레이아웃: 회원 관리 > 권한 승인 — 탭 + FilterTableLayout(모집 공고 탭)
 */

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs } from 'antd'
import { GeminiVisitingTrainingRecruitmentList } from '@/features/program/gemini/ui/gemini-visiting-training-recruitment-list'
import type { GeminiVisitingTrainingTabKey } from '@/features/program/gemini/model/gemini-visiting-training-types'
import '@/features/program/gemini/ui/visiting-training-page.css'

const TAB_PARAM = 'tab'

function parseTabKey(raw: string | null): GeminiVisitingTrainingTabKey {
  if (raw === 'approved') return 'approved'
  return 'recruitment'
}

export function GeminiVisitingTrainingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKey = parseTabKey(searchParams.get(TAB_PARAM))

  const handleTabChange = useCallback(
    (key: string) => {
      const nextKey = key === 'approved' ? 'approved' : 'recruitment'
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (nextKey === 'recruitment') {
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

  const tabItems = useMemo(
    () => [
      {
        key: 'recruitment',
        label: '모집 공고',
        children: <GeminiVisitingTrainingRecruitmentList />,
      },
      {
        key: 'approved',
        label: '승인 연수',
        children: <div className="gemini-visiting-training-page__approved-placeholder" aria-hidden />,
      },
    ],
    []
  )

  return (
    <div>
      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        className="gemini-visiting-training-page__tabs"
        items={tabItems}
      />
    </div>
  )
}
