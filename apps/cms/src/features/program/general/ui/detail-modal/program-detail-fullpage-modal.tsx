/**
 * 프로그램 상세 풀페이지 모달
 * 경제/일반 교육 프로그램 목록 테이블 행 클릭 시 노출.
 * 모달 내 LNB, 헤더 타이틀, 탭, 기본정보/커리큘럼/KPI 테이블 구성.
 *
 * ─── 수정 모드 ↔ React Hook Form / Zod ─────────────────────────────────────
 * - URL: `edit` 쿼리(`EDIT_PARAM`)가 현재 `tab` 과 같을 때만 해당 탭이 수정 모드 (예: 공통정보 `edit=info`).
 * - 폼: 탭마다 `useProgramDetailEditForm` 인스턴스가 분리됨(info / institutions / instructors / volunteers).
 *   `ProgramDetailEditFormValues` 공유, 검증 스키마는 탭별로 `programDetailEditSchema` 또는 `programDetailInstitutionsEditSchema`(참여자 정보).
 * - 저장·취소: 각 탭별 `useProgramDetailInfoSave` — `triggerSave` → Zod `trigger` 후 patch, `resetToProgram` 으로 리셋.
 * - 하위 UI는 `ProjectInfoDetailPanels` 로 `form` prop 이 전달되며, 수정 중일 때만 `form` 이 정의됨.
 *
 * 병합 시 `edit` 파싱·`setEditMode`·폼 훅 호출 순서를 바꾸면 수정 모드와 폼이 엇갈릴 수 있음.
 */

import { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { useProgramDetailEditForm } from '../../hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '../../hooks/use-program-detail-info-save'
import { programDetailInstitutionsEditSchema } from '@/features/program/shared/model/program-detail-edit-schema'
import { ParticipatingInstitutionsSection } from './program-status/participating-institutions-section'
import {
  normalizeParticipatingInstitutionDetailTab,
  type ParticipatingInstitutionDetailTabKey,
  isParticipatingInstitutionDetailTabKeyForProgram,
} from '@/features/program/general/lib/participating-institution-detail-tabs'
import { ProgramManagersTab } from './managers/program-managers-tab'
import {
  normalizeInstructorDetailTab,
  type InstructorDetailTabKey,
} from './program-status/participating-instructor-fullpage-view'
import {
  normalizeVolunteerDetailTab,
  type VolunteerDetailTabKey,
} from './program-status/participating-volunteer-fullpage-view'
import { ParticipatingVolunteersSection } from './program-status/participating-volunteers-section'
import { ParticipatingInstructorsSection } from './program-status/participating-instructors-section'
import { ApplicantList } from '../../../shared/ui/program-detail/applicant-list/applicant-list'
import { generalOrganizationApplicationFilterFields } from '@/features/program/general/lib/application-filter-fields'
import { ProjectInfoDetailPanels } from '../../../shared/ui/program-detail/project-info/project-info-detail'
import {
  CompanySchoolApplicationInfoView,
  type CompanySchoolApplicationInfoTabKey,
} from './info/company-school-application-info-view'
import { GeneralProgramApplicationTemplateEditModal } from './info/application-template-edit-modal'
import { GeneralProgramRecruitmentView } from './info/recruitment-view'
import { GeneralSurveyManagementView } from './survey-management/survey-management-view'
import type { Program } from '@/types/domain'
import { getProgramAdminDetailUrlFromPathname } from '@/features/program/general/lib/program-admin-detail-url'
import { getEconomyPrograms, getGeneralPrograms, getTrainedTeachersPrograms } from '@/data/mock'
import { COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX } from '@/features/program/general/lib/registration-local-save'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { useUpdateTrainedTeacherProgramInfoDetail } from '@/features/program/trained-teachers/api/hooks'
import { TrainedTeachersCommonInfoView } from '@/features/program/trained-teachers/ui/common-info/common-info-view'
import { TrainedTeachersApplicationInfoView } from '@/features/program/trained-teachers/ui/application-info/application-info-view'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import { handleError } from '@/shared/utils/error-handler'
import { useGeneralProgramNavigation } from '@/features/program/general/hooks/use-general-program-navigation'
import { TAB_KEYS, type TabKey, type LnbKey } from './program-detail-nav-types'
import type { GeneralRecruitTabKey } from '@/features/program/general/lib/recruitment-tabs'
import {
  getGeneralSurveyMenuItems,
  type GeneralSurveyNavKey,
} from '@/features/program/general/lib/detail-meta'
import {
  APPLICANT_ID_PARAM,
  DETAIL_TAB_PARAM,
} from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-constants'
import {
  LnbIconApplicants,
  LnbIconManagers,
  LnbIconProgress,
  LnbIconProjectInfo,
} from './program-detail-lnb-icons'
import { GeneralLnbSurveyManagementIcon } from './detail-lnb-icons'
import './applications/participant-applications.css'
import './program-detail-fullpage-modal.css'

export interface ProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  program: Program | null
  programVariant?: 'company-school' | 'trained-teachers'
  externalLoading?: boolean
  /** remote detail 로드 실패 (empty-flash 전에 표시) */
  externalError?: boolean
  onUpdateProgram?: (
    programId: string,
    program: Program,
    patch: Partial<Program>
  ) => Promise<void>
}

const TAB_PARAM = 'tab'
const EDIT_PARAM = 'edit'
const LNB_PARAM = 'lnb'
const SCHOOL_ID_PARAM = 'schoolId'
const SCHOOL_TAB_PARAM = 'schoolTab'
const INSTRUCTOR_ID_PARAM = 'instructorId'
const INSTRUCTOR_TAB_PARAM = 'instructorTab'
const VOLUNTEER_ID_PARAM = 'volunteerId'
const VOLUNTEER_TAB_PARAM = 'volunteerTab'
const SUB_TAB_PARAM = 'subTab'
const PROGRAM_DETAIL_QUERY_PARAMS = [
  'programId',
  LNB_PARAM,
  TAB_PARAM,
  EDIT_PARAM,
  SCHOOL_ID_PARAM,
  SCHOOL_TAB_PARAM,
  INSTRUCTOR_ID_PARAM,
  INSTRUCTOR_TAB_PARAM,
  VOLUNTEER_ID_PARAM,
  VOLUNTEER_TAB_PARAM,
  SUB_TAB_PARAM,
  APPLICANT_ID_PARAM,
  DETAIL_TAB_PARAM,
] as const
const PROGRAM_NESTED_DETAIL_QUERY_PARAMS = [
  SCHOOL_ID_PARAM,
  SCHOOL_TAB_PARAM,
  INSTRUCTOR_ID_PARAM,
  INSTRUCTOR_TAB_PARAM,
  VOLUNTEER_ID_PARAM,
  VOLUNTEER_TAB_PARAM,
  APPLICANT_ID_PARAM,
  DETAIL_TAB_PARAM,
] as const

/** 프로그램 상세 모달 LNB 카테고리
 * info: 프로젝트 정보
 * applicants: 신청자 목록
 * progress: 프로그램 진행 현황
 * managers: 담당자 정보
 */
const LNB_KEYS_READONLY: readonly LnbKey[] = [
  'info',
  'applicants',
  'applicant_instructors',
  'progress',
  'survey',
  'managers',
]

function isCompanySchoolDetailProgram(program: Program | null): boolean {
  if (!program?.id) return false
  const id = String(program.id)
  return (
    id.startsWith('economy-prog-') ||
    id.startsWith('company-school-prog-') ||
    id.startsWith(COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX) ||
    getEconomyPrograms().some(item => item.id === program.id)
  )
}

function parseSchoolTabFromSearch(
  searchParams: URLSearchParams,
  program?: Program | null
): ParticipatingInstitutionDetailTabKey {
  const t = searchParams.get(SCHOOL_TAB_PARAM)
  if (t && isParticipatingInstitutionDetailTabKeyForProgram(t, program)) {
    return normalizeParticipatingInstitutionDetailTab(t, program)
  }
  return 'application'
}

function parseInstructorTabFromSearch(searchParams: URLSearchParams): InstructorDetailTabKey {
  return normalizeInstructorDetailTab(searchParams.get(INSTRUCTOR_TAB_PARAM))
}

function parseVolunteerTabFromSearch(searchParams: URLSearchParams): VolunteerDetailTabKey {
  return normalizeVolunteerDetailTab(searchParams.get(VOLUNTEER_TAB_PARAM))
}

function parseTabFromSearch(searchParams: URLSearchParams): TabKey {
  const tab = searchParams.get(TAB_PARAM)
  if (tab && (TAB_KEYS as readonly string[]).includes(tab)) return tab as TabKey
  return 'info'
}

/** 신청자 목록 LNB: tab은 신청 기관/강사/봉사자만 유효 (info 등 공통정보 탭 값은 테이블이 비지 않도록 기본값) */
function parseApplicantsChildTabFromSearch(searchParams: URLSearchParams): TabKey {
  const tab = searchParams.get(TAB_PARAM)
  if (tab === 'institutions' || tab === 'instructors' || tab === 'volunteers') return tab
  return 'institutions'
}

function parseLnbFromSearch(searchParams: URLSearchParams): LnbKey | null {
  const lnb = searchParams.get(LNB_PARAM)
  if (lnb && (LNB_KEYS_READONLY as readonly string[]).includes(lnb)) return lnb as LnbKey
  return null
}

/** 쿼리 파라미터에서 수정 모드 탭 파싱. edit=info 등 현재 탭과 일치할 때만 해당 탭이 수정 모드 */
function parseEditTabFromSearch(searchParams: URLSearchParams): TabKey | null {
  const edit = searchParams.get(EDIT_PARAM)
  if (edit && (TAB_KEYS as readonly string[]).includes(edit)) return edit as TabKey
  return null
}

export function ProgramDetailFullPageModal({
  open,
  onClose,
  program,
  programVariant,
  externalLoading = false,
  externalError = false,
  onUpdateProgram,
}: ProgramDetailFullPageModalProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id
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
  const displayProgram = useMemo(() => program ?? detailProgram ?? null, [detailProgram, program])
  const persistProgramPatch = async (draft: Program, patch: Partial<Program>) => {
    if (onUpdateProgram) {
      await onUpdateProgram(draft.id, draft, patch)
      return
    }
    await updateProgram(draft.id, patch)
  }
  const isCompanySchoolDetail = useMemo(
    () =>
      programVariant === 'company-school' ||
      isCompanySchoolDetailProgram(displayProgram),
    [displayProgram, programVariant]
  )
  const { disabledLnbKeys } = useGeneralProgramNavigation(
    open && isCompanySchoolDetail ? programId : undefined,
    open && isCompanySchoolDetail
  )
  const isTrainedTeachersDetail = useMemo(
    () =>
      programVariant === 'trained-teachers' ||
      isTrainedTeachersDetailProgram(displayProgram),
    [displayProgram, programVariant]
  )
  const trainedTeacherRemoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  const updateTrainedTeacherInfoDetailMutation = useUpdateTrainedTeacherProgramInfoDetail()
  const isOverviewProgramDetail = isCompanySchoolDetail || isTrainedTeachersDetail
  const initialEditResetKeyRef = useRef<string | null>(null)
  useLayoutEffect(() => {
    const resetKey = open && isOverviewProgramDetail && programId ? programId : null
    if (!resetKey) {
      initialEditResetKeyRef.current = null
      return
    }
    if (initialEditResetKeyRef.current === resetKey) return
    initialEditResetKeyRef.current = resetKey
    if (!searchParams.has(EDIT_PARAM)) return

    const next = new URLSearchParams(searchParams)
    next.delete(EDIT_PARAM)
    setSearchParams(next, { replace: true })
  }, [open, programId, isOverviewProgramDetail, searchParams, setSearchParams])
  const surveyMenuItems = useMemo(
    () => (displayProgram ? getGeneralSurveyMenuItems(displayProgram) : []),
    [displayProgram]
  )
  const activeTab = open ? parseTabFromSearch(searchParams) : 'info'
  const editTab = open ? parseEditTabFromSearch(searchParams) : null
  const activeLnb = open ? (parseLnbFromSearch(searchParams) ?? 'info') : 'info'
  const activeChildMenu: TabKey | '' =
    activeLnb === 'applicants'
      ? isOverviewProgramDetail
        ? 'institutions'
        : parseApplicantsChildTabFromSearch(searchParams)
      : activeLnb === 'applicant_instructors'
        ? 'instructors'
        : ''
  const progressTab = parseTabFromSearch(searchParams)
  const activeProgressChild: TabKey | '' =
    activeLnb === 'progress'
      ? isTrainedTeachersDetail
        ? 'institutions'
        : (isCompanySchoolDetail
            ? ['institutions', 'instructors'].includes(progressTab)
            : ['institutions', 'instructors', 'volunteers'].includes(progressTab))
          ? progressTab
          : ''
      : ''
  const activeSurveyChild: GeneralSurveyNavKey | '' =
    activeLnb === 'survey'
      ? surveyMenuItems.some(item => item.key === searchParams.get(TAB_PARAM))
        ? (searchParams.get(TAB_PARAM) as GeneralSurveyNavKey)
        : (surveyMenuItems[0]?.key ?? '')
      : ''

  const APPLICANTS_TAB_KEYS: TabKey[] = ['institutions', 'instructors', 'volunteers']
  const PROGRESS_TAB_KEYS: TabKey[] = ['institutions', 'instructors', 'volunteers']

  const schoolIdFromUrl = searchParams.get(SCHOOL_ID_PARAM)
  const instructorIdFromUrl = searchParams.get(INSTRUCTOR_ID_PARAM)
  const volunteerIdFromUrl = searchParams.get(VOLUNTEER_ID_PARAM)
  const activeSchoolTab = useMemo(
    () => (schoolIdFromUrl ? parseSchoolTabFromSearch(searchParams, displayProgram) : 'application'),
    [schoolIdFromUrl, searchParams, displayProgram]
  )
  const activeInstructorTab = instructorIdFromUrl
    ? parseInstructorTabFromSearch(searchParams)
    : 'application'
  const activeVolunteerTab = volunteerIdFromUrl
    ? parseVolunteerTabFromSearch(searchParams)
    : 'application'

  // 모달이 열릴 때: URL에 유효한 lnb·tab이 있으면 유지(새로고침 복원), 없으면 info 또는 해당 카테고리 기본 탭으로 보정
  // programId는 모달이 열려 있는 동안 항상 유지(클릭/새로고침 타이밍 이슈 방지)
  useEffect(() => {
    if (!open) return
    const currentLnb = parseLnbFromSearch(searchParams)
    const currentTab = parseTabFromSearch(searchParams)
    // 공통 정보(lnb=info) 내 탭: 1사1교는 봉사자 정보 없음
    if (currentLnb === 'info') {
      const validInfoTabs = isOverviewProgramDetail
        ? (['info', 'institutions', 'instructors'] as TabKey[])
        : [...TAB_KEYS]
      if (validInfoTabs.includes(currentTab)) return

      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, 'info')
      next.set(TAB_PARAM, 'info')
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    // 신청자 목록(lnb=applicants) 내 탭 — 유효하면 유지
    if (currentLnb === 'applicants') {
      if (isOverviewProgramDetail) {
        if (currentTab === 'institutions') return
        const next = new URLSearchParams(searchParams)
        next.set(LNB_PARAM, 'applicants')
        next.set(TAB_PARAM, 'institutions')
        next.delete(EDIT_PARAM)
        if (programId) next.set('programId', programId)
        setSearchParams(next, { replace: true })
        return
      }
      if (APPLICANTS_TAB_KEYS.includes(currentTab)) return
      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, 'applicants')
      next.set(TAB_PARAM, 'institutions')
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    if (currentLnb === 'applicant_instructors') {
      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, 'applicant_instructors')
      next.set(TAB_PARAM, 'instructors')
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    // 프로그램 진행현황(lnb=progress) 내 탭 — 유효하면 유지
    if (currentLnb === 'progress') {
      const validProgressTabs = isTrainedTeachersDetail
        ? (['institutions'] as TabKey[])
        : isCompanySchoolDetail
          ? (['institutions', 'instructors'] as TabKey[])
          : PROGRESS_TAB_KEYS
      if (validProgressTabs.includes(currentTab)) return
      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, 'progress')
      next.set(TAB_PARAM, 'institutions')
      next.delete(SUB_TAB_PARAM)
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    if (currentLnb === 'survey') {
      const nextSurveyKey = surveyMenuItems.some(item => item.key === searchParams.get(TAB_PARAM))
        ? searchParams.get(TAB_PARAM)
        : surveyMenuItems[0]?.key
      if (nextSurveyKey) {
        const next = new URLSearchParams(searchParams)
        next.set(LNB_PARAM, 'survey')
        next.set(TAB_PARAM, nextSurveyKey)
        next.delete(EDIT_PARAM)
        if (programId) next.set('programId', programId)
        setSearchParams(next, { replace: true })
        return
      }
    }
    // 담당자 정보
    if (currentLnb === 'managers') return
    // lnb 없음/비유효 시 공통 정보로 초기화
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'info')
    next.set(TAB_PARAM, 'info')
    next.delete(EDIT_PARAM)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [
    open,
    programId,
    isCompanySchoolDetail,
    isTrainedTeachersDetail,
    isOverviewProgramDetail,
    surveyMenuItems,
    searchParams,
    setSearchParams,
  ])

  // 진행현황 진입 시 tab=instructors면 subTab=instructors 보장(새로고침 시 세그먼트 복원)
  useEffect(() => {
    if (!open || activeLnb !== 'progress') return
    if (progressTab !== 'instructors') return
    if (searchParams.get(SUB_TAB_PARAM) === 'instructors') return
    const next = new URLSearchParams(searchParams)
    next.set(SUB_TAB_PARAM, 'instructors')
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, activeLnb, progressTab, searchParams, setSearchParams, programId])

  // 진행현황 내 세그먼트(subTab) 변경 시 tab 동기화 — LNB 활성 메뉴와 일치
  useEffect(() => {
    if (!open || activeLnb !== 'progress') return
    const subTab = searchParams.get(SUB_TAB_PARAM)
    const wantTab = subTab === 'instructors' ? 'instructors' : 'institutions'
    if (progressTab === wantTab) return
    const next = new URLSearchParams(searchParams)
    next.set(TAB_PARAM, wantTab)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, activeLnb, progressTab, searchParams, setSearchParams, programId])

  // 학교 상세 뷰 탭(schoolTab) 유효성 — schoolId 있을 때만 (비활성 탭·누락 시 정규화된 값으로 URL 동기화)
  useEffect(() => {
    if (!open || !schoolIdFromUrl) return
    const raw = searchParams.get(SCHOOL_TAB_PARAM)
    const normalized = parseSchoolTabFromSearch(searchParams, displayProgram)
    if (raw === normalized) return
    const next = new URLSearchParams(searchParams)
    next.set(SCHOOL_TAB_PARAM, normalized)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, schoolIdFromUrl, searchParams, setSearchParams, programId, displayProgram])

  useEffect(() => {
    if (!open || !instructorIdFromUrl) return
    const raw = searchParams.get(INSTRUCTOR_TAB_PARAM)
    const normalized = parseInstructorTabFromSearch(searchParams)
    if (raw === normalized) return
    const next = new URLSearchParams(searchParams)
    next.set(INSTRUCTOR_TAB_PARAM, normalized)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, instructorIdFromUrl, searchParams, setSearchParams, programId])

  useEffect(() => {
    if (!open || !volunteerIdFromUrl) return
    const raw = searchParams.get(VOLUNTEER_TAB_PARAM)
    const normalized = parseVolunteerTabFromSearch(searchParams)
    if (raw === normalized) return
    const next = new URLSearchParams(searchParams)
    next.set(VOLUNTEER_TAB_PARAM, normalized)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, volunteerIdFromUrl, searchParams, setSearchParams, programId])

  useEffect(() => {
    if (!open || !volunteerIdFromUrl) return
    if (activeLnb === 'progress' && activeProgressChild === 'volunteers') return
    const next = new URLSearchParams(searchParams)
    next.delete(VOLUNTEER_ID_PARAM)
    next.delete(VOLUNTEER_TAB_PARAM)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [
    open,
    activeLnb,
    activeProgressChild,
    volunteerIdFromUrl,
    programId,
    searchParams,
    setSearchParams,
  ])

  useEffect(() => {
    if (!open || !instructorIdFromUrl) return
    if (activeLnb === 'progress' && activeProgressChild === 'instructors') return
    const next = new URLSearchParams(searchParams)
    next.delete(INSTRUCTOR_ID_PARAM)
    next.delete(INSTRUCTOR_TAB_PARAM)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [
    open,
    activeLnb,
    activeProgressChild,
    instructorIdFromUrl,
    programId,
    searchParams,
    setSearchParams,
  ])

  const setLnb = (key: LnbKey, childTab?: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, key)
    if (key === 'info') {
      const tab = searchParams.get(TAB_PARAM)
      if (isOverviewProgramDetail) {
        const nextTab = childTab ?? tab
        next.set(
          TAB_PARAM,
          nextTab && ['info', 'institutions', 'instructors'].includes(nextTab) ? nextTab : 'info'
        )
      } else {
        next.set(TAB_PARAM, tab && (TAB_KEYS as readonly string[]).includes(tab) ? tab : 'info')
      }
    } else if (key === 'applicants') {
      if (isOverviewProgramDetail) {
        next.set(TAB_PARAM, 'institutions')
      } else {
        const tab = childTab ?? searchParams.get(TAB_PARAM)
        next.set(
          TAB_PARAM,
          tab && ['institutions', 'instructors', 'volunteers'].includes(tab)
            ? tab
            : 'institutions'
        )
      }
    } else if (key === 'applicant_instructors') {
      next.set(TAB_PARAM, 'instructors')
    } else if (key === 'progress') {
      if (isTrainedTeachersDetail) {
        next.set(TAB_PARAM, 'institutions')
        next.delete(SUB_TAB_PARAM)
      } else {
      const tab = childTab ?? searchParams.get(TAB_PARAM)
      const progressTabValue = tab && ['institutions', 'instructors'].includes(tab)
        ? tab
        : !isCompanySchoolDetail && tab === 'volunteers'
          ? tab
          : 'institutions'
      next.set(TAB_PARAM, progressTabValue)
      if (progressTabValue === 'instructors') next.set(SUB_TAB_PARAM, 'instructors')
      else next.delete(SUB_TAB_PARAM)
      }
    } else if (key === 'survey') {
      const tab = searchParams.get(TAB_PARAM)
      const surveyTab = surveyMenuItems.some(item => item.key === tab)
        ? tab
        : surveyMenuItems[0]?.key
      if (surveyTab) next.set(TAB_PARAM, surveyTab)
      next.delete(EDIT_PARAM)
    }
    setSearchParams(next, { replace: true })
  }

  const setApplicantsChild = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'applicants')
    next.set(TAB_PARAM, tab)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }

  const setProgressChild = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'progress')
    next.set(TAB_PARAM, tab)
    if (tab === 'instructors') next.set(SUB_TAB_PARAM, 'instructors')
    else next.delete(SUB_TAB_PARAM)
    if (programId) next.set('programId', programId)
    next.delete(SCHOOL_ID_PARAM)
    next.delete(SCHOOL_TAB_PARAM)
    next.delete(INSTRUCTOR_ID_PARAM)
    next.delete(INSTRUCTOR_TAB_PARAM)
    next.delete(VOLUNTEER_ID_PARAM)
    next.delete(VOLUNTEER_TAB_PARAM)
    setSearchParams(next, { replace: true })
  }

  const setSurveyChild = (tab: GeneralSurveyNavKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'survey')
    next.set(TAB_PARAM, tab)
    if (programId) next.set('programId', programId)
    next.delete(EDIT_PARAM)
    next.delete(SCHOOL_ID_PARAM)
    next.delete(SCHOOL_TAB_PARAM)
    next.delete(INSTRUCTOR_ID_PARAM)
    next.delete(INSTRUCTOR_TAB_PARAM)
    next.delete(VOLUNTEER_ID_PARAM)
    next.delete(VOLUNTEER_TAB_PARAM)
    setSearchParams(next, { replace: true })
  }

  const programSidebarItems = useMemo<DetailModalSidebarNavItem[]>(
    () => {
      if (isTrainedTeachersDetail) {
        return [
          {
            key: 'info',
            label: '프로그램 정보',
            icon: <LnbIconProjectInfo />,
            children: [
              { key: 'info', label: '공통 정보' },
              { key: 'institutions', label: '모집 정보' },
              { key: 'instructors', label: '신청 정보' },
            ],
          },
          { key: 'applicants', label: '기관 신청 목록', icon: <LnbIconApplicants /> },
          { key: 'progress', label: '프로그램 진행 현황', icon: <LnbIconProgress /> },
          ...(surveyMenuItems.length > 0
            ? [
                {
                  key: 'survey',
                  label: '설문 관리',
                  icon: <GeneralLnbSurveyManagementIcon />,
                  children: surveyMenuItems.map(item => ({
                    key: item.key,
                    label: item.label,
                  })),
                },
              ]
            : []),
          { key: 'managers', label: '담당자 정보', icon: <LnbIconManagers /> },
        ]
      }

      if (isCompanySchoolDetail) {
        const hideApplicants = disabledLnbKeys.has('institution_applications')
        const hideInstructorApps = disabledLnbKeys.has('instructor_applications')
        const hideProgress = disabledLnbKeys.has('progress')
        const hideSurvey = disabledLnbKeys.has('survey')
        const hideManagers = disabledLnbKeys.has('managers')
        return [
          {
            key: 'info',
            label: '프로그램 정보',
            icon: <LnbIconProjectInfo />,
            children: [
              { key: 'info', label: '공통 정보' },
              { key: 'institutions', label: '모집 정보' },
              { key: 'instructors', label: '신청 정보' },
            ],
          },
          ...(!hideApplicants
            ? [{ key: 'applicants', label: '기관 신청 목록', icon: <LnbIconApplicants /> }]
            : []),
          ...(!hideInstructorApps
            ? [
                {
                  key: 'applicant_instructors',
                  label: '강사 신청 목록',
                  icon: <LnbIconApplicants />,
                },
              ]
            : []),
          ...(!hideProgress
            ? [
                {
                  key: 'progress',
                  label: '프로그램 진행 현황',
                  icon: <LnbIconProgress />,
                  children: [
                    { key: 'institutions', label: '참여 기관' },
                    { key: 'instructors', label: '참여 강사' },
                  ],
                },
              ]
            : []),
          ...(!hideSurvey && surveyMenuItems.length > 0
            ? [
                {
                  key: 'survey',
                  label: '설문 관리',
                  icon: <GeneralLnbSurveyManagementIcon />,
                  children: surveyMenuItems.map(item => ({
                    key: item.key,
                    label: item.label,
                  })),
                },
              ]
            : []),
          ...(!hideManagers
            ? [{ key: 'managers', label: '담당자 정보', icon: <LnbIconManagers /> }]
            : []),
        ]
      }

      return [
        { key: 'info', label: '프로젝트 정보', icon: <LnbIconProjectInfo /> },
        {
          key: 'applicants',
          label: '신청자 목록',
          icon: <LnbIconApplicants />,
          children: [
            { key: 'institutions', label: '신청 기관' },
            { key: 'instructors', label: '신청 강사' },
            { key: 'volunteers', label: '신청 봉사자' },
          ],
        },
        {
          key: 'progress',
          label: '프로그램 진행 현황',
          icon: <LnbIconProgress />,
          children: [
            { key: 'institutions', label: '참여 기관' },
            { key: 'instructors', label: '참여 강사' },
            { key: 'volunteers', label: '참여 봉사자' },
          ],
        },
        { key: 'managers', label: '담당자 정보', icon: <LnbIconManagers /> },
      ]
    },
    [disabledLnbKeys, isCompanySchoolDetail, isTrainedTeachersDetail, surveyMenuItems]
  )

  const sidebarExpandedGroups = useMemo(
    () =>
      activeLnb === 'info' && isOverviewProgramDetail
        ? (['info'] as const)
        : activeLnb === 'applicants' && !isOverviewProgramDetail
        ? (['applicants'] as const)
        : activeLnb === 'progress' && !isTrainedTeachersDetail
          ? (['progress'] as const)
          : activeLnb === 'survey'
            ? (['survey'] as const)
          : ([] as const),
    [activeLnb, isOverviewProgramDetail, isTrainedTeachersDetail]
  )

  const sidebarActiveChildKey =
    activeLnb === 'info' && isOverviewProgramDetail
      ? activeTab
      : activeLnb === 'applicants'
      ? activeChildMenu
      : activeLnb === 'progress'
        ? activeProgressChild
        : activeLnb === 'survey'
          ? activeSurveyChild
        : ''
  const activeLnbItem = programSidebarItems.find(item => item.key === activeLnb)
  const activeChildItem = activeLnbItem?.children?.find(child => child.key === sidebarActiveChildKey)

  const handleSidebarSelectTop = (key: string) => {
    const k = key as LnbKey
    if (k === 'info' && isOverviewProgramDetail) {
      setLnb('info', 'info')
      return
    }
    if (k === 'applicants') {
      // 프로젝트 정보 등에서 남은 tab=instructors 등이 신청자 목록으로 이월되지 않도록 상위 클릭 시 항상 신청 기관
      setLnb('applicants', 'institutions')
    } else if (k === 'applicant_instructors') {
      setLnb('applicant_instructors', 'instructors')
    } else if (k === 'progress') {
      setLnb(
        'progress',
        isTrainedTeachersDetail
          ? 'institutions'
          : activeLnb === 'progress'
            ? activeProgressChild || 'institutions'
            : 'institutions'
      )
    } else if (k === 'survey') {
      if (activeSurveyChild) setSurveyChild(activeSurveyChild)
      else setLnb('survey')
    } else {
      setLnb(k)
    }
  }

  const handleSidebarSelectChild = (groupKey: string, childKey: string) => {
    if (groupKey === 'info') {
      setActiveTab(childKey as TabKey)
      return
    }
    if (groupKey === 'applicants' && childKey === 'volunteers') {
      window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
      return
    }
    if (groupKey === 'applicants') setApplicantsChild(childKey as TabKey)
    else if (groupKey === 'progress') setProgressChild(childKey as TabKey)
    else if (groupKey === 'survey') setSurveyChild(childKey as GeneralSurveyNavKey)
  }

  const setSchoolId = (id: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (id) {
      next.set(SCHOOL_ID_PARAM, id)
      next.set(SCHOOL_TAB_PARAM, 'application')
      next.delete(INSTRUCTOR_ID_PARAM)
      next.delete(INSTRUCTOR_TAB_PARAM)
      next.delete(VOLUNTEER_ID_PARAM)
      next.delete(VOLUNTEER_TAB_PARAM)
    } else {
      next.delete(SCHOOL_ID_PARAM)
      next.delete(SCHOOL_TAB_PARAM)
    }
    setSearchParams(next, { replace: id == null })
  }

  const setInstructorId = (id: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (id) {
      next.set(INSTRUCTOR_ID_PARAM, id)
      next.set(INSTRUCTOR_TAB_PARAM, 'application')
      next.delete(SCHOOL_ID_PARAM)
      next.delete(SCHOOL_TAB_PARAM)
      next.delete(VOLUNTEER_ID_PARAM)
      next.delete(VOLUNTEER_TAB_PARAM)
    } else {
      next.delete(INSTRUCTOR_ID_PARAM)
      next.delete(INSTRUCTOR_TAB_PARAM)
    }
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: id == null })
  }

  const setVolunteerId = (id: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (id) {
      const prevId = searchParams.get(VOLUNTEER_ID_PARAM)
      next.set(VOLUNTEER_ID_PARAM, id)
      // 동일 봉사자 재진입 시 중첩 탭(volunteerTab)을 application으로 덮어쓰지 않음
      if (prevId !== id) {
        next.set(VOLUNTEER_TAB_PARAM, 'application')
      } else if (!searchParams.get(VOLUNTEER_TAB_PARAM)) {
        next.set(VOLUNTEER_TAB_PARAM, 'application')
      }
      next.delete(SCHOOL_ID_PARAM)
      next.delete(SCHOOL_TAB_PARAM)
      next.delete(INSTRUCTOR_ID_PARAM)
      next.delete(INSTRUCTOR_TAB_PARAM)
    } else {
      next.delete(VOLUNTEER_ID_PARAM)
      next.delete(VOLUNTEER_TAB_PARAM)
    }
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: id == null })
  }

  const setInstructorTab = (tab: InstructorDetailTabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(INSTRUCTOR_TAB_PARAM, tab)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }

  const setVolunteerTab = (tab: VolunteerDetailTabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(VOLUNTEER_TAB_PARAM, tab)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }

  const setSchoolTab = (tab: ParticipatingInstitutionDetailTabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(SCHOOL_TAB_PARAM, normalizeParticipatingInstitutionDetailTab(tab, displayProgram))
    setSearchParams(next, { replace: true })
  }

  // TODO: X는 바깥 모달 닫기로 통일됨. breadcrumb/목록 복귀 외 용도가 없으면 등록부 제거 검토.
  const applicantCloseHandlerRef = useRef<(() => boolean) | null>(null)

  const setActiveTab = (key: TabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'info')
    next.set(TAB_PARAM, key)
    next.delete(SUB_TAB_PARAM)
    next.delete(EDIT_PARAM)
    setSearchParams(next, { replace: true })
  }

  const setEditMode = (tab: TabKey | null) => {
    const next = new URLSearchParams(searchParams)
    if (tab) next.set(EDIT_PARAM, tab)
    else next.delete(EDIT_PARAM)
    setSearchParams(next, { replace: true })
  }

  const [schoolDetailTitle, setSchoolDetailTitle] = useState<string | null>(null)
  const [instructorDetailTitle, setInstructorDetailTitle] = useState<string | null>(null)
  const [volunteerDetailTitle, setVolunteerDetailTitle] = useState<string | null>(null)
  /** 교육받은 교사 — 신청 정보 양식 수정 모달·미리보기 갱신 키 */
  const [trainedTeachersFormEditOpen, setTrainedTeachersFormEditOpen] = useState(false)
  const [trainedTeachersFormPreviewReloadKey, setTrainedTeachersFormPreviewReloadKey] = useState(0)

  useEffect(() => {
    if (!schoolIdFromUrl) setSchoolDetailTitle(null)
  }, [schoolIdFromUrl])

  useEffect(() => {
    if (!instructorIdFromUrl) setInstructorDetailTitle(null)
  }, [instructorIdFromUrl])

  useEffect(() => {
    if (!volunteerIdFromUrl) setVolunteerDetailTitle(null)
  }, [volunteerIdFromUrl])

  const title =
    schoolIdFromUrl && schoolDetailTitle
      ? `참여 기관 상세 (${schoolDetailTitle})`
      : instructorIdFromUrl && instructorDetailTitle
        ? `참여 강사 상세 (${instructorDetailTitle})`
        : volunteerIdFromUrl && volunteerDetailTitle
          ? `참여 봉사자 상세 (${volunteerDetailTitle})`
      : schoolDetailTitle != null && displayProgram
        ? `${displayProgram.title}_${schoolDetailTitle}`
      : instructorDetailTitle != null && displayProgram
        ? `${displayProgram.title}_${instructorDetailTitle}`
        : (displayProgram?.title ?? '프로그램 상세')

  const headerBreadcrumbItems = (() => {
    const listParams = buildSearchParams(searchParams, {
      delete: PROGRAM_DETAIL_QUERY_PARAMS,
    })
    const items = [makeBreadcrumbItem('프로그램 목록', location.pathname, listParams)]

    if (!displayProgram) return items

    const programParams = buildSearchParams(searchParams, {
      delete: PROGRAM_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: 'info',
        [TAB_PARAM]: 'info',
      },
    })

    const nestedDetailLabel =
      schoolIdFromUrl && schoolDetailTitle
        ? schoolDetailTitle
        : instructorIdFromUrl && instructorDetailTitle
          ? instructorDetailTitle
          : volunteerIdFromUrl && volunteerDetailTitle
            ? volunteerDetailTitle
          : searchParams.get(APPLICANT_ID_PARAM)
            ? '신청자 상세'
            : null

    const lnbParams = buildSearchParams(searchParams, {
      delete: [...PROGRAM_NESTED_DETAIL_QUERY_PARAMS, EDIT_PARAM],
      set: {
        programId,
        [LNB_PARAM]: activeLnb,
        [TAB_PARAM]:
          activeLnb === 'applicants'
            ? 'institutions'
            : activeLnb === 'progress'
              ? 'institutions'
              : activeTab,
        [SUB_TAB_PARAM]: null,
      },
    })

    const childParams = activeChildItem
      ? buildSearchParams(searchParams, {
          delete: [...PROGRAM_NESTED_DETAIL_QUERY_PARAMS, EDIT_PARAM],
          set: {
            programId,
            [LNB_PARAM]: activeLnb,
            [TAB_PARAM]: activeChildItem.key,
            [SUB_TAB_PARAM]:
              activeLnb === 'progress' && activeChildItem.key === 'instructors'
                ? 'instructors'
                : null,
          },
        })
      : null

    if (!activeLnbItem) {
      items.push({ label: displayProgram.title })
      return items
    }

    items.push(makeBreadcrumbItem(displayProgram.title, location.pathname, programParams))

    if (!activeChildItem) {
      items.push(
        nestedDetailLabel
          ? makeBreadcrumbItem(activeLnbItem.label, location.pathname, lnbParams)
          : { label: activeLnbItem.label }
      )
    } else {
      const childLabel =
        schoolIdFromUrl && activeChildItem?.key === 'institutions'
          ? '참여 기관 목록'
          : activeChildItem.label
      items.push(
        nestedDetailLabel && childParams
          ? makeBreadcrumbItem(childLabel, location.pathname, childParams)
          : { label: childLabel }
      )
    }

    if (nestedDetailLabel) items.push({ label: nestedDetailLabel })
    return items
  })()

  const isCompanySchoolRecruitmentInfoTab =
    isOverviewProgramDetail && activeLnb === 'info' && activeTab === 'institutions'
  const activeCompanySchoolRecruitTab: GeneralRecruitTabKey =
    isCompanySchoolRecruitmentInfoTab && searchParams.get(SUB_TAB_PARAM) === 'instructors'
      ? 'instructors'
      : 'institutions'
  const isCompanySchoolRecruitmentInstructorTab =
    isCompanySchoolRecruitmentInfoTab && activeCompanySchoolRecruitTab === 'instructors'

  /** 공통정보 탭 수정 모드: 이 때만 `infoForm` 을 자식에 넘김 (RHF + Zod 단일 스키마) */
  const isEditModeInfo = activeTab === 'info' && editTab === 'info' && !!displayProgram
  const infoForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInfo,
  })
  const { resetToProgram: infoResetToProgram } =
    useProgramDetailInfoSave({
      form: infoForm,
      program: displayProgram ?? ({} as Program),
      onSaveEdit:
        displayProgram
          ? async draft => {
              try {
                const { id: _id, createdAt: _c, ...patch } = draft
                await persistProgramPatch(draft, patch)
                setEditMode(null)
              } catch (error) {
                handleError(error, { context: 'programDetailFullpageModal.saveEdit' })
              }
            }
          : undefined,
    })

  const isEditModeInstitutions =
    activeTab === 'institutions' && editTab === 'institutions' && !!displayProgram
  const institutionsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInstitutions,
    schema: programDetailInstitutionsEditSchema,
  })
  const {
    resetToProgram: institutionsResetToProgram,
    registerGetAdditionalContentHtml: registerInstitutionsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: institutionsForm,
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await persistProgramPatch(draft, patch)
              setEditMode(null)
            } catch (error) {
              handleError(error, { context: 'programDetailFullpageModal.saveEdit' })
            }
          }
        : undefined,
  })

  const isEditModeInstructors =
    (activeTab === 'instructors' || isCompanySchoolRecruitmentInstructorTab) &&
    editTab === 'instructors' &&
    !!displayProgram
  const instructorsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInstructors,
  })
  const {
    resetToProgram: instructorsResetToProgram,
    registerGetAdditionalContentHtml: registerInstructorsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: instructorsForm,
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await persistProgramPatch(draft, patch)
              setEditMode(null)
            } catch (error) {
              handleError(error, { context: 'programDetailFullpageModal.saveEdit' })
            }
          }
        : undefined,
  })

  const handleInfoEdit = () => {
    if (activeTab === 'info' && displayProgram) {
      infoResetToProgram()
      setEditMode('info')
      return
    }
    if (isCompanySchoolRecruitmentInstructorTab && displayProgram) {
      instructorsResetToProgram()
      setEditMode('instructors')
      return
    }
    if (activeTab === 'institutions' && displayProgram) {
      institutionsResetToProgram()
      setEditMode('institutions')
      return
    }
    if (activeTab === 'instructors' && displayProgram) {
      instructorsResetToProgram()
      setEditMode('instructors')
      return
    }
    if (activeTab === 'volunteers' && displayProgram) {
      volunteersResetToProgram()
      setEditMode('volunteers')
      return
    }
    if (displayProgram) {
      onClose()
      navigate(getProgramAdminDetailUrlFromPathname(displayProgram.id, location.pathname))
    }
  }

  const handleInfoExit = () => {
    infoResetToProgram()
    setEditMode(null)
  }

  const handleInstitutionsExit = () => {
    institutionsResetToProgram()
    setEditMode(null)
  }

  const handleInstructorsExit = () => {
    instructorsResetToProgram()
    setEditMode(null)
  }

  const isEditModeVolunteers =
    activeTab === 'volunteers' && editTab === 'volunteers' && !!displayProgram
  const volunteersForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeVolunteers,
  })
  const {
    resetToProgram: volunteersResetToProgram,
    registerGetAdditionalContentHtml: registerVolunteersAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: volunteersForm,
    program: displayProgram ?? ({} as Program),
    onSaveEdit:
      displayProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await persistProgramPatch(draft, patch)
              setEditMode(null)
            } catch (error) {
              handleError(error, { context: 'programDetailFullpageModal.saveEdit' })
            }
          }
        : undefined,
  })

  const handleVolunteersExit = () => {
    volunteersResetToProgram()
    setEditMode(null)
  }

  const handlePreview = () => {
    if (displayProgram) {
      window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
    }
  }

  const handleCompanySchoolRecruitTabChange = (tab: GeneralRecruitTabKey) => {
    if (tab === 'volunteers') return
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'info')
    next.set(TAB_PARAM, 'institutions')
    if (tab === 'instructors') next.set(SUB_TAB_PARAM, 'instructors')
    else next.delete(SUB_TAB_PARAM)
    next.delete(EDIT_PARAM)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }
  const handleCompanySchoolRecruitSave = () => {
    if (activeCompanySchoolRecruitTab === 'instructors') {
      handleInstructorsExit()
      return
    }
    handleInstitutionsExit()
  }
  const isCompanySchoolApplicationInfoTab =
    isOverviewProgramDetail && activeLnb === 'info' && activeTab === 'instructors'
  const isTrainedTeachersApplicationInfoTab =
    isTrainedTeachersDetail && isCompanySchoolApplicationInfoTab
  const activeCompanySchoolApplicationTab: CompanySchoolApplicationInfoTabKey =
    searchParams.get(SUB_TAB_PARAM) === 'instructors' ? 'instructors' : 'institutions'
  const handleCompanySchoolApplicationTabChange = (tab: CompanySchoolApplicationInfoTabKey) => {
    const next = new URLSearchParams(searchParams)
    next.set(LNB_PARAM, 'info')
    next.set(TAB_PARAM, 'instructors')
    if (tab === 'instructors') next.set(SUB_TAB_PARAM, 'instructors')
    else next.delete(SUB_TAB_PARAM)
    next.delete(EDIT_PARAM)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }

  if (!open) return null

  const pNorm = location.pathname.replace(/\/$/, '') || '/'
  const isOverviewListProgram =
    pNorm === '/programs/general' ||
    pNorm.startsWith('/programs/general/') ||
    pNorm === '/programs/economy-education' ||
    pNorm.startsWith('/programs/economy-education/') ||
    pNorm === '/programs/company-school' ||
    pNorm.startsWith('/programs/company-school/') ||
    pNorm === '/programs/trained-teachers' ||
    pNorm.startsWith('/programs/trained-teachers/') ||
    (displayProgram != null &&
      (getGeneralPrograms().some(pr => pr.id === displayProgram.id) ||
        getEconomyPrograms().some(pr => pr.id === displayProgram.id) ||
        getTrainedTeachersPrograms().some(pr => pr.id === displayProgram.id)))

  return (
    <>
      <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={title}
      headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
      className={[
        'program-detail-fullpage-modal',
        isOverviewListProgram && 'program-detail-fullpage-modal--program-list-overview',
      ]
        .filter(Boolean)
        .join(' ')}
      closeAriaLabel="닫기"
      sidebar={
        <DetailModalSidebar
          navAriaLabel="프로그램 상세 메뉴"
          items={programSidebarItems}
          activeKey={activeLnb}
          activeChildKey={sidebarActiveChildKey}
          expandedGroupKeys={sidebarExpandedGroups}
          onSelectTop={handleSidebarSelectTop}
          onSelectChild={handleSidebarSelectChild}
        />
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
          {activeLnb === 'info' && isCompanySchoolRecruitmentInfoTab && (
            <GeneralProgramRecruitmentView
              program={displayProgram}
              activeRecruitTab={activeCompanySchoolRecruitTab}
              onRecruitTabChange={handleCompanySchoolRecruitTabChange}
              showInstructorTab
              showVolunteerTab={false}
              showParticipantRecruitmentMethod
              canWrite
              isEditModeInstitutions={isEditModeInstitutions}
              institutionsForm={isEditModeInstitutions ? institutionsForm : undefined}
              registerInstitutionsAdditionalHtml={registerInstitutionsAdditionalHtml}
              isEditModeInstructors={isEditModeInstructors}
              instructorsForm={isEditModeInstructors ? instructorsForm : undefined}
              registerInstructorsAdditionalHtml={registerInstructorsAdditionalHtml}
              isEditModeVolunteers={false}
              volunteersForm={undefined}
              registerVolunteersAdditionalHtml={registerVolunteersAdditionalHtml}
              onEdit={handleInfoEdit}
              onSave={handleCompanySchoolRecruitSave}
            />
          )}

          {activeLnb === 'info' && isTrainedTeachersApplicationInfoTab && (
            <TrainedTeachersApplicationInfoView
              program={displayProgram}
              canWrite
              onEditForm={() => setTrainedTeachersFormEditOpen(true)}
              previewReloadKey={trainedTeachersFormPreviewReloadKey}
            />
          )}

          {activeLnb === 'info' &&
            isCompanySchoolApplicationInfoTab &&
            !isTrainedTeachersApplicationInfoTab && (
            <CompanySchoolApplicationInfoView
              activeTab={activeCompanySchoolApplicationTab}
              onTabChange={handleCompanySchoolApplicationTabChange}
            />
          )}

          {activeLnb === 'info' &&
            isTrainedTeachersDetail &&
            !isCompanySchoolRecruitmentInfoTab &&
            !isCompanySchoolApplicationInfoTab && (
            <TrainedTeachersCommonInfoView
              program={displayProgram}
              sponsorName={sponsorName}
              isEditMode={isEditModeInfo}
              onEdit={handleInfoEdit}
              onSave={handleInfoExit}
              persistPending={updateTrainedTeacherInfoDetailMutation.isPending}
              onPersist={
                trainedTeacherRemoteEnabled && displayProgram
                  ? async payload => {
                      try {
                        await updateTrainedTeacherInfoDetailMutation.mutateAsync({
                          programId: displayProgram.id,
                          payload: {
                            educatedTeachers: payload.educatedTeachers,
                            commonInfo: {
                              ...displayProgram.generalCommonInfo,
                              ...payload.commonInfo,
                            },
                          },
                        })
                      } catch (error) {
                        handleError(error, {
                          context: 'programDetailFullpageModal.trainedTeacherInfoSave',
                        })
                        throw error
                      }
                    }
                  : undefined
              }
            />
          )}

          {activeLnb === 'info' &&
            !isTrainedTeachersDetail &&
            !isCompanySchoolRecruitmentInfoTab &&
            !isCompanySchoolApplicationInfoTab && (
            <ProjectInfoDetailPanels
              program={displayProgram}
              sponsorName={sponsorName}
              isBodyLoading={loading && !displayProgram}
              hideTabsRow={isOverviewProgramDetail}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isEditModeInfo={isEditModeInfo}
              infoForm={isEditModeInfo ? infoForm : undefined}
              isEditModeInstitutions={isEditModeInstitutions}
              institutionsForm={isEditModeInstitutions ? institutionsForm : undefined}
              registerInstitutionsAdditionalHtml={registerInstitutionsAdditionalHtml}
              isEditModeInstructors={isEditModeInstructors}
              instructorsForm={isEditModeInstructors ? instructorsForm : undefined}
              registerInstructorsAdditionalHtml={registerInstructorsAdditionalHtml}
              isEditModeVolunteers={isEditModeVolunteers}
              volunteersForm={isEditModeVolunteers ? volunteersForm : undefined}
              registerVolunteersAdditionalHtml={registerVolunteersAdditionalHtml}
              onInfoEdit={handleInfoEdit}
              onInfoSave={handleInfoExit}
              onInstitutionsSave={handleInstitutionsExit}
              onInstructorsSave={handleInstructorsExit}
              onVolunteersSave={handleVolunteersExit}
              onPreview={handlePreview}
            />
          )}

          {(activeLnb === 'applicants' || activeLnb === 'applicant_instructors') &&
            (isOverviewProgramDetail && activeLnb === 'applicants' ? (
              <div className="participant-applications">
                <ApplicantList
                  menu={activeChildMenu || 'institutions'}
                  program={displayProgram ?? null}
                  programId={displayProgram.id}
                  filterFields={generalOrganizationApplicationFilterFields}
                  institutionColumnPreset="company-school"
                  detailVariant="general"
                  onRegisterApplicantCloseHandler={fn => {
                    applicantCloseHandlerRef.current = fn
                  }}
                />
              </div>
            ) : isCompanySchoolDetail && activeLnb === 'applicant_instructors' ? (
              <div className="participant-applications general-instructor-applications">
                <ApplicantList
                  menu="instructors"
                  program={displayProgram ?? null}
                  programId={displayProgram.id}
                  listTitle="강사 신청 목록"
                  instructorColumnPreset="general-detail"
                  detailVariant="general"
                  onRegisterApplicantCloseHandler={fn => {
                    applicantCloseHandlerRef.current = fn
                  }}
                />
              </div>
            ) : (
              <ApplicantList
                menu={activeChildMenu || 'institutions'}
                program={displayProgram ?? null}
                programId={displayProgram.id}
                institutionColumnPreset={isOverviewProgramDetail ? 'company-school' : undefined}
                detailVariant="legacy"
                onRegisterApplicantCloseHandler={fn => {
                  applicantCloseHandlerRef.current = fn
                }}
              />
            ))}

          {activeLnb === 'managers' && displayProgram?.id && (
            <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
              <ProgramManagersTab programId={displayProgram.id} />
            </div>
          )}

          {activeLnb === 'survey' && activeSurveyChild && (
            <GeneralSurveyManagementView program={displayProgram} activeTab={activeSurveyChild} />
          )}

          {activeLnb === 'progress' && (
            <div className="program-detail-fullpage-modal__info-tab">
              {activeProgressChild === 'institutions' && (
                <ParticipatingInstitutionsSection
                  programId={displayProgram?.id}
                  program={displayProgram}
                  schoolIdFromUrl={schoolIdFromUrl}
                  schoolTabFromUrl={activeSchoolTab}
                  onSchoolTabChange={setSchoolTab}
                  onSchoolRowClick={row => setSchoolId(row.id)}
                  onClearSchoolId={() => setSchoolId(null)}
                  onSchoolDetailOpen={name => setSchoolDetailTitle(name)}
                  onSchoolDetailClose={() => setSchoolDetailTitle(null)}
                />
              )}
              {activeProgressChild === 'instructors' && (
                <ParticipatingInstructorsSection
                  programId={displayProgram?.id}
                  program={displayProgram}
                  instructorIdFromUrl={instructorIdFromUrl}
                  instructorTabFromUrl={activeInstructorTab}
                  onInstructorTabChange={setInstructorTab}
                  onInstructorRowClick={row => setInstructorId(row.id)}
                  onClearInstructorId={() => setInstructorId(null)}
                  onInstructorDetailOpen={name => setInstructorDetailTitle(name)}
                  onInstructorDetailClose={() => setInstructorDetailTitle(null)}
                />
              )}
              {activeProgressChild === 'volunteers' && (
                <ParticipatingVolunteersSection
                  programId={displayProgram?.id}
                  program={displayProgram}
                  volunteerIdFromUrl={volunteerIdFromUrl}
                  volunteerTabFromUrl={activeVolunteerTab}
                  onVolunteerTabChange={setVolunteerTab}
                  onVolunteerRowClick={row => setVolunteerId(row.id)}
                  onClearVolunteerId={() => setVolunteerId(null)}
                  onVolunteerDetailOpen={name => setVolunteerDetailTitle(name)}
                  onVolunteerDetailClose={() => setVolunteerDetailTitle(null)}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
      )}
      </DetailFullPageModal>
      {/* 닫힌 상태로 mount하면 수정 모달 effect가 미리보기의 기관 신청 브리지를 초기화하므로 open일 때만 렌더 */}
      {isTrainedTeachersDetail && displayProgram && trainedTeachersFormEditOpen ? (
        <GeneralProgramApplicationTemplateEditModal
          open
          program={displayProgram}
          applicationTab="institutions"
          variantOverride="trained-teachers-application-institution"
          onClose={() => {
            setTrainedTeachersFormEditOpen(false)
            // 모달 unmount 시 브리지가 초기화되므로 미리보기를 remount해 재연동
            setTrainedTeachersFormPreviewReloadKey(key => key + 1)
          }}
          onSaved={() => setTrainedTeachersFormPreviewReloadKey(key => key + 1)}
        />
      ) : null}
    </>
  )
}
