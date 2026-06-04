/**
 * 일반 프로그램 상세 풀페이지 모달 — `/programs/general?programId=…&lnb=…&tab=…`
 * LNB·breadcrumb·queryParam 복원만 구성 (본문 화면은 추후 API 연동)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { buildSearchParams, makeBreadcrumbItem } from '@/shared/lib/detail-fullpage-query-stack'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import type { Program } from '@/types/domain'
import {
  GENERAL_ORGANIZATION_APPLICATIONS_LNB_LABEL,
  getGeneralParticipantApplicationsLnbLabel,
  getGeneralSurveyMenuItems,
  getGeneralVolunteerInterviewEnabled,
  hasGeneralInstructorApplications,
  hasGeneralVolunteerApplications,
  resolveGeneralProgramForDetail,
  type GeneralSurveyMenuItem,
} from '@/features/program/general/lib/detail-meta'
import { resolveGeneralProgramDisplayTitle } from '@/features/program/general/lib/detail-common-info-display'
import {
  parseGeneralDetailLnb,
  type GeneralDetailLnbKey,
} from '@/features/program/general/lib/detail-url'
import { useGeneralProgramCommonInfoEditForm } from '@/features/program/general/hooks/use-common-info-edit-form'
import { useGeneralProgramCommonInfoSave } from '@/features/program/general/hooks/use-common-info-save'
import { GeneralProgramDetailSidebar } from './detail-sidebar'
import { GeneralProgramDetailCommonInfoView } from './info/common-info-view'
import { GeneralProgramRecruitmentView } from './info/recruitment-view'
import { GeneralProgramApplicationView } from './info/application-view'
import { GeneralProgramApplicationTemplateEditModal } from './info/application-template-edit-modal'
import {
  normalizeGeneralRecruitTab,
  type GeneralRecruitTabKey,
} from '@/features/program/general/lib/recruitment-tabs'
import {
  normalizeGeneralApplicationTab,
  type GeneralApplicationTabKey,
} from '@/features/program/general/lib/application-tabs'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '@/features/program/general/hooks/use-program-detail-info-save'
import { programDetailInstitutionsEditSchema } from '@/features/program/shared/model/program-detail-edit-schema'
import { GeneralSurveyManagementView } from './survey-management/survey-management-view'
import { ProgramManagersTab } from '../program-managers-tab'
import { GeneralParticipantApplicationsView } from './applications/participant-applications-view'
import { GeneralInstructorApplicationsView } from './applications/general-instructor-applications-view'
import { GeneralVolunteerApplicationsView } from './applications/general-volunteer-applications-view'
import { isGeneralVolunteerApplicantDetailRoute } from '@/features/program/general/lib/general-volunteer-applications'
import type { UjatVolunteerApplicantDetailMeta } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/use-ujat-volunteer-applicant-detail'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import { APPLICANT_ID_PARAM } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-constants'
import { ProgramDetailSponsorDetailOverlay } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-detail-overlay'
import { ParticipatingInstitutionsSection } from './program-status/participating-institutions-section'
import { ParticipatingInstructorsSection } from './program-status/participating-instructors-section'
import {
  GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS,
  normalizeGeneralParticipatingInstitutionDetailTab,
  type GeneralParticipatingInstitutionDetailTabKey,
} from '../general-participating-institution-detail-view'
import {
  INSTRUCTOR_DETAIL_TAB_KEYS,
  type InstructorDetailTabKey,
} from './program-status/participating-instructor-fullpage-view'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import './detail-fullpage-modal.css'

const TAB_PARAM = 'tab'
const LNB_PARAM = 'lnb'
const EDIT_PARAM = 'edit'
const SCHOOL_ID_PARAM = 'schoolId'
const SCHOOL_TAB_PARAM = 'schoolTab'
const INSTRUCTOR_ID_PARAM = 'instructorId'
const INSTRUCTOR_TAB_PARAM = 'instructorTab'

const GENERAL_PROGRESS_NESTED_QUERY_PARAMS = [
  SCHOOL_ID_PARAM,
  SCHOOL_TAB_PARAM,
  INSTRUCTOR_ID_PARAM,
  INSTRUCTOR_TAB_PARAM,
  'progressCalendarRange',
  'schoolName',
  'institutionSido',
  'institutionSigungu',
  'educationGrade',
  'textbookStatus',
  'teacherName',
] as const

const GENERAL_DETAIL_QUERY_PARAMS = [
  'programId',
  LNB_PARAM,
  TAB_PARAM,
  EDIT_PARAM,
  APPLICANT_ID_PARAM,
  'detailTab',
  ...GENERAL_PROGRESS_NESTED_QUERY_PARAMS,
] as const

function parseSchoolTabFromSearch(
  searchParams: URLSearchParams
): GeneralParticipatingInstitutionDetailTabKey {
  const t = searchParams.get(SCHOOL_TAB_PARAM)
  if (t && (GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS as readonly string[]).includes(t))
    return normalizeGeneralParticipatingInstitutionDetailTab(
      t as GeneralParticipatingInstitutionDetailTabKey
    )
  return 'application'
}

function parseInstructorTabFromSearch(searchParams: URLSearchParams): InstructorDetailTabKey {
  const t = searchParams.get(INSTRUCTOR_TAB_PARAM)
  if (t && (INSTRUCTOR_DETAIL_TAB_KEYS as readonly string[]).includes(t)) {
    if (t === 'settlement') return 'application'
    return t as InstructorDetailTabKey
  }
  return 'application'
}

const INFO_TABS = ['info', 'recruitment', 'application'] as const
const VOLUNTEER_INTERVIEW_TABS = ['vol_doc1', 'vol_doc_passed', 'vol_interview2'] as const
const PROGRESS_TABS = [
  'progress_institutions',
  'progress_instructors',
  'progress_volunteers',
] as const

export interface GeneralProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  program: Program | null
  programIdHint?: string | null
}

function defaultTabForLnb(
  lnb: GeneralDetailLnbKey,
  interview: boolean,
  surveyKeys: string[]
): string {
  switch (lnb) {
    case 'info':
      return 'info'
    case 'institution_applications':
    case 'instructor_applications':
      return 'main'
    case 'volunteer_applications':
      return interview ? 'vol_doc1' : 'vol_all'
    case 'progress':
      return 'progress_institutions'
    case 'survey':
      return surveyKeys[0] ?? 'main'
    case 'managers':
      return 'main'
    default:
      return 'info'
  }
}

function isVolunteerTabValid(tab: string, interview: boolean): boolean {
  if (!interview) return tab === 'vol_all' || tab === 'main'
  return (VOLUNTEER_INTERVIEW_TABS as readonly string[]).includes(tab)
}

function normalizeGeneralDetailParams(
  programId: string,
  searchParams: URLSearchParams,
  program: Program
): URLSearchParams | null {
  const interview = getGeneralVolunteerInterviewEnabled(program)
  const surveyKeys = getGeneralSurveyMenuItems(program).map(s => s.key)
  const showInstructor = hasGeneralInstructorApplications(program)
  const showVolunteer = hasGeneralVolunteerApplications(program)

  const next = new URLSearchParams(searchParams)
  next.set('programId', programId)

  let lnb: GeneralDetailLnbKey = parseGeneralDetailLnb(searchParams) ?? 'info'
  let tab = searchParams.get(TAB_PARAM) ?? ''

  const setInvalid = (l: GeneralDetailLnbKey, t: string) => {
    lnb = l
    tab = t
  }

  if (tab === '') {
    tab = defaultTabForLnb(lnb, interview, surveyKeys)
  }

  if (lnb === 'info') {
    if (!(INFO_TABS as readonly string[]).includes(tab)) {
      setInvalid('info', 'info')
    }
  } else if (lnb === 'institution_applications') {
    if (tab !== 'main') setInvalid('institution_applications', 'main')
  } else if (lnb === 'instructor_applications') {
    if (!showInstructor) setInvalid('info', 'info')
    else if (tab !== 'main') setInvalid('instructor_applications', 'main')
  } else if (lnb === 'volunteer_applications') {
    if (!showVolunteer) setInvalid('info', 'info')
    else if (!isVolunteerTabValid(tab, interview)) {
      setInvalid(
        'volunteer_applications',
        defaultTabForLnb('volunteer_applications', interview, surveyKeys)
      )
    }
  } else if (lnb === 'progress') {
    if (!(PROGRESS_TABS as readonly string[]).includes(tab)) {
      setInvalid('progress', 'progress_institutions')
    }
  } else if (lnb === 'survey') {
    if (surveyKeys.length === 0) {
      if (tab !== 'main') setInvalid('survey', 'main')
    } else if (!(surveyKeys as readonly string[]).includes(tab)) {
      setInvalid('survey', surveyKeys[0] ?? 'main')
    }
  } else if (lnb === 'managers') {
    if (tab !== 'main') setInvalid('managers', 'main')
  }

  if (next.get(LNB_PARAM) !== lnb) next.set(LNB_PARAM, lnb)
  if (next.get(TAB_PARAM) !== tab) next.set(TAB_PARAM, tab)

  const changed =
    searchParams.get('programId') !== programId ||
    searchParams.get(LNB_PARAM) !== lnb ||
    searchParams.get(TAB_PARAM) !== tab

  return changed ? next : null
}

function generalLnbBreadcrumbLabel(
  lnb: GeneralDetailLnbKey,
  participantApplicationsLnbLabel: string
): string {
  switch (lnb) {
    case 'info':
      return '프로그램 정보'
    case 'institution_applications':
      return participantApplicationsLnbLabel
    case 'instructor_applications':
      return '강사 신청 목록'
    case 'volunteer_applications':
      return '봉사자 신청 목록'
    case 'progress':
      return '프로그램 진행 현황'
    case 'survey':
      return '설문 관리'
    case 'managers':
      return '담당자 정보'
    default:
      return '프로그램 정보'
  }
}

function generalChildBreadcrumbLabel(
  lnb: GeneralDetailLnbKey,
  tab: string,
  surveyItems: GeneralSurveyMenuItem[]
): string | null {
  if (lnb === 'info') {
    if (tab === 'info') return '공통 정보'
    if (tab === 'recruitment') return '모집 정보'
    if (tab === 'application') return '신청 정보'
    return null
  }
  if (lnb === 'volunteer_applications') {
    if (tab === 'vol_doc1') return '1차 서류 심사 대상자'
    if (tab === 'vol_doc_passed') return '1차 서류 합격자'
    if (tab === 'vol_interview2') return '2차 면접 대상자'
    return null
  }
  if (lnb === 'progress') {
    if (tab === 'progress_institutions') return '참여 기관 목록'
    if (tab === 'progress_instructors') return '참여 강사'
    if (tab === 'progress_volunteers') return '참여 봉사자'
    return null
  }
  if (lnb === 'survey') {
    return surveyItems.find(item => item.key === tab)?.label ?? null
  }
  return null
}

function generalLnbBreadcrumbTargetTab(
  lnb: GeneralDetailLnbKey,
  activeTab: string,
  interview: boolean,
  surveyKeys: string[]
): string {
  if (lnb === 'volunteer_applications' && interview) {
    if ((VOLUNTEER_INTERVIEW_TABS as readonly string[]).includes(activeTab)) return activeTab
    return 'vol_doc1'
  }
  return defaultTabForLnb(lnb, interview, surveyKeys)
}

export function GeneralProgramDetailFullPageModal({
  open,
  onClose,
  program,
  programIdHint = null,
}: GeneralProgramDetailFullPageModalProps) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id ?? programIdHint ?? searchParams.get('programId') ?? undefined

  const {
    program: detailProgram,
    loading,
    sponsorName,
    canWrite,
    updateProgram,
    setSelectedProgram,
  } = useProgramDetail(open ? programId : undefined)
  const displayProgram = useMemo(() => {
    return (
      detailProgram ??
      program ??
      (programId ? (resolveGeneralProgramForDetail(programId) ?? null) : null)
    )
  }, [detailProgram, program, programId])

  const interviewEnabled = displayProgram
    ? getGeneralVolunteerInterviewEnabled(displayProgram)
    : false
  const surveyItems = useMemo(
    () => (displayProgram ? getGeneralSurveyMenuItems(displayProgram) : []),
    [displayProgram]
  )
  const surveyKeys = useMemo(() => surveyItems.map(s => s.key), [surveyItems])
  const showInstructorApplications = displayProgram
    ? hasGeneralInstructorApplications(displayProgram)
    : false
  const showVolunteerApplications = displayProgram
    ? hasGeneralVolunteerApplications(displayProgram)
    : false
  const participantApplicationsLnbLabel = useMemo(
    () =>
      displayProgram
        ? getGeneralParticipantApplicationsLnbLabel(displayProgram)
        : GENERAL_ORGANIZATION_APPLICATIONS_LNB_LABEL,
    [displayProgram]
  )

  const activeLnb: GeneralDetailLnbKey = open
    ? (parseGeneralDetailLnb(searchParams) ?? 'info')
    : 'info'
  const activeTab = open ? (searchParams.get(TAB_PARAM) ?? 'info') : 'info'
  const editTab = open ? searchParams.get(EDIT_PARAM) : null
  const schoolIdFromUrl = open ? searchParams.get(SCHOOL_ID_PARAM) : null
  const activeSchoolTab = schoolIdFromUrl ? parseSchoolTabFromSearch(searchParams) : 'application'
  const instructorIdFromUrl = open ? searchParams.get(INSTRUCTOR_ID_PARAM) : null
  const activeInstructorTab = instructorIdFromUrl
    ? parseInstructorTabFromSearch(searchParams)
    : 'application'

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

  const isEditModeInfo =
    open && activeLnb === 'info' && activeTab === 'info' && editTab === 'info' && !!displayProgram

  const infoForm = useGeneralProgramCommonInfoEditForm({
    program: displayProgram,
    isEditMode: isEditModeInfo,
  })
  const { triggerSave: infoTriggerSave, resetToProgram: infoResetToProgram } =
    useGeneralProgramCommonInfoSave({
      form: infoForm,
      program: displayProgram ?? null,
      onSaveEdit: displayProgram
        ? async draft => {
            try {
              const { id: _id, createdAt: _c, ...patch } = draft
              await updateProgram(draft.id, patch)
            } catch {
              // API 연동 전 — 일반 프로그램 mock은 선택 프로그램 store에만 반영
              setSelectedProgram(draft)
            }
          }
        : undefined,
    })

  const handleInfoEdit = useCallback(() => {
    if (activeLnb !== 'info' || activeTab !== 'info' || !displayProgram) return
    infoResetToProgram()
    setEditMode('info')
  }, [activeLnb, activeTab, displayProgram, infoResetToProgram, setEditMode])

  const handleInfoSave = useCallback(async () => {
    if (!displayProgram) return
    const isValid = await infoForm.trigger()
    if (!isValid) return
    setEditMode(null)
    void infoTriggerSave()
  }, [displayProgram, infoForm, infoTriggerSave, setEditMode])

  const [recruitSubTab, setRecruitSubTab] = useState<GeneralRecruitTabKey>('institutions')

  useEffect(() => {
    setRecruitSubTab(prev =>
      normalizeGeneralRecruitTab(prev, {
        showInstructor: showInstructorApplications,
        showVolunteer: showVolunteerApplications,
      })
    )
  }, [showInstructorApplications, showVolunteerApplications])

  const handleRecruitSubTabChange = useCallback(
    (tab: GeneralRecruitTabKey) => {
      setRecruitSubTab(tab)
      if (editTab) setEditMode(null)
    },
    [editTab, setEditMode]
  )

  const [applicationSubTab, setApplicationSubTab] =
    useState<GeneralApplicationTabKey>('institutions')
  const [applicationTemplateEditOpen, setApplicationTemplateEditOpen] = useState(false)
  const [applicationPreviewReloadKey, setApplicationPreviewReloadKey] = useState(0)

  useEffect(() => {
    setApplicationSubTab(prev =>
      normalizeGeneralApplicationTab(prev, {
        showInstructor: showInstructorApplications,
        showVolunteer: showVolunteerApplications,
      })
    )
  }, [showInstructorApplications, showVolunteerApplications])

  const handleApplicationSubTabChange = useCallback((tab: GeneralApplicationTabKey) => {
    setApplicationSubTab(tab)
  }, [])

  const handleApplicationEditForm = useCallback(() => {
    setApplicationTemplateEditOpen(true)
  }, [])

  const handleApplicationTemplateEditClose = useCallback(() => {
    setApplicationTemplateEditOpen(false)
  }, [])

  const handleApplicationTemplateSaved = useCallback(() => {
    setApplicationPreviewReloadKey(key => key + 1)
  }, [])

  const isEditModeInstitutions =
    open &&
    activeLnb === 'info' &&
    activeTab === 'recruitment' &&
    recruitSubTab === 'institutions' &&
    editTab === 'institutions' &&
    !!displayProgram

  const institutionsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInstitutions,
    schema: programDetailInstitutionsEditSchema,
  })
  const {
    triggerSave: institutionsTriggerSave,
    resetToProgram: institutionsResetToProgram,
    registerGetAdditionalContentHtml: registerInstitutionsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: institutionsForm,
    program: displayProgram ?? null,
    onSaveEdit: displayProgram
      ? async draft => {
          try {
            const { id: _id, createdAt: _c, ...patch } = draft
            await updateProgram(draft.id, patch)
          } catch {
            setSelectedProgram(draft)
          }
        }
      : undefined,
  })

  const isEditModeInstructors =
    open &&
    activeLnb === 'info' &&
    activeTab === 'recruitment' &&
    recruitSubTab === 'instructors' &&
    editTab === 'instructors' &&
    !!displayProgram

  const instructorsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeInstructors,
  })
  const {
    triggerSave: instructorsTriggerSave,
    resetToProgram: instructorsResetToProgram,
    registerGetAdditionalContentHtml: registerInstructorsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: instructorsForm,
    program: displayProgram ?? null,
    onSaveEdit: displayProgram
      ? async draft => {
          try {
            const { id: _id, createdAt: _c, ...patch } = draft
            await updateProgram(draft.id, patch)
          } catch {
            setSelectedProgram(draft)
          }
        }
      : undefined,
  })

  const isEditModeVolunteers =
    open &&
    activeLnb === 'info' &&
    activeTab === 'recruitment' &&
    recruitSubTab === 'volunteers' &&
    editTab === 'volunteers' &&
    !!displayProgram

  const volunteersForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeVolunteers,
  })
  const {
    triggerSave: volunteersTriggerSave,
    resetToProgram: volunteersResetToProgram,
    registerGetAdditionalContentHtml: registerVolunteersAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: volunteersForm,
    program: displayProgram ?? null,
    onSaveEdit: displayProgram
      ? async draft => {
          try {
            const { id: _id, createdAt: _c, ...patch } = draft
            await updateProgram(draft.id, patch)
          } catch {
            setSelectedProgram(draft)
          }
        }
      : undefined,
  })

  const handleRecruitmentEdit = useCallback(() => {
    if (activeLnb !== 'info' || activeTab !== 'recruitment' || !displayProgram) return
    if (recruitSubTab === 'institutions') {
      institutionsResetToProgram()
      setEditMode('institutions')
      return
    }
    if (recruitSubTab === 'instructors') {
      instructorsResetToProgram()
      setEditMode('instructors')
      return
    }
    if (recruitSubTab === 'volunteers') {
      volunteersResetToProgram()
      setEditMode('volunteers')
    }
  }, [
    activeLnb,
    activeTab,
    displayProgram,
    recruitSubTab,
    institutionsResetToProgram,
    instructorsResetToProgram,
    volunteersResetToProgram,
    setEditMode,
  ])

  const handleRecruitmentSave = useCallback(() => {
    if (!displayProgram) return
    setEditMode(null)
    if (recruitSubTab === 'institutions') {
      void institutionsTriggerSave()
      return
    }
    if (recruitSubTab === 'instructors') {
      void instructorsTriggerSave()
      return
    }
    if (recruitSubTab === 'volunteers') {
      void volunteersTriggerSave()
    }
  }, [
    displayProgram,
    recruitSubTab,
    institutionsTriggerSave,
    instructorsTriggerSave,
    volunteersTriggerSave,
    setEditMode,
  ])

  const applicantCloseHandlerRef = useRef<(() => boolean) | null>(null)
  const volunteerApplicantCloseHandlerRef = useRef<(() => boolean) | null>(null)
  const [applicantDetailMeta, setApplicantDetailMeta] = useState<ApplicantDetailMeta>(null)
  const [volunteerApplicantDetailMeta, setVolunteerApplicantDetailMeta] =
    useState<UjatVolunteerApplicantDetailMeta | null>(null)

  const handleApplicantDetailMetaChange = useCallback((meta: ApplicantDetailMeta) => {
    setApplicantDetailMeta(meta)
  }, [])

  useEffect(() => {
    if (
      !open ||
      (activeLnb !== 'institution_applications' && activeLnb !== 'instructor_applications')
    ) {
      setApplicantDetailMeta(null)
    }
  }, [open, activeLnb])

  useEffect(() => {
    if (!open || !programId || !displayProgram) return
    const normalized = normalizeGeneralDetailParams(programId, searchParams, displayProgram)
    if (normalized) setSearchParams(normalized, { replace: true })
  }, [open, programId, displayProgram, searchParams, setSearchParams])

  const setSchoolId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams)
      if (id) {
        next.set(SCHOOL_ID_PARAM, id)
        next.set(SCHOOL_TAB_PARAM, 'application')
        next.delete(INSTRUCTOR_ID_PARAM)
        next.delete(INSTRUCTOR_TAB_PARAM)
      } else {
        next.delete(SCHOOL_ID_PARAM)
        next.delete(SCHOOL_TAB_PARAM)
      }
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: id == null })
    },
    [programId, searchParams, setSearchParams]
  )

  const setInstructorId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams)
      if (id) {
        next.set(INSTRUCTOR_ID_PARAM, id)
        next.set(INSTRUCTOR_TAB_PARAM, 'application')
        next.delete(SCHOOL_ID_PARAM)
        next.delete(SCHOOL_TAB_PARAM)
      } else {
        next.delete(INSTRUCTOR_ID_PARAM)
        next.delete(INSTRUCTOR_TAB_PARAM)
      }
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: id == null })
    },
    [programId, searchParams, setSearchParams]
  )

  const setSchoolTab = useCallback(
    (tab: GeneralParticipatingInstitutionDetailTabKey) => {
      const next = new URLSearchParams(searchParams)
      next.set(SCHOOL_TAB_PARAM, normalizeGeneralParticipatingInstitutionDetailTab(tab))
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const setInstructorTab = useCallback(
    (tab: InstructorDetailTabKey) => {
      if (tab === 'settlement') return
      const next = new URLSearchParams(searchParams)
      next.set(INSTRUCTOR_TAB_PARAM, tab)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const setLnbTab = useCallback(
    (lnb: GeneralDetailLnbKey, tab: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(LNB_PARAM, lnb)
      next.set(TAB_PARAM, tab)
      if (programId) next.set('programId', programId)

      if (lnb !== 'progress') {
        for (const key of GENERAL_PROGRESS_NESTED_QUERY_PARAMS) next.delete(key)
      } else if (tab === 'progress_institutions') {
        next.delete(INSTRUCTOR_ID_PARAM)
        next.delete(INSTRUCTOR_TAB_PARAM)
      } else if (tab === 'progress_instructors') {
        next.delete(SCHOOL_ID_PARAM)
        next.delete(SCHOOL_TAB_PARAM)
      } else if (tab === 'progress_volunteers') {
        for (const key of GENERAL_PROGRESS_NESTED_QUERY_PARAMS) next.delete(key)
      }

      setSearchParams(next, { replace: true })
    },
    [programId, searchParams, setSearchParams]
  )

  const [schoolDetailTitle, setSchoolDetailTitle] = useState<string | null>(null)
  const [instructorDetailTitle, setInstructorDetailTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!schoolIdFromUrl) setSchoolDetailTitle(null)
  }, [schoolIdFromUrl])

  useEffect(() => {
    if (!instructorIdFromUrl) setInstructorDetailTitle(null)
  }, [instructorIdFromUrl])

  useEffect(() => {
    if (!open || !schoolIdFromUrl) return
    const raw = searchParams.get(SCHOOL_TAB_PARAM)
    const normalized = parseSchoolTabFromSearch(searchParams)
    if (raw === normalized) return
    const next = new URLSearchParams(searchParams)
    next.set(SCHOOL_TAB_PARAM, normalized)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, schoolIdFromUrl, searchParams, setSearchParams, programId])

  useEffect(() => {
    if (!open || !instructorIdFromUrl) return
    const raw = searchParams.get(INSTRUCTOR_TAB_PARAM)
    if (raw === 'settlement') {
      const next = new URLSearchParams(searchParams)
      next.set(INSTRUCTOR_TAB_PARAM, 'application')
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
      return
    }
    if (raw && (INSTRUCTOR_DETAIL_TAB_KEYS as readonly string[]).includes(raw)) return
    const next = new URLSearchParams(searchParams)
    next.set(INSTRUCTOR_TAB_PARAM, 'application')
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, instructorIdFromUrl, searchParams, setSearchParams, programId])

  useEffect(() => {
    if (!open || !instructorIdFromUrl) return
    if (activeLnb === 'progress' && activeTab === 'progress_instructors') return
    const next = new URLSearchParams(searchParams)
    next.delete(INSTRUCTOR_ID_PARAM)
    next.delete(INSTRUCTOR_TAB_PARAM)
    if (programId) next.set('programId', programId)
    setSearchParams(next, { replace: true })
  }, [open, activeLnb, activeTab, instructorIdFromUrl, programId, searchParams, setSearchParams])

  const handleModalClose = useCallback(() => {
    if (activeLnb === 'progress' && schoolIdFromUrl) {
      setSchoolId(null)
      return
    }
    if (activeLnb === 'progress' && instructorIdFromUrl) {
      setInstructorId(null)
      return
    }
    if (
      (activeLnb === 'institution_applications' || activeLnb === 'instructor_applications') &&
      applicantCloseHandlerRef.current?.()
    ) {
      return
    }
    onClose()
  }, [activeLnb, schoolIdFromUrl, instructorIdFromUrl, setSchoolId, setInstructorId, onClose])

  const progressNestedDetailLabel =
    activeLnb === 'progress' && schoolIdFromUrl && schoolDetailTitle
      ? schoolDetailTitle
      : activeLnb === 'progress' && instructorIdFromUrl && instructorDetailTitle
        ? instructorDetailTitle
        : null

  const headerBreadcrumbItems = (() => {
    const listParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
    })
    const items = [makeBreadcrumbItem('프로그램 목록', location.pathname, listParams)]

    if (!displayProgram) return items

    const programParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: 'info',
        [TAB_PARAM]: 'info',
      },
    })

    const lnbLabel = generalLnbBreadcrumbLabel(activeLnb, participantApplicationsLnbLabel)
    const childLabel = generalChildBreadcrumbLabel(activeLnb, activeTab, surveyItems)
    const lnbTab = generalLnbBreadcrumbTargetTab(activeLnb, activeTab, interviewEnabled, surveyKeys)
    const lnbParams = buildSearchParams(searchParams, {
      delete: GENERAL_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: activeLnb,
        [TAB_PARAM]: lnbTab,
      },
    })
    const childParams = childLabel
      ? buildSearchParams(searchParams, {
          delete: GENERAL_DETAIL_QUERY_PARAMS,
          set: {
            programId,
            [LNB_PARAM]: activeLnb,
            [TAB_PARAM]: activeTab,
          },
        })
      : null

    items.push(
      makeBreadcrumbItem(
        resolveGeneralProgramDisplayTitle(displayProgram),
        location.pathname,
        programParams
      )
    )

    const hasParticipantApplicationDetail =
      applicantDetailMeta != null &&
      (activeLnb === 'institution_applications' || activeLnb === 'instructor_applications')

    const hasProgressNestedDetail = progressNestedDetailLabel != null
    const hasVolunteerApplicationDetail =
      volunteerApplicantDetailMeta != null &&
      isGeneralVolunteerApplicantDetailRoute(activeLnb, activeTab)

    if (!childLabel) {
      items.push(
        hasParticipantApplicationDetail || hasVolunteerApplicationDetail
          ? makeBreadcrumbItem(lnbLabel, location.pathname, lnbParams)
          : { label: lnbLabel }
      )
    } else if (
      activeLnb === 'progress' &&
      schoolIdFromUrl &&
      activeTab === 'progress_institutions'
    ) {
      items.push(
        childParams && hasProgressNestedDetail
          ? makeBreadcrumbItem(childLabel, location.pathname, childParams)
          : { label: childLabel }
      )
    } else {
      items.push(makeBreadcrumbItem(lnbLabel, location.pathname, lnbParams))
      items.push(
        childParams && (hasParticipantApplicationDetail || hasProgressNestedDetail)
          ? makeBreadcrumbItem(childLabel, location.pathname, childParams)
          : { label: childLabel }
      )
    }

    if (hasParticipantApplicationDetail) {
      items.push({ label: applicantDetailMeta.breadcrumbLabel })
    } else if (hasVolunteerApplicationDetail) {
      items.push({ label: volunteerApplicantDetailMeta.breadcrumbLabel })
    }

    if (hasProgressNestedDetail) {
      items.push({ label: progressNestedDetailLabel })
    }

    return items
  })()

  if (!open) return null

  const modalTitle =
    volunteerApplicantDetailMeta && isGeneralVolunteerApplicantDetailRoute(activeLnb, activeTab)
      ? volunteerApplicantDetailMeta.title
      : applicantDetailMeta &&
          (activeLnb === 'institution_applications' || activeLnb === 'instructor_applications')
        ? applicantDetailMeta.title
        : activeLnb === 'progress' && schoolIdFromUrl && schoolDetailTitle
          ? `참여 기관 상세 (${schoolDetailTitle})`
          : progressNestedDetailLabel && displayProgram
            ? `${resolveGeneralProgramDisplayTitle(displayProgram)}_${progressNestedDetailLabel}`
            : displayProgram
              ? resolveGeneralProgramDisplayTitle(displayProgram)
              : '프로그램 상세'

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={handleModalClose}
        title={modalTitle}
        closeAriaLabel={schoolIdFromUrl || instructorIdFromUrl ? '목록으로' : undefined}
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
        className="program-detail-fullpage-modal general-detail-fullpage-modal program-detail-fullpage-modal--program-list-overview"
        sidebar={
          programId ? (
            <GeneralProgramDetailSidebar
              activeLnb={activeLnb}
              activeTab={activeTab}
              participantApplicationsLnbLabel={participantApplicationsLnbLabel}
              showInstructorApplications={showInstructorApplications}
              showVolunteerApplications={showVolunteerApplications}
              volunteerInterviewEnabled={interviewEnabled}
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
            {activeLnb === 'info' && activeTab === 'info' ? (
              <GeneralProgramDetailCommonInfoView
                program={displayProgram}
                sponsorName={sponsorName}
                isEditMode={isEditModeInfo}
                form={infoForm}
                canWrite={canWrite}
                onEdit={handleInfoEdit}
                onSave={handleInfoSave}
              />
            ) : activeLnb === 'info' && activeTab === 'recruitment' ? (
              <GeneralProgramRecruitmentView
                program={displayProgram}
                sponsorName={sponsorName}
                activeRecruitTab={recruitSubTab}
                onRecruitTabChange={handleRecruitSubTabChange}
                showInstructorTab={showInstructorApplications}
                showVolunteerTab={showVolunteerApplications}
                canWrite={canWrite}
                isEditModeInstitutions={isEditModeInstitutions}
                institutionsForm={isEditModeInstitutions ? institutionsForm : undefined}
                registerInstitutionsAdditionalHtml={registerInstitutionsAdditionalHtml}
                isEditModeInstructors={isEditModeInstructors}
                instructorsForm={isEditModeInstructors ? instructorsForm : undefined}
                registerInstructorsAdditionalHtml={registerInstructorsAdditionalHtml}
                isEditModeVolunteers={isEditModeVolunteers}
                volunteersForm={isEditModeVolunteers ? volunteersForm : undefined}
                registerVolunteersAdditionalHtml={registerVolunteersAdditionalHtml}
                onEdit={handleRecruitmentEdit}
                onSave={handleRecruitmentSave}
              />
            ) : activeLnb === 'info' && activeTab === 'application' ? (
              <GeneralProgramApplicationView
                program={displayProgram}
                activeApplicationTab={applicationSubTab}
                onApplicationTabChange={handleApplicationSubTabChange}
                showInstructorTab={showInstructorApplications}
                showVolunteerTab={showVolunteerApplications}
                canWrite={canWrite}
                onEditForm={handleApplicationEditForm}
                previewReloadKey={applicationPreviewReloadKey}
              />
            ) : activeLnb === 'survey' ? (
              <GeneralSurveyManagementView program={displayProgram} activeTab={activeTab} />
            ) : activeLnb === 'managers' && displayProgram.id ? (
              <div className="program-detail-fullpage-modal__info-tab program-detail-fullpage-modal__managers-tab">
                <ProgramManagersTab programId={displayProgram.id} />
              </div>
            ) : activeLnb === 'institution_applications' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <GeneralParticipantApplicationsView
                  program={displayProgram}
                  listTitle={participantApplicationsLnbLabel}
                  onRegisterApplicantCloseHandler={fn => {
                    applicantCloseHandlerRef.current = fn
                  }}
                  onApplicantDetailMetaChange={handleApplicantDetailMetaChange}
                />
              </div>
            ) : activeLnb === 'instructor_applications' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <GeneralInstructorApplicationsView
                  program={displayProgram}
                  onRegisterApplicantCloseHandler={fn => {
                    applicantCloseHandlerRef.current = fn
                  }}
                  onApplicantDetailMetaChange={handleApplicantDetailMetaChange}
                />
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_institutions' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <ParticipatingInstitutionsSection
                  programId={displayProgram.id}
                  program={displayProgram}
                  schoolIdFromUrl={schoolIdFromUrl}
                  schoolTabFromUrl={activeSchoolTab}
                  onSchoolTabChange={setSchoolTab}
                  onSchoolRowClick={row => setSchoolId(row.id)}
                  onClearSchoolId={() => setSchoolId(null)}
                  onSchoolDetailOpen={name => setSchoolDetailTitle(name)}
                  onSchoolDetailClose={() => setSchoolDetailTitle(null)}
                />
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_instructors' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <ParticipatingInstructorsSection
                  programId={displayProgram.id}
                  program={displayProgram}
                  instructorIdFromUrl={instructorIdFromUrl}
                  instructorTabFromUrl={activeInstructorTab}
                  onInstructorTabChange={setInstructorTab}
                  onInstructorRowClick={row => setInstructorId(row.id)}
                  onClearInstructorId={() => setInstructorId(null)}
                  onInstructorDetailOpen={name => setInstructorDetailTitle(name)}
                  onInstructorDetailClose={() => setInstructorDetailTitle(null)}
                />
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_volunteers' ? (
              <div className="program-status-participating program-detail-fullpage-modal__progress-section">
                <Typography.Title level={5}>참여 봉사자</Typography.Title>
                <Typography.Text className="program-status-participating__placeholder">
                  참여 봉사자 목록 및 현황이 표시됩니다.
                </Typography.Text>
              </div>
            ) : activeLnb === 'volunteer_applications' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <GeneralVolunteerApplicationsView
                  program={displayProgram}
                  activeTab={activeTab}
                  interviewEnabled={interviewEnabled}
                  onRegisterApplicantCloseHandler={fn => {
                    volunteerApplicantCloseHandlerRef.current = fn
                  }}
                  onVolunteerApplicantDetailMetaChange={setVolunteerApplicantDetailMeta}
                />
              </div>
            ) : (
              <div
                className="general-detail-fullpage-modal__main"
                aria-label={
                  generalChildBreadcrumbLabel(activeLnb, activeTab, surveyItems) ??
                  generalLnbBreadcrumbLabel(activeLnb, participantApplicationsLnbLabel)
                }
              />
            )}
          </>
        ) : (
          <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
        )}
      </DetailFullPageModal>
      {displayProgram ? (
        <GeneralProgramApplicationTemplateEditModal
          open={applicationTemplateEditOpen}
          program={displayProgram}
          applicationTab={applicationSubTab}
          onClose={handleApplicationTemplateEditClose}
          onSaved={handleApplicationTemplateSaved}
        />
      ) : null}
      <ProgramDetailSponsorDetailOverlay />
    </>
  )
}
