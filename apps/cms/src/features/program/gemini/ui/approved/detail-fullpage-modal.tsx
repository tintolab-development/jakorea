import { useCallback } from 'react'
import { Typography } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import { useCmsAlert } from '@/shared/ui'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import {
  LnbIconApplicants,
  LnbIconProjectInfo,
} from '@/features/program/general/ui/detail-modal/program-detail-lnb-icons'
import { useToday } from '../../hooks/use-today'
import { GEMINI_RECRUITMENT_ADD_PARAM } from '../../lib/recruitment/add-url'
import {
  GEMINI_RECRUITMENT_EDIT_PARAM,
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
} from '../../lib/recruitment/detail-url'
import {
  GEMINI_APPROVED_TRAINING_ID_PARAM,
  GEMINI_APPROVED_TRAINING_LNB_PARAM,
  parseGeminiApprovedTrainingDetailLnb,
  type GeminiApprovedTrainingDetailLnbKey,
} from '../../lib/approved/detail-url'
import { formatTrainingDatetimeDisplay } from '../../lib/approved/format-display'
import { getGeminiApprovedTrainingDetail } from '../../model/approved/detail-mock'
import { GeminiApprovedTrainingDetailInstructorApplicationTab } from './detail-instructor-application-tab'
import { GeminiApprovedTrainingDetailProgramInfoTab } from './detail-program-info-tab'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import '../detail/fullpage-modal.css'

const SIDEBAR_ITEMS: DetailModalSidebarNavItem[] = [
  { key: 'info', label: '프로그램 정보', icon: <LnbIconProjectInfo /> },
  { key: 'instructors', label: '강사 신청 목록', icon: <LnbIconApplicants /> },
]

export function GeminiApprovedTrainingDetailFullPageModal({
  approvedTrainingId,
  onClose,
}: {
  approvedTrainingId: string
  onClose: () => void
}) {
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeLnb = parseGeminiApprovedTrainingDetailLnb(
    searchParams.get(GEMINI_APPROVED_TRAINING_LNB_PARAM)
  )
  const todayKey = useToday()
  const detail = getGeminiApprovedTrainingDetail(approvedTrainingId)

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
      if (key === 'info' || key === 'instructors') {
        setActiveLnb(key)
      }
    },
    [setActiveLnb]
  )

  const handlePrivateInfoClick = useCallback(() => {
    showAlert({
      title: '안내',
      content: '개인정보 상세보기 기능은 준비 중입니다.',
    })
  }, [showAlert])

  return (
    <DetailFullPageModal
      open={Boolean(approvedTrainingId)}
      onClose={onClose}
      title={
        detail
          ? detail.instructorAssigned
            ? `${detail.institutionName} (${formatTrainingDatetimeDisplay(detail)})`
            : detail.institutionName
          : '승인 연수 상세'
      }
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
            <>
              <div className="gemini-recruitment-detail__header-actions program-detail-fullpage-modal__header-actions">
                <PersonalInfoRevealButton
                  labelMode="stickyReveal"
                  revealed={false}
                  width={180}
                  onClick={handlePrivateInfoClick}
                />
              </div>
              <GeminiApprovedTrainingDetailProgramInfoTab detail={detail} todayKey={todayKey} />
            </>
          ) : (
            <GeminiApprovedTrainingDetailInstructorApplicationTab
              approvedTrainingId={approvedTrainingId}
            />
          )}
        </>
      )}
    </DetailFullPageModal>
  )
}

export function useGeminiApprovedTrainingDetailUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const approvedTrainingId = searchParams.get(GEMINI_APPROVED_TRAINING_ID_PARAM)?.trim() || null

  const openDetail = useCallback(
    (id: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(GEMINI_APPROVED_TRAINING_ID_PARAM, id)
          next.delete(GEMINI_APPROVED_TRAINING_LNB_PARAM)
          next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
          next.delete(GEMINI_RECRUITMENT_ID_PARAM)
          next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
          next.delete(GEMINI_RECRUITMENT_EDIT_PARAM)
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const closeDetail = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(GEMINI_APPROVED_TRAINING_ID_PARAM)
        next.delete(GEMINI_APPROVED_TRAINING_LNB_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  return { approvedTrainingId, openDetail, closeDetail }
}
