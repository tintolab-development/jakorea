/**
 * 일반 프로그램 상세 LNB (최대 2depth, UJAT 상세 패턴)
 */

import { useCallback, useState } from 'react'
import { DetailFullpageModalLnbBrand } from '@/shared/ui/detail-fullpage-modal-lnb-brand'
import { DetailFullpageModalLnbArrowDown } from '@/shared/ui/detail-fullpage-modal-lnb-arrow'
import type { GeneralSurveyMenuItem } from '@/features/program/general/lib/general-program-detail-meta'
import type { GeneralDetailLnbKey } from '@/features/program/general/lib/general-program-detail-url'
import {
  GeneralLnbInstitutionApplicationIcon,
  GeneralLnbInstructorApplicationIcon,
  GeneralLnbSurveyManagementIcon,
  GeneralLnbVolunteerHandshakeIcon,
  LnbIconManagers,
  LnbIconProgress,
  LnbIconProjectInfo,
} from './general-program-detail-lnb-icons'

type TopAccordionKey =
  | 'info'
  | 'volunteer_applications'
  | 'progress'
  | 'survey'

const TOP_ACCORDION_KEYS = [
  'info',
  'volunteer_applications',
  'progress',
  'survey',
] as const satisfies readonly TopAccordionKey[]

const VOLUNTEER_INTERVIEW_CHILD_ROWS = [
  { tab: 'vol_doc1', label: '1차 서류 심사 대상자' },
  { tab: 'vol_doc_passed', label: '1차 서류 합격자' },
  { tab: 'vol_interview2', label: '2차 면접 대상자' },
] as const

const PROGRESS_CHILD_ROWS = [
  { tab: 'progress_institutions', label: '참여 기관' },
  { tab: 'progress_instructors', label: '참여 강사' },
  { tab: 'progress_volunteers', label: '참여 봉사자' },
] as const

function isTopBodyDerivedOpen(
  key: TopAccordionKey,
  lnb: GeneralDetailLnbKey,
  tab: string
): boolean {
  if (key === 'info') return lnb === 'info'
  if (key === 'volunteer_applications') return lnb === 'volunteer_applications'
  if (key === 'progress') return lnb === 'progress'
  if (key === 'survey') return lnb === 'survey'
  return false
}

function resolveTopBodyOpen(
  key: TopAccordionKey,
  stick: Partial<Record<TopAccordionKey, boolean>>,
  lnb: GeneralDetailLnbKey,
  tab: string
): boolean {
  const explicit = stick[key]
  if (explicit === false) return false
  if (explicit === true) return true
  return isTopBodyDerivedOpen(key, lnb, tab)
}

function accordionKeysForRoute(lnb: GeneralDetailLnbKey): TopAccordionKey[] {
  if (lnb === 'info') return ['info']
  if (lnb === 'volunteer_applications') return ['volunteer_applications']
  if (lnb === 'progress') return ['progress']
  if (lnb === 'survey') return ['survey']
  return []
}

export interface GeneralProgramDetailSidebarProps {
  activeLnb: GeneralDetailLnbKey
  activeTab: string
  showInstructorApplications: boolean
  showVolunteerApplications: boolean
  volunteerInterviewEnabled: boolean
  surveyItems: GeneralSurveyMenuItem[]
  onSelectChildTab: (lnb: GeneralDetailLnbKey, tab: string) => void
}

export function GeneralProgramDetailSidebar({
  activeLnb,
  activeTab,
  showInstructorApplications,
  showVolunteerApplications,
  volunteerInterviewEnabled,
  surveyItems,
  onSelectChildTab,
}: GeneralProgramDetailSidebarProps) {
  const [topBodyStick, setTopBodyStick] = useState<Partial<Record<TopAccordionKey, boolean>>>({})

  const isTopBodyOpen = useCallback(
    (key: TopAccordionKey) => resolveTopBodyOpen(key, topBodyStick, activeLnb, activeTab),
    [topBodyStick, activeLnb, activeTab]
  )

  const childrenWrapClass = (open: boolean) =>
    `detail-fullpage-modal__lnb-children-wrap${open ? ' detail-fullpage-modal__lnb-children-wrap--open' : ''}`

  const handleSelectChildTab = useCallback(
    (lnb: GeneralDetailLnbKey, tab: string) => {
      setTopBodyStick(prev => {
        const next = { ...prev }
        for (const key of TOP_ACCORDION_KEYS) {
          if (resolveTopBodyOpen(key, prev, activeLnb, activeTab)) {
            next[key] = true
          }
        }
        for (const key of accordionKeysForRoute(lnb)) {
          next[key] = true
        }
        return next
      })
      onSelectChildTab(lnb, tab)
    },
    [activeLnb, activeTab, onSelectChildTab]
  )

  const toggleTopBody = (key: TopAccordionKey) => {
    setTopBodyStick(prev => ({
      ...prev,
      [key]: !resolveTopBodyOpen(key, prev, activeLnb, activeTab),
    }))
  }

  const surveyHasChildren = surveyItems.length > 0

  return (
    <nav className="detail-fullpage-modal__lnb" aria-label="일반 프로그램 상세 메뉴">
      <DetailFullpageModalLnbBrand />
      <div className="detail-fullpage-modal__lnb-body">
        <ul className="detail-fullpage-modal__lnb-list">
          <li>
            <button
              type="button"
              className={`detail-fullpage-modal__lnb-item ${activeLnb === 'info' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
              onClick={() => toggleTopBody('info')}
            >
              <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                <LnbIconProjectInfo />
              </span>
              <span className="detail-fullpage-modal__lnb-item-label">프로그램 정보</span>
              <DetailFullpageModalLnbArrowDown
                className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('info') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
              />
            </button>
            <div
              className={childrenWrapClass(isTopBodyOpen('info'))}
              aria-hidden={!isTopBodyOpen('info')}
            >
              <ul className="detail-fullpage-modal__lnb-children">
                <li>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ${activeLnb === 'info' && activeTab === 'info' ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => handleSelectChildTab('info', 'info')}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label" data-text="공통 정보">
                      공통 정보
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ${activeLnb === 'info' && activeTab === 'recruitment' ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => handleSelectChildTab('info', 'recruitment')}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label" data-text="모집 정보">
                      모집 정보
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ${activeLnb === 'info' && activeTab === 'application' ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => handleSelectChildTab('info', 'application')}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label" data-text="신청 정보">
                      신청 정보
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </li>

          <li>
            <button
              type="button"
              className={`detail-fullpage-modal__lnb-item ${activeLnb === 'institution_applications' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
              onClick={() => handleSelectChildTab('institution_applications', 'main')}
            >
              <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                <GeneralLnbInstitutionApplicationIcon />
              </span>
              <span className="detail-fullpage-modal__lnb-item-label">기관 신청 목록</span>
            </button>
          </li>

          {showInstructorApplications ? (
            <li>
              <button
                type="button"
                className={`detail-fullpage-modal__lnb-item ${activeLnb === 'instructor_applications' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
                onClick={() => handleSelectChildTab('instructor_applications', 'main')}
              >
                <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                  <GeneralLnbInstructorApplicationIcon />
                </span>
                <span className="detail-fullpage-modal__lnb-item-label">강사 신청 목록</span>
              </button>
            </li>
          ) : null}

          {showVolunteerApplications ? (
            <li>
              {volunteerInterviewEnabled ? (
                <>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-item ${activeLnb === 'volunteer_applications' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
                    onClick={() => toggleTopBody('volunteer_applications')}
                  >
                    <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                      <GeneralLnbVolunteerHandshakeIcon />
                    </span>
                    <span className="detail-fullpage-modal__lnb-item-label">봉사자 신청 목록</span>
                    <DetailFullpageModalLnbArrowDown
                      className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('volunteer_applications') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
                    />
                  </button>
                  <div
                    className={childrenWrapClass(isTopBodyOpen('volunteer_applications'))}
                    aria-hidden={!isTopBodyOpen('volunteer_applications')}
                  >
                    <ul className="detail-fullpage-modal__lnb-children">
                      {VOLUNTEER_INTERVIEW_CHILD_ROWS.map(row => (
                        <li key={row.tab}>
                          <button
                            type="button"
                            className={`detail-fullpage-modal__lnb-child ${activeLnb === 'volunteer_applications' && activeTab === row.tab ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                            onClick={() => handleSelectChildTab('volunteer_applications', row.tab)}
                          >
                            <span className="detail-fullpage-modal__lnb-child-dot" />
                            <span
                              className="detail-fullpage-modal__lnb-child-label"
                              data-text={row.label}
                            >
                              {row.label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className={`detail-fullpage-modal__lnb-item ${activeLnb === 'volunteer_applications' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
                  onClick={() => handleSelectChildTab('volunteer_applications', 'vol_all')}
                >
                  <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                    <GeneralLnbVolunteerHandshakeIcon />
                  </span>
                  <span className="detail-fullpage-modal__lnb-item-label">봉사자 신청 목록</span>
                </button>
              )}
            </li>
          ) : null}

          <li>
            <button
              type="button"
              className={`detail-fullpage-modal__lnb-item ${activeLnb === 'progress' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
              onClick={() => toggleTopBody('progress')}
            >
              <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                <LnbIconProgress />
              </span>
              <span className="detail-fullpage-modal__lnb-item-label">프로그램 진행 현황</span>
              <DetailFullpageModalLnbArrowDown
                className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('progress') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
              />
            </button>
            <div
              className={childrenWrapClass(isTopBodyOpen('progress'))}
              aria-hidden={!isTopBodyOpen('progress')}
            >
              <ul className="detail-fullpage-modal__lnb-children">
                {PROGRESS_CHILD_ROWS.map(row => (
                  <li key={row.tab}>
                    <button
                      type="button"
                      className={`detail-fullpage-modal__lnb-child ${activeLnb === 'progress' && activeTab === row.tab ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                      onClick={() => handleSelectChildTab('progress', row.tab)}
                    >
                      <span className="detail-fullpage-modal__lnb-child-dot" />
                      <span className="detail-fullpage-modal__lnb-child-label" data-text={row.label}>
                        {row.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </li>

          <li>
            {surveyHasChildren ? (
              <>
                <button
                  type="button"
                  className={`detail-fullpage-modal__lnb-item ${activeLnb === 'survey' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
                  onClick={() => toggleTopBody('survey')}
                >
                  <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                    <GeneralLnbSurveyManagementIcon />
                  </span>
                  <span className="detail-fullpage-modal__lnb-item-label">설문 관리</span>
                  <DetailFullpageModalLnbArrowDown
                    className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('survey') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
                  />
                </button>
                <div
                  className={childrenWrapClass(isTopBodyOpen('survey'))}
                  aria-hidden={!isTopBodyOpen('survey')}
                >
                  <ul className="detail-fullpage-modal__lnb-children">
                    {surveyItems.map(item => (
                      <li key={item.key}>
                        <button
                          type="button"
                          className={`detail-fullpage-modal__lnb-child ${activeLnb === 'survey' && activeTab === item.key ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                          onClick={() => handleSelectChildTab('survey', item.key)}
                        >
                          <span className="detail-fullpage-modal__lnb-child-dot" />
                          <span
                            className="detail-fullpage-modal__lnb-child-label"
                            data-text={item.label}
                          >
                            {item.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <button
                type="button"
                className={`detail-fullpage-modal__lnb-item ${activeLnb === 'survey' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
                onClick={() => handleSelectChildTab('survey', 'main')}
              >
                <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                  <GeneralLnbSurveyManagementIcon />
                </span>
                <span className="detail-fullpage-modal__lnb-item-label">설문 관리</span>
              </button>
            )}
          </li>

          <li>
            <button
              type="button"
              className={`detail-fullpage-modal__lnb-item ${activeLnb === 'managers' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
              onClick={() => handleSelectChildTab('managers', 'main')}
            >
              <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
                <LnbIconManagers />
              </span>
              <span className="detail-fullpage-modal__lnb-item-label">담당자 정보</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
