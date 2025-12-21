/**
 * 라우팅 구조 정의
 * Phase 1.1: React Router 설정
 */

import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { Dashboard } from '@/pages/dashboard'
import { InstructorListPage } from '@/pages/instructors/instructor-list-page'
import { InstructorDetailPage } from '@/pages/instructors/instructor-detail-page'
import { InstructorFormPage } from '@/pages/instructors/instructor-form-page'
import { SponsorListPage } from '@/pages/sponsors/sponsor-list-page'
import { SponsorDetailPage } from '@/pages/sponsors/sponsor-detail-page'
import { SponsorFormPage } from '@/pages/sponsors/sponsor-form-page'
import { SchoolListPage } from '@/pages/schools/school-list-page'
import { SchoolDetailPage } from '@/pages/schools/school-detail-page'
import { SchoolFormPage } from '@/pages/schools/school-form-page'
import { ProgramListPage } from '@/pages/programs/program-list-page'
import { ProgramFormPage } from '@/pages/programs/program-form-page'
import { ApplicationListPage } from '@/pages/applications/application-list-page'
import { ApplicationFormPage } from '@/pages/applications/application-form-page'
import { ApplicationResultPage } from '@/pages/applications/application-result-page'
import { ScheduleCalendarPage } from '@/pages/schedules/schedule-calendar-page'
import { MyScheduleListPage } from '@/pages/schedules/my-schedule-list-page'
import { MyScheduleDetailPage } from '@/pages/schedules/my-schedule-detail-page'
import { MatchingListPage } from '@/pages/matchings/matching-list-page'
import { SettlementListPage } from '@/pages/settlements/settlement-list-page'
import { TodoDetailPage } from '@/pages/todos/todo-detail-page'
import { ReportFormPage } from '@/pages/reports/report-form-page'
import { LectureDetailPage } from '@/pages/lectures/lecture-detail-page'
import { VolunteerDetailPage } from '@/pages/volunteers/volunteer-detail-page'
import { MyPageMainPage } from '@/pages/mypage/mypage-main-page'
import { HistoryListPage } from '@/pages/histories/history-list-page'
import { HistoryDetailPage } from '@/pages/histories/history-detail-page'
import { ErrorPage } from '@/pages/error/error-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
        children: [{ index: true, element: <SettlementListPage /> }],
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
