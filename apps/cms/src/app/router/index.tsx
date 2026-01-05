/**
 * 라우팅 구조 정의
 * Phase 1.1: React Router 설정
 * 코드 스플리팅 적용: React.lazy를 사용한 동적 import
 */

import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { ProtectedRoute } from '@/shared/components/protected-route'
import { Spin } from 'antd'

// 로딩 컴포넌트 - 화면 중앙 정렬
const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 9999,
    }}
  >
    <Spin size="large" />
  </div>
)

// Lazy loading wrapper - named export를 default export로 변환
const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ [key: string]: T }>
) => {
  const LazyComponent = lazy(async () => {
    const module = await importFunc()
    // named export를 default export로 변환
    const Component = Object.values(module)[0] as T
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
import { ForbiddenPage } from '@/pages/error/forbidden-page'

// 대시보드 (즉시 로드 - 첫 화면)
import { Dashboard } from '@/pages/dashboard'

// 나머지 페이지들은 lazy loading
const InstructorListPage = lazyLoad(() => import('@/pages/instructors/instructor-list-page'))
const InstructorDetailPage = lazyLoad(() => import('@/pages/instructors/instructor-detail-page'))
const InstructorFormPage = lazyLoad(() => import('@/pages/instructors/instructor-form-page'))
const SponsorListPage = lazyLoad(() => import('@/pages/sponsors/sponsor-list-page'))
const SponsorDetailPage = lazyLoad(() => import('@/pages/sponsors/sponsor-detail-page'))
const SponsorFormPage = lazyLoad(() => import('@/pages/sponsors/sponsor-form-page'))
const SchoolListPage = lazyLoad(() => import('@/pages/schools/school-list-page'))
const SchoolDetailPage = lazyLoad(() => import('@/pages/schools/school-detail-page'))
const SchoolFormPage = lazyLoad(() => import('@/pages/schools/school-form-page'))
const ProgramListPage = lazyLoad(() => import('@/pages/programs/program-list-page'))
const ProgramFormPage = lazyLoad(() => import('@/pages/programs/program-form-page'))
const ApplicationListPage = lazyLoad(() => import('@/pages/applications/application-list-page'))
const ApplicationFormPage = lazyLoad(() => import('@/pages/applications/application-form-page'))
const ApplicationResultPage = lazyLoad(() => import('@/pages/applications/application-result-page'))
const ScheduleCalendarPage = lazyLoad(() => import('@/pages/schedules/schedule-calendar-page'))
const MyScheduleListPage = lazyLoad(() => import('@/pages/schedules/my-schedule-list-page'))
const MyScheduleDetailPage = lazyLoad(() => import('@/pages/schedules/my-schedule-detail-page'))
const MatchingListPage = lazyLoad(() => import('@/pages/matchings/matching-list-page'))
const SettlementListPage = lazyLoad(() => import('@/pages/settlements/settlement-list-page'))
const MonthlySettlementPage = lazyLoad(() => import('@/pages/settlements/monthly-settlement-page'))
const SettlementCalculationSettingsPage = lazyLoad(() => import('@/pages/settlements/settlement-calculation-settings-page'))
const InterviewListPage = lazyLoad(() => import('@/pages/interviews/interview-list-page'))
const MyInterviewPage = lazyLoad(() => import('@/pages/interviews/my-interview-page'))
const TodoDetailPage = lazyLoad(() => import('@/pages/todos/todo-detail-page'))
const ReportFormPage = lazyLoad(() => import('@/pages/reports/report-form-page'))
const LectureDetailPage = lazyLoad(() => import('@/pages/lectures/lecture-detail-page'))
const VolunteerDetailPage = lazyLoad(() => import('@/pages/volunteers/volunteer-detail-page'))
const MyPageMainPage = lazyLoad(() => import('@/pages/mypage/mypage-main-page'))
const HistoryListPage = lazyLoad(() => import('@/pages/histories/history-list-page'))
const HistoryDetailPage = lazyLoad(() => import('@/pages/histories/history-detail-page'))
const ApplicationPathListPage = lazyLoad(() => import('@/pages/application-paths/application-path-list-page'))
const EducationRecordListPage = lazyLoad(() => import('@/pages/education-records/education-record-list-page'))
const ErrorPage = lazyLoad(() => import('@/pages/error/error-page'))

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
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
      {
        path: 'application-paths',
        children: [{ index: true, element: <ApplicationPathListPage /> }],
      },
      {
        path: 'education-records',
        children: [{ index: true, element: <EducationRecordListPage /> }],
      },
      {
        path: 'schedules',
        children: [
          { index: true, element: <ScheduleCalendarPage /> },
          { path: 'my', element: <MyScheduleListPage /> },
          { path: ':id', element: <MyScheduleDetailPage /> },
        ],
      },
      {
        path: 'matchings',
        children: [{ index: true, element: <MatchingListPage /> }],
      },
      {
        path: 'settlements',
        children: [
          { index: true, element: <SettlementListPage /> },
          { path: 'monthly', element: <MonthlySettlementPage /> },
          { path: 'calculation-settings', element: <SettlementCalculationSettingsPage /> },
        ],
      },
      {
        path: 'interviews',
        children: [
          { index: true, element: <InterviewListPage /> },
          { path: 'my', element: <MyInterviewPage /> },
        ],
      },
      {
        path: 'todos',
        children: [{ path: ':id', element: <TodoDetailPage /> }],
      },
      {
        path: 'reports',
        children: [{ path: 'new', element: <ReportFormPage /> }],
      },
      {
        path: 'lectures',
        children: [{ path: ':id', element: <LectureDetailPage /> }],
      },
      {
        path: 'volunteers',
        children: [{ path: ':id', element: <VolunteerDetailPage /> }],
      },
      {
        path: 'mypage',
        children: [{ index: true, element: <MyPageMainPage /> }],
      },
      {
        path: 'histories',
        children: [
          { index: true, element: <HistoryListPage /> },
          { path: ':id', element: <HistoryDetailPage /> },
        ],
      },
      {
        path: 'error',
        element: <ErrorPage />,
      },
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
])
