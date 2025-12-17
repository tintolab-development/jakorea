/**
 * 라우팅 구조 정의
 * Phase 1.1: React Router 설정
 */

import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Dashboard from '../pages/Dashboard'
import InstructorsList from '../pages/instructors/InstructorsList'
import InstructorDetail from '../pages/instructors/InstructorDetail'
import InstructorForm from '../pages/instructors/InstructorForm'
import ProgramsList from '../pages/programs/ProgramsList'
import ProgramDetail from '../pages/programs/ProgramDetail'
import ProgramForm from '../pages/programs/ProgramForm'
import ApplicationsList from '../pages/applications/ApplicationsList'
import ApplicationDetail from '../pages/applications/ApplicationDetail'
import ApplicationForm from '../pages/applications/ApplicationForm'
import SchedulesCalendar from '../pages/schedules/SchedulesCalendar'
import ScheduleForm from '../pages/schedules/ScheduleForm'
import ScheduleDetail from '../pages/schedules/ScheduleDetail'
import MatchingsList from '../pages/matchings/MatchingsList'
import MatchingForm from '../pages/matchings/MatchingForm'
import MatchingDetail from '../pages/matchings/MatchingDetail'
import SettlementsList from '../pages/settlements/SettlementsList'
import SettlementDetail from '../pages/settlements/SettlementDetail'
import SettlementSubmissionForm from '../pages/settlements/SettlementSubmissionForm'
import SponsorsList from '../pages/sponsors/SponsorsList'
import SponsorDetail from '../pages/sponsors/SponsorDetail'
import SponsorForm from '../pages/sponsors/SponsorForm'
import SchoolsList from '../pages/schools/SchoolsList'
import SchoolDetail from '../pages/schools/SchoolDetail'
import SchoolForm from '../pages/schools/SchoolForm'

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
          {
            index: true,
            element: <InstructorsList />,
          },
          {
            path: ':id',
            element: <InstructorDetail />,
          },
          {
            path: 'new',
            element: <InstructorForm />,
          },
          {
            path: ':id/edit',
            element: <InstructorForm />,
          },
        ],
      },
      {
        path: 'programs',
        children: [
          {
            index: true,
            element: <ProgramsList />,
          },
          {
            path: 'new',
            element: <ProgramForm />,
          },
          {
            path: ':id',
            element: <ProgramDetail />,
          },
          {
            path: ':id/edit',
            element: <ProgramForm />,
          },
        ],
      },
      {
        path: 'applications',
        children: [
          {
            index: true,
            element: <ApplicationsList />,
          },
          {
            path: 'new',
            element: <ApplicationForm />,
          },
          {
            path: ':id',
            element: <ApplicationDetail />,
          },
        ],
      },
      {
        path: 'schedules',
        children: [
          {
            index: true,
            element: <SchedulesCalendar />,
          },
          {
            path: 'new',
            element: <ScheduleForm />,
          },
          {
            path: ':id',
            element: <ScheduleDetail />,
          },
          {
            path: ':id/edit',
            element: <ScheduleForm />,
          },
        ],
      },
      {
        path: 'matchings',
        children: [
          {
            index: true,
            element: <MatchingsList />,
          },
          {
            path: 'new',
            element: <MatchingForm />,
          },
          {
            path: ':id',
            element: <MatchingDetail />,
          },
          {
            path: ':id/edit',
            element: <MatchingForm />,
          },
        ],
      },
      {
        path: 'settlements',
        children: [
          {
            index: true,
            element: <SettlementsList />,
          },
          {
            path: 'submit',
            element: <SettlementSubmissionForm />,
          },
          {
            path: ':id',
            element: <SettlementDetail />,
          },
        ],
      },
      {
        path: 'sponsors',
        children: [
          {
            index: true,
            element: <SponsorsList />,
          },
          {
            path: ':id',
            element: <SponsorDetail />,
          },
          {
            path: 'new',
            element: <SponsorForm />,
          },
          {
            path: ':id/edit',
            element: <SponsorForm />,
          },
        ],
      },
      {
        path: 'schools',
        children: [
          {
            index: true,
            element: <SchoolsList />,
          },
          {
            path: ':id',
            element: <SchoolDetail />,
          },
          {
            path: 'new',
            element: <SchoolForm />,
          },
          {
            path: ':id/edit',
            element: <SchoolForm />,
          },
        ],
      },
    ],
  },
])
