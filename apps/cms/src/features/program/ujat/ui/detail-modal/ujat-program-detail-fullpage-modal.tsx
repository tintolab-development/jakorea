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
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '@/features/program/general/hooks/use-program-detail-info-save'
import { handleError } from '@/shared/utils/error-handler'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { normalizeWritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { createUjatProgramRegistrationDraft } from '@/features/template/model/ujat-program-registration-draft'
import { applyUjatRegistrationOverlayToProgram } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import {
  readUjatRegistrationBasicInfoOverlayForSave,
  seedUjatRegistrationBasicInfoOverlayFromProgram,
  touchUjatRegistrationOperationAnchorFromRangeSeal,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-overlay-sync'
import { persistUjatRegistrationTemplateSave } from '@/features/program/ujat/lib/ujat-registration-template-local-save'
import { ProgramManagersTab } from '@/features/program/general/ui/detail-modal/managers/program-managers-tab'
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
import { isUjatVolunteerApplicantInTabList } from './application-volunteer/screening/applicant/detail-url'
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
import { resolveUjatProgramDisplayProgram } from '@/features/program/ujat/lib/ujat-program-display-program'
import { UjatProgramDetailSidebar } from './ujat-program-detail-sidebar'
import { ProgramDetailSponsorDetailOverlay } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-detail-overlay'
import { clearSponsorDetailQueryStack } from '@/features/sponsor/lib/sponsor-detail-query-stack'
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
  UJAT_INSTITUTION_APPLICATIONS_LNB_LABEL,
} from './application-institution/tabs'
import { programDetailInstitutionsEditSchema } from '@/features/program/shared/model/program-detail-edit-schema'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  isUjatRecruitTab,
  normalizeUjatRecruitTab,
  type UjatRecruitTabKey,
} from './info/ujat-program-detail-recruitment-tabs'
import { UjatProgramRecruitmentPanels } from './info/ujat-program-recruitment-panels'
import { UjatProgramRecruitmentTabsRow } from './info/ujat-program-recruitment-tabs-row'
import { DocScreeningSection } from './application-volunteer/screening/doc-screening/section'
import { DocPassedSection } from './application-volunteer/screening/doc-passed/section'
import { Interview2Section } from './application-volunteer/screening/interview2/section'
import type { ApplicantDetailMeta } from './application-volunteer/screening/applicant/use-detail'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsInput } from '@/shared/ui/cms-input'
import { duplicateWritingTemplate } from '@/features/template/api/duplicate-writing-template'
import {
  findWritingTemplateRowByDefinitionId,
} from '@/features/template/lib/writing-template-create-helpers'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  UJAT_SURVEY_POLL_MOCK_RESPONSE_COUNT,
  UJAT_SURVEY_POLL_RESPONSES_MOCK,
} from '@/data/mock/ujat-survey-poll-responses-mock'
import { useClipboard } from '@/features/template/hooks/use-clipboard'
import {
  getSatisfactionAudienceLabel,
  getSatisfactionDeleteModalSubject,
  UJAT_SATISFACTION_TEMPLATE_BY_AUDIENCE,
  type UjatRegisteredSurvey,
  type UjatSatisfactionAudienceKey,
  type UjatSatisfactionSurveyByAudience,
} from './survey-management/lib/ujat-satisfaction-survey'
import {
  UJAT_SURVEY_POLL_ACTION_LABELS,
  UJAT_SURVEY_POLL_EMPTY_COPY,
  UJAT_SURVEY_POLL_NO_RESPONSE_COPY,
  UJAT_SURVEY_POLL_DOWNLOAD_MODAL_COPY,
  UJAT_SURVEY_POLL_SHARE_TOAST_COPY,
  UJAT_SATISFACTION_DOWNLOAD_MODAL_COPY,
  UJAT_SATISFACTION_SHARE_TOAST_COPY,
  UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY,
  UJAT_LECTURE_EVAL_DOWNLOAD_MODAL_COPY,
  UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY,
} from './survey-management/lib/ujat-survey-copy'
import type { UjatSurveyPollRawResponse } from '@/data/mock/ujat-survey-poll-responses-mock'
import {
  buildLectureEvalFormDraft,
  canEditLectureEvalResponse,
  draftToLectureEvalPollResponse,
  UJAT_LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT,
  UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
  UJAT_LECTURE_EVAL_TEMPLATE_ID,
  validateLectureEvalFormDraft,
  type UjatLectureEvalTabKey,
} from './survey-management/lib/ujat-lecture-eval-survey'
import {
  buildLectureEvalResultsPdfFileName,
  exportLectureEvalResultsPdf,
} from './survey-management/lib/export-lecture-eval-results-pdf'
import { exportSurveyResultsExcel } from '@/features/program/shared/lib/survey-management/export-survey-results-excel'
import {
  SurveyResultsDownloadModal,
  type SurveyResultsDownloadFormat,
} from '@/features/program/shared/ui/survey-management/survey-results-download-modal'
import { getSurveyWritingTemplateSelectOptions } from './survey-management/lib/ujat-survey-template-options'
import {
  buildUjatSurveyWritingPreviewSession,
} from './survey-management/lib/open-ujat-survey-writing-preview'
import { UjatSurveyTemplateEditModal } from './survey-management/ui/ujat-survey-template-edit-modal'
import { UjatSatisfactionSurveyView } from './survey-management/ui/ujat-satisfaction-survey-view'
import { UjatLectureEvalSurveyView } from './survey-management/ui/ujat-lecture-eval-survey-view'
import { UjatSurveyEmptyState } from './survey-management/ui/ujat-survey-empty-state'
import { UjatSurveyNoResponseState } from './survey-management/ui/ujat-survey-no-response-state'
import { UjatSurveyPollResultsView } from './survey-management/ui/ujat-survey-poll-results-view'
import { UjatSurveyRegisteredActions } from './survey-management/ui/ujat-survey-registered-actions'
import { SurveyShareCopyToast } from '@/features/program/shared/ui/survey-management/survey-share-copy-toast'
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

const UJAT_REGISTERED_SURVEY_MOCK: UjatRegisteredSurvey[] = []

const UJAT_SATISFACTION_SURVEY_MOCK: UjatSatisfactionSurveyByAudience = {}

const UJAT_LECTURE_EVAL_SURVEY_MOCK: UjatRegisteredSurvey | null = null

function buildUjatSatisfactionResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '만족도조사'
  return `${safeProgram}_${safeSurvey}_만족도조사결과.pdf`
}

function buildUjatSurveyPollResultsPdfFileName(programTitle: string, surveyTitle: string): string {
  const safeProgram = programTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '프로그램'
  const safeSurvey = surveyTitle.trim().replace(/[\\/:*?"<>|]/g, '_') || '설문조사'
  return `${safeProgram}_${safeSurvey}_설문조사결과.pdf`
}

export interface UjatProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  /** 목록에서 선택된 프로그램(로딩 전 null 가능) */
  program: Program | null
  /** URL의 programId — 목록에 아직 없을 때 상세 fetch용 */
  programIdHint?: string | null
  externalLoading?: boolean
  /** remote detail 실패 (로딩 종료·데이터 없음) */
  externalError?: boolean
  /** 유형별 API 계층을 사용하는 호출부의 상세 저장 핸들러 */
  onUpdateProgram?: (
    programId: string,
    program: Program,
    patch: Partial<Program>
  ) => Promise<Program>
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
    if (surveyKeys.length === 0) {
      setInvalid('info', 'info')
    } else {
      tab = UJAT_SURVEY_LEGACY_TAB_MAP[tab] ?? tab
      if (!surveyKeys.includes(tab)) {
        setInvalid('survey', surveyKeys[0]!)
      }
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
      return UJAT_INSTITUTION_APPLICATIONS_LNB_LABEL
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
    if (tab.endsWith('_all')) return null
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
    (tab === 'vh1_all' ||
      tab === 'vh2_all' ||
      tab === 'vh1_doc1' ||
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

export function UjatProgramDetailFullPageModal({
  open,
  onClose,
  program,
  programIdHint = null,
  externalLoading = false,
  externalError = false,
  onUpdateProgram,
}: UjatProgramDetailFullPageModalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id ?? programIdHint ?? undefined

  const {
    program: detailProgram,
    loading: legacyLoading,
    sponsorName: legacySponsorName,
    updateProgram,
  } = useProgramDetail(onUpdateProgram ? undefined : (open ? programId : undefined))
  const externalSponsorName = useSponsorNameById(
    program?.sponsorId,
    Boolean(onUpdateProgram && program?.sponsorId)
  )
  const loading = onUpdateProgram ? externalLoading : legacyLoading
  const sponsorName = onUpdateProgram ? externalSponsorName : legacySponsorName

  const displayProgram = useMemo(() => {
    const base = program ?? detailProgram ?? null
    return base ? resolveUjatProgramDisplayProgram(base) : null
  }, [detailProgram, program])

  const interviewEnabled = displayProgram ? getUjatVolunteerInterviewEnabled(displayProgram) : true
  const surveyItems = useMemo(
    () => (displayProgram ? getUjatSurveyMenuItemsForProgram(displayProgram) : []),
    [displayProgram]
  )
  const surveyKeys = useMemo(() => surveyItems.map(s => s.key), [surveyItems])
  const [institutionListVersion, setInstitutionListVersion] = useState(0)
  const [surveyCreateModalOpen, setSurveyCreateModalOpen] = useState(false)
  const [selectedSurveyTemplateId, setSelectedSurveyTemplateId] = useState<string | null>(null)
  const [submittingSurveyTemplate, setSubmittingSurveyTemplate] = useState(false)
  const [surveyDeleteModalOpen, setSurveyDeleteModalOpen] = useState(false)
  const [surveyDeleteConfirmWord, setSurveyDeleteConfirmWord] = useState('')
  const [pollDownloadModalOpen, setPollDownloadModalOpen] = useState(false)
  const [downloadingPollResults, setDownloadingPollResults] = useState(false)
  const pollResultsExportRef = useRef<HTMLDivElement>(null)
  const [registeredSurveys, setRegisteredSurveys] = useState<UjatRegisteredSurvey[]>(
    UJAT_REGISTERED_SURVEY_MOCK
  )
  const [activeRegisteredSurveyId, setActiveRegisteredSurveyId] = useState<string | null>(
    UJAT_REGISTERED_SURVEY_MOCK[0]?.id ?? null
  )
  const [satisfactionSurveysByAudience, setSatisfactionSurveysByAudience] =
    useState<UjatSatisfactionSurveyByAudience>(UJAT_SATISFACTION_SURVEY_MOCK)
  const [activeSatisfactionAudience, setActiveSatisfactionAudience] =
    useState<UjatSatisfactionAudienceKey>('teacher')
  const [satisfactionCreateModalOpen, setSatisfactionCreateModalOpen] = useState(false)
  const [submittingSatisfactionSurvey, setSubmittingSatisfactionSurvey] = useState(false)
  const [satisfactionDeleteModalOpen, setSatisfactionDeleteModalOpen] = useState(false)
  const [satisfactionDeleteConfirmWord, setSatisfactionDeleteConfirmWord] = useState('')
  const [satisfactionDownloadModalOpen, setSatisfactionDownloadModalOpen] = useState(false)
  const [downloadingSatisfactionResults, setDownloadingSatisfactionResults] = useState(false)
  const [shareToastOpen, setShareToastOpen] = useState(false)
  const [shareToastLines, setShareToastLines] = useState<{ line1: string; line2: string }>(
    UJAT_SATISFACTION_SHARE_TOAST_COPY
  )
  const shareToastTimerRef = useRef<number | null>(null)
  const satisfactionResultsExportRef = useRef<HTMLDivElement>(null)
  const [surveyTemplateEditOpen, setSurveyTemplateEditOpen] = useState(false)
  const [surveyTemplateEditId, setSurveyTemplateEditId] = useState<string | null>(null)
  const [selectedSatisfactionTemplateId, setSelectedSatisfactionTemplateId] = useState<string | null>(
    null
  )
  const [lectureEvalSurvey, setLectureEvalSurvey] = useState<UjatRegisteredSurvey | null>(
    UJAT_LECTURE_EVAL_SURVEY_MOCK
  )
  const [lectureEvalSubmitted, setLectureEvalSubmitted] = useState(false)
  const [lectureEvalFormDraft, setLectureEvalFormDraft] = useState<WritingFormDraft | null>(null)
  const [lectureEvalResponses, setLectureEvalResponses] = useState<UjatSurveyPollRawResponse[]>([])
  const [activeLectureEvalTab, setActiveLectureEvalTab] = useState<UjatLectureEvalTabKey>('eval')
  const [lectureEvalCreateModalOpen, setLectureEvalCreateModalOpen] = useState(false)
  const [lectureEvalIncompleteModalOpen, setLectureEvalIncompleteModalOpen] = useState(false)
  const [selectedLectureEvalTemplateId, setSelectedLectureEvalTemplateId] = useState<string | null>(
    null
  )
  const [submittingLectureEvalSurvey, setSubmittingLectureEvalSurvey] = useState(false)
  const [downloadingLectureEvalResults, setDownloadingLectureEvalResults] = useState(false)
  const [lectureEvalDownloadModalOpen, setLectureEvalDownloadModalOpen] = useState(false)
  const lectureEvalResultsExportRef = useRef<HTMLDivElement>(null)
  const { openWritingUserPreview, closeWritingUserPreview } = useTemplateWritingPreview()
  const { copyText } = useClipboard()
  const { showAlert } = useCmsAlert()

  const openUjatSurveyTemplatePreview = useCallback(
    (templateId: string, options?: { allowEdit?: boolean }) => {
      const allowEdit = options?.allowEdit ?? true
      const onEditForm = allowEdit
        ? () => {
            closeWritingUserPreview()
            setSurveyTemplateEditId(templateId)
            setSurveyTemplateEditOpen(true)
          }
        : undefined
      const session = buildUjatSurveyWritingPreviewSession(templateId, onEditForm)
      if (session == null) return
      openWritingUserPreview(session)
    },
    [closeWritingUserPreview, openWritingUserPreview]
  )

  const showShareCopyToast = useCallback(
    (lines: { line1: string; line2: string } = UJAT_SATISFACTION_SHARE_TOAST_COPY) => {
      setShareToastLines(lines)
      setShareToastOpen(true)
      if (shareToastTimerRef.current != null) {
        window.clearTimeout(shareToastTimerRef.current)
      }
      shareToastTimerRef.current = window.setTimeout(() => {
        setShareToastOpen(false)
        shareToastTimerRef.current = null
      }, 4000)
    },
    []
  )

  const handleCloseSurveyTemplateEdit = useCallback(() => {
    setSurveyTemplateEditOpen(false)
    setSurveyTemplateEditId(null)
  }, [])

  const surveyTemplateOptions = useMemo(() => getSurveyWritingTemplateSelectOptions(), [])
  const activeRegisteredSurvey = useMemo(
    () => registeredSurveys.find(item => item.id === activeRegisteredSurveyId) ?? null,
    [registeredSurveys, activeRegisteredSurveyId]
  )
  const pollResponses = useMemo(() => {
    if (activeRegisteredSurvey == null) return []
    return UJAT_SURVEY_POLL_RESPONSES_MOCK.slice(0, activeRegisteredSurvey.responseCount)
  }, [activeRegisteredSurvey])
  const activeSatisfactionSurvey = useMemo(
    () => satisfactionSurveysByAudience[activeSatisfactionAudience] ?? null,
    [satisfactionSurveysByAudience, activeSatisfactionAudience]
  )
  const satisfactionResponses = useMemo(() => {
    if (activeSatisfactionSurvey == null) return []
    return UJAT_SURVEY_POLL_RESPONSES_MOCK.slice(0, activeSatisfactionSurvey.responseCount)
  }, [activeSatisfactionSurvey])

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
                if (onUpdateProgram) {
                  await onUpdateProgram(draft.id, draft, patch)
                } else {
                  await updateProgram(draft.id, patch)
                }
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
    seedUjatRegistrationBasicInfoOverlayFromProgram(displayProgram)
    infoResetToProgram()
    setEditMode('info')
  }, [activeTab, displayProgram, infoResetToProgram, setEditMode])

  const handleInfoSave = useCallback(() => {
    if (displayProgram) {
      const overlay = touchUjatRegistrationOperationAnchorFromRangeSeal(
        readUjatRegistrationBasicInfoOverlayForSave()
      )
      const mergedProgram = applyUjatRegistrationOverlayToProgram(displayProgram, overlay)
      infoForm.reset(programToDetailEditValues(mergedProgram))
      persistUjatRegistrationTemplateSave({
        draft: normalizeWritingFormDraft(createUjatProgramRegistrationDraft()),
        overlay,
      })
    }
    setEditMode(null)
    if (displayProgram) void infoTriggerSave()
  }, [displayProgram, infoForm, infoTriggerSave, setEditMode])

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
                if (onUpdateProgram) {
                  await onUpdateProgram(draft.id, draft, patch)
                } else {
                  await updateProgram(draft.id, patch)
                }
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
                if (onUpdateProgram) {
                  await onUpdateProgram(draft.id, draft, patch)
                } else {
                  await updateProgram(draft.id, patch)
                }
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
    useState<ApplicantDetailMeta | null>(null)

  useEffect(() => {
    if (!isUjatVolunteerApplicantDetailRoute(activeLnb, activeTab)) {
      setVolunteerApplicantDetailMeta(null)
    }
  }, [activeLnb, activeTab])

  const handleClose = useCallback(() => {
    onClose()
    const next = clearSponsorDetailQueryStack(new URLSearchParams(searchParams))
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
        const surveyIndex = registeredSurveys.length + 1
        const newSurvey: UjatRegisteredSurvey = {
          id: `ujat-survey-${Date.now()}`,
          title: `${next.templateName} ${surveyIndex < 10 ? `0${surveyIndex}` : surveyIndex}`,
          templateId: next.id,
          status: 'before_start',
          responseCount: 0,
          participantTotal: 16,
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
    openUjatSurveyTemplatePreview(activeRegisteredSurvey.templateId, {
      allowEdit: activeRegisteredSurvey.status === 'before_start',
    })
  }, [activeRegisteredSurvey, openUjatSurveyTemplatePreview])

  const handleShareRegisteredSurvey = useCallback(() => {
    if (!activeRegisteredSurvey || programId == null) return
    const shareUrl = `${window.location.origin}/programs/ujat/survey?programId=${programId}&surveyId=${activeRegisteredSurvey.id}`
    void copyText(shareUrl)
    showShareCopyToast(UJAT_SURVEY_POLL_SHARE_TOAST_COPY)
  }, [activeRegisteredSurvey, copyText, programId, showShareCopyToast])

  const handleDownloadPollResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (activeRegisteredSurvey == null || displayProgram == null) return
      setDownloadingPollResults(true)
      try {
        if (format === 'pdf') {
          const root = pollResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(
            root,
            buildUjatSurveyPollResultsPdfFileName(displayProgram.title, activeRegisteredSurvey.title)
          )
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: activeRegisteredSurvey.title,
            templateId: activeRegisteredSurvey.templateId,
            responseCount: activeRegisteredSurvey.responseCount,
            participantTotal: activeRegisteredSurvey.participantTotal,
            responses: pollResponses,
          })
        }
        setPollDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'ujatSurveyPollResultsDownload' })
        void showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingPollResults(false)
      }
    },
    [activeRegisteredSurvey, displayProgram, pollResponses, showAlert]
  )

  const handleOpenSatisfactionCreateModal = useCallback(() => {
    setSubmittingSatisfactionSurvey(false)
    setSelectedSatisfactionTemplateId(
      UJAT_SATISFACTION_TEMPLATE_BY_AUDIENCE[activeSatisfactionAudience]
    )
    setSatisfactionCreateModalOpen(true)
  }, [activeSatisfactionAudience])

  const handleCloseSatisfactionCreateModal = useCallback(() => {
    if (submittingSatisfactionSurvey) return
    setSatisfactionCreateModalOpen(false)
  }, [submittingSatisfactionSurvey])

  const handleSubmitSatisfactionSurvey = useCallback(async () => {
    if (selectedSatisfactionTemplateId == null || selectedSatisfactionTemplateId === '') return
    setSubmittingSatisfactionSurvey(true)
    try {
      const { newTemplateId } = await duplicateWritingTemplate({
        sourceTemplateId: selectedSatisfactionTemplateId,
        category: 'survey',
      })
      const next = findWritingTemplateRowByDefinitionId(newTemplateId)
      if (next != null) {
        const isTeacherAudience = activeSatisfactionAudience === 'teacher'
        const audienceLabel = getSatisfactionAudienceLabel(activeSatisfactionAudience)
        const newSurvey: UjatRegisteredSurvey = {
          id: `ujat-satisfaction-${activeSatisfactionAudience}-${Date.now()}`,
          title: `${audienceLabel} 만족도조사`,
          templateId: next.id,
          status: isTeacherAudience ? 'in_progress' : 'before_start',
          responseCount: isTeacherAudience ? UJAT_SURVEY_POLL_MOCK_RESPONSE_COUNT : 0,
          participantTotal: isTeacherAudience ? 11 : 0,
        }
        setSatisfactionSurveysByAudience(prev => ({
          ...prev,
          [activeSatisfactionAudience]: newSurvey,
        }))
      }
      setSatisfactionCreateModalOpen(false)
    } catch (error) {
      console.debug('ujat satisfaction survey create failed', error)
    } finally {
      setSubmittingSatisfactionSurvey(false)
    }
  }, [activeSatisfactionAudience, selectedSatisfactionTemplateId])

  const handleDeleteSatisfactionSurvey = useCallback(() => {
    if (!activeSatisfactionSurvey || activeSatisfactionSurvey.status !== 'before_start') return
    setSatisfactionSurveysByAudience(prev => {
      const next = { ...prev }
      delete next[activeSatisfactionAudience]
      return next
    })
  }, [activeSatisfactionSurvey, activeSatisfactionAudience])

  const handleOpenSatisfactionDeleteModal = useCallback(() => {
    if (!activeSatisfactionSurvey || activeSatisfactionSurvey.status !== 'before_start') return
    setSatisfactionDeleteConfirmWord('')
    setSatisfactionDeleteModalOpen(true)
  }, [activeSatisfactionSurvey])

  const handleCloseSatisfactionDeleteModal = useCallback(() => {
    setSatisfactionDeleteModalOpen(false)
    setSatisfactionDeleteConfirmWord('')
  }, [])

  const handleConfirmSatisfactionDelete = useCallback(() => {
    if (satisfactionDeleteConfirmWord !== '삭제') return
    handleDeleteSatisfactionSurvey()
    setSatisfactionDeleteModalOpen(false)
    setSatisfactionDeleteConfirmWord('')
  }, [satisfactionDeleteConfirmWord, handleDeleteSatisfactionSurvey])

  const handleOpenSatisfactionTemplatePreview = useCallback(() => {
    if (!activeSatisfactionSurvey) return
    openUjatSurveyTemplatePreview(activeSatisfactionSurvey.templateId, {
      allowEdit: activeSatisfactionSurvey.status === 'before_start',
    })
  }, [activeSatisfactionSurvey, openUjatSurveyTemplatePreview])

  const handleShareSatisfactionSurvey = useCallback(() => {
    if (!activeSatisfactionSurvey || programId == null) return
    const shareUrl = `${window.location.origin}/programs/ujat/satisfaction?programId=${programId}&audience=${activeSatisfactionAudience}`
    void copyText(shareUrl)
    showShareCopyToast()
  }, [
    activeSatisfactionSurvey,
    activeSatisfactionAudience,
    copyText,
    programId,
    showShareCopyToast,
  ])

  const handleDownloadSatisfactionResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (activeSatisfactionSurvey == null || displayProgram == null) return
      setDownloadingSatisfactionResults(true)
      try {
        if (format === 'pdf') {
          const root = satisfactionResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(
            root,
            buildUjatSatisfactionResultsPdfFileName(
              displayProgram.title,
              activeSatisfactionSurvey.title
            )
          )
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: activeSatisfactionSurvey.title,
            templateId: activeSatisfactionSurvey.templateId,
            responseCount: activeSatisfactionSurvey.responseCount,
            participantTotal: activeSatisfactionSurvey.participantTotal,
            responses: satisfactionResponses,
          })
        }
        setSatisfactionDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'ujatSatisfactionResultsDownload' })
        void showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingSatisfactionResults(false)
      }
    },
    [activeSatisfactionSurvey, displayProgram, satisfactionResponses, showAlert]
  )

  const ensureLectureEvalFormDraft = useCallback(() => {
    const templateId = lectureEvalSurvey?.templateId ?? UJAT_LECTURE_EVAL_TEMPLATE_ID
    setLectureEvalFormDraft(prev => prev ?? buildLectureEvalFormDraft(templateId))
  }, [lectureEvalSurvey?.templateId])

  useEffect(() => {
    if (lectureEvalSurvey == null) {
      setLectureEvalFormDraft(null)
      setLectureEvalResponses([])
      setLectureEvalSubmitted(false)
      setActiveLectureEvalTab('eval')
      return
    }
    if (
      lectureEvalSurvey.status === 'in_progress' ||
      lectureEvalSurvey.status === 'finished'
    ) {
      ensureLectureEvalFormDraft()
    }
  }, [lectureEvalSurvey, ensureLectureEvalFormDraft])

  const handleOpenLectureEvalCreateModal = useCallback(() => {
    setSubmittingLectureEvalSurvey(false)
    setSelectedLectureEvalTemplateId(UJAT_LECTURE_EVAL_TEMPLATE_ID)
    setLectureEvalCreateModalOpen(true)
  }, [])

  const handleCloseLectureEvalCreateModal = useCallback(() => {
    if (submittingLectureEvalSurvey) return
    setLectureEvalCreateModalOpen(false)
  }, [submittingLectureEvalSurvey])

  const handleSubmitLectureEvalRegister = useCallback(async () => {
    if (selectedLectureEvalTemplateId == null || selectedLectureEvalTemplateId === '') return
    setSubmittingLectureEvalSurvey(true)
    try {
      const { newTemplateId } = await duplicateWritingTemplate({
        sourceTemplateId: selectedLectureEvalTemplateId,
        category: 'survey',
      })
      const next = findWritingTemplateRowByDefinitionId(newTemplateId)
      if (next != null) {
        const newSurvey: UjatRegisteredSurvey = {
          id: `ujat-lecture-eval-${Date.now()}`,
          title: next.templateName,
          templateId: next.id,
          // TODO(api): 서버 status — 진행 전(before_start) / 진행 중 / 종료
          status: 'in_progress',
          responseCount: 0,
          participantTotal: 1,
        }
        setLectureEvalSurvey(newSurvey)
        setLectureEvalSubmitted(false)
        setLectureEvalResponses([])
        setActiveLectureEvalTab('eval')
        setLectureEvalFormDraft(buildLectureEvalFormDraft(next.id))
      }
      setLectureEvalCreateModalOpen(false)
    } catch (error) {
      console.debug('ujat lecture eval register failed', error)
    } finally {
      setSubmittingLectureEvalSurvey(false)
    }
  }, [selectedLectureEvalTemplateId])

  const handleOpenLectureEvalPreview = useCallback(() => {
    if (!lectureEvalSurvey) return
    const row = findWritingTemplateRowByDefinitionId(lectureEvalSurvey.templateId)
    if (!row) return
    const entry = lookupTemplateRegistry(row.id)
    if (entry == null || !isSurveyRegistryEntry(entry)) return

    openWritingUserPreview({
      draft: buildLectureEvalFormDraft(row.id),
      updateParagraph: () => {},
      headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
      editorKind: 'survey',
      paragraphBodyOptions: UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
      ...(lectureEvalSurvey.status === 'before_start'
        ? {
            onEditForm: () => {
              closeWritingUserPreview()
              setSurveyTemplateEditId(row.id)
              setSurveyTemplateEditOpen(true)
            },
          }
        : {}),
    })
  }, [lectureEvalSurvey, closeWritingUserPreview, openWritingUserPreview])

  const handleLectureEvalTabChange = useCallback(
    (tab: UjatLectureEvalTabKey) => {
      if (tab === 'results') {
        if (lectureEvalSurvey == null || lectureEvalSurvey.status !== 'finished') {
          setLectureEvalIncompleteModalOpen(true)
          return
        }
      }
      setActiveLectureEvalTab(tab)
    },
    [lectureEvalSurvey]
  )

  const handleLectureEvalSubmit = useCallback(() => {
    if (!lectureEvalSurvey || lectureEvalFormDraft == null) return
    const validation = validateLectureEvalFormDraft(lectureEvalFormDraft)
    if (!validation.valid) {
      void showAlert({
        title: '입력 확인',
        content: validation.message,
      })
      return
    }

    setLectureEvalSubmitted(true)
    setLectureEvalResponses([draftToLectureEvalPollResponse(lectureEvalFormDraft)])
    setLectureEvalSurvey(prev => {
      if (prev == null) return prev
      const nextStatus =
        UJAT_LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT && prev.status === 'in_progress'
          ? 'finished'
          : prev.status
      return {
        ...prev,
        status: nextStatus,
        responseCount: 1,
        participantTotal: Math.max(prev.participantTotal, 1),
      }
    })
  }, [lectureEvalSurvey, lectureEvalFormDraft, showAlert])

  const handleLectureEvalEditResponse = useCallback(() => {
    if (!lectureEvalSurvey || lectureEvalFormDraft == null) return
    if (!canEditLectureEvalResponse(lectureEvalSurvey, lectureEvalFormDraft)) return
    setLectureEvalSubmitted(false)
  }, [lectureEvalSurvey, lectureEvalFormDraft])

  const handleDownloadLectureEvalResults = useCallback(
    async (format: SurveyResultsDownloadFormat) => {
      if (lectureEvalSurvey == null || displayProgram == null) return
      setDownloadingLectureEvalResults(true)
      try {
        if (format === 'pdf') {
          const root = lectureEvalResultsExportRef.current
          if (root == null) {
            throw new Error('PDF로보낼 결과 영역을 찾을 수 없습니다.')
          }
          await exportLectureEvalResultsPdf(
            root,
            buildLectureEvalResultsPdfFileName(displayProgram.title)
          )
        } else {
          await exportSurveyResultsExcel({
            surveyTitle: lectureEvalSurvey.title,
            templateId: lectureEvalSurvey.templateId,
            responseCount: lectureEvalSurvey.responseCount,
            participantTotal: lectureEvalSurvey.participantTotal,
            responses: lectureEvalResponses,
          })
        }
        setLectureEvalDownloadModalOpen(false)
      } catch (error) {
        handleError(error, { context: 'ujatLectureEvalResultsDownload' })
        void showAlert({
          title: '다운로드',
          content: '파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      } finally {
        setDownloadingLectureEvalResults(false)
      }
    },
    [displayProgram, lectureEvalResponses, lectureEvalSurvey, showAlert]
  )

  const handleCloseLectureEvalIncompleteModal = useCallback(() => {
    setLectureEvalIncompleteModalOpen(false)
  }, [])

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
    <>
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
      ) : externalError && !displayProgram ? (
        <Typography.Text type="danger">
          프로그램 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </Typography.Text>
      ) : displayProgram ? (
        <>
          {activeLnb === 'info' && activeTab === 'info' && (
            <>
              <div className="ujat-detail-modal__info-header">
                <div className="program-detail-fullpage-modal__header-actions">
                  <CmsButton
                    variant="secondary"
                    size="large"
                    width={140}
                    disabled={!canEditInfo && !isEditModeInfo}
                    onClick={resolveProgramEditInfoClick(isEditModeInfo, {
                      onEnterEdit: handleInfoEdit,
                      onSaveEdit: handleInfoSave,
                    })}
                  >
                    {PROGRAM_EDIT_INFO_BUTTON_LABEL}
                  </CmsButton>
                </div>
              </div>
              <UjatProgramDetailCommonInfoView
                program={displayProgram}
                sponsorName={sponsorName}
                isEditMode={isEditModeInfo}
                infoForm={isEditModeInfo ? infoForm : undefined}
              />
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
            (activeTab === 'vh1_all' ||
              activeTab === 'vh2_all' ||
              activeTab === 'vh1_doc1' ||
              activeTab === 'vh2_doc1') && (
              <DocScreeningSection
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
              <DocPassedSection
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
              <Interview2Section
                programId={displayProgram.id}
                half={activeTab.startsWith('vh2') ? 'h2' : 'h1'}
                onRegisterApplicantCloseHandler={fn => {
                  volunteerApplicantCloseHandlerRef.current = fn
                }}
                onVolunteerApplicantDetailMetaChange={setVolunteerApplicantDetailMeta}
              />
            )}
          {(activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2') &&
            activeTab !== 'vh1_all' &&
            activeTab !== 'vh2_all' &&
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
                  program={displayProgram}
                  half={eduVolunteerHalf}
                  volunteerId={eduVolunteerDetailId}
                  activeTab={eduVolunteerDetailTab}
                  onSelectTab={setEduVolunteerDetailTab}
                />
              ) : (
                <UjatEducationProgressVolunteersSection
                  program={displayProgram}
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
                <UjatSurveyEmptyState
                  title={UJAT_SURVEY_POLL_EMPTY_COPY.title}
                  description={UJAT_SURVEY_POLL_EMPTY_COPY.description}
                  registerButtonLabel={UJAT_SURVEY_POLL_EMPTY_COPY.registerButton}
                  onRegisterClick={handleOpenSurveyCreateModal}
                />
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
                          labels={UJAT_SURVEY_POLL_ACTION_LABELS}
                          onShareClick={handleShareRegisteredSurvey}
                          onAddClick={handleOpenSurveyCreateModal}
                          onOpenTemplatePreview={handleOpenRegisteredSurveyTemplatePreview}
                          onDownloadClick={() => setPollDownloadModalOpen(true)}
                        />
                      ) : null
                    }
                  />
                  {activeRegisteredSurvey != null && activeRegisteredSurvey.status === 'before_start' ? (
                    <UjatSurveyNoResponseState
                      title={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.title}
                      description={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.description}
                      deleteButtonLabel={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.deleteButton}
                      previewButtonLabel={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.previewButton}
                      canDelete={activeRegisteredSurvey.status === 'before_start'}
                      embedded
                      onDeleteClick={handleOpenSurveyDeleteModal}
                      onOpenTemplatePreview={handleOpenRegisteredSurveyTemplatePreview}
                    />
                  ) : activeRegisteredSurvey != null ? (
                    <div ref={pollResultsExportRef}>
                      <UjatSurveyPollResultsView
                        templateId={activeRegisteredSurvey.templateId}
                        responseCount={activeRegisteredSurvey.responseCount}
                        participantTotal={activeRegisteredSurvey.participantTotal}
                        responses={pollResponses}
                        pdfTitle="설문조사 결과"
                      />
                    </div>
                  ) : null}
                </div>
              )
            ) : activeTab === 'survey-satisfaction' ? (
              <UjatSatisfactionSurveyView
                surveysByAudience={satisfactionSurveysByAudience}
                activeAudience={activeSatisfactionAudience}
                onAudienceChange={setActiveSatisfactionAudience}
                onRegisterClick={handleOpenSatisfactionCreateModal}
                onShareClick={handleShareSatisfactionSurvey}
                onDeleteClick={handleOpenSatisfactionDeleteModal}
                onOpenTemplatePreview={handleOpenSatisfactionTemplatePreview}
                onDownloadClick={() => setSatisfactionDownloadModalOpen(true)}
                resultsExportRef={satisfactionResultsExportRef}
                resultsResponses={satisfactionResponses}
              />
            ) : activeTab === 'survey-lecture-eval' ? (
              <UjatLectureEvalSurveyView
                survey={lectureEvalSurvey}
                submitted={lectureEvalSubmitted}
                formDraft={lectureEvalFormDraft}
                pollResponses={lectureEvalResponses}
                activeTab={activeLectureEvalTab}
                downloadingResults={downloadingLectureEvalResults}
                resultsExportRef={lectureEvalResultsExportRef}
                onTabChange={handleLectureEvalTabChange}
                onRegisterClick={handleOpenLectureEvalCreateModal}
                onOpenTemplatePreview={handleOpenLectureEvalPreview}
                onFormDraftChange={setLectureEvalFormDraft}
                onSubmitClick={handleLectureEvalSubmit}
                onEditResponseClick={handleLectureEvalEditResponse}
                onDownloadResultsClick={() => setLectureEvalDownloadModalOpen(true)}
              />
            ) : null)}

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
          <>
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
          </>
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
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              width={120}
              type="button"
              onClick={handleCloseSurveyDeleteModal}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              width={120}
              type="button"
              disabled={surveyDeleteConfirmWord.trim() !== '삭제'}
              onClick={handleConfirmSurveyDelete}
            >
              설문 삭제
            </CmsButton>
          </>
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
      <ContentModal
        open={satisfactionCreateModalOpen}
        onCancel={handleCloseSatisfactionCreateModal}
        title="신규 만족도조사 등록"
        width={600}
        className="ujat-survey-create-modal"
        description={`${getSatisfactionAudienceLabel(activeSatisfactionAudience)}용 만족도조사를 등록하시겠습니까?\n등록 시 해당 프로그램의 모든 학교에 동일하게 노출됩니다.`}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              width={120}
              type="button"
              onClick={handleCloseSatisfactionCreateModal}
              disabled={submittingSatisfactionSurvey}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              width={120}
              type="button"
              onClick={() => {
                void handleSubmitSatisfactionSurvey()
              }}
              disabled={
                selectedSatisfactionTemplateId == null || selectedSatisfactionTemplateId === ''
              }
              loading={submittingSatisfactionSurvey}
            >
              신규 등록
            </CmsButton>
          </>
        }
      >
        <div className="ujat-survey-create-modal__field">
          <p className="ujat-survey-create-modal__label">템플릿 유형</p>
          <CmsSelect
            width="100%"
            withAllOption={false}
            placeholder="사용할 설문 양식을 선택해 주세요"
            options={surveyTemplateOptions}
            value={selectedSatisfactionTemplateId ?? undefined}
            onChange={value => setSelectedSatisfactionTemplateId(value ?? null)}
          />
        </div>
      </ContentModal>
      <ContentModal
        open={satisfactionDeleteModalOpen}
        onCancel={handleCloseSatisfactionDeleteModal}
        title="만족도조사 삭제 안내"
        width={600}
        modalStyles={{
          content: { minHeight: 310 },
        }}
        className="ujat-survey-delete-modal"
        description={`**[${getSatisfactionDeleteModalSubject(activeSatisfactionAudience)}]** 만족도조사를 삭제하시겠습니까?\n삭제 시 해당 양식의 내용은 모두 삭제됩니다.\n삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?`}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              width={120}
              type="button"
              onClick={handleCloseSatisfactionDeleteModal}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              width={120}
              type="button"
              disabled={satisfactionDeleteConfirmWord.trim() !== '삭제'}
              onClick={handleConfirmSatisfactionDelete}
            >
              만족도조사 삭제
            </CmsButton>
          </>
        }
      >
        <div className="ujat-survey-delete-modal__field">
          <CmsInput
            width="100%"
            placeholder="삭제하시려면 해당란에 [삭제]를 입력해 주세요."
            value={satisfactionDeleteConfirmWord}
            onChange={e => setSatisfactionDeleteConfirmWord(e.target.value)}
          />
        </div>
      </ContentModal>
      <ContentModal
        open={lectureEvalCreateModalOpen}
        onCancel={handleCloseLectureEvalCreateModal}
        title={UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.title}
        width={600}
        className="ujat-survey-create-modal"
        description={UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.description}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="medium"
              width={120}
              type="button"
              onClick={handleCloseLectureEvalCreateModal}
              disabled={submittingLectureEvalSurvey}
            >
              {UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.cancelButton}
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              width={120}
              type="button"
              onClick={() => {
                void handleSubmitLectureEvalRegister()
              }}
              disabled={selectedLectureEvalTemplateId == null || selectedLectureEvalTemplateId === ''}
              loading={submittingLectureEvalSurvey}
            >
              {UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.confirmButton}
            </CmsButton>
          </>
        }
      >
        <div className="ujat-survey-create-modal__field">
          <p className="ujat-survey-create-modal__label">템플릿 유형</p>
          <CmsSelect
            width="100%"
            withAllOption={false}
            placeholder="사용할 설문 양식을 선택해 주세요"
            options={surveyTemplateOptions}
            value={selectedLectureEvalTemplateId ?? undefined}
            onChange={value => setSelectedLectureEvalTemplateId(value ?? null)}
          />
        </div>
      </ContentModal>
      <ContentModal
        open={lectureEvalIncompleteModalOpen}
        onCancel={handleCloseLectureEvalIncompleteModal}
        title={UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.title}
        width={600}
        className="ujat-lecture-eval-incomplete-modal"
        description={UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.description}
        footer={
          <CmsButton
            variant="secondary"
            size="medium"
            width={120}
            type="button"
            onClick={handleCloseLectureEvalIncompleteModal}
          >
            {UJAT_LECTURE_EVAL_INCOMPLETE_MODAL_COPY.confirmButton}
          </CmsButton>
        }
      >
        <span className="ujat-lecture-eval-incomplete-modal__body-placeholder" />
      </ContentModal>
      <SurveyResultsDownloadModal
        open={lectureEvalDownloadModalOpen}
        downloading={downloadingLectureEvalResults}
        copy={UJAT_LECTURE_EVAL_DOWNLOAD_MODAL_COPY}
        onCancel={() => setLectureEvalDownloadModalOpen(false)}
        onDownload={handleDownloadLectureEvalResults}
      />
      <SurveyResultsDownloadModal
        open={pollDownloadModalOpen}
        downloading={downloadingPollResults}
        copy={UJAT_SURVEY_POLL_DOWNLOAD_MODAL_COPY}
        onCancel={() => setPollDownloadModalOpen(false)}
        onDownload={handleDownloadPollResults}
      />
      <SurveyResultsDownloadModal
        open={satisfactionDownloadModalOpen}
        downloading={downloadingSatisfactionResults}
        copy={UJAT_SATISFACTION_DOWNLOAD_MODAL_COPY}
        onCancel={() => setSatisfactionDownloadModalOpen(false)}
        onDownload={handleDownloadSatisfactionResults}
      />
      <SurveyShareCopyToast
        open={shareToastOpen}
        line1={shareToastLines.line1}
        line2={shareToastLines.line2}
      />
    </DetailFullPageModal>
    {surveyTemplateEditId != null ? (
      <UjatSurveyTemplateEditModal
        open={surveyTemplateEditOpen}
        templateId={surveyTemplateEditId}
        onClose={handleCloseSurveyTemplateEdit}
      />
    ) : null}
    <ProgramDetailSponsorDetailOverlay />
    </>
  )
}
