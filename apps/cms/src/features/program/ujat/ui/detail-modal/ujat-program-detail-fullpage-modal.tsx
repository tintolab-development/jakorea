/**
 * UJAT 프로그램 상세 풀페이지 모달 — `/programs/ujat?programId=…&lnb=…&tab=…`
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Typography } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import { tryNavigateMemberDetailReturn } from '@/features/user/detail/lib/member-detail-program-navigation-return'
import { useProgramDetail } from '@/pages/programs/use-program-detail'
import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '@/features/program/general/hooks/use-program-detail-info-save'
import { handleError } from '@/shared/utils/error-handler'
import {
  programDetailUjatCommonInfoEditSchema,
} from '@/features/program/shared/model/program-detail-edit-schema'
import {
  applyUjatRecruitFormValuesToProgram,
  programToUjatRecruitCanonicalFormValues,
  volunteerHalfFromRecruitDisplayKind,
  type UjatRecruitDisplayKind,
} from '@/features/program/ujat/lib/ujat-recruit-display-program'
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
  isUjatEducationProgressVolunteerInList,
} from './progress/volunteers/detail/volunteer-detail-data'
import { useUjatEducationProgressVolunteerDetail } from './progress/volunteers/detail/use-detail'
import { UjatInstitutionScheduleConfirmDetailPage } from './application-institution/schedule-confirm/detail-page'
import type { Program } from '@/types/domain'
import {
  isUjatVolunteerApplicantDetailTab,
  parseUjatDetailLnb,
  parseUjatEduInstTab,
  resolveUjatDetailLnbFromSearchParams,
  UJAT_APPLICANT_ID_PARAM,
  UJAT_EDU_INST_ID_PARAM,
  UJAT_EDU_INST_TAB_PARAM,
  UJAT_INST_APP_ID_PARAM,
  UJAT_INSTITUTION_APPLICATION_VIEW_PARAM,
  UJAT_INSTITUTION_CALENDAR_DATE_PARAM,
  UJAT_INSTITUTION_EDUCATION_REGION_PARAM,
  UJAT_VOL_ADD_MEMBER_ID_PARAM,
  UJAT_EDU_VOL_ID_PARAM,
  UJAT_EDU_VOL_TAB_PARAM,
  isUjatEducationProgressVolunteersTab,
  parseUjatEduVolTab,
  parseUjatVolAddMemberIdParam,
  type UjatDetailLnbKey,
  type UjatEducationProgressInstitutionDetailTab,
  type UjatEducationProgressVolunteerDetailTab,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
import { isUjatVolunteerApplicantInTabList } from './application-volunteer/screening/applicant/detail-url'
import {
  clearUjatInstitutionApplicationViewParams,
  parseUjatInstitutionCalendarDateParam,
  shouldKeepUjatInstitutionApplicationViewParams,
} from './application-institution/list/calendar-query'
import {
  clearUjatInstitutionEducationRegionParam,
  parseUjatInstitutionEducationRegionParam,
  shouldKeepUjatInstitutionEducationRegionParam,
  applyUjatInstitutionEducationRegionParam,
} from './application-institution/list/region-query'
import {
  educationProgressHalfFromTab,
  isEducationProgressInstitutionsTab,
  isUjatEducationProgressInstitutionInList,
} from './progress/institutions/detail/detail-url'
import { UjatEducationProgressInstitutionDetailPage } from './progress/institutions/detail/detail-page'
import {
  getUjatSurveyMenuItemsForProgram,
  getUjatVolunteerInterviewEnabled,
  UJAT_SURVEY_LEGACY_TAB_MAP,
  type UjatSurveyMenuItem,
} from '@/features/program/ujat/lib/ujat-program-detail-meta'
import { resolveUjatProgramDisplayProgram } from '@/features/program/ujat/lib/ujat-program-display-program'
import { hydrateUjatRecruitTemplatesForProgram } from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
import { resolveUjatProgramDisplayTitle } from '@/features/program/ujat/lib/ujat-program-list-display'
import { shouldUseRemoteApi } from '@/features/program/ujat/api/capabilities'
import { queryKeys as ujatProgramQueryKeys } from '@/features/program/ujat/api/query-keys'
import { detail as fetchUjatProgramRemoteById } from '@/features/program/ujat/api/service'
import {
  EMPTY_UJAT_TYPED_DETAIL,
  syncUjatTypedDetailPhysicalSchedulesRemote,
  updateUjatTypedDetailHalfRemote,
  type UjatTypedDetail,
} from '@/features/program/ujat/api/typed-detail-client'
import {
  omitRecruitmentTabScheduleFields,
  persistRecruitmentTabSave,
} from '@/features/program/shared/lib/persist-recruitment-row-save'
import { syncOpenProgramDetailCache } from '@/features/program/shared/lib/program-detail-cache-after-save'
import { useUjatInstitutionApplicationDetail } from '@/features/program/ujat/api/use-institution-application-detail'
import { invalidateUjatProgramListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import {
  replaceUjatRegionCapacitiesRemote,
  type UjatRegionCapacityUpsert,
} from '@/features/program/ujat/api/region-capacities-client'
import { ujatRegionCapacityUpsertsFromState } from '@/features/program/ujat/lib/ujat-kpi-wage-capacity-typed'
import { ProgramDetailLnbDeleteButton } from '@/features/program/shared/ui/program-detail/lnb-delete-button'
import { UjatProgramDetailSidebar } from './ujat-program-detail-sidebar'
import { ProgramDetailSponsorDetailOverlay } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-detail-overlay'
import { clearSponsorDetailQueryStack } from '@/features/sponsor/lib/sponsor-detail-query-stack'
import { UjatProgramDetailCommonInfoView } from './info/ujat-program-detail-common-info-view'
import {
  canUjatProgramInfoEdit,
  canUjatRecruitmentInfoEdit,
} from './info/ujat-program-info-edit'
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
import {
  formatUjatRegistrationRequiredFieldReasons,
  listIncompleteUjatProgramRecruitmentInterviewScheduleRequiredFields,
  listIncompleteUjatProgramRecruitmentTypedRequiredFields,
} from '@/features/program/ujat/lib/ujat-program-registration-required-fields'
import {
  RegistrationWizardValidationHighlightProvider,
  RegistrationWizardValidationHighlightSync,
  useDetailEditRequiredHighlightRequest,
} from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import {
  buildRequiredFieldsIncompleteAlertContent,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { isProgramTypeSettingsSaveBlocked } from '@/features/program/shared/lib/program-edit-window'
import {
  PROGRAM_RECRUITMENT_INFO_EDIT_BLOCKED_ALERT_TITLE,
  PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE,
  PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE,
  PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_TITLE,
} from '@/shared/lib/program-edit-window-error-message'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { extractApiErrorMessage, getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { UJAT_NOTICE_EXPOSURE_TIMING_INVALID_CODE } from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { overlayRecordToInterviewConfig } from '@/features/program/ujat/lib/recruitment-typed-contract'
import { getRecruitTypedInterviewRecord } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { ujatVolunteerRecruitInterviewNamespace } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { BusinessPeriodExtendToolbar } from '@/features/program/shared/ui/business-period-extend-toolbar'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  isUjatRecruitTab,
  normalizeUjatRecruitTab,
  type UjatRecruitTabKey,
} from './info/ujat-program-detail-recruitment-tabs'
import { UjatProgramRecruitmentPanels } from './info/ujat-program-recruitment-panels'
import { UjatProgramRecruitmentTabsRow } from './info/ujat-program-recruitment-tabs-row'
import { ParticipantRecruitmentPreviewModal } from '@/features/program/general/ui/detail-modal/info/participant-recruitment-preview-modal'
import { DocScreeningSection } from './application-volunteer/screening/doc-screening/section'
import { DocPassedSection } from './application-volunteer/screening/doc-passed/section'
import { Interview2Section } from './application-volunteer/screening/interview2/section'
import type { ApplicantDetailMeta } from './application-volunteer/screening/applicant/use-detail'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsInput } from '@/shared/ui/cms-input'
import {
  findWritingTemplateRowByDefinitionId,
} from '@/features/template/lib/writing-template-create-helpers'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { usePushUserPreviewHistoryWhenOpen } from '@/features/template/hooks/use-push-user-preview-history-when-open'
import {
  isSurveyRegistryEntry,
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { useClipboard } from '@/features/template/hooks/use-clipboard'
import {
  defaultSatisfactionAudienceForSurveyTab,
  getSatisfactionAudienceLabel,
  getSatisfactionAudienceTabsForSurveyTab,
  getSatisfactionDeleteModalSubject,
  isUjatSatisfactionSurveyTab,
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
import type { UjatSurveyPollRawResponse } from '@/features/program/ujat/model/ujat-survey-poll'
import {
  buildLectureEvalFormDraft,
  canEditLectureEvalResponse,
  draftToLectureEvalPollResponse,
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
import {
  SurveyTemplateEditModal,
  type ProgramSurveyFormEdit,
} from '@/features/program/shared/ui/survey-management/survey-template-edit-modal'
import {
  buildProgramSurveyFormEditTarget,
  canEditRegisteredSurveyForm,
} from '@/features/program/shared/lib/survey-management/save-program-survey-form-edit'
import { UjatSatisfactionSurveyView } from './survey-management/ui/ujat-satisfaction-survey-view'
import { UjatLectureEvalSurveyView } from './survey-management/ui/ujat-lecture-eval-survey-view'
import { UjatSurveyEmptyState } from './survey-management/ui/ujat-survey-empty-state'
import { UjatSurveyNoResponseState } from './survey-management/ui/ujat-survey-no-response-state'
import { UjatSurveyPollResultsView } from './survey-management/ui/ujat-survey-poll-results-view'
import { UjatSurveyRegisteredActions } from './survey-management/ui/ujat-survey-registered-actions'
import { SurveyShareCopyToast } from '@/features/program/shared/ui/survey-management/survey-share-copy-toast'
import {
  useGeneralProgramSurveyFormBindingMutations,
  useGeneralProgramSurveyResponses,
  useGeneralProgramSurveys,
  useGeneralProgramSurveySummary,
} from '@/features/program/general/hooks/use-general-program-posts-surveys'
import {
  resolvePublishedSurveyBinding,
  surveyBindingResolutionAlert,
} from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'
import { ensureSurveyCreateSubmissionPeriod } from '@/features/program/shared/lib/survey-management/survey-binding-period'
import { resolveLectureEvalBindingTargetForCreate } from '@/features/program/shared/lib/survey-management/resolve-lecture-eval-binding-target'
import { resolveSurveyPollBindingTarget } from '@/features/program/shared/lib/survey-management/resolve-survey-poll-binding-target'
import {
  SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE,
  isSurveyPollBindingTargetScheduleAlreadyRegistered,
} from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import {
  resolveSurveyPollBindingTargetWhenScheduleFieldHidden,
  shouldShowSurveyPollScheduleSelectField,
} from '@/features/program/shared/lib/survey-management/should-show-survey-poll-schedule-field'
import { loadProgramSurveyFormEditAfterBinding } from '@/features/program/shared/lib/survey-management/load-program-survey-form-edit'
import { useProgramSurveyScheduleOptions } from '@/features/program/shared/hooks/use-program-survey-schedule-options'
import { SurveyPollRegisterModal } from '@/features/program/shared/ui/survey-management/survey-poll-register-modal'
import {
  describeSurveyShareClipboardFailure,
  resolveSurveyShareClipboardUrl,
} from '@/features/program/general/api/adapters/program-survey-adapters'
import { getPlatformPublicOrigin } from '@/features/program/general/lib/public-survey-origin'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import {
  createGeneralProgramSurveyShareLink,
  submitGeneralProgramFormResponse,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useQueryClient } from '@tanstack/react-query'
import { loadFormTemplateVersionDraftByVersionId } from '@/features/template/api/admin-form-templates-service'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
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
  UJAT_INSTITUTION_APPLICATION_VIEW_PARAM,
  UJAT_INSTITUTION_CALENDAR_DATE_PARAM,
  UJAT_INSTITUTION_EDUCATION_REGION_PARAM,
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

const EMPTY_UJAT_REGISTERED_SURVEYS: UjatRegisteredSurvey[] = []

const EMPTY_UJAT_SATISFACTION_SURVEYS: UjatSatisfactionSurveyByAudience = {}

const EMPTY_UJAT_LECTURE_EVAL_SURVEY: UjatRegisteredSurvey | null = null

function buildUjatRegionCapacityUpserts(program: Program): UjatRegionCapacityUpsert[] {
  return ujatRegionCapacityUpsertsFromState(program.ujatRegionCapacity)
}

function ujatRegionCapacitySnapshot(program: Program): string {
  return JSON.stringify(buildUjatRegionCapacityUpserts(program))
}

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
  /** LNB 하단 「프로그램 삭제」 — 미지정 시 버튼 미노출 */
  onRequestDelete?: (program: Program) => void
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
    const restrictToKnownIds = validInstAppIds.size > 0
    if (restrictToKnownIds && !validInstAppIds.has(instAppIdRaw)) {
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
  if (instAppIdRaw && (validInstAppIds.size === 0 || validInstAppIds.has(instAppIdRaw))) {
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
  const volAddMemberIdParsed = parseUjatVolAddMemberIdParam(volAddMemberIdRaw)
  if (
    lnb !== 'education_progress' ||
    !isUjatEducationProgressVolunteersTab(tab) ||
    volAddMemberIdParsed == null
  ) {
    next.delete(UJAT_VOL_ADD_MEMBER_ID_PARAM)
  } else if (volAddMemberIdRaw !== volAddMemberIdParsed) {
    next.set(UJAT_VOL_ADD_MEMBER_ID_PARAM, volAddMemberIdParsed)
  }

  if (!shouldKeepUjatInstitutionApplicationViewParams(lnb, tab)) {
    clearUjatInstitutionApplicationViewParams(next)
  } else {
    const view = next.get(UJAT_INSTITUTION_APPLICATION_VIEW_PARAM)
    if (view !== 'calendar') {
      clearUjatInstitutionApplicationViewParams(next)
    } else {
      const calendarDate = parseUjatInstitutionCalendarDateParam(
        next.get(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)
      )
      if (calendarDate) next.set(UJAT_INSTITUTION_CALENDAR_DATE_PARAM, calendarDate)
      else next.delete(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)
    }
  }

  if (!shouldKeepUjatInstitutionEducationRegionParam(lnb)) {
    clearUjatInstitutionEducationRegionParam(next)
  } else {
    const regionKey = parseUjatInstitutionEducationRegionParam(
      next.get(UJAT_INSTITUTION_EDUCATION_REGION_PARAM)
    )
    if (regionKey) applyUjatInstitutionEducationRegionParam(next, regionKey)
    else clearUjatInstitutionEducationRegionParam(next)
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
  onRequestDelete,
}: UjatProgramDetailFullPageModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programId = program?.id ?? programIdHint ?? undefined
  const surveysTabActive =
    open && (resolveUjatDetailLnbFromSearchParams(searchParams) ?? 'info') === 'survey'
  const {
    registeredSurveys: remoteRegisteredSurveys,
    classifiedBindings,
    isRemoteDataSource: surveysRemote,
  } = useGeneralProgramSurveys(programId, surveysTabActive)
  const { createBinding, deleteBinding, invalidateSurveyCaches } =
    useGeneralProgramSurveyFormBindingMutations(programId)

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
  const canWrite = useUjatCanWrite()

  const displayProgram = useMemo(() => {
    // externalLoading 중 목록 시드로 본문 채우지 않음
    if (onUpdateProgram && externalLoading) return null
    const base = onUpdateProgram ? program : (program ?? detailProgram ?? null)
    return base ? resolveUjatProgramDisplayProgram(base) : null
  }, [detailProgram, program, onUpdateProgram, externalLoading])

  const educationScheduleForm = useForm<UjatTypedDetail>({
    defaultValues: EMPTY_UJAT_TYPED_DETAIL,
  })
  const educationScheduleBaselineRef = useRef<UjatTypedDetail>(EMPTY_UJAT_TYPED_DETAIL)
  const educationScheduleIsDirty = educationScheduleForm.formState.isDirty
  const resetEducationScheduleForm = educationScheduleForm.reset

  useEffect(() => {
    if (!displayProgram) return
    const next = displayProgram.ujatTypedDetail ?? EMPTY_UJAT_TYPED_DETAIL
    educationScheduleBaselineRef.current = next
    resetEducationScheduleForm(next)
  }, [displayProgram, resetEducationScheduleForm])

  const persistUjatEducationSchedule = useCallback(
    async (id: string) => {
      if (!educationScheduleIsDirty) return
      const snapshot = educationScheduleForm.getValues()
      let current = snapshot
      let expectedRevision = snapshot.revision ?? 0
      const changedSemesters: Array<'FIRST_HALF' | 'SECOND_HALF'> = []
      for (const semesterType of ['FIRST_HALF', 'SECOND_HALF'] as const) {
        const halfPlan = current.halfPlans?.find(item => item.semesterType === semesterType) ?? {
          semesterType,
          stages: [],
        }
        const baselineHalfPlan = educationScheduleBaselineRef.current.halfPlans?.find(
          item => item.semesterType === semesterType
        ) ?? { semesterType, stages: [] }
        if (JSON.stringify(halfPlan) === JSON.stringify(baselineHalfPlan)) continue
        changedSemesters.push(semesterType)
        current = await updateUjatTypedDetailHalfRemote(
          id,
          semesterType,
          expectedRevision,
          halfPlan
        )
        expectedRevision = current.revision ?? expectedRevision
      }
      current = await syncUjatTypedDetailPhysicalSchedulesRemote(id, current, changedSemesters)
      educationScheduleBaselineRef.current = current
      educationScheduleForm.reset(current)
    },
    [educationScheduleForm, educationScheduleIsDirty]
  )

  const volunteerRecruitKindRef = useRef<UjatRecruitDisplayKind>('volunteer_h1')
  const mapInstitutionRecruitmentEditValues = useCallback(
    (p: Program) => programToUjatRecruitCanonicalFormValues(p, 'institution'),
    []
  )
  const mapVolunteerH1RecruitmentEditValues = useCallback(
    (p: Program) => programToUjatRecruitCanonicalFormValues(p, 'volunteer_h1'),
    []
  )
  const mapVolunteerH2RecruitmentEditValues = useCallback(
    (p: Program) => programToUjatRecruitCanonicalFormValues(p, 'volunteer_h2'),
    []
  )
  const mapVolunteerRecruitmentEditValues = useCallback((p: Program) => {
    const kind = volunteerRecruitKindRef.current
    return kind === 'volunteer_h2'
      ? mapVolunteerH2RecruitmentEditValues(p)
      : mapVolunteerH1RecruitmentEditValues(p)
  }, [mapVolunteerH1RecruitmentEditValues, mapVolunteerH2RecruitmentEditValues])

  useEffect(() => {
    if (!displayProgram) return
    void hydrateUjatRecruitTemplatesForProgram(displayProgram)
  }, [displayProgram])

  const interviewEnabled = displayProgram ? getUjatVolunteerInterviewEnabled(displayProgram) : true
  const surveyItems = useMemo(
    () => (displayProgram ? getUjatSurveyMenuItemsForProgram(displayProgram) : []),
    [displayProgram]
  )
  const surveyKeys = useMemo(() => surveyItems.map(s => s.key), [surveyItems])
  const [institutionListVersion, setInstitutionListVersion] = useState(0)
  const [surveyCreateModalOpen, setSurveyCreateModalOpen] = useState(false)
  const [selectedSurveyTemplateId, setSelectedSurveyTemplateId] = useState<string | null>(null)
  const [selectedSurveyScheduleValue, setSelectedSurveyScheduleValue] = useState<string | null>(
    null
  )
  const [submittingSurveyTemplate, setSubmittingSurveyTemplate] = useState(false)
  const [surveyDeleteModalOpen, setSurveyDeleteModalOpen] = useState(false)
  const [surveyDeleteConfirmWord, setSurveyDeleteConfirmWord] = useState('')
  const [pollDownloadModalOpen, setPollDownloadModalOpen] = useState(false)
  const [downloadingPollResults, setDownloadingPollResults] = useState(false)
  const pollResultsExportRef = useRef<HTMLDivElement>(null)
  const [registeredSurveys, setRegisteredSurveys] = useState<UjatRegisteredSurvey[]>(
    EMPTY_UJAT_REGISTERED_SURVEYS
  )
  const [activeRegisteredSurveyId, setActiveRegisteredSurveyId] = useState<string | null>(
    EMPTY_UJAT_REGISTERED_SURVEYS[0]?.id ?? null
  )
  const [satisfactionSurveysByAudience, setSatisfactionSurveysByAudience] =
    useState<UjatSatisfactionSurveyByAudience>(EMPTY_UJAT_SATISFACTION_SURVEYS)
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
  const [programFormEdit, setProgramFormEdit] = useState<ProgramSurveyFormEdit | null>(null)
  const [selectedSatisfactionTemplateId, setSelectedSatisfactionTemplateId] = useState<string | null>(
    null
  )
  const [lectureEvalSurvey, setLectureEvalSurvey] = useState<UjatRegisteredSurvey | null>(
    EMPTY_UJAT_LECTURE_EVAL_SURVEY
  )
  const [lectureEvalSubmitted, setLectureEvalSubmitted] = useState(false)
  const [lectureEvalFormDraft, setLectureEvalFormDraft] = useState<WritingFormDraft | null>(null)
  const lectureEvalDraftRef = useRef<WritingFormDraft | null>(null)
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
  const { openWritingUserPreview, closeWritingUserPreview, isWritingUserPreviewOpen } =
    useTemplateWritingPreview()
  const requestPreviewHistoryPush = usePushUserPreviewHistoryWhenOpen(isWritingUserPreviewOpen)
  const { copyText } = useClipboard()
  const { showAlert } = useCmsAlert()
  const detailRequiredHighlight = useDetailEditRequiredHighlightRequest()

  const openUjatSurveyTemplatePreview = useCallback(
    (
      survey: { id: string; templateId: string; title: string; bindingId?: string },
      options?: { allowEdit?: boolean }
    ) => {
      const catalogRow = findWritingTemplateRowByDefinitionId(survey.templateId)
      const allowEdit = options?.allowEdit ?? true
      const editTarget =
        allowEdit && displayProgram != null
          ? buildProgramSurveyFormEditTarget(String(displayProgram.id), survey)
          : null
      const onEditForm =
        allowEdit && editTarget == null && catalogRow != null
          ? () => {
              closeWritingUserPreview()
              setSurveyTemplateEditId(survey.templateId)
              setSurveyTemplateEditOpen(true)
            }
          : undefined
      void buildUjatSurveyWritingPreviewSession({
        templateId: survey.templateId,
        title: survey.title,
        versionId: survey.id,
        onEditForm,
      })
        .then(session => {
          if (session == null) {
            void showAlert({
              title: '양식 보기',
              content: '설문 양식을 불러오지 못했습니다. 다시 시도해 주세요.',
            })
            return
          }
          requestPreviewHistoryPush()
          openWritingUserPreview(
            editTarget != null
              ? {
                  ...session,
                  onEditForm: () => {
                    closeWritingUserPreview()
                    setProgramFormEdit({ target: editTarget, initialDraft: session.draft })
                  },
                }
              : session
          )
        })
        .catch(error => {
          handleError(error, { context: 'ujatSurveyPreview' })
          void showAlert({
            title: '양식 보기',
            content: getGeneralProgramApiErrorMessage(
              error,
              '설문 양식을 불러오지 못했습니다. 다시 시도해 주세요.'
            ),
          })
        })
    },
    [
      closeWritingUserPreview,
      displayProgram,
      openWritingUserPreview,
      requestPreviewHistoryPush,
      showAlert,
    ]
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

  useEffect(() => {
    if (!surveysRemote || !remoteRegisteredSurveys) return
    setRegisteredSurveys(remoteRegisteredSurveys)
    setActiveRegisteredSurveyId(prev =>
      prev && remoteRegisteredSurveys.some(s => s.id === prev)
        ? prev
        : (remoteRegisteredSurveys[0]?.id ?? null)
    )
  }, [remoteRegisteredSurveys, surveysRemote])

  useEffect(() => {
    if (!surveysRemote || !classifiedBindings) return
    const nextSatisfaction: UjatSatisfactionSurveyByAudience = {}
    let nextLecture: UjatRegisteredSurvey | null = null
    for (const item of classifiedBindings) {
      if (item.kind === 'satisfaction' && item.satisfactionAudience) {
        const audience = item.satisfactionAudience
        if (
          audience === 'teacher' ||
          audience === 'volunteer_h1' ||
          audience === 'volunteer_h2'
        ) {
          nextSatisfaction[audience] = item.survey
        }
      }
      if (item.kind === 'lecture_evaluation') {
        nextLecture = item.survey
      }
    }
    setSatisfactionSurveysByAudience(nextSatisfaction)
    setLectureEvalSurvey(nextLecture)
  }, [classifiedBindings, surveysRemote])

  const surveyTemplateOptions = useMemo(() => getSurveyWritingTemplateSelectOptions(), [])
  const surveyScheduleOptionsQuery = useProgramSurveyScheduleOptions(
    displayProgram,
    surveyCreateModalOpen,
    classifiedBindings
  )
  const showSurveyPollScheduleSelectField = useMemo(
    () => shouldShowSurveyPollScheduleSelectField(displayProgram),
    [displayProgram]
  )
  useEffect(() => {
    if (!surveyCreateModalOpen || !showSurveyPollScheduleSelectField) return
    const options = surveyScheduleOptionsQuery.options ?? []
    if (options.length === 1 && options[0]?.value && !options[0].disabled) {
      setSelectedSurveyScheduleValue(String(options[0].value))
    }
  }, [
    surveyCreateModalOpen,
    showSurveyPollScheduleSelectField,
    surveyScheduleOptionsQuery.options,
  ])
  const activeRegisteredSurvey = useMemo(
    () => registeredSurveys.find(item => item.id === activeRegisteredSurveyId) ?? null,
    [registeredSurveys, activeRegisteredSurveyId]
  )
  const pollResponseVersionId = activeRegisteredSurveyId ?? undefined
  const satisfactionResponseVersionId =
    satisfactionSurveysByAudience[activeSatisfactionAudience]?.id ?? undefined
  const lectureResponseVersionId = lectureEvalSurvey?.id ?? undefined

  const {
    pollResponses: remotePollResponses,
    isRemoteDataSource: pollResponsesRemote,
  } = useGeneralProgramSurveyResponses(programId, pollResponseVersionId)
  const {
    pollResponses: remoteSatisfactionResponses,
    isRemoteDataSource: satisfactionResponsesRemote,
  } = useGeneralProgramSurveyResponses(programId, satisfactionResponseVersionId)
  const {
    pollResponses: remoteLectureResponses,
    isRemoteDataSource: lectureResponsesRemote,
  } = useGeneralProgramSurveyResponses(programId, lectureResponseVersionId)
  const { totalResponseCount: remotePollSummaryCount } = useGeneralProgramSurveySummary(
    programId,
    pollResponseVersionId
  )

  const pollResponses = useMemo((): UjatSurveyPollRawResponse[] => {
    if (pollResponsesRemote) return remotePollResponses ?? []
    return []
  }, [pollResponsesRemote, remotePollResponses])
  const activeSatisfactionSurvey = useMemo(
    () => satisfactionSurveysByAudience[activeSatisfactionAudience] ?? null,
    [satisfactionSurveysByAudience, activeSatisfactionAudience]
  )
  const satisfactionResponses = useMemo((): UjatSurveyPollRawResponse[] => {
    if (satisfactionResponsesRemote) return remoteSatisfactionResponses ?? []
    return []
  }, [remoteSatisfactionResponses, satisfactionResponsesRemote])

  useEffect(() => {
    if (!pollResponsesRemote || !activeRegisteredSurveyId) return
    const count = remotePollSummaryCount || (remotePollResponses?.length ?? 0)
    setRegisteredSurveys(prev =>
      prev.map(survey =>
        survey.id === activeRegisteredSurveyId ? { ...survey, responseCount: count } : survey
      )
    )
  }, [
    activeRegisteredSurveyId,
    pollResponsesRemote,
    remotePollResponses,
    remotePollSummaryCount,
  ])

  useEffect(() => {
    if (!lectureResponsesRemote) return
    if (remoteLectureResponses && remoteLectureResponses.length > 0) {
      setLectureEvalResponses(remoteLectureResponses)
      setLectureEvalSubmitted(true)
    }
  }, [lectureResponsesRemote, remoteLectureResponses])

  const activeLnb: UjatDetailLnbKey = open
    ? (resolveUjatDetailLnbFromSearchParams(searchParams) ?? 'info')
    : 'info'

  const validInstAppIds = useMemo(() => new Set<string>(), [])

  const institutionApplicationId = open ? searchParams.get(UJAT_INST_APP_ID_PARAM) : null
  const institutionDetailId = institutionApplicationId

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

  const satisfactionAudienceTabs = useMemo(
    () => getSatisfactionAudienceTabsForSurveyTab(activeTab),
    [activeTab]
  )

  useEffect(() => {
    if (!isUjatSatisfactionSurveyTab(activeTab)) return
    const allowed = new Set(satisfactionAudienceTabs.map(tab => tab.key))
    if (!allowed.has(activeSatisfactionAudience)) {
      setActiveSatisfactionAudience(defaultSatisfactionAudienceForSurveyTab(activeTab))
    }
  }, [activeTab, activeSatisfactionAudience, satisfactionAudienceTabs])

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

  const { row: institutionApplicationDetailRow } = useUjatInstitutionApplicationDetail({
    institutionId: institutionDetailId ?? '',
    programId: displayProgram?.id ?? programId,
  })
  const institutionDetailName =
    institutionDetailId &&
    institutionApplicationDetailRow?.institutionName &&
    institutionApplicationDetailRow.institutionName !== '-'
      ? institutionApplicationDetailRow.institutionName
      : null
  const eduInstitutionDetailName: string | null = null

  const eduInstitutionDetailTab = open
    ? parseUjatEduInstTab(searchParams)
    : ('application' as UjatEducationProgressInstitutionDetailTab)

  const volAddMemberIdEarly = open
    ? parseUjatVolAddMemberIdParam(searchParams.get(UJAT_VOL_ADD_MEMBER_ID_PARAM))
    : null

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

  const { detail: eduVolunteerRemoteDetail } = useUjatEducationProgressVolunteerDetail({
    programId: displayProgram?.id ?? '',
    half: eduVolunteerHalf ?? 'h1',
    volunteerId: eduVolunteerDetailId ?? '',
  })
  const eduVolunteerDetailMeta = eduVolunteerRemoteDetail
    ? {
        title: formatUjatEducationProgressVolunteerDetailTitle(
          eduVolunteerRemoteDetail.half,
          eduVolunteerRemoteDetail.row.volunteerName
        ),
        breadcrumbLabel: eduVolunteerRemoteDetail.row.volunteerName,
      }
    : null

  const institutionDetailTitlePrefix = useMemo(() => {
    if (!institutionDetailId) return '신청 기관 상세'
    if (activeLnb === 'institution_applications' && activeTab === 'inst_schedule_confirm') {
      return '임시 배정 기관 상세'
    }
    return '신청 기관 상세'
  }, [institutionDetailId, activeLnb, activeTab])

  const activeRecruitTab: UjatRecruitTabKey | null =
    activeLnb === 'info' && isUjatRecruitTab(activeTab) ? (activeTab as UjatRecruitTabKey) : null
  volunteerRecruitKindRef.current =
    activeRecruitTab === 'recruit_volunteer_h2' ? 'volunteer_h2' : 'volunteer_h1'

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
      if (!shouldKeepUjatInstitutionApplicationViewParams(lnb, tab)) {
        clearUjatInstitutionApplicationViewParams(next)
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
  const canEditInfo = useMemo(
    () => canWrite && canUjatProgramInfoEdit(displayProgram),
    [canWrite, displayProgram],
  )
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
    schema: programDetailUjatCommonInfoEditSchema,
    holdValuesWhileEditing: true,
  })
  const {
    triggerSave: infoTriggerSave,
    resetToProgram: infoResetToProgram,
    takeSaveFailure: takeInfoSaveFailure,
  } = useProgramDetailInfoSave({
      form: infoForm,
      program: displayProgram ?? ({} as Program),
      validateSchema: programDetailUjatCommonInfoEditSchema,
      onSaveEdit:
        displayProgram && updateProgram
          ? async (draft, patch) => {
              try {
                const commonPatch: Partial<Program> = {
                  ...patch,
                  generalSurveyMenuKeys: draft.generalSurveyMenuKeys,
                  generalParticipantTypes: draft.generalParticipantTypes,
                  generalCommonInfo: draft.generalCommonInfo,
                  mainTitle: draft.mainTitle,
                  titleEn: draft.titleEn,
                  title: draft.title,
                }
                if (
                  shouldUseRemoteApi() &&
                  displayProgram &&
                  ujatRegionCapacitySnapshot(displayProgram) !==
                  ujatRegionCapacitySnapshot(draft)
                ) {
                  // 지역 정원 PUT 성공 후 공통정보 PATCH/상세 GET을 수행한다.
                  await replaceUjatRegionCapacitiesRemote(
                    draft.id,
                    buildUjatRegionCapacityUpserts(draft)
                  )
                }
                if (onUpdateProgram) {
                  await onUpdateProgram(draft.id, draft, commonPatch)
                } else {
                  await updateProgram(draft.id, draft)
                }
                await persistUjatEducationSchedule(draft.id)
                const next = new URLSearchParams(searchParams)
                next.delete(EDIT_PARAM)
                if (programId) next.set('programId', programId)
                setSearchParams(next, { replace: true })
              } catch (error) {
                const code = getApiErrorCode(error)
                if (code === 'UJAT_TYPED_DETAIL_REVISION_CONFLICT') {
                  void showAlert({
                    title: '일정이 변경되었습니다.',
                    content: '다른 관리자가 일정을 먼저 변경했습니다. 최신 정보를 다시 확인한 뒤 저장해 주세요.',
                  })
                } else if (code === 'UJAT_TYPED_SCHEDULE_REFERENCED') {
                  void showAlert({
                    title: '일정을 변경할 수 없습니다.',
                    content: '이미 교육 진행에 연결된 일정은 삭제하거나 교체할 수 없습니다. 기존 일정은 유지해 주세요.',
                  })
                }
                handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
                throw error
              }
            }
          : undefined,
      commonInfoPatchOnly: true,
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
      void showAlert({
        title: '안내',
        content: '사업 종료일 이후에는 공통 정보를 수정할 수 없습니다.',
      })
      return
    }
    infoResetToProgram()
    educationScheduleForm.reset(displayProgram.ujatTypedDetail ?? EMPTY_UJAT_TYPED_DETAIL)
    setEditMode('info')
  }, [
    activeTab,
    displayProgram,
    educationScheduleForm,
    infoResetToProgram,
    setEditMode,
    showAlert,
  ])

  const handleInfoSave = useCallback(async () => {
    if (!displayProgram) return
    const infoValues = infoForm.getValues()
    if (
      isProgramTypeSettingsSaveBlocked(displayProgram, {
        educationStructure: infoValues.educationStructure,
        sessionRound: infoValues.sessionRound,
      })
    ) {
      void showAlert({
        title: PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_TITLE,
        content: PROGRAM_TYPE_SETTINGS_CHANGE_BLOCKED_MESSAGE,
      })
      return
    }
    const endOverlay = beginBlockingOverlay()
    try {
      const ok = await infoTriggerSave()
      if (ok) {
        detailRequiredHighlight.clear()
        setEditMode(null)
        return
      }
      if (takeInfoSaveFailure() === 'validation') {
        void showAlert({
          title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
          content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
        })
      }
    } finally {
      endOverlay()
    }
  }, [
    detailRequiredHighlight,
    displayProgram,
    infoForm,
    infoTriggerSave,
    setEditMode,
    showAlert,
    takeInfoSaveFailure,
  ])

  const handleInfoCancel = useCallback(() => {
    infoResetToProgram()
    educationScheduleForm.reset(displayProgram?.ujatTypedDetail ?? EMPTY_UJAT_TYPED_DETAIL)
    detailRequiredHighlight.clear()
    setEditMode(null)
  }, [detailRequiredHighlight, displayProgram, educationScheduleForm, infoResetToProgram, setEditMode])

  const isEditModeRecruitParticipant =
    open &&
    activeRecruitTab === 'recruit_participant' &&
    editTab === 'recruit_participant' &&
    !!displayProgram &&
    canUjatRecruitmentInfoEdit(displayProgram, 'recruit_participant')

  const isEditModeRecruitVolunteer =
    open &&
    !!activeRecruitTab &&
    (activeRecruitTab === 'recruit_volunteer_h1' || activeRecruitTab === 'recruit_volunteer_h2') &&
    editTab === activeRecruitTab &&
    !!displayProgram &&
    canUjatRecruitmentInfoEdit(displayProgram, activeRecruitTab)

  const institutionsForm = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeRecruitParticipant,
    schema: programDetailInstitutionsEditSchema,
    mapToValues: mapInstitutionRecruitmentEditValues,
    holdValuesWhileEditing: true,
  })
  const {
    triggerSave: institutionsTriggerSave,
    resetToProgram: institutionsResetToProgram,
    registerGetAdditionalContentHtml: registerInstitutionsAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: institutionsForm,
    program: displayProgram ?? ({} as Program),
    mapToValues: mapInstitutionRecruitmentEditValues,
    recruitmentAudience: 'participant',
    recruitmentNotesField: 'oneLineIntroduction',
    strictRemote: true,
    onSaveEdit: displayProgram
      ? async (draft, patch) => {
            try {
              const canonicalDraft = applyUjatRecruitFormValuesToProgram(
                draft,
                'institution',
                institutionsForm.getValues()
              )
              const { registrationOverlay: _omitRegistrationOverlay, ...recruitPatch } = patch
              const remotePatch = omitRecruitmentTabScheduleFields({
                ...recruitPatch,
                generalCommonInfo: canonicalDraft.generalCommonInfo,
                programRecruitments: canonicalDraft.programRecruitments,
              })
              const result = await persistRecruitmentTabSave({
                baseline: displayProgram,
                draft: canonicalDraft,
                patch: remotePatch,
                audience: 'participant',
                refetchProgram: async id => {
                  const next = await fetchUjatProgramRemoteById(id)
                  if (!next) throw new Error('UJAT 프로그램 상세를 다시 불러오지 못했습니다.')
                  return next
                },
                remoteResponsePriority: true,
              })
              if (result.mode !== 'row') {
                throw new Error('UJAT 참여 기관 모집 행을 찾지 못했습니다. 중복 행을 생성하지 않고 저장을 중단합니다.')
              }
              const scope = shouldUseRemoteApi() ? 'remote' : 'local'
              await syncOpenProgramDetailCache(
                queryClient,
                ujatProgramQueryKeys.detail(scope, result.program.id),
                result.program,
                { refetch: false }
              )
              invalidateUjatProgramListCaches(queryClient)
              const next = new URLSearchParams(searchParams)
              next.delete(EDIT_PARAM)
              if (programId) next.set('programId', programId)
              setSearchParams(next, { replace: true })
            } catch (error) {
              handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
              if (getApiErrorCode(error) === 'RECRUITMENT_REVISION_CONFLICT') {
                void showAlert({
                  title: '모집 정보가 변경되었습니다.',
                  content:
                    '다른 관리자가 모집 정보를 먼저 저장했습니다. 입력값은 유지됩니다. 최신 모집 행을 확인한 뒤 다시 저장해 주세요.',
                })
              }
              throw error
            }
          }
        : undefined,
  })

  const isEditModeRecruitVolunteerH1 =
    isEditModeRecruitVolunteer && activeRecruitTab === 'recruit_volunteer_h1'
  const isEditModeRecruitVolunteerH2 =
    isEditModeRecruitVolunteer && activeRecruitTab === 'recruit_volunteer_h2'

  const volunteersH1Form = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeRecruitVolunteerH1,
    mapToValues: mapVolunteerH1RecruitmentEditValues,
    holdValuesWhileEditing: true,
  })
  const volunteersH2Form = useProgramDetailEditForm({
    program: displayProgram,
    isEditMode: isEditModeRecruitVolunteerH2,
    mapToValues: mapVolunteerH2RecruitmentEditValues,
    holdValuesWhileEditing: true,
  })
  const volunteersForm =
    activeRecruitTab === 'recruit_volunteer_h2' ? volunteersH2Form : volunteersH1Form
  const {
    triggerSave: volunteersTriggerSave,
    resetToProgram: volunteersResetToProgram,
    registerGetAdditionalContentHtml: registerVolunteersAdditionalHtml,
  } = useProgramDetailInfoSave({
    form: volunteersForm,
    program: displayProgram ?? ({} as Program),
    mapToValues: mapVolunteerRecruitmentEditValues,
    recruitmentAudience: 'volunteer',
    recruitmentNotesField: 'oneLineIntroduction',
    strictRemote: true,
    onSaveEdit: displayProgram
      ? async (draft, patch) => {
            try {
              const values = volunteersForm.getValues()
              if (!values.interviewStartDate?.trim() || !values.interviewEndDate?.trim()) {
                volunteersForm.setError('interviewStartDate', {
                  type: 'required',
                  message: '면접 기간을 입력해 주세요.',
                })
                void showAlert({
                  title: '면접 기간 안내',
                  content:
                    'UJAT 봉사자 모집은 면접이 필수입니다. 유효한 2차 면접 기간을 입력한 뒤 저장해 주세요.',
                })
                return
              }
              const volunteerKind = volunteerRecruitKindRef.current
              const volunteerHalf =
                volunteerHalfFromRecruitDisplayKind(volunteerKind) ?? undefined
              const liveInterview = getRecruitTypedInterviewRecord()
              const interviewValues =
                liveInterview != null && volunteerHalf
                  ? {
                      ...values,
                      volunteerInterviewConfig: overlayRecordToInterviewConfig(
                        liveInterview,
                        ujatVolunteerRecruitInterviewNamespace(volunteerHalf)
                      ),
                    }
                  : values
              const canonicalDraft = applyUjatRecruitFormValuesToProgram(
                draft,
                volunteerKind,
                interviewValues
              )
              const { registrationOverlay: _omitRegistrationOverlay, ...recruitPatch } = patch
              const remotePatch = omitRecruitmentTabScheduleFields({
                ...recruitPatch,
                generalCommonInfo: canonicalDraft.generalCommonInfo,
                programRecruitments: canonicalDraft.programRecruitments,
              })
              const result = await persistRecruitmentTabSave({
                baseline: displayProgram,
                draft: canonicalDraft,
                patch: remotePatch,
                audience: 'volunteer',
                volunteerHalf,
                refetchProgram: async id => {
                  const next = await fetchUjatProgramRemoteById(id)
                  if (!next) throw new Error('UJAT 프로그램 상세를 다시 불러오지 못했습니다.')
                  return next
                },
                remoteResponsePriority: true,
              })
              if (result.mode !== 'row') {
                throw new Error('UJAT 봉사자 모집 행을 찾지 못했습니다. 중복 행을 생성하지 않고 저장을 중단합니다.')
              }
              const scope = shouldUseRemoteApi() ? 'remote' : 'local'
              await syncOpenProgramDetailCache(
                queryClient,
                ujatProgramQueryKeys.detail(scope, result.program.id),
                result.program,
                { refetch: false }
              )
              invalidateUjatProgramListCaches(queryClient)
              const next = new URLSearchParams(searchParams)
              next.delete(EDIT_PARAM)
              if (programId) next.set('programId', programId)
              setSearchParams(next, { replace: true })
            } catch (error) {
              handleError(error, { context: 'ujatProgramDetailFullpageModal.saveEdit' })
              const errorCode = getApiErrorCode(error)
              if (errorCode === 'RECRUITMENT_REVISION_CONFLICT') {
                void showAlert({
                  title: '모집 정보가 변경되었습니다.',
                  content:
                    '다른 관리자가 모집 정보를 먼저 저장했습니다. 입력값은 유지됩니다. 최신 모집 행을 확인한 뒤 다시 저장해 주세요.',
                })
              }
              if (errorCode === 'INTERVIEW_CONFIG_CONFLICTS_WITH_ASSIGNMENTS') {
                void showAlert({
                  title: '면접 설정을 저장할 수 없습니다.',
                  content:
                    '이미 배정된 면접 일정과 충돌합니다. 기존 배정은 유지되며, 입력값은 버리지 않습니다. 배정된 슬롯을 제거하지 말고 설정을 조정해 주세요.',
                })
              }
              if (errorCode === UJAT_NOTICE_EXPOSURE_TIMING_INVALID_CODE) {
                volunteersForm.setError('volunteerRecruitmentNoticeExposure', {
                  type: 'server',
                  message: '모집 공고 노출 시점을 다시 선택해 주세요.',
                })
              }
              if (errorCode?.startsWith('UJAT_RECRUIT_TERM_')) {
                void showAlert({
                  title: '저장 실패',
                  content: extractApiErrorMessage(
                    (error as { response?: { data?: unknown } }).response?.data,
                    { fallback: '봉사자 모집 상·하반기 구분을 확인해 주세요.' }
                  ),
                })
              }
              if (getApiErrorCode(error) === 'UJAT_VOLUNTEER_INTERVIEW_REQUIRED') {
                volunteersForm.setError('interviewStartDate', {
                  type: 'server',
                  message: '면접 기간을 입력해 주세요.',
                })
                void showAlert({
                  title: '면접 기간 안내',
                  content: extractApiErrorMessage(
                    (error as { response?: { data?: unknown } }).response?.data,
                    {
                      fallback:
                        'UJAT 봉사자 모집은 면접이 필수입니다. 유효한 2차 면접 기간을 입력한 뒤 저장해 주세요.',
                    }
                  ),
                })
              }
              throw error
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

  const [recruitmentPreviewTab, setRecruitmentPreviewTab] = useState<UjatRecruitTabKey | null>(null)

  useEffect(() => {
    if (!open) setRecruitmentPreviewTab(null)
  }, [open])

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
      !canUjatRecruitmentInfoEdit(
        displayProgram,
        editTab as 'recruit_participant' | 'recruit_volunteer_h1' | 'recruit_volunteer_h2'
      )
    ) {
      const next = new URLSearchParams(searchParams)
      next.delete(EDIT_PARAM)
      if (programId) next.set('programId', programId)
      setSearchParams(next, { replace: true })
    }
  }, [open, editTab, displayProgram, programId, searchParams, setSearchParams])

  const handleRecruitmentEdit = useCallback(() => {
    if (!activeRecruitTab || !displayProgram) return
    if (!canUjatRecruitmentInfoEdit(displayProgram, activeRecruitTab)) {
      void showAlert({
        title: PROGRAM_RECRUITMENT_INFO_EDIT_BLOCKED_ALERT_TITLE,
        content: PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE,
      })
      return
    }
    void hydrateUjatRecruitTemplatesForProgram(displayProgram)
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
    showAlert,
  ])

  const handleRecruitmentSave = useCallback(async () => {
    if (!activeRecruitTab) return
    const recruitHalf =
      activeRecruitTab === 'recruit_volunteer_h1'
        ? 'h1'
        : activeRecruitTab === 'recruit_volunteer_h2'
          ? 'h2'
          : null
    const typedIncompleteKeys =
      activeRecruitTab === 'recruit_participant'
        ? listIncompleteUjatProgramRecruitmentTypedRequiredFields({
            institution: institutionsForm.getValues(),
          })
        : recruitHalf == null
          ? []
          : listIncompleteUjatProgramRecruitmentTypedRequiredFields({
              ...(recruitHalf === 'h1' ? { volunteerH1: volunteersForm.getValues() } : {}),
              ...(recruitHalf === 'h2' ? { volunteerH2: volunteersForm.getValues() } : {}),
            })
    const interviewIncompleteKeys =
      recruitHalf == null
        ? []
        : listIncompleteUjatProgramRecruitmentInterviewScheduleRequiredFields().filter(key =>
            key.startsWith(`recruit.volunteer.${recruitHalf}`)
          )
    const incompleteKeys = [...typedIncompleteKeys, ...interviewIncompleteKeys]
    if (incompleteKeys.length > 0) {
      detailRequiredHighlight.report(incompleteKeys)
      console.debug('[ujat-detail] 모집정보 필수항목 미입력:', incompleteKeys)
      void showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: buildRequiredFieldsIncompleteAlertContent(
          formatUjatRegistrationRequiredFieldReasons(incompleteKeys)
        ),
      })
      return
    }
    const endOverlay = beginBlockingOverlay()
    try {
      const ok =
        activeRecruitTab === 'recruit_participant'
          ? await institutionsTriggerSave()
          : await volunteersTriggerSave()
      if (ok) {
        detailRequiredHighlight.clear()
        setEditMode(null)
      }
    } finally {
      endOverlay()
    }
  }, [
    activeRecruitTab,
    detailRequiredHighlight,
    institutionsForm,
    institutionsTriggerSave,
    setEditMode,
    showAlert,
    volunteersForm,
    volunteersTriggerSave,
  ])

  const handleRecruitmentCancel = useCallback(() => {
    if (activeRecruitTab === 'recruit_participant') institutionsResetToProgram()
    else volunteersResetToProgram()
    detailRequiredHighlight.clear()
    setEditMode(null)
  }, [
    activeRecruitTab,
    detailRequiredHighlight,
    institutionsResetToProgram,
    setEditMode,
    volunteersResetToProgram,
  ])

  // TODO: X는 바깥 모달 닫기로 통일됨. breadcrumb/목록 복귀 외 용도가 없으면 등록부 제거 검토.
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
    if (tryNavigateMemberDetailReturn(navigate)) return
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

  const volAddMemberId = open
    ? parseUjatVolAddMemberIdParam(searchParams.get(UJAT_VOL_ADD_MEMBER_ID_PARAM))
    : null

  const handleOpenSurveyCreateModal = useCallback(() => {
    setSelectedSurveyTemplateId(null)
    setSelectedSurveyScheduleValue(null)
    setSubmittingSurveyTemplate(false)
    setSurveyCreateModalOpen(true)
  }, [])

  const handleCloseSurveyCreateModal = useCallback(() => {
    if (submittingSurveyTemplate) return
    setSurveyCreateModalOpen(false)
  }, [submittingSurveyTemplate])

  const handleSubmitSurveyTemplate = useCallback(async () => {
    if (selectedSurveyTemplateId == null || selectedSurveyTemplateId === '') return
    if (showSurveyPollScheduleSelectField) {
      if (
        selectedSurveyScheduleValue == null ||
        selectedSurveyScheduleValue === '' ||
        !surveyScheduleOptionsQuery.hasSessionSchedules
      ) {
        return
      }
    }
    setSubmittingSurveyTemplate(true)
    try {
      const next = findWritingTemplateRowByDefinitionId(selectedSurveyTemplateId)

      if (surveysRemote) {
        const resolved = await resolvePublishedSurveyBinding(selectedSurveyTemplateId)
        if (!resolved.ok) {
          void showAlert({
            title: '등록 실패',
            content: surveyBindingResolutionAlert(resolved.reason),
          })
          return
        }
        let targetScopePayload: Pick<ProgramFormBindingRequest, 'targetScope' | 'targetScopeId'>
        if (showSurveyPollScheduleSelectField) {
          try {
            targetScopePayload = resolveSurveyPollBindingTarget(selectedSurveyScheduleValue!)
          } catch {
            void showAlert({
              title: '등록 실패',
              content: '설문 대상 일정을 다시 선택해 주세요.',
            })
            return
          }
        } else {
          const surveyTarget =
            displayProgram == null
              ? null
              : await resolveSurveyPollBindingTargetWhenScheduleFieldHidden(displayProgram)
          if (surveyTarget == null) {
            void showAlert({
              title: '등록 실패',
              content:
                '설문조사는 교육 일정(회차)에 연결해야 합니다. 프로그램 일정을 먼저 등록한 뒤 다시 시도해 주세요.',
            })
            return
          }
          if (isSurveyPollBindingTargetScheduleAlreadyRegistered(surveyTarget, classifiedBindings)) {
            void showAlert({
              title: '등록 실패',
              content: SURVEY_POLL_SCHEDULE_ALREADY_REGISTERED_MESSAGE,
            })
            return
          }
          targetScopePayload = surveyTarget
        }
        const payload: ProgramFormBindingRequest = {
          formType: 'SURVEY',
          templateId: resolved.templateId,
          templateVersionId: resolved.templateVersionId,
          ...ensureSurveyCreateSubmissionPeriod(resolved),
          active: true,
          required: false,
          ...targetScopePayload,
        }
        const result = await createBinding(payload)
        if (!result.ok) {
          await invalidateSurveyCaches()
          void showAlert({ title: '등록 실패', content: result.message })
          return
        }
        if (displayProgram != null && result.binding != null) {
          const editLoad = await loadProgramSurveyFormEditAfterBinding(
            String(displayProgram.id),
            result.binding,
            selectedSurveyTemplateId
          )
          setSurveyCreateModalOpen(false)
          setSelectedSurveyScheduleValue(null)
          if (editLoad.ok) {
            setProgramFormEdit(editLoad.edit)
          } else {
            void showAlert({ title: '양식 편집', content: editLoad.message })
          }
          return
        }
        setSurveyCreateModalOpen(false)
        return
      }

      void next
      void showAlert({
        title: '등록 불가',
        content: '설문 등록은 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      setSurveyCreateModalOpen(false)
    } catch (error) {
      handleError(error, { context: 'ujatSurveyTemplate.create' })
      void showAlert({
        title: '등록 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '설문 등록에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    } finally {
      setSubmittingSurveyTemplate(false)
    }
  }, [
    classifiedBindings,
    createBinding,
    displayProgram,
    invalidateSurveyCaches,
    registeredSurveys.length,
    selectedSurveyScheduleValue,
    selectedSurveyTemplateId,
    showAlert,
    showSurveyPollScheduleSelectField,
    surveyScheduleOptionsQuery.hasSessionSchedules,
    surveysRemote,
  ])

  const handleDeleteRegisteredSurvey = useCallback(async () => {
    if (!activeRegisteredSurvey || activeRegisteredSurvey.status !== 'before_start') return
    if (surveysRemote && activeRegisteredSurvey.bindingId) {
      const result = await deleteBinding(activeRegisteredSurvey.bindingId)
      if (!result.ok) {
        void showAlert({ title: '삭제 실패', content: result.message })
        return
      }
      return
    }
    if (!import.meta.env.DEV) {
      void showAlert({
        title: '삭제 불가',
        content: '설문 삭제는 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      return
    }
    setRegisteredSurveys(prev => {
      const next = prev.filter(item => item.id !== activeRegisteredSurvey.id)
      setActiveRegisteredSurveyId(current => {
        if (current !== activeRegisteredSurvey.id) return current
        return next[0]?.id ?? null
      })
      return next
    })
  }, [activeRegisteredSurvey, deleteBinding, showAlert, surveysRemote])

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
    void handleDeleteRegisteredSurvey()
    setSurveyDeleteModalOpen(false)
    setSurveyDeleteConfirmWord('')
  }, [surveyDeleteConfirmWord, handleDeleteRegisteredSurvey])

  const handleOpenRegisteredSurveyTemplatePreview = useCallback(() => {
    if (!activeRegisteredSurvey) return
    openUjatSurveyTemplatePreview(activeRegisteredSurvey, {
      allowEdit: canEditRegisteredSurveyForm(activeRegisteredSurvey),
    })
  }, [activeRegisteredSurvey, openUjatSurveyTemplatePreview])

  const handleShareRegisteredSurvey = useCallback(() => {
    if (!activeRegisteredSurvey || programId == null) return
    if (!surveysRemote) {
      void showAlert({
        title: '공유',
        content: '공개 설문 공유를 사용하려면 설문 API 연결이 필요합니다.',
      })
      return
    }
    const bindingId = activeRegisteredSurvey.bindingId?.trim()
    if (!bindingId) {
      void showAlert({
        title: '공유',
        content: '공유할 설문 연결 정보를 찾지 못했습니다.',
      })
      return
    }
    void (async () => {
      try {
        const response = await createGeneralProgramSurveyShareLink(programId, bindingId)
        const platformOrigin = getPlatformPublicOrigin()
        const url = response
          ? resolveSurveyShareClipboardUrl(response, platformOrigin)
          : null
        if (!url) {
          void showAlert({
            title: '공유',
            content: describeSurveyShareClipboardFailure(response, platformOrigin, 'survey'),
          })
          return
        }
        void copyText(url)
        showShareCopyToast(UJAT_SURVEY_POLL_SHARE_TOAST_COPY)
      } catch (error) {
        handleError(error, { context: 'ujatSurveyShareLink' })
        void showAlert({
          title: '공유',
          content: '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    })()
  }, [activeRegisteredSurvey, copyText, programId, showAlert, showShareCopyToast, surveysRemote])

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
            buildUjatSurveyPollResultsPdfFileName(
              resolveUjatProgramDisplayTitle(displayProgram),
              activeRegisteredSurvey.title
            )
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
      const next = findWritingTemplateRowByDefinitionId(selectedSatisfactionTemplateId)

      if (surveysRemote) {
        const resolved = await resolvePublishedSurveyBinding(selectedSatisfactionTemplateId)
        if (!resolved.ok) {
          void showAlert({
            title: '등록 실패',
            content: surveyBindingResolutionAlert(resolved.reason),
          })
          return
        }
        const targetRole =
          activeSatisfactionAudience === 'teacher'
            ? 'TEACHER'
            : activeSatisfactionAudience === 'volunteer_h2'
              ? 'VOLUNTEER_H2'
              : 'VOLUNTEER_H1'
        const payload: ProgramFormBindingRequest = {
          formType: 'SATISFACTION',
          templateId: resolved.templateId,
          templateVersionId: resolved.templateVersionId,
          submissionStartAt: resolved.submissionStartAt,
          submissionEndAt: resolved.submissionEndAt,
          targetRole,
          active: true,
          required: false,
        }
        const result = await createBinding(payload)
        if (!result.ok) {
          await invalidateSurveyCaches()
          void showAlert({ title: '등록 실패', content: result.message })
          return
        }
        if (displayProgram != null && result.binding != null) {
          const editLoad = await loadProgramSurveyFormEditAfterBinding(
            String(displayProgram.id),
            result.binding,
            selectedSatisfactionTemplateId
          )
          setSatisfactionCreateModalOpen(false)
          if (editLoad.ok) {
            setProgramFormEdit(editLoad.edit)
          } else {
            void showAlert({ title: '양식 편집', content: editLoad.message })
          }
          return
        }
        setSatisfactionCreateModalOpen(false)
        return
      }

      void next
      void showAlert({
        title: '등록 불가',
        content: '만족도조사 등록은 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      setSatisfactionCreateModalOpen(false)
    } catch (error) {
      handleError(error, { context: 'ujatSatisfactionSurvey.create' })
      void showAlert({
        title: '등록 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '만족도조사 등록에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    } finally {
      setSubmittingSatisfactionSurvey(false)
    }
  }, [
    activeSatisfactionAudience,
    createBinding,
    displayProgram,
    invalidateSurveyCaches,
    selectedSatisfactionTemplateId,
    showAlert,
    surveysRemote,
  ])

  const handleDeleteSatisfactionSurvey = useCallback(async () => {
    if (!activeSatisfactionSurvey || activeSatisfactionSurvey.status !== 'before_start') return
    if (surveysRemote && activeSatisfactionSurvey.bindingId) {
      const result = await deleteBinding(activeSatisfactionSurvey.bindingId)
      if (!result.ok) {
        void showAlert({ title: '삭제 실패', content: result.message })
        return
      }
      return
    }
    if (!import.meta.env.DEV) {
      void showAlert({
        title: '삭제 불가',
        content: '만족도조사 삭제는 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      return
    }
    setSatisfactionSurveysByAudience(prev => {
      const next = { ...prev }
      delete next[activeSatisfactionAudience]
      return next
    })
  }, [
    activeSatisfactionAudience,
    activeSatisfactionSurvey,
    deleteBinding,
    showAlert,
    surveysRemote,
  ])

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
    void handleDeleteSatisfactionSurvey()
    setSatisfactionDeleteModalOpen(false)
    setSatisfactionDeleteConfirmWord('')
  }, [satisfactionDeleteConfirmWord, handleDeleteSatisfactionSurvey])

  const handleOpenSatisfactionTemplatePreview = useCallback(() => {
    if (!activeSatisfactionSurvey) return
    openUjatSurveyTemplatePreview(activeSatisfactionSurvey, {
      allowEdit: canEditRegisteredSurveyForm(activeSatisfactionSurvey),
    })
  }, [activeSatisfactionSurvey, openUjatSurveyTemplatePreview])

  const handleShareSatisfactionSurvey = useCallback(() => {
    if (!activeSatisfactionSurvey || programId == null) return
    if (!surveysRemote) {
      void showAlert({
        title: '공유',
        content: '공개 만족도조사 공유를 사용하려면 설문 API 연결이 필요합니다.',
      })
      return
    }
    const bindingId = activeSatisfactionSurvey.bindingId?.trim()
    if (!bindingId) {
      void showAlert({
        title: '공유',
        content: '공유할 만족도조사 연결 정보를 찾지 못했습니다.',
      })
      return
    }
    void (async () => {
      try {
        const response = await createGeneralProgramSurveyShareLink(programId, bindingId)
        const platformOrigin = getPlatformPublicOrigin()
        const url = response
          ? resolveSurveyShareClipboardUrl(response, platformOrigin)
          : null
        if (!url) {
          void showAlert({
            title: '공유',
            content: describeSurveyShareClipboardFailure(
              response,
              platformOrigin,
              'satisfaction'
            ),
          })
          return
        }
        void copyText(url)
        showShareCopyToast()
      } catch (error) {
        handleError(error, { context: 'ujatSatisfactionShareLink' })
        void showAlert({
          title: '공유',
          content: '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    })()
  }, [
    activeSatisfactionAudience,
    activeSatisfactionSurvey,
    copyText,
    programId,
    showAlert,
    showShareCopyToast,
    surveysRemote,
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
              resolveUjatProgramDisplayTitle(displayProgram),
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
    if (lectureEvalSurvey == null) return
    const templateId = lectureEvalSurvey.templateId || UJAT_LECTURE_EVAL_TEMPLATE_ID
    const versionId = Number(lectureEvalSurvey.id)
    const loadDraft = async () => {
      if (
        findWritingTemplateRowByDefinitionId(templateId) == null &&
        Number.isFinite(versionId) &&
        versionId > 0
      ) {
        const record = await loadFormTemplateVersionDraftByVersionId(
          templateId,
          Math.trunc(versionId)
        )
        if (record?.draft != null) return record.draft
      }
      return buildLectureEvalFormDraft(templateId)
    }
    void loadDraft()
      .catch(() => buildLectureEvalFormDraft(templateId))
      .then(draft => {
        lectureEvalDraftRef.current = lectureEvalDraftRef.current ?? draft
        setLectureEvalFormDraft(prev => prev ?? draft)
      })
  }, [lectureEvalSurvey])

  useEffect(() => {
    if (lectureEvalSurvey == null) {
      lectureEvalDraftRef.current = null
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
      const next = findWritingTemplateRowByDefinitionId(selectedLectureEvalTemplateId)

      if (surveysRemote) {
        const resolved = await resolvePublishedSurveyBinding(selectedLectureEvalTemplateId)
        if (!resolved.ok) {
          void showAlert({
            title: '등록 실패',
            content: surveyBindingResolutionAlert(resolved.reason),
          })
          return
        }
        const lectureTarget = await resolveLectureEvalBindingTargetForCreate(
          programId == null ? '' : String(programId)
        )
        const payload: ProgramFormBindingRequest = {
          formType: 'LECTURE_EVALUATION',
          templateId: resolved.templateId,
          templateVersionId: resolved.templateVersionId,
          submissionStartAt: resolved.submissionStartAt,
          submissionEndAt: resolved.submissionEndAt,
          targetRole: 'ADMIN',
          targetScope: lectureTarget.targetScope,
          ...(lectureTarget.targetScopeId != null
            ? { targetScopeId: lectureTarget.targetScopeId }
            : {}),
          active: true,
          required: false,
        }
        const result = await createBinding(payload)
        if (!result.ok) {
          await invalidateSurveyCaches()
          void showAlert({ title: '등록 실패', content: result.message })
          return
        }
        setLectureEvalCreateModalOpen(false)
        return
      }

      void next
      void showAlert({
        title: '등록 불가',
        content: '강의평가 등록은 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      setLectureEvalCreateModalOpen(false)
    } catch (error) {
      handleError(error, { context: 'ujatLectureEval.register' })
      void showAlert({
        title: '등록 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '강의평가 등록에 실패했습니다. 다시 시도해 주세요.'
        ),
      })
    } finally {
      setSubmittingLectureEvalSurvey(false)
    }
  }, [
    createBinding,
    invalidateSurveyCaches,
    programId,
    selectedLectureEvalTemplateId,
    showAlert,
    surveysRemote,
  ])

  const handleOpenLectureEvalPreview = useCallback(() => {
    if (!lectureEvalSurvey) return
    const row = findWritingTemplateRowByDefinitionId(lectureEvalSurvey.templateId)
    const editTarget =
      canEditRegisteredSurveyForm(lectureEvalSurvey) && displayProgram != null
        ? buildProgramSurveyFormEditTarget(String(displayProgram.id), lectureEvalSurvey)
        : null
    const onEditForm =
      canEditRegisteredSurveyForm(lectureEvalSurvey) && editTarget == null && row != null
        ? () => {
            closeWritingUserPreview()
            setSurveyTemplateEditId(row.id)
            setSurveyTemplateEditOpen(true)
          }
        : undefined

    void (async () => {
      if (row != null) {
        const entry = lookupTemplateRegistry(row.id)
        if (entry == null || !isSurveyRegistryEntry(entry)) return null
        const draft = await buildLectureEvalFormDraft(row.id)
        return {
          draft,
          updateParagraph: () => {},
          headerTitle: resolvePreviewHeaderTitle(entry, row.templateName),
          editorKind: 'survey' as const,
          paragraphBodyOptions: UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
          ...(onEditForm != null ? { onEditForm } : {}),
        }
      }
      const versionId = Number(lectureEvalSurvey.id)
      if (!Number.isFinite(versionId) || versionId <= 0) return null
      const record = await loadFormTemplateVersionDraftByVersionId(
        lectureEvalSurvey.templateId,
        Math.trunc(versionId)
      )
      if (record?.draft == null) return null
      return {
        draft: record.draft,
        updateParagraph: () => {},
        headerTitle: lectureEvalSurvey.title.trim() || '강의평가',
        editorKind: 'survey' as const,
        paragraphBodyOptions: UJAT_LECTURE_EVAL_SURVEY_PARAGRAPH_BODY_OPTIONS,
      }
    })()
      .then(session => {
        if (session == null) {
          void showAlert({
            title: '양식 보기',
            content: '강의평가 양식을 불러오지 못했습니다. 다시 시도해 주세요.',
          })
          return
        }
        requestPreviewHistoryPush()
        openWritingUserPreview(
          editTarget != null
            ? {
                ...session,
                onEditForm: () => {
                  closeWritingUserPreview()
                  setProgramFormEdit({ target: editTarget, initialDraft: session.draft })
                },
              }
            : session
        )
      })
      .catch(error => {
        handleError(error, { context: 'ujatLectureEvalPreview' })
        void showAlert({
          title: '양식 보기',
          content: getGeneralProgramApiErrorMessage(
            error,
            '강의평가 양식을 불러오지 못했습니다. 다시 시도해 주세요.'
          ),
        })
      })
  }, [
    lectureEvalSurvey,
    displayProgram,
    closeWritingUserPreview,
    openWritingUserPreview,
    requestPreviewHistoryPush,
    showAlert,
  ])

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

  const handleLectureEvalDraftChange = useCallback((draft: WritingFormDraft) => {
    lectureEvalDraftRef.current = draft
  }, [])

  const handleLectureEvalSubmit = useCallback(async () => {
    const lectureEvalFormDraft = lectureEvalDraftRef.current
    if (!lectureEvalSurvey || lectureEvalFormDraft == null) return
    const validation = validateLectureEvalFormDraft(lectureEvalFormDraft)
    if (!validation.valid) {
      void showAlert({
        title: '입력 확인',
        content: validation.message,
      })
      return
    }

    setLectureEvalFormDraft(lectureEvalFormDraft)
    const pollResponse = draftToLectureEvalPollResponse(lectureEvalFormDraft)
    if (surveysRemote) {
      const versionId = Number(lectureEvalSurvey.id)
      const programIdNum = Number(programId)
      if (
        programId == null ||
        !Number.isFinite(versionId) ||
        versionId <= 0 ||
        !Number.isFinite(programIdNum)
      ) {
        void showAlert({
          title: '제출 실패',
          content: '강의평가 양식 버전을 찾지 못했습니다. 다시 시도해 주세요.',
        })
        return
      }
      try {
        await submitGeneralProgramFormResponse({
          templateVersionId: Math.trunc(versionId),
          programId: programIdNum,
          contextType: 'PROGRAM',
          answers: pollResponse.answers,
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.surveyResponses(
            String(programId),
            String(Math.trunc(versionId))
          ),
        })
      } catch (error) {
        handleError(error, { context: 'ujatLectureEvalSubmit' })
        void showAlert({
          title: '제출 실패',
          content: '강의평가 제출 중 오류가 발생했습니다. 다시 시도해 주세요.',
        })
        return
      }
    } else if (!import.meta.env.DEV) {
      void showAlert({
        title: '제출 불가',
        content: '강의평가 제출은 remote API가 활성화된 환경에서만 이용할 수 있습니다.',
      })
      return
    }

    setLectureEvalSubmitted(true)
    setLectureEvalResponses([pollResponse])
  }, [lectureEvalSurvey, programId, queryClient, showAlert, surveysRemote])

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
            buildLectureEvalResultsPdfFileName(resolveUjatProgramDisplayTitle(displayProgram))
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
      const parsedMemberId = parseUjatVolAddMemberIdParam(memberId)
      if (parsedMemberId == null) return
      const next = new URLSearchParams(searchParams)
      if (programId) next.set('programId', programId)
      next.set(LNB_PARAM, 'education_progress')
      const halfTab = activeTab.startsWith('edu_h2') ? 'edu_h2_volunteers' : 'edu_h1_volunteers'
      next.set(TAB_PARAM, halfTab)
      next.set(UJAT_VOL_ADD_MEMBER_ID_PARAM, parsedMemberId)
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

  if (!open) return null

  const programTitle = displayProgram
    ? resolveUjatProgramDisplayTitle(displayProgram)
    : '프로그램 상세'
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

    items.push(makeBreadcrumbItem(programTitle, location.pathname, programParams))

    if (nestedDetailLabel && activeLnb === 'institution_applications') {
      items.push(makeBreadcrumbItem(lnbLabel, location.pathname, lnbParams))
    } else if (!childLabel) {
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
    <RegistrationWizardValidationHighlightProvider variant="ujat">
    <RegistrationWizardValidationHighlightSync
      nonce={detailRequiredHighlight.request.nonce}
      keys={detailRequiredHighlight.request.keys}
      variant="ujat"
    />
    <>
    <DetailFullPageModal
      open={open}
      onClose={handleClose}
      title={title}
      headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
      closeAriaLabel="닫기"
      className="program-detail-fullpage-modal ujat-program-detail-fullpage-modal"
      sidebar={
        programId ? (
          <UjatProgramDetailSidebar
            activeLnb={activeLnb}
            activeTab={activeTab}
            interviewEnabled={interviewEnabled}
            surveyItems={surveyItems}
            onSelectChildTab={setLnbTab}
            footer={
              canWrite && onRequestDelete && displayProgram ? (
                <ProgramDetailLnbDeleteButton onClick={() => onRequestDelete(displayProgram)} />
              ) : null
            }
          />
        ) : null
      }
    >
      {loading ? (
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
                  <BusinessPeriodExtendToolbar
                    program={displayProgram}
                    editDisabled={!canEditInfo && !isEditModeInfo}
                    hideExtend={isEditModeInfo}
                  >
                    <ProgramEditInfoActions
                      canWrite={canWrite}
                      isEditing={isEditModeInfo}
                      idleVariant="secondary"
                      disabled={!canEditInfo && !isEditModeInfo}
                      onEdit={handleInfoEdit}
                      onCancel={handleInfoCancel}
                      onSave={() => {
                        void handleInfoSave()
                      }} />
                  </BusinessPeriodExtendToolbar>
                </div>
              </div>
              <UjatProgramDetailCommonInfoView
                program={displayProgram}
                sponsorName={sponsorName}
                isEditMode={isEditModeInfo}
                infoForm={isEditModeInfo ? infoForm : undefined}
                scheduleForm={isEditModeInfo ? educationScheduleForm : undefined}
              />
            </>
          )}

          {activeLnb === 'info' && activeRecruitTab && (
            <div className="program-detail-fullpage-modal__info-tab ujat-detail-modal__recruitment-body">
              <UjatProgramRecruitmentTabsRow
                activeTab={activeRecruitTab}
                onSelectTab={selectRecruitTab}
                canWrite={canWrite}
                canEdit
                isEditMode={isRecruitEditMode}
                onEdit={handleRecruitmentEdit}
                onCancel={handleRecruitmentCancel}
                onSave={() => {
                  void handleRecruitmentSave()
                }}
                onOpenPreview={setRecruitmentPreviewTab}
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
                programId={programId}
                onBack={() => setInstitutionApplicationId(null)}
                onStatusUpdated={() => setInstitutionListVersion(v => v + 1)}
                onOpenScheduleAssign={() =>
                  setLnbTab('institution_applications', 'inst_schedule_assign')
                }
              />
            ) : (
              <UjatInstitutionApplicationList
                key={institutionListVersion}
                programId={programId}
                onOpenDetail={row => setInstitutionApplicationId(row.id)}
                onOpenScheduleAssign={() =>
                  setLnbTab('institution_applications', 'inst_schedule_assign')
                }
              />
            ))}
          {activeLnb === 'institution_applications' && activeTab === 'inst_schedule_assign' && (
            <UjatInstitutionScheduleAssignPage programId={programId} />
          )}
          {activeLnb === 'institution_applications' && activeTab === 'inst_schedule_confirm' && (
            institutionDetailId ? (
              <UjatInstitutionScheduleConfirmDetailPage
                institutionId={institutionDetailId}
                programId={programId}
                onBack={() => setInstitutionApplicationId(null)}
                onStatusUpdated={() => setInstitutionListVersion(v => v + 1)}
                onOpenScheduleAssign={() =>
                  setLnbTab('institution_applications', 'inst_schedule_assign')
                }
              />
            ) : (
              <UjatInstitutionScheduleConfirmList
                programId={programId}
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
                description="봉사자 신청·심사·면접 일정 배정 화면(상·하반기 동일 프로세스)입니다."
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
                  program={displayProgram}
                  volunteerHalf={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
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
                programId={displayProgram.id}
                half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
              />
            </div>
          )}
          {activeLnb === 'education_progress' && /^edu_h[12]_assignments$/.test(activeTab) && (
            <div className="program-detail-fullpage-modal__info-tab">
              <UjatEducationProgressAssignmentsSection
                programId={displayProgram.id}
                half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
              />
            </div>
          )}
          {activeLnb === 'education_progress' && /^edu_h[12]_region$/.test(activeTab) && (
            <div className="program-detail-fullpage-modal__info-tab">
              <UjatEducationProgressRegionAssignmentSection
                programId={displayProgram.id}
                half={activeTab.startsWith('edu_h2') ? 'h2' : 'h1'}
              />
            </div>
          )}
          {activeLnb === 'education_progress' && activeTab === 'edu_summary' && (
            <div className="program-detail-fullpage-modal__info-tab">
              <UjatEducationProgressSummarySection programId={displayProgram?.id ?? programId} />
            </div>
          )}

          {activeLnb === 'survey' &&
            (activeTab === 'survey-poll' ? (
              registeredSurveys.length === 0 ? (
                <UjatSurveyEmptyState
                  title={UJAT_SURVEY_POLL_EMPTY_COPY.title}
                  description={UJAT_SURVEY_POLL_EMPTY_COPY.description}
                  registerButtonLabel={UJAT_SURVEY_POLL_EMPTY_COPY.registerButton}
                  showRegisterButton={canWrite}
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
                          showAddButton={canWrite}
                          onShareClick={handleShareRegisteredSurvey}
                          onAddClick={handleOpenSurveyCreateModal}
                          onOpenTemplatePreview={handleOpenRegisteredSurveyTemplatePreview}
                          onDownloadClick={() => setPollDownloadModalOpen(true)}
                        />
                      ) : null
                    }
                  />
                  {activeRegisteredSurvey != null &&
                  (activeRegisteredSurvey.status === 'before_start' ||
                    (activeRegisteredSurvey.status === 'finished' &&
                      activeRegisteredSurvey.responseCount === 0)) ? (
                    <UjatSurveyNoResponseState
                      title={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.title}
                      description={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.description}
                      deleteButtonLabel={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.deleteButton}
                      previewButtonLabel={UJAT_SURVEY_POLL_NO_RESPONSE_COPY.previewButton}
                      canDelete={canWrite && activeRegisteredSurvey.status === 'before_start'}
                      showDeleteButton={canWrite}
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
            ) : isUjatSatisfactionSurveyTab(activeTab) ? (
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
                audienceTabs={satisfactionAudienceTabs}
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
                onFormDraftChange={handleLectureEvalDraftChange}
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
      <SurveyPollRegisterModal
        open={surveyCreateModalOpen}
        className="ujat-survey-create-modal"
        submitting={submittingSurveyTemplate}
        templateOptions={surveyTemplateOptions}
        templateValue={selectedSurveyTemplateId}
        onTemplateChange={setSelectedSurveyTemplateId}
        scheduleOptions={surveyScheduleOptionsQuery.options}
        scheduleValue={selectedSurveyScheduleValue}
        onScheduleChange={setSelectedSurveyScheduleValue}
        schedulesLoading={surveyScheduleOptionsQuery.isLoading}
        hasSessionSchedules={surveyScheduleOptionsQuery.hasSessionSchedules}
        showScheduleField={showSurveyPollScheduleSelectField}
        onCancel={handleCloseSurveyCreateModal}
        onSubmit={() => {
          void handleSubmitSurveyTemplate()
        }}
      />
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
              type="button"
              onClick={handleCloseSurveyDeleteModal} >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              disabled={surveyDeleteConfirmWord.trim() !== '삭제'}
              onClick={handleConfirmSurveyDelete} >
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
              type="button"
              onClick={handleCloseSatisfactionCreateModal}
              disabled={submittingSatisfactionSurvey} >
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              onClick={() => {
                void handleSubmitSatisfactionSurvey()
              }}
              disabled={
                selectedSatisfactionTemplateId == null || selectedSatisfactionTemplateId === ''
              }
              loading={submittingSatisfactionSurvey} >
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
              type="button"
              onClick={handleCloseSatisfactionDeleteModal} >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="medium"
              type="button"
              disabled={satisfactionDeleteConfirmWord.trim() !== '삭제'}
              onClick={handleConfirmSatisfactionDelete} >
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
              type="button"
              onClick={handleCloseLectureEvalCreateModal}
              disabled={submittingLectureEvalSurvey} >
              {UJAT_LECTURE_EVAL_REGISTER_MODAL_COPY.cancelButton}
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              onClick={() => {
                void handleSubmitLectureEvalRegister()
              }}
              disabled={selectedLectureEvalTemplateId == null || selectedLectureEvalTemplateId === ''}
              loading={submittingLectureEvalSurvey} >
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
            type="button"
            onClick={handleCloseLectureEvalIncompleteModal} >
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
    {programFormEdit != null ? (
      <SurveyTemplateEditModal
        open
        templateId={String(programFormEdit.target.sourceVersionId)}
        programEdit={programFormEdit}
        onBindingsStale={() => void invalidateSurveyCaches()}
        onClose={() => setProgramFormEdit(null)}
        onSaved={newVersionId => {
          const sourceId = String(programFormEdit.target.sourceVersionId)
          setActiveRegisteredSurveyId(prev => (prev === sourceId ? newVersionId : prev))
          setProgramFormEdit(null)
          void invalidateSurveyCaches()
        }}
      />
    ) : null}
    <ProgramDetailSponsorDetailOverlay />
    {displayProgram && recruitmentPreviewTab ? (
      <ParticipantRecruitmentPreviewModal
        open
        onClose={() => setRecruitmentPreviewTab(null)}
        program={displayProgram}
        sponsorName={sponsorName}
        audience={recruitmentPreviewTab === 'recruit_participant' ? 'institutions' : 'volunteers'}
        programKind="ujat"
      />
    ) : null}
    </>
    </RegistrationWizardValidationHighlightProvider>
  )
}
