/**
 * Mock 데이터 통합 export
 */

export { mockSponsors, mockSponsorsMap } from './sponsors'
export { mockSchools, mockSchoolsMap } from './schools'
export { mockInstructors, mockInstructorsMap } from './instructors'
export { mockPrograms, mockProgramsMap } from './programs'
export {
  PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
  programLectureHistoryDemoApplications,
} from './program-lecture-history-demo'
export {
  mockProgramPosts,
  mockProgramPostsMap,
  getProgramPostsByProgramId,
  getProgramPostsByProgramIdAndSchoolId,
  createProgramPost,
  markPostAsRead,
  incrementPostCommentCount,
  type CreateProgramPostPayload,
} from './program-posts'
export {
  mockProgramPostComments,
  mockProgramPostReactions,
  mockProgramPostReactionUsers,
  getCommentsByPostId,
  getReactionsByPostId,
  getReactionTotalCountByPostId,
  getReactionUsersByPostId,
  createProgramPostComment,
  addProgramPostReaction,
  getReactionEmojiTypeForBarIndex,
  removeProgramPostReactionUser,
  type CreateProgramPostCommentOptions,
} from './program-post-comments'
export {
  getPostReadRows,
  getReadUnreadCountsByPostId,
  getReadUnreadCountsForPost,
  getPostViewCountByPostId,
  getPostViewCountForContext,
  resolveSchoolScopeName,
} from './program-post-reads'
export {
  mockProgramFiles,
  mockProgramFilesMap,
  getProgramFilesByProgramId,
  addProgramFiles,
  type AddProgramFileItem,
} from './program-files'
// ProgramStatistics는 Program 엔티티로 통합됨 (deprecated)
export { mockApplications, mockApplicationsMap } from './applications'
export {
  mockSchedules,
  mockSchedulesMap,
  buildEconomySchedulesForVisibleRange,
  buildCompanySchoolSchedulesForVisibleRange,
  buildGeneralSchedulesForVisibleRange,
  buildGeminiSchedulesForVisibleRange,
  buildUjatSchedulesForVisibleRange,
} from './schedules'
export { mockMatchings, mockMatchingsMap } from './matchings'
export { mockSettlements, mockSettlementsMap } from './settlements'
export { mockPaymentStatements, mockPaymentStatementsMap } from './payment-statements'
export {
  PAYMENT_ORDERS_DEFAULT_URL_DATE_RANGE,
  mockPaymentOrderAdminProgramList,
  mockPaymentOrderAdminInstructorList,
  PAYMENT_ORDER_STATUS_LABELS_LIST,
  PAYMENT_ORDER_STATUS_LABELS_DETAIL,
  PAYMENT_ORDER_CALENDAR_STATUS_SHORT_LIST,
  PAYMENT_ORDER_CALENDAR_STATUS_SHORT_DETAIL,
  PAYMENT_ORDER_ADMIN_LINE_STATUS_LABELS,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminLineProcessingStatus,
  type PaymentOrderAdminProgramDetail,
  type PaymentOrderAdminProgramDetailInstructorRow,
} from './payment-order-admin-list'
export { mockTodos, mockTodosMap } from './todos'
export {
  lectureReportFields,
  volunteerReportFields,
  programReportFields,
  reportSubmissionGuides,
  mockReports,
  getMockReportsMap,
} from './reports'
export {
  mockLectureActivities,
  mockLectureActivitiesMap,
  mockVolunteerActivities,
  mockVolunteerActivitiesMap,
} from './activities'
export { getMyPageData, mockUserHistories, mockUserHistoriesMap } from './mypage'
export {
  mockApplicationPaths,
  mockApplicationPathsMap,
  getApplicationPathByProgramId,
} from './application-paths'
export { mockUsers, getUserByEmail, getUsersByRole, validateLogin } from './users'
export {
  MEMBER_MANAGEMENT_SEED_LABEL,
  MEMBER_SEED_ID_RANGES,
  MOCK_TO_BE_MEMBER_ID,
  MOCK_TO_BE_DIRECTORY_MEMBER_ID,
  MOCK_TO_BE_PERMISSION_MEMBER_ID,
  SEED_IR_PENDING_PORTAL_FULL_PROFILE,
  INSTRUCTOR_ROLE_REQUEST_SEED_CASES,
  ADMIN_APPROVAL_SEED_CASES,
  MEMBER_DIRECTORY_SEED_CASES,
  getInstructorSeedCaseByRequestId,
  getAdminSeedCaseByAccountId,
  type InstructorRoleRequestSeedCase,
  type AdminApprovalSeedCase,
  type MemberSeedProfileTier,
} from './member-management-seed-catalog'
export {
  MEMBER_DETAIL_HISTORY_SEED_LABEL,
  MEMBER_HISTORY_SEED_ID_RANGES,
  MEMBER_HISTORY_DEMO_PROGRAM_IDS,
  MEMBER_HISTORY_DEMO_STAGES,
  MEMBER_DETAIL_HISTORY_SEED_CASES,
  SCHOOL_ENROLLMENT_HISTORY_SEED_CASES,
  ADMIN_PROGRAM_ROLE_SEED_CASES,
  MEMBER_DETAIL_HISTORY_SMOKE_SCENARIOS,
  createMemberDetailVolunteerHistories,
  getMemberDetailHistoryCaseByMemberId,
  getSchoolEnrollmentCaseByOrgId,
  getAdminProgramRoleCaseByAdminId,
  type MemberDetailHistorySeedCase,
  type MemberDetailHistoryTab,
  type SchoolEnrollmentHistorySeedCase,
  type AdminProgramRoleSeedCase,
} from './member-detail-history-seed-catalog'
export { getVolunteerPrograms, mockVolunteerProgramsMap } from './volunteer-programs'
export { getEducationPrograms, mockEducationProgramsMap } from './education-programs'
export {
  getCompanySchoolPrograms,
  getCompanySchoolProgramById,
  getEconomyPrograms,
  getEconomyProgramById,
} from './economy-programs'
export { getGeneralPrograms, getGeneralProgramById } from './general-programs'
export {
  getTrainedTeachersPrograms,
  getTrainedTeachersProgramById,
  invalidateTrainedTeachersProgramsCache,
} from './trained-teachers-programs'
export {
  isGeminiProgram,
  getGeneralEducationPrograms,
  getGeminiPrograms,
  getUjatPrograms,
  getProgramScheduleKindsForAdminUser,
  PROGRAM_SCHEDULE_WIDGET_KEYS,
  type ProgramScheduleKind,
} from './program-schedule-categories'
export { getStudentEnrolledPrograms } from './student-enrollments'
export { getFormTemplateByProgramId, formTemplatesByProgramId } from './form-templates'
export {
  mockProgramProgressByTab,
  PROGRAM_PROGRESS_TAB_LABELS,
  PROGRAM_PROGRESS_TAB_ORDER,
  type ProgramProgressTabKey,
  type ProgramProgressTabRow,
} from './program-progress-tabs'
