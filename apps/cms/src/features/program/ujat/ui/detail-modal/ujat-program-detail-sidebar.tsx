/**
 * UJAT 프로그램 상세 전용 LNB (다단 메뉴 — 기존 DetailModalSidebar는 2뎁스만 지원)
 */

import { useCallback, useState } from 'react'
import { DetailFullpageModalLnbBrand } from '@/shared/ui/detail-fullpage-modal-lnb-brand'
import { DetailFullpageModalLnbArrowDown } from '@/shared/ui/detail-fullpage-modal-lnb-arrow'
import type { UjatSurveyMenuItem } from '@/features/program/ujat/lib/ujat-program-detail-meta'
import type { UjatDetailLnbKey } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { LnbIconManagers, LnbIconProjectInfo } from '@/features/program/general/ui/detail-modal/program-detail-lnb-icons'
import { UJAT_INSTITUTION_APP_CHILD_ROWS } from './application-institution/ujat-institution-application-tabs'
import { UjatLnbInstitutionApplicationIcon } from './application-institution/ujat-lnb-institution-application-icon'
import { UjatLnbSurveyManagementIcon } from './survey-management/ujat-lnb-survey-management-icon'
import { UjatLnbVolunteerHandshakeIcon } from './application-volunteer/ujat-lnb-volunteer-handshake-icon'
import {
  UjatLnbEducationBookIcon,
  UjatLnbEducationSummaryClipboardIcon,
} from './progress/ujat-lnb-education-icons'
import {
  EDU_PROGRESS_CHILD_ROWS,
  EDU_PROGRESS_SUMMARY_TAB,
  educationProgressTabId,
  type EducationProgressHalfKey,
} from './progress/ujat-education-progress-tabs'

type TopAccordionKey =
  | 'info'
  | 'institution_applications'
  | 'volunteer_h1'
  | 'volunteer_h2'
  | 'education_progress_h1'
  | 'education_progress_h2'
  | 'survey'

type VolunteerHalfKey = 'h1' | 'h2'

const TOP_ACCORDION_KEYS = [
  'info',
  'institution_applications',
  'volunteer_h1',
  'volunteer_h2',
  'education_progress_h1',
  'education_progress_h2',
  'survey',
] as const satisfies readonly TopAccordionKey[]

function isTopBodyDerivedOpen(
  key: TopAccordionKey,
  lnb: UjatDetailLnbKey,
  tab: string
): boolean {
  if (key === 'education_progress_h1') return lnb === 'education_progress' && tab.startsWith('edu_h1_')
  if (key === 'education_progress_h2') return lnb === 'education_progress' && tab.startsWith('edu_h2_')
  return lnb === key
}

function resolveTopBodyOpen(
  key: TopAccordionKey,
  stick: Partial<Record<TopAccordionKey, boolean>>,
  lnb: UjatDetailLnbKey,
  tab: string
): boolean {
  const explicit = stick[key]
  if (explicit === false) return false
  if (explicit === true) return true
  return isTopBodyDerivedOpen(key, lnb, tab)
}

function accordionKeysForRoute(lnb: UjatDetailLnbKey, tab: string): TopAccordionKey[] {
  if (lnb === 'education_progress') {
    const keys: TopAccordionKey[] = []
    if (tab.startsWith('edu_h1_')) keys.push('education_progress_h1')
    if (tab.startsWith('edu_h2_')) keys.push('education_progress_h2')
    return keys
  }
  if (lnb === 'info') return ['info']
  if (lnb === 'institution_applications') return ['institution_applications']
  if (lnb === 'volunteer_h1') return ['volunteer_h1']
  if (lnb === 'volunteer_h2') return ['volunteer_h2']
  if (lnb === 'survey') return ['survey']
  return []
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

  const isTopBodyOpen = useCallback(
    (key: TopAccordionKey) => resolveTopBodyOpen(key, topBodyStick, activeLnb, activeTab),
    [topBodyStick, activeLnb, activeTab]
  )

  const childrenWrapClass = (open: boolean) =>
    `detail-fullpage-modal__lnb-children-wrap${open ? ' detail-fullpage-modal__lnb-children-wrap--open' : ''}`

  const handleSelectChildTab = useCallback(
    (lnb: UjatDetailLnbKey, tab: string) => {
      setTopBodyStick(prev => {
        const next = { ...prev }
        for (const key of TOP_ACCORDION_KEYS) {
          if (resolveTopBodyOpen(key, prev, activeLnb, activeTab)) {
            next[key] = true
          }
        }
        for (const key of accordionKeysForRoute(lnb, tab)) {
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
            onClick={() => handleSelectChildTab('education_progress', tab)}
          >
            <span className="detail-fullpage-modal__lnb-child-dot" />
            <span className="detail-fullpage-modal__lnb-child-label" data-text={row.label}>
              {row.label}
            </span>
          </button>
        </li>
      )
    })
  }

  return (
    <nav className="detail-fullpage-modal__lnb" aria-label="UJAT 프로그램 상세 메뉴">
      <DetailFullpageModalLnbBrand />
      <div className="detail-fullpage-modal__lnb-body">
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
                  className={`detail-fullpage-modal__lnb-child ${activeLnb === 'info' && (activeTab === 'recruitment' || activeTab.startsWith('recruit_')) ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                  onClick={() => handleSelectChildTab('info', 'recruit_participant')}
                >
                  <span className="detail-fullpage-modal__lnb-child-dot" />
                  <span className="detail-fullpage-modal__lnb-child-label" data-text="모집 정보">
                    모집 정보
                  </span>
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
            <DetailFullpageModalLnbArrowDown
              className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('institution_applications') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
            />
          </button>
          <div
            className={childrenWrapClass(isTopBodyOpen('institution_applications'))}
            aria-hidden={!isTopBodyOpen('institution_applications')}
          >
            <ul className="detail-fullpage-modal__lnb-children">
              {UJAT_INSTITUTION_APP_CHILD_ROWS.map(row => (
                <li key={row.tab}>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ${activeLnb === 'institution_applications' && activeTab === row.tab ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => handleSelectChildTab('institution_applications', row.tab)}
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
                    onClick={() => handleSelectChildTab(top, row.tab)}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label" data-text={row.childLabel}>
                      {row.childLabel}
                    </span>
                  </button>
                </li>
              ))
            : (
                <li key={`${prefix}_all`}>
                  <button
                    type="button"
                    className={`detail-fullpage-modal__lnb-child ujat-detail-lnb__vol-half-child ${activeLnb === top && activeTab === `${prefix}_all` ? 'detail-fullpage-modal__lnb-child--active' : ''}`}
                    onClick={() => handleSelectChildTab(top, `${prefix}_all`)}
                  >
                    <span className="detail-fullpage-modal__lnb-child-dot" />
                    <span className="detail-fullpage-modal__lnb-child-label" data-text="신청자 목록">
                      신청자 목록
                    </span>
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
                <span className="detail-fullpage-modal__lnb-item-icon">
                  <UjatLnbVolunteerHandshakeIcon />
                </span>
                <span className="detail-fullpage-modal__lnb-item-label">{label}</span>
                <DetailFullpageModalLnbArrowDown
                  className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen(top) ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
                />
              </button>
              <div
                className={childrenWrapClass(isTopBodyOpen(top))}
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
            <DetailFullpageModalLnbArrowDown
              className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('education_progress_h1') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
            />
          </button>
          <div
            className={childrenWrapClass(isTopBodyOpen('education_progress_h1'))}
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
            <DetailFullpageModalLnbArrowDown
              className={`detail-fullpage-modal__lnb-item-arrow ${isTopBodyOpen('education_progress_h2') ? 'detail-fullpage-modal__lnb-item-arrow--expanded' : ''}`}
            />
          </button>
          <div
            className={childrenWrapClass(isTopBodyOpen('education_progress_h2'))}
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
            onClick={() => handleSelectChildTab('education_progress', EDU_PROGRESS_SUMMARY_TAB)}
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
                    <span className="detail-fullpage-modal__lnb-child-label" data-text={item.label}>
                      {item.label}
                    </span>
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
            onClick={() => handleSelectChildTab('managers', 'main')}
          >
            <span className="detail-fullpage-modal__lnb-item-icon">
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
