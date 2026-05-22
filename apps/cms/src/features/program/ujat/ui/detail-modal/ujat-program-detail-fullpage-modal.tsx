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
import { UjatEducationProgressInstitutionsSection } from './progress/institutions/ujat-education-progress-institutions-section'
import { UjatEducationProgressVolunteersSection } from './progress/volunteers/ujat-education-progress-volunteers-section'
import { UjatEducationProgressVolunteerAddRegistrationView } from './progress/volunteers/ujat-education-progress-volunteer-add-registration-view'
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
  isUjatEducationProgressVolunteersTab,
  type UjatDetailLnbKey,
  type UjatEducationProgressInstitutionDetailTab,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
import { isUjatVolunteerApplicantInTabList } from './application-volunteer/screening/ujat-volunteer-applicant-detail-url'
import {
  educationProgressHalfFromTab,
  isEducationProgressInstitutionsTab,
  isUjatEducationProgressInstitutionInList,
} from './progress/institutions/detail/ujat-education-progress-institution-detail-url'
import { getUjatEducationProgressInstitutionName } from './progress/institutions/detail/ujat-education-progress-institution-detail-mock'
import { UjatEducationProgressInstitutionDetailPage } from './progress/institutions/detail/ujat-education-progress-institution-detail-page'
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
} from './progress/ujat-education-progress-tabs'
import {
  isValidUjatInstitutionAppTab,
  UJAT_INSTITUTION_APP_CHILD_ROWS,
} from './application-institution/tabs'
import { programDetailInstitutionsEditSchema } from '@/features/program/shared/model/program-detail-edit-schema'
import { CmsButton } from '@/shared/ui'
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
import '@toast-ui/editor/dist/toastui-editor.css'
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
] as const

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
      next.delete(UJAT_APPLICANT_ID_PARAM)
      next.delete(UJAT_INST_APP_ID_PARAM)
      next.delete(EDIT_PARAM)
      setSearchParams(next, { replace: id == null })
    },
    [programId, searchParams, setSearchParams]
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
  const [volunteerApplicantDetailTitle, setVolunteerApplicantDetailTitle] = useState<string | null>(
    null
  )

  useEffect(() => {
    const isVolunteerDocScreening = activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2'
    const isVolunteerApplicantTab =
      activeTab === 'vh1_doc1' ||
      activeTab === 'vh2_doc1' ||
      activeTab === 'vh1_doc_passed' ||
      activeTab === 'vh2_doc_passed' ||
      activeTab === 'vh1_interview2' ||
      activeTab === 'vh2_interview2' ||
      activeTab === 'vh1_interview2' ||
      activeTab === 'vh2_interview2'
    if (!isVolunteerDocScreening || !isVolunteerApplicantTab) {
      setVolunteerApplicantDetailTitle(null)
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
    navigate(
      { pathname: location.pathname, search: next.toString() ? `?${next}` : '' },
      {
        replace: true,
      }
    )
  }, [location.pathname, navigate, onClose, searchParams])

  const volAddMemberId = open ? searchParams.get(UJAT_VOL_ADD_MEMBER_ID_PARAM) : null

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
    const isVolunteerDocScreening = activeLnb === 'volunteer_h1' || activeLnb === 'volunteer_h2'
    const isVolunteerApplicantTab =
      activeTab === 'vh1_doc1' ||
      activeTab === 'vh2_doc1' ||
      activeTab === 'vh1_doc_passed' ||
      activeTab === 'vh2_doc_passed' ||
      activeTab === 'vh1_interview2' ||
      activeTab === 'vh2_interview2'
    if (
      isVolunteerDocScreening &&
      isVolunteerApplicantTab &&
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
      : volunteerApplicantDetailTitle ??
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
        : volunteerApplicantDetailTitle
          ? volunteerApplicantDetailTitle
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
        volAddMemberId || institutionDetailId || eduInstitutionDetailId ? '목록으로' : '닫기'
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
                onVolunteerApplicantDetailTitleChange={setVolunteerApplicantDetailTitle}
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
                onVolunteerApplicantDetailTitleChange={setVolunteerApplicantDetailTitle}
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
                onVolunteerApplicantDetailTitleChange={setVolunteerApplicantDetailTitle}
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
              ) : (
                <UjatEducationProgressVolunteersSection
                  half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
                  onStartAddRegistration={openVolAddRegistration}
                  onBindRegisterVolunteer={register => {
                    registerVolunteerFromMemberRef.current = register
                  }}
                />
              )}
            </div>
          )}
          {activeLnb === 'education_progress' &&
            /^edu_h[12]_(region|attendance|assignments)$/.test(activeTab) && (
              <UjatPlaceholderSection
                title={educationProgressScreenTitle(activeTab)}
                description="해당 기능 화면이 연결되면 이 영역에 표시됩니다."
              />
            )}
          {activeLnb === 'education_progress' && activeTab === 'edu_summary' && (
            <UjatPlaceholderSection
              title="교육 진행 요약"
              description="교육 진행 현황을 요약해 보여주는 화면입니다."
            />
          )}

          {activeLnb === 'survey' && (
            <UjatPlaceholderSection
              title={surveyItems.find(s => s.key === activeTab)?.label ?? '설문'}
              description="설문 관리 화면입니다. 목 데이터 연동 후 설문 항목별 콘텐츠가 표시됩니다."
            />
          )}

          {activeLnb === 'managers' && (
            <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
              <ProgramManagersTab programId={displayProgram.id} />
            </div>
          )}
        </>
      ) : (
        <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
      )}
    </DetailFullPageModal>
  )
}
