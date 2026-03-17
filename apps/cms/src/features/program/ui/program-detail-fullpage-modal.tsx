/**
 * 프로그램 상세 풀페이지 모달
 * 경제/일반 교육 프로그램 목록 테이블 행 클릭 시 노출.
 * 모달 내 LNB, 헤더 타이틀, 탭, 기본정보/커리큘럼/KPI 테이블 구성.
 */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { AppButton } from '@/shared/ui/app-button'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import { BasicInfoSection } from './basic-info-section'
import { CurriculumSection } from './curriculum-section'
import { ProgramKpiTargetSection } from './program-kpi-target-section'
import { ParticipantRecruitmentSection } from './participant-recruitment-section'
import { DetailInfoSection } from './detail-info-section'
import { InstructorRecruitmentSection } from './instructor-recruitment-section'
import { InstructorDetailInfoSection } from './instructor-detail-info-section'
import { VolunteerRecruitmentSection } from './volunteer-recruitment-section'
import { VolunteerDetailInfoSection } from './volunteer-detail-info-section'
import { ApplicantDetails } from './detail-modal/applicants-detail'
import {
  DetailModalSidebar,
  TAB_KEYS,
  TAB_LABELS,
  type TabKey,
  type LnbKey,
  type ApplicantChildKey,
} from './detail-modal/detail-modal-sidebar'
import type { Program } from '@/types/domain'
import './program-detail-info-tab.css'
import './program-detail-fullpage-modal.css'

export interface ProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  program: Program | null
}

const TAB_PARAM = 'tab'

function parseTabFromSearch(searchParams: URLSearchParams): TabKey {
  const tab = searchParams.get(TAB_PARAM)
  if (tab && (TAB_KEYS as readonly string[]).includes(tab)) return tab as TabKey
  return 'info'
}

export function ProgramDetailFullPageModal({
  open,
  onClose,
  program,
}: ProgramDetailFullPageModalProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id
  const {
    program: detailProgram,
    loading,
    sponsorName,
  } = useProgramDetail(open ? programId : undefined)
  const activeTab = open ? parseTabFromSearch(searchParams) : 'info'
  const [activeLnb, setActiveLnb] = useState<LnbKey>('info')
  const [applicantsExpanded, setApplicantsExpanded] = useState(false)
  const [activeChildMenu, setActiveChildMenu] = useState<ApplicantChildKey | ''>('')

  const setActiveTab = (key: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(TAB_PARAM, key)
    setSearchParams(next, { replace: true })
  }

  const displayProgram = useMemo(() => detailProgram ?? program ?? null, [detailProgram, program])
  const title = displayProgram?.title ?? '프로그램 상세'

  const handleInfoEdit = () => {
    if (displayProgram) {
      onClose()
      navigate(`/programs/${displayProgram.id}`)
    }
  }

  const handlePreview = () => {
    if (displayProgram) {
      window.open(`/programs/${displayProgram.id}`, '_blank')
    }
  }

  if (!open) return null

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title=""
      size="full"
      hideHeader
      className="program-detail-fullpage-modal"
    >
      <div className="program-detail-fullpage-modal__layout">
        <DetailModalSidebar
          activeLnb={activeLnb}
          setActiveLnb={setActiveLnb}
          applicantsExpanded={applicantsExpanded}
          setApplicantsExpanded={setApplicantsExpanded}
          activeChildMenu={activeChildMenu}
          setActiveChildMenu={setActiveChildMenu}
        />

        <div className="program-detail-fullpage-modal__main">
          <header className="program-detail-fullpage-modal__header">
            <h2 className="program-detail-fullpage-modal__title">{title}</h2>
            <button
              type="button"
              className="program-detail-fullpage-modal__close"
              onClick={onClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          {activeLnb === 'info' && (
            <div className="program-detail-fullpage-modal__tabs-row">
              <div className="program-detail-fullpage-modal__tabs">
                {TAB_KEYS.map(key => (
                  <button
                    key={key}
                    type="button"
                    className={`program-detail-fullpage-modal__tab ${activeTab === key ? 'program-detail-fullpage-modal__tab--active' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    <span className="program-detail-fullpage-modal__tab-label">
                      {TAB_LABELS[key]}
                    </span>
                  </button>
                ))}
              </div>
              {displayProgram && (
                <div className="program-detail-fullpage-modal__header-actions">
                  {(activeTab === 'info' ||
                    activeTab === 'participants' ||
                    activeTab === 'instructors' ||
                    activeTab === 'volunteers') && (
                    <AppButton variant="primary" size="large" onClick={handleInfoEdit}>
                      정보 수정
                    </AppButton>
                  )}
                  <AppButton variant="primary" size="large" onClick={handlePreview}>
                    프로그램 상세 미리보기
                  </AppButton>
                </div>
              )}
            </div>
          )}

          <div className="program-detail-fullpage-modal__content">
            {loading && !displayProgram ? (
              <div className="program-detail-fullpage-modal__loading">
                <Spin size="large" />
              </div>
            ) : displayProgram ? (
              <>
                {activeLnb === 'info' && (
                  <>
                    {activeTab === 'info' && (
                      <div className="program-detail-fullpage-modal__info-tab">
                        <BasicInfoSection
                          program={displayProgram}
                          sponsorName={sponsorName}
                          createdByName={displayProgram.createdByName}
                          updatedByName={displayProgram.updatedByName}
                          lifecycleStatus={displayProgram.lifecycleStatus ?? undefined}
                          isEditMode={false}
                          displayMode="commonInfo"
                        />
                        <CurriculumSection program={displayProgram} isEditMode={false} />
                        <ProgramKpiTargetSection programId={displayProgram.id} />
                      </div>
                    )}
                    {activeTab === 'participants' && (
                      <div className="program-detail-fullpage-modal__info-tab">
                        <ParticipantRecruitmentSection
                          program={displayProgram}
                          sponsorName={sponsorName}
                        />
                        <div className="program-detail-fullpage-modal__info-tab-block">
                          <DetailInfoSection
                            program={displayProgram}
                            isEditMode={false}
                            showThumbnail
                          />
                        </div>
                      </div>
                    )}
                    {activeTab === 'instructors' && (
                      <div className="program-detail-fullpage-modal__info-tab">
                        <InstructorRecruitmentSection
                          program={displayProgram}
                          sponsorName={sponsorName}
                        />
                        <div className="program-detail-fullpage-modal__info-tab-block">
                          <InstructorDetailInfoSection program={displayProgram} />
                        </div>
                      </div>
                    )}
                    {activeTab === 'volunteers' && (
                      <div className="program-detail-fullpage-modal__info-tab">
                        <VolunteerRecruitmentSection
                          program={displayProgram}
                          sponsorName={sponsorName}
                        />
                        <div className="program-detail-fullpage-modal__info-tab-block">
                          <VolunteerDetailInfoSection program={displayProgram} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeLnb === 'applicants' && <ApplicantDetails menu={activeChildMenu} />}
              </>
            ) : (
              <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
            )}
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
