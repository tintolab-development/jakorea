/**
 * Mock 데이터 통합 export
 */

export { mockSponsors, mockSponsorsMap } from './sponsors'
export { mockSchools, mockSchoolsMap } from './schools'
export { mockInstructors, mockInstructorsMap } from './instructors'
export { mockPrograms, mockProgramsMap } from './programs'
export {
  PROGRAM_LECTURE_HISTORY_DEMO_INSTRUCTOR_USER_ID,
  programLectureHistoryDemoPrograms,
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
export { mockSchedules, mockSchedulesMap } from './schedules'
export { mockMatchings, mockMatchingsMap } from './matchings'
export { mockSettlements, mockSettlementsMap } from './settlements'
export { mockPaymentStatements, mockPaymentStatementsMap } from './payment-statements'
export {
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
export { getVolunteerPrograms, mockVolunteerProgramsMap } from './volunteer-programs'
export { getEducationPrograms, mockEducationProgramsMap } from './education-programs'
export { getEconomyPrograms, getEconomyProgramById } from './economy-programs'
export { getStudentEnrolledPrograms } from './student-enrollments'
export { getFormTemplateByProgramId, formTemplatesByProgramId } from './form-templates'
export {
  mockProgramProgressByTab,
  PROGRAM_PROGRESS_TAB_LABELS,
  PROGRAM_PROGRESS_TAB_ORDER,
  type ProgramProgressTabKey,
  type ProgramProgressTabRow,
} from './program-progress-tabs'
