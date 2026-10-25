/**
 * 일반 프로그램 상세 풀페이지 모달 — `/programs/general?programId=…&lnb=…&tab=…`
 * LNB·breadcrumb·queryParam 복원만 구성 (본문 화면은 추후 API 연동)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams, type SetURLSearchParams } from 'react-router-dom'
import { tryNavigateMemberDetailReturn } from '@/features/user/detail/lib/member-detail-program-navigation-return'
import { Spin, Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { useCmsAlert } from '@/shared/ui'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import type { DetailFullpageBreadcrumbItem } from '@/shared/ui/detail-fullpage-breadcrumb'
import { buildSearchParams } from '@/shared/lib/detail-fullpage-query-stack'
import { useGeneralProgramDetail } from '@/features/program/general/hooks/use-general-program-detail'
import { useGeneralProgramNavigation } from '@/features/program/general/hooks/use-general-program-navigation'
import { useGeneralProgramsRemoteEnabled } from '@/features/program/general/hooks/use-general-programs-remote-enabled'
import { useUpdateGeneralProgram } from '@/features/program/general/hooks/use-update-general-program'
import type { GeneralProgramUpdateSerializeOptions } from '@/features/program/general/api/adapters/general-program-adapters'
import { fetchGeneralProgramRemoteById } from '@/features/program/general/api/admin-general-programs-service'
import { getTrainedTeacherProgram } from '@/features/program/trained-teachers/api/service'
import { reflectTrainedTeacherProgramSave } from '@/features/program/trained-teachers/api/detail-cache'
import { persistGeneralRecruitmentNestedSnapshot } from '@/features/program/general/lib/persist-recruitment-nested-snapshot'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  omitRecruitmentTabScheduleFields,
  persistRecruitmentTabSave,
} from '@/features/program/shared/lib/persist-recruitment-row-save'
import { hydrateRecruitmentWindowsOntoProgram } from '@/features/program/shared/lib/hydrate-recruitment-windows'
import {
  programDetailCacheFromSave,
  syncOpenProgramDetailCache,
} from '@/features/program/shared/lib/program-detail-cache-after-save'
import { invalidateGeneralProgramListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import type { ProgramDetailRecruitmentAudience } from '@/features/program/shared/lib/apply-recruitment-additional-content-html'
import { useProgramStore } from '@/features/program/general/model/program-store'
import { refreshAdminSessionFromMe } from '@/features/auth/model/auth-store'
import type { Program } from '@/types/domain'
import {
  GENERAL_ORGANIZATION_APPLICATIONS_LNB_LABEL,
  getGeneralParticipantApplicationsLnbLabel,
  getGeneralParticipantInterviewEnabled,
  getGeneralParticipantTypes,
  getGeneralProgressMenuItems,
  getGeneralSurveyMenuItems,
  getGeneralVolunteerInterviewEnabled,
  getVisibleGeneralProgressMenuItems,
  hasGeneralInstructorApplications,
  hasGeneralParticipantApplications,
  resolveGeneralProgramForDetail,
  shouldShowGeneralVolunteerApplicationsLnb,
  type GeneralVolunteerApplicationsLnbVisibility,
  type GeneralProgressMenuItem,
  type GeneralSurveyMenuItem,
} from '@/features/program/general/lib/detail-meta'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { seedGeneralRegistrationOverlayFromProgram } from '@/features/program/general/lib/registration-overlay-sync'
import {
  prepareRecruitOperationalEditFromProgram,
  seedOperationalRecruitOverlaysFromProgram,
} from '@/features/program/general/lib/detail-operational-save-merge'
import { logGeneralProgramCommonInfoEditCurrentPayload } from '@/features/program/general/lib/common-info-edit-payload-log'
import {
  defaultParticipantApplicationTab,
  isParticipantTabValid,
  isValidGeneralProgressTab,
  normalizeGeneralProgressTab,
  PARTICIPANT_INTERVIEW_CHILD_ROWS,
} from '@/features/program/general/lib/progress-tabs'
import { resolveGeneralProgramDisplayTitle } from '@/features/program/general/lib/detail-common-info-display'
import {
  parseGeneralDetailLnb,
  type GeneralDetailLnbKey,
} from '@/features/program/general/lib/detail-url'
import {
  clearGeneralProgramDetailQueryParams,
  clearGeneralProgramRecruitmentPreviewParams,
  GENERAL_PROGRAM_DETAIL_EDIT_PARAM,
  GENERAL_PROGRAM_DETAIL_LNB_PARAM,
  GENERAL_PROGRAM_DETAIL_QUERY_PARAMS,
  GENERAL_PROGRAM_DETAIL_SUB_TAB_PARAM,
  GENERAL_PROGRAM_DETAIL_TAB_PARAM,
  GENERAL_PROGRAM_RECRUITMENT_PREVIEW_ACTIVE,
  preserveGeneralProgramDetailProgramId,
  readGeneralProgramDetailRoute,
  readOpenRecruitmentPreviewAudience,
  recruitmentPreviewParamForAudience,
  shouldPatchGeneralProgramDetailUrl,
} from '@/features/program/general/lib/general-program-detail-route'
import { useGeneralProgramCommonInfoEditForm } from '@/features/program/general/hooks/use-common-info-edit-form'
import {
  TRAINED_TEACHERS_DEDICATED_DETAIL_SAVE_KIND,
  useGeneralProgramCommonInfoSave,
} from '@/features/program/general/hooks/use-common-info-save'
import {
  EDUCATION_SCHEDULE_COUNT_MISMATCH_ALERT_MESSAGE,
  EDUCATION_SCHEDULE_COUNT_MISMATCH_ALERT_TITLE,
} from '@/features/program/general/lib/registration-required-fields'
import {
  GENERAL_SURVEY_MENU_EMPTY_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { listIncompleteDetailRecruitmentHighlightKeys } from '@/features/program/general/lib/detail-recruitment-required-highlight'
import {
  RegistrationWizardValidationHighlightProvider,
  RegistrationWizardValidationHighlightSync,
  useDetailEditRequiredHighlightRequest,
} from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import {
  isProgramTypeSettingsSaveBlocked,
  recruitmentEditTypeForDetailTab,
} from '@/features/program/shared/lib/program-edit-window'
import {
  PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE,
  PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_TITLE,
} from '@/shared/lib/program-edit-window-error-message'
import {
  getGeneralProgramApiErrorCode,
  getGeneralProgramApiErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { isEducationStructureChanged } from '@/features/program/general/lib/overlay-phase1/independent-session-authoring'
import {
  hasRhfCurriculumMultiDateScheduleCountMismatch,
  parseGeneralCommonInfoRhfValidation,
  resolveGeneralCommonInfoValidationAlert,
} from '@/features/program/general/lib/overlay-phase1/common-info-rhf-validation'
import {
  EDUCATION_STRUCTURE_CHANGE_CONFIRM_MESSAGE,
  EDUCATION_STRUCTURE_CHANGE_CONFIRM_TITLE,
} from '@/features/program/general/lib/education-structure-guard'
import {
  canGeneralProgramApplicationFormEdit,
  canGeneralProgramCommonInfoEdit,
  canGeneralProgramRecruitmentInfoEdit,
  getGeneralProgramCommonInfoEditBlockedAlertMessage,
  getGeneralProgramRecruitmentInfoEditBlockedAlertMessage,
  getGeneralProgramRecruitmentInfoEditBlockedAlertTitle,
} from '@/features/program/general/lib/common-info-edit-policy'
import {
  applyGeneralProgramDetailSession,
  clearGeneralProgramDetailSession,
  setGeneralProgramDetailSession,
} from '@/features/program/general/lib/general-program-detail-session'
import {
  programInstructorRecruitmentSaveSchema,
  programParticipantRecruitmentSaveSchema,
  programVolunteerRecruitmentSaveSchema,
} from '@/features/program/general/lib/program-recruitment-save-fields'
import { saveGeneralProgramDetailSnapshot } from '@/features/program/general/lib/general-program-local-cache'
import { ProgramDetailLnbDeleteButton } from '@/features/program/shared/ui/program-detail/lnb-delete-button'
import { GeneralProgramDetailSidebar } from './detail-sidebar'
import { GeneralProgramDetailCommonInfoView } from './info/common-info-view'
import { GeneralProgramRecruitmentView } from './info/recruitment-view'
import { ParticipantRecruitmentPreviewModal } from './info/participant-recruitment-preview-modal'
import {
  GENERAL_PROGRAM_DETAIL_FULLPAGE_MODAL_Z_INDEX,
  GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX,
} from '@/features/program/general/lib/general-program-modal-z-index'
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
import {
  getGeneralRecruitmentRemoteUnavailableReason,
  programToRecruitmentTabEditValues,
  resolveGeneralProgramForRecruitmentEdit,
} from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { getProgramAdminDetailInfoTabUrlForProgramType } from '@/features/program/general/lib/program-admin-detail-url'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { useUpdateTrainedTeacherProgram } from '@/features/program/trained-teachers/api/hooks'
import { programDetailInstitutionsEditSchema } from '@/features/program/shared/model/program-detail-edit-schema'
import { GeneralSurveyManagementView } from './survey-management/survey-management-view'
import { ProgramManagersTab } from './managers/program-managers-tab'
import { GeneralParticipantApplicationsScreeningView } from './applications/participant-screening/applications-screening-view'
import { GeneralInstructorApplicationsView } from './applications/general-instructor-applications-view'
import { GeneralVolunteerApplicationsView } from './applications/general-volunteer-applications-view'
import { isGeneralVolunteerApplicantDetailRoute } from '@/features/program/general/lib/general-volunteer-applications'
import { resolveGeneralApplicantDetailMetaFromUrl } from '@/features/program/general/lib/resolve-general-applicant-detail-meta'
import { resolveGeneralApplicantDetailModalTitle } from '@/features/program/general/lib/screening-subject-kind'
import type { GeneralVolunteerApplicantDetailMeta } from './applications/volunteer-screening/use-detail'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'
import {
  APPLICANT_ID_PARAM,
  DETAIL_TAB_PARAM,
} from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-constants'
import { ProgramDetailSponsorDetailOverlay } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-detail-overlay'
import { ParticipatingInstitutionsSection } from './program-status/participating-institutions-section'
import { ParticipatingInstructorsSection } from './program-status/participating-instructors-section'
import { ParticipatingVolunteersSection } from './program-status/participating-volunteers-section'
import { ParticipatingParticipantsSection } from './program-status/participating-participants-section'
import { ParticipatingIndividualProgressAttendanceSection } from './program-status/participating-individual-progress-attendance-section'
import { ParticipatingIndividualProgressAssignmentSection } from './program-status/participating-individual-progress-assignment-section'
import { ProgramProgressPostsSection } from './program-status/program-progress-posts-section'
import { PARTICIPATING_PARTICIPANTS_VIEW_PARAM } from '@/features/program/general/hooks/use-participating-individual-participants-params'
import {
  normalizeParticipatingInstitutionDetailTab,
  type ParticipatingInstitutionDetailTabKey,
  isParticipatingInstitutionDetailTabKeyForProgram,
} from '@/features/program/general/lib/participating-institution-detail-tabs'
import {
  normalizeInstructorDetailTab,
  type InstructorDetailTabKey,
} from './program-status/participating-instructor-fullpage-view'
import {
  normalizeVolunteerDetailTab,
  type VolunteerDetailTabKey,
} from './program-status/participating-volunteer-fullpage-view'
import {
  normalizeParticipantDetailTab,
  type ParticipantDetailTabKey,
} from '@/features/program/general/lib/participating-individual-detail-tabs'
import '@/features/program/general/ui/detail-modal/program-detail-fullpage-modal.css'
import './detail-fullpage-modal.css'

const TAB_PARAM = 'tab'
const LNB_PARAM = 'lnb'
const EDIT_PARAM = 'edit'
const SCHOOL_ID_PARAM = 'schoolId'
const SCHOOL_TAB_PARAM = 'schoolTab'
const INSTRUCTOR_ID_PARAM = 'instructorId'
const INSTRUCTOR_TAB_PARAM = 'instructorTab'
const VOLUNTEER_ID_PARAM = 'volunteerId'
const VOLUNTEER_TAB_PARAM = 'volunteerTab'
const PARTICIPANT_ID_PARAM = 'participantId'
const PARTICIPANT_TAB_PARAM = 'participantTab'

const GENERAL_PROGRESS_NESTED_QUERY_PARAMS = [
  SCHOOL_ID_PARAM,
  SCHOOL_TAB_PARAM,
  INSTRUCTOR_ID_PARAM,
  INSTRUCTOR_TAB_PARAM,
  VOLUNTEER_ID_PARAM,
  VOLUNTEER_TAB_PARAM,
  PARTICIPANT_ID_PARAM,
  PARTICIPANT_TAB_PARAM,
  PARTICIPATING_PARTICIPANTS_VIEW_PARAM,
  'progressCalendarRange',
  'schoolName',
  'institutionSido',
  'institutionSigungu',
  'educationGrade',
  'textbookStatus',
  'teacherName',
  'participantName',
  'homeSido',
  'homeSigungu',
] as const

function parseSchoolTabFromSearch(
  searchParams: URLSearchParams,
  program?: Program | null,
  educationJournalEnabled?: boolean
): ParticipatingInstitutionDetailTabKey {
  const t = searchParams.get(SCHOOL_TAB_PARAM)
  if (t && isParticipatingInstitutionDetailTabKeyForProgram(t, program)) {
    return normalizeParticipatingInstitutionDetailTab(t, program, educationJournalEnabled)
  }
  return 'application'
}

function parseInstructorTabFromSearch(searchParams: URLSearchParams): InstructorDetailTabKey {
  return normalizeInstructorDetailTab(searchParams.get(INSTRUCTOR_TAB_PARAM))
}

function parseVolunteerTabFromSearch(searchParams: URLSearchParams): VolunteerDetailTabKey {
  return normalizeVolunteerDetailTab(searchParams.get(VOLUNTEER_TAB_PARAM))
}

function parseParticipantTabFromSearch(
  searchParams: URLSearchParams,
  program?: Program | null
): ParticipantDetailTabKey {
  return normalizeParticipantDetailTab(searchParams.get(PARTICIPANT_TAB_PARAM), program)
}

const INFO_TABS = ['info', 'recruitment', 'application'] as const
const VOLUNTEER_INTERVIEW_TABS = ['vol_doc1', 'vol_doc_passed', 'vol_interview2'] as const

export interface GeneralProgramDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  program: Program | null
  programIdHint?: string | null
  /** 목록 페이지와 동일한 searchParams 인스턴스 — LNB 라우팅 충돌 방지 */
  searchParams?: URLSearchParams
  setSearchParams?: SetURLSearchParams
  /** LNB 하단 「프로그램 삭제」 — 미지정 시 버튼 미노출 */
  onRequestDelete?: (program: Program) => void
}

function defaultTabForLnb(
  lnb: GeneralDetailLnbKey,
  volunteerInterview: boolean,
  participantInterview: boolean,
  surveyKeys: string[],
  progressMenuItems: GeneralProgressMenuItem[]
): string {
  switch (lnb) {
    case 'info':
      return 'info'
    case 'institution_applications':
      return defaultParticipantApplicationTab(participantInterview)
    case 'instructor_applications':
      return 'main'
    case 'volunteer_applications':
      return volunteerInterview ? 'vol_doc1' : 'vol_all'
    case 'progress':
      return progressMenuItems[0]?.tab ?? 'progress_instructors'
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
  program: Program,
  volunteerLnbVisibility?: GeneralVolunteerApplicationsLnbVisibility
): URLSearchParams | null {
  const volunteerInterview = getGeneralVolunteerInterviewEnabled(program)
  const participantInterview = getGeneralParticipantInterviewEnabled(program)
  const surveyKeys = getGeneralSurveyMenuItems(program).map(s => s.key)
  const progressMenuItems = getGeneralProgressMenuItems(program)
  const progressTabKeys = progressMenuItems.map(item => item.tab)
  const showInstructor = hasGeneralInstructorApplications(program)
  const showVolunteer = shouldShowGeneralVolunteerApplicationsLnb(program, volunteerLnbVisibility)
  const showParticipant = hasGeneralParticipantApplications(program)

  const next = new URLSearchParams(searchParams)
  next.set('programId', programId)

  let lnb: GeneralDetailLnbKey = parseGeneralDetailLnb(searchParams) ?? 'info'
  let tab = searchParams.get(TAB_PARAM) ?? ''

  const setInvalid = (l: GeneralDetailLnbKey, t: string) => {
    lnb = l
    tab = t
  }

  if (tab === '') {
    tab = defaultTabForLnb(
      lnb,
      volunteerInterview,
      participantInterview,
      surveyKeys,
      progressMenuItems
    )
  }

  const normalizedProgressTab = normalizeGeneralProgressTab(tab)
  if (normalizedProgressTab != null && normalizedProgressTab !== tab) {
    tab = normalizedProgressTab
  }

  if (tab === 'student_satisfaction' || tab === 'teacher_satisfaction') {
    if (surveyKeys.includes('satisfaction')) {
      tab = 'satisfaction'
    } else if (!surveyKeys.includes('satisfaction')) {
      tab = surveyKeys[0] ?? 'main'
    }
  }

  if (lnb === 'info') {
    if (!(INFO_TABS as readonly string[]).includes(tab)) {
      setInvalid('info', 'info')
    }
  } else if (lnb === 'institution_applications') {
    if (!showParticipant) setInvalid('info', 'info')
    else if (!isParticipantTabValid(tab, participantInterview)) {
      setInvalid(
        'institution_applications',
        defaultTabForLnb(
          'institution_applications',
          volunteerInterview,
          participantInterview,
          surveyKeys,
          progressMenuItems
        )
      )
    }
  } else if (lnb === 'instructor_applications') {
    if (!showInstructor) setInvalid('info', 'info')
    else if (tab !== 'main') setInvalid('instructor_applications', 'main')
  } else if (lnb === 'volunteer_applications') {
    if (!showVolunteer) setInvalid('info', 'info')
    else if (!isVolunteerTabValid(tab, volunteerInterview)) {
      setInvalid(
        'volunteer_applications',
        defaultTabForLnb(
          'volunteer_applications',
          volunteerInterview,
          participantInterview,
          surveyKeys,
          progressMenuItems
        )
      )
    }
  } else if (lnb === 'progress') {
    if (progressTabKeys.length === 0) {
      setInvalid('info', 'info')
    } else if (!isValidGeneralProgressTab(tab, progressTabKeys)) {
      setInvalid('progress', progressTabKeys[0] ?? 'progress_instructors')
    }
  } else if (lnb === 'survey') {
    if (surveyKeys.length === 0) {
      setInvalid('info', 'info')
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
  surveyItems: GeneralSurveyMenuItem[],
  progressMenuItems: GeneralProgressMenuItem[]
): string | null {
  if (lnb === 'info') {
    if (tab === 'info') return '공통 정보'
    if (tab === 'recruitment') return '모집 정보'
    if (tab === 'application') return '신청 정보'
    return null
  }
  if (lnb === 'institution_applications') {
    const row = PARTICIPANT_INTERVIEW_CHILD_ROWS.find(item => item.tab === tab)
    return row?.label ?? null
  }
  if (lnb === 'volunteer_applications') {
    if (tab === 'vol_doc1') return '1차 서류 심사 대상자'
    if (tab === 'vol_doc_passed') return '1차 서류 합격자'
    if (tab === 'vol_interview2') return '2차 면접 대상자'
    return null
  }
  if (lnb === 'progress') {
    const normalized = normalizeGeneralProgressTab(tab)
    if (normalized == null) return null
    const row = progressMenuItems.find(item => item.tab === normalized)
    return row?.label ?? null
  }
  if (lnb === 'survey') {
    return surveyItems.find(item => item.key === tab)?.label ?? null
  }
  return null
}

function generalLnbBreadcrumbTargetTab(
  lnb: GeneralDetailLnbKey,
  activeTab: string,
  volunteerInterview: boolean,
  participantInterview: boolean,
  surveyKeys: string[],
  progressMenuItems: GeneralProgressMenuItem[]
): string {
  if (lnb === 'institution_applications' && participantInterview) {
    if (isParticipantTabValid(activeTab, true) && activeTab !== 'main') return activeTab
    return 'part_doc1'
  }
  if (lnb === 'volunteer_applications' && volunteerInterview) {
    if ((VOLUNTEER_INTERVIEW_TABS as readonly string[]).includes(activeTab)) return activeTab
    return 'vol_doc1'
  }
  return defaultTabForLnb(
    lnb,
    volunteerInterview,
    participantInterview,
    surveyKeys,
    progressMenuItems
  )
}

export function GeneralProgramDetailFullPageModal({
  open,
  onClose,
  program,
  programIdHint = null,
  searchParams: searchParamsProp,
  setSearchParams: setSearchParamsProp,
  onRequestDelete,
}: GeneralProgramDetailFullPageModalProps) {
  const navigate = useNavigate()
  const [routerSearchParams, internalSetSearchParams] = useSearchParams()
  const searchParams = searchParamsProp ?? routerSearchParams
  const setSearchParams = setSearchParamsProp ?? internalSetSearchParams
  const searchParamsKey = searchParams.toString()
  const routerSearchParamsKey = routerSearchParams.toString()
  const programId =
    program?.id ?? programIdHint ?? searchParams.get('programId') ?? undefined

  useEffect(() => {
    if (!open || !programId) return
    void refreshAdminSessionFromMe()
  }, [open, programId])

  const { updateProgram, setSelectedProgram } = useProgramStore()
  const queryClient = useQueryClient()
  const remoteEnabled = useGeneralProgramsRemoteEnabled(
    open && Boolean(programId),
    programId
  )
  const updateGeneralProgramMutation = useUpdateGeneralProgram()
  const updateTrainedTeacherProgramMutation = useUpdateTrainedTeacherProgram()
  const {
    program: detailProgram,
    loading,
    error: detailError,
    sponsorName,
    canWrite,
  } = useGeneralProgramDetail(open ? programId : undefined, {
    enabled: open,
  })
  const {
    disabledLnbKeys,
    capabilities: navigationCapabilities,
    loading: navigationLoading,
    navigation,
    isRemoteDataSource: isNavigationRemote,
  } = useGeneralProgramNavigation(open ? programId : undefined, open)
  const { showAlert } = useCmsAlert()
  const detailRequiredHighlight = useDetailEditRequiredHighlightRequest()
  const displayProgram = useMemo(() => {
    // remote(API id): 상세 GET만 본문에 사용 (목록 행·resolve 시드 선표시 금지)
    // FE 시드(`general-prog-*`): remoteEnabled=false → resolve 폴백
    if (remoteEnabled) {
      return detailProgram ? hydrateRecruitmentWindowsOntoProgram(detailProgram) : null
    }
    const base =
      detailProgram ??
      program ??
      (programId ? (resolveGeneralProgramForDetail(programId) ?? null) : null)
    if (base == null) return null
    return hydrateRecruitmentWindowsOntoProgram(applyGeneralProgramDetailSession(base))
  }, [detailProgram, program, programId, remoteEnabled])

  useEffect(() => {
    if (!open || !displayProgram) return
    if (!isTrainedTeachersDetailProgram(displayProgram)) return
    navigate(
      getProgramAdminDetailInfoTabUrlForProgramType(
        displayProgram.id,
        displayProgram.backendProgramType ?? 'TRAINED_TEACHER'
      ),
      { replace: true }
    )
  }, [displayProgram, navigate, open])

  const strictRemoteRecruitment =
    shouldUseTrainedTeacherProgramsRemoteApi() &&
    displayProgram != null &&
    isTrainedTeachersDetailProgram(displayProgram)

  const recruitmentEditProgram = useMemo(
    () => {
      if (!displayProgram) return null
      return resolveGeneralProgramForRecruitmentEdit(displayProgram, {
        strictRemote: strictRemoteRecruitment,
      })
    },
    [displayProgram, strictRemoteRecruitment]
  )

  const mapParticipantRecruitmentEditValues = useCallback(
    (p: Program) => {
      const strictRemote =
        shouldUseTrainedTeacherProgramsRemoteApi() && isTrainedTeachersDetailProgram(p)
      return programToRecruitmentTabEditValues(p, 'participant', { strictRemote })
    },
    []
  )
  const mapInstructorRecruitmentEditValues = useCallback(
    (p: Program) => {
      const strictRemote =
        shouldUseTrainedTeacherProgramsRemoteApi() && isTrainedTeachersDetailProgram(p)
      return programToRecruitmentTabEditValues(p, 'instructor', { strictRemote })
    },
    []
  )
  const mapVolunteerRecruitmentEditValues = useCallback(
    (p: Program) => {
      const strictRemote =
        shouldUseTrainedTeacherProgramsRemoteApi() && isTrainedTeachersDetailProgram(p)
      return programToRecruitmentTabEditValues(p, 'volunteer', { strictRemote })
    },
    []
  )

  const persistGeneralProgramDraft = useCallback(
    async (
      draft: Program,
      patch?: Partial<Program>,
      baseline?: Program | null,
      serializeOptions?: GeneralProgramUpdateSerializeOptions
    ) => {
      if (strictRemoteRecruitment) {
        const echoed = await updateTrainedTeacherProgramMutation.mutateAsync({
          programId: draft.id,
          program: draft,
          patch,
        })
        clearGeneralProgramDetailSession(draft.id)
        setSelectedProgram(echoed)
        return
      }
      if (remoteEnabled) {
        const echoed = await updateGeneralProgramMutation.mutateAsync({
          programId: draft.id,
          program: draft,
          // 공통·모집 정보 저장: 변경 키만 PATCH (rounds·마스킹 담당자 등 전체 덤프 방지)
          patch,
          baseline: baseline ?? displayProgram ?? draft,
          serializeOptions,
        })
        clearGeneralProgramDetailSession(draft.id)
        await syncOpenProgramDetailCache(
          queryClient,
          generalProgramQueryKeys.detail(draft.id),
          programDetailCacheFromSave(draft.id, echoed, draft, patch),
          { refetch: false }
        )
        return
      }

      setGeneralProgramDetailSession(draft)
      setSelectedProgram(draft)
      saveGeneralProgramDetailSnapshot(draft)
      try {
        const localPatch =
          patch ??
          (() => {
            const { id: _id, createdAt: _c, ...rest } = draft
            return rest
          })()
        await updateProgram(draft.id, localPatch)
      } catch {
        // API·mockProgramsMap 미연동 일반 프로그램 — 세션·mock 스냅샷 유지
      }
    },
    [
      displayProgram,
      queryClient,
      remoteEnabled,
      setSelectedProgram,
      strictRemoteRecruitment,
      updateGeneralProgramMutation,
      updateProgram,
      updateTrainedTeacherProgramMutation,
    ]
  )

  const persistRecruitmentTab = useCallback(
    (audience: ProgramDetailRecruitmentAudience) =>
      async (draft: Program, patch: Partial<Program>, baseline: Program) => {
        if (remoteEnabled) {
          const result = await persistRecruitmentTabSave({
            baseline: baseline ?? displayProgram ?? draft,
            draft,
            patch,
            audience,
            refetchProgram: strictRemoteRecruitment
              ? getTrainedTeacherProgram
              : fetchGeneralProgramRemoteById,
            remoteResponsePriority: strictRemoteRecruitment,
            beforeRefetch: strictRemoteRecruitment
              ? undefined
              : () => persistGeneralRecruitmentNestedSnapshot(draft, { audience }),
          })
          if (result.mode === 'row') {
            clearGeneralProgramDetailSession(draft.id)
            if (strictRemoteRecruitment) {
              await reflectTrainedTeacherProgramSave(queryClient, {
                programId: draft.id,
                echoed: result.program,
              })
            } else {
              seedOperationalRecruitOverlaysFromProgram(result.program)
              setSelectedProgram(result.program)
              await syncOpenProgramDetailCache(
                queryClient,
                generalProgramQueryKeys.detail(draft.id),
                result.program,
                { refetch: false }
              )
              invalidateGeneralProgramListCaches(queryClient)
            }
            return
          }
          if (strictRemoteRecruitment) {
            const echoed = await updateTrainedTeacherProgramMutation.mutateAsync({
              programId: draft.id,
              program: draft,
              patch: result.patch,
            })
            clearGeneralProgramDetailSession(draft.id)
            setSelectedProgram(echoed)
            return
          }
          await persistGeneralProgramDraft(draft, result.patch, baseline)
          return
        }
        await persistGeneralProgramDraft(
          draft,
          omitRecruitmentTabScheduleFields(patch),
          baseline
        )
      },
    [
      displayProgram,
      persistGeneralProgramDraft,
      queryClient,
      remoteEnabled,
      setSelectedProgram,
      strictRemoteRecruitment,
      updateTrainedTeacherProgramMutation,
    ]
  )

  const volunteerInterviewEnabled = displayProgram
    ? getGeneralVolunteerInterviewEnabled(displayProgram)
    : false
  const participantInterviewEnabled = displayProgram
    ? getGeneralParticipantInterviewEnabled(displayProgram)
    : false
  const progressMenuItems = useMemo(
    () => (displayProgram ? getGeneralProgressMenuItems(displayProgram) : []),
    [displayProgram]
  )
  const isIndividualProgram = displayProgram
    ? isGeneralIndividualProgram(displayProgram)
    : false
  const surveyItems = useMemo(
    () => (displayProgram ? getGeneralSurveyMenuItems(displayProgram) : []),
    [displayProgram]
  )
  const surveyKeys = useMemo(() => surveyItems.map(s => s.key), [surveyItems])
  const showInstructorApplications = displayProgram
    ? hasGeneralInstructorApplications(displayProgram) &&
      !disabledLnbKeys.has('instructor_applications')
    : false
  const volunteerLnbVisibility = useMemo((): GeneralVolunteerApplicationsLnbVisibility | undefined => {
    if (!isNavigationRemote) return undefined
    return {
      allowedApplicationTargets: navigation?.allowedApplicationTargets,
      volunteerLnbDisabled: disabledLnbKeys.has('volunteer_applications'),
      honorNavigationTargets: true,
    }
  }, [
    disabledLnbKeys,
    isNavigationRemote,
    navigation?.allowedApplicationTargets,
  ])

  const showVolunteerApplications = displayProgram
    ? shouldShowGeneralVolunteerApplicationsLnb(displayProgram, volunteerLnbVisibility)
    : false
  const showParticipantApplications = displayProgram
    ? hasGeneralParticipantApplications(displayProgram) &&
      !(isIndividualProgram
        ? disabledLnbKeys.has('participant_applications')
        : disabledLnbKeys.has('institution_applications'))
    : false
  const showManagers = !disabledLnbKeys.has('managers')
  const progressMenuItemsFiltered = useMemo(
    () => getVisibleGeneralProgressMenuItems(progressMenuItems, disabledLnbKeys.has('progress')),
    [disabledLnbKeys, progressMenuItems]
  )
  const participantApplicationsLnbLabel = useMemo(
    () =>
      displayProgram
        ? getGeneralParticipantApplicationsLnbLabel(displayProgram)
        : GENERAL_ORGANIZATION_APPLICATIONS_LNB_LABEL,
    [displayProgram]
  )

  const programNavigationMetaKey = useMemo(() => {
    if (!displayProgram) return ''
    return [
      displayProgram.id,
      displayProgram.category,
      getGeneralParticipantTypes(displayProgram).join(','),
      getGeneralParticipantInterviewEnabled(displayProgram) ? '1' : '0',
      getGeneralVolunteerInterviewEnabled(displayProgram) ? '1' : '0',
      surveyKeys.join(','),
      progressMenuItems.map(item => item.tab).join(','),
      (navigation?.allowedApplicationTargets ?? []).join(','),
      disabledLnbKeys.has('volunteer_applications') ? 'vol-off' : 'vol-on',
      isNavigationRemote ? 'nav-remote' : 'nav-local',
    ].join('|')
  }, [
    displayProgram,
    surveyKeys,
    progressMenuItems,
    navigation?.allowedApplicationTargets,
    disabledLnbKeys,
    isNavigationRemote,
  ])

  const urlDetailRoute = useMemo(() => {
    if (!open) {
      return { lnb: 'info' as GeneralDetailLnbKey, tab: 'info' }
    }
    return readGeneralProgramDetailRoute(searchParams)
  }, [open, searchParamsKey, searchParams])

  const [optimisticDetailRoute, setOptimisticDetailRoute] = useState<{
    lnb: GeneralDetailLnbKey
    tab: string
  } | null>(null)

  useEffect(() => {
    if (!open) {
      setOptimisticDetailRoute(null)
      return
    }
    if (
      optimisticDetailRoute &&
      optimisticDetailRoute.lnb === urlDetailRoute.lnb &&
      optimisticDetailRoute.tab === urlDetailRoute.tab
    ) {
      setOptimisticDetailRoute(null)
    }
  }, [open, urlDetailRoute, optimisticDetailRoute])

  const activeLnb = optimisticDetailRoute?.lnb ?? urlDetailRoute.lnb
  const activeTab = optimisticDetailRoute?.tab ?? urlDetailRoute.tab
  const editTab = open ? searchParams.get(EDIT_PARAM) : null
  const schoolIdFromUrl = open ? searchParams.get(SCHOOL_ID_PARAM) : null
  const activeSchoolTab = schoolIdFromUrl
    ? parseSchoolTabFromSearch(
        searchParams,
        displayProgram,
        navigationCapabilities.educationJournalEnabled
      )
    : 'application'
  const instructorIdFromUrl = open ? searchParams.get(INSTRUCTOR_ID_PARAM) : null
  const activeInstructorTab = useMemo(() => {
    if (!instructorIdFromUrl) return 'application' as const
    return parseInstructorTabFromSearch(searchParams)
  }, [instructorIdFromUrl, searchParams, searchParamsKey])
  const volunteerIdFromUrl = open ? searchParams.get(VOLUNTEER_ID_PARAM) : null
  const activeVolunteerTab = useMemo(() => {
    if (!volunteerIdFromUrl) return 'application' as const
    return parseVolunteerTabFromSearch(searchParams)
  }, [volunteerIdFromUrl, searchParams, searchParamsKey])
  const participantIdFromUrl = open ? searchParams.get(PARTICIPANT_ID_PARAM) : null
  const activeParticipantTab = participantIdFromUrl
    ? parseParticipantTabFromSearch(searchParams, displayProgram)
    : 'application'

  const isClosingRef = useRef(false)

  const applyDetailSearchParams = useCallback(
    (next: URLSearchParams, options?: { replace?: boolean }) => {
      if (isClosingRef.current) return
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          return next
        },
        { replace: options?.replace ?? true }
      )
    },
    [setSearchParams]
  )

  const [isInfoEditing, setIsInfoEditing] = useState(false)

  const setEditMode = useCallback(
    (tab: string | null) => {
      if (tab === 'info') setIsInfoEditing(true)
      else setIsInfoEditing(false)
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          if (tab) next.set(EDIT_PARAM, tab)
          else next.delete(EDIT_PARAM)
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: true }
      )
    },
    [programId, setSearchParams]
  )

  const canEditCommonInfo = useMemo(
    () => canGeneralProgramCommonInfoEdit(displayProgram),
    [displayProgram]
  )

  const canEditParticipantRecruitment = useMemo(
    () => canGeneralProgramRecruitmentInfoEdit(displayProgram, 'PARTICIPANT'),
    [displayProgram]
  )
  const canEditInstructorRecruitment = useMemo(
    () => canGeneralProgramRecruitmentInfoEdit(displayProgram, 'INSTRUCTOR'),
    [displayProgram]
  )
  const canEditVolunteerRecruitment = useMemo(
    () => canGeneralProgramRecruitmentInfoEdit(displayProgram, 'VOLUNTEER'),
    [displayProgram]
  )

  const isEditModeInfo =
    open &&
    activeLnb === 'info' &&
    activeTab === 'info' &&
    isInfoEditing &&
    !!displayProgram &&
    canEditCommonInfo

  const infoForm = useGeneralProgramCommonInfoEditForm({
    program: displayProgram,
    isEditMode: isEditModeInfo,
  })
  const { triggerSave: infoTriggerSave, resetToProgram: infoResetToProgram } =
    useGeneralProgramCommonInfoSave({
      form: infoForm,
      program: displayProgram ?? null,
      onSaveEdit: displayProgram
        ? async (draft, patch, baseline, serializeOptions) => {
            await persistGeneralProgramDraft(draft, patch, baseline, serializeOptions)
          }
        : undefined,
    })
  const [structureChangeConfirmOpen, setStructureChangeConfirmOpen] = useState(false)
  const [structureChangeConfirmLoading, setStructureChangeConfirmLoading] = useState(false)

  const handleInfoEdit = useCallback(() => {
    if (activeLnb !== 'info' || activeTab !== 'info' || !displayProgram) return
    if (!canGeneralProgramCommonInfoEdit(displayProgram)) {
      showAlert({
        title: '안내',
        content: getGeneralProgramCommonInfoEditBlockedAlertMessage(displayProgram),
      })
      return
    }
    seedGeneralRegistrationOverlayFromProgram(displayProgram)
    logGeneralProgramCommonInfoEditCurrentPayload(displayProgram, 'enter')
    infoResetToProgram()
    setEditMode('info')
  }, [activeLnb, activeTab, displayProgram, infoResetToProgram, setEditMode, showAlert])

  useEffect(() => {
    if (!open) {
      setIsInfoEditing(false)
      return
    }
    if (searchParams.get(EDIT_PARAM) === 'info') setIsInfoEditing(true)
    // 상세 모달 오픈 시점 URL만 반영. 저장 후 URL 잔존으로 수정 모드가 되살아나지 않게 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open transition only
  }, [open])

  useEffect(() => {
    if (activeLnb !== 'info' || activeTab !== 'info') {
      setIsInfoEditing(false)
    }
  }, [activeLnb, activeTab])

  useEffect(() => {
    if (!open || !displayProgram || !isInfoEditing) return
    if (activeLnb !== 'info' || activeTab !== 'info') return
    if (canGeneralProgramCommonInfoEdit(displayProgram)) return
    setEditMode(null)
  }, [open, isInfoEditing, displayProgram, activeLnb, activeTab, setEditMode])

  useEffect(() => {
    if (!open || !displayProgram) return
    if (
      editTab !== 'institutions' &&
      editTab !== 'instructors' &&
      editTab !== 'volunteers'
    ) {
      return
    }
    if (activeLnb !== 'info' || activeTab !== 'recruitment') return
    const recruitmentType =
      editTab === 'instructors'
        ? 'INSTRUCTOR'
        : editTab === 'volunteers'
          ? 'VOLUNTEER'
          : 'PARTICIPANT'
    if (canGeneralProgramRecruitmentInfoEdit(displayProgram, recruitmentType)) return
    setEditMode(null)
  }, [open, editTab, displayProgram, activeLnb, activeTab, setEditMode])

  const runInfoSave = useCallback(async () => {
    if (displayProgram) logGeneralProgramCommonInfoEditCurrentPayload(displayProgram, 'save')
    const values = infoForm.getValues()
    const rhfValidation = parseGeneralCommonInfoRhfValidation(values)
    if (!rhfValidation.ok) {
      if (rhfValidation.keys.length > 0) detailRequiredHighlight.report(rhfValidation.keys)
      void showAlert(resolveGeneralCommonInfoValidationAlert(rhfValidation))
      return
    }
    if (hasRhfCurriculumMultiDateScheduleCountMismatch(values)) {
      void showAlert({
        title: EDUCATION_SCHEDULE_COUNT_MISMATCH_ALERT_TITLE,
        content: EDUCATION_SCHEDULE_COUNT_MISMATCH_ALERT_MESSAGE,
      })
      return
    }
    const endOverlay = beginBlockingOverlay()
    let pendingAlert: { title: string; content: ReactNode } | null = null
    try {
      const result = await infoTriggerSave()
      if (!result.ok) {
        if (result.kind === 'validation') {
          if (result.keys.length > 0) detailRequiredHighlight.report(result.keys)
          pendingAlert = resolveGeneralCommonInfoValidationAlert({
            alertKind: result.alertKind ?? 'required-incomplete',
            message: result.message,
          })
        } else if (result.kind === 'schedule-count-mismatch') {
          pendingAlert = {
            title: EDUCATION_SCHEDULE_COUNT_MISMATCH_ALERT_TITLE,
            content: EDUCATION_SCHEDULE_COUNT_MISMATCH_ALERT_MESSAGE,
          }
        } else if (result.kind === TRAINED_TEACHERS_DEDICATED_DETAIL_SAVE_KIND) {
          if (displayProgram) {
            navigate(
              getProgramAdminDetailInfoTabUrlForProgramType(
                displayProgram.id,
                displayProgram.backendProgramType ?? 'TRAINED_TEACHER'
              ),
              { replace: true }
            )
          }
        } else if (result.kind === 'api') {
          if (
            programId &&
            getGeneralProgramApiErrorCode(result.error) ===
              'PROGRAM_EDUCATION_STRUCTURE_CHANGE_CONCURRENT'
          ) {
            void queryClient.invalidateQueries({
              queryKey: generalProgramQueryKeys.detail(programId),
            })
          }
          if (!isGlobalApiErrorAlertShown(result.error)) {
            pendingAlert = {
              title: '저장 실패',
              content: getGeneralProgramApiErrorMessage(
                result.error,
                '저장 중 오류가 발생했습니다. 다시 시도해 주세요.'
              ),
            }
          }
        }
      } else {
        detailRequiredHighlight.clear()
        setEditMode(null)
      }
    } finally {
      endOverlay()
    }
    if (pendingAlert) void showAlert(pendingAlert)
  }, [
    detailRequiredHighlight,
    displayProgram,
    infoForm,
    infoTriggerSave,
    navigate,
    programId,
    queryClient,
    setEditMode,
    showAlert,
  ])

  const handleInfoSave = useCallback(async () => {
    const values = infoForm.getValues()
    if (
      displayProgram &&
      isProgramTypeSettingsSaveBlocked(displayProgram, {
        educationStructure: values.educationStructure,
        sessionRound: values.sessionRound,
        participationMethod: values.participationMethod,
        participationScheduleDetail: values.participationScheduleDetail,
      })
    ) {
      void showAlert({
        title: PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_TITLE,
        content: PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE,
      })
      return
    }
    if (displayProgram && isEducationStructureChanged(displayProgram, values.educationStructure)) {
      setStructureChangeConfirmOpen(true)
      return
    }
    await runInfoSave()
  }, [displayProgram, infoForm, runInfoSave, showAlert])

  const handleStructureChangeConfirm = useCallback(async () => {
    setStructureChangeConfirmLoading(true)
    try {
      await runInfoSave()
    } finally {
      setStructureChangeConfirmLoading(false)
      setStructureChangeConfirmOpen(false)
    }
  }, [runInfoSave])

  const handleStructureChangeCancel = useCallback(() => {
    if (structureChangeConfirmLoading) return
    setStructureChangeConfirmOpen(false)
  }, [structureChangeConfirmLoading])

  const handleInfoCancel = useCallback(() => {
    if (displayProgram) seedGeneralRegistrationOverlayFromProgram(displayProgram)
    infoResetToProgram()
    detailRequiredHighlight.clear()
    setEditMode(null)
  }, [detailRequiredHighlight, displayProgram, infoResetToProgram, setEditMode])

  const recruitSubTab = useMemo((): GeneralRecruitTabKey => {
    if (activeLnb !== 'info' || activeTab !== 'recruitment') return 'institutions'
    return normalizeGeneralRecruitTab(searchParams.get(GENERAL_PROGRAM_DETAIL_SUB_TAB_PARAM), {
      showInstructor: showInstructorApplications,
      showVolunteer: showVolunteerApplications,
    })
  }, [
    activeLnb,
    activeTab,
    searchParamsKey,
    showInstructorApplications,
    showVolunteerApplications,
  ])

  const handleRecruitSubTabChange = useCallback(
    (tab: GeneralRecruitTabKey) => {
      if (editTab) setEditMode(null)
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          next.set(GENERAL_PROGRAM_DETAIL_SUB_TAB_PARAM, tab)
          clearGeneralProgramRecruitmentPreviewParams(next)
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: true }
      )
    },
    [editTab, programId, setEditMode, setSearchParams]
  )

  const applicationSubTab = useMemo((): GeneralApplicationTabKey => {
    if (activeLnb !== 'info' || activeTab !== 'application') return 'institutions'
    return normalizeGeneralApplicationTab(
      searchParams.get(GENERAL_PROGRAM_DETAIL_SUB_TAB_PARAM),
      {
        showInstructor: showInstructorApplications,
        showVolunteer: showVolunteerApplications,
      }
    )
  }, [
    activeLnb,
    activeTab,
    searchParamsKey,
    showInstructorApplications,
    showVolunteerApplications,
  ])

  const [applicationTemplateEditOpen, setApplicationTemplateEditOpen] = useState(false)
  const [applicationPreviewReloadKey, setApplicationPreviewReloadKey] = useState(0)

  const handleApplicationSubTabChange = useCallback(
    (tab: GeneralApplicationTabKey) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          next.set(GENERAL_PROGRAM_DETAIL_SUB_TAB_PARAM, tab)
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: true }
      )
    },
    [programId, setSearchParams]
  )

  const handleApplicationEditForm = useCallback(() => {
    if (
      displayProgram &&
      !canGeneralProgramApplicationFormEdit(
        displayProgram,
        recruitmentEditTypeForDetailTab(applicationSubTab)
      )
    ) {
      return
    }
    setApplicationTemplateEditOpen(true)
  }, [applicationSubTab, displayProgram])

  useEffect(() => {
    if (!applicationTemplateEditOpen || !displayProgram) return
    if (
      canGeneralProgramApplicationFormEdit(
        displayProgram,
        recruitmentEditTypeForDetailTab(applicationSubTab)
      )
    ) {
      return
    }
    setApplicationTemplateEditOpen(false)
  }, [applicationSubTab, applicationTemplateEditOpen, displayProgram])

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
    !!displayProgram &&
    canEditParticipantRecruitment

  const persistParticipantRecruitmentDraft = persistRecruitmentTab('participant')
  const persistInstructorRecruitmentDraft = persistRecruitmentTab('instructor')
  const persistVolunteerRecruitmentDraft = persistRecruitmentTab('volunteer')

  const institutionsForm = useProgramDetailEditForm({
    program: recruitmentEditProgram,
    isEditMode: isEditModeInstitutions,
    schema: programDetailInstitutionsEditSchema,
    mapToValues: mapParticipantRecruitmentEditValues,
    holdValuesWhileEditing: true,
  })
  const {
    triggerSave: institutionsTriggerSave,
    resetToProgram: institutionsResetToProgram,
    registerGetAdditionalContentHtml: registerInstitutionsAdditionalHtml,
    takeSaveFailure: takeInstitutionsSaveFailure,
  } = useProgramDetailInfoSave({
    form: institutionsForm,
    program: recruitmentEditProgram,
    mapToValues: mapParticipantRecruitmentEditValues,
    onSaveEdit: recruitmentEditProgram ? persistParticipantRecruitmentDraft : undefined,
    validateSchema: programParticipantRecruitmentSaveSchema,
    recruitmentAudience: 'participant',
    strictRemote: strictRemoteRecruitment,
  })

  const isEditModeInstructors =
    open &&
    activeLnb === 'info' &&
    activeTab === 'recruitment' &&
    recruitSubTab === 'instructors' &&
    editTab === 'instructors' &&
    !!displayProgram &&
    canEditInstructorRecruitment

  const instructorsForm = useProgramDetailEditForm({
    program: recruitmentEditProgram,
    isEditMode: isEditModeInstructors,
    mapToValues: mapInstructorRecruitmentEditValues,
    holdValuesWhileEditing: true,
  })
  const {
    triggerSave: instructorsTriggerSave,
    resetToProgram: instructorsResetToProgram,
    registerGetAdditionalContentHtml: registerInstructorsAdditionalHtml,
    takeSaveFailure: takeInstructorsSaveFailure,
  } = useProgramDetailInfoSave({
    form: instructorsForm,
    program: recruitmentEditProgram,
    mapToValues: mapInstructorRecruitmentEditValues,
    onSaveEdit: recruitmentEditProgram ? persistInstructorRecruitmentDraft : undefined,
    validateSchema: programInstructorRecruitmentSaveSchema,
    recruitmentAudience: 'instructor',
    recruitmentNotesField: 'instructorRecruitmentRemarks',
    strictRemote: strictRemoteRecruitment,
  })

  const isEditModeVolunteers =
    open &&
    activeLnb === 'info' &&
    activeTab === 'recruitment' &&
    recruitSubTab === 'volunteers' &&
    editTab === 'volunteers' &&
    !!displayProgram &&
    canEditVolunteerRecruitment

  const volunteersForm = useProgramDetailEditForm({
    program: recruitmentEditProgram,
    isEditMode: isEditModeVolunteers,
    mapToValues: mapVolunteerRecruitmentEditValues,
    holdValuesWhileEditing: true,
  })
  const {
    triggerSave: volunteersTriggerSave,
    resetToProgram: volunteersResetToProgram,
    registerGetAdditionalContentHtml: registerVolunteersAdditionalHtml,
    takeSaveFailure: takeVolunteersSaveFailure,
  } = useProgramDetailInfoSave({
    form: volunteersForm,
    program: recruitmentEditProgram,
    mapToValues: mapVolunteerRecruitmentEditValues,
    onSaveEdit: recruitmentEditProgram ? persistVolunteerRecruitmentDraft : undefined,
    validateSchema: programVolunteerRecruitmentSaveSchema,
    recruitmentAudience: 'volunteer',
    strictRemote: strictRemoteRecruitment,
  })

  const handleRecruitmentEdit = useCallback(() => {
    if (activeLnb !== 'info' || activeTab !== 'recruitment' || !displayProgram) return
    const recruitmentType =
      recruitSubTab === 'instructors'
        ? 'INSTRUCTOR'
        : recruitSubTab === 'volunteers'
          ? 'VOLUNTEER'
          : 'PARTICIPANT'
    if (!canGeneralProgramRecruitmentInfoEdit(displayProgram, recruitmentType)) {
      showAlert({
        title: getGeneralProgramRecruitmentInfoEditBlockedAlertTitle(),
        content: getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(displayProgram),
      })
      return
    }
    if (recruitSubTab === 'institutions') {
      prepareRecruitOperationalEditFromProgram(displayProgram, 'participant', {
        strictRemote: strictRemoteRecruitment,
      })
      institutionsResetToProgram()
      setEditMode('institutions')
      return
    }
    if (recruitSubTab === 'instructors') {
      prepareRecruitOperationalEditFromProgram(displayProgram, 'instructor', {
        strictRemote: strictRemoteRecruitment,
      })
      instructorsResetToProgram()
      setEditMode('instructors')
      return
    }
    if (recruitSubTab === 'volunteers') {
      prepareRecruitOperationalEditFromProgram(displayProgram, 'volunteer', {
        strictRemote: strictRemoteRecruitment,
      })
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
    showAlert,
    strictRemoteRecruitment,
  ])

  const handleRecruitmentSave = useCallback(async () => {
    if (displayProgram) {
      const audience =
        recruitSubTab === 'instructors'
          ? 'instructor'
          : recruitSubTab === 'volunteers'
            ? 'volunteer'
            : 'participant'
      const form =
        audience === 'instructor'
          ? instructorsForm
          : audience === 'volunteer'
            ? volunteersForm
            : institutionsForm
      const incompleteKeys = listIncompleteDetailRecruitmentHighlightKeys({
        program: displayProgram,
        audience,
        values: form.getValues(),
      })
      if (incompleteKeys.length > 0) {
        detailRequiredHighlight.report(incompleteKeys)
        void showAlert({
          title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
          content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
        })
        return
      }
    }
    const endOverlay = beginBlockingOverlay()
    try {
      let saved = false
      let failure: 'validation' | 'api' | null = null
      if (recruitSubTab === 'institutions') {
        saved = await institutionsTriggerSave()
        failure = takeInstitutionsSaveFailure()
      } else if (recruitSubTab === 'instructors') {
        saved = await instructorsTriggerSave()
        failure = takeInstructorsSaveFailure()
      } else if (recruitSubTab === 'volunteers') {
        saved = await volunteersTriggerSave()
        failure = takeVolunteersSaveFailure()
      }
      if (!saved) {
        if (failure !== 'api') {
          void showAlert({ title: '입력 확인', content: '입력값을 확인해 주세요.' })
        }
        return
      }
      detailRequiredHighlight.clear()
      setEditMode(null)
    } finally {
      endOverlay()
    }
  }, [
    detailRequiredHighlight,
    displayProgram,
    institutionsForm,
    instructorsForm,
    volunteersForm,
    recruitSubTab,
    institutionsTriggerSave,
    instructorsTriggerSave,
    volunteersTriggerSave,
    takeInstitutionsSaveFailure,
    takeInstructorsSaveFailure,
    takeVolunteersSaveFailure,
    setEditMode,
    showAlert,
  ])

  const handleRecruitmentCancel = useCallback(() => {
    if (recruitSubTab === 'institutions') institutionsResetToProgram()
    else if (recruitSubTab === 'instructors') instructorsResetToProgram()
    else volunteersResetToProgram()
    detailRequiredHighlight.clear()
    setEditMode(null)
  }, [
    detailRequiredHighlight,
    recruitSubTab,
    institutionsResetToProgram,
    instructorsResetToProgram,
    volunteersResetToProgram,
    setEditMode,
  ])

  // 신청 상세 중첩 — 헤더 X 시 목록 복귀용 (handleHeaderClose에서 호출)
  const applicantCloseHandlerRef = useRef<(() => boolean) | null>(null)
  const volunteerApplicantCloseHandlerRef = useRef<(() => boolean) | null>(null)
  const registerApplicantCloseHandler = useCallback((fn: (() => boolean) | null) => {
    applicantCloseHandlerRef.current = fn
  }, [])
  const registerVolunteerApplicantCloseHandler = useCallback((fn: (() => boolean) | null) => {
    volunteerApplicantCloseHandlerRef.current = fn
  }, [])
  const [volunteerApplicantDetailMeta, setVolunteerApplicantDetailMeta] =
    useState<GeneralVolunteerApplicantDetailMeta | null>(null)
  const [listApplicantDetailMeta, setListApplicantDetailMeta] =
    useState<ApplicantDetailMeta>(null)

  const applicantIdFromUrl = open ? searchParams.get(APPLICANT_ID_PARAM) : null

  const applicantDetailMetaFromUrl = useMemo((): ApplicantDetailMeta => {
    if (!open || !programId) return null
    return resolveGeneralApplicantDetailMetaFromUrl({
      programId,
      activeLnb,
      activeTab,
      applicantId: applicantIdFromUrl,
    })
  }, [open, programId, activeLnb, activeTab, applicantIdFromUrl])

  /** remote 목록 행 meta 우선, mock URL 해석은 폴백 */
  const applicantDetailMeta = listApplicantDetailMeta ?? applicantDetailMetaFromUrl

  const displayProgramRef = useRef(displayProgram)
  displayProgramRef.current = displayProgram

  useEffect(() => {
    if (!open) {
      isClosingRef.current = false
      return
    }
    if (isClosingRef.current) return
    if (!programId || !displayProgramRef.current) return
    setSearchParams(
      prev => {
        if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
        if (prev.get('programId') !== programId) return prev
        const normalized = normalizeGeneralDetailParams(
          programId,
          prev,
          displayProgramRef.current!,
          volunteerLnbVisibility
        )
        if (!normalized) return prev
        if (normalized.toString() === prev.toString()) return prev
        return normalized
      },
      { replace: true }
    )
  }, [open, programId, programNavigationMetaKey, setSearchParams, volunteerLnbVisibility])

  const handleRequestClose = useCallback(() => {
    isClosingRef.current = true
    setOptimisticDetailRoute(null)
    if (tryNavigateMemberDetailReturn(navigate)) {
      onClose()
      return
    }
    // 부모 onClose와 별도로 상세 쿼리를 즉시 제거 — applySearch 등 클로저 레이스로
    // programId가 남는 경우에도 모달이 닫히도록 한다.
    setSearchParams(
      prev => {
        if (!prev.get('programId')) return prev
        return clearGeneralProgramDetailQueryParams(new URLSearchParams(prev))
      },
      { replace: true }
    )
    onClose()
  }, [navigate, onClose, setSearchParams])

  const recruitmentPreviewAudienceFromUrl = useMemo(
    () => readOpenRecruitmentPreviewAudience(routerSearchParams),
    [routerSearchParamsKey, routerSearchParams]
  )

  const [recruitmentPreviewAudienceOptimistic, setRecruitmentPreviewAudienceOptimistic] =
    useState<GeneralRecruitTabKey | null>(null)

  useEffect(() => {
    if (!open) {
      setRecruitmentPreviewAudienceOptimistic(null)
    }
  }, [open])

  useEffect(() => {
    if (!recruitmentPreviewAudienceFromUrl) {
      setRecruitmentPreviewAudienceOptimistic(null)
    }
  }, [recruitmentPreviewAudienceFromUrl])

  const recruitmentPreviewAudience =
    open && displayProgram != null
      ? (recruitmentPreviewAudienceFromUrl ?? recruitmentPreviewAudienceOptimistic)
      : null

  const recruitmentPreviewOpen = recruitmentPreviewAudience != null

  const handleOpenRecruitmentPreview = useCallback(
    (audience: GeneralRecruitTabKey) => {
      if (!programId) return
      setRecruitmentPreviewAudienceOptimistic(audience)
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          preserveGeneralProgramDetailProgramId(prev, next)
          clearGeneralProgramRecruitmentPreviewParams(next)
          next.set(
            recruitmentPreviewParamForAudience(audience),
            GENERAL_PROGRAM_RECRUITMENT_PREVIEW_ACTIVE
          )
          return next
        },
        { replace: false }
      )
    },
    [programId, setSearchParams]
  )

  const handleCloseRecruitmentPreview = useCallback(() => {
    setRecruitmentPreviewAudienceOptimistic(null)
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        clearGeneralProgramRecruitmentPreviewParams(next)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const setSchoolId = useCallback(
    (id: string | null) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          if (id) {
            next.set(SCHOOL_ID_PARAM, id)
            next.set(SCHOOL_TAB_PARAM, 'application')
            next.delete(INSTRUCTOR_ID_PARAM)
            next.delete(INSTRUCTOR_TAB_PARAM)
            next.delete(VOLUNTEER_ID_PARAM)
            next.delete(VOLUNTEER_TAB_PARAM)
            next.delete(PARTICIPANT_ID_PARAM)
            next.delete(PARTICIPANT_TAB_PARAM)
          } else {
            next.delete(SCHOOL_ID_PARAM)
            next.delete(SCHOOL_TAB_PARAM)
          }
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: id == null }
      )
    },
    [setSearchParams]
  )

  const setInstructorId = useCallback(
    (id: string | null) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          if (id) {
            const prevId = prev.get(INSTRUCTOR_ID_PARAM)
            next.set(INSTRUCTOR_ID_PARAM, id)
            // 동일 강사 재진입 시 중첩 탭(instructorTab)을 application으로 덮어쓰지 않음
            if (prevId !== id) {
              next.set(INSTRUCTOR_TAB_PARAM, 'application')
            } else if (!prev.get(INSTRUCTOR_TAB_PARAM)) {
              next.set(INSTRUCTOR_TAB_PARAM, 'application')
            }
            next.delete(SCHOOL_ID_PARAM)
            next.delete(SCHOOL_TAB_PARAM)
            next.delete(VOLUNTEER_ID_PARAM)
            next.delete(VOLUNTEER_TAB_PARAM)
            next.delete(PARTICIPANT_ID_PARAM)
            next.delete(PARTICIPANT_TAB_PARAM)
          } else {
            next.delete(INSTRUCTOR_ID_PARAM)
            next.delete(INSTRUCTOR_TAB_PARAM)
          }
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: id == null }
      )
    },
    [setSearchParams]
  )

  const setVolunteerId = useCallback(
    (id: string | null) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          if (id) {
            const prevId = prev.get(VOLUNTEER_ID_PARAM)
            next.set(LNB_PARAM, 'progress')
            next.set(TAB_PARAM, 'progress_volunteers')
            next.set(VOLUNTEER_ID_PARAM, id)
            // 동일 봉사자 재진입 시 중첩 탭(volunteerTab)을 application으로 덮어쓰지 않음
            if (prevId !== id) {
              next.set(VOLUNTEER_TAB_PARAM, 'application')
            } else if (!prev.get(VOLUNTEER_TAB_PARAM)) {
              next.set(VOLUNTEER_TAB_PARAM, 'application')
            }
            next.delete(SCHOOL_ID_PARAM)
            next.delete(SCHOOL_TAB_PARAM)
            next.delete(INSTRUCTOR_ID_PARAM)
            next.delete(INSTRUCTOR_TAB_PARAM)
            next.delete(PARTICIPANT_ID_PARAM)
            next.delete(PARTICIPANT_TAB_PARAM)
          } else {
            next.delete(VOLUNTEER_ID_PARAM)
            next.delete(VOLUNTEER_TAB_PARAM)
          }
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: id == null }
      )
    },
    [setSearchParams]
  )

  const setParticipantId = useCallback(
    (id: string | null) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          if (id) {
            next.set(PARTICIPANT_ID_PARAM, id)
            next.set(PARTICIPANT_TAB_PARAM, 'application')
            next.delete(SCHOOL_ID_PARAM)
            next.delete(SCHOOL_TAB_PARAM)
            next.delete(INSTRUCTOR_ID_PARAM)
            next.delete(INSTRUCTOR_TAB_PARAM)
            next.delete(VOLUNTEER_ID_PARAM)
            next.delete(VOLUNTEER_TAB_PARAM)
          } else {
            next.delete(PARTICIPANT_ID_PARAM)
            next.delete(PARTICIPANT_TAB_PARAM)
          }
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: id == null }
      )
    },
    [setSearchParams]
  )

  /**
   * 헤더 X / ESC — 중첩 상세(강사·기관·참여자·봉사자·진행 현황)면 목록만 복귀.
   * 프로그램 상세 전체 닫기는 breadcrumb「프로그램 목록」또는 중첩이 없을 때만.
   */
  const handleHeaderClose = useCallback(() => {
    // 진행 현황 중첩 상세는 신청 목록 close handler·stale applicantId보다 우선 (X 1회로 목록 복귀)
    if (activeLnb === 'progress') {
      if (schoolIdFromUrl) {
        setSchoolId(null)
        return
      }
      if (instructorIdFromUrl) {
        setInstructorId(null)
        return
      }
      if (volunteerIdFromUrl) {
        setVolunteerId(null)
        return
      }
      if (participantIdFromUrl) {
        setParticipantId(null)
        return
      }
    }
    const onParticipantApplicationLnb =
      activeLnb === 'institution_applications' || activeLnb === 'instructor_applications'
    if (onParticipantApplicationLnb && applicantCloseHandlerRef.current?.()) return
    if (
      isGeneralVolunteerApplicantDetailRoute(activeLnb, activeTab) &&
      volunteerApplicantCloseHandlerRef.current?.()
    ) {
      return
    }
    if (applicantIdFromUrl) {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          if (!prev.has(APPLICANT_ID_PARAM)) return prev
          const next = new URLSearchParams(prev)
          next.delete(APPLICANT_ID_PARAM)
          next.delete(DETAIL_TAB_PARAM)
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: true }
      )
      return
    }
    handleRequestClose()
  }, [
    activeTab,
    activeLnb,
    applicantIdFromUrl,
    handleRequestClose,
    instructorIdFromUrl,
    participantIdFromUrl,
    schoolIdFromUrl,
    setInstructorId,
    setParticipantId,
    setSchoolId,
    setSearchParams,
    setVolunteerId,
    volunteerIdFromUrl,
  ])

  const setSchoolTab = useCallback(
    (tab: ParticipatingInstitutionDetailTabKey) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          next.set(
            SCHOOL_TAB_PARAM,
            normalizeParticipatingInstitutionDetailTab(
              tab,
              displayProgramRef.current,
              navigationCapabilities.educationJournalEnabled
            )
          )
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: true }
      )
    },
    [navigationCapabilities.educationJournalEnabled, setSearchParams]
  )

  const setInstructorTab = useCallback(
    (tab: InstructorDetailTabKey) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          next.set(INSTRUCTOR_TAB_PARAM, tab)
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setVolunteerTab = useCallback(
    (tab: VolunteerDetailTabKey) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          next.set(VOLUNTEER_TAB_PARAM, tab)
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setParticipantTab = useCallback(
    (tab: ParticipantDetailTabKey) => {
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          next.set(PARTICIPANT_TAB_PARAM, tab)
          preserveGeneralProgramDetailProgramId(prev, next)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setLnbTab = useCallback(
    (lnb: GeneralDetailLnbKey, tab: string) => {
      if (!programId || isClosingRef.current) return
      if (lnb === 'survey' && surveyItems.length === 0) {
        void showAlert({
          title: '안내',
          content: GENERAL_SURVEY_MENU_EMPTY_ALERT_MESSAGE,
        })
        return
      }
      setOptimisticDetailRoute({ lnb, tab })
      setSearchParams(
        prev => {
          if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
          const next = new URLSearchParams(prev)
          next.set(GENERAL_PROGRAM_DETAIL_LNB_PARAM, lnb)
          next.set(GENERAL_PROGRAM_DETAIL_TAB_PARAM, tab)
          preserveGeneralProgramDetailProgramId(prev, next)
          next.delete(GENERAL_PROGRAM_DETAIL_EDIT_PARAM)

          const isRecruitmentTab = lnb === 'info' && tab === 'recruitment'
          const isApplicationTab = lnb === 'info' && tab === 'application'
          if (!isRecruitmentTab && !isApplicationTab) {
            next.delete(GENERAL_PROGRAM_DETAIL_SUB_TAB_PARAM)
          }
          if (!isRecruitmentTab) {
            clearGeneralProgramRecruitmentPreviewParams(next)
          }

          if (lnb !== 'progress') {
            for (const key of GENERAL_PROGRESS_NESTED_QUERY_PARAMS) next.delete(key)
          } else if (tab === 'progress_participants') {
            next.delete(INSTRUCTOR_ID_PARAM)
            next.delete(INSTRUCTOR_TAB_PARAM)
            next.delete(VOLUNTEER_ID_PARAM)
            next.delete(VOLUNTEER_TAB_PARAM)
            if (displayProgramRef.current && isGeneralIndividualProgram(displayProgramRef.current)) {
              next.delete(SCHOOL_ID_PARAM)
              next.delete(SCHOOL_TAB_PARAM)
            } else {
              next.delete(PARTICIPANT_ID_PARAM)
            }
          } else if (tab === 'progress_instructors') {
            next.delete(SCHOOL_ID_PARAM)
            next.delete(SCHOOL_TAB_PARAM)
            next.delete(VOLUNTEER_ID_PARAM)
            next.delete(VOLUNTEER_TAB_PARAM)
            next.delete(PARTICIPANT_ID_PARAM)
          } else if (tab === 'progress_volunteers') {
            next.delete(SCHOOL_ID_PARAM)
            next.delete(SCHOOL_TAB_PARAM)
            next.delete(INSTRUCTOR_ID_PARAM)
            next.delete(INSTRUCTOR_TAB_PARAM)
            next.delete(PARTICIPANT_ID_PARAM)
          } else {
            next.delete(SCHOOL_ID_PARAM)
            next.delete(SCHOOL_TAB_PARAM)
            next.delete(INSTRUCTOR_ID_PARAM)
            next.delete(INSTRUCTOR_TAB_PARAM)
            next.delete(VOLUNTEER_ID_PARAM)
            next.delete(VOLUNTEER_TAB_PARAM)
            next.delete(PARTICIPANT_ID_PARAM)
          }

          return next
        },
        { replace: true }
      )
    },
    [programId, setSearchParams, showAlert, surveyItems.length]
  )

  const [schoolDetailTitle, setSchoolDetailTitle] = useState<string | null>(null)
  const [instructorDetailTitle, setInstructorDetailTitle] = useState<string | null>(null)
  const [volunteerDetailTitle, setVolunteerDetailTitle] = useState<string | null>(null)
  const [participantDetailTitle, setParticipantDetailTitle] = useState<string | null>(null)

  const handleInstructorRowClick = useCallback(
    (row: { id: string }) => {
      setInstructorId(row.id)
    },
    [setInstructorId]
  )
  const handleClearInstructorId = useCallback(() => {
    setInstructorId(null)
  }, [setInstructorId])
  const handleInstructorDetailOpen = useCallback((name: string) => {
    setInstructorDetailTitle(name)
  }, [])
  const handleInstructorDetailClose = useCallback(() => {
    setInstructorDetailTitle(null)
  }, [])

  const handleVolunteerRowClick = useCallback(
    (row: { id: string }) => {
      setVolunteerId(row.id)
    },
    [setVolunteerId]
  )
  const handleClearVolunteerId = useCallback(() => {
    setVolunteerId(null)
  }, [setVolunteerId])
  const handleVolunteerDetailOpen = useCallback((name: string) => {
    setVolunteerDetailTitle(name)
  }, [])
  const handleVolunteerDetailClose = useCallback(() => {
    setVolunteerDetailTitle(null)
  }, [])

  useEffect(() => {
    if (!schoolIdFromUrl) setSchoolDetailTitle(null)
  }, [schoolIdFromUrl])

  useEffect(() => {
    if (!instructorIdFromUrl) setInstructorDetailTitle(null)
  }, [instructorIdFromUrl])

  useEffect(() => {
    if (!volunteerIdFromUrl) setVolunteerDetailTitle(null)
  }, [volunteerIdFromUrl])

  useEffect(() => {
    if (!participantIdFromUrl) setParticipantDetailTitle(null)
  }, [participantIdFromUrl])

  useEffect(() => {
    if (!open || !schoolIdFromUrl || !displayProgram) return
    setSearchParams(
      prev => {
        if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
        const raw = prev.get(SCHOOL_TAB_PARAM)
        const normalized = parseSchoolTabFromSearch(
          prev,
          displayProgram,
          navigationCapabilities.educationJournalEnabled
        )
        if (raw === normalized) return prev
        const next = new URLSearchParams(prev)
        next.set(SCHOOL_TAB_PARAM, normalized)
        return next
      },
      { replace: true }
    )
  }, [
    open,
    schoolIdFromUrl,
    displayProgram,
    setSearchParams,
    navigationCapabilities.educationJournalEnabled,
  ])

  useEffect(() => {
    if (!open || !instructorIdFromUrl) return
    setSearchParams(
      prev => {
        if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
        const raw = prev.get(INSTRUCTOR_TAB_PARAM)
        const normalized = parseInstructorTabFromSearch(prev)
        if (raw === normalized) return prev
        const next = new URLSearchParams(prev)
        next.set(INSTRUCTOR_TAB_PARAM, normalized)
        return next
      },
      { replace: true }
    )
  }, [open, instructorIdFromUrl, setSearchParams])

  useEffect(() => {
    if (!open || !volunteerIdFromUrl) return
    setSearchParams(
      prev => {
        if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
        const raw = prev.get(VOLUNTEER_TAB_PARAM)
        const normalized = parseVolunteerTabFromSearch(prev)
        if (raw === normalized) return prev
        const next = new URLSearchParams(prev)
        next.set(VOLUNTEER_TAB_PARAM, normalized)
        return next
      },
      { replace: true }
    )
  }, [open, volunteerIdFromUrl, setSearchParams])

  useEffect(() => {
    if (!open || !participantIdFromUrl) return
    setSearchParams(
      prev => {
        if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
        const raw = prev.get(PARTICIPANT_TAB_PARAM)
        const normalized = parseParticipantTabFromSearch(prev, displayProgram)
        if (raw === normalized) return prev
        const next = new URLSearchParams(prev)
        next.set(PARTICIPANT_TAB_PARAM, normalized)
        return next
      },
      { replace: true }
    )
  }, [open, participantIdFromUrl, displayProgram, setSearchParams])

  useEffect(() => {
    if (!open || !instructorIdFromUrl) return
    if (activeLnb === 'progress' && activeTab === 'progress_instructors') return
    setSearchParams(
      prev => {
        if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
        if (!prev.has(INSTRUCTOR_ID_PARAM)) return prev
        const next = new URLSearchParams(prev)
        next.delete(INSTRUCTOR_ID_PARAM)
        next.delete(INSTRUCTOR_TAB_PARAM)
        return next
      },
      { replace: true }
    )
  }, [open, activeLnb, activeTab, instructorIdFromUrl, setSearchParams])

  useEffect(() => {
    if (!open || !volunteerIdFromUrl) return
    if (activeLnb === 'progress' && activeTab === 'progress_volunteers') return
    setSearchParams(
      prev => {
        if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
        if (!prev.has(VOLUNTEER_ID_PARAM)) return prev
        const next = new URLSearchParams(prev)
        next.delete(VOLUNTEER_ID_PARAM)
        next.delete(VOLUNTEER_TAB_PARAM)
        return next
      },
      { replace: true }
    )
  }, [open, activeLnb, activeTab, volunteerIdFromUrl, setSearchParams])

  useEffect(() => {
    if (!open || !participantIdFromUrl) return
    if (activeLnb === 'progress' && activeTab === 'progress_participants') return
    setSearchParams(
      prev => {
        if (isClosingRef.current || !shouldPatchGeneralProgramDetailUrl(prev)) return prev
        if (!prev.has(PARTICIPANT_ID_PARAM)) return prev
        const next = new URLSearchParams(prev)
        next.delete(PARTICIPANT_ID_PARAM)
        next.delete(PARTICIPANT_TAB_PARAM)
        return next
      },
      { replace: true }
    )
  }, [open, activeLnb, activeTab, participantIdFromUrl, setSearchParams])

  const progressNestedDetailLabel =
    activeLnb === 'progress' && schoolIdFromUrl && schoolDetailTitle
      ? schoolDetailTitle
      : activeLnb === 'progress' && instructorIdFromUrl && instructorDetailTitle
        ? instructorDetailTitle
        : activeLnb === 'progress' && volunteerIdFromUrl && volunteerDetailTitle
          ? volunteerDetailTitle
          : activeLnb === 'progress' && participantIdFromUrl && participantDetailTitle
            ? participantDetailTitle
            : null

  const headerBreadcrumbItems = ((): DetailFullpageBreadcrumbItem[] => {
    const items: DetailFullpageBreadcrumbItem[] = [
      {
        label: '프로그램 목록',
        onClick: handleRequestClose,
      },
    ]

    if (!displayProgram || !programId) return items

    const programParams = buildSearchParams(searchParams, {
      delete: GENERAL_PROGRAM_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: 'info',
        [TAB_PARAM]: 'info',
      },
    })

    const lnbLabel = generalLnbBreadcrumbLabel(activeLnb, participantApplicationsLnbLabel)
    const childLabel = generalChildBreadcrumbLabel(
      activeLnb,
      activeTab,
      surveyItems,
      progressMenuItems
    )
    const lnbTab = generalLnbBreadcrumbTargetTab(
      activeLnb,
      activeTab,
      volunteerInterviewEnabled,
      participantInterviewEnabled,
      surveyKeys,
      progressMenuItems
    )
    const lnbParams = buildSearchParams(searchParams, {
      delete: GENERAL_PROGRAM_DETAIL_QUERY_PARAMS,
      set: {
        programId,
        [LNB_PARAM]: activeLnb,
        [TAB_PARAM]: lnbTab,
      },
    })
    const childParams = childLabel
      ? buildSearchParams(searchParams, {
          delete: GENERAL_PROGRAM_DETAIL_QUERY_PARAMS,
          set: {
            programId,
            [LNB_PARAM]: activeLnb,
            [TAB_PARAM]: activeTab,
          },
        })
      : null

    items.push({
      label: resolveGeneralProgramDisplayTitle(displayProgram),
      onClick: () => applyDetailSearchParams(programParams, { replace: false }),
    })

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
          ? {
              label: lnbLabel,
              onClick: () => applyDetailSearchParams(lnbParams, { replace: false }),
            }
          : { label: lnbLabel }
      )
    } else if (
      activeLnb === 'progress' &&
      activeTab === 'progress_participants' &&
      ((schoolIdFromUrl && !isIndividualProgram) ||
        (participantIdFromUrl && isIndividualProgram))
    ) {
      items.push(
        childParams && hasProgressNestedDetail
          ? {
              label: childLabel,
              onClick: () => applyDetailSearchParams(childParams, { replace: false }),
            }
          : { label: childLabel }
      )
    } else {
      items.push({
        label: lnbLabel,
        onClick: () => applyDetailSearchParams(lnbParams, { replace: false }),
      })
      items.push(
        childParams && (hasParticipantApplicationDetail || hasProgressNestedDetail)
          ? {
              label: childLabel,
              onClick: () => applyDetailSearchParams(childParams, { replace: false }),
            }
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

  const applicantDetailModalTitle =
    applicantDetailMeta &&
    (activeLnb === 'institution_applications' || activeLnb === 'instructor_applications')
      ? resolveGeneralApplicantDetailModalTitle(activeLnb, activeTab, applicantDetailMeta)
      : null

  const defaultModalTitle =
    activeLnb === 'progress' && schoolIdFromUrl && schoolDetailTitle
      ? `참여 기관 상세 (${schoolDetailTitle})`
      : activeLnb === 'progress' && instructorIdFromUrl && instructorDetailTitle
        ? `참여 강사 상세 (${instructorDetailTitle})`
        : activeLnb === 'progress' && volunteerIdFromUrl && volunteerDetailTitle
          ? `참여 봉사자 상세 (${volunteerDetailTitle})`
          : activeLnb === 'progress' && participantIdFromUrl && participantDetailTitle
            ? `참여자 상세 (${participantDetailTitle})`
            : progressNestedDetailLabel && displayProgram
            ? `${resolveGeneralProgramDisplayTitle(displayProgram)}_${progressNestedDetailLabel}`
            : displayProgram
              ? resolveGeneralProgramDisplayTitle(displayProgram)
              : '프로그램 상세'

  const modalTitle =
    volunteerApplicantDetailMeta && isGeneralVolunteerApplicantDetailRoute(activeLnb, activeTab)
      ? volunteerApplicantDetailMeta.title
      : (applicantDetailModalTitle ?? defaultModalTitle)

  return (
    <RegistrationWizardValidationHighlightProvider variant="general">
    <RegistrationWizardValidationHighlightSync
      nonce={detailRequiredHighlight.request.nonce}
      keys={detailRequiredHighlight.request.keys}
      variant="general"
    />
    <>
      <DetailFullPageModal
        open={open}
        onClose={handleRequestClose}
        onHeaderClose={handleHeaderClose}
        zIndex={GENERAL_PROGRAM_DETAIL_FULLPAGE_MODAL_Z_INDEX}
        title={modalTitle}
        closeAriaLabel="닫기"
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
        className="program-detail-fullpage-modal general-detail-fullpage-modal program-detail-fullpage-modal--program-list-overview"
        sidebar={
          programId ? (
            <GeneralProgramDetailSidebar
              activeLnb={activeLnb}
              activeTab={activeTab}
              participantApplicationsLnbLabel={participantApplicationsLnbLabel}
              showParticipantApplications={showParticipantApplications}
              showInstructorApplications={showInstructorApplications}
              showVolunteerApplications={showVolunteerApplications}
              showManagers={showManagers}
              participantInterviewEnabled={participantInterviewEnabled}
              volunteerInterviewEnabled={volunteerInterviewEnabled}
              progressMenuItems={progressMenuItemsFiltered}
              surveyItems={surveyItems}
              onSelectChildTab={setLnbTab}
              footer={
                onRequestDelete && displayProgram ? (
                  <ProgramDetailLnbDeleteButton
                    onClick={() => onRequestDelete(displayProgram)}
                  />
                ) : null
              }
            />
          ) : null
        }
      >
        {open &&
        !displayProgram &&
        (loading || (remoteEnabled && !detailError)) ? (
          <div className="detail-fullpage-modal__loading">
            <Spin size="large" />
          </div>
        ) : displayProgram ? (
          <div key={`${displayProgram.id}:${activeLnb}:${activeTab}`}>
            {activeLnb === 'info' && activeTab === 'info' ? (
              <GeneralProgramDetailCommonInfoView
                key={`${displayProgram.id}-${displayProgram.updatedAt ?? ''}`}
                program={displayProgram}
                sponsorName={sponsorName}
                isEditMode={isEditModeInfo}
                form={infoForm}
                canWrite={canWrite}
                editDisabled={!canEditCommonInfo}
                onEdit={handleInfoEdit}
                onCancel={handleInfoCancel}
                onSave={handleInfoSave}
              />
            ) : activeLnb === 'info' && activeTab === 'recruitment' ? (
              <GeneralProgramRecruitmentView
                program={recruitmentEditProgram ?? displayProgram}
                remoteStrict={strictRemoteRecruitment}
                activeRecruitTab={recruitSubTab}
                remoteUnavailableReason={
                  strictRemoteRecruitment && displayProgram
                    ? getGeneralRecruitmentRemoteUnavailableReason(
                        displayProgram,
                        recruitSubTab === 'instructors'
                          ? 'instructor'
                          : recruitSubTab === 'volunteers'
                            ? 'volunteer'
                            : 'participant'
                      )
                    : undefined
                }
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
                onCancel={handleRecruitmentCancel}
                onSave={handleRecruitmentSave}
                onOpenRecruitmentPreview={handleOpenRecruitmentPreview}
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
                <GeneralParticipantApplicationsScreeningView
                  program={displayProgram}
                  activeTab={activeTab}
                  listTitle={participantApplicationsLnbLabel}
                  interviewEnabled={participantInterviewEnabled}
                  onRegisterApplicantCloseHandler={registerApplicantCloseHandler}
                  onApplicantDetailMetaChange={setListApplicantDetailMeta}
                />
              </div>
            ) : activeLnb === 'instructor_applications' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <GeneralInstructorApplicationsView
                  program={displayProgram}
                  onRegisterApplicantCloseHandler={registerApplicantCloseHandler}
                  onApplicantDetailMetaChange={setListApplicantDetailMeta}
                />
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_participants' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                {isIndividualProgram ? (
                  <ParticipatingParticipantsSection
                    programId={displayProgram.id}
                    program={displayProgram}
                    participantIdFromUrl={participantIdFromUrl}
                    participantTabFromUrl={activeParticipantTab}
                    onParticipantTabChange={setParticipantTab}
                    onParticipantRowClick={row => setParticipantId(row.id)}
                    onClearParticipantId={() => setParticipantId(null)}
                    onParticipantDetailOpen={name => setParticipantDetailTitle(name)}
                    onParticipantDetailClose={() => setParticipantDetailTitle(null)}
                  />
                ) : (
                  <ParticipatingInstitutionsSection
                    programId={displayProgram.id}
                    program={displayProgram}
                    navigationCapabilities={navigationCapabilities}
                    navigationCapabilitiesLoading={navigationLoading}
                    schoolIdFromUrl={schoolIdFromUrl}
                    schoolTabFromUrl={activeSchoolTab}
                    onSchoolTabChange={setSchoolTab}
                    onSchoolRowClick={row => setSchoolId(row.id)}
                    onClearSchoolId={() => setSchoolId(null)}
                    onSchoolDetailOpen={name => setSchoolDetailTitle(name)}
                    onSchoolDetailClose={() => setSchoolDetailTitle(null)}
                  />
                )}
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_attendance' ? (
              <div
                className="program-detail-fullpage-modal__info-tab general-detail-fullpage-modal__main"
                aria-label="출석 관리"
              >
                <ParticipatingIndividualProgressAttendanceSection program={displayProgram} />
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_assignments' ? (
              <div
                className="program-detail-fullpage-modal__info-tab general-detail-fullpage-modal__main"
                aria-label="과제 관리"
              >
                <ParticipatingIndividualProgressAssignmentSection program={displayProgram} />
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_posts' ? (
              <div
                className="program-detail-fullpage-modal__info-tab general-detail-fullpage-modal__main"
                aria-label="게시글"
              >
                <ProgramProgressPostsSection program={displayProgram} />
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_instructors' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <ParticipatingInstructorsSection
                  programId={displayProgram.id}
                  program={displayProgram}
                  instructorIdFromUrl={instructorIdFromUrl}
                  instructorTabFromUrl={activeInstructorTab}
                  onInstructorTabChange={setInstructorTab}
                  onInstructorRowClick={handleInstructorRowClick}
                  onClearInstructorId={handleClearInstructorId}
                  onInstructorDetailOpen={handleInstructorDetailOpen}
                  onInstructorDetailClose={handleInstructorDetailClose}
                />
              </div>
            ) : activeLnb === 'progress' && activeTab === 'progress_volunteers' ? (
              <div className="program-detail-fullpage-modal__progress-section">
                <ParticipatingVolunteersSection
                  programId={displayProgram.id}
                  program={displayProgram}
                  volunteerIdFromUrl={volunteerIdFromUrl}
                  volunteerTabFromUrl={activeVolunteerTab}
                  onVolunteerTabChange={setVolunteerTab}
                  onVolunteerRowClick={handleVolunteerRowClick}
                  onClearVolunteerId={handleClearVolunteerId}
                  onVolunteerDetailOpen={handleVolunteerDetailOpen}
                  onVolunteerDetailClose={handleVolunteerDetailClose}
                />
              </div>
            ) : activeLnb === 'volunteer_applications' ? (
              <div className="program-detail-fullpage-modal__info-tab">
                <GeneralVolunteerApplicationsView
                  program={displayProgram}
                  activeTab={activeTab}
                  interviewEnabled={volunteerInterviewEnabled}
                  onRegisterApplicantCloseHandler={registerVolunteerApplicantCloseHandler}
                  onVolunteerApplicantDetailMetaChange={setVolunteerApplicantDetailMeta}
                />
              </div>
            ) : (
              <div
                className="general-detail-fullpage-modal__main"
                aria-label={
                  generalChildBreadcrumbLabel(
                    activeLnb,
                    activeTab,
                    surveyItems,
                    progressMenuItems
                  ) ??
                  generalLnbBreadcrumbLabel(activeLnb, participantApplicationsLnbLabel)
                }
              />
            )}
          </div>
        ) : detailError ? (
          <Typography.Text type="danger">
            프로그램 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </Typography.Text>
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
      {displayProgram ? (
        <ParticipantRecruitmentPreviewModal
          open={recruitmentPreviewOpen}
          onClose={handleCloseRecruitmentPreview}
          program={displayProgram}
          sponsorName={sponsorName}
          audience={recruitmentPreviewAudience ?? 'institutions'}
        />
      ) : null}
      <ProgramDetailSponsorDetailOverlay />
      <ConfirmModal
        open={structureChangeConfirmOpen}
        title={EDUCATION_STRUCTURE_CHANGE_CONFIRM_TITLE}
        content={EDUCATION_STRUCTURE_CHANGE_CONFIRM_MESSAGE}
        zIndex={GENERAL_PROGRAM_DETAIL_STRUCTURE_CONFIRM_Z_INDEX}
        onConfirm={() => {
          void handleStructureChangeConfirm()
        }}
        onCancel={handleStructureChangeCancel}
        confirmLoading={structureChangeConfirmLoading}
      />
    </>
    </RegistrationWizardValidationHighlightProvider>
  )
}
