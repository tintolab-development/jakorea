/**
 * UJAT 프로그램 상세 전용 LNB (다단 메뉴 — 기존 DetailModalSidebar는 2뎁스만 지원)
 */

import { useEffect, useRef, useState } from 'react'
import type { SVGProps } from 'react'
import type { UjatSurveyMenuItem } from './ujat-program-detail-meta'
import type { UjatDetailLnbKey } from './ujat-program-detail-url'
import { LnbIconManagers, LnbIconProjectInfo } from './program-detail-lnb-icons'
import { UJAT_INSTITUTION_APP_CHILD_ROWS } from './ujat-institution-application-tabs'
import { UjatLnbInstitutionApplicationIcon } from './ujat-lnb-institution-application-icon'
import { UjatLnbSurveyManagementIcon } from './ujat-lnb-survey-management-icon'
import { UjatLnbVolunteerHandshakeIcon } from './ujat-lnb-volunteer-handshake-icon'
import {
  UjatLnbEducationBookIcon,
  UjatLnbEducationSummaryClipboardIcon,
} from './ujat-lnb-education-icons'
import {
  EDU_PROGRESS_CHILD_ROWS,
  EDU_PROGRESS_SUMMARY_TAB,
  educationProgressTabId,
  type EducationProgressHalfKey,
} from './ujat-education-progress-tabs'

type TopAccordionKey =
  | 'info'
  | 'institution_applications'
  | 'volunteer_h1'
  | 'volunteer_h2'
  | 'education_progress_h1'
  | 'education_progress_h2'
  | 'survey'

type VolunteerHalfKey = 'h1' | 'h2'

function LnbArrowDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M4.55806 7.94194C4.31398 7.69786 4.31398 7.30223 4.55806 7.05815C4.80214 6.81407 5.19777 6.81407 5.44185 7.05815L9.99995 11.6163L14.5581 7.05815C14.8021 6.81407 15.1978 6.81407 15.4418 7.05815C15.6859 7.30223 15.6859 7.69786 15.4418 7.94194L10.4418 12.9419C10.1978 13.186 9.80214 13.186 9.55806 12.9419L4.55806 7.94194Z"
        fill="currentColor"
      />
    </svg>
  )
}

function JakoreaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="182"
      height="92"
      viewBox="0 0 182 92"
      fill="none"
      {...props}
    >
      <g clipPath="url(#clip0_ujat_lnb)">
        <path d="M73.0812 0L48.7466 18.4108L63.9601 18.3686L73.0812 0Z" fill="#296075" />
        <path
          d="M73.0952 0L63.9741 18.4108L73.1022 30.5114L73.0952 0Z"
          fill="#01A1AF"
        />
        <path d="M73.0812 30.5117L63.9601 48.8804L48.7466 48.9225L73.0812 30.5117Z" fill="#296075" />
        <path d="M73.0949 30.5117L63.9668 48.8804L73.1019 61.0301L73.0949 30.5117Z" fill="#01A1AF" />
        <path d="M48.6764 18.4102L39.5553 36.7788L24.3418 36.821L48.6764 18.4102Z" fill="#296075" />
        <path d="M48.6901 18.4102L39.562 36.7788L48.6971 48.9215L48.6901 18.4102Z" fill="#01A1AF" />
        <path d="M0 55.2311L15.2065 55.1819L24.3346 36.8203L0 55.2311Z" fill="#296075" />
        <path d="M24.3488 36.8203L15.2207 55.1819L24.3488 67.3317V36.8203Z" fill="#01A1AF" />
        <path d="M48.6691 48.9219L39.541 67.2905L24.3345 67.3327L48.6691 48.9219Z" fill="#296075" />
        <path d="M48.6833 48.9219L39.5552 67.2905L48.6833 79.4403V48.9219Z" fill="#01A1AF" />
        <path d="M73.0738 61.0312L63.9457 79.3999L48.7393 79.4421L73.0738 61.0312Z" fill="#296075" />
        <path d="M63.96 79.3929L73.0951 91.5426L73.0881 61.0312L63.96 79.3929Z" fill="#01A1AF" />
      </g>
      <defs>
        <clipPath id="clip0_ujat_lnb">
          <rect width="182" height="92" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export interface UjatProgramDetailSidebarProps {
  activeLnb: UjatDetailLnbKey
  activeTab: string
  interviewEnabled: boolean
  surveyItems: UjatSurveyMenuItem[]
  onSelectChildTab: (lnb: UjatDetailLnbKey, tab: string) => void
}

function volunteerTabPrefix(half: VolunteerHalfKey): string {
  return half === 'h1' ? 'vh1' : 'vh2'
}

export function UjatProgramDetailSidebar({
  activeLnb,
  activeTab,
  interviewEnabled,
  surveyItems,
  onSelectChildTab,
}: UjatProgramDetailSidebarProps) {
  const [topBodyStick, setTopBodyStick] = useState<Partial<Record<TopAccordionKey, boolean>>>({})

  const prevLnbRef = useRef(activeLnb)
  useEffect(() => {
    if (prevLnbRef.current !== activeLnb) {
      setTopBodyStick({})
      prevLnbRef.current = activeLnb
    }
  }, [activeLnb])

  const isTopBodyDerivedOpen = (key: TopAccordionKey): boolean => {
    if (key === 'education_progress_h1') return activeLnb === 'education_progress' && activeTab.startsWith('edu_h1_')
    if (key === 'education_progress_h2') return activeLnb === 'education_progress' && activeTab.startsWith('edu_h2_')
    return activeLnb === key
  }

  const isTopBodyOpen = (key: TopAccordionKey): boolean => {
    const derived = isTopBodyDerivedOpen(key)
    const s = topBodyStick[key]
    return s !== undefined ? s : derived
  }

  const toggleTopBody = (key: TopAccordionKey) => {
    setTopBodyStick(prev => {
      const derived = isTopBodyDerivedOpen(key)
      const cur = prev[key] !== undefined ? prev[key]! : derived
      return { ...prev, [key]: !cur }
    })
  }

  const clearTopBodyStick = (key: TopAccordionKey) => {
    setTopBodyStick(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const isEduHalfActive = (half: EducationProgressHalfKey): boolean => {
    const prefix = `edu_${half}_`
    return activeLnb === 'education_progress' && activeTab.startsWith(prefix)
  }

  const renderEducationHalfChildren = (half: EducationProgressHalfKey) => {
    return EDU_PROGRESS_CHILD_ROWS.map(row => {
      const tab = educationProgressTabId(half, row.suffix)
      return (
        <li key={tab}>
          <button
            type="button"
            className={`detail-fullpage-modal__lnb-child ujat-detail-lnb__vol-half-child ${activeLnb === 'education_progress' && activeTab === tab ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
            onClick={() => {
              // 반기 헤더의 stick 상태를 해제해, 선택된 반기만 열린 상태로 보이게 한다.
              clearTopBodyStick('education_progress_h1')
              clearTopBodyStick('education_progress_h2')
              onSelectChildTab('education_progress', tab)
            }}
          >
            <span className="detail-fullpage-modal__lnb-child-dot" />
            <span className="detail-fullpage-modal__lnb-child-label">{row.label}</span>
          </button>
        </li>
      )
    })
  }

  return (
    <nav className="detail-fullpage-modal__lnb" aria-label="UJAT 프로그램 상세 메뉴">
      <div className="detail-fullpage-modal__lnb-brand">
        <JakoreaLogo aria-hidden />
      </div>
      <ul className="detail-fullpage-modal__lnb-list">
        {/* 프로그램 정보 */}
        <li>
          <button
            type="button"
            className={`detail-fullpage-modal__lnb-item ${activeLnb === 'info' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
            onClick={() => toggleTopBody('info')}
          >
            <span className="detail-fullpage-modal__lnb-item-icon">
              <LnbIconProjectInfo />
            </span>
            <span className="detail-fullpage-modal__lnb-item-label">프로그램 정보</span>
            <LnbArrowDown
              className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('info') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
            />
          </button>
          <div
            className={`detail-fullpage-modal__lnb-children-wrap ${isTopBodyOpen('info') ? 'detail-fullpage-modal__lnb-children-wrap--open' : ''}`}
            aria-hidden={!isTopBodyOpen('info')}
          >
            <ul className="detail-fullpage-modal__lnb-children">
              <li>
                <button
                  type="button"
                  className={`detail-fullpage-modal__lnb-child ${activeLnb === 'info' && activeTab === 'info' ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                  onClick={() => {
                    clearTopBodyStick('info')
                    onSelectChildTab('info', 'info')
                  }}
                >
                  <span className="detail-fullpage-modal__lnb-child-dot" />
                  <span className="detail-fullpage-modal__lnb-child-label">공통 정보</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={`detail-fullpage-modal__lnb-child ${activeLnb === 'info' && activeTab === 'recruitment' ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                  onClick={() => {
                    clearTopBodyStick('info')
                    onSelectChildTab('info', 'recruitment')
                  }}
                >
                  <span className="detail-fullpage-modal__lnb-child-dot" />
                  <span className="detail-fullpage-modal__lnb-child-label">모집 정보</span>
                </button>
              </li>
            </ul>
          </div>
        </li>

        {/* 기관 신청 목록 */}
        <li>
          <button
            type="button"
            className={`detail-fullpage-modal__lnb-item ${activeLnb === 'institution_applications' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
            onClick={() => toggleTopBody('institution_applications')}
          >
            <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
              <UjatLnbInstitutionApplicationIcon />
            </span>
            <span className="detail-fullpage-modal__lnb-item-label">기관 신청 목록</span>
            <LnbArrowDown
              className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('institution_applications') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
            />
          </button>
          <div
            className={`detail-fullpage-modal__lnb-children-wrap ${isTopBodyOpen('institution_applications') ? 'detail-fullpage-modal__lnb-children-wrap--open' : ''}`}
            aria-hidden={!isTopBodyOpen('institution_applications')}
          >
            <ul className="detail-fullpage-modal__lnb-children">
              {UJAT_INSTITUTION_APP_CHILD_ROWS.map(row => (
                <li key={row.tab}>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ${activeLnb === 'institution_applications' && activeTab === row.tab ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => {
                      clearTopBodyStick('institution_applications')
                      onSelectChildTab('institution_applications', row.tab)
                    }}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label">{row.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </li>

        {(
          [
            { top: 'volunteer_h1' as const, half: 'h1' as const, label: '상반기 봉사자 신청 목록' },
            { top: 'volunteer_h2' as const, half: 'h2' as const, label: '하반기 봉사자 신청 목록' },
          ] as const
        ).map(({ top, half, label }) => {
          const prefix = volunteerTabPrefix(half)
          const childRows = interviewEnabled
            ? (
                [
                  { tab: `${prefix}_doc1`, childLabel: '1차 서류 심사 대상자' },
                  { tab: `${prefix}_doc_passed`, childLabel: '1차 서류 합격자' },
                  { tab: `${prefix}_interview2`, childLabel: '2차 면접 대상자' },
                ] as const
              ).map(row => (
                <li key={row.tab}>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ujat-detail-lnb__vol-half-child ${activeLnb === top && activeTab === row.tab ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => {
                      clearTopBodyStick(top)
                      onSelectChildTab(top, row.tab)
                    }}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label">{row.childLabel}</span>
                  </button>
                </li>
              ))
            : (
                <li key={`${prefix}_all`}>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ujat-detail-lnb__vol-half-child ${activeLnb === top && activeTab === `${prefix}_all` ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => {
                      clearTopBodyStick(top)
                      onSelectChildTab(top, `${prefix}_all`)
                    }}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label">신청자 목록</span>
                  </button>
                </li>
              )

          return (
            <li key={top}>
              <button
                type="button"
                className={`detail-fullpage-modal__lnb-item ${activeLnb === top ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
                onClick={() => toggleTopBody(top)}
              >
                <span className="detail-fullpage-modal__lnb-item-icon ujat-detail-lnb__vol-1depth-icon-wrap">
                  <UjatLnbVolunteerHandshakeIcon />
                </span>
                <span className="detail-fullpage-modal__lnb-item-label">{label}</span>
                <LnbArrowDown
                  className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen(top) ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
                />
              </button>
              <div
                className={`detail-fullpage-modal__lnb-children-wrap ${isTopBodyOpen(top) ? 'detail-fullpage-modal__lnb-children-wrap--open' : ''}`}
                aria-hidden={!isTopBodyOpen(top)}
              >
                <ul className="detail-fullpage-modal__lnb-children">{childRows}</ul>
              </div>
            </li>
          )
        })}

        {/* 교육 진행 현황 */}
        <li>
          <button
            type="button"
            className={`detail-fullpage-modal__lnb-item ${isEduHalfActive('h1') ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
            onClick={() => toggleTopBody('education_progress_h1')}
          >
            <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
              <UjatLnbEducationBookIcon />
            </span>
            <span className="detail-fullpage-modal__lnb-item-label">상반기 교육 진행 현황</span>
            <LnbArrowDown
              className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('education_progress_h1') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
            />
          </button>
          <div
            className={`detail-fullpage-modal__lnb-children-wrap ${isTopBodyOpen('education_progress_h1') ? 'detail-fullpage-modal__lnb-children-wrap--open' : ''}`}
            aria-hidden={!isTopBodyOpen('education_progress_h1')}
          >
            <ul className="detail-fullpage-modal__lnb-children ujat-detail-lnb__education-list">
              {renderEducationHalfChildren('h1')}
            </ul>
          </div>
        </li>

        <li>
          <button
            type="button"
            className={`detail-fullpage-modal__lnb-item ${isEduHalfActive('h2') ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
            onClick={() => toggleTopBody('education_progress_h2')}
          >
            <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
              <UjatLnbEducationBookIcon />
            </span>
            <span className="detail-fullpage-modal__lnb-item-label">하반기 교육 진행 현황</span>
            <LnbArrowDown
              className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('education_progress_h2') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
            />
          </button>
          <div
            className={`detail-fullpage-modal__lnb-children-wrap ${isTopBodyOpen('education_progress_h2') ? 'detail-fullpage-modal__lnb-children-wrap--open' : ''}`}
            aria-hidden={!isTopBodyOpen('education_progress_h2')}
          >
            <ul className="detail-fullpage-modal__lnb-children ujat-detail-lnb__education-list">
              {renderEducationHalfChildren('h2')}
            </ul>
          </div>
        </li>

        <li>
          <button
            type="button"
            className={`detail-fullpage-modal__lnb-item ${activeLnb === 'education_progress' && activeTab === EDU_PROGRESS_SUMMARY_TAB ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
            onClick={() => {
              clearTopBodyStick('education_progress_h1')
              clearTopBodyStick('education_progress_h2')
              onSelectChildTab('education_progress', EDU_PROGRESS_SUMMARY_TAB)
            }}
          >
            <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
              <UjatLnbEducationSummaryClipboardIcon />
            </span>
            <span className="detail-fullpage-modal__lnb-item-label">교육 진행 요약</span>
          </button>
        </li>

        {/* 설문 관리 */}
        <li>
          <button
            type="button"
            className={`detail-fullpage-modal__lnb-item ${activeLnb === 'survey' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
            onClick={() => toggleTopBody('survey')}
          >
            <span className="detail-fullpage-modal__lnb-item-icon" aria-hidden>
              <UjatLnbSurveyManagementIcon />
            </span>
            <span className="detail-fullpage-modal__lnb-item-label">설문 관리</span>
            <LnbArrowDown
              className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('survey') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
            />
          </button>
          <div
            className={`detail-fullpage-modal__lnb-children-wrap ${isTopBodyOpen('survey') ? 'detail-fullpage-modal__lnb-children-wrap--open' : ''}`}
            aria-hidden={!isTopBodyOpen('survey')}
          >
            <ul className="detail-fullpage-modal__lnb-children">
              {surveyItems.map(item => (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ${activeLnb === 'survey' && activeTab === item.key ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => {
                      clearTopBodyStick('survey')
                      onSelectChildTab('survey', item.key)
                    }}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </li>

        {/* 담당자 정보 */}
        <li>
          <button
            type="button"
            className={`detail-fullpage-modal__lnb-item ${activeLnb === 'managers' ? 'detail-fullpage-modal__lnb-item--active' : ''}`}
            onClick={() => onSelectChildTab('managers', 'main')}
          >
            <span className="detail-fullpage-modal__lnb-item-icon">
              <LnbIconManagers />
            </span>
            <span className="detail-fullpage-modal__lnb-item-label">담당자 정보</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
