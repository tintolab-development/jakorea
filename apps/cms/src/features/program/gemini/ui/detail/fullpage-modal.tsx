import { useCallback, useMemo } from 'react'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import { CmsButton } from '@/shared/ui'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import {
  LnbIconApplicants,
  LnbIconProjectInfo,
} from '@/features/program/general/ui/detail-modal/program-detail-lnb-icons'
import { useToday } from '../../hooks/use-today'
import { getRecruitmentDetailById } from '../../model/recruitment/detail-mock'
import {
  GEMINI_RECRUITMENT_ADD_PARAM,
} from '../../lib/recruitment/add-url'
import {
  GEMINI_RECRUITMENT_ID_PARAM,
  GEMINI_RECRUITMENT_LNB_PARAM,
  parseGeminiRecruitmentDetailLnb,
  type GeminiRecruitmentDetailLnbKey,
} from '../../lib/recruitment/detail-url'
import { GeminiRecruitmentInfoTab } from './recruitment-info-tab'
import { GeminiInstitutionApplicationTab } from './institution-application-tab'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import './fullpage-modal.css'

const SIDEBAR_ITEMS: DetailModalSidebarNavItem[] = [
  { key: 'info', label: '모집 정보', icon: <LnbIconProjectInfo /> },
  { key: 'institutions', label: '참여 기관 신청 목록', icon: <LnbIconApplicants /> },
]

export function GeminiRecruitmentDetailFullPageModal({
  recruitmentId,
  onClose,
}: {
  recruitmentId: string
  onClose: () => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const todayKey = useToday()
  const activeLnb = parseGeminiRecruitmentDetailLnb(searchParams.get(GEMINI_RECRUITMENT_LNB_PARAM))

  const detail = useMemo(
    () => getRecruitmentDetailById(recruitmentId, dayjs(todayKey)),
    [recruitmentId, todayKey]
  )

  const setActiveLnb = useCallback(
    (lnb: GeminiRecruitmentDetailLnbKey) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          if (lnb === 'info') {
            next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
          } else {
            next.set(GEMINI_RECRUITMENT_LNB_PARAM, lnb)
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
      if (key === 'info' || key === 'institutions') {
        setActiveLnb(key)
      }
    },
    [setActiveLnb]
  )

  const handleEditInfo = useCallback(() => {
    window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
  }, [])

  const handlePreview = useCallback(() => {
    window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
  }, [])

  const open = Boolean(recruitmentId)

  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={detail?.title ?? '모집 공고 상세'}
      className="program-detail-fullpage-modal gemini-recruitment-detail-fullpage-modal"
      sidebar={
        <DetailModalSidebar
          navAriaLabel="찾아가는 연수 상세 메뉴"
          items={SIDEBAR_ITEMS}
          activeKey={activeLnb}
          expandedGroupKeys={[]}
          onSelectTop={handleSidebarSelectTop}
          onSelectChild={() => undefined}
        />
      }
    >
      {!detail ? (
        <Typography.Text type="secondary">모집 공고 정보를 찾을 수 없습니다.</Typography.Text>
      ) : (
        <>
          {activeLnb === 'info' ? (
            <>
              <div className="gemini-recruitment-detail__header-actions program-detail-fullpage-modal__header-actions">
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="large"
                  width={160}
                  onClick={handleEditInfo}
                >
                  정보 수정
                </CmsButton>
                <CmsButton
                  type="button"
                  variant="primary"
                  size="large"
                  className="program-detail-fullpage-modal__program-preview-btn"
                  onClick={handlePreview}
                >
                  프로그램 상세 미리보기
                </CmsButton>
              </div>
              <GeminiRecruitmentInfoTab detail={detail} todayKey={todayKey} />
            </>
          ) : (
            <GeminiInstitutionApplicationTab />
          )}
        </>
      )}
    </DetailFullPageModal>
  )
}

export function useGeminiRecruitmentDetailUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const recruitmentId = searchParams.get(GEMINI_RECRUITMENT_ID_PARAM)?.trim() || null

  const openDetail = useCallback(
    (id: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set(GEMINI_RECRUITMENT_ID_PARAM, id)
          next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
          next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
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
        next.delete(GEMINI_RECRUITMENT_ID_PARAM)
        next.delete(GEMINI_RECRUITMENT_LNB_PARAM)
        next.delete(GEMINI_RECRUITMENT_ADD_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  return { recruitmentId, openDetail, closeDetail }
}
