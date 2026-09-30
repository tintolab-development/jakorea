/**
 * 프로그램 관리 > Gemini 프로그램 > 찾아가는 연수
 * 레이아웃: 정산 관리 > 계좌 지급 확인 — 탭(행 패딩 없음) + FilterTableLayout
 */

import { lazy, Suspense, useCallback } from 'react'
import { Spin } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { GeminiRecruitmentList } from '@/features/program/gemini/ui/recruitment/list'
import { GeminiApprovedTrainingList } from '@/features/program/gemini/ui/approved/list'
import { useGeminiApprovedTrainingDetailUrl } from '@/features/program/gemini/ui/approved/approved-training-detail-url'
import { useGeminiRecruitmentDetailUrl } from '@/features/program/gemini/ui/detail/recruitment-detail-url'
import { useGeminiRecruitmentAddUrl } from '@/features/program/gemini/ui/recruitment/recruitment-add-url'
import type { GeminiVisitingTrainingTabKey } from '@/features/program/gemini/model/recruitment/types'
import '@/features/program/gemini/ui/page.css'

const LazyGeminiApprovedTrainingDetailFullPageModal = lazy(() =>
  import('@/features/program/gemini/ui/approved/detail-fullpage-modal').then(module => ({
    default: module.GeminiApprovedTrainingDetailFullPageModal,
  }))
)
const LazyGeminiRecruitmentDetailFullPageModal = lazy(() =>
  import('@/features/program/gemini/ui/detail/fullpage-modal').then(module => ({
    default: module.GeminiRecruitmentDetailFullPageModal,
  }))
)
const LazyGeminiRecruitmentAddFullpageModal = lazy(() =>
  import('@/features/program/gemini/ui/recruitment/add-fullpage-modal').then(module => ({
    default: module.GeminiRecruitmentAddFullpageModal,
  }))
)

function GeminiModalFallback() {
  return (
    <div
      className="router-loading-fallback"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.65)',
      }}
    >
      <Spin size="large" />
    </div>
  )
}

const TAB_PARAM = 'tab'

function parseTabKey(raw: string | null): GeminiVisitingTrainingTabKey {
  if (raw === 'approved') return 'approved'
  return 'recruitment'
}

export function GeminiVisitingTrainingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeKey = parseTabKey(searchParams.get(TAB_PARAM))
  const { recruitmentId, closeDetail } = useGeminiRecruitmentDetailUrl()
  const { approvedTrainingId, closeDetail: closeApprovedDetail } = useGeminiApprovedTrainingDetailUrl()
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
        <GeminiApprovedTrainingList />
      )}
      {isAddOpen ? (
        <Suspense fallback={<GeminiModalFallback />}>
          <LazyGeminiRecruitmentAddFullpageModal open onClose={closeAdd} />
        </Suspense>
      ) : null}
      {recruitmentId && !isAddOpen ? (
        <Suspense fallback={<GeminiModalFallback />}>
          <LazyGeminiRecruitmentDetailFullPageModal
            recruitmentId={recruitmentId}
            onClose={closeDetail}
          />
        </Suspense>
      ) : null}
      {approvedTrainingId && !isAddOpen ? (
        <Suspense fallback={<GeminiModalFallback />}>
          <LazyGeminiApprovedTrainingDetailFullPageModal
            approvedTrainingId={approvedTrainingId}
            onClose={closeApprovedDetail}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
