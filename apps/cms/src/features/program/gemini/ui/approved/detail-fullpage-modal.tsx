import { useCallback, useMemo } from 'react'
import { Typography } from 'antd'
import { useLocation, useSearchParams } from 'react-router-dom'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import { ProgramManagersTab } from '@/features/program/general/ui/detail-modal/managers/program-managers-tab'
import {
  LnbIconApplicants,
  LnbIconManagers,
  LnbIconProjectInfo,
} from '@/features/program/general/ui/detail-modal/program-detail-lnb-icons'
import { useToday } from '../../hooks/use-today'
import { buildGeminiApprovedTrainingBreadcrumbItems } from '../../lib/approved/detail-breadcrumb'
import {
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
  parseGeminiApprovedTrainingDetailLnb,
  type GeminiApprovedTrainingDetailLnbKey,
} from '../../lib/approved/detail-url'
import { formatTrainingDatetimeDisplay } from '../../lib/approved/format-display'
import { getGeminiApprovedTrainingDetail } from '../../model/approved/approved-detail-resolver'
import { GeminiApprovedTrainingDetailInstructorApplicationTab } from './detail-instructor-application-tab'
import { GeminiApprovedTrainingDetailProgramInfoTab } from './detail-program-info-tab'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import '../detail/fullpage-modal.css'

const SIDEBAR_ITEMS: DetailModalSidebarNavItem[] = [
  { key: 'info', label: '프로그램 정보', icon: <LnbIconProjectInfo /> },
  { key: 'instructors', label: '강사 신청 목록', icon: <LnbIconApplicants /> },
  { key: 'managers', label: '담당자 정보', icon: <LnbIconManagers /> },
]

export function GeminiApprovedTrainingDetailFullPageModal({
  approvedTrainingId,
  onClose,
}: {
  approvedTrainingId: string
  onClose: () => void
}) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeLnb = parseGeminiApprovedTrainingDetailLnb(
    searchParams.get(GEMINI_APPROVED_TRAINING_LNB_PARAM)
  )
  const todayKey = useToday()
  const detail = getGeminiApprovedTrainingDetail(approvedTrainingId)

  const detailTitle = detail
    ? detail.instructorAssigned
      ? `${detail.institutionName} (${formatTrainingDatetimeDisplay(detail)})`
      : detail.institutionName
    : '승인 연수 상세'

  const headerBreadcrumbItems = useMemo(() => {
    return buildGeminiApprovedTrainingBreadcrumbItems({
      pathname: location.pathname,
      searchParams,
      approvedTrainingId,
      recruitmentTitle: detail?.recruitmentTitle ?? '승인 연수 상세',
      activeLnb,
    })
  }, [activeLnb, approvedTrainingId, detail?.recruitmentTitle, location.pathname, searchParams])

  const setActiveLnb = useCallback(
    (lnb: GeminiApprovedTrainingDetailLnbKey) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (lnb === 'info') {
            next.delete(GEMINI_APPROVED_TRAINING_LNB_PARAM)
          } else {
            next.set(GEMINI_APPROVED_TRAINING_LNB_PARAM, lnb)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleSidebarSelectTop = useCallback(
    (key: string) => {
      if (key === 'info' || key === 'instructors' || key === 'managers') {
        setActiveLnb(key)
      }
    },
    [setActiveLnb]
  )

  return (
    <DetailFullPageModal
      open={Boolean(approvedTrainingId)}
      onClose={onClose}
      title={detailTitle}
      headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
      className="program-detail-fullpage-modal gemini-recruitment-detail-fullpage-modal"
      sidebar={
          <DetailModalSidebar
            navAriaLabel="승인 연수 상세 메뉴"
            items={SIDEBAR_ITEMS}
            activeKey={activeLnb}
            expandedGroupKeys={[]}
            onSelectTop={handleSidebarSelectTop}
            onSelectChild={() => undefined}
          />
        }
      >
        {!detail ? (
          <Typography.Text type="secondary">승인 연수 정보를 찾을 수 없습니다.</Typography.Text>
        ) : (
          <>
            {activeLnb === 'info' ? (
              <GeminiApprovedTrainingDetailProgramInfoTab detail={detail} todayKey={todayKey} />
            ) : activeLnb === 'instructors' ? (
              <GeminiApprovedTrainingDetailInstructorApplicationTab
                approvedTrainingId={approvedTrainingId}
              />
            ) : (
              <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
                <ProgramManagersTab programId={approvedTrainingId} maskSensitive />
              </div>
            )}
          </>
        )}
    </DetailFullPageModal>
  )
}

export { useGeminiApprovedTrainingDetailUrl } from './approved-training-detail-url'
