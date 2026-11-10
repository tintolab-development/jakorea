import { getProgramAssignmentRowClass } from '@/features/program/general/lib/assignment-status-presentation'
import { ProgramAssignmentStatusText } from '@/features/program/shared/ui/program-assignment-status-text'
/**
 * 일반 프로그램 > 진행 현황 > 참여 기관 상세 (풀페이지 인라인)
 * UJAT 참여 기관 상세는 `features/program/ujat/ui/detail-modal/progress/institutions/detail/` — 별도 구현.
 * 탭: 신청 정보 | 학생 명단 | 강사 배정 현황 | 출석 관리 | 게시글
 * 신청 정보 액션: 활동 포기 | 정보 수정 | 코멘트 작성 | 개인정보 상세보기
 */

import type { ReactNode } from 'react'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cacheProjectedProgramPrivacy,
} from '@/features/program/shared/lib/program-my-assignment'
import type { ColumnsType } from 'antd/es/table'
import {
  CmsButton,
  ExcelButton,
  showNotificationResendRequestCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  changeGeneralParticipatingInstitutionSchedules,
  giveUpGeneralParticipatingInstitution,
} from '@/features/program/general/api/admin-program-progress-service'
import { EducationScheduleChangeModal } from '@/features/program/shared/ui/education-schedule-change-modal'
import {
  buildParticipatingInstitutionScheduleChangeLine,
  buildParticipatingInstitutionScheduleChangeRequests,
  formatParticipatingInstitutionScheduleChangePeriod,
  PARTICIPATING_INSTITUTION_SCHEDULE_CHANGE_DESCRIPTION,
  PARTICIPATING_INSTITUTION_SCHEDULE_SELECTED_CONTENT,
  PARTICIPATING_INSTITUTION_SCHEDULE_SELECTED_TITLE,
} from '@/features/program/general/lib/participating-institution-schedule-change'
import { resendGeneralOrganizationApplicationNotification } from '@/features/program/general/api/admin-applications-service'
import { ProgramApprovalStatusDetailValue } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/program-approval-status-detail-value'
import { ApplicantNotificationResendModal } from '@/features/program/shared/ui/detail-modal/components/applicant-notification-resend-modal'
import {
  canResendApplicationResultNotification,
  toApplicantNotificationResendNotifyOptions,
} from '@/features/program/general/lib/applicant-notification-resend'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramInstructorApplications } from '@/features/program/general/hooks/use-program-instructor-applications'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { Program } from '@/types/domain'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  InstructorRoleKey,
} from '../../../model/school-detail-types'
import { INSTRUCTOR_ROLE_LABELS } from '../../../model/school-detail-types'
import type {
  ParticipatingSchoolRow,
  TextbookStatusKey,
} from '@/features/program/general/model/participating-schools'
import { TEXTBOOK_STATUS_OPTION_KEYS } from '@/features/program/general/model/participating-schools'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/features/program/general/model/participating-instructors'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { InstructorListFormInstructor } from '../../../model/school-detail-types'
import {
  getInstructorRowsForSchool,
  getAssignedInstructorDisplayRows,
  getWaitingInstructorRows,
  mergeOrganizationApplicationDetailOntoSchoolDetail,
  readOrganizationTextbookKitFields,
  type WaitingInstructorRowMock,
} from '../../../lib/school-detail'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '../../../lib/waiting-instructor-assignment'
import {
  isWaitingInstructorProgramApproved,
  buildSchoolAddInstructorSessionSlotKey,
  resolveWaitingInstructorFeeGradeLabel,
} from '../../../lib/school-add-instructor-assign'
import {
  displayServerPiiAsIs,
  PrivacyHomeAddressDisplay,
} from '@/features/program/shared/lib/program-pii-display'
import {
  INSTRUCTOR_ASSIGN_SELECT_UNAPPROVED_SINGLE_ONLY_ALERT_MESSAGE,
  PARTICIPATING_INSTITUTION_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { StatusDropdownCell, STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components'
import { StatusTag } from '@/shared/components/status-tag'
import { getInstructorRoleTag, getTextbookStatusTag } from '@/shared/lib/status-tag-specs'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { shouldUseCompanySchoolProgramProgressRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { fetchCompanySchoolAssignmentBoard } from '@/features/program/1c-1s/api/instructor-assignment-conflict-service'
import { fetchGeneralInstructorAssignmentBoard } from '@/features/program/general/api/instructor-assignment-board-service'
import { resolveInstructorAssignmentScheduleId } from '@/features/program/general/lib/resolve-instructor-assignment-schedule-id'
import {
  buildCompanySchoolWaitingInstructorRows,
  buildCompanySchoolAssignedInstructorRows,
} from '@/features/program/1c-1s/lib/build-company-school-assignment-rows'
import {
  getGeneralProgramApiErrorMessage,
  getParticipationConsentRequiredMessage,
} from '@/features/program/general/api/get-general-program-api-error'
import {
  GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
  programHasActiveInstructorRecruitment,
} from '@/features/program/general/lib/general-instructor-recruitment-required'
import { formatInstructorOrganizationScheduleScopeMessage } from '@/features/program/shared/lib/instructor-organization-schedule-scope'
import {
  cancelInstructorAssignmentRemote,
  createInstructorAssignmentRemote,
  putRepresentativeInstructorRemote,
} from '@/features/program/general/api/instructor-assignments-api-client'
import {
  toInstitutionDetailAssignmentCancelRequest,
  toInstructorAssignmentCancelRequest,
} from '@/features/program/general/lib/instructor-cancel-fault-party'
import type { SchoolAddInstructorAssignOption } from '../../../lib/school-add-instructor-assign'
import {
  isOneSchoolPerDayConflictErrorCode,
  ONE_SCHOOL_PER_DAY_CONFLICT_ALERT_MESSAGE,
} from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import { SchoolDetailStudentListSection } from './school-detail-student-list-section'
import { SchoolDetailAttendanceSection } from './school-detail-attendance-section'
import { SchoolDetailAddInstructorAssignModal } from './school-detail-add-instructor-assign-modal'
import { SchoolDetailSelectAssignConfirmModal } from './school-detail-select-assign-confirm-modal'
import { SchoolDetailUnassignCompleteModal } from './school-detail-unassign-complete-modal'
import { SchoolDetailUnassignConfirmModal } from './school-detail-unassign-confirm-modal'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { toScheduledOnlyNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import { SchoolDetailAssignOverflowModal } from './school-detail-assign-overflow-modal'
import { SchoolDetailAssignCompleteModal } from './school-detail-assign-complete-modal'
import { SchoolDetailNewAssignGuideModal } from './school-detail-new-assign-guide-modal'
import { RequestedScheduleConfirmModal } from './requested-schedule-confirm-modal'
import {
  buildRequestedScheduleConfirmOptions,
  hasConfirmedRequestedSchedule,
  shouldShowRequestedScheduleConfirmAction,
} from '@/features/program/general/lib/organization-requested-schedule-confirm'
import { useOrganizationRequestedScheduleConfirmMutation } from '@/features/program/general/hooks/use-organization-schedule-assignment-mutation'
import { SchoolDetailLeadInstructorConfirmModal } from './school-detail-lead-instructor-confirm-modal'
import { InstructorFeeApprovalModal } from '@/features/program/shared/ui/detail-modal/components/instructor-fee-approval-modal'
import type { InstructorFeeApprovalConfirmDetail } from '@/features/program/general/lib/use-instructor-fee-approval-modal'
import {
  INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE,
  isInstructorApplicationFeePolicyRequestValid,
  toInstructorApplicationFeePolicy,
} from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'
import { toInstructorApplicationNotificationRequest } from '@/features/program/general/lib/instructor-application-notification'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import { approveGeneralInstructorApplication } from '@/features/program/general/api/admin-applications-service'
import type { InstructorApplicationFeePolicyRequest } from '@/features/program/general/api/applications-api-client'
import {
  buildInstitutionApproveAssignPlan,
  formatInstitutionApproveAssignFeeSubject,
  summarizeInstitutionApproveAssignSelection,
} from '@/features/program/general/lib/institution-approve-assign-plan'
import { ProgramEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import {
  getProgramProgressDisplayStatus,
  resolveProgramEnrollmentDisplayStatusFromLabel,
} from '@/shared/constants/status'
import { EnrollmentProgramDetailPostsTab } from '@/features/user/detail/ui/enrollment-program-detail-posts-tab'
import { useGeneralProgramPosts } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import {
  InstitutionAddressDetailEdit,
  InstitutionClassAndStudentCountEdit,
  InstitutionEducationFormatRadios,
  InstitutionGradeSelectEdit,
  InstitutionMultilineEdit,
  InstitutionReadonlyInput,
  InstitutionTeacherEdit,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import {
  buildInstitutionClassCountOptions,
  resolveProgramParticipantMaxClassCount,
} from '@/features/template/lib/participant-recruitment-institution-limits'
import { useParticipatingInstitutionDetailEdit } from '@/features/program/general/hooks/use-participating-institution-detail-edit'
import { shouldShowInstitutionApplicationEducationFormatField } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import { isCombinedClassProgramEligible } from '@/features/program/general/lib/combined-class-edit-policy'
import { isGeneralOrganizationProgram } from '@/features/program/general/lib/organization-merge-program-type'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import {
  ensureTextbookNotUsedSelectOption,
  formatParticipatingInstitutionKitQuantity,
} from '@/features/program/general/lib/participating-institution-textbook'
import { buildCombinedClassLeadTeacherCandidatesFromParticipating } from '@/features/program/general/lib/combined-class-lead-teacher'
import { COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT } from '@/features/program/general/lib/combined-class-copy'
import { useCombinedClassProcess } from '@/features/program/general/hooks/use-combined-class-process'
import {
  buildProgramApiUnavailableSaveContent,
  notifyProgramApiUnavailable,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
import { shouldUseOrganizationApplicationRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  listAdminCommentsByTargetRemote,
  resolveLatestAdminCommentText,
  upsertAdminCommentByTargetRemote,
} from '@/features/program/general/api/admin-comments-api-client'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  fetchOrganizationApplicationDetailRemote,
  unmaskOrganizationApplicationPrivacyRemote,
} from '@/features/program/general/api/applications-api-client'
import { fetchMemberRolePrivacyUnmask } from '@/features/user/api/member-privacy-unmask'
import { EDIT_MODE_REVEAL, type PrivacyRevealOptions } from '@/shared/lib/privacy-unmask-purpose'
import { saveOrganizationCombinedClassRemote } from '@/features/program/general/api/organization-merge-groups-service'
import { resolveOrganizationMergeErrorMessage } from '@/features/program/general/lib/organization-merge-error-message'
import { useOrganizationMergeGroups } from '@/features/program/general/hooks/use-organization-merge-groups'
import { shouldUseOrganizationMergeGroupsRemoteApi } from '@/features/program/general/api/organization-merge-groups-remote-capabilities'
import { MESSAGES } from '@/shared/constants/messages'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import type { OrganizationApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse'
import { formatParticipatingCombinedClassDisplay } from '@/features/program/general/lib/participating-institution-detail-edit'
import { InstitutionCombinedClassEditCell } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-combined-class-edit-cell'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
  renderProgramDetailPipeSeparated,
  renderDetailInfoPipeSeparated,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { formatClassStudentCountSegments } from '@/features/program/general/lib/detail-value-helpers'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import './participating-institutions-section.css'
import { ParticipatingInstitutionApplicationInfo } from './participating-institution-application-info'
import {
  getParticipatingInstitutionActivityWithdrawScheduleOptions,
  resolveParticipatingInstitutionActivityWithdrawPatch,
  resolveParticipatingInstitutionActivityWithdrawStopScheduleId,
} from '@/features/program/general/lib/participating-institution-activity-withdraw'
import {
  buildParticipatingSchoolPreferredScheduleLines,
  resolveParticipatingInstitutionScheduleRowLabel,
} from '@/features/program/general/lib/participating-school-session-display'
import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import { fetchOrganizationScheduleAssignmentsRemote } from '@/features/program/general/api/organization-schedule-assignments-api-client'
import { mapStoredPeriodRequestedSchedulesToHopeSessions } from '@/features/program/general/api/adapters/general-applications-adapters'
import { organizationRequestedSchedulesQueryOptions } from '@/features/program/general/api/organization-requested-schedules-query'
import {
  ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE,
  resolveOrganizationInstructorAssignmentScheduleTarget,
} from '@/features/program/general/lib/organization-instructor-assignable-schedule'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import {
  mapOrganizationScheduleAssignmentSlotsToAssignedSessions,
  organizationScheduleAssignmentsQueryKey,
  resolveParticipatingInstitutionApplicationScheduleSessions,
  resolveParticipatingSchoolHopeSessions,
} from '@/features/program/general/lib/organization-education-schedule-sources'
import {
  ActivityWithdrawScheduleModal,
  type ActivityWithdrawScheduleModalPayload,
} from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import './school-detail-fullpage-view.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'

import {
  GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS,
  getGeneralParticipatingInstitutionDetailTabKeys,
  normalizeParticipatingInstitutionDetailTab,
  type GeneralParticipatingInstitutionDetailTabKey,
  type ParticipatingInstitutionDetailTabKey,
} from '../../../lib/participating-institution-detail-tabs'
import type { GeneralProgramNavigationCapabilities } from '../../../hooks/use-general-program-navigation'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { TrainedTeachersParticipatingInstitutionDetailView } from '@/features/program/trained-teachers/ui/institution-detail/participating-institution-detail-view'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

export {
  GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS,
  normalizeParticipatingInstitutionDetailTab as normalizeGeneralParticipatingInstitutionDetailTab,
  normalizeParticipatingInstitutionDetailTab,
  type GeneralParticipatingInstitutionDetailTabKey,
  type ParticipatingInstitutionDetailTabKey,
}

/** @deprecated 일반 참여 기관 상세와 동일 — URL 파라미터 호환용 */
export const SCHOOL_DETAIL_TAB_KEYS = GENERAL_PARTICIPATING_INSTITUTION_DETAIL_TAB_KEYS
export type SchoolDetailTabKey = ParticipatingInstitutionDetailTabKey

export const SCHOOL_DETAIL_DISABLED_TAB_KEYS: readonly SchoolDetailTabKey[] = []

export function normalizeSchoolDetailTab(
  tab: SchoolDetailTabKey,
  program?: Program | null
): SchoolDetailTabKey {
  return normalizeParticipatingInstitutionDetailTab(tab, program)
}

function isSchoolDetailTabDisabled(key: SchoolDetailTabKey): boolean {
  return SCHOOL_DETAIL_DISABLED_TAB_KEYS.includes(key)
}

const SCHOOL_DETAIL_TAB_LABELS: Record<GeneralParticipatingInstitutionDetailTabKey, string> = {
  application: '신청 정보',
  students: '학생 명단',
  instructors: '강사 배정 현황',
  attendance: '출석 관리',
  posts: '게시글',
}

export type GeneralParticipatingInstitutionDetailViewProps = SchoolDetailFullpageViewProps

/** 배정된 강사 테이블용 행 (표시용 확장 필드 포함) */
interface AssignedInstructorDisplayRow extends SchoolDetailInstructorRow {
  no: number
  homeAddress?: string
  distanceToSchool?: string
  assignedDate?: string
  assignedTime?: string
  assignedSession?: string
  assignedScheduleLine?: string
  assignmentId?: string
  instructorMemberId?: string
  scheduleId?: string
  /** 1사1교 — 취소된 배정(「배정 취소」 표시, 선택·역할 변경·재배정 불가) */
  assignmentCancelled?: boolean
}

type WaitingInstructorRow = WaitingInstructorRowMock & {
  /** 일반 기관형 — 프로그램 신청 승인 전 강사(배정 시 「승인 및 배정」) */
  programApprovalPending?: boolean
  /** 승인 전 강사 신청의 강사비 등급 스냅샷 — 강사비 책정(프로그램 기준) 자동 선택용 */
  instructorFeeGradeLabel?: string
}

/** 필요 배정 인원(분모) — program detail participantRecruitmentInfo.maxAssignableInstructors SSOT */
function resolveRequiredInstructorCount(program: Program): number {
  const fromRecruitment =
    program.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors
  if (typeof fromRecruitment === 'number' && fromRecruitment > 0) return fromRecruitment
  return 2
}
function getWaitingInstructorRowInstructorId(row: WaitingInstructorRow): string {
  return row.instructorId ?? row.id
}

function renderWaitingInstructorTableEmpty(withDescription = false) {
  return (
    <div className="school-detail-fullpage-view__waiting-table-empty" role="status">
      {withDescription ? (
        <div className="school-detail-fullpage-view__table-empty-stack">
          <span>배정 대기 중인 강사가 없습니다.</span>
          <span className="school-detail-fullpage-view__table-empty-desc">
            강사가 해당 기관에 신청하면 이곳에 목록이 표시됩니다.
          </span>
        </div>
      ) : (
        '배정 대기 중인 강사가 없습니다.'
      )}
    </div>
  )
}

/** td 내 세로 디바이더 — 1×13px, default-BK @ 50%, 양옆 gap 12px */
function TdDivider() {
  return <span className="school-detail-fullpage-view__td-divider" aria-hidden />
}

/** 세그먼트 배열을 디바이더로 이어서 반환 */
function withTdDivider(segments: ReactNode[]) {
  return (
    <>
      {segments.reduce<ReactNode[]>((acc, seg, i) => {
        if (i > 0) acc.push(<TdDivider key={`d-${i}`} />)
        acc.push(<span key={i}>{seg}</span>)
        return acc
      }, [])}
    </>
  )
}

function buildCombinedClassViewValue(
  detail: SchoolDetailForModal,
  programEligible = true
): ReactNode {
  if (!programEligible) return '해당 없음'
  const display = formatParticipatingCombinedClassDisplay(detail)
  if (display === '미신청') return display
  const parts = display
    .split(' | ')
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length <= 1) return parts[0] ?? display
  return (
    <ProgramDetailTdSegmentWrap>{withProgramDetailTdDivider(parts)}</ProgramDetailTdSegmentWrap>
  )
}

function formatAssignedInstructorScheduleExport(row: AssignedInstructorDisplayRow): string {
  if (row.assignedScheduleLine) return row.assignedScheduleLine
  const date = row.assignedDate ?? '-'
  const time = row.assignedTime ?? '-'
  if (date === '-' && time === '-') return '-'
  const dateTime = date !== '-' && time !== '-' ? `${date} ${time}` : date !== '-' ? date : time
  if (row.assignedSession) return `${dateTime} | ${row.assignedSession}`
  return dateTime
}

function buildAssignedScheduleLineFromSessionIds(
  schoolId: string,
  sessions: ParticipatingSchoolRow['sessions'],
  sessionIds: string[] | undefined
): string | undefined {
  if (!sessions?.length || !sessionIds?.length) return undefined
  const selectedSessionIds = new Set(sessionIds)
  const selectedSessions = sessions.filter(session =>
    selectedSessionIds.has(buildSchoolAddInstructorSessionSlotKey(schoolId, session))
  )
  return buildParticipatingSchoolPreferredScheduleLines(selectedSessions)[0]
}

function renderAssignedInstructorTableEmpty(withDescription = false) {
  return (
    <div className="school-detail-fullpage-view__waiting-table-empty" role="status">
      {withDescription ? (
        <div className="school-detail-fullpage-view__table-empty-stack">
          <span>배정된 강사가 없습니다.</span>
          <span className="school-detail-fullpage-view__table-empty-desc">
            강사가 배정되면 이곳에 목록이 표시됩니다.
          </span>
        </div>
      ) : (
        '배정된 강사가 없습니다.'
      )}
    </div>
  )
}

function formatWaitingInstructorHopeScheduleExport(row: WaitingInstructorRow): string {
  if (row.hopeScheduleLine) return row.hopeScheduleLine
  const date = row.hopeDate ?? '-'
  const time = row.hopeTime ?? '-'
  const session = row.hopeSession
  if (date === '-' && time === '-') return '-'
  const dateTime = date !== '-' && time !== '-' ? `${date} ${time}` : date !== '-' ? date : time
  if (!session) return dateTime
  return `${dateTime} | ${session}`
}

/** 시안 05-1 — 일반 기관형 학생 추가 등록 팝업 설명 */
const GENERAL_INSTITUTION_ADD_STUDENT_DESCRIPTION =
  '프로그램에 추가로 참여할 학생의 정보를 입력해 주세요.\n해당 학생의 초상권 동의서는 담당 교사에게 별도 요청이 필요합니다.'

/** 시안 15 — 대표 강사 → 일반 강사 직접 전환 차단 안내 (일반 기관형) */
const LEAD_INSTRUCTOR_TYPE_CHANGE_BLOCKED_TITLE = '강사 유형 변경 불가 안내'
const LEAD_INSTRUCTOR_TYPE_CHANGE_BLOCKED_CONTENT =
  '대표 강사는 반드시 1명이 지정되어야 합니다.\n변경하시려면 다른 구성원을 대표 강사로 지정해 주세요.\n기존의 대표 강사는 자동으로 일반 강사로 전환됩니다.'

const APPLICATION_INFO_EDIT_UNMASK_REASON = '신청 정보 수정'

const APPLICATION_INFO_EDIT_UNMASK_CONFIRM_CONTENT =
  "정보 수정 시 개인정보 마스킹이 해제되며,\n개인정보 열람 사유는 '정보 수정'으로 로그 이력에 기록됩니다.\n해당 기관의 개인정보 열람 및 정보를 수정하시겠습니까?"

const APPLICATION_INFO_EDIT_UNMASK_MODAL_Z_INDEX = 1100

function isOrganizationApplicationDetailPayload(
  payload: unknown
): payload is OrganizationApplicationDetailResponse {
  if (payload == null || typeof payload !== 'object') return false
  return (
    'teacherName' in payload ||
    'teacherTel' in payload ||
    'organizationName' in payload ||
    'organizationAddress' in payload ||
    'organizationAddressDetail' in payload ||
    'privacyMaskingLevel' in payload ||
    'requestedGrade' in payload ||
    'applicationStatus' in payload
  )
}

export interface SchoolDetailFullpageViewProps {
  program: Program
  detail: SchoolDetailForModal
  row: ParticipatingSchoolRow
  navigationCapabilities?: GeneralProgramNavigationCapabilities
  navigationCapabilitiesLoading?: boolean
  /** 합반 대상 lookup — 동일 프로그램 참여 기관 전체 목록 */
  participatingSchoolList?: ParticipatingSchoolRow[]
  /** URL 쿼리 파라미터와 연동 시 활성 탭 (제공 시 controlled) */
  activeTab?: SchoolDetailTabKey
  /** 탭 변경 시 호출 (쿼리 파라미터 갱신용) */
  onTabChange?: (key: SchoolDetailTabKey) => void
  onClearSchoolId: () => void
  onSaveBasicInfo?: (patch: Partial<SchoolDetailForModal> & { id: string }) => void
  combinedClassReadOnly?: boolean
  onSaveInstructorInfo?: (schoolId: string, instructors: InstructorListFormInstructor[]) => void
  savedBasicPatches?: Record<string, Partial<SchoolDetailForModal>>
  savedInstructorPatches?: Record<string, InstructorListFormInstructor[]>
  instructorList: ParticipatingInstructorRow[]
  /** 승인 취소 버튼 클릭 후 컨펌 시 호출 (프로그램 승인 현황 → 승인 취소) */
  onCancelApproval?: (schoolId: string) => void
  /** 신청 정보 탭 교재 현황 태그 클릭 시 상태 변경 (참여 기관 목록·mock과 동기화) */
  onTextbookStatusChange?: (schoolId: string, status: TextbookStatusKey) => void
  // TODO(api): 학교 중첩 상세 mutation 잔여 —
  // application 편집·students·instructors 배정은 BE PATCH/assignment 계약 후.
  // attendance: progress 탭은 dashboard schedules hybrid. 기관 상세 attendance는 세션 mock+schedule GET 재사용 예정.
  // posts: EnrollmentProgramDetailPostsTab + createGeneralProgramPost (invalidate는 부모에서 연결).
}

export function GeneralParticipatingInstitutionDetailView(props: SchoolDetailFullpageViewProps) {
  if (isTrainedTeachersDetailProgram(props.program)) {
    return <TrainedTeachersParticipatingInstitutionDetailView {...props} />
  }
  return <InstitutionDetailViewBody {...props} />
}

/** 일반·1사1교 참여 기관 상세 본문 — 훅은 유형 분기(early return) 뒤가 아니라 이 컴포넌트에서만 호출한다 */
function InstitutionDetailViewBody(props: SchoolDetailFullpageViewProps) {
  const {
    program,
    detail,
    row,
    navigationCapabilities,
    participatingSchoolList = [],
    activeTab: activeTabFromUrl,
    onTabChange,
    onClearSchoolId: _onClearSchoolId,
    onSaveBasicInfo,
    combinedClassReadOnly = false,
    onSaveInstructorInfo,
    savedBasicPatches = {},
    savedInstructorPatches = {},
    instructorList,
    onCancelApproval: _onCancelApproval,
    onTextbookStatusChange,
  } = props

  const currentUser = useAuthStore(state => state.user)
  const showAdminCommentSection = isCmsAdminUser(currentUser)
  const { showAlert } = useCmsAlert()
  const [internalTab, setInternalTab] = useState<SchoolDetailTabKey>('application')
  const visibleDetailTabs = useMemo(
    () =>
      getGeneralParticipatingInstitutionDetailTabKeys(
        program,
        navigationCapabilities?.studentRosterEnabled
      ),
    [navigationCapabilities?.studentRosterEnabled, program]
  )
  const normalizedActiveTab = normalizeSchoolDetailTab(
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab,
    program
  )
  const activeTab = visibleDetailTabs.includes(
    normalizedActiveTab as GeneralParticipatingInstitutionDetailTabKey
  )
    ? normalizedActiveTab
    : 'application'
  const setActiveTab = (key: SchoolDetailTabKey) => {
    if (onTabChange) onTabChange(key)
    else setInternalTab(key)
  }
  const [selectedAssignedKeys, setSelectedAssignedKeys] = useState<React.Key[]>([])
  const [selectedWaitingKeys, setSelectedWaitingKeys] = useState<React.Key[]>([])
  const [completedWaitingRowKeys, setCompletedWaitingRowKeys] = useState<Set<string>>(
    () => new Set()
  )
  const [disabledWaitingInstructorIds, setDisabledWaitingInstructorIds] = useState<Set<string>>(
    () => new Set()
  )
  const [assignedScheduleLinesByInstructorId, setAssignedScheduleLinesByInstructorId] = useState<
    Record<string, string>
  >({})
  const [addAssignModalOpen, setAddAssignModalOpen] = useState(false)
  const [addAssignOverflowOpen, setAddAssignOverflowOpen] = useState(false)
  const [addModalOpenedFromOverflow, setAddModalOpenedFromOverflow] = useState(false)
  const [selectAssignConfirmOpen, setSelectAssignConfirmOpen] = useState(false)
  const pendingAssignNotifyRef = useRef<PermissionModalPayload | null>(null)
  const [addAssignNotifyOpen, setAddAssignNotifyOpen] = useState(false)
  const [addAssignNotifyInstructorName, setAddAssignNotifyInstructorName] = useState('')
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const assignInFlightRef = useRef(false)
  const pendingAddAssignRef = useRef<{
    role: InstructorRoleKey
    option: SchoolAddInstructorAssignOption
    meta?: { isNewApproval?: boolean; sessionIds?: string[] }
  } | null>(null)
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false)
  const [unassignSubmitting, setUnassignSubmitting] = useState(false)
  const [unassignCompleteModal, setUnassignCompleteModal] = useState<{
    instructorNames: string[]
    targetNames: string[]
    reason: string
  } | null>(null)
  const [selectAssignOverflowOpen, setSelectAssignOverflowOpen] = useState(false)
  /** 일반 기관형 「승인 및 배정」 — guide(09-2·11-2) → fee(11-3) → (인원 초과 시) overflow */
  const [approveAssignStep, setApproveAssignStep] = useState<'guide' | 'fee' | 'overflow' | null>(
    null
  )
  const [approveAssignFeePolicyError, setApproveAssignFeePolicyError] = useState<string | null>(null)
  const pendingApproveAssignDetailRef = useRef<InstructorFeeApprovalConfirmDetail | null>(null)
  const [selectAssignNewGuideOpen, setSelectAssignNewGuideOpen] = useState(false)
  const [selectAssignFeeApprovalOpen, setSelectAssignFeeApprovalOpen] = useState(false)
  const [selectAssignPendingInstructor, setSelectAssignPendingInstructor] = useState<{
    id: string
    name: string
    instructorFeeGradeLabel?: string
  } | null>(null)
  const [assignCompleteModal, setAssignCompleteModal] = useState<{
    instructorName: string
    schoolName: string
    currentCount: number
    showApprovalAlarmSection: boolean
  } | null>(null)
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null)
  // 권한 설정 V1.2 프로그램 권한 '대표 강사 변경': Program Owner·Assistant만. Program Viewer는 역할 드롭다운을 열지 않는다.
  const [leadRoleChangeConfirm, setLeadRoleChangeConfirm] = useState<{
    instructorId: string
    newLeadInstructorName: string
  } | null>(null)
  const [textbookStatusDropdownOpen, setTextbookStatusDropdownOpen] = useState(false)
  const [postWriteModalOpen, setPostWriteModalOpen] = useState(false)
  const {
    posts: remotePosts,
    files: remotePostFiles,
    isRemoteDataSource: postsRemote,
    invalidatePosts,
    removeDeletedPost,
  } = useGeneralProgramPosts(program.id)
  const postsForTab = useMemo(() => (postsRemote ? remotePosts : null), [postsRemote, remotePosts])
  const filesForTab = useMemo(
    () => (postsRemote ? remotePostFiles : null),
    [postsRemote, remotePostFiles]
  )
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [activityWithdrawSubmitting, setActivityWithdrawSubmitting] = useState(false)
  const [notificationResendOpen, setNotificationResendOpen] = useState(false)
  const [notificationResendSubmitting, setNotificationResendSubmitting] = useState(false)
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()
  /**
   * CMS-29: 원문(unmask) 교사 연락처는 이 화면의 일시 오버레이로만 둔다 — 부모 savedBasicPatches에 올리지 않는다.
   * 열람 해제 경로마다 훅의 onRemask로 같은 이벤트 안에서 지운다(렌더 뒤 fallback 정리 없음).
   */
  const [teacherPrivacyOverlay, setTeacherPrivacyOverlay] = useState<{
    id: string
    patch: Partial<SchoolDetailForModal>
  } | null>(null)
  const clearTeacherPrivacyOverlay = useCallback(() => setTeacherPrivacyOverlay(null), [])

  useEffect(() => {
    setTextbookStatusDropdownOpen(false)
    setSelectedAssignedKeys([])
    setSelectedWaitingKeys([])
    setCompletedWaitingRowKeys(new Set())
    setDisabledWaitingInstructorIds(new Set())
    setAssignedScheduleLinesByInstructorId({})
  }, [detail.id])

  useEffect(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setActivityWithdrawModalOpen(false)
  }, [detail.id, detail.adminComment, savedBasicPatches[detail.id]?.adminComment])

  const organizationApplicationId = Number(row.organizationApplicationId)
  const hasOrganizationApplicationId = Number.isFinite(organizationApplicationId)
  const adminCommentQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.commentsByTarget(
      'ORGANIZATION_APPLICATION',
      hasOrganizationApplicationId ? String(organizationApplicationId) : ''
    ),
    queryFn: () =>
      listAdminCommentsByTargetRemote({
        targetType: 'ORGANIZATION_APPLICATION',
        targetId: organizationApplicationId,
        screenCode: 'ORGANIZATION_APPLICATION',
      }),
    enabled:
      showAdminCommentSection &&
      shouldUseOrganizationApplicationRemoteApi() &&
      hasOrganizationApplicationId,
    staleTime: 30_000,
  })
  const remoteAdminComment = resolveLatestAdminCommentText(adminCommentQuery.data)
  const programId = String(program.id)
  const organizationApplicationIdForDetail = row.organizationApplicationId?.trim() ?? ''
  const organizationDetailQuery = useQuery({
    queryKey: generalApplicationsQueryKeys.organizationDetailInProgram(
      programId,
      organizationApplicationIdForDetail
    ),
    queryFn: () => fetchOrganizationApplicationDetailRemote(organizationApplicationIdForDetail),
    enabled:
      activeTab === 'application' &&
      shouldUseOrganizationApplicationRemoteApi() &&
      organizationApplicationIdForDetail.length > 0,
    staleTime: 30_000,
  })
  const organizationKitFields = organizationDetailQuery.data
    ? readOrganizationTextbookKitFields(organizationDetailQuery.data)
    : undefined
  const mergedDetail = {
    ...(organizationDetailQuery.data
      ? mergeOrganizationApplicationDetailOntoSchoolDetail(detail, organizationDetailQuery.data)
      : detail),
    ...(adminCommentQuery.data ? { adminComment: remoteAdminComment } : {}),
    ...savedBasicPatches[detail.id],
    ...(teacherPrivacyOverlay?.id === detail.id ? teacherPrivacyOverlay.patch : {}),
    ...(organizationKitFields ?? {}),
  }
  const participantSessions = row.sessions ?? []
  const isActivityWithdrawn = mergedDetail.activityWithdrawn === true
  const availableActions = mergedDetail.availableActions ?? row.availableActions
  const applicationApprovalStatus = mergedDetail.approvalStatus ?? row.approvalStatus
  const applicationResultNotificationActions =
    organizationDetailQuery.data?.availableActions ?? availableActions
  const canResendApplicationNotification =
    organizationApplicationIdForDetail.length > 0 &&
    canResendApplicationResultNotification({
      approvalStatus: applicationApprovalStatus,
      availableActions: applicationResultNotificationActions,
    })
  const canRequestActivityWithdraw =
    !isActivityWithdrawn && (availableActions == null || availableActions.includes('GIVE_UP'))
  const showActivityWithdrawButton =
    isActivityWithdrawn || availableActions == null || availableActions.includes('GIVE_UP')
  const isCompanySchool = isCompanySchoolProgram(program)
  const isGeneralOrgProgram = isGeneralOrganizationProgram(program)
  const requiredInstructorCount = resolveRequiredInstructorCount(program)
  const progressRemoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)

  const organizationScheduleAssignmentsEnabled =
    isGeneralOrgProgram &&
    organizationApplicationIdForDetail.length > 0 &&
    shouldUseOrganizationApplicationRemoteApi()

  const organizationScheduleAssignmentsQuery = useQuery({
    queryKey: organizationScheduleAssignmentsQueryKey(
      programId,
      organizationApplicationIdForDetail || '__none__'
    ),
    queryFn: () =>
      fetchOrganizationScheduleAssignmentsRemote(programId, organizationApplicationIdForDetail),
    enabled: organizationScheduleAssignmentsEnabled,
    staleTime: 15_000,
    retry: false,
  })

  const programSchedulesForOsaQuery = useQuery({
    queryKey: generalProgramQueryKeys.schedules(programId),
    queryFn: () => fetchAdminProgramSchedulesRemote(programId),
    enabled: organizationScheduleAssignmentsEnabled,
    staleTime: 60_000,
    retry: false,
  })

  const assignedEducationSessions = useMemo(() => {
    if (!isGeneralOrgProgram) return []
    const slots = organizationScheduleAssignmentsQuery.data
    if (!slots?.length) return []
    if (!organizationApplicationIdForDetail) return []
    return mapOrganizationScheduleAssignmentSlotsToAssignedSessions(
      slots,
      programSchedulesForOsaQuery.data ?? [],
      {
        programId,
        organizationApplicationId: organizationApplicationIdForDetail,
      }
    )
  }, [
    isGeneralOrgProgram,
    organizationApplicationIdForDetail,
    organizationScheduleAssignmentsQuery.data,
    programId,
    programSchedulesForOsaQuery.data,
  ])

  const requestedHopeSchedulesQuery = useQuery({
    ...organizationRequestedSchedulesQueryOptions(organizationApplicationIdForDetail),
    enabled: isGeneralOrgProgram && organizationApplicationIdForDetail.length > 0,
  })

  const hopeEducationSessions = useMemo(() => {
    if (isGeneralOrgProgram) {
      const storedPeriodHopes = mapStoredPeriodRequestedSchedulesToHopeSessions(
        requestedHopeSchedulesQuery.data
      )
      if (storedPeriodHopes.length > 0) return storedPeriodHopes
    }
    return resolveParticipatingSchoolHopeSessions(row, {
      programId,
      organizationApplicationId: organizationApplicationIdForDetail,
    })
  }, [
    isGeneralOrgProgram,
    organizationApplicationIdForDetail,
    programId,
    requestedHopeSchedulesQuery.data,
    row,
  ])

  const assignmentsQuerySettled =
    !organizationScheduleAssignmentsEnabled ||
    organizationScheduleAssignmentsQuery.isFetched ||
    organizationScheduleAssignmentsQuery.isError

  const applicationTabScheduleSessions = useMemo(() => {
    return resolveParticipatingInstitutionApplicationScheduleSessions({
      isCompanySchool,
      isGeneralOrganization: isGeneralOrgProgram,
      assignedSessions: assignmentsQuerySettled ? assignedEducationSessions : [],
      participantSessions: assignmentsQuerySettled ? participantSessions : [],
      hopeSessions: hopeEducationSessions,
    })
  }, [
    assignedEducationSessions,
    assignmentsQuerySettled,
    hopeEducationSessions,
    isCompanySchool,
    isGeneralOrgProgram,
    participantSessions,
  ])

  const applicationTabScheduleEmptyMessage = useMemo(() => {
    if (!isGeneralOrgProgram) return '등록된 교육 일정이 없습니다.'
    if (organizationScheduleAssignmentsEnabled && organizationScheduleAssignmentsQuery.isLoading) {
      return '배정된 교육 일정을 불러오는 중입니다.'
    }
    if (
      organizationScheduleAssignmentsQuery.isError &&
      assignedEducationSessions.length === 0 &&
      participantSessions.length === 0
    ) {
      return '배정된 교육 일정을 불러오지 못했습니다.'
    }
    return '등록된 교육 일정이 없습니다.'
  }, [
    assignedEducationSessions.length,
    isGeneralOrgProgram,
    organizationScheduleAssignmentsEnabled,
    organizationScheduleAssignmentsQuery.isError,
    organizationScheduleAssignmentsQuery.isLoading,
    participantSessions.length,
  ])

  const instructorAssignScheduleSessions = useMemo(() => {
    if (isGeneralOrgProgram && assignedEducationSessions.length > 0) {
      return assignedEducationSessions
    }
    return participantSessions
  }, [assignedEducationSessions, isGeneralOrgProgram, participantSessions])
  const companySchoolAssignmentConflictsEnabled =
    isCompanySchool && shouldUseCompanySchoolProgramProgressRemoteApi()
  /** 1사1교 conflicts ON 또는 일반 progress remote ON */
  const assignmentBoardRemoteEnabled =
    activeTab === 'instructors' &&
    (companySchoolAssignmentConflictsEnabled || (!isCompanySchool && progressRemoteEnabled))

  const occupiedLectureDatesQuery = useQuery({
    queryKey: isCompanySchool
      ? companySchoolQueryKeys.instructorAssignmentConflicts(programId)
      : generalProgramProgressQueryKeys.instructorAssignments(programId),
    queryFn: () =>
      isCompanySchool
        ? fetchCompanySchoolAssignmentBoard(programId)
        : fetchGeneralInstructorAssignmentBoard(programId),
    enabled: assignmentBoardRemoteEnabled,
    staleTime: 30_000,
  })
  const instructorApplications = useProgramInstructorApplications(
    programId,
    activeTab === 'instructors'
  )
  const assignmentBoard = occupiedLectureDatesQuery.data
  const occupiedLectureDatesByInstructorId = assignmentBoard?.occupiedLectureDatesByInstructorId
  const queryClient = useQueryClient()

  const invalidateAssignmentBoard = useCallback(async () => {
    if (isCompanySchool) {
      await queryClient.invalidateQueries({
        queryKey: companySchoolQueryKeys.instructorAssignmentConflicts(programId),
      })
      return
    }
    await queryClient.invalidateQueries({
      queryKey: generalProgramProgressQueryKeys.instructorAssignments(programId),
    })
  }, [isCompanySchool, programId, queryClient])

  /** 일반 기관 · 기간 지정 — 승인 후 희망 일정 확정(PUT requestedScheduleIds). 확정 전에는 강사 배정 불가 */
  const requestedScheduleConfirmOptions = useMemo(
    () => buildRequestedScheduleConfirmOptions(requestedHopeSchedulesQuery.data),
    [requestedHopeSchedulesQuery.data]
  )
  const showRequestedScheduleConfirmAction = shouldShowRequestedScheduleConfirmAction({
    isGeneralOrganization: isGeneralOrgProgram,
    isCompanySchool,
    educationScheduleMode: program.generalCommonInfo?.educationScheduleMode,
    options: requestedScheduleConfirmOptions,
  })
  const requestedScheduleAlreadyConfirmed = hasConfirmedRequestedSchedule(
    requestedScheduleConfirmOptions
  )
  const [requestedScheduleConfirmOpen, setRequestedScheduleConfirmOpen] = useState(false)
  const requestedScheduleConfirmMutation = useOrganizationRequestedScheduleConfirmMutation(
    programId,
    organizationApplicationIdForDetail,
    { onSettledRefresh: invalidateAssignmentBoard }
  )

  const addAssignInstructorOptions = useMemo((): SchoolAddInstructorAssignOption[] | undefined => {
    if (!assignmentBoardRemoteEnabled || !assignmentBoard) return undefined
    const assignedNames = new Set(
      (assignmentBoard.assignments ?? [])
        .filter(a => {
          if (a.organizationApplicationId == null || !row.organizationApplicationId) return false
          return String(a.organizationApplicationId) === String(row.organizationApplicationId)
        })
        .map(a => a.instructorName?.trim())
        .filter((name): name is string => Boolean(name))
    )
    return assignmentBoard.approvedInstructorApplications
      .filter(app => {
        if (app.instructorMemberId == null) return false
        const name = app.instructorName?.trim()
        if (!name || assignedNames.has(name)) return false
        return true
      })
      .map(app => ({
        value: String(app.instructorMemberId),
        label: app.instructorName?.trim() || '이름 없음',
        initialApproval: true,
      }))
  }, [assignmentBoard, assignmentBoardRemoteEnabled, row.organizationApplicationId])

  const activityWithdrawScheduleOptions = useMemo(
    () => getParticipatingInstitutionActivityWithdrawScheduleOptions(program, participantSessions),
    [program, participantSessions]
  )

  const mergeGroupsAllowed = isGeneralOrganizationProgram(program)
  const mergeGroupsQuery = useOrganizationMergeGroups(
    programId,
    program.backendProgramType,
    mergeGroupsAllowed && shouldUseOrganizationMergeGroupsRemoteApi()
  )

  /** 열람 해제 함수(아래 usePersonalInfoReveal)를 저장 콜백에서 동기 호출하기 위한 참조 */
  const remaskAfterSaveRef = useRef<() => void>(() => {})
  /**
   * 신청 정보 저장 성공 — 로컬 패치(연락처 원문 제외) 반영과 같은 동기 블록에서 원문 열람을 끝낸다.
   * 저장 Promise 이후(.then) 정리하면 그 사이 렌더에 원문 오버레이가 보인다.
   */
  const handleApplicationInfoSaved = useCallback(
    (patch: Partial<SchoolDetailForModal> & { id: string }) => {
      onSaveBasicInfo?.(patch)
      remaskAfterSaveRef.current()
    },
    [onSaveBasicInfo]
  )

  const applicationInfoEdit = useParticipatingInstitutionDetailEdit({
    detail: mergedDetail,
    row,
    program,
    participatingSchoolList,
    onSaveBasicInfo: handleApplicationInfoSaved,
    combinedClassReadOnly,
  })

  const {
    isEditing: isApplicationInfoEditing,
    draft: applicationInfoDraft,
    textbookOptions,
    textbookDisplay,
    canEditTextbook,
    sameSchoolGradeOptions,
    teacherOptions,
    isTeacherOptionsLoading,
    isCombinedClassProgramEligible: isCombinedClassProgramEligibleFlag,
    isCombinedClassApplyRadioDisabled,
    enterEdit: enterApplicationInfoEdit,
    cancelEdit: cancelApplicationInfoEdit,
    saveEdit: saveApplicationInfoEdit,
    updateDraft: updateApplicationInfoDraft,
  } = applicationInfoEdit

  const combinedClassProcess = useCombinedClassProcess({
    active:
      isApplicationInfoEditing && isCombinedClassProgramEligibleFlag && !combinedClassReadOnly,
    resetKey: detail.id,
    schoolName: mergedDetail.schoolName ?? row.schoolName ?? '',
    leadGrade: row.educationGrade ?? mergedDetail.educationGrade ?? '',
    committedApplication: mergedDetail.combinedClassApplication === '신청' ? '신청' : '미신청',
    committedPartnerIds: mergedDetail.combinedClassPartnerSchoolIds ?? [],
    partnerOptions: sameSchoolGradeOptions,
    applySelection: next => {
      updateApplicationInfoDraft({
        combinedClassApplication: next.application,
        combinedClassPartnerSchoolIds: next.partnerIds,
      })
    },
    buildCandidates: partnerIds =>
      buildCombinedClassLeadTeacherCandidatesFromParticipating(
        mergedDetail,
        row,
        participatingSchoolList.filter(item => partnerIds.includes(item.id))
      ),
    onProcess: async ({ partnerIds, leadTeacherMemberId }) => {
      if (
        !mergeGroupsAllowed ||
        !shouldUseOrganizationMergeGroupsRemoteApi() ||
        !progressRemoteEnabled
      ) {
        notifyProgramApiUnavailable(
          'general-org-merge-lead-teacher-progress',
          '일반 프로그램 · 합반 담당 교사 지정'
        )
        return false
      }
      try {
        const saved = await saveOrganizationCombinedClassRemote({
          programId,
          programType: program.backendProgramType,
          leadRow: row,
          allRows: participatingSchoolList,
          combinedClassApplication: '신청',
          partnerRowIds: partnerIds,
          existingMergeGroups: mergeGroupsQuery.data,
          leadTeacherMemberId,
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.mergeGroups(programId),
        })
        return saved?.id ?? true
      } catch (error) {
        const responseData = axios.isAxiosError(error) ? error.response?.data : undefined
        const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined
        void showAlert({
          title: '처리 실패',
          content: axios.isAxiosError(error)
            ? resolveOrganizationMergeErrorMessage(responseData, {
                httpStatus,
                fallback: '합반 담당 교사를 지정하지 못했습니다. 다시 시도해 주세요.',
              })
            : error instanceof Error && error.message.trim()
              ? error.message
              : '합반 담당 교사를 지정하지 못했습니다. 다시 시도해 주세요.',
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.mergeGroups(programId),
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.institutions(programId),
        })
        updateApplicationInfoDraft({
          combinedClassApplication: '신청',
          combinedClassPartnerSchoolIds: partnerIds,
        })
        return false
      }
    },
  })

  /**
   * 일반 기관형 — 신청 정보 수정 모드 「교육 진행 일정 변경」(시안 01-2·02-1·02-2).
   * 팝업 「선택 완료」는 변경 일정만 보관하고, [저장]에서 participants/{id}/schedules PATCH 후 신청 정보를 저장한다.
   * 1사1교는 기존 화면 그대로(버튼 없음).
   */
  const canChangeEducationSchedule =
    isGeneralOrgProgram && !isCompanySchool && progressRemoteEnabled
  const [scheduleChangeModalOpen, setScheduleChangeModalOpen] = useState(false)
  const [pendingScheduleChangeLines, setPendingScheduleChangeLines] = useState<string[] | null>(
    null
  )
  const [scheduleChangeSaving, setScheduleChangeSaving] = useState(false)
  const scheduleChangeLines = useMemo(
    () => applicationTabScheduleSessions.map(buildParticipatingInstitutionScheduleChangeLine),
    [applicationTabScheduleSessions]
  )
  const scheduleChangeRowLabels = useMemo(
    () =>
      applicationTabScheduleSessions.map(session =>
        resolveParticipatingInstitutionScheduleRowLabel(program, session)
      ),
    [applicationTabScheduleSessions, program]
  )
  const scheduleChangePeriodLabel = useMemo(
    () => formatParticipatingInstitutionScheduleChangePeriod(program.startDate, program.endDate),
    [program.endDate, program.startDate]
  )
  useEffect(() => {
    if (isApplicationInfoEditing) return
    setPendingScheduleChangeLines(null)
    setScheduleChangeModalOpen(false)
  }, [isApplicationInfoEditing, detail.id])

  const handleApplicationInfoSave = useCallback(async () => {
    if (scheduleChangeSaving) return
    const pendingLines = pendingScheduleChangeLines
    const scheduleRequests = pendingLines
      ? buildParticipatingInstitutionScheduleChangeRequests(scheduleChangeLines, pendingLines)
      : []
    if (scheduleRequests.length > 0) {
      setScheduleChangeSaving(true)
      let changedCount = 0
      try {
        for (const request of scheduleRequests) {
          await changeGeneralParticipatingInstitutionSchedules(programId, detail.id, request)
          changedCount += 1
        }
      } catch (error) {
        showAlert({
          title: '일정 변경 실패',
          content:
            (changedCount > 0
              ? `교육 진행 일정 ${scheduleRequests.length}건 중 ${changedCount}건만 변경되었습니다.\n`
              : '') +
            getGeneralProgramApiErrorMessage(
              error,
              '교육 진행 일정을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.'
            ),
        })
        if (changedCount === 0) {
          setScheduleChangeSaving(false)
          return
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationScheduleAssignmentsQueryKey(
            programId,
            organizationApplicationIdForDetail || '__none__'
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.institutions(programId),
        }),
        queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.schedules(programId) }),
      ])
      setScheduleChangeSaving(false)
      if (changedCount < scheduleRequests.length) return
      setPendingScheduleChangeLines(null)
    }
    const result = await saveApplicationInfoEdit()
    if (result === COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT) {
      combinedClassProcess.openGradeRequiredAlert()
    }
  }, [
    combinedClassProcess,
    detail.id,
    organizationApplicationIdForDetail,
    pendingScheduleChangeLines,
    programId,
    queryClient,
    saveApplicationInfoEdit,
    scheduleChangeLines,
    scheduleChangeSaving,
    showAlert,
  ])

  const programProgressStatus =
    mergedDetail.programProgressStatus ??
    resolveProgramEnrollmentDisplayStatusFromLabel(mergedDetail.programProgressLabel) ??
    getProgramProgressDisplayStatus(program)

  const showEducationFormatField = shouldShowInstitutionApplicationEducationFormatField(program)

  const resolvePersonalInfoAccessItem = useCallback(
    () => mergedDetail.schoolName ?? row.schoolName ?? '학교 상세 정보',
    [mergedDetail.schoolName, row.schoolName]
  )
  const revealInstitutionTeacherPersonalInfo = useCallback(
    async (reason: string, options?: PrivacyRevealOptions) => {
      const orgAppId = row.organizationApplicationId?.trim()
      if (orgAppId) {
        const programIdNumber = Number(program.id)
        const dto = await unmaskOrganizationApplicationPrivacyRemote(
          orgAppId,
          reason,
          Number.isFinite(programIdNumber) ? programIdNumber : undefined,
          options
        )
        const safeDto = cacheProjectedProgramPrivacy(
          queryClient,
          generalApplicationsQueryKeys.organizationDetailInProgram(programId, orgAppId),
          program.id,
          dto
        )
        // 같은 원문을 쓰는 신청 id 키도 추적 대상에 넣어 다시 가리기·이탈 시 함께 초기화한다.
        cacheProjectedProgramPrivacy(
          queryClient,
          generalApplicationsQueryKeys.organizationDetail(orgAppId),
          program.id,
          dto
        )
        return safeDto
      }
      if (row.teacherMemberId == null) {
        throw new Error('기관 신청 ID 또는 담당 교사 회원 ID가 없습니다.')
      }
      return fetchMemberRolePrivacyUnmask(row.teacherMemberId, reason, 'SCHOOL')
    },
    [program.id, programId, queryClient, row.organizationApplicationId, row.teacherMemberId]
  )
  const applyInstitutionTeacherPersonalInfo = useCallback(
    (payload: unknown) => {
      if (payload == null || typeof payload !== 'object') return
      if (isOrganizationApplicationDetailPayload(payload)) {
        const unmasked = mergeOrganizationApplicationDetailOntoSchoolDetail(detail, payload)
        setTeacherPrivacyOverlay({
          id: detail.id,
          patch: {
            teacherName: unmasked.teacherName ?? '',
            teacherPhone: unmasked.teacherPhone ?? '',
            teacherMobile: unmasked.teacherMobile ?? '',
            teacherEmail: unmasked.teacherEmail ?? '',
            addressDetail: unmasked.addressDetail ?? '',
            region: unmasked.region,
          },
        })
        return
      }
      const privacy = payload as { name?: unknown; phone?: unknown; email?: unknown }
      setTeacherPrivacyOverlay({
        id: detail.id,
        patch: {
          ...(typeof privacy.name === 'string' ? { teacherName: privacy.name } : {}),
          ...(typeof privacy.phone === 'string' ? { teacherMobile: privacy.phone } : {}),
          ...(typeof privacy.email === 'string' ? { teacherEmail: privacy.email } : {}),
        },
      })
    },
    [detail]
  )

  const {
    personalInfoRevealed,
    remaskPersonalInfo,
    revealWithReason,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    onRemask: clearTeacherPrivacyOverlay,
    programId: programId,
    resolveProgramRole: () => resolveSessionProgramRole(programId),
    resolveAccessItem: resolvePersonalInfoAccessItem,
    revealPersonalInfo: revealInstitutionTeacherPersonalInfo,
    onPrivacyUnmasked: applyInstitutionTeacherPersonalInfo,
    resetDeps: [detail.id],
    controlMode: 'toggleRemask',
  })

  /** 원문 열람 종료: 훅이 원문 캐시 초기화·오버레이 정리(onRemask)·상태 해제를 한 번에 동기 수행한다. */
  const endTeacherPrivacyReveal = remaskPersonalInfo
  remaskAfterSaveRef.current = remaskPersonalInfo

  /** CMS-29: 신청 정보 수정 취소 즉시 원문 열람을 끝낸다(원문 캐시는 훅이 초기화). */
  const cancelApplicationInfoEditAndRemask = useCallback(() => {
    cancelApplicationInfoEdit()
    endTeacherPrivacyReveal()
  }, [cancelApplicationInfoEdit, endTeacherPrivacyReveal])

  const privacyMasked = !personalInfoRevealed
  const [editUnmaskConfirmOpen, setEditUnmaskConfirmOpen] = useState(false)
  const [editUnmaskConfirmLoading, setEditUnmaskConfirmLoading] = useState(false)

  const requestStartApplicationInfoEdit = useCallback(() => {
    if (personalInfoRevealed) {
      enterApplicationInfoEdit()
      return
    }
    setEditUnmaskConfirmOpen(true)
  }, [enterApplicationInfoEdit, personalInfoRevealed])

  const closeEditUnmaskConfirm = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmOpen(false)
  }, [editUnmaskConfirmLoading])

  const confirmEditUnmaskAndStartEdit = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmLoading(true)
    void revealWithReason(APPLICATION_INFO_EDIT_UNMASK_REASON, EDIT_MODE_REVEAL)
      .then(result => {
        if (!result.ok) return
        setEditUnmaskConfirmOpen(false)
        if (isOrganizationApplicationDetailPayload(result.payload)) {
          enterApplicationInfoEdit(
            mergeOrganizationApplicationDetailOntoSchoolDetail(mergedDetail, result.payload)
          )
          return
        }
        const privacy =
          result.payload != null && typeof result.payload === 'object'
            ? (result.payload as { name?: unknown; phone?: unknown; email?: unknown })
            : undefined
        enterApplicationInfoEdit({
          ...mergedDetail,
          ...(typeof privacy?.name === 'string' ? { teacherName: privacy.name } : {}),
          ...(typeof privacy?.phone === 'string' ? { teacherMobile: privacy.phone } : {}),
          ...(typeof privacy?.email === 'string' ? { teacherEmail: privacy.email } : {}),
        })
      })
      .finally(() => {
        setEditUnmaskConfirmLoading(false)
      })
  }, [editUnmaskConfirmLoading, enterApplicationInfoEdit, mergedDetail, revealWithReason])

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isApplicationInfoEditing) return
    setAdminCommentDraft(mergedDetail.adminComment ?? '')
    setAdminCommentError(undefined)
    setAdminCommentModalOpen(true)
  }, [isApplicationInfoEditing, mergedDetail.adminComment])

  const handleAdminCommentSave = useCallback(async () => {
    const trimmed = adminCommentDraft.trim()
    if (shouldUseOrganizationApplicationRemoteApi()) {
      if (!hasOrganizationApplicationId) {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
      try {
        const result = await upsertAdminCommentByTargetRemote({
          targetType: 'ORGANIZATION_APPLICATION',
          targetId: organizationApplicationId,
          screenCode: 'ORGANIZATION_APPLICATION',
          comment: trimmed,
        })
        onSaveBasicInfo?.({
          id: detail.id,
          adminComment: result.commentText,
        })
        void queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.commentsByTarget(
            'ORGANIZATION_APPLICATION',
            String(organizationApplicationId)
          ),
        })
        setAdminCommentModalOpen(false)
        setAdminCommentError(undefined)
        return
      } catch {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
    }
    void showAlert({
      title: PROGRAM_API_UNAVAILABLE_TITLE,
      content: buildProgramApiUnavailableSaveContent('참여 기관 관리자 코멘트'),
    })
  }, [
    adminCommentDraft,
    detail.id,
    hasOrganizationApplicationId,
    onSaveBasicInfo,
    organizationApplicationId,
    queryClient,
    showAlert,
  ])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentError(undefined)
  }, [])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
    setAdminCommentError(undefined)
  }, [])

  const handleRequestActivityWithdraw = useCallback(() => {
    if (isActivityWithdrawn) {
      showAlert({
        title: '활동 포기 안내',
        content: PARTICIPATING_INSTITUTION_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
      })
      return
    }
    if (!canRequestActivityWithdraw || isApplicationInfoEditing) return
    setActivityWithdrawModalOpen(true)
  }, [canRequestActivityWithdraw, isActivityWithdrawn, isApplicationInfoEditing, showAlert])

  const handleCancelActivityWithdraw = useCallback(() => {
    if (activityWithdrawSubmitting) return
    setActivityWithdrawModalOpen(false)
  }, [activityWithdrawSubmitting])

  const handleConfirmActivityWithdraw = useCallback(
    async (payload: ActivityWithdrawScheduleModalPayload) => {
      const patch = resolveParticipatingInstitutionActivityWithdrawPatch(
        program,
        participantSessions,
        payload.stopSessionKey
      )
      if (!patch) return

      if (progressRemoteEnabled) {
        setActivityWithdrawSubmitting(true)
        try {
          if (progressRemoteEnabled) {
            const stopScheduleId = resolveParticipatingInstitutionActivityWithdrawStopScheduleId(
              participantSessions,
              payload.stopSessionKey
            )
            await giveUpGeneralParticipatingInstitution(programId, detail.id, {
              reason: payload.reason,
              faultParty: payload.faultParty,
              stopScheduleId,
            })
            await queryClient.invalidateQueries({
              queryKey: generalProgramProgressQueryKeys.institutions(programId),
            })
          }
          onSaveBasicInfo?.({ id: detail.id, ...patch })
          setActivityWithdrawModalOpen(false)
          showAlert({
            title: '활동 포기',
            content: `${mergedDetail.schoolName} 기관이 활동 포기 처리되었습니다.`,
          })
        } catch (error) {
          const message =
            error instanceof Error && error.message.trim()
              ? error.message
              : '활동 포기 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
          showAlert({
            title: '활동 포기 실패',
            content: message,
          })
        } finally {
          setActivityWithdrawSubmitting(false)
        }
        return
      }

      notifyProgramApiUnavailable(
        'general-participating-institution-give-up',
        '일반 프로그램 · 참여 기관 활동 포기'
      )
    },
    [
      detail.id,
      mergedDetail.schoolName,
      onSaveBasicInfo,
      program,
      programId,
      progressRemoteEnabled,
      queryClient,
      participantSessions,
      showAlert,
    ]
  )

  const instructors =
    savedInstructorPatches[detail.id] !== undefined
      ? savedInstructorPatches[detail.id].map(inv => ({
          ...inv,
          settlementStatus: 'awaiting_confirmation' as SettlementStatusKey,
        }))
      : getInstructorRowsForSchool(row.schoolName, instructorList)

  const assignedInstructorIdSet = useMemo(
    () => new Set(instructors.map(instructor => instructor.id)),
    [instructors]
  )

  /** 담당 교사 정보: 담당 교사 : 이름 | Tel : … | M : … | E-mail : … */
  const teacherDisplaySegments = [
    mergedDetail.teacherName && `담당 교사 : ${mergedDetail.teacherName}`,
    mergedDetail.teacherPhone &&
      `Tel : ${displayServerPiiAsIs(mergedDetail.teacherPhone, mergedDetail.teacherPhone)}`,
    mergedDetail.teacherMobile &&
      `M : ${displayServerPiiAsIs(mergedDetail.teacherMobile, mergedDetail.teacherMobile)}`,
    mergedDetail.teacherEmail &&
      `E-mail : ${displayServerPiiAsIs(mergedDetail.teacherEmail, mergedDetail.teacherEmail)}`,
  ].filter((v): v is string => Boolean(v))
  const mealDisplay =
    mergedDetail.mealNotice === '가능'
      ? '가능'
      : mergedDetail.mealProvided
        ? renderDetailInfoPipeSeparated(`제공 | ${mergedDetail.mealNotice ?? ''}`)
        : '미제공'

  /** ` | ` 구분 값 → td 디바이더 (안내 사항·성범죄 경력 조회서 등) */
  const formatGuidanceSegmentValue = (raw?: string): ReactNode => {
    const text = raw?.trim()
    if (!text) return '-'
    const parts = text
      .split(' | ')
      .map(s => s.trim())
      .filter(Boolean)
    if (parts.length <= 1) return parts[0] ?? '-'
    return withTdDivider(parts)
  }
  /** 배정된 강사 테이블용 행 — assignment board remote 시 API */
  const assignedRowsWithCancelled: AssignedInstructorDisplayRow[] = useMemo(() => {
    if (assignmentBoardRemoteEnabled) {
      if (!assignmentBoard) return []
      const orgAppId = row.organizationApplicationId ?? ''
      if (!orgAppId) return []
      const apiRows = buildCompanySchoolAssignedInstructorRows({
        assignments: assignmentBoard.assignments,
        organizationApplicationId: orgAppId,
        instructorNameByMemberId: assignmentBoard.instructorNameByMemberId,
        scheduleLabelById: assignmentBoard.scheduleLabelById,
        includeCancelled: isCompanySchool,
      })
      return apiRows.map(r => ({
        id: r.id,
        no: r.no,
        role: r.role,
        instructorName: r.instructorName,
        contact: '',
        email: '',
        // 배정 1건 = 지급조서 1건 — 서버 배정 단위 settlementStatus 그대로(구 백엔드는 none)
        settlementStatus: r.settlementStatus,
        homeAddress: r.homeAddress,
        distanceToSchool: r.distanceToSchool,
        assignedDate: r.assignedDate,
        assignedTime: r.assignedTime,
        assignedSession: r.assignedSession,
        assignedScheduleLine: [r.assignedDate, r.assignedTime, r.assignedSession]
          .filter(Boolean)
          .join(' '),
        assignmentId: r.assignmentId,
        instructorMemberId: r.instructorMemberId,
        scheduleId: r.scheduleId,
        assignmentCancelled: r.assignmentCancelled,
      }))
    }
    // 일반 remote OFF — FE mock 프로그램만 로컬 시드
    if (!isCompanySchool) return []
    const rows = getAssignedInstructorDisplayRows(instructors)
    const defaultScheduleLine = buildParticipatingSchoolPreferredScheduleLines(row.sessions)[0]
    return rows.map(assignedRow => ({
      ...assignedRow,
      assignedScheduleLine:
        assignedScheduleLinesByInstructorId[assignedRow.id] ?? defaultScheduleLine,
    }))
  }, [
    instructors,
    isCompanySchool,
    assignmentBoardRemoteEnabled,
    instructorList,
    row.sessions,
    row.organizationApplicationId,
    assignedScheduleLinesByInstructorId,
    assignmentBoard,
  ])

  /** 활성 배정 — 인원·팀장·배정 취소·역할 변경·엑셀은 취소 행을 제외한 이 목록만 본다 */
  const assignedRows: AssignedInstructorDisplayRow[] = useMemo(
    () =>
      assignedRowsWithCancelled
        .filter(r => !r.assignmentCancelled)
        .map((r, index) => ({ ...r, no: index + 1 })),
    [assignedRowsWithCancelled]
  )

  /** 표 — 활성 배정 뒤에 「배정 취소」 행(1사1교) */
  const assignedTableRows: AssignedInstructorDisplayRow[] = useMemo(
    () =>
      [...assignedRows, ...assignedRowsWithCancelled.filter(r => r.assignmentCancelled)].map(
        (r, index) => ({ ...r, no: index + 1 })
      ),
    [assignedRows, assignedRowsWithCancelled]
  )

  /** 배정 대기 — remote 시 승인 강사신청 × 기관 sessions 합성 (전용 waiting API 없음) */
  const waitingRows: WaitingInstructorRow[] = useMemo(() => {
    if (assignmentBoardRemoteEnabled) {
      if (!assignmentBoard) return []
      if (!row.organizationApplicationId) return []
      const assignedMemberIds = new Set<string>()
      for (const a of assignmentBoard.assignments) {
        if (a.organizationApplicationId == null) continue
        if (String(a.organizationApplicationId) === String(row.organizationApplicationId)) {
          if (a.instructorMemberId != null) assignedMemberIds.add(String(a.instructorMemberId))
        }
      }
      const waitingHopeSessions =
        isGeneralOrgProgram && hopeEducationSessions.length > 0
          ? hopeEducationSessions
          : (row.sessions ?? [])
      // 일반 기관형(1사1교 제외): 승인 전 강사 신청도 배정 대기에 보여 「승인 및 배정」(시안 09-2·11-2) 대상으로 쓴다
      const includePending = isGeneralOrgProgram && !isCompanySchool
      const pendingApplications = includePending
        ? (assignmentBoard.pendingInstructorApplications ?? [])
        : []
      const pendingApplicationById = new Map(
        pendingApplications
          .filter(app => app.id != null)
          .map(app => [String(app.id), app] as const)
      )
      return buildCompanySchoolWaitingInstructorRows({
        schoolName: row.schoolName,
        sessions: waitingHopeSessions,
        approvedInstructors: includePending
          ? [...assignmentBoard.approvedInstructorApplications, ...pendingApplications]
          : assignmentBoard.approvedInstructorApplications,
        assignedInstructorMemberIds: assignedMemberIds,
        occupiedLectureDatesByInstructorId,
        // 일반 기관형: 강사 신청의 기관별 거리에서 이 기관을 찾는다(1사1교는 기존 신청 단위 거리)
        organizationApplicationId: isGeneralOrgProgram ? row.organizationApplicationId : null,
        ...(includePending ? { candidateApplicationStatuses: 'any' as const } : {}),
      })
        .filter(waitingRow => !completedWaitingRowKeys.has(waitingRow.id))
        .map((waitingRow): WaitingInstructorRow => {
          const pendingApp = waitingRow.instructorApplicationId
            ? pendingApplicationById.get(waitingRow.instructorApplicationId)
            : undefined
          const withApproval: WaitingInstructorRow = pendingApp
            ? {
                ...waitingRow,
                programApprovalPending: true,
                instructorFeeGradeLabel: pendingApp.instructorFeeGradeSnapshot?.trim() || undefined,
              }
            : waitingRow
          const instructorId = getWaitingInstructorRowInstructorId(withApproval)
          if (
            disabledWaitingInstructorIds.has(instructorId) &&
            withApproval.assignmentStatus === 'waiting'
          ) {
            return { ...withApproval, assignmentStatus: 'unavailable' as const }
          }
          return withApproval
        })
    }

    // 일반 remote OFF — FE mock 프로그램만 로컬 시드
    if (!isCompanySchool) return []

    return getWaitingInstructorRows(row.schoolName, instructorList, participatingSchoolList).filter(
      waitingRow => !assignedInstructorIdSet.has(getWaitingInstructorRowInstructorId(waitingRow))
    )
  }, [
    row.schoolName,
    row.sessions,
    row.organizationApplicationId,
    hopeEducationSessions,
    isGeneralOrgProgram,
    instructorList,
    participatingSchoolList,
    isCompanySchool,
    assignmentBoardRemoteEnabled,
    occupiedLectureDatesByInstructorId,
    completedWaitingRowKeys,
    disabledWaitingInstructorIds,
    assignedInstructorIdSet,
    assignmentBoard,
  ])

  const assignedInstructorNames = useMemo(
    () =>
      assignmentBoardRemoteEnabled
        ? assignedRows.map(i => i.instructorName)
        : instructors.map(i => i.instructorName),
    [assignmentBoardRemoteEnabled, assignedRows, instructors]
  )

  /** assignment board remote 시 API 행 수, 그 외(1사1교 local)는 instructors */
  const currentAssignedCount = assignmentBoardRemoteEnabled
    ? assignedRows.length
    : instructors.length

  const currentLeadName =
    (assignmentBoardRemoteEnabled
      ? assignedRows.find(i => i.role === 'lead')?.instructorName
      : instructors.find((i: { role: InstructorRoleKey }) => i.role === 'lead')?.instructorName) ??
    null

  const selectedWaitingRows = useMemo(
    () =>
      waitingRows.filter(
        r => selectedWaitingKeys.includes(r.id) && r.assignmentStatus === 'waiting'
      ),
    [waitingRows, selectedWaitingKeys]
  )

  /** 선택 배정 — assignment board remote 시 API create, 일반 remote OFF는 unavailable */
  const finalizeSelectAssign = useCallback(
    async (rows: WaitingInstructorRow[], showApprovalAlarmSection: boolean) => {
      if (rows.length === 0) return
      if (program && !programHasActiveInstructorRecruitment(program)) {
        showAlert({
          title: '배정 실패',
          content: GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE,
        })
        return
      }

      if (assignmentBoardRemoteEnabled) {
        const orgAppId = row.organizationApplicationId
        if (!orgAppId) {
          showAlert({
            title: '안내',
            content:
              '기관 신청 ID가 없어 배정할 수 없습니다. 참여 기관 API에 organizationApplicationId(sourceApplicationId) 매핑이 필요합니다.',
          })
          return
        }
        if (!assignmentBoard) {
          showAlert({
            title: '안내',
            content: '배정 데이터를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
          })
          return
        }

        if (assignInFlightRef.current) return
        assignInFlightRef.current = true
        setAssignSubmitting(true)
        try {
          let leadAssigned = currentAssignedCount > 0 && assignedRows.some(i => i.role === 'lead')
          for (const waitingRow of rows) {
            const memberIdRaw =
              (waitingRow as { instructorMemberId?: string }).instructorMemberId ??
              getWaitingInstructorRowInstructorId(waitingRow)
            const memberId = Number(memberIdRaw)
            if (!Number.isFinite(memberId) || memberId <= 0) {
              showAlert({
                title: '안내',
                content: `강사 memberId가 없어 배정할 수 없습니다. (${waitingRow.instructorName})`,
              })
              return
            }
            const scheduleUnresolved = Boolean(
              (waitingRow as { scheduleUnresolved?: boolean }).scheduleUnresolved
            )
            const requestedScheduleId = (waitingRow as { requestedScheduleId?: number })
              .requestedScheduleId
            const resolvedScheduleId = (waitingRow as { resolvedScheduleId?: number | null })
              .resolvedScheduleId
            if (scheduleUnresolved) {
              showAlert({
                title: '안내',
                content: isCompanySchool
                  ? `희망일에 대응하는 program schedule이 없습니다. (일정 미생성) — ${waitingRow.instructorName}`
                  : ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE,
              })
              return
            }

            const scheduleTarget = resolveOrganizationInstructorAssignmentScheduleTarget({
              allowRequestedScheduleOnly: isCompanySchool,
              boardScheduleId: resolveInstructorAssignmentScheduleId({
                schedules: assignmentBoard.schedules,
                resolvedScheduleId,
                hopeDateOrLine: waitingRow.hopeDate ?? waitingRow.hopeScheduleLine,
                timeRangeLabel: waitingRow.hopeScheduleLine,
              }),
              resolvedScheduleId,
              requestedScheduleId,
            })
            if (scheduleTarget == null) {
              showAlert({
                title: '안내',
                content: isCompanySchool
                  ? '교육 일정을 program schedule과 명확히 연결할 수 없습니다. resolvedScheduleId·requestedScheduleId 또는 희망 시간 정보를 확인해 주세요.'
                  : ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE,
              })
              return
            }
            const applicationIdRaw = (waitingRow as { instructorApplicationId?: string })
              .instructorApplicationId
            const assignmentNotify = toScheduledOnlyNotifyTiming(
              pendingAssignNotifyRef.current?.notifyTiming,
              pendingAssignNotifyRef.current?.manualNotifyAt
            )
            await createInstructorAssignmentRemote(programId, {
              instructorMemberId: memberId,
              ...scheduleTarget,
              organizationApplicationId: Number(orgAppId),
              instructorApplicationId: applicationIdRaw ? Number(applicationIdRaw) : undefined,
              scheduleLead: !leadAssigned,
              ...assignmentNotify,
            })
            leadAssigned = true
          }
          await invalidateAssignmentBoard()
          setSelectAssignConfirmOpen(false)
          setSelectAssignNewGuideOpen(false)
          setSelectAssignFeeApprovalOpen(false)
          setSelectAssignPendingInstructor(null)
          setSelectAssignOverflowOpen(false)
          setSelectedWaitingKeys([])
          const instructorNameLabel =
            rows.length === 1
              ? (rows[0]?.instructorName ?? '')
              : Array.from(new Set(rows.map(r => r.instructorName))).join(', ')
          setAssignCompleteModal({
            instructorName: instructorNameLabel,
            schoolName: row.schoolName,
            currentCount: (assignmentBoard.assignments.length ?? 0) + rows.length,
            showApprovalAlarmSection,
          })
        } catch (error) {
          const code =
            error && typeof error === 'object' && 'response' in error
              ? String(
                  (error as { response?: { data?: { error?: { code?: string }; code?: string } } })
                    .response?.data?.error?.code ??
                    (error as { response?: { data?: { code?: string } } }).response?.data?.code ??
                    ''
                )
              : ''
          showAlert({
            title: '배정 실패',
            content: isOneSchoolPerDayConflictErrorCode(code)
              ? ONE_SCHOOL_PER_DAY_CONFLICT_ALERT_MESSAGE
              : (formatInstructorOrganizationScheduleScopeMessage(error) ??
                getParticipationConsentRequiredMessage(error) ??
                getGeneralProgramApiErrorMessage(
                  error,
                  '강사 배정에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
                )),
          })
        } finally {
          assignInFlightRef.current = false
          setAssignSubmitting(false)
        }
        return
      }

      if (!isCompanySchool) {
        void showAlert({
          title: PROGRAM_API_UNAVAILABLE_TITLE,
          content: buildProgramApiUnavailableSaveContent('강사 배정'),
        })
        return
      }

      const existingFormList: InstructorListFormInstructor[] = instructors.map(
        ({ id, role, instructorName, contact, email }) => ({
          id,
          role,
          instructorName,
          contact,
          email,
        })
      )
      const newFormList: InstructorListFormInstructor[] = rows.reduce<
        InstructorListFormInstructor[]
      >((acc, w) => {
        const instructorId = getWaitingInstructorRowInstructorId(w)
        if (acc.some(item => item.id === instructorId)) return acc
        const fromList = instructorList.find(r => r.id === instructorId)
        if (!fromList) return acc
        acc.push({
          id: fromList.id,
          role:
            instructors.length === 0 && acc.length === 0
              ? ('lead' as InstructorRoleKey)
              : ('assistant' as InstructorRoleKey),
          instructorName: fromList.instructorName,
          contact: fromList.contact ?? '',
          email: fromList.email ?? '',
        })
        return acc
      }, [])

      if (newFormList.length === 0) return

      onSaveInstructorInfo?.(detail.id, [...existingFormList, ...newFormList])
      setSelectAssignConfirmOpen(false)
      setSelectAssignNewGuideOpen(false)
      setSelectAssignFeeApprovalOpen(false)
      setSelectAssignPendingInstructor(null)
      setSelectAssignOverflowOpen(false)
      setCompletedWaitingRowKeys(prev => {
        const next = new Set(prev)
        rows.forEach(waitingRow => next.add(waitingRow.id))
        return next
      })
      setDisabledWaitingInstructorIds(prev => {
        const next = new Set(prev)
        rows.forEach(waitingRow => next.add(getWaitingInstructorRowInstructorId(waitingRow)))
        return next
      })
      setAssignedScheduleLinesByInstructorId(prev => {
        const next = { ...prev }
        rows.forEach(waitingRow => {
          const scheduleLine =
            waitingRow.hopeScheduleLine ?? formatWaitingInstructorHopeScheduleExport(waitingRow)
          if (scheduleLine && scheduleLine !== '-') {
            next[getWaitingInstructorRowInstructorId(waitingRow)] = scheduleLine
          }
        })
        return next
      })
      setSelectedWaitingKeys([])

      const instructorNameLabel =
        rows.length === 1
          ? (rows[0]?.instructorName ?? '')
          : Array.from(new Set(rows.map(r => r.instructorName))).join(', ')

      setAssignCompleteModal({
        instructorName: instructorNameLabel,
        schoolName: row.schoolName,
        currentCount: instructors.length + newFormList.length,
        showApprovalAlarmSection,
      })
    },
    [
      instructors,
      instructorList,
      detail.id,
      onSaveInstructorInfo,
      row.schoolName,
      row.organizationApplicationId,
      isCompanySchool,
      assignmentBoardRemoteEnabled,
      assignmentBoard,
      assignedRows,
      currentAssignedCount,
      programId,
      program,
      invalidateAssignmentBoard,
      showAlert,
    ]
  )

  /** 선택 배정 확인 모달에서 "강사 배정" 클릭 시 (이미 승인된 강사) */
  const handleSelectAssignConfirm = useCallback(() => {
    finalizeSelectAssign(selectedWaitingRows, false)
  }, [finalizeSelectAssign, selectedWaitingRows])

  const approveAssignSelection = useMemo(
    () =>
      summarizeInstitutionApproveAssignSelection(
        selectedWaitingRows.map(w => ({
          instructorId: getWaitingInstructorRowInstructorId(w),
          instructorName: w.instructorName,
          programApprovalPending: w.programApprovalPending,
        }))
      ),
    [selectedWaitingRows]
  )
  const approveAssignUnapprovedNames = useMemo(() => {
    const names = new Map<string, string>()
    for (const w of selectedWaitingRows) {
      if (w.programApprovalPending) names.set(getWaitingInstructorRowInstructorId(w), w.instructorName)
    }
    return Array.from(names.values())
  }, [selectedWaitingRows])
  const approveAssignFeeGradeLabel = useMemo(
    () => selectedWaitingRows.find(w => w.programApprovalPending)?.instructorFeeGradeLabel,
    [selectedWaitingRows]
  )

  const closeApproveAssignFlow = useCallback(() => {
    pendingApproveAssignDetailRef.current = null
    setApproveAssignFeePolicyError(null)
    setApproveAssignStep(null)
  }, [])

  /**
   * 일반 기관형 「승인 및 배정」 실행.
   * 일괄 승인+배정 API가 없어 강사별로 순차 호출한다.
   * - 승인 전 강사: approve(assignments·feePolicy·notification) 1회
   * - 승인된 강사: 행마다 instructor-assignments create
   * 중간 실패 시 그 지점에서 멈추고, 이미 처리한 강사명을 알려 준 뒤 목록을 다시 불러온다.
   */
  const executeApproveAndAssign = useCallback(
    async (detail: InstructorFeeApprovalConfirmDetail) => {
      const rows = selectedWaitingRows
      if (rows.length === 0) return
      if (!programHasActiveInstructorRecruitment(program)) {
        showAlert({ title: '배정 실패', content: GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT_MESSAGE })
        return
      }
      if (!assignmentBoardRemoteEnabled) {
        void showAlert({
          title: PROGRAM_API_UNAVAILABLE_TITLE,
          content: buildProgramApiUnavailableSaveContent('강사 승인 및 배정'),
        })
        return
      }
      const orgAppId = Number(row.organizationApplicationId)
      if (!Number.isFinite(orgAppId) || orgAppId <= 0) {
        showAlert({
          title: '안내',
          content:
            '기관 신청 ID가 없어 배정할 수 없습니다. 참여 기관 API에 organizationApplicationId(sourceApplicationId) 매핑이 필요합니다.',
        })
        return
      }
      if (!assignmentBoard) {
        showAlert({ title: '안내', content: '배정 데이터를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.' })
        return
      }
      const plan = buildInstitutionApproveAssignPlan({
        rows: rows.map(w => ({
          instructorId: getWaitingInstructorRowInstructorId(w),
          instructorName: w.instructorName,
          instructorMemberId: (w as { instructorMemberId?: string }).instructorMemberId,
          instructorApplicationId: (w as { instructorApplicationId?: string }).instructorApplicationId,
          programApprovalPending: w.programApprovalPending,
          instructorFeeGradeLabel: w.instructorFeeGradeLabel,
          hopeDate: w.hopeDate,
          hopeScheduleLine: w.hopeScheduleLine,
          requestedScheduleId: (w as { requestedScheduleId?: number }).requestedScheduleId,
          resolvedScheduleId: (w as { resolvedScheduleId?: number | null }).resolvedScheduleId,
          scheduleUnresolved: (w as { scheduleUnresolved?: boolean }).scheduleUnresolved,
        })),
        schedules: assignmentBoard.schedules,
      })
      if (!plan.ok) {
        showAlert({ title: '안내', content: plan.message })
        return
      }

      const feeContext = { programWageGradeRows: program.generalCommonInfo?.wageGradeRows }
      const feePolicyByMemberId = new Map<number, InstructorApplicationFeePolicyRequest>()
      for (const instructor of plan.instructors) {
        if (!instructor.unapproved) continue
        const feePolicy = toInstructorApplicationFeePolicy(
          {
            basisType: detail.lectureFeeBasisType,
            measure: detail.lectureFeeMeasure,
            amount: detail.lectureFeeAmount,
            // 프로그램 기준은 강사별 등급, 그 외는 모달 선택값
            instructorFeeGrade:
              (detail.lectureFeeBasisType === 'program'
                ? instructor.instructorFeeGradeLabel?.trim()
                : undefined) ||
              detail.instructorFeeGrade?.trim() ||
              detail.instructorFeeGradeLabel?.trim() ||
              instructor.instructorFeeGradeLabel?.trim() ||
              '',
          },
          feeContext
        )
        if (!isInstructorApplicationFeePolicyRequestValid(feePolicy, instructor.targets.length)) {
          setApproveAssignFeePolicyError(INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE)
          setApproveAssignStep('fee')
          return
        }
        feePolicyByMemberId.set(instructor.instructorMemberId, feePolicy!)
      }

      if (assignInFlightRef.current) return
      assignInFlightRef.current = true
      setAssignSubmitting(true)
      /**
       * 승인 API(`Notification`)는 발표일(ON_ANNOUNCEMENT)을 받지만, 이미 승인된 강사의
       * 배정 create는 즉시·예약만 받는다. 모두 미승인일 때만 발표일을 허용한다.
       */
      const allUnapproved = plan.instructors.every(instructor => instructor.unapproved)
      const notification = toInstructorApplicationNotificationRequest(
        detail.notifyTiming,
        detail.manualNotifyAt,
        allUnapproved ? NOTIFY_TIMING_CAPABILITY.full : NOTIFY_TIMING_CAPABILITY.scheduledOnly
      )
      const assignmentNotify = allUnapproved
        ? undefined
        : toScheduledOnlyNotifyTiming(detail.notifyTiming, detail.manualNotifyAt)
      const completedNames: string[] = []
      let leadAssigned = currentAssignedCount > 0 && assignedRows.some(i => i.role === 'lead')
      try {
        for (const instructor of plan.instructors) {
          if (instructor.unapproved) {
            await approveGeneralInstructorApplication(String(instructor.instructorApplicationId), {
              assignments: instructor.targets.map(target => {
                const assignment = {
                  scheduleId: target.scheduleId,
                  organizationApplicationId: orgAppId,
                  scheduleLead: !leadAssigned,
                }
                leadAssigned = true
                return assignment
              }),
              feePolicy: feePolicyByMemberId.get(instructor.instructorMemberId),
              notification,
            })
          } else {
            for (const target of instructor.targets) {
              await createInstructorAssignmentRemote(programId, {
                instructorMemberId: instructor.instructorMemberId,
                ...target,
                organizationApplicationId: orgAppId,
                instructorApplicationId: instructor.instructorApplicationId,
                scheduleLead: !leadAssigned,
                ...assignmentNotify,
              })
              leadAssigned = true
            }
          }
          completedNames.push(instructor.instructorName)
        }
        await Promise.all([
          invalidateAssignmentBoard(),
          queryClient.invalidateQueries({
            queryKey: generalApplicationsQueryKeys.instructorList(programId),
          }),
        ])
        closeApproveAssignFlow()
        setSelectedWaitingKeys([])
        setAssignCompleteModal({
          instructorName: completedNames.join(', '),
          schoolName: row.schoolName,
          currentCount: (assignmentBoard.assignments.length ?? 0) + rows.length,
          showApprovalAlarmSection: true,
        })
      } catch (error) {
        const failedName = plan.instructors[completedNames.length]?.instructorName ?? ''
        if (completedNames.length > 0) {
          await Promise.all([
            invalidateAssignmentBoard(),
            queryClient.invalidateQueries({
              queryKey: generalApplicationsQueryKeys.instructorList(programId),
            }),
          ])
          closeApproveAssignFlow()
          setSelectedWaitingKeys([])
        }
        const reason =
          formatInstructorOrganizationScheduleScopeMessage(error) ??
          getParticipationConsentRequiredMessage(error) ??
          getGeneralProgramApiErrorMessage(
            error,
            '강사 승인 및 배정에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.'
          )
        showAlert({
          title: '배정 실패',
          content:
            completedNames.length > 0
              ? `${completedNames.join(', ')} 강사님은 승인 및 배정이 완료되었습니다.\n[${failedName}] 강사님부터 처리하지 못했습니다.\n${reason}`
              : reason,
        })
      } finally {
        assignInFlightRef.current = false
        setAssignSubmitting(false)
      }
    },
    [
      assignedRows,
      assignmentBoard,
      assignmentBoardRemoteEnabled,
      closeApproveAssignFlow,
      currentAssignedCount,
      invalidateAssignmentBoard,
      program,
      programId,
      queryClient,
      row.organizationApplicationId,
      row.schoolName,
      selectedWaitingRows,
      showAlert,
    ]
  )

  const handleApproveAssignFeeConfirm = useCallback(
    (detail: InstructorFeeApprovalConfirmDetail) => {
      setApproveAssignFeePolicyError(null)
      if (currentAssignedCount + approveAssignSelection.selectedInstructorCount > requiredInstructorCount) {
        pendingApproveAssignDetailRef.current = detail
        setApproveAssignStep('overflow')
        return
      }
      void executeApproveAndAssign(detail)
    },
    [
      approveAssignSelection.selectedInstructorCount,
      currentAssignedCount,
      executeApproveAndAssign,
      requiredInstructorCount,
    ]
  )

  const executeRemoteAddAssign = useCallback(
    async (payload: PermissionModalPayload) => {
      const pending = pendingAddAssignRef.current
      if (!pending || !assignmentBoardRemoteEnabled) return
      const { role, option, meta } = pending
      const orgAppId = row.organizationApplicationId
      if (!orgAppId) {
        showAlert({
          title: '안내',
          content:
            '기관 신청 ID가 없어 배정할 수 없습니다. 참여 기관 API에 organizationApplicationId(sourceApplicationId) 매핑이 필요합니다.',
        })
        return
      }
      if (!assignmentBoard) {
        showAlert({
          title: '안내',
          content: '배정 데이터를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
        })
        return
      }
      const memberId = Number(option.value)
      if (!Number.isFinite(memberId) || memberId <= 0) {
        showAlert({
          title: '안내',
          content: `강사 memberId가 없어 배정할 수 없습니다. (${option.label})`,
        })
        return
      }
      const sessionIds = meta?.sessionIds ?? []
      const selectedSessions = instructorAssignScheduleSessions.filter(session =>
        sessionIds.includes(buildSchoolAddInstructorSessionSlotKey(row.id, session))
      )
      if (selectedSessions.length === 0) {
        showAlert(NO_SELECTION_ALERT)
        return
      }
      const applicationIdRaw = assignmentBoard.approvedInstructorApplications.find(
        app => app.instructorMemberId != null && String(app.instructorMemberId) === String(memberId)
      )?.id
      if (assignInFlightRef.current) return
      assignInFlightRef.current = true
      setAssignSubmitting(true)
      pendingAssignNotifyRef.current = payload
      try {
        const assignmentNotify = toScheduledOnlyNotifyTiming(
          payload.notifyTiming,
          payload.manualNotifyAt
        )
        let leadAssigned = currentAssignedCount > 0 && assignedRows.some(i => i.role === 'lead')
        const wantLead = role === 'lead' || currentAssignedCount === 0
        for (const session of selectedSessions) {
          if (session.scheduleUnresolved) {
            showAlert({
              title: '안내',
              content: isCompanySchool
                ? `희망일에 대응하는 program schedule이 없습니다. (일정 미생성)`
                : ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE,
            })
            return
          }
          const scheduleTarget = resolveOrganizationInstructorAssignmentScheduleTarget({
            allowRequestedScheduleOnly: isCompanySchool,
            boardScheduleId: resolveInstructorAssignmentScheduleId({
              schedules: assignmentBoard.schedules,
              resolvedScheduleId: session.resolvedScheduleId,
              hopeDateOrLine: session.date,
              timeRangeLabel: session.timeRange,
            }),
            resolvedScheduleId: session.resolvedScheduleId,
            requestedScheduleId: session.requestedScheduleId,
          })
          if (scheduleTarget == null) {
            showAlert({
              title: '안내',
              content: isCompanySchool
                ? '교육 일정을 program schedule과 명확히 연결할 수 없습니다. resolvedScheduleId·requestedScheduleId 또는 희망 시간 정보를 확인해 주세요.'
                : ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE,
            })
            return
          }
          await createInstructorAssignmentRemote(programId, {
            instructorMemberId: memberId,
            ...scheduleTarget,
            organizationApplicationId: Number(orgAppId),
            instructorApplicationId:
              applicationIdRaw != null ? Number(applicationIdRaw) : undefined,
            scheduleLead: wantLead && !leadAssigned,
            ...assignmentNotify,
          })
          leadAssigned = true
        }
        await invalidateAssignmentBoard()
        pendingAddAssignRef.current = null
        setAddAssignNotifyInstructorName('')
        setAddAssignNotifyOpen(false)
        setAddAssignModalOpen(false)
        setAddModalOpenedFromOverflow(false)
        setAssignCompleteModal({
          instructorName: option.label,
          schoolName: row.schoolName,
          currentCount: currentAssignedCount + 1,
          showApprovalAlarmSection: meta?.isNewApproval ?? false,
        })
      } catch (error) {
        const code =
          error && typeof error === 'object' && 'response' in error
            ? String(
                (error as { response?: { data?: { error?: { code?: string }; code?: string } } })
                  .response?.data?.error?.code ??
                  (error as { response?: { data?: { code?: string } } }).response?.data?.code ??
                  ''
              )
            : ''
        showAlert({
          title: '배정 실패',
          content: isOneSchoolPerDayConflictErrorCode(code)
            ? ONE_SCHOOL_PER_DAY_CONFLICT_ALERT_MESSAGE
            : (formatInstructorOrganizationScheduleScopeMessage(error) ??
              getParticipationConsentRequiredMessage(error) ??
              getGeneralProgramApiErrorMessage(
                error,
                '강사 배정에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.',
              )),
        })
      } finally {
        assignInFlightRef.current = false
        setAssignSubmitting(false)
      }
    },
    [
      assignedRows,
      assignmentBoard,
      assignmentBoardRemoteEnabled,
      currentAssignedCount,
      instructorAssignScheduleSessions,
      invalidateAssignmentBoard,
      programId,
      row.id,
      row.organizationApplicationId,
      row.schoolName,
      showAlert,
    ]
  )

  /**
   * 배정 알림 발송 여부 — 강사 배정 목록 응답(InstructorAssignmentListItemResponse)에 발송 여부/시각 필드가 없어
   * 판단할 수 없다. 미지정이면 발송 후 시안(12-2: 사유 + 알림)으로 연다. BE 필드가 생기면 여기서 매핑한다.
   */
  const unassignNotificationSent: boolean | undefined = undefined

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingRows.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }

    // 일반 기관형: 승인 전 강사가 섞여 있으면 「승인 및 배정」(시안 09-2·11-2) → 강사비 책정(11-3)
    if (!isCompanySchool && selectedWaitingRows.some(w => w.programApprovalPending === true)) {
      setApproveAssignFeePolicyError(null)
      setApproveAssignStep('guide')
      return
    }

    const unapprovedRows = selectedWaitingRows.filter(w => {
      const participating = instructorList.find(
        r => r.id === getWaitingInstructorRowInstructorId(w)
      )
      return !isWaitingInstructorProgramApproved(
        w.instructorName,
        participating,
        instructorApplications.rows
      )
    })

    if (unapprovedRows.length > 0) {
      if (selectedWaitingRows.length > 1) {
        showAlert({
          title: '안내',
          content: INSTRUCTOR_ASSIGN_SELECT_UNAPPROVED_SINGLE_ONLY_ALERT_MESSAGE,
        })
        return
      }
      const target = unapprovedRows[0]!
      const participating = instructorList.find(
        r => r.id === getWaitingInstructorRowInstructorId(target)
      )
      setSelectAssignPendingInstructor({
        id: target.id,
        name: target.instructorName,
        instructorFeeGradeLabel: resolveWaitingInstructorFeeGradeLabel(
          target.instructorName,
          participating,
          instructorApplications.rows
        ),
      })
      setSelectAssignNewGuideOpen(true)
      return
    }

    setSelectAssignConfirmOpen(true)
  }, [instructorApplications.rows, selectedWaitingRows, instructorList, showAlert, isCompanySchool])

  /** 배정 취소 확인 모달에서 "배정 취소" 클릭 시 */
  const handleUnassignConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedAssignedKeys.length === 0) return
      // 1사1교: 기존대로 취소 귀책 필수. 일반 기관형: 시안대로 귀책 미입력(API 선택값 — 생략 시 서버 ADMIN)
      if (isCompanySchool && payload.faultParty !== 'USER' && payload.faultParty !== 'ADMIN') return
      const removedRows = assignedRows.filter(r => selectedAssignedKeys.includes(r.id))
      const removedInstructorNames = removedRows.map(r => r.instructorName)
      const cancelBody = isCompanySchool
        ? toInstructorAssignmentCancelRequest({
            reason: payload.reason,
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            faultParty: payload.faultParty as 'USER' | 'ADMIN',
          })
        : toInstitutionDetailAssignmentCancelRequest(payload, unassignNotificationSent)

      if (assignmentBoardRemoteEnabled) {
        if (unassignSubmitting) return
        setUnassignSubmitting(true)
        const cancelledNames: string[] = []
        try {
          for (const removed of removedRows) {
            const assignmentId = removed.assignmentId ?? removed.id
            if (!assignmentId) continue
            await cancelInstructorAssignmentRemote(String(assignmentId), cancelBody)
            cancelledNames.push(removed.instructorName)
          }
          await invalidateAssignmentBoard()
        } catch (error) {
          if (cancelledNames.length > 0) await invalidateAssignmentBoard()
          showAlert({
            title: '배정 취소 실패',
            content:
              cancelledNames.length > 0
                ? `${cancelledNames.join(', ')} 강사님의 배정은 취소되었으나, 나머지 강사님의 배정 취소에 실패했습니다.\n목록을 확인한 뒤 다시 시도해 주세요.`
                : getGeneralProgramApiErrorMessage(
                    error,
                    '강사 배정 취소에 실패했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.'
                  ),
          })
          if (cancelledNames.length > 0) {
            setUnassignConfirmOpen(false)
            setSelectedAssignedKeys([])
          }
          return
        } finally {
          setUnassignSubmitting(false)
        }
      } else if (!isCompanySchool) {
        void showAlert({
          title: PROGRAM_API_UNAVAILABLE_TITLE,
          content: buildProgramApiUnavailableSaveContent('강사 배정 취소'),
        })
        return
      } else {
        const newFormList: InstructorListFormInstructor[] = instructors
          .filter(inv => !selectedAssignedKeys.includes(inv.id))
          .map(({ id, role, instructorName, contact, email }) => ({
            id,
            role,
            instructorName,
            contact,
            email,
          }))
        onSaveInstructorInfo?.(detail.id, newFormList)
      }

      setAssignedScheduleLinesByInstructorId(prev => {
        const next = { ...prev }
        selectedAssignedKeys.forEach(key => {
          delete next[String(key)]
        })
        return next
      })
      setUnassignConfirmOpen(false)
      setSelectedAssignedKeys([])
      if (!isCompanySchool) {
        // 시안 13 — 일반 기관형 취소 완료
        showAlert({ title: '취소 완료', content: '취소되었습니다.' })
        return
      }
      setUnassignCompleteModal({
        instructorNames: removedInstructorNames,
        targetNames: [row.schoolName],
        reason: payload.reason,
      })
    },
    [
      unassignNotificationSent,
      unassignSubmitting,
      selectedAssignedKeys,
      assignedRows,
      instructors,
      detail.id,
      onSaveInstructorInfo,
      row.schoolName,
      isCompanySchool,
      assignmentBoardRemoteEnabled,
      invalidateAssignmentBoard,
      showAlert,
    ]
  )

  const applyRoleChange = useCallback(
    async (instructorId: string, newRole: InstructorRoleKey) => {
      if (assignmentBoardRemoteEnabled) {
        // 대표 강사 지정·해제 모두 같은 API. 해제(일반 강사)는 scheduleLead=false.
        const isDemote = newRole !== 'lead'
        const target = assignedRows.find(r => r.id === instructorId)
        const memberId = Number(target?.instructorMemberId)
        const orgAppId = Number(row.organizationApplicationId)
        const scheduleId = Number(target?.scheduleId)
        if (
          !Number.isFinite(memberId) ||
          memberId <= 0 ||
          !Number.isFinite(orgAppId) ||
          orgAppId <= 0
        ) {
          showAlert({
            title: '안내',
            content:
              '대표 강사 변경에 필요한 instructorMemberId / organizationApplicationId가 없습니다.',
          })
          return
        }
        try {
          await putRepresentativeInstructorRemote(programId, {
            instructorMemberId: memberId,
            organizationApplicationId: orgAppId,
            ...(Number.isFinite(scheduleId) && scheduleId > 0 ? { scheduleId } : {}),
            ...(isDemote ? { scheduleLead: false } : {}),
          })
          await invalidateAssignmentBoard()
          setOpenRoleDropdownId(null)
          return
        } catch (error) {
          setOpenRoleDropdownId(null)
          showAlert({
            title: isDemote ? '일반 강사 변경 실패' : '대표 강사 변경 실패',
            content: getGeneralProgramApiErrorMessage(
              error,
              isDemote
                ? '일반 강사 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.'
                : '대표 강사 지정에 실패했습니다. 잠시 후 다시 시도해 주세요.'
            ),
          })
          return
        }
      }

      if (!isCompanySchool) {
        void showAlert({
          title: PROGRAM_API_UNAVAILABLE_TITLE,
          content: buildProgramApiUnavailableSaveContent('대표 강사 변경'),
        })
        return
      }

      const updated = instructors.map(inv => ({
        ...inv,
        role: inv.id === instructorId ? newRole : newRole === 'lead' ? 'assistant' : inv.role,
      }))
      const formList: InstructorListFormInstructor[] = updated.map(
        ({ id, role, instructorName, contact, email }) => ({
          id,
          role,
          instructorName,
          contact,
          email,
        })
      )
      onSaveInstructorInfo?.(detail.id, formList)
      setOpenRoleDropdownId(null)
    },
    [
      instructors,
      detail.id,
      onSaveInstructorInfo,
      isCompanySchool,
      assignmentBoardRemoteEnabled,
      assignedRows,
      row.organizationApplicationId,
      programId,
      invalidateAssignmentBoard,
      showAlert,
    ]
  )
  const handleRoleChange = useCallback(
    (instructorId: string, newRole: InstructorRoleKey) => {
      const roleSource = assignmentBoardRemoteEnabled ? assignedRows : instructors
      // 일반 기관형: 대표 강사는 반드시 1명 — 대표 → 일반 직접 전환은 막고 안내만 띄운다 (1사1교 기존 동작 유지)
      if (
        !isCompanySchool &&
        newRole !== 'lead' &&
        roleSource.find(inv => inv.id === instructorId)?.role === 'lead'
      ) {
        setOpenRoleDropdownId(null)
        showAlert({
          title: LEAD_INSTRUCTOR_TYPE_CHANGE_BLOCKED_TITLE,
          content: LEAD_INSTRUCTOR_TYPE_CHANGE_BLOCKED_CONTENT,
        })
        return
      }
      if (newRole === 'lead') {
        const currentLead = roleSource.find(inv => inv.role === 'lead')
        const target = roleSource.find(inv => inv.id === instructorId)
        if (currentLead && currentLead.id !== instructorId && target) {
          setLeadRoleChangeConfirm({
            instructorId,
            newLeadInstructorName: target.instructorName,
          })
          setOpenRoleDropdownId(null)
          return
        }
      }
      void applyRoleChange(instructorId, newRole)
    },
    [instructors, assignedRows, assignmentBoardRemoteEnabled, applyRoleChange, isCompanySchool, showAlert]
  )

  const assignedInstructorColumns: ColumnsType<AssignedInstructorDisplayRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '역할',
        dataIndex: 'role',
        key: 'role',
        width: 116,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (role: InstructorRoleKey, record: AssignedInstructorDisplayRow) =>
          record.assignmentCancelled ? (
            <StatusTag label="배정 취소" tone="gray" mutedLabel />
          ) : (
            <StatusDropdownCell<InstructorRoleKey>
              status={role}
              statusOptions={['lead', 'assistant']}
              getTag={getInstructorRoleTag}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={key => handleRoleChange(record.id, key as InstructorRoleKey)}
              isOpen={openRoleDropdownId === record.id}
              onOpenChange={open => setOpenRoleDropdownId(open ? record.id : null)}
              emptyPlaceholder="-"
            />
          ),
      },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: TABLE_COLUMN_WIDTHS.name,
        render: (v: string | undefined) => (v ? v : '-'),
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: TABLE_COLUMN_WIDTHS.address,
        ellipsis: true,
        render: (v: string | undefined) => (
          <PrivacyHomeAddressDisplay address={v} revealed={!privacyMasked} />
        ),
      },
      {
        title: '기관과의 거리',
        dataIndex: 'distanceToSchool',
        key: 'distanceToSchool',
        width: TABLE_COLUMN_WIDTHS.distance,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '담당 교육 진행 일정',
        dataIndex: 'assignedDate',
        key: 'assignedDate',
        // 넓은 화면 남는 폭은 공통 규칙(열 폭 비율)으로 배분 — 일정이 가장 넓어 가장 많이 늘어남
        width: TABLE_COLUMN_WIDTHS.scheduleMin,
        align: 'center',
        render: (v: string | undefined, record: AssignedInstructorDisplayRow) => {
          if (record.assignedScheduleLine) {
            return renderProgramDetailPipeSeparated(
              formatCmsScheduleDisplayLabel(record.assignedScheduleLine)
            )
          }
          const date = v ? formatCmsScheduleDisplayLabel(v) : '-'
          const time = record.assignedTime ?? '-'
          if (!date && !time) return '-'
          return (
            <span className="school-detail-fullpage-view__assigned-datetime-cell">
              <span>{date}</span>
              <TdDivider />
              <span>{time}</span>
            </span>
          )
        },
      },
      {
        title: '정산 현황',
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 120,
        align: 'center',
        render: (status: InstructorSettlementUiStatus) => (
          <InstructorSettlementStatusText status={status} />
        ),
      },
    ],
    [openRoleDropdownId, handleRoleChange, privacyMasked]
  )

  const waitingInstructorColumns: ColumnsType<WaitingInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: TABLE_COLUMN_WIDTHS.name,
        render: (v: string | undefined) => (v ? v : '-'),
      },
      {
        title: '자택 주소지',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: TABLE_COLUMN_WIDTHS.address,
        ellipsis: true,
        render: (v: string | undefined) => (
          <PrivacyHomeAddressDisplay address={v} revealed={!privacyMasked} />
        ),
      },
      {
        title: '기관과의 거리',
        dataIndex: 'distanceToSchool',
        key: 'distanceToSchool',
        width: TABLE_COLUMN_WIDTHS.distance,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '교육 진행 희망 일정',
        dataIndex: 'hopeDate',
        key: 'hopeDate',
        // 넓은 화면 남는 폭은 공통 규칙(열 폭 비율)으로 배분 — 일정이 가장 넓어 가장 많이 늘어남
        width: TABLE_COLUMN_WIDTHS.scheduleMin,
        align: 'center',
        render: (v: string | undefined, record: WaitingInstructorRow) => {
          if (record.hopeScheduleLine) {
            return renderProgramDetailPipeSeparated(
              formatCmsScheduleDisplayLabel(record.hopeScheduleLine)
            )
          }
          const date = v ? formatCmsScheduleDisplayLabel(v) : '-'
          const time = record.hopeTime ?? '-'
          const session = record.hopeSession
          if (date === '-' && time === '-') return '-'
          const dateTime =
            date !== '-' && time !== '-' ? `${date} ${time}` : date !== '-' ? date : time
          if (!session) return dateTime
          return (
            <span className="school-detail-fullpage-view__assigned-datetime-cell">
              <span>{dateTime}</span>
              <TdDivider />
              <span>{session}</span>
            </span>
          )
        },
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: TABLE_COLUMN_WIDTHS.status,
        align: 'center',
        render: (status: WaitingInstructorRow['assignmentStatus']) => (
          <ProgramAssignmentStatusText status={status} context="school-instructor" />
        ),
      },
    ],
    [privacyMasked]
  )

  const assignedInstructorExportColumns: ColumnsType<{
    no: number
    role: string
    instructorName: string
    homeAddress: string
    distanceToSchool: string
    assignedSchedule: string
    settlementStatus: string
  }> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '역할', dataIndex: 'role', key: 'role' },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName' },
      { title: '자택 주소지', dataIndex: 'homeAddress', key: 'homeAddress' },
      { title: '기관과의 거리', dataIndex: 'distanceToSchool', key: 'distanceToSchool' },
      { title: '담당 교육 진행 일정', dataIndex: 'assignedSchedule', key: 'assignedSchedule' },
      { title: '정산 현황', dataIndex: 'settlementStatus', key: 'settlementStatus' },
    ],
    []
  )

  const waitingInstructorExportColumns: ColumnsType<{
    no: number
    instructorName: string
    homeAddress: string
    distanceToSchool: string
    hopeSchedule: string
    assignmentStatus: string
  }> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName' },
      { title: '자택 주소지', dataIndex: 'homeAddress', key: 'homeAddress' },
      { title: '기관과의 거리', dataIndex: 'distanceToSchool', key: 'distanceToSchool' },
      { title: '교육 진행 희망 일정', dataIndex: 'hopeSchedule', key: 'hopeSchedule' },
      { title: '배정 현황', dataIndex: 'assignmentStatus', key: 'assignmentStatus' },
    ],
    []
  )

  const assignedInstructorExportRows = useMemo(
    () =>
      assignedRows.map(row => ({
        id: row.id,
        no: row.no,
        role: INSTRUCTOR_ROLE_LABELS[row.role],
        instructorName: row.instructorName,
        homeAddress: displayServerPiiAsIs(row.homeAddress),
        distanceToSchool: row.distanceToSchool ?? '-',
        assignedSchedule: formatAssignedInstructorScheduleExport(row),
        settlementStatus: getInstructorSettlementStatusLabel(row.settlementStatus),
      })),
    [assignedRows]
  )

  const waitingInstructorExportRows = useMemo(
    () =>
      waitingRows.map(row => ({
        id: row.id,
        no: row.no,
        instructorName: row.instructorName,
        homeAddress: displayServerPiiAsIs(row.homeAddress),
        distanceToSchool: row.distanceToSchool ?? '-',
        hopeSchedule: formatWaitingInstructorHopeScheduleExport(row),
        assignmentStatus: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[row.assignmentStatus],
      })),
    [waitingRows]
  )

  const {
    exportExcel: exportAssignedInstructorsExcel,
    isExporting: isAssignedInstructorsExcelExporting,
  } = useTableExcelExport({
    accessLog: { downloadKind: 'PROGRAM_SCHOOL_INSTRUCTOR_ASSIGNMENT_EXPORT', containedPiiTypes: ['NAME'] },
    columns: assignedInstructorExportColumns,
    data: assignedInstructorExportRows,
    filename: '배정된 강사 목록',
    selectedRowKeys: selectedAssignedKeys,
  })

  const {
    exportExcel: exportWaitingInstructorsExcel,
    isExporting: isWaitingInstructorsExcelExporting,
  } = useTableExcelExport({
    accessLog: { downloadKind: 'PROGRAM_SCHOOL_INSTRUCTOR_ASSIGNMENT_EXPORT', containedPiiTypes: ['NAME'] },
    columns: waitingInstructorExportColumns,
    data: waitingInstructorExportRows,
    filename: '배정 대기 강사 목록',
    selectedRowKeys: selectedWaitingKeys,
  })

  /** 기본 정보 — 상단(진행·교재) / 하단(기관·신청) 테이블 분리 (시안) */
  const hasSelectedTextbook =
    ((mergedDetail.textbookId?.trim() ?? '') !== '' &&
      mergedDetail.textbookId?.trim() !== TEXTBOOK_NOT_USED_OPTION_VALUE) ||
    ((mergedDetail.textbookName?.trim() ?? '') !== '' &&
      mergedDetail.textbookName?.trim() !== '해당 없음')
  const textbookStatusCell =
    onTextbookStatusChange != null && hasSelectedTextbook ? (
      <StatusDropdownCell<TextbookStatusKey>
        status={mergedDetail.textbookStatus}
        statusOptions={TEXTBOOK_STATUS_OPTION_KEYS.filter(key => key !== 'not_applicable')}
        getTag={getTextbookStatusTag}
        isItemDisabled={(cur, opt) => cur === opt}
        onChange={newStatus => onTextbookStatusChange(detail.id, newStatus)}
        isOpen={textbookStatusDropdownOpen}
        onOpenChange={setTextbookStatusDropdownOpen}
      />
    ) : (
      <StatusTag {...getTextbookStatusTag(mergedDetail.textbookStatus)} />
    )

  const textbookNameView = textbookDisplay.textbookName?.trim() || '-'
  const kitsAndQty = hasSelectedTextbook
    ? formatParticipatingInstitutionKitQuantity(
        textbookDisplay.textbookKits,
        textbookDisplay.textbookQuantity,
        { showZero: true }
      )
    : '-'

  const textbookSelectOptions = ensureTextbookNotUsedSelectOption(textbookOptions)
  const textbookSelectEditCell =
    isApplicationInfoEditing && applicationInfoDraft && canEditTextbook ? (
      <div className="institution-basic-info__field-stack school-detail-fullpage-view__textbook-select-only">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="small"
          placeholder="교재명 선택"
          withAllOption={false}
          value={applicationInfoDraft.textbookId || TEXTBOOK_NOT_USED_OPTION_VALUE}
          options={textbookSelectOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const selected = textbookSelectOptions.find(option => option.value === value)
            const isNotUsed = value === TEXTBOOK_NOT_USED_OPTION_VALUE
            updateApplicationInfoDraft({
              textbookId: isNotUsed
                ? TEXTBOOK_NOT_USED_OPTION_VALUE
                : (selected?.value ?? String(value ?? '')),
              textbookName: isNotUsed ? '해당 없음' : (selected?.textbookName ?? ''),
            })
          }}
        />
      </div>
    ) : null

  const handleConfirmApplicationNotificationResend = useCallback(
    async (payload: PermissionModalPayload) => {
      if (notificationResendSubmitting) return
      if (!organizationApplicationIdForDetail) return
      if (
        payload.notifyTiming === 'manual' &&
        (!payload.manualNotifyAt || !payload.manualNotifyAt.isAfter(new Date()))
      ) {
        void showAlert({
          title: '예약 발송 일시 확인',
          content: '예약 발송 일시는 현재 시각보다 이후로 설정해 주세요.',
        })
        return
      }
      const notifyOptions = toApplicantNotificationResendNotifyOptions(payload)
      if (applicationApprovalStatus === 'rejected' && !payload.reason.trim()) {
        void showAlert({
          title: '반려 사유 확인',
          content: '반려 알림 재발송 시 사유를 입력해 주세요.',
        })
        return
      }
      setNotificationResendSubmitting(true)
      try {
        await resendGeneralOrganizationApplicationNotification(
          organizationApplicationIdForDetail,
          {
            timing: notifyOptions.notifyTiming === 'manual' ? 'SCHEDULED' : 'IMMEDIATE',
            scheduledAt:
              notifyOptions.notifyTiming === 'manual'
                ? (notifyOptions.manualNotifyAt?.toISOString() ?? null)
                : null,
            reason: applicationApprovalStatus === 'rejected' ? payload.reason.trim() : null,
          },
          `org-${organizationApplicationIdForDetail}-${crypto.randomUUID()}`
        )
        setNotificationResendOpen(false)
        await queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.organizationDetailInProgram(
            programId,
            organizationApplicationIdForDetail
          ),
        })
        showNotificationResendRequestCompletedAlert()
      } catch (error) {
        void showAlert({
          title: '알림 재발송 실패',
          content: getGeneralProgramApiErrorMessage(error, '알림 재발송에 실패했습니다.'),
        })
      } finally {
        setNotificationResendSubmitting(false)
      }
    },
    [
      applicationApprovalStatus,
      notificationResendSubmitting,
      organizationApplicationIdForDetail,
      programId,
      queryClient,
      showAlert,
    ]
  )

  const programApprovalStatusCell =
    applicationApprovalStatus != null ? (
      <ProgramApprovalStatusDetailValue
        status={applicationApprovalStatus}
        participationRejectionReason={mergedDetail.participationRejectionReason}
        approvalNotificationSentAt={mergedDetail.resultNotificationSentAt}
        onResendNotificationClick={
          canResendApplicationNotification ? () => setNotificationResendOpen(true) : undefined
        }
      />
    ) : null

  const textbookCell =
    isApplicationInfoEditing && canEditTextbook ? (
      textbookSelectEditCell
    ) : !hasSelectedTextbook ? (
      '-'
    ) : (
      <div className="participating-institution-application-info__textbook-value">
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([textbookNameView, kitsAndQty, textbookStatusCell])}
        </ProgramDetailTdSegmentWrap>
      </div>
    )

  const combinedClassProgramEligible =
    isCombinedClassProgramEligibleFlag ?? isCombinedClassProgramEligible(program)

  const combinedClassCell =
    isApplicationInfoEditing && applicationInfoDraft ? (
      <InstitutionCombinedClassEditCell
        combinedClassApplication={applicationInfoDraft.combinedClassApplication}
        partnerIds={applicationInfoDraft.combinedClassPartnerSchoolIds}
        onCombinedClassApplicationChange={next =>
          combinedClassProcess.onApplicationChange(
            next,
            next === '신청' ? applicationInfoDraft.combinedClassPartnerSchoolIds : []
          )
        }
        onPartnerIdsChange={partnerIds =>
          combinedClassProcess.onPartnerIdsChange(
            partnerIds,
            applicationInfoDraft.combinedClassApplication
          )
        }
        sameSchoolGradeOptions={sameSchoolGradeOptions}
        isProgramEligible={combinedClassProgramEligible}
        isApplyRadioDisabled={isCombinedClassApplyRadioDisabled}
        readOnly={combinedClassReadOnly}
      />
    ) : (
      buildCombinedClassViewValue(mergedDetail, combinedClassProgramEligible)
    )

  const isApplicationDetailEditing = isApplicationInfoEditing && applicationInfoDraft != null

  const classCountOptions = useMemo(
    () => buildInstitutionClassCountOptions(resolveProgramParticipantMaxClassCount(program)),
    [program]
  )
  const classAndCountDisplay = isApplicationDetailEditing ? (
    <InstitutionClassAndStudentCountEdit
      classCount={applicationInfoDraft.classCount}
      studentCount={applicationInfoDraft.studentCount}
      classCountOptions={classCountOptions}
      onChange={patch => updateApplicationInfoDraft(patch)}
    />
  ) : (
    withProgramDetailTdDivider(
      formatClassStudentCountSegments(mergedDetail.classCount, mergedDetail.studentCount)
    )
  )

  return (
    <div className="school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={activeTab}
        onChange={key => setActiveTab(key as SchoolDetailTabKey)}
        items={visibleDetailTabs.map(key => ({
          key,
          label: SCHOOL_DETAIL_TAB_LABELS[key as GeneralParticipatingInstitutionDetailTabKey],
          disabled: isSchoolDetailTabDisabled(key),
          title: isSchoolDetailTabDisabled(key) ? '해당 화면은 준비 중입니다.' : undefined,
        }))}
        trailing={
          activeTab === 'application' ? (
            <>
              {!isApplicationInfoEditing && showActivityWithdrawButton ? (
                <CmsButton
                  variant="delete"
                  size="h40"
                  disabled={!canRequestActivityWithdraw || activityWithdrawSubmitting}
                  onClick={handleRequestActivityWithdraw} >
                  활동 포기
                </CmsButton>
              ) : null}
              <ProgramEditInfoActions
                size="h40"
                isEditing={isApplicationInfoEditing}
                idleVariant="secondary"
                onEdit={requestStartApplicationInfoEdit}
                onCancel={cancelApplicationInfoEditAndRemask}
                saving={scheduleChangeSaving}
                onSave={() => {
                  void handleApplicationInfoSave()
                }} />
              {!isApplicationInfoEditing ? (
                <>
                  {showAdminCommentSection ? (
                    <CmsButton
                      variant="primary"
                      size="h40"
                      onClick={handleAdminCommentEditEnter} >
                      코멘트 작성
                    </CmsButton>
                  ) : null}
                  <PersonalInfoRevealButton disabled={programPrivacyPending}
                    labelMode="toggle"
                    revealed={personalInfoRevealed}
                    cmsSize="h40"
                    onClick={handlePrivacyToggleClick} />
                </>
              ) : null}
            </>
          ) : activeTab === 'posts' ? (
            <CmsButton
              variant="primary"
              size="large"
              onClick={() => setPostWriteModalOpen(true)} >
              게시글 등록
            </CmsButton>
          ) : null
        }
      />

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {activeTab === 'application' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__application-tab">
            <ParticipatingInstitutionApplicationInfo
              copyVariant={isCompanySchool ? 'default' : 'general-institution'}
              isBasicInfoEditing={isApplicationInfoEditing}
              showAdminComment={showAdminCommentSection}
              adminComment={mergedDetail.adminComment}
              isAdminCommentEditing={false}
              adminCommentError={adminCommentError}
              programProgressCell={<ProgramEnrollmentStatusText status={programProgressStatus} />}
              programApprovalStatusCell={programApprovalStatusCell}
              textbookCell={textbookCell}
              combinedClassCell={combinedClassCell}
              hideCombinedClass={!isGeneralOrganizationProgram(program)}
              schoolName={
                isApplicationDetailEditing ? (
                  <InstitutionReadonlyInput width={240} value={mergedDetail.schoolName ?? ''} />
                ) : (
                  mergedDetail.schoolName
                )
              }
              educationGrade={
                isApplicationDetailEditing ? (
                  <InstitutionGradeSelectEdit
                    value={applicationInfoDraft.educationGrade}
                    onChange={value => updateApplicationInfoDraft({ educationGrade: value })}
                  />
                ) : (
                  mergedDetail.educationGrade
                )
              }
              region={
                isApplicationDetailEditing ? (
                  <InstitutionReadonlyInput value={mergedDetail.region ?? ''} />
                ) : (
                  mergedDetail.region
                )
              }
              addressDetail={
                isApplicationDetailEditing ? (
                  <InstitutionAddressDetailEdit
                    value={applicationInfoDraft.addressDetail}
                    onChange={value => updateApplicationInfoDraft({ addressDetail: value })}
                  />
                ) : (
                  (mergedDetail.addressDetail ?? '-')
                )
              }
              classAndCount={classAndCountDisplay}
              educationFormat={
                isApplicationDetailEditing && showEducationFormatField ? (
                  <InstitutionEducationFormatRadios
                    value={applicationInfoDraft.educationFormat}
                    onChange={value => updateApplicationInfoDraft({ educationFormat: value })}
                  />
                ) : (
                  (mergedDetail.educationFormat ?? '-')
                )
              }
              teacherInfo={
                isApplicationDetailEditing ? (
                  <InstitutionTeacherEdit
                    name={applicationInfoDraft.teacherName}
                    phone={applicationInfoDraft.teacherPhone}
                    mobile={applicationInfoDraft.teacherMobile}
                    email={applicationInfoDraft.teacherEmail}
                    teacherOptions={teacherOptions}
                    isTeacherOptionsLoading={isTeacherOptionsLoading}
                    onChange={patch => updateApplicationInfoDraft(patch)}
                  />
                ) : teacherDisplaySegments.length > 0 ? (
                  withProgramDetailTdDivider(teacherDisplaySegments)
                ) : (
                  '-'
                )
              }
              applicationReason={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.applicationReason}
                    onChange={value => updateApplicationInfoDraft({ applicationReason: value })}
                    placeholder="신청 사유를 입력해 주세요."
                  />
                ) : (
                  (mergedDetail.applicationReason ?? '-')
                )
              }
              otherRequests={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.otherRequests}
                    onChange={value => updateApplicationInfoDraft({ otherRequests: value })}
                    placeholder="기타 요청사항을 입력해 주세요."
                  />
                ) : (
                  (mergedDetail.otherRequests ?? '-')
                )
              }
              computerInRoom={mergedDetail.computerInRoom ?? '-'}
              waitingPlace={mergedDetail.waitingRoomLocation ?? '-'}
              mealInfo={mealDisplay}
              otherNotes={mergedDetail.parkingInfo ?? '-'}
              criminalCheck={formatGuidanceSegmentValue(mergedDetail.criminalCheckRequest)}
              program={program}
              sessions={applicationTabScheduleSessions}
              scheduleSessionsEmptyMessage={applicationTabScheduleEmptyMessage}
              useCompanySchoolScheduleFormat={isCompanySchool}
              scheduleTitleTrailing={
                isApplicationInfoEditing && canChangeEducationSchedule ? (
                  <CmsButton
                    variant="secondary"
                    size="h40"
                    disabled={scheduleChangeLines.length === 0 || scheduleChangeSaving}
                    onClick={() => setScheduleChangeModalOpen(true)} >
                    일정 변경
                  </CmsButton>
                ) : null
              }
            />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="program-detail-fullpage-modal__info-tab">
            <SchoolDetailStudentListSection
              schoolId={detail.id}
              studentCount={detail.studentCount}
              classCount={mergedDetail.classCount}
              registeredGradeBlocks={mergedDetail.gradeBlocks}
              schoolName={mergedDetail.schoolName ?? row.schoolName ?? ''}
              educationGrade={mergedDetail.educationGrade ?? ''}
              organizationApplicationId={row.organizationApplicationId}
              programId={program.id}
              programTitle={program.mainTitle ?? program.title ?? ''}
              programStartDate={program.startDate}
              programEndDate={program.endDate}
              participationAppliedAt={mergedDetail.participationAppliedAt}
              activityWithdrawn={isActivityWithdrawn}
              hasStudentSatisfactionSurvey={normalizeGeneralSurveyMenuKeys(
                program.generalSurveyMenuKeys ?? []
              ).includes('satisfaction')}
              readOnly={false}
              showAddStudentCompletedAlert={!isCompanySchool}
              hideExcelInEditMode={!isCompanySchool}
              addStudentModalDescription={
                isCompanySchool ? undefined : GENERAL_INSTITUTION_ADD_STUDENT_DESCRIPTION
              }
              onAddStudent={() => {
                // 참여 기관 목록 「총 학생 수」 등 기관 단위 집계 갱신
                void queryClient.invalidateQueries({
                  queryKey: generalProgramProgressQueryKeys.institutions(programId),
                })
              }}
              onViewDetail={() => {}}
              onSaveEdit={() => {}}
            />
          </div>
        )}

        {activeTab === 'instructors' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__instructor-tab">
            {/* 섹션 1: 배정된 강사 목록 */}
            <div className="school-detail-fullpage-view__instructor-section">
              <div className="table-header-actions">
                <div className="table-header-title--wrapper">
                  <span className="table-title">배정된 강사 목록</span>
                  <span className="table-description">
                    {isCompanySchool
                      ? `${currentAssignedCount} / ${requiredInstructorCount}명`
                      : `총 ${assignedTableRows.length}건`}
                  </span>
                </div>
                <div className="info-section-buttons--wrapper">
                  <CmsButton variant="delete" size="h40" onClick={handleUnassignClick}>
                    배정 취소
                  </CmsButton>
                  <CmsButton
                    variant="secondary"
                    size="h40" className="school-detail-fullpage-view__btn-assign participating-institutions-section__btn-approve"
                    onClick={() => {
                      if (currentAssignedCount >= requiredInstructorCount) {
                        setAddAssignOverflowOpen(true)
                      } else {
                        setAddAssignModalOpen(true)
                      }
                    }} >
                    추가 배정
                  </CmsButton>
                  <ExcelButton
                    onClick={exportAssignedInstructorsExcel}
                    loading={isAssignedInstructorsExcelExporting} />
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__assignment-table-scroll">
                <CmsDataTable<AssignedInstructorDisplayRow>
                  className="participating-institutions-section__table cms-data-table"
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  scroll={{ x: 1100 }}
                  rowSelection={{
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: selectedAssignedKeys,
                    onChange: keys => setSelectedAssignedKeys(keys),
                    getCheckboxProps: record => ({ disabled: record.assignmentCancelled === true }),
                  }}
                  columns={assignedInstructorColumns}
                  dataSource={assignedTableRows}
                  locale={{ emptyText: renderAssignedInstructorTableEmpty(!isCompanySchool) }}
                />
              </div>
            </div>

            {/* 섹션 2: 배정 대기 강사 목록 */}
            <div className="school-detail-fullpage-view__instructor-section school-detail-fullpage-view__instructor-section--waiting">
              <div className="table-header-actions">
                <div className="table-header-title--wrapper">
                  <span className="table-title">배정 대기 강사 목록</span>
                  <span className="table-description">
                    {isCompanySchool ? `${waitingRows.length}건` : `총 ${waitingRows.length}건`}
                  </span>
                </div>
                <div className="info-section-buttons--wrapper">
                  {showRequestedScheduleConfirmAction ? (
                    <CmsButton
                      variant="secondary"
                      size="h40"
                      onClick={() => setRequestedScheduleConfirmOpen(true)} >
                      {requestedScheduleAlreadyConfirmed ? '희망 일정 변경' : '희망 일정 확정'}
                    </CmsButton>
                  ) : null}
                  <CmsButton
                    variant="secondary"
                    size="h40" className="school-detail-fullpage-view__btn-assign participating-institutions-section__btn-approve"
                    onClick={handleSelectAssignClick} >
                    선택 배정
                  </CmsButton>
                  <ExcelButton
                    onClick={exportWaitingInstructorsExcel}
                    loading={isWaitingInstructorsExcelExporting} />
                </div>
              </div>
              <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__waiting-table-scroll">
                <CmsDataTable<WaitingInstructorRow>
                  className="participating-institutions-section__table cms-data-table"
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  scroll={{ x: 1000 }}
                  rowSelection={{
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys: selectedWaitingKeys,
                    onChange: keys => setSelectedWaitingKeys(keys),
                    getCheckboxProps: record => ({
                      disabled: record.assignmentStatus === 'unavailable',
                    }),
                  }}
                  columns={waitingInstructorColumns}
                  dataSource={waitingRows}
                  locale={{ emptyText: renderWaitingInstructorTableEmpty(!isCompanySchool) }}
                  rowClassName={record => getProgramAssignmentRowClass(record.assignmentStatus, "school-instructor")}
                />
              </div>
            </div>

            <SchoolDetailAssignOverflowModal
              open={addAssignOverflowOpen}
              onCancel={() => setAddAssignOverflowOpen(false)}
              requiredCount={requiredInstructorCount}
              variant="add"
              onConfirm={() => {
                setAddAssignOverflowOpen(false)
                setAddModalOpenedFromOverflow(true)
                setAddAssignModalOpen(true)
              }}
            />
            <SchoolDetailAddInstructorAssignModal
              copyVariant={isCompanySchool ? 'default' : 'general-institution'}
              open={addAssignModalOpen}
              onCancel={() => {
                setAddAssignModalOpen(false)
                setAddModalOpenedFromOverflow(false)
              }}
              programId={String(program.id)}
              schoolId={row.id}
              schoolName={row.schoolName}
              schoolSessions={instructorAssignScheduleSessions}
              participatingInstructorList={instructorList}
              participatingSchoolList={participatingSchoolList}
              assignedInstructorNames={assignedInstructorNames}
              instructorOptions={addAssignInstructorOptions}
              currentLeadInstructorName={currentLeadName}
              currentAssignedCount={currentAssignedCount}
              requiredInstructorCount={requiredInstructorCount}
              overflowAlreadyConfirmed={addModalOpenedFromOverflow}
              onAdd={(_instructorId, role, option, _meta) => {
                void (async () => {
                  if (assignmentBoardRemoteEnabled) {
                    const orgAppId = row.organizationApplicationId
                    if (!orgAppId) {
                      showAlert({
                        title: '안내',
                        content:
                          '기관 신청 ID가 없어 배정할 수 없습니다. 참여 기관 API에 organizationApplicationId(sourceApplicationId) 매핑이 필요합니다.',
                      })
                      return
                    }
                    if (!assignmentBoard) {
                      showAlert({
                        title: '안내',
                        content: '배정 데이터를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
                      })
                      return
                    }

                    const memberId = Number(option.value)
                    if (!Number.isFinite(memberId) || memberId <= 0) {
                      showAlert({
                        title: '안내',
                        content: `강사 memberId가 없어 배정할 수 없습니다. (${option.label})`,
                      })
                      return
                    }

                    const sessionIds = _meta?.sessionIds ?? []
                    const selectedSessions = instructorAssignScheduleSessions.filter(session =>
                      sessionIds.includes(buildSchoolAddInstructorSessionSlotKey(row.id, session))
                    )
                    if (selectedSessions.length === 0) {
                      showAlert(NO_SELECTION_ALERT)
                      return
                    }

                    pendingAddAssignRef.current = { role, option, meta: _meta }
                    if (!isCompanySchool) {
                      // 일반 기관형 시안 08-1 → 10: 별도 알림 발송 선택 없이 바로 배정(즉시 발송)
                      void executeRemoteAddAssign({ reason: '', notifyTiming: 'immediate' })
                      return
                    }
                    setAddAssignNotifyInstructorName(option.label)
                    setAddAssignModalOpen(false)
                    setAddAssignNotifyOpen(true)
                    return
                  }

                  if (!isCompanySchool) {
                    void showAlert({
                      title: PROGRAM_API_UNAVAILABLE_TITLE,
                      content: buildProgramApiUnavailableSaveContent('강사 배정'),
                    })
                    return
                  }

                  const nextRole: InstructorRoleKey = instructors.length === 0 ? 'lead' : role
                  const existingFormList: InstructorListFormInstructor[] = instructors.map(
                    ({ id, role: r, instructorName, contact, email }) => ({
                      id,
                      role: nextRole === 'lead' ? 'assistant' : r,
                      instructorName,
                      contact,
                      email,
                    })
                  )
                  const newInstructor: InstructorListFormInstructor = {
                    id: option.value,
                    role: nextRole,
                    instructorName: option.label,
                    contact: option.contact ?? '',
                    email: option.email ?? '',
                  }
                  onSaveInstructorInfo?.(detail.id, [...existingFormList, newInstructor])
                  const scheduleLine = buildAssignedScheduleLineFromSessionIds(
                    row.id,
                    row.sessions,
                    _meta?.sessionIds
                  )
                  if (scheduleLine) {
                    setAssignedScheduleLinesByInstructorId(prev => ({
                      ...prev,
                      [option.value]: scheduleLine,
                    }))
                  }
                  setAddAssignModalOpen(false)
                  setAddModalOpenedFromOverflow(false)
                  setAssignCompleteModal({
                    instructorName: option.label,
                    schoolName: row.schoolName,
                    currentCount: instructors.length + 1,
                    showApprovalAlarmSection: _meta?.isNewApproval ?? false,
                  })
                })()
              }}
            />
            <RequestedScheduleConfirmModal
              key={requestedScheduleConfirmOpen ? 'requested-schedule-confirm-open' : 'closed'}
              open={requestedScheduleConfirmOpen}
              schoolName={row.schoolName}
              options={requestedScheduleConfirmOptions}
              maxScheduleCount={
                program.generalCommonInfo?.participantRecruitmentInfo?.maxScheduleCount ?? null
              }
              confirmLoading={requestedScheduleConfirmMutation.isPending}
              onCancel={() => setRequestedScheduleConfirmOpen(false)}
              onNotice={message => showAlert({ title: '선택 불가', content: message })}
              onConfirm={requestedScheduleIds => {
                requestedScheduleConfirmMutation.mutate(
                  { requestedScheduleIds },
                  {
                    onSuccess: () => {
                      setRequestedScheduleConfirmOpen(false)
                      showAlert({ title: '희망 일정 확정', content: '희망 일정을 확정했습니다.' })
                    },
                  }
                )
              }}
            />
            <SchoolDetailSelectAssignConfirmModal
              open={selectAssignConfirmOpen}
              copyVariant={isCompanySchool ? 'default' : 'general-institution'}
              onCancel={() => {
                pendingAssignNotifyRef.current = null
                setSelectAssignConfirmOpen(false)
              }}
              schoolName={row.schoolName}
              instructorNames={selectedWaitingRows.map(r => r.instructorName)}
              currentCount={currentAssignedCount}
              requiredCount={requiredInstructorCount}
              confirmLoading={assignSubmitting}
              onConfirm={payload => {
                pendingAssignNotifyRef.current = payload
                if (currentAssignedCount + selectedWaitingRows.length > requiredInstructorCount) {
                  setSelectAssignConfirmOpen(false)
                  setSelectAssignOverflowOpen(true)
                } else {
                  handleSelectAssignConfirm()
                }
              }}
            />
            <SchoolDetailSelectAssignConfirmModal
              open={addAssignNotifyOpen}
              onCancel={() => {
                if (assignSubmitting) return
                pendingAddAssignRef.current = null
                setAddAssignNotifyInstructorName('')
                setAddAssignNotifyOpen(false)
              }}
              schoolName={row.schoolName}
              instructorNames={addAssignNotifyInstructorName ? [addAssignNotifyInstructorName] : []}
              currentCount={currentAssignedCount}
              requiredCount={requiredInstructorCount}
              confirmLoading={assignSubmitting}
              onConfirm={payload => {
                void executeRemoteAddAssign(payload)
              }}
            />
            <SchoolDetailNewAssignGuideModal
              open={selectAssignNewGuideOpen}
              variant="guide-only"
              onCancel={() => {
                setSelectAssignNewGuideOpen(false)
                setSelectAssignPendingInstructor(null)
              }}
              instructorName={selectAssignPendingInstructor?.name ?? ''}
              schoolName={row.schoolName}
              currentCount={currentAssignedCount}
              requiredCount={requiredInstructorCount}
              onConfirm={() => {
                setSelectAssignNewGuideOpen(false)
                setSelectAssignFeeApprovalOpen(true)
              }}
            />
            <InstructorFeeApprovalModal
              open={selectAssignFeeApprovalOpen && selectAssignPendingInstructor != null}
              instructorName={selectAssignPendingInstructor?.name ?? ''}
              instructorFeeGradeLabel={selectAssignPendingInstructor?.instructorFeeGradeLabel}
              onCancel={() => {
                setSelectAssignFeeApprovalOpen(false)
                setSelectAssignPendingInstructor(null)
              }}
              onConfirm={() => {
                if (!selectAssignPendingInstructor) return
                const rowToAssign = waitingRows.find(r => r.id === selectAssignPendingInstructor.id)
                if (!rowToAssign) {
                  setSelectAssignFeeApprovalOpen(false)
                  setSelectAssignPendingInstructor(null)
                  return
                }
                if (currentAssignedCount >= requiredInstructorCount) {
                  setSelectAssignFeeApprovalOpen(false)
                  setSelectAssignOverflowOpen(true)
                  return
                }
                finalizeSelectAssign([rowToAssign], true)
              }}
            />
            <SchoolDetailNewAssignGuideModal
              open={approveAssignStep === 'guide'}
              variant="approve-and-assign"
              onCancel={closeApproveAssignFlow}
              instructorName={approveAssignSelection.firstUnapprovedInstructorName}
              schoolName={row.schoolName}
              currentCount={currentAssignedCount}
              requiredCount={requiredInstructorCount}
              selectedInstructorCount={approveAssignSelection.selectedInstructorCount}
              unapprovedInstructorCount={approveAssignSelection.unapprovedInstructorCount}
              onConfirm={() => setApproveAssignStep('fee')}
            />
            <InstructorFeeApprovalModal
              open={approveAssignStep === 'fee'}
              title="강사비 책정 및 배정 안내"
              confirmLabel="배정"
              notifyTimingCapability={
                approveAssignSelection.unapprovedInstructorCount ===
                approveAssignSelection.selectedInstructorCount
                  ? NOTIFY_TIMING_CAPABILITY.full
                  : NOTIFY_TIMING_CAPABILITY.scheduledOnly
              }
              instructorName={approveAssignUnapprovedNames[0] ?? ''}
              description={`${formatInstitutionApproveAssignFeeSubject(approveAssignUnapprovedNames)}의 강사비 책정 방식을 선택해 주세요\n선택한 방식으로 강사비가 책정되며, 회원에게 승인 알림이 발송됩니다.`}
              instructorFeeGradeLabel={approveAssignFeeGradeLabel}
              feePolicyContext={{ programWageGradeRows: program.generalCommonInfo?.wageGradeRows }}
              feePolicyError={approveAssignFeePolicyError}
              submitting={assignSubmitting}
              onCancel={() => {
                if (assignSubmitting) return
                closeApproveAssignFlow()
              }}
              onConfirm={handleApproveAssignFeeConfirm}
            />
            <SchoolDetailAssignOverflowModal
              open={approveAssignStep === 'overflow'}
              onCancel={() => {
                if (assignSubmitting) return
                pendingApproveAssignDetailRef.current = null
                setApproveAssignStep('fee')
              }}
              requiredCount={requiredInstructorCount}
              variant="select"
              onConfirm={() => {
                const detail = pendingApproveAssignDetailRef.current
                if (!detail) return
                void executeApproveAndAssign(detail)
              }}
            />
            <SchoolDetailAssignOverflowModal
              open={selectAssignOverflowOpen}
              onCancel={() => setSelectAssignOverflowOpen(false)}
              requiredCount={requiredInstructorCount}
              variant="select"
              onConfirm={() => {
                if (selectAssignPendingInstructor) {
                  const rowToAssign = waitingRows.find(
                    r => r.id === selectAssignPendingInstructor.id
                  )
                  if (rowToAssign) {
                    finalizeSelectAssign([rowToAssign], true)
                  }
                } else {
                  handleSelectAssignConfirm()
                }
                setSelectAssignOverflowOpen(false)
              }}
            />
            <SchoolDetailAssignCompleteModal
              open={assignCompleteModal != null}
              onClose={() => setAssignCompleteModal(null)}
              instructorName={assignCompleteModal?.instructorName ?? ''}
              schoolName={assignCompleteModal?.schoolName ?? ''}
              currentCount={assignCompleteModal?.currentCount ?? 0}
              requiredCount={requiredInstructorCount}
              showApprovalAlarmSection={assignCompleteModal?.showApprovalAlarmSection ?? false}
              copyVariant={isCompanySchool ? 'default' : 'general-institution'}
              instructorNames={assignCompleteModal?.instructorName.split(', ')}
            />
            <SchoolDetailUnassignConfirmModal
              open={unassignConfirmOpen}
              onCancel={() => {
                if (unassignSubmitting) return
                setUnassignConfirmOpen(false)
              }}
              instructorNames={assignedRows
                .filter(r => selectedAssignedKeys.includes(r.id))
                .map(r => r.instructorName)}
              targetNames={[row.schoolName]}
              variant={isCompanySchool ? 'default' : 'institution-detail'}
              notificationSent={unassignNotificationSent}
              confirmLoading={unassignSubmitting}
              onConfirm={payload => {
                void handleUnassignConfirm(payload)
              }}
            />
            <SchoolDetailUnassignCompleteModal
              open={unassignCompleteModal != null}
              onClose={() => setUnassignCompleteModal(null)}
              instructorNames={unassignCompleteModal?.instructorNames ?? []}
              targetNames={unassignCompleteModal?.targetNames ?? []}
              reason={unassignCompleteModal?.reason ?? ''}
            />
            <SchoolDetailLeadInstructorConfirmModal
              copyVariant={isCompanySchool ? 'default' : 'general-institution'}
              open={leadRoleChangeConfirm != null}
              onCancel={() => setLeadRoleChangeConfirm(null)}
              onConfirm={() => {
                if (leadRoleChangeConfirm) {
                  applyRoleChange(leadRoleChangeConfirm.instructorId, 'lead')
                  setLeadRoleChangeConfirm(null)
                }
              }}
              currentLeadInstructorName={currentLeadName ?? ''}
              newLeadInstructorName={leadRoleChangeConfirm?.newLeadInstructorName ?? ''}
            />
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__attendance-tab">
            <SchoolDetailAttendanceSection
              row={row}
              program={program}
              disableSaveWhenUnchanged={!isCompanySchool}
            />
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__posts-tab-wrap">
            <EnrollmentProgramDetailPostsTab
              deleteGuideWithPostPreview={!isCompanySchool}
              program={program}
              schoolId={
                row.organizationApplicationId?.trim() || detail.id
              }
              showWriteButtonInSection={false}
              writeModalOpen={postWriteModalOpen}
              onWriteModalOpenChange={setPostWriteModalOpen}
              postsOverride={postsForTab}
              filesOverride={filesForTab}
              onPostWriteSuccess={() => {
                void invalidatePosts()
              }}
              onPostDeleted={postId => {
                void removeDeletedPost(postId)
              }}
            />
          </div>
        )}
      </div>

      <div className="school-detail-fullpage-view__page-bottom-spacer" aria-hidden />

      {personalInfoRevealModal}
      {canChangeEducationSchedule ? (
        <EducationScheduleChangeModal
          open={scheduleChangeModalOpen}
          scheduleLines={scheduleChangeLines}
          scheduleRowLabels={scheduleChangeRowLabels}
          operationStart={program.startDate}
          operationEnd={program.endDate}
          description={PARTICIPATING_INSTITUTION_SCHEDULE_CHANGE_DESCRIPTION}
          operationPeriodLabel={scheduleChangePeriodLabel}
          confirmLabel="선택 완료"
          onCancel={() => setScheduleChangeModalOpen(false)}
          onConfirm={nextLines => {
            setPendingScheduleChangeLines(nextLines)
            setScheduleChangeModalOpen(false)
            showAlert({
              title: PARTICIPATING_INSTITUTION_SCHEDULE_SELECTED_TITLE,
              content: PARTICIPATING_INSTITUTION_SCHEDULE_SELECTED_CONTENT,
            })
          }}
        />
      ) : null}
      <ConfirmModal
        open={editUnmaskConfirmOpen}
        title="정보 수정 안내"
        content={APPLICATION_INFO_EDIT_UNMASK_CONFIRM_CONTENT}
        confirmText="정보 수정"
        cancelText="취소"
        onConfirm={confirmEditUnmaskAndStartEdit}
        onCancel={closeEditUnmaskConfirm}
        confirmLoading={editUnmaskConfirmLoading}
        zIndex={APPLICATION_INFO_EDIT_UNMASK_MODAL_Z_INDEX}
      />

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        confirming={activityWithdrawSubmitting}
        subjectName={mergedDetail.schoolName ?? row.schoolName ?? ''}
        subjectKind="institution"
        onCancel={handleCancelActivityWithdraw}
        onConfirm={handleConfirmActivityWithdraw}
      />
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        onChange={handleAdminCommentDraftChange}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={handleAdminCommentSave}
      />
      <ApplicantNotificationResendModal
        open={notificationResendOpen}
        subjectKind="institution"
        subjectName={mergedDetail.schoolName ?? row.schoolName ?? ''}
        approvalStatus={applicationApprovalStatus === 'rejected' ? 'rejected' : 'approved'}
        confirmLoading={notificationResendSubmitting}
        zIndex={2600}
        onCancel={() => {
          if (notificationResendSubmitting) return
          setNotificationResendOpen(false)
        }}
        onConfirm={payload => {
          void handleConfirmApplicationNotificationResend(payload)
        }}
      />
      {combinedClassProcess.modals}
    </div>
  )
}

/** @deprecated `GeneralParticipatingInstitutionDetailView` 사용 */
export const SchoolDetailFullpageView = GeneralParticipatingInstitutionDetailView
