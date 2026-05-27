/**
 * 프로그램 관리 > Gemini 프로그램 > 찾아가는 연수
 * 레이아웃: 회원 관리 > 권한 승인 — 탭 + FilterTableLayout(모집 공고 탭)
 */

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { GeminiRecruitmentList } from '@/features/program/gemini/ui/recruitment/list'
import {
  GeminiRecruitmentDetailFullPageModal,
  useGeminiRecruitmentDetailUrl,
} from '@/features/program/gemini/ui/detail/fullpage-modal'
import {
  GeminiRecruitmentAddFullpageModal,
  useGeminiRecruitmentAddUrl,
} from '@/features/program/gemini/ui/recruitment/add-fullpage-modal'
import type { GeminiVisitingTrainingTabKey } from '@/features/program/gemini/model/recruitment/types'
import '@/features/program/gemini/ui/page.css'

const TAB_PARAM = 'tab'

function parseTabKey(raw: string | null): GeminiVisitingTrainingTabKey {
  if (raw === 'approved') return 'approved'
  return 'recruitment'
}

export function GeminiVisitingTrainingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKey = parseTabKey(searchParams.get(TAB_PARAM))
  const { recruitmentId, closeDetail } = useGeminiRecruitmentDetailUrl()
  const { isAddOpen, closeAdd } = useGeminiRecruitmentAddUrl()

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

  return (
    <div>
      <CmsTextTabs
        className="gemini-visiting-training-page__tabs"
        variant="list"
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
          { key: 'recruitment', label: '모집 공고' },
          { key: 'approved', label: '승인 연수' },
        ]}
      />
      {activeKey === 'recruitment' ? (
        <GeminiRecruitmentList />
      ) : (
        <div className="gemini-visiting-training-page__approved-placeholder" aria-hidden />
      )}
      {isAddOpen ? <GeminiRecruitmentAddFullpageModal open onClose={closeAdd} /> : null}
      {recruitmentId && !isAddOpen ? (
        <GeminiRecruitmentDetailFullPageModal recruitmentId={recruitmentId} onClose={closeDetail} />
      ) : null}
    </div>
  )
}
