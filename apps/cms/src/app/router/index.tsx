/**
 * 라우팅 구조 정의
 * Phase 1.1: React Router 설정
 * 코드 스플리팅 적용: React.lazy를 사용한 동적 import
 */

import { lazy, Suspense } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { ProtectedRoute } from '@/shared/components/protected-route'
import { Spin } from 'antd'
import { useAuthStore } from '@/features/auth/model/auth-store'
import './router.css'

// 로딩 컴포넌트 - 화면 중앙 정렬
const LoadingFallback = () => (
  <div className="router-loading-fallback">
    <Spin size="large" />
  </div>
)

// Lazy loading wrapper - named export를 default export로 변환
// 타입 복잡도를 줄이기 위해 import 함수는 느슨하게 any로 처리
const lazyLoad = <T extends React.ComponentType<any>>(importFunc: () => Promise<any>) => {
  const LazyComponent = lazy(async () => {
    const module = await importFunc()
    // default export를 우선 사용, 없으면 첫 번째 named export 사용
    const Component = (module.default || Object.values(module)[0]) as T
    if (!Component) {
      throw new Error('Failed to load component: No export found')
    }
    return { default: Component }
  })
  return (props: any) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// 인증 관련 페이지 (즉시 로드)
import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { MfaPage } from '@/pages/auth/mfa-page'
import { ForbiddenPage } from '@/pages/error/forbidden-page'

// 대시보드 (즉시 로드 - 첫 화면)
import { Dashboard } from '@/pages/dashboard'

// 나머지 페이지들은 lazy loading
const InstructorListPage = lazyLoad(() => import('@/pages/instructors/instructor-list-page'))
const InstructorDetailPage = lazyLoad(() => import('@/pages/instructors/instructor-detail-page'))
const InstructorFormPage = lazyLoad(() => import('@/pages/instructors/instructor-form-page'))
const InstructorMypagePage = lazyLoad(() => import('@/pages/instructors/instructor-mypage-page'))
const InstructorDocumentsPage = lazyLoad(
  () => import('@/pages/instructors/instructor-documents-page')
)
const InstructorSchedulePage = lazyLoad(
  () => import('@/pages/instructors/instructor-schedule-page')
)
const InstructorReportsPage = lazyLoad(() => import('@/pages/instructors/instructor-reports-page'))
const SponsorListPage = lazyLoad(() => import('@/pages/sponsors/sponsor-list-page'))
const SponsorDetailPage = lazyLoad(() => import('@/pages/sponsors/sponsor-detail-page'))
const SponsorFormPage = lazyLoad(() => import('@/pages/sponsors/sponsor-form-page'))
const SchoolListPage = lazyLoad(() => import('@/pages/schools/school-list-page'))
const SchoolDetailPage = lazyLoad(() => import('@/pages/schools/school-detail-page'))
const SchoolFormPage = lazyLoad(() => import('@/pages/schools/school-form-page'))
const ProgramListPage = lazyLoad(() => import('@/pages/programs/program-list-page'))
const ProgramFormPage = lazyLoad(() => import('@/pages/programs/program-form-page'))
const ProgramApplicationPage = lazyLoad(() => import('@/pages/programs/program-application-page'))
const ProgramApplicationCompletePage = lazyLoad(
  () => import('@/pages/programs/program-application-complete-page')
)
const MyProgramListPage = lazyLoad(() => import('@/pages/programs/my-program-list-page'))
const MyProgramDetailPage = lazyLoad(() => import('@/pages/programs/my-program-detail-page'))
const MyProgramHistoryPage = lazyLoad(() => import('@/pages/programs/my-program-history-page'))
const ProgramSatisfactionPage = lazyLoad(() => import('@/pages/programs/program-satisfaction-page'))
const MyProgramApplicationsPage = lazyLoad(
  () => import('@/pages/programs/my-program-applications-page')
)
const ApplicationProgressPage = lazyLoad(
  () => import('@/pages/applications/application-progress-page')
)
const MyFavoriteProgramsPage = lazyLoad(() => import('@/pages/programs/my-favorite-programs-page'))
const ApplicationListPage = lazyLoad(() => import('@/pages/applications/application-list-page'))
const ApplicationFormPage = lazyLoad(() => import('@/pages/applications/application-form-page'))
const ApplicationResultPage = lazyLoad(() => import('@/pages/applications/application-result-page'))
const ScheduleCalendarPage = lazyLoad(() => import('@/pages/schedules/schedule-calendar-page'))
const MyScheduleListPage = lazyLoad(() => import('@/pages/schedules/my-schedule-list-page'))
const MyScheduleCalendarPage = lazyLoad(() => import('@/pages/schedules/my-schedule-calendar-page'))
const MyScheduleDetailPage = lazyLoad(() => import('@/pages/schedules/my-schedule-detail-page'))
const MatchingListPage = lazyLoad(() => import('@/pages/matchings/matching-list-page'))
const SettlementListPage = lazyLoad(() => import('@/pages/settlements/settlement-list-page'))
const MySettlementListPage = lazyLoad(() => import('@/pages/settlements/my-settlement-list-page'))
const MySettlementDetailPage = lazyLoad(
  () => import('@/pages/settlements/my-settlement-detail-page')
)
const MyMonthlySettlementPage = lazyLoad(
  () => import('@/pages/settlements/my-monthly-settlement-page')
)
const MySettlementSubmissionPage = lazyLoad(
  () => import('@/pages/settlements/my-settlement-submission-page')
)
const MonthlySettlementPage = lazyLoad(() => import('@/pages/settlements/monthly-settlement-page'))
const SettlementCalculationSettingsPage = lazyLoad(
  () => import('@/pages/settlements/settlement-calculation-settings-page')
)
const PaymentStatementListPage = lazyLoad(
  () => import('@/pages/settlements/payment-statement-list-page')
)
const SettlementOverviewPage = lazyLoad(
  () => import('@/pages/settlements/settlement-overview-page')
)
const InterviewListPage = lazyLoad(() => import('@/pages/interviews/interview-list-page'))
const MyInterviewPage = lazyLoad(() => import('@/pages/interviews/my-interview-page'))
const InstructorApplicationPage = lazyLoad(
  () => import('@/pages/interviews/instructor-application-page')
)
const TodoDetailPage = lazyLoad(() => import('@/pages/todos/todo-detail-page'))
const ReportFormPage = lazyLoad(() => import('@/pages/reports/report-form-page'))
const ReportListPage = lazyLoad(() => import('@/pages/reports/report-list-page'))
const LectureDetailPage = lazyLoad(() => import('@/pages/lectures/lecture-detail-page'))
const VolunteerDetailPage = lazyLoad(() => import('@/pages/volunteers/volunteer-detail-page'))
const VolunteerListPage = lazyLoad(() => import('@/pages/volunteers/volunteer-list-page'))
const VolunteerProgramListPage = lazyLoad(
  () => import('@/pages/volunteers/volunteer-program-list-page')
)
const MyVolunteerProgramListPage = lazyLoad(
  () => import('@/pages/volunteers/my-volunteer-program-list-page')
)
const MyVolunteerHistoryPage = lazyLoad(
  () => import('@/pages/volunteers/my-volunteer-history-page')
)
const MyVolunteerSchedulePage = lazyLoad(
  () => import('@/pages/volunteers/my-volunteer-schedule-page')
)
const VolunteerEducationPlanPage = lazyLoad(
  () => import('@/pages/volunteers/volunteer-education-plan-page')
)
const MyPageMainPage = lazyLoad(() => import('@/pages/mypage/mypage-main-page'))
const ProfilePage = lazyLoad(() => import('@/pages/mypage/profile-page'))
const HistoryListPage = lazyLoad(() => import('@/pages/histories/history-list-page'))
const NoticeListPage = lazyLoad(() => import('@/pages/notices/notice-list-page'))
const HistoryDetailPage = lazyLoad(() => import('@/pages/histories/history-detail-page'))
const ApplicationPathListPage = lazyLoad(
  () => import('@/pages/application-paths/application-path-list-page')
)
const EducationRecordListPage = lazyLoad(
  () => import('@/pages/education-records/education-record-list-page')
)
const EducationRecordListPageV2 = lazyLoad(
  () => import('@/pages/education-records/education-record-list-page-v2')
)
const UserListPage = lazyLoad(() => import('@/pages/users/user-list-page'))
const ParticipantListPage = lazyLoad(() => import('@/pages/users/participant-list-page'))
const AdminInstructorListPage = lazyLoad(() => import('@/pages/users/instructor-list-page'))
const InstructorApplicationListPage = lazyLoad(
  () => import('@/pages/instructor-applications/instructor-application-list-page')
)
const PerformanceDashboardPage = lazyLoad(
  () => import('@/pages/performance/performance-dashboard-page')
)
const ScheduleNegotiationListPage = lazyLoad(
  () => import('@/pages/schedule-negotiations/schedule-negotiation-list-page')
)
const ErrorPage = lazyLoad(() => import('@/pages/error/error-page'))
const TemplateListPage = lazyLoad(() => import('@/pages/templates/template-list-page'))
const TemplateFilesPage = lazyLoad(() => import('@/pages/templates/template-files-page'))
const TemplateSmsPage = lazyLoad(() => import('@/pages/templates/template-sms-page'))
const TemplateEmailPage = lazyLoad(() => import('@/pages/templates/template-email-page'))
const PostListPage = lazyLoad(() => import('@/pages/posts/post-list-page'))
const AdminCategoryPage = lazyLoad(() => import('@/pages/posts/admin-category-page'))
const AdminNoticeListPage = lazyLoad(() => import('@/pages/posts/admin-notice-list-page'))
const AdminFAQPage = lazyLoad(() => import('@/pages/posts/admin-faq-page'))
const AdminInquiryPage = lazyLoad(() => import('@/pages/posts/admin-inquiry-page'))
const AdminSettlementReviewPage = lazyLoad(
  () => import('@/pages/admin/admin-settlement-review-page')
)
const PermissionRequestListPage = lazyLoad(
  () => import('@/pages/admin/permission-request-list-page')
)
const AuditLogListPage = lazyLoad(() => import('@/pages/admin/audit-log-list-page'))
const SurveyListPage = lazyLoad(() => import('@/pages/surveys/survey-list-page'))
const LogListPage = lazyLoad(() => import('@/pages/logs/log-list-page'))
const FAQPage = lazyLoad(() => import('@/pages/notices/faq-page'))
const InquiryPage = lazyLoad(() => import('@/pages/notices/inquiry-page'))

function LegacyPostsRedirect({
  kind,
}: {
  kind: 'root' | 'faq' | 'inquiries' | 'notices' | 'categories'
}) {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  if (kind === 'root') {
    return <Navigate to={isAdmin ? '/admin/posts' : '/notices'} replace />
  }

  if (kind === 'faq') {
    return <Navigate to={isAdmin ? '/admin/posts/faq' : '/notices/faq'} replace />
  }

  if (kind === 'inquiries') {
    return <Navigate to={isAdmin ? '/admin/posts/inquiries' : '/notices/inquiries'} replace />
  }

  if (kind === 'notices') {
    return <Navigate to={isAdmin ? '/admin/posts/notices' : '/notices'} replace />
  }

  // categories: 관리자 전용이지만 legacy URL 호환을 위해 리다이렉트 유지
  return <Navigate to="/admin/posts/categories" replace />
}

export const router = createBrowserRouter([
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/mfa',
    element: <MfaPage />,
  },
  {
    path: '/forbidden',
    element: <ForbiddenPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'instructors',
        children: [
          { index: true, element: <InstructorListPage /> },
          { path: 'new', element: <InstructorFormPage /> },
          { path: ':id', element: <InstructorDetailPage /> },
          { path: ':id/edit', element: <InstructorFormPage /> },
        ],
      },
      {
        path: 'sponsors',
        children: [
          { index: true, element: <SponsorListPage /> },
          { path: 'new', element: <SponsorFormPage /> },
          { path: ':id', element: <SponsorDetailPage /> },
          { path: ':id/edit', element: <SponsorFormPage /> },
        ],
      },
      {
        path: 'surveys',
        children: [{ index: true, element: <SurveyListPage /> }],
      },
      {
        path: 'schools',
        children: [
          { index: true, element: <SchoolListPage /> },
          { path: 'new', element: <SchoolFormPage /> },
          { path: ':id', element: <SchoolDetailPage /> },
          { path: ':id/edit', element: <SchoolFormPage /> },
        ],
      },
      {
        path: 'programs',
        children: [
          { index: true, element: <ProgramListPage /> },
          { path: ':id/apply', element: <ProgramApplicationPage /> }, // Phase 0.2.2: 신청서 작성 페이지
          { path: ':id/apply/complete', element: <ProgramApplicationCompletePage /> }, // Phase 0.2.3: 신청 완료 페이지
          { path: 'my', element: <MyProgramApplicationsPage /> },
          { path: 'my/active', element: <MyProgramListPage /> },
          { path: 'my/active/:id', element: <MyProgramDetailPage /> },
          { path: 'my/:id', element: <MyProgramDetailPage /> },
          { path: 'my/:id/history', element: <MyProgramHistoryPage /> },
          { path: 'satisfaction', element: <ProgramSatisfactionPage /> },
          { path: 'favorites', element: <MyFavoriteProgramsPage /> },
          { path: 'new', element: <ProgramFormPage /> },
          { path: ':id/edit', element: <ProgramFormPage /> },
        ],
      },
      {
        path: 'applications',
        children: [
          { index: true, element: <ApplicationListPage /> },
          { path: 'new', element: <ApplicationFormPage /> },
          { path: ':id/edit', element: <ApplicationFormPage /> },
          { path: ':id/result', element: <ApplicationResultPage /> },
        ],
      },
      // Phase 0.2.3: 역할별 신청 내역 페이지 (FR-C04)
      {
        path: 'my',
        children: [
          { path: 'applications', element: <MyProgramApplicationsPage /> }, // 개인(참여자) 신청 내역
          { path: 'applications/:id', element: <ApplicationProgressPage /> }, // Phase 0.2.4: 진행상황 조회
        ],
      },
      {
        path: 'school',
        children: [
          { path: 'applications', element: <MyProgramApplicationsPage /> }, // 학교 신청 내역
          { path: 'applications/:id', element: <ApplicationProgressPage /> }, // Phase 0.2.4: 진행상황 조회
        ],
      },
      {
        path: 'instructor',
        children: [
          { index: true, element: <InstructorMypagePage /> }, // Phase 0.2.5: 강사 마이페이지
          { path: 'applications', element: <MyProgramApplicationsPage /> }, // 강사 신청 내역
          { path: 'applications/:id', element: <ApplicationProgressPage /> }, // Phase 0.2.4: 진행상황 조회
          { path: 'documents', element: <InstructorDocumentsPage /> }, // Phase 0.2.5: 제출 서류 관리
          { path: 'schedule', element: <InstructorSchedulePage /> }, // Phase 0.2.6: 교육 일정 (캘린더/목록)
          { path: 'reports', element: <InstructorReportsPage /> }, // Phase 0.2.7: 강의보고서 목록
        ],
      },
      {
        path: 'instructor-applications',
        children: [{ index: true, element: <InstructorApplicationListPage /> }],
      },
      {
        path: 'application-paths',
        children: [{ index: true, element: <ApplicationPathListPage /> }],
      },
      {
        path: 'education-records',
        children: [{ index: true, element: <EducationRecordListPage /> }],
      },
      {
        path: 'education-records-v2',
        children: [{ index: true, element: <EducationRecordListPageV2 /> }],
      },
      {
        path: 'performance',
        children: [{ index: true, element: <PerformanceDashboardPage /> }],
      },
      {
        path: 'schedules',
        children: [
          { index: true, element: <ScheduleCalendarPage /> },
          { path: 'my', element: <MyScheduleListPage /> },
          { path: 'my/calendar', element: <MyScheduleCalendarPage /> },
          { path: ':id', element: <MyScheduleDetailPage /> },
        ],
      },
      {
        path: 'schedule-negotiations',
        children: [{ index: true, element: <ScheduleNegotiationListPage /> }],
      },
      {
        path: 'matchings',
        children: [{ index: true, element: <MatchingListPage /> }],
      },
      {
        path: 'settlements',
        children: [
          { index: true, element: <SettlementListPage /> },
          // 기존 URL 리다이렉트를 위한 라우트 유지 (내부적으로 SettlementListPage로 리다이렉트)
          { path: 'pending', element: <SettlementListPage /> },
          { path: 'review', element: <SettlementListPage /> },
          { path: 'paid', element: <SettlementListPage /> },
          { path: 'overview', element: <SettlementListPage /> },
          {
            path: 'my',
            children: [
              { index: true, element: <MySettlementListPage /> },
              { path: 'monthly', element: <MyMonthlySettlementPage /> },
              { path: 'submit', element: <MySettlementSubmissionPage /> },
              { path: ':id', element: <MySettlementDetailPage /> },
            ],
          },
          { path: 'overview', element: <SettlementOverviewPage /> },
          { path: 'monthly', element: <MonthlySettlementPage /> },
          { path: 'calculation-settings', element: <SettlementCalculationSettingsPage /> },
          { path: 'payment-statements', element: <PaymentStatementListPage /> },
          // Alias: 일정 협의 관리 (정착 경로는 /schedule-negotiations)
          { path: 'schedule-negotiations', element: <ScheduleNegotiationListPage /> },
        ],
      },
      {
        path: 'interviews',
        children: [
          { index: true, element: <InterviewListPage /> },
          { path: 'my', element: <MyInterviewPage /> },
          { path: 'apply', element: <VolunteerDetailPage /> },
          { path: 'apply/form', element: <InstructorApplicationPage /> },
          { path: 'apply/:id', element: <VolunteerDetailPage /> },
        ],
      },
      {
        path: 'users',
        children: [
          { index: true, element: <UserListPage /> },
          { path: 'participants', element: <ParticipantListPage /> },
          { path: 'instructors', element: <AdminInstructorListPage /> },
        ],
      },
      {
        path: 'todos',
        children: [{ path: ':id', element: <TodoDetailPage /> }],
      },
      {
        path: 'reports',
        children: [
          { index: true, element: <ReportListPage /> },
          { path: 'new', element: <ReportFormPage /> },
        ],
      },
      {
        path: 'lectures',
        children: [{ path: ':id', element: <LectureDetailPage /> }],
      },
      {
        path: 'volunteers',
        children: [
          { index: true, element: <VolunteerListPage /> },
          { path: 'programs', element: <VolunteerProgramListPage /> },
          { path: 'education-plan', element: <VolunteerEducationPlanPage /> },
          {
            path: 'my',
            children: [
              { path: 'programs', element: <MyVolunteerProgramListPage /> },
              { path: 'schedules', element: <MyVolunteerSchedulePage /> },
              { path: 'histories', element: <MyVolunteerHistoryPage /> },
            ],
          },
          { path: ':id', element: <VolunteerDetailPage /> },
        ],
      },
      {
        path: 'mypage',
        children: [
          { index: true, element: <MyPageMainPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      {
        path: 'histories',
        children: [
          { index: true, element: <HistoryListPage /> },
          { path: ':id', element: <HistoryDetailPage /> },
        ],
      },
      {
        path: 'templates',
        element: <TemplateListPage />,
        children: [
          { index: true, element: <Navigate to="files?tab=files" replace /> },
          { path: 'files', element: <TemplateFilesPage /> },
          { path: 'sms', element: <TemplateSmsPage /> },
          { path: 'email', element: <TemplateEmailPage /> },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            path: 'posts',
            children: [
              { index: true, element: <PostListPage /> },
              { path: 'categories', element: <AdminCategoryPage /> },
              { path: 'notices', element: <AdminNoticeListPage /> },
              { path: 'faq', element: <AdminFAQPage /> },
              { path: 'inquiries', element: <AdminInquiryPage /> },
            ],
          },
          {
            path: 'settlements',
            children: [{ index: true, element: <AdminSettlementReviewPage /> }],
          },
          {
            path: 'permission-requests',
            children: [{ index: true, element: <PermissionRequestListPage /> }],
          },
          {
            path: 'logs',
            children: [{ path: 'audit', element: <AuditLogListPage /> }],
          },
        ],
      },
      // legacy routes (기존 링크 호환)
      {
        path: 'posts',
        children: [
          { index: true, element: <LegacyPostsRedirect kind="root" /> },
          { path: 'faq', element: <LegacyPostsRedirect kind="faq" /> },
          { path: 'inquiries', element: <LegacyPostsRedirect kind="inquiries" /> },
          { path: 'notices', element: <LegacyPostsRedirect kind="notices" /> },
          { path: 'categories', element: <LegacyPostsRedirect kind="categories" /> },
        ],
      },
      {
        path: 'logs',
        children: [{ index: true, element: <LogListPage /> }],
      },
      {
        path: 'notices',
        children: [
          { index: true, element: <NoticeListPage /> },
          { path: 'faq', element: <FAQPage /> },
          { path: 'inquiries', element: <InquiryPage /> },
        ],
      },
      {
        path: 'error',
        element: <ErrorPage />,
      },
      {
        path: 'unauthorized',
        element: <Navigate to="/forbidden" replace />,
      },
      // Phase 0.1.5: 404 페이지 개선
      {
        path: '*',
        element: <Navigate to="/error?code=404" replace />,
      },
    ],
  },
])
