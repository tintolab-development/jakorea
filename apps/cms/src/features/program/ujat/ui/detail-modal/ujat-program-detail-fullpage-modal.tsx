/**
 * UJAT 프로그램 상세 풀페이지 모달 — `/programs/ujat?programId=…&lnb=…&tab=…`
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import { useSponsorService } from '@/features/sponsor/hooks/use-sponsor-service'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '@/features/program/general/hooks/use-program-detail-info-save'
import { handleError } from '@/shared/utils/error-handler'
import { ProjectInfoDetailPanels } from '../../../shared/ui/program-detail/project-info/project-info-detail'
import { ProgramManagersTab } from '@/features/program/general/ui/program-managers-tab'
import { UjatInstitutionApplicationList } from './application-institution/list/list'
import { UjatInstitutionApplicationDetailPage } from './application-institution/detail/detail-page'
import { UjatInstitutionScheduleAssignPage } from './application-institution/schedule-assign/page'
import { UjatInstitutionScheduleConfirmList } from './application-institution/schedule-confirm/list'
import { UjatEducationProgressSummarySection } from './progress/progress-summary/section'
import { UjatEducationProgressAssignmentsSection } from './progress/assignments/section'
import { UjatEducationProgressAttendanceSection } from './progress/attendance/section'
import { UjatEducationProgressInstitutionsSection } from './progress/institutions/section'
import { UjatEducationProgressRegionAssignmentSection } from './progress/region/section'
import { UjatEducationProgressVolunteersSection } from './progress/volunteers/section'
import { UjatEducationProgressVolunteerAddRegistrationView } from './progress/volunteers/add-registration-view'
import { UjatEducationProgressVolunteerDetailPage } from './progress/volunteers/detail/detail-page'
import {
  formatUjatEducationProgressVolunteerDetailTitle,
  getUjatEducationProgressVolunteerDetail,
  isUjatEducationProgressVolunteerInList,
} from './progress/volunteers/detail/detail-mock'
import { UjatInstitutionScheduleConfirmDetailPage } from './application-institution/schedule-confirm/detail-page'
import type { Program } from '@/types/domain'
import { getUjatInstitutionApplicationMockRows } from '@/data/mock/ujat-institution-application-mock'
import {
  isUjatVolunteerApplicantDetailTab,
  parseUjatDetailLnb,
  parseUjatEduInstTab,
  resolveUjatDetailLnbFromSearchParams,
  UJAT_APPLICANT_ID_PARAM,
  UJAT_EDU_INST_ID_PARAM,
  UJAT_EDU_INST_TAB_PARAM,
  UJAT_INST_APP_ID_PARAM,
  UJAT_VOL_ADD_MEMBER_ID_PARAM,
  UJAT_EDU_VOL_ID_PARAM,
  UJAT_EDU_VOL_TAB_PARAM,
  isUjatEducationProgressVolunteersTab,
  parseUjatEduVolTab,
  type UjatDetailLnbKey,
  type UjatEducationProgressInstitutionDetailTab,
  type UjatEducationProgressVolunteerDetailTab,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
import { isUjatVolunteerApplicantInTabList } from './application-volunteer/screening/ujat-volunteer-applicant-detail-url'
import {
  educationProgressHalfFromTab,
  isEducationProgressInstitutionsTab,
  isUjatEducationProgressInstitutionInList,
} from './progress/institutions/detail/detail-url'
import { getUjatEducationProgressInstitutionName } from './progress/institutions/detail/detail-mock'
import { UjatEducationProgressInstitutionDetailPage } from './progress/institutions/detail/detail-page'
import {
  getUjatSurveyMenuItemsForProgram,
  getUjatVolunteerInterviewEnabled,
  UJAT_SURVEY_LEGACY_TAB_MAP,
  type UjatSurveyMenuItem,
} from '@/features/program/ujat/lib/ujat-program-detail-meta'
import { UjatProgramDetailSidebar } from './ujat-program-detail-sidebar'
import { UjatProgramDetailCommonInfoView } from './info/ujat-program-detail-common-info-view'
import { canUjatProgramInfoEdit } from './info/ujat-program-info-edit'
import {
  defaultEducationProgressTabForHalf,
  educationProgressScreenTitle,
  EDU_PROGRESS_LEGACY_TAB_MAP,
  isValidEducationProgressTab,
} from './progress/tabs'
import {
  isValidUjatInstitutionAppTab,
  UJAT_INSTITUTION_APP_CHILD_ROWS,
} from './application-institution/tabs'
import { programDetailInstitutionsEditSchema } from '@/features/program/shared/model/program-detail-edit-schema'
import { CmsButton } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  isUjatRecruitTab,
  normalizeUjatRecruitTab,
  type UjatRecruitTabKey,
} from './info/ujat-program-detail-recruitment-tabs'
import { UjatProgramRecruitmentPanels } from './info/ujat-program-recruitment-panels'
import { UjatProgramRecruitmentTabsRow } from './info/ujat-program-recruitment-tabs-row'
import { UjatVolunteerDocScreeningSection } from './application-volunteer/screening/ujat-volunteer-doc-screening-section'
import { UjatVolunteerDocPassedSection } from './application-volunteer/screening/ujat-volunteer-doc-passed-section'
import { UjatVolunteerInterview2Section } from './application-volunteer/screening/ujat-volunteer-interview2-section'
import type { UjatVolunteerApplicantDetailMeta } from './application-volunteer/screening/use-ujat-volunteer-applicant-detail'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsInput } from '@/shared/ui/cms-input'
import { duplicateWritingTemplate } from '@/features/template/api/duplicate-writing-template'
import {
  findWritingTemplateRowByDefinitionId,
  getWritingTemplateRowsByCategory,
} from '@/features/template/lib/writing-template-create-helpers'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { UJAT_SURVEY_POLL_MOCK_RESPONSE_COUNT } from '@/data/mock/ujat-survey-poll-responses-mock'
import { UjatSurveyPollResultsView } from './survey-management/ui/ujat-survey-poll-results-view'
import { UjatSurveyRegisteredActions } from './survey-management/ui/ujat-survey-registered-actions'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import './ujat-program-detail-fullpage-modal.css'

const TAB_PARAM = 'tab'
const LNB_PARAM = 'lnb'
const EDIT_PARAM = 'edit'
const UJAT_DETAIL_QUERY_PARAMS = [
  'programId',
  LNB_PARAM,
  TAB_PARAM,
  EDIT_PARAM,
  UJAT_INST_APP_ID_PARAM,
  UJAT_APPLICANT_ID_PARAM,
  UJAT_EDU_INST_ID_PARAM,
  UJAT_EDU_INST_TAB_PARAM,
  UJAT_VOL_ADD_MEMBER_ID_PARAM,
] as const
const UJAT_NESTED_DETAIL_QUERY_PARAMS = [
  UJAT_INST_APP_ID_PARAM,
  UJAT_APPLICANT_ID_PARAM,
  UJAT_EDU_INST_ID_PARAM,
  UJAT_EDU_INST_TAB_PARAM,
  UJAT_VOL_ADD_MEMBER_ID_PARAM,
  UJAT_EDU_VOL_ID_PARAM,
  UJAT_EDU_VOL_TAB_PARAM,
] as const

const UJAT_SURVEY_TEMPLATE_BY_MENU_KEY: Record<string, string> = {
  'survey-poll': 'survey-default',
  'survey-satisfaction': 'survey-student',
  'survey-lecture-eval': 'survey-admin',
}

type UjatSurveyProgressStatus = 'before_start' | 'in_progress' | 'finished'

type UjatRegisteredSurvey = {
  id: string
  title: string
  templateId: string
  status: UjatSurveyProgressStatus
  responseCount: number
  participantTotal: number
}

const UJAT_REGISTERED_SURVEY_MOCK: UjatRegisteredSurvey[] = []

function buildSurveyPreviewDraft(templateName?: string) {
  const base = normalizeWritingFormDraft(createDefaultSurveyDraft())
  const name = templateName?.trim()
  if (name == null || name === '') return base
  return normalizeWritingFormDraft({
    ...base,
    paragraphs: base.paragraphs.map(paragraph =>
      paragraph.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title
        ? { ...paragraph, surveyTitle: name }
        : paragraph
    ),
  })
}

export interface UjatProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  /** 목록에서 선택된 프로그램(로딩 전 null 가능) */
  program: Program | null
  /** URL의 programId — 목록에 아직 없을 때 상세 fetch용 */
  programIdHint?: string | null
}

function defaultVolunteerTab(interview: boolean, half: 'h1' | 'h2'): string {
  const p = half === 'h1' ? 'vh1' : 'vh2'
  if (!interview) return `${p}_all`
  return `${p}_doc1`
}

function isVolunteerTabValidForLnb(
  lnb: 'volunteer_h1' | 'volunteer_h2',
  tab: string,
  interview: boolean
): boolean {
  const prefix = lnb === 'volunteer_h1' ? 'vh1' : 'vh2'
  if (!tab.startsWith(`${prefix}_`)) return false
  if (!interview) return tab === `${prefix}_all`
  return (
    tab === `${prefix}_doc1` || tab === `${prefix}_doc_passed` || tab === `${prefix}_interview2`
  )
}

function defaultVolunteerTabForLnb(
  lnb: 'volunteer_h1' | 'volunteer_h2',
  interview: boolean
): string {
  return defaultVolunteerTab(interview, lnb === 'volunteer_h1' ? 'h1' : 'h2')
}

function defaultTabForLnb(lnb: UjatDetailLnbKey, interview: boolean, surveyKeys: string[]): string {
  switch (lnb) {
    case 'info':
      return 'info'
    case 'institution_applications':
      return 'inst_all'
    case 'volunteer_h1':
      return defaultVolunteerTabForLnb('volunteer_h1', interview)
    case 'volunteer_h2':
      return defaultVolunteerTabForLnb('volunteer_h2', interview)
    case 'education_progress':
      return defaultEducationProgressTabForHalf('h1')
    case 'survey':
      return surveyKeys[0] ?? 'survey-poll'
    case 'managers':
      return 'main'
    default:
      return 'info'
  }
}

function normalizeUjatDetailParams(
  programId: string,
  searchParams: URLSearchParams,
  interview: boolean,
  surveyKeys: string[],
  validInstAppIds: ReadonlySet<string>
): URLSearchParams | null {
  const next = new URLSearchParams(searchParams)
  next.set('programId', programId)
  const rawLnb = searchParams.get(LNB_PARAM) ?? ''
  let lnb: UjatDetailLnbKey =
    rawLnb === 'volunteer_applications'
      ? (() => {
          const t0 = searchParams.get(TAB_PARAM) ?? ''
          return t0.startsWith('vh2_') ? 'volunteer_h2' : 'volunteer_h1'
        })()
      : (parseUjatDetailLnb(searchParams) ?? 'info')
  let tab = searchParams.get(TAB_PARAM) ?? ''

  const instAppIdRaw = searchParams.get(UJAT_INST_APP_ID_PARAM)
  if (instAppIdRaw) {
    if (!validInstAppIds.has(instAppIdRaw)) {
      next.delete(UJAT_INST_APP_ID_PARAM)
    } else {
      lnb = 'institution_applications'
      const currentTab = searchParams.get(TAB_PARAM) ?? ''
      tab = currentTab === 'inst_schedule_confirm' ? 'inst_schedule_confirm' : 'inst_all'
    }
  }

  const setInvalid = (l: UjatDetailLnbKey, t: string) => {
    lnb = l
    tab = t
  }

  if (tab === '') {
    tab = defaultTabForLnb(lnb, interview, surveyKeys)
  }

  if (lnb === 'info') {
    if (tab === 'info') {
      /* ok */
    } else if (isUjatRecruitTab(tab)) {
      tab = normalizeUjatRecruitTab(tab)
    } else {
      setInvalid('info', 'info')
    }
  } else if (lnb === 'institution_applications') {
    if (!isValidUjatInstitutionAppTab(tab)) {
      setInvalid('institution_applications', 'inst_all')
    }
  } else if (lnb === 'volunteer_h1' || lnb === 'volunteer_h2') {
    if (!isVolunteerTabValidForLnb(lnb, tab, interview)) {
      setInvalid(lnb, defaultVolunteerTabForLnb(lnb, interview))
    }
  } else if (lnb === 'education_progress') {
    tab = EDU_PROGRESS_LEGACY_TAB_MAP[tab] ?? tab
    if (!isValidEducationProgressTab(tab)) {
      setInvalid('education_progress', defaultEducationProgressTabForHalf('h1'))
    }
  } else if (lnb === 'survey') {
    tab = UJAT_SURVEY_LEGACY_TAB_MAP[tab] ?? tab
    if (!surveyKeys.includes(tab)) {
      setInvalid('survey', surveyKeys[0] ?? 'survey-poll')
    }
  } else if (lnb === 'managers') {
    if (tab !== 'main') setInvalid('managers', 'main')
  }

  if (next.get(LNB_PARAM) !== lnb) next.set(LNB_PARAM, lnb)
  if (next.get(TAB_PARAM) !== tab) next.set(TAB_PARAM, tab)
  if (instAppIdRaw && validInstAppIds.has(instAppIdRaw)) {
    next.set(UJAT_INST_APP_ID_PARAM, instAppIdRaw)
  }

  const applicantId = next.get(UJAT_APPLICANT_ID_PARAM)
  if (applicantId) {
    if (!isUjatVolunteerApplicantDetailTab(tab)) {
      next.delete(UJAT_APPLICANT_ID_PARAM)
    } else if (!isUjatVolunteerApplicantInTabList(programId, tab, applicantId)) {
      next.delete(UJAT_APPLICANT_ID_PARAM)
    }
  }

  const eduInstIdRaw = next.get(UJAT_EDU_INST_ID_PARAM)
  if (lnb !== 'education_progress' || !isEducationProgressInstitutionsTab(tab)) {
    next.delete(UJAT_EDU_INST_ID_PARAM)
    next.delete(UJAT_EDU_INST_TAB_PARAM)
  } else if (eduInstIdRaw) {
    const half = educationProgressHalfFromTab(tab)
    if (
      !isUjatEducationProgressInstitutionInList(programId, half, eduInstIdRaw)
    ) {
      next.delete(UJAT_EDU_INST_ID_PARAM)
      next.delete(UJAT_EDU_INST_TAB_PARAM)
    } else {
      const detailTab = parseUjatEduInstTab(next)
      if (next.get(UJAT_EDU_INST_TAB_PARAM) !== detailTab) {
        next.set(UJAT_EDU_INST_TAB_PARAM, detailTab)
      }
    }
  }

  const volAddMemberIdRaw = next.get(UJAT_VOL_ADD_MEMBER_ID_PARAM)
  if (
    lnb !== 'education_progress' ||
    !isUjatEducationProgressVolunteersTab(tab) ||
    !volAddMemberIdRaw?.trim()
  ) {
    next.delete(UJAT_VOL_ADD_MEMBER_ID_PARAM)
  }

  const before = searchParams.toString()
  const after = next.toString()
  if (before === after) return null
  return next
}

const VOLUNTEER_TAB_LABELS: Record<string, string> = {
  vh1_all: '상반기 봉사자 신청 — 신청자 목록',
  vh2_all: '하반기 봉사자 신청 — 신청자 목록',
  vh1_doc1: '상반기 — 1차 서류 심사 대상자',
  vh1_doc_passed: '상반기 — 1차 서류 합격자',
  vh1_interview2: '상반기 — 2차 면접 대상자',
  vh2_doc1: '하반기 — 1차 서류 심사 대상자',
  vh2_doc_passed: '하반기 — 1차 서류 합격자',
  vh2_interview2: '하반기 — 2차 면접 대상자',
}

function volunteerScreenTitle(tab: string): string {
  return VOLUNTEER_TAB_LABELS[tab] ?? tab
}

function ujatLnbBreadcrumbLabel(lnb: UjatDetailLnbKey, tab: string): string {
  switch (lnb) {
    case 'info':
      return '프로그램 정보'
    case 'institution_applications':
      return '기관 신청 목록'
    case 'volunteer_h1':
      return '상반기 봉사자 신청 목록'
    case 'volunteer_h2':
      return '하반기 봉사자 신청 목록'
    case 'education_progress':
      if (tab === 'edu_summary') return '교육 진행 요약'
      if (tab.startsWith('edu_h2_')) return '하반기 교육 진행 현황'
      return '상반기 교육 진행 현황'
    case 'survey':
      return '설문 관리'
    case 'managers':
      return '담당자 정보'
    default:
      return '프로그램 정보'
  }
}

function ujatChildBreadcrumbLabel(
  lnb: UjatDetailLnbKey,
  tab: string,
  surveyItems: UjatSurveyMenuItem[]
): string | null {
  if (lnb === 'info') {
    return tab === 'info' ? '공통 정보' : isUjatRecruitTab(tab) ? '모집 정보' : null
  }
  if (lnb === 'institution_applications') {
    return UJAT_INSTITUTION_APP_CHILD_ROWS.find(row => row.tab === tab)?.label ?? null
  }
  if (lnb === 'volunteer_h1' || lnb === 'volunteer_h2') {
    if (tab.endsWith('_all')) return '신청자 목록'
    if (tab.endsWith('_doc1')) return '1차 서류 심사 대상자'
    if (tab.endsWith('_doc_passed')) return '1차 서류 합격자'
    if (tab.endsWith('_interview2')) return '2차 면접 대상자'
    return null
  }
  if (lnb === 'education_progress' && tab !== 'edu_summary') {
    const screenTitle = educationProgressScreenTitle(tab)
    return screenTitle.includes(' — ') ? screenTitle.split(' — ')[1] : screenTitle
  }
  if (lnb === 'survey') {
    return surveyItems.find(item => item.key === tab)?.label ?? null
  }
  return null
}

function ujatLnbBreadcrumbTargetTab(
  lnb: UjatDetailLnbKey,
  activeTab: string,
  interview: boolean,
  surveyKeys: string[]
): string {
  if (lnb === 'education_progress') {
    if (activeTab === 'edu_summary') return 'edu_summary'
    return activeTab.startsWith('edu_h2_')
      ? defaultEducationProgressTabForHalf('h2')
      : defaultEducationProgressTabForHalf('h1')
  }
  return defaultTabForLnb(lnb, interview, surveyKeys)
}

function isUjatVolunteerApplicantDetailRoute(lnb: UjatDetailLnbKey, tab: string): boolean {
  return (
    (lnb === 'volunteer_h1' || lnb === 'volunteer_h2') &&
    (tab === 'vh1_doc1' ||
      tab === 'vh2_doc1' ||
      tab === 'vh1_doc_passed' ||
      tab === 'vh2_doc_passed' ||
      tab === 'vh1_interview2' ||
      tab === 'vh2_interview2')
  )
}

function UjatPlaceholderSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="program-detail-fullpage-modal__info-tab ujat-detail-modal__placeholder">
      <Typography.Title level={5}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
    </div>
  )
}

function UjatSurveyPollEmptyState({ onRegisterClick }: { onRegisterClick: () => void }) {
  return (
    <div className="program-detail-fullpage-modal__info-tab ujat-survey-poll-empty">
      <div className="ujat-survey-poll-empty__content">
        <span className="ujat-survey-poll-empty__icon" aria-hidden>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
            <mask id="ujat-survey-empty-icon-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="60" height="60">
              <rect width="60" height="60" fill="#D9D9D9" />
            </mask>
            <g mask="url(#ujat-survey-empty-icon-mask)">
              <path
                d="M17.5 44.25L21 47.8125C21.25 48.0625 21.5417 48.1875 21.875 48.1875C22.2083 48.1875 22.5 48.0625 22.75 47.8125C23 47.5625 23.125 47.2604 23.125 46.9062C23.125 46.5521 23 46.25 22.75 46L19.25 42.5L22.8125 38.9375C23.0625 38.6875 23.1875 38.3958 23.1875 38.0625C23.1875 37.7292 23.0625 37.4375 22.8125 37.1875C22.5625 36.9375 22.2708 36.8125 21.9375 36.8125C21.6042 36.8125 21.3125 36.9375 21.0625 37.1875L17.5 40.75L13.9375 37.1875C13.6875 36.9375 13.3958 36.8125 13.0625 36.8125C12.7292 36.8125 12.4375 36.9375 12.1875 37.1875C11.9375 37.4375 11.8125 37.7292 11.8125 38.0625C11.8125 38.3958 11.9375 38.6875 12.1875 38.9375L15.75 42.5L12.1875 46.0625C11.9375 46.3125 11.8125 46.6042 11.8125 46.9375C11.8125 47.2708 11.9375 47.5625 12.1875 47.8125C12.4375 48.0625 12.7292 48.1875 13.0625 48.1875C13.3958 48.1875 13.6875 48.0625 13.9375 47.8125L17.5 44.25ZM8.65625 51.3438C6.21875 48.9062 5 45.9583 5 42.5C5 39.0417 6.21875 36.0938 8.65625 33.6563C11.0938 31.2188 14.0417 30 17.5 30C20.9583 30 23.9062 31.2188 26.3438 33.6563C28.7813 36.0938 30 39.0417 30 42.5C30 45.9583 28.7813 48.9062 26.3438 51.3438C23.9062 53.7812 20.9583 55 17.5 55C14.0417 55 11.0938 53.7812 8.65625 51.3438ZM35.5 36.5C35 35.9583 34.4688 35.4062 33.9062 34.8438C33.3438 34.2812 32.7917 33.75 32.25 33.25C33.8333 32.25 35.1042 30.9167 36.0625 29.25C37.0208 27.5833 37.5 25.75 37.5 23.75C37.5 20.625 36.4062 17.9688 34.2188 15.7812C32.0312 13.5938 29.375 12.5 26.25 12.5C23.125 12.5 20.4688 13.5938 18.2812 15.7812C16.0938 17.9688 15 20.625 15 23.75C15 24 15.0104 24.2396 15.0313 24.4688C15.0521 24.6979 15.0833 24.9375 15.125 25.1875C14.375 25.2708 13.5521 25.4375 12.6562 25.6875C11.7604 25.9375 10.9583 26.2292 10.25 26.5625C10.1667 26.1042 10.1042 25.6458 10.0625 25.1875C10.0208 24.7292 10 24.25 10 23.75C10 19.2083 11.5729 15.3646 14.7188 12.2188C17.8646 9.07292 21.7083 7.5 26.25 7.5C30.7917 7.5 34.6354 9.07292 37.7812 12.2188C40.9271 15.3646 42.5 19.2083 42.5 23.75C42.5 25.5417 42.2188 27.2396 41.6562 28.8438C41.0938 30.4479 40.3125 31.9167 39.3125 33.25L53.25 47.25C53.7083 47.7083 53.9479 48.2812 53.9688 48.9688C53.9896 49.6562 53.75 50.25 53.25 50.75C52.7917 51.2083 52.2083 51.4375 51.5 51.4375C50.7917 51.4375 50.2083 51.2083 49.75 50.75L35.5 36.5Z"
                fill="#01A1AF"
              />
            </g>
          </svg>
        </span>
        <div className="ujat-survey-poll-empty__texts">
          <p className="ujat-survey-poll-empty__title">아직 등록된 설문조사가 없습니다.</p>
          <p className="ujat-survey-poll-empty__description">
            설문조사 등록 버튼을 눌러 설문 내용을 추가해 주세요.
          </p>
        </div>
        <CmsButton className="ujat-survey-poll-empty__register-button" onClick={onRegisterClick}>
          설문조사 등록
        </CmsButton>
      </div>
    </div>
  )
}

function UjatSurveyNoResponseState({
  canDelete,
  onDeleteClick,
  onOpenTemplatePreview,
}: {
  canDelete: boolean
  onDeleteClick: () => void
  onOpenTemplatePreview: () => void
}) {
  return (
    <div className="program-detail-fullpage-modal__info-tab ujat-survey-registered-empty-state">
      <div className="ujat-survey-registered-empty-state__content">
        <span className="ujat-survey-registered-empty-state__icon" aria-hidden>
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
            <mask
              id="ujat-survey-registered-empty-icon-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="60"
              height="60"
            >
              <rect width="60" height="60" fill="#D9D9D9" />
            </mask>
            <g mask="url(#ujat-survey-registered-empty-icon-mask)">
              <path
                d="M17.5 44.25L21 47.8125C21.25 48.0625 21.5417 48.1875 21.875 48.1875C22.2083 48.1875 22.5 48.0625 22.75 47.8125C23 47.5625 23.125 47.2604 23.125 46.9062C23.125 46.5521 23 46.25 22.75 46L19.25 42.5L22.8125 38.9375C23.0625 38.6875 23.1875 38.3958 23.1875 38.0625C23.1875 37.7292 23.0625 37.4375 22.8125 37.1875C22.5625 36.9375 22.2708 36.8125 21.9375 36.8125C21.6042 36.8125 21.3125 36.9375 21.0625 37.1875L17.5 40.75L13.9375 37.1875C13.6875 36.9375 13.3958 36.8125 13.0625 36.8125C12.7292 36.8125 12.4375 36.9375 12.1875 37.1875C11.9375 37.4375 11.8125 37.7292 11.8125 38.0625C11.8125 38.3958 11.9375 38.6875 12.1875 38.9375L15.75 42.5L12.1875 46.0625C11.9375 46.3125 11.8125 46.6042 11.8125 46.9375C11.8125 47.2708 11.9375 47.5625 12.1875 47.8125C12.4375 48.0625 12.7292 48.1875 13.0625 48.1875C13.3958 48.1875 13.6875 48.0625 13.9375 47.8125L17.5 44.25ZM8.65625 51.3438C6.21875 48.9062 5 45.9583 5 42.5C5 39.0417 6.21875 36.0938 8.65625 33.6563C11.0938 31.2188 14.0417 30 17.5 30C20.9583 30 23.9062 31.2188 26.3438 33.6563C28.7813 36.0938 30 39.0417 30 42.5C30 45.9583 28.7813 48.9062 26.3438 51.3438C23.9062 53.7812 20.9583 55 17.5 55C14.0417 55 11.0938 53.7812 8.65625 51.3438ZM35.5 36.5C35 35.9583 34.4688 35.4062 33.9062 34.8438C33.3438 34.2812 32.7917 33.75 32.25 33.25C33.8333 32.25 35.1042 30.9167 36.0625 29.25C37.0208 27.5833 37.5 25.75 37.5 23.75C37.5 20.625 36.4062 17.9688 34.2188 15.7812C32.0312 13.5938 29.375 12.5 26.25 12.5C23.125 12.5 20.4688 13.5938 18.2812 15.7812C16.0938 17.9688 15 20.625 15 23.75C15 24 15.0104 24.2396 15.0313 24.4688C15.0521 24.6979 15.0833 24.9375 15.125 25.1875C14.375 25.2708 13.5521 25.4375 12.6562 25.6875C11.7604 25.9375 10.9583 26.2292 10.25 26.5625C10.1667 26.1042 10.1042 25.6458 10.0625 25.1875C10.0208 24.7292 10 24.25 10 23.75C10 19.2083 11.5729 15.3646 14.7188 12.2188C17.8646 9.07292 21.7083 7.5 26.25 7.5C30.7917 7.5 34.6354 9.07292 37.7812 12.2188C40.9271 15.3646 42.5 19.2083 42.5 23.75C42.5 25.5417 42.2188 27.2396 41.6562 28.8438C41.0938 30.4479 40.3125 31.9167 39.3125 33.25L53.25 47.25C53.7083 47.7083 53.9479 48.2812 53.9688 48.9688C53.9896 49.6562 53.75 50.25 53.25 50.75C52.7917 51.2083 52.2083 51.4375 51.5 51.4375C50.7917 51.4375 50.2083 51.2083 49.75 50.75L35.5 36.5Z"
                fill="#01A1AF"
              />
            </g>
          </svg>
        </span>
        <div className="ujat-survey-registered-empty-state__texts">
          <p className="ujat-survey-registered-empty-state__title">해당 설문조사는 아직 진행 전입니다.</p>
          <p className="ujat-survey-registered-empty-state__description">
            설문 진행 이후에 확인해 주세요.
          </p>
        </div>
        <div className="ujat-survey-registered-empty-state__actions">
          <CmsButton
            className="ujat-survey-registered-empty-state__delete-button"
            variant="delete"
            width={140}
            disabled={!canDelete}
            onClick={onDeleteClick}
          >
            설문조사 삭제
          </CmsButton>
          <CmsButton
            className="ujat-survey-registered-empty-state__preview-button"
            width={180}
            onClick={onOpenTemplatePreview}
          >
            설문 양식 보기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}

export function UjatProgramDetailFullPageModal({
  open,
  onClose,
  program,
  programIdHint = null,
}: UjatProgramDetailFullPageModalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id ?? programIdHint ?? undefined

  const {
    program: detailProgram,
    loading,
    sponsorName,
    updateProgram,
  } = useProgramDetail(open ? programId : undefined)

  const displayProgram = useMemo(() => detailProgram ?? program ?? null, [detailProgram, program])

  const { getByIdSync: getSponsorByIdSync } = useSponsorService()
  const sponsorHomepageUrl = useMemo(() => {
    const sid = displayProgram?.sponsorId
    if (!sid) return undefined
    const sponsor = getSponsorByIdSync(sid) as { homepageUrl?: string } | undefined
    return sponsor?.homepageUrl
  }, [displayProgram?.sponsorId, getSponsorByIdSync])

  const interviewEnabled = programId ? getUjatVolunteerInterviewEnabled(programId) : true
  const surveyItems = useMemo(
    () => (programId ? getUjatSurveyMenuItemsForProgram(programId) : []),
    [programId]
  )
  const surveyKeys = useMemo(() => surveyItems.map(s => s.key), [surveyItems])
  const [institutionListVersion, setInstitutionListVersion] = useState(0)
  const [surveyCreateModalOpen, setSurveyCreateModalOpen] = useState(false)
  const [selectedSurveyTemplateId, setSelectedSurveyTemplateId] = useState<string | null>(null)
  const [submittingSurveyTemplate, setSubmittingSurveyTemplate] = useState(false)
  const [surveyDeleteModalOpen, setSurveyDeleteModalOpen] = useState(false)
  const [surveyDeleteConfirmWord, setSurveyDeleteConfirmWord] = useState('')
  const [registeredSurveys, setRegisteredSurveys] = useState<UjatRegisteredSurvey[]>(
    UJAT_REGISTERED_SURVEY_MOCK
  )
  const [activeRegisteredSurveyId, setActiveRegisteredSurveyId] = useState<string | null>(
    UJAT_REGISTERED_SURVEY_MOCK[0]?.id ?? null
  )
  const { openWritingUserPreview } = useTemplateWritingPreview()

  const surveyTemplateOptions = useMemo(() => {
    const byId = new Map(getWritingTemplateRowsByCategory('survey').map(row => [row.id, row]))
    return surveyItems
      .map(item => {
        const templateId = UJAT_SURVEY_TEMPLATE_BY_MENU_KEY[item.key]
        if (!templateId) return null
        const row = byId.get(templateId)
        if (!row) return null
        return {
          label: row.templateName,
          value: row.id,
        }
      })
      .filter((opt): opt is { label: string; value: string } => opt != null)
  }, [surveyItems])
  const activeRegisteredSurvey = useMemo(
    () => registeredSurveys.find(item => item.id === activeRegisteredSurveyId) ?? null,
    [registeredSurveys, activeRegisteredSurveyId]
  )

  const activeLnb: UjatDetailLnbKey = open
    ? (resolveUjatDetailLnbFromSearchParams(searchParams) ?? 'info')
    : 'info'

  const validInstAppIds = useMemo(
    () => new Set(getUjatInstitutionApplicationMockRows().map(row => row.id)),
    [institutionListVersion]
  )

  const institutionApplicationId = open ? searchParams.get(UJAT_INST_APP_ID_PARAM) : null
  const institutionDetailId =
    institutionApplicationId && validInstAppIds.has(institutionApplicationId)
      ? institutionApplicationId
      : null

  const activeTab = useMemo(() => {
    if (!open) return 'info'
    const rawTab = searchParams.get(TAB_PARAM)
    const resolved =
      rawTab && rawTab.length > 0
        ? rawTab
        : defaultTabForLnb(activeLnb, interviewEnabled, surveyKeys)
    if (activeLnb === 'info' && isUjatRecruitTab(resolved)) {
      return normalizeUjatRecruitTab(resolved)
    }
    return resolved
  }, [open, searchParams, activeLnb, interviewEnabled, surveyKeys])

  const eduInstitutionIdRaw = open ? searchParams.get(UJAT_EDU_INST_ID_PARAM) : null
  const eduInstitutionHalf =
    activeTab.startsWith('edu_h2') ? 'h2' : activeTab.startsWith('edu_h1') ? 'h1' : null
  const eduInstitutionDetailId =
    eduInstitutionIdRaw &&
    eduInstitutionHalf &&
    displayProgram?.id &&
    isUjatEducationProgressInstitutionInList(
      displayProgram.id,
      eduInstitutionHalf,
      eduInstitutionIdRaw
    )
      ? eduInstitutionIdRaw
      : null

  const institutionDetailName = useMemo(() => {
    if (!institutionDetailId) return null
    return (
      getUjatInstitutionApplicationMockRows().find(row => row.id === institutionDetailId)
        ?.institutionName ?? null
    )
  }, [institutionDetailId, institutionListVersion])

  const eduInstitutionDetailName = useMemo(() => {
    if (!eduInstitutionDetailId) return null
    return getUjatEducationProgressInstitutionName(eduInstitutionDetailId)
  }, [eduInstitutionDetailId])

  const eduInstitutionDetailTab = open
    ? parseUjatEduInstTab(searchParams)
    : ('application' as UjatEducationProgressInstitutionDetailTab)

  const volAddMemberIdEarly = open ? searchParams.get(UJAT_VOL_ADD_MEMBER_ID_PARAM) : null

  const eduVolunteerHalf =
    activeTab.startsWith('edu_h2') ? 'h2' : activeTab.startsWith('edu_h1') ? 'h1' : null
  const eduVolunteerIdRaw = open ? searchParams.get(UJAT_EDU_VOL_ID_PARAM) : null
  const eduVolunteerDetailId =
    eduVolunteerIdRaw &&
    eduVolunteerHalf &&
    displayProgram?.id &&
    isUjatEducationProgressVolunteerInList(eduVolunteerHalf, eduVolunteerIdRaw) &&
    !volAddMemberIdEarly
      ? eduVolunteerIdRaw
      : null

  const eduVolunteerDetailTab = open
    ? parseUjatEduVolTab(searchParams)
    : ('application' as UjatEducationProgressVolunteerDetailTab)

  const eduVolunteerDetailMeta = useMemo(() => {
    if (!eduVolunteerDetailId || !eduVolunteerHalf) return null
    const detail = getUjatEducationProgressVolunteerDetail(
      displayProgram?.id ?? '',
      eduVolunteerHalf,
      eduVolunteerDetailId
    )
    if (!detail) return null
    const volunteerName = detail.applicant.name
    return {
      title: formatUjatEducationProgressVolunteerDetailTitle(eduVolunteerHalf, volunteerName),
      breadcrumbLabel: volunteerName,
    }
  }, [displayProgram?.id, eduVolunteerDetailId, eduVolunteerHalf])

  const institutionDetailTitlePrefix = useMemo(() => {
    if (!institutionDetailId) return '신청 기관 상세'
    if (activeLnb === 'institution_applications' && activeTab === 'inst_schedule_confirm') {
      return '임시 배정 기관 상세'
    }
    return '신청 기관 상세'
  }, [institutionDetailId, activeLnb, activeTab])

  const activeRecruitTab: UjatRecruitTabKey | null =
    activeLnb === 'info' && isUjatRecruitTab(activeTab) ? (activeTab as UjatRecruitTabKey) : null

  const surveyKeysJoined = surveyKeys.join('|')

  useEffect(() => {
    if (!open || !programId) return
    const normalized = normalizeUjatDetailParams(
      programId,
      searchParams,
      interviewEnabled,
      surveyKeys,
      validInstAppIds
    )
    if (normalized) setSearchParams(normalized, { replace: true })
  }, [
    open,
    programId,
    interviewEnabled,
    surveyKeysJoined,
    searchParams,
    setSearchParams,
    surveyKeys,
    validInstAppIds,
    institutionListVersion,
  ])

  const setInstitutionApplicationId = useCallback(
    (id: string | null) => {
      if (!programId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      if (id) {
        next.set(UJAT_INST_APP_ID_PARAM, id)
        next.set(LNB_PARAM, 'institution_applications')
        const tabToKeep =
          activeTab === 'inst_schedule_confirm' ? 'inst_schedule_confirm' : 'inst_all'
        next.set(TAB_PARAM, tabToKeep)
        next.delete(UJAT_APPLICANT_ID_PARAM)
      } else {
        next.delete(UJAT_INST_APP_ID_PARAM)
      }
      next.delete(EDIT_PARAM)
      setSearchParams(next, { replace: id == null })
    },
    [programId, searchParams, setSearchParams, activeTab]
  )

  const setLnbTab = useCallback(
    (lnb: UjatDetailLnbKey, tab: string) => {
      if (!programId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      next.set(LNB_PARAM, lnb)
      next.set(TAB_PARAM, tab)
      next.delete(EDIT_PARAM)
      next.delete(UJAT_APPLICANT_ID_PARAM)
      if (lnb !== 'institution_applications') {
        next.delete(UJAT_INST_APP_ID_PARAM)
      } else if (tab !== activeTab) {
        /** 신청 기관 ↔ 임시 배정 기관 확인 등 서브탭 전환 시 상세 닫고 목록 */
        next.delete(UJAT_INST_APP_ID_PARAM)
      }
      if (lnb !== 'education_progress' || !isEducationProgressInstitutionsTab(tab)) {
        next.delete(UJAT_EDU_INST_ID_PARAM)
        next.delete(UJAT_EDU_INST_TAB_PARAM)
      }
      if (lnb !== 'education_progress' || !isUjatEducationProgressVolunteersTab(tab)) {
        next.delete(UJAT_EDU_VOL_ID_PARAM)
        next.delete(UJAT_EDU_VOL_TAB_PARAM)
      }
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams, activeTab]
  )

  const setEduInstitutionId = useCallback(
    (id: string | null) => {
      if (!programId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      if (id) {
        next.set(UJAT_EDU_INST_ID_PARAM, id)
        if (!next.get(UJAT_EDU_INST_TAB_PARAM)) {
          next.set(UJAT_EDU_INST_TAB_PARAM, 'application')
        }
      } else {
        next.delete(UJAT_EDU_INST_ID_PARAM)
        next.delete(UJAT_EDU_INST_TAB_PARAM)
      }
      next.delete(UJAT_EDU_VOL_ID_PARAM)
      next.delete(UJAT_EDU_VOL_TAB_PARAM)
      next.delete(UJAT_APPLICANT_ID_PARAM)
      next.delete(UJAT_INST_APP_ID_PARAM)
      next.delete(EDIT_PARAM)
      setSearchParams(next, { replace: id == null })
    },
    [programId, searchParams, setSearchParams]
  )

  const setEduVolunteerId = useCallback(
    (id: string | null) => {
      if (!programId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      if (id) {
        next.set(UJAT_EDU_VOL_ID_PARAM, id)
        if (!next.get(UJAT_EDU_VOL_TAB_PARAM)) {
          next.set(UJAT_EDU_VOL_TAB_PARAM, 'application')
        }
      } else {
        next.delete(UJAT_EDU_VOL_ID_PARAM)
        next.delete(UJAT_EDU_VOL_TAB_PARAM)
      }
      next.delete(UJAT_VOL_ADD_MEMBER_ID_PARAM)
      next.delete(UJAT_EDU_INST_ID_PARAM)
      next.delete(UJAT_EDU_INST_TAB_PARAM)
      next.delete(UJAT_APPLICANT_ID_PARAM)
      next.delete(UJAT_INST_APP_ID_PARAM)
      next.delete(EDIT_PARAM)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const setEduVolunteerDetailTab = useCallback(
    (tab: UjatEducationProgressVolunteerDetailTab) => {
      if (!programId || !eduVolunteerDetailId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      next.set(UJAT_EDU_VOL_TAB_PARAM, tab)
      setSearchParams(next, { replace: true })
    },
    [programId, eduVolunteerDetailId, searchParams, setSearchParams]
  )

  const setEduInstitutionDetailTab = useCallback(
    (tab: UjatEducationProgressInstitutionDetailTab) => {
      if (!programId || !eduInstitutionDetailId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      next.set(UJAT_EDU_INST_TAB_PARAM, tab)
      setSearchParams(next, { replace: true })
    },
    [programId, eduInstitutionDetailId, searchParams, setSearchParams]
  )

  const editTab = searchParams.get(EDIT_PARAM)
  const canEditInfo = useMemo(() => canUjatProgramInfoEdit(displayProgram), [displayProgram])
  const isEditModeInfo =
    open &&
    activeLnb === 'info' &&
    activeTab === 'info' &&
    editTab === 'info' &&
    !!displayProgram &&
    canEditInfo

  const infoForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInfo,
  })
  const { triggerSave: infoTriggerSave, resetToProgram: infoResetToProgram } =
    useProgramDetailInfoSave({
      form: infoForm,
      program: displayProgram ?? ({} as Program),
      onSaveEdit:
        displayProgram && updateProgram
          ? async draft => {
              try {
                const { id: _id, createdAt: _c, ...patch } = draft
                await updateProgram(draft.id, patch)
                const next = new URLSearchParams(searchParams)
                next.delete(EDIT_PARAM)
                if (programId) next.set('programId', programId)
                setSearchParams(next, { replace: true })
              } catch (error) {
                handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
              }
            }
          : undefined,
    })

  const setEditMode = useCallback(
    (tab: string | null) => {
      const next = new URLSearchParams(searchParams)
      if (tab) next.set(EDIT_PARAM, tab)
      else next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const handleInfoEdit = useCallback(() => {
    if (activeTab !== 'info' || !displayProgram) return
    if (!canUjatProgramInfoEdit(displayProgram)) {
      return
    }
    infoResetToProgram()
    setEditMode('info')
  }, [activeTab, displayProgram, infoResetToProgram, setEditMode])

  const handleInfoSave = useCallback(() => {
    setEditMode(null)
    if (displayProgram) void infoTriggerSave()
  }, [displayProgram, infoTriggerSave, setEditMode])

  const isEditModeRecruitParticipant =
    open &&
    activeRecruitTab === 'recruit_participant' &&
    editTab === 'recruit_participant' &&
    !!displayProgram &&
    canEditInfo

  const isEditModeRecruitVolunteer =
    open &&
    !!activeRecruitTab &&
    (activeRecruitTab === 'recruit_volunteer_h1' || activeRecruitTab === 'recruit_volunteer_h2') &&
    editTab === activeRecruitTab &&
    !!displayProgram &&
    canEditInfo

  const institutionsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeRecruitParticipant,
    schema: programDetailInstitutionsEditSchema,
  })
  const {
    triggerSave: institutionsTriggerSave,
    resetToProgram: institutionsResetToProgram,
    registerGetAdditionalContentHtml: registerInstitutionsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: institutionsForm,
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram && updateProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await updateProgram(draft.id, patch)
              const next = new URLSearchParams(searchParams)
              next.delete(EDIT_PARAM)
              if (programId) next.set('programId', programId)
              setSearchParams(next, { replace: true })
            } catch (error) {
              handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
            }
          }
        : undefined,
  })

  const volunteersForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeRecruitVolunteer,
  })
  const {
    triggerSave: volunteersTriggerSave,
    resetToProgram: volunteersResetToProgram,
    registerGetAdditionalContentHtml: registerVolunteersAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: volunteersForm,
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram && updateProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await updateProgram(draft.id, patch)
              const next = new URLSearchParams(searchParams)
              next.delete(EDIT_PARAM)
              if (programId) next.set('programId', programId)
              setSearchParams(next, { replace: true })
            } catch (error) {
              handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
            }
          }
        : undefined,
  })

  const isRecruitEditMode = isEditModeRecruitParticipant || isEditModeRecruitVolunteer

  const selectRecruitTab = useCallback(
    (tab: UjatRecruitTabKey) => {
      if (!programId) return
      const next = new URLSearchParams(searchParams)
      next.set('programId', programId)
      next.set(LNB_PARAM, 'info')
      next.set(TAB_PARAM, tab)
      next.delete(EDIT_PARAM)
      next.delete(UJAT_INST_APP_ID_PARAM)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  useEffect(() => {
    if (!open || !displayProgram || !editTab) return
    if (editTab === 'info' && !canUjatProgramInfoEdit(displayProgram)) {
      const next = new URLSearchParams(searchParams)
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    const recruitEditKeys = [
      'recruit_participant',
      'recruit_volunteer_h1',
      'recruit_volunteer_h2',
    ] as const
    if (
      (recruitEditKeys as readonly string[]).includes(editTab) &&
      !canUjatProgramInfoEdit(displayProgram)
    ) {
      const next = new URLSearchParams(searchParams)
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    }
  }, [open, editTab, displayProgram, programId, searchParams, setSearchParams])

  const handleRecruitmentEdit = useCallback(() => {
    if (!activeRecruitTab || !displayProgram) return
    if (!canUjatProgramInfoEdit(displayProgram)) {
      return
    }
    if (activeRecruitTab === 'recruit_participant') {
      institutionsResetToProgram()
    } else {
      volunteersResetToProgram()
    }
    setEditMode(activeRecruitTab)
  }, [
    activeRecruitTab,
    displayProgram,
    institutionsResetToProgram,
    volunteersResetToProgram,
    setEditMode,
  ])

  const handleRecruitmentSave = useCallback(() => {
    setEditMode(null)
    if (!activeRecruitTab) return
    if (activeRecruitTab === 'recruit_participant') {
      institutionsTriggerSave()
    } else {
      volunteersTriggerSave()
    }
  }, [activeRecruitTab, institutionsTriggerSave, volunteersTriggerSave, setEditMode])

  const volunteerApplicantCloseHandlerRef = useRef<(() => boolean) | null>(null)
  const registerVolunteerFromMemberRef = useRef<(memberId: string) => void>(() => {})
  const [volunteerApplicantDetailMeta, setVolunteerApplicantDetailMeta] =
    useState<UjatVolunteerApplicantDetailMeta | null>(null)

  useEffect(() => {
    if (!isUjatVolunteerApplicantDetailRoute(activeLnb, activeTab)) {
      setVolunteerApplicantDetailMeta(null)
    }
  }, [activeLnb, activeTab])

  const handleClose = useCallback(() => {
    onClose()
    const next = new URLSearchParams(searchParams)
    next.delete('programId')
    next.delete(LNB_PARAM)
    next.delete(TAB_PARAM)
    next.delete(EDIT_PARAM)
    next.delete(UJAT_INST_APP_ID_PARAM)
    next.delete(UJAT_APPLICANT_ID_PARAM)
    next.delete(UJAT_EDU_INST_ID_PARAM)
    next.delete(UJAT_EDU_INST_TAB_PARAM)
    next.delete(UJAT_VOL_ADD_MEMBER_ID_PARAM)
    next.delete(UJAT_EDU_VOL_ID_PARAM)
    next.delete(UJAT_EDU_VOL_TAB_PARAM)
    navigate(
      { pathname: location.pathname, search: next.toString() ? `?${next}` : '' },
      {
        replace: true,
      }
    )
  }, [location.pathname, navigate, onClose, searchParams])

  const volAddMemberId = open ? searchParams.get(UJAT_VOL_ADD_MEMBER_ID_PARAM) : null

  const handleOpenSurveyCreateModal = useCallback(() => {
    setSelectedSurveyTemplateId(null)
    setSubmittingSurveyTemplate(false)
    setSurveyCreateModalOpen(true)
  }, [])

  const handleCloseSurveyCreateModal = useCallback(() => {
    if (submittingSurveyTemplate) return
    setSurveyCreateModalOpen(false)
  }, [submittingSurveyTemplate])

  const handleSubmitSurveyTemplate = useCallback(async () => {
    if (selectedSurveyTemplateId == null || selectedSurveyTemplateId === '') return
    setSubmittingSurveyTemplate(true)
    try {
      const { newTemplateId } = await duplicateWritingTemplate({
        sourceTemplateId: selectedSurveyTemplateId,
        category: 'survey',
      })
      const next = findWritingTemplateRowByDefinitionId(newTemplateId)
      if (next != null) {
        const isFirstSurvey = registeredSurveys.length === 0
        const newSurvey: UjatRegisteredSurvey = {
          id: `ujat-survey-${Date.now()}`,
          title: `${next.templateName} ${registeredSurveys.length + 1 < 10 ? `0${registeredSurveys.length + 1}` : registeredSurveys.length + 1}`,
          templateId: next.id,
          status: isFirstSurvey ? 'in_progress' : 'finished',
          responseCount: UJAT_SURVEY_POLL_MOCK_RESPONSE_COUNT,
          participantTotal: isFirstSurvey ? 16 : UJAT_SURVEY_POLL_MOCK_RESPONSE_COUNT,
        }
        setRegisteredSurveys(prev => [...prev, newSurvey])
        setActiveRegisteredSurveyId(newSurvey.id)
      }
      setSurveyCreateModalOpen(false)
    } catch (error) {
      console.debug('ujat survey template create failed', error)
    } finally {
      setSubmittingSurveyTemplate(false)
    }
  }, [selectedSurveyTemplateId, registeredSurveys.length])

  const handleDeleteRegisteredSurvey = useCallback(() => {
    if (!activeRegisteredSurvey || activeRegisteredSurvey.status !== 'before_start') return
    setRegisteredSurveys(prev => {
      const next = prev.filter(item => item.id !== activeRegisteredSurvey.id)
      setActiveRegisteredSurveyId(current => {
        if (current !== activeRegisteredSurvey.id) return current
        return next[0]?.id ?? null
      })
      return next
    })
  }, [activeRegisteredSurvey])

  const handleOpenSurveyDeleteModal = useCallback(() => {
    if (!activeRegisteredSurvey || activeRegisteredSurvey.status !== 'before_start') return
    setSurveyDeleteConfirmWord('')
    setSurveyDeleteModalOpen(true)
  }, [activeRegisteredSurvey])

  const handleCloseSurveyDeleteModal = useCallback(() => {
    setSurveyDeleteModalOpen(false)
    setSurveyDeleteConfirmWord('')
  }, [])

  const handleConfirmSurveyDelete = useCallback(() => {
    if (surveyDeleteConfirmWord !== '삭제') return
    handleDeleteRegisteredSurvey()
    setSurveyDeleteModalOpen(false)
    setSurveyDeleteConfirmWord('')
  }, [surveyDeleteConfirmWord, handleDeleteRegisteredSurvey])

  const handleOpenRegisteredSurveyTemplatePreview = useCallback(() => {
    if (!activeRegisteredSurvey) return
    const row = findWritingTemplateRowByDefinitionId(activeRegisteredSurvey.templateId)
    if (!row) return
    const entry = lookupTemplateRegistry(row.id)
    if (entry == null || !isSurveyRegistryEntry(entry)) return

    openWritingUserPreview({
      draft: buildSurveyPreviewDraft(row.templateName),
      updateParagraph: () => {},
      headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
      editorKind: 'survey',
    })
  }, [activeRegisteredSurvey, openWritingUserPreview])

  const closeVolAddRegistration = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete(UJAT_VOL_ADD_MEMBER_ID_PARAM)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [programId, searchParams, setSearchParams])

  const openVolAddRegistration = useCallback(
    (memberId: string) => {
      const next = new URLSearchParams(searchParams)
      if (programId) next.set('programId', programId)
      next.set(LNB_PARAM, 'education_progress')
      const halfTab = activeTab.startsWith('edu_h2') ? 'edu_h2_volunteers' : 'edu_h1_volunteers'
      next.set(TAB_PARAM, halfTab)
      next.set(UJAT_VOL_ADD_MEMBER_ID_PARAM, memberId)
      next.delete(UJAT_INST_APP_ID_PARAM)
      next.delete(UJAT_APPLICANT_ID_PARAM)
      next.delete(UJAT_EDU_INST_ID_PARAM)
      next.delete(UJAT_EDU_INST_TAB_PARAM)
      next.delete(UJAT_EDU_VOL_ID_PARAM)
      next.delete(UJAT_EDU_VOL_TAB_PARAM)
      setSearchParams(next, { replace: true })
    },
    [activeTab, programId, searchParams, setSearchParams]
  )

  const handleCompleteVolAddRegistration = useCallback(
    (memberId: string) => {
      registerVolunteerFromMemberRef.current(memberId)
      closeVolAddRegistration()
    },
    [closeVolAddRegistration]
  )

  const handleHeaderCloseClick = useCallback(() => {
    if (volAddMemberId) {
      closeVolAddRegistration()
      return
    }
    if (institutionDetailId) {
      setInstitutionApplicationId(null)
      return
    }
    if (eduInstitutionDetailId) {
      setEduInstitutionId(null)
      return
    }
    if (eduVolunteerDetailId) {
      setEduVolunteerId(null)
      return
    }
    if (
      isUjatVolunteerApplicantDetailRoute(activeLnb, activeTab) &&
      volunteerApplicantCloseHandlerRef.current?.()
    ) {
      return
    }
    handleClose()
  }, [
    institutionDetailId,
    setInstitutionApplicationId,
    eduInstitutionDetailId,
    setEduInstitutionId,
    eduVolunteerDetailId,
    setEduVolunteerId,
    activeLnb,
    activeTab,
    volAddMemberId,
    closeVolAddRegistration,
    handleClose,
  ])

  if (!open) return null

  const programTitle = displayProgram?.title ?? '프로그램 상세'
  const title =
    volAddMemberId
      ? '봉사자 추가 등록'
      : eduVolunteerDetailMeta?.title ??
        volunteerApplicantDetailMeta?.title ??
        (eduInstitutionDetailName
          ? `참여 기관 신청 상세 (${eduInstitutionDetailName})`
          : institutionDetailName
            ? `${institutionDetailTitlePrefix} (${institutionDetailName})`
            : programTitle)

  const headerBreadcrumbItems = (() => {
    const listParams = buildSearchParams(searchParams, {
      delete: UJAT_DETAIL_QUERY_PARAMS,
    })
    const items = [makeBreadcrumbItem('프로그램 목록', location.pathname, listParams)]

    if (!displayProgram) return items

    const programParams = buildSearchParams(searchParams, {
      delete: UJAT_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: 'info',
        [TAB_PARAM]: 'info',
      },
    })

    const nestedDetailLabel =
      volAddMemberId
        ? '봉사자 추가 등록'
        : volunteerApplicantDetailMeta?.breadcrumbLabel
          ? volunteerApplicantDetailMeta.breadcrumbLabel
          : eduVolunteerDetailMeta?.breadcrumbLabel
            ? eduVolunteerDetailMeta.breadcrumbLabel
            : eduInstitutionDetailName
            ? eduInstitutionDetailName
            : institutionDetailName
              ? institutionDetailName
              : null

    const lnbLabel = ujatLnbBreadcrumbLabel(activeLnb, activeTab)
    const childLabel = ujatChildBreadcrumbLabel(activeLnb, activeTab, surveyItems)
    const lnbTab = ujatLnbBreadcrumbTargetTab(
      activeLnb,
      activeTab,
      interviewEnabled,
      surveyKeys
    )
    const lnbParams = buildSearchParams(searchParams, {
      delete: [...UJAT_NESTED_DETAIL_QUERY_PARAMS, EDIT_PARAM],
      set: {
        programId,
        [LNB_PARAM]: activeLnb,
        [TAB_PARAM]: lnbTab,
      },
    })
    const childParams = childLabel
      ? buildSearchParams(searchParams, {
          delete: [...UJAT_NESTED_DETAIL_QUERY_PARAMS, EDIT_PARAM],
          set: {
            programId,
            [LNB_PARAM]: activeLnb,
            [TAB_PARAM]: activeTab,
          },
        })
      : null

    items.push(makeBreadcrumbItem(displayProgram.title, location.pathname, programParams))

    if (!childLabel) {
      items.push(
        nestedDetailLabel
          ? makeBreadcrumbItem(lnbLabel, location.pathname, lnbParams)
          : { label: lnbLabel }
      )
    } else {
      items.push(
        nestedDetailLabel && childParams
          ? makeBreadcrumbItem(childLabel, location.pathname, childParams)
          : { label: childLabel }
      )
    }

    if (nestedDetailLabel) items.push({ label: nestedDetailLabel })
    return items
  })()

  return (
    <DetailFullPageModal
      open={open}
      onClose={handleClose}
      onHeaderClose={handleHeaderCloseClick}
      title={title}
      headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
      closeAriaLabel={
        volAddMemberId ||
        institutionDetailId ||
        eduInstitutionDetailId ||
        eduVolunteerDetailId
          ? '목록으로'
          : '닫기'
      }
      className="program-detail-fullpage-modal ujat-program-detail-fullpage-modal"
      sidebar={
        programId ? (
          <UjatProgramDetailSidebar
            activeLnb={activeLnb}
            activeTab={activeTab}
            interviewEnabled={interviewEnabled}
            surveyItems={surveyItems}
            onSelectChildTab={setLnbTab}
          />
        ) : null
      }
    >
      {loading && !displayProgram ? (
        <div className="detail-fullpage-modal__loading">
          <Spin size="large" />
        </div>
      ) : displayProgram ? (
        <>
          {activeLnb === 'info' && activeTab === 'info' && (
            <>
              {(canEditInfo || isEditModeInfo) && (
                <div className="ujat-detail-modal__info-header">
                  <div className="program-detail-fullpage-modal__header-actions">
                    <CmsButton onClick={isEditModeInfo ? handleInfoSave : handleInfoEdit}>
                      {isEditModeInfo ? '정보 저장' : '정보 수정'}
                    </CmsButton>
                  </div>
                </div>
              )}
              {isEditModeInfo ? (
                <ProjectInfoDetailPanels
                  program={displayProgram}
                  sponsorName={sponsorName}
                  isBodyLoading={loading && !displayProgram}
                  hideTabsRow
                  activeTab="info"
                  onSelectTab={() => undefined}
                  isEditModeInfo
                  infoForm={infoForm}
                  isEditModeInstitutions={false}
                  institutionsForm={undefined}
                  registerInstitutionsAdditionalHtml={() => {}}
                  isEditModeInstructors={false}
                  instructorsForm={undefined}
                  registerInstructorsAdditionalHtml={() => {}}
                  isEditModeVolunteers={false}
                  volunteersForm={undefined}
                  registerVolunteersAdditionalHtml={() => {}}
                  onInfoEdit={handleInfoEdit}
                  onInfoSave={handleInfoSave}
                  onInstitutionsSave={() => undefined}
                  onInstructorsSave={() => undefined}
                  onVolunteersSave={() => undefined}
                  onPreview={() => undefined}
                />
              ) : (
                <UjatProgramDetailCommonInfoView
                  program={displayProgram}
                  sponsorName={sponsorName}
                  sponsorHomepageUrl={sponsorHomepageUrl}
                />
              )}
            </>
          )}

          {activeLnb === 'info' && activeRecruitTab && (
            <div className="program-detail-fullpage-modal__info-tab ujat-detail-modal__recruitment-body">
              <UjatProgramRecruitmentTabsRow
                activeTab={activeRecruitTab}
                onSelectTab={selectRecruitTab}
                canEdit={canEditInfo}
                isEditMode={isRecruitEditMode}
                onEdit={handleRecruitmentEdit}
                onSave={handleRecruitmentSave}
              />
              <UjatProgramRecruitmentPanels
                program={displayProgram}
                sponsorName={sponsorName}
                activeRecruitTab={activeRecruitTab}
                isEditMode={isRecruitEditMode}
                institutionsForm={isEditModeRecruitParticipant ? institutionsForm : undefined}
                volunteersForm={isEditModeRecruitVolunteer ? volunteersForm : undefined}
                registerInstitutionsAdditionalHtml={registerInstitutionsAdditionalHtml}
                registerVolunteersAdditionalHtml={registerVolunteersAdditionalHtml}
              />
            </div>
          )}

          {activeLnb === 'institution_applications' &&
            activeTab === 'inst_all' &&
            (institutionDetailId ? (
              <UjatInstitutionApplicationDetailPage
                institutionId={institutionDetailId}
                onBack={() => setInstitutionApplicationId(null)}
                onStatusUpdated={() => setInstitutionListVersion(v => v + 1)}
              />
            ) : (
              <UjatInstitutionApplicationList
                key={institutionListVersion}
                onOpenDetail={row => setInstitutionApplicationId(row.id)}
              />
            ))}
          {activeLnb === 'institution_applications' && activeTab === 'inst_schedule_assign' && (
            <UjatInstitutionScheduleAssignPage />
          )}
          {activeLnb === 'institution_applications' && activeTab === 'inst_schedule_confirm' && (
            institutionDetailId ? (
              <UjatInstitutionScheduleConfirmDetailPage
                institutionId={institutionDetailId}
                onBack={() => setInstitutionApplicationId(null)}
                onStatusUpdated={() => setInstitutionListVersion(v => v + 1)}
              />
            ) : (
              <UjatInstitutionScheduleConfirmList
                onOpenDetail={row => setInstitutionApplicationId(row.id)}
              />
            )
          )}

          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            (activeTab === 'vh1_doc1' || activeTab === 'vh2_doc1') && (
              <UjatVolunteerDocScreeningSection
                programId={displayProgram.id}
                half={activeTab.startsWith('vh2') ? 'h2' : 'h1'}
                onRegisterApplicantCloseHandler={fn => {
                  volunteerApplicantCloseHandlerRef.current = fn
                }}
                onVolunteerApplicantDetailMetaChange={setVolunteerApplicantDetailMeta}
              />
            )}
          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            (activeTab === 'vh1_doc_passed' || activeTab === 'vh2_doc_passed') && (
              <UjatVolunteerDocPassedSection
                programId={displayProgram.id}
                half={activeTab.startsWith('vh2') ? 'h2' : 'h1'}
                onRegisterApplicantCloseHandler={fn => {
                  volunteerApplicantCloseHandlerRef.current = fn
                }}
                onVolunteerApplicantDetailMetaChange={setVolunteerApplicantDetailMeta}
              />
            )}
          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            (activeTab === 'vh1_interview2' || activeTab === 'vh2_interview2') && (
              <UjatVolunteerInterview2Section
                programId={displayProgram.id}
                half={activeTab.startsWith('vh2') ? 'h2' : 'h1'}
                onRegisterApplicantCloseHandler={fn => {
                  volunteerApplicantCloseHandlerRef.current = fn
                }}
                onVolunteerApplicantDetailMetaChange={setVolunteerApplicantDetailMeta}
              />
            )}
          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            activeTab !== 'vh1_doc1' &&
            activeTab !== 'vh2_doc1' &&
            activeTab !== 'vh1_doc_passed' &&
            activeTab !== 'vh2_doc_passed' &&
            activeTab !== 'vh1_interview2' &&
            activeTab !== 'vh2_interview2' && (
              <UjatPlaceholderSection
                title={volunteerScreenTitle(activeTab)}
                description="봉사자 신청·심사·면접 일정 배정 화면(상·하반기 동일 프로세스)입니다. 목 데이터 연동 후 테이블이 표시됩니다."
              />
            )}

          {activeLnb === 'education_progress' && /^edu_h[12]_institutions$/.test(activeTab) && (
            <div className="program-detail-fullpage-modal__info-tab">
              {eduInstitutionDetailId && eduInstitutionHalf ? (
                <UjatEducationProgressInstitutionDetailPage
                  program={displayProgram}
                  institutionId={eduInstitutionDetailId}
                  half={eduInstitutionHalf}
                  activeTab={eduInstitutionDetailTab}
                  onSelectTab={setEduInstitutionDetailTab}
                />
              ) : (
                <UjatEducationProgressInstitutionsSection
                  programId={displayProgram.id}
                  half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
                  onOpenDetail={setEduInstitutionId}
                />
              )}
            </div>
          )}
          {activeLnb === 'education_progress' && /^edu_h[12]_volunteers$/.test(activeTab) && (
            <div className="program-detail-fullpage-modal__info-tab">
              {volAddMemberId ? (
                <UjatEducationProgressVolunteerAddRegistrationView
                  memberId={volAddMemberId}
                  onClose={closeVolAddRegistration}
                  onComplete={handleCompleteVolAddRegistration}
                />
              ) : eduVolunteerDetailId && eduVolunteerHalf && displayProgram ? (
                <UjatEducationProgressVolunteerDetailPage
                  programId={displayProgram.id}
                  half={eduVolunteerHalf}
                  volunteerId={eduVolunteerDetailId}
                  activeTab={eduVolunteerDetailTab}
                  onSelectTab={setEduVolunteerDetailTab}
                />
              ) : (
                <UjatEducationProgressVolunteersSection
                  half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
                  onStartAddRegistration={openVolAddRegistration}
                  onOpenDetail={setEduVolunteerId}
                  onBindRegisterVolunteer={register => {
                    registerVolunteerFromMemberRef.current = register
                  }}
                />
              )}
            </div>
          )}
          {activeLnb === 'education_progress' && /^edu_h[12]_attendance$/.test(activeTab) && (
            <div className="program-detail-fullpage-modal__info-tab">
              <UjatEducationProgressAttendanceSection
                half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
              />
            </div>
          )}
          {activeLnb === 'education_progress' && /^edu_h[12]_assignments$/.test(activeTab) && (
            <div className="program-detail-fullpage-modal__info-tab">
              <UjatEducationProgressAssignmentsSection
                half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
              />
            </div>
          )}
          {activeLnb === 'education_progress' && /^edu_h[12]_region$/.test(activeTab) && (
            <div className="program-detail-fullpage-modal__info-tab">
              <UjatEducationProgressRegionAssignmentSection
                half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
              />
            </div>
          )}
          {activeLnb === 'education_progress' && activeTab === 'edu_summary' && (
            <div className="program-detail-fullpage-modal__info-tab">
              <UjatEducationProgressSummarySection />
            </div>
          )}

          {activeLnb === 'survey' &&
            (activeTab === 'survey-poll' ? (
              registeredSurveys.length === 0 ? (
                <UjatSurveyPollEmptyState onRegisterClick={handleOpenSurveyCreateModal} />
              ) : (
                <div className="program-detail-fullpage-modal__info-tab ujat-survey-registered">
                  <CmsTextTabs
                    className="ujat-survey-registered__tabs"
                    variant="list"
                    activeKey={activeRegisteredSurveyId ?? ''}
                    onChange={setActiveRegisteredSurveyId}
                    items={registeredSurveys.map(item => ({ key: item.id, label: item.title }))}
                    trailing={
                      activeRegisteredSurvey != null ? (
                        <UjatSurveyRegisteredActions
                          survey={activeRegisteredSurvey}
                          onShareClick={() => undefined}
                          onAddClick={handleOpenSurveyCreateModal}
                          onOpenTemplatePreview={handleOpenRegisteredSurveyTemplatePreview}
                          onDownloadClick={() => undefined}
                        />
                      ) : null
                    }
                  />
                  {activeRegisteredSurvey != null && activeRegisteredSurvey.responseCount === 0 ? (
                    <UjatSurveyNoResponseState
                      canDelete={activeRegisteredSurvey.status === 'before_start'}
                      onDeleteClick={handleOpenSurveyDeleteModal}
                      onOpenTemplatePreview={handleOpenRegisteredSurveyTemplatePreview}
                    />
                  ) : activeRegisteredSurvey != null ? (
                    <UjatSurveyPollResultsView
                      templateId={activeRegisteredSurvey.templateId}
                      responseCount={activeRegisteredSurvey.responseCount}
                      participantTotal={activeRegisteredSurvey.participantTotal}
                    />
                  ) : null}
                </div>
              )
            ) : (
              <UjatPlaceholderSection
                title={surveyItems.find(s => s.key === activeTab)?.label ?? '설문'}
                description="설문 관리 화면입니다. 목 데이터 연동 후 설문 항목별 콘텐츠가 표시됩니다."
              />
            ))}

          {activeLnb === 'managers' && (
            <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
              <ProgramManagersTab programId={displayProgram.id} />
            </div>
          )}
        </>
      ) : (
        <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
      )}
      <ContentModal
        open={surveyCreateModalOpen}
        onCancel={handleCloseSurveyCreateModal}
        title="신규 설문조사 등록"
        width={600}
        className="ujat-survey-create-modal"
        description={
          '새로운 설문조사를 진행하시겠습니까?\n설문조사 신규 등록을 위해 사용할 템플릿 유형을 선택해 주세요.'
        }
        footer={
          <div className="ujat-survey-create-modal__footer">
            <CmsButton
              variant="secondary"
              size="medium"
              width={120}
              type="button"
              onClick={handleCloseSurveyCreateModal}
              disabled={submittingSurveyTemplate}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              width={120}
              type="button"
              onClick={() => {
                void handleSubmitSurveyTemplate()
              }}
              disabled={selectedSurveyTemplateId == null || selectedSurveyTemplateId === ''}
              loading={submittingSurveyTemplate}
            >
              신규 등록
            </CmsButton>
          </div>
        }
      >
        <div className="ujat-survey-create-modal__field">
          <p className="ujat-survey-create-modal__label">템플릿 유형</p>
          <CmsSelect
            width="100%"
            withAllOption={false}
            placeholder="사용할 설문 양식을 선택해 주세요"
            options={surveyTemplateOptions}
            value={selectedSurveyTemplateId ?? undefined}
            onChange={value => setSelectedSurveyTemplateId(value ?? null)}
          />
        </div>
      </ContentModal>
      <ContentModal
        open={surveyDeleteModalOpen}
        onCancel={handleCloseSurveyDeleteModal}
        title="설문조사 삭제 안내"
        width={600}
        modalStyles={{
          content: { minHeight: 310 },
        }}
        className="ujat-survey-delete-modal"
        description={`**[${activeRegisteredSurvey?.title ?? '설문조사'}]** 설문조사를 삭제하시겠습니까?\n삭제 시 해당 양식의 내용은 모두 삭제됩니다.\n삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?`}
        footer={
          <div className="ujat-survey-delete-modal__footer">
            <CmsButton
              variant="secondary"
              size="large"
              width={140}
              type="button"
              onClick={handleCloseSurveyDeleteModal}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="large"
              width={160}
              type="button"
              disabled={surveyDeleteConfirmWord.trim() !== '삭제'}
              onClick={handleConfirmSurveyDelete}
            >
              설문 삭제
            </CmsButton>
          </div>
        }
      >
        <div className="ujat-survey-delete-modal__field">
          <CmsInput
            width="100%"
            placeholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요."
            value={surveyDeleteConfirmWord}
            onChange={e => setSurveyDeleteConfirmWord(e.target.value)}
          />
        </div>
      </ContentModal>
    </DetailFullPageModal>
  )
}
