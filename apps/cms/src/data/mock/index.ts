/**
 * Mock 데이터 통합 export
 */

export { mockSponsors, mockSponsorsMap } from './sponsors'
export { mockSchools, mockSchoolsMap } from './schools'
export { mockInstructors, mockInstructorsMap } from './instructors'
export { mockPrograms, mockProgramsMap } from './programs'
// ProgramStatistics는 Program 엔티티로 통합됨 (deprecated)
export { mockApplications, mockApplicationsMap } from './applications'
export { mockSchedules, mockSchedulesMap } from './schedules'
export { mockMatchings, mockMatchingsMap } from './matchings'
export { mockSettlements, mockSettlementsMap } from './settlements'
export { mockPaymentStatements, mockPaymentStatementsMap } from './payment-statements'
export { mockPerformanceStats, mockPerformanceStatsMap } from './performance-stats'
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
export {
  getMyPageData,
  mockUserHistories,
  mockUserHistoriesMap,
} from './mypage'
export {
  mockApplicationPaths,
  mockApplicationPathsMap,
  getApplicationPathByProgramId,
} from './application-paths'
export {
  mockScheduleNegotiations,
  mockScheduleNegotiationsMap,
} from './schedule-negotiations'
export { mockUsers, getUserByEmail, getUsersByRole, validateLogin } from './users'
export {
  mockInterviews,
  getInterviewById,
  getInterviewByUserId,
  getInterviewsByStatus,
  getPendingInterviews,
} from './interviews'
export {
  getVolunteerPrograms,
  mockVolunteerProgramsMap,
} from './volunteer-programs'
export { getStudentEnrolledPrograms } from './student-enrollments'




