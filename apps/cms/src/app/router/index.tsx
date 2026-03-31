/**
 * 라우팅 구조 정의
 * Phase 1.1: React Router 설정
 * 코드 스플리팅 적용: React.lazy를 사용한 동적 import
 */

import { lazy, Suspense } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { ProtectedRoute } from '@/app/components/protected-route'
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
import { OAuthCallbackPage } from '@/pages/auth/oauth-callback-page'
import { ForbiddenPage } from '@/pages/error/forbidden-page'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'

// 대시보드 (즉시 로드 - 첫 화면)
import { IndexPage } from '@/pages/home/index-page'
const MyLearningPage = lazyLoad(() => import('@/pages/my-learning/my-learning-page'))

// 나머지 페이지들은 lazy loading
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
const SchoolDetailPage = lazyLoad(() => import('@/pages/schools/school-detail-page'))
const SchoolFormPage = lazyLoad(() => import('@/pages/schools/school-form-page'))
const ProgramListPage = lazyLoad(() => import('@/pages/programs/program-list-page'))
const EducationProgramLayout = lazyLoad(() =>
  import('@/pages/programs/education-program-layout').then(m => ({
    default: m.EducationProgramLayout,
  }))
)
const EducationEnrollmentPage = lazyLoad(() =>
  import('@/pages/programs/education-enrollment-page').then(m => ({
    default: m.EducationEnrollmentPage,
  }))
)
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
const MyFavoriteProgramsPage = lazyLoad(() => import('@/pages/programs/my-favorite-programs-page'))
const MyScheduleListPage = lazyLoad(() => import('@/pages/schedules/my-schedule-list-page'))
const MyScheduleCalendarPage = lazyLoad(() => import('@/pages/schedules/my-schedule-calendar-page'))
const MyScheduleDetailPage = lazyLoad(() => import('@/pages/schedules/my-schedule-detail-page'))
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
const PaymentOrdersPage = lazyLoad(() => import('@/pages/settlement-management/payment-orders-page'))
const AccountPaymentsPage = lazyLoad(() => import('@/pages/settlement-management/account-payments-page'))
const SettlementItemSettingsPage = lazyLoad(
  () => import('@/pages/settlement-management/settlement-item-settings-page')
)
const ProfilePage = lazyLoad(() => import('@/pages/mypage/profile-page'))
const NoticeListPage = lazyLoad(() => import('@/pages/notices/notice-list-page'))
const EducationRecordListPage = lazyLoad(
  () => import('@/pages/education-records/education-record-list-page')
)
const UserListPage = lazyLoad(() => import('@/pages/users/user-list-page'))
const ParticipantListPage = lazyLoad(() => import('@/pages/users/participant-list-page'))
const ErrorPage = lazyLoad(() => import('@/pages/error/error-page'))
const TemplateListPage = lazyLoad(() => import('@/pages/templates/template-list-page'))
const TemplateProgramFormsPage = lazyLoad(
  () => import('@/pages/templates/template-program-forms-page')
)
const TemplateFilesPage = lazyLoad(() => import('@/pages/templates/template-files-page'))
const TemplateSmsPage = lazyLoad(() => import('@/pages/templates/template-sms-page'))
const TemplateEmailPage = lazyLoad(() => import('@/pages/templates/template-email-page'))
const AdminCategoryPage = lazyLoad(() => import('@/pages/posts/admin-category-page'))
const AdminNoticeListPage = lazyLoad(() => import('@/pages/posts/admin-notice-list-page'))
const AdminFAQPage = lazyLoad(() => import('@/pages/posts/admin-faq-page'))
const AdminInquiryPage = lazyLoad(() => import('@/pages/posts/admin-inquiry-page'))
const PermissionCustomizationPage = lazyLoad(
  () => import('@/pages/admin/settings/permission-customization-page')
)
const SchoolMyLearningPage = lazyLoad(() => import('@/pages/surveys/school-my-learning-page'))
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
    return <Navigate to={isAdmin ? '/admin/posts/notices' : '/notices'} replace />
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
    path: '/oauth/google',
    element: <OAuthCallbackPage provider="google" />,
  },
  {
    path: '/oauth/kakao',
    element: <OAuthCallbackPage provider="kakao" />,
  },
  {
    path: '/oauth/naver',
    element: <OAuthCallbackPage provider="naver" />,
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
        element: <IndexPage />,
      },
      {
        path: 'my-learning',
        element: <MyLearningPage />,
      },
      {
        path: 'instructors',
        children: [
          { index: true, element: <Navigate to="/users/list?kind=instructors" replace /> },
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
          { index: true, element: <Navigate to="/users/list?kind=institutions" replace /> },
          { path: 'new', element: <SchoolFormPage /> },
          { path: ':id', element: <SchoolDetailPage /> },
          { path: ':id/edit', element: <SchoolFormPage /> },
        ],
      },
      {
        path: 'programs',
        children: [
          { index: true, element: <ProgramListPage /> },
          { path: 'education/schedule', element: <ComingSoonPage title="페이지 준비중" /> }, // 교육 프로그램 > 프로그램 일정
          {
            path: 'education',
            element: <EducationProgramLayout />,
            children: [
              { index: true, element: <ProgramListPage /> }, // 교육 프로그램 > 전체 프로그램
              { path: 'student-recruitment', element: <ProgramListPage /> }, // 수강자 모집
              { path: 'instructor-recruitment', element: <ProgramListPage /> }, // 강의 신청 현황 > 강사 모집 중
              { path: 'enrollment', element: <EducationEnrollmentPage /> }, // 수강 신청 현황
            ],
          },
          { path: 'volunteer', element: <ProgramListPage /> }, // 봉사 프로그램 (기존 경로 유지)
          { path: 'economy-education', element: <ProgramListPage /> }, // 경제 교육 프로그램
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
        path: 'school',
        children: [
          { path: 'my-learning', element: <SchoolMyLearningPage /> },
          { path: 'applications', element: <Navigate to="/programs/my" replace /> },
          { path: 'applications/*', element: <Navigate to="/programs/my" replace /> },
        ],
      },
      {
        path: 'instructor',
        children: [
          { index: true, element: <InstructorMypagePage /> },
          { path: 'applications', element: <Navigate to="/programs/my" replace /> },
          { path: 'applications/*', element: <Navigate to="/programs/my" replace /> },
          { path: 'documents', element: <InstructorDocumentsPage /> },
          { path: 'schedule', element: <InstructorSchedulePage /> },
          { path: 'reports', element: <InstructorReportsPage /> },
        ],
      },
      {
        path: 'education-records',
        children: [{ index: true, element: <EducationRecordListPage /> }],
      },
      {
        path: 'settlement-management',
        children: [
          {
            index: true,
            element: <Navigate to="/settlement-management/payment-orders" replace />,
          },
          {
            path: 'payment-orders',
            element: <PaymentOrdersPage />,
          },
          {
            path: 'account-payments',
            element: <AccountPaymentsPage />,
          },
          {
            path: 'item-settings',
            element: <SettlementItemSettingsPage />,
          },
        ],
      },
      {
        path: 'schedules',
        children: [
          {
            index: true,
            element: <Navigate to="/programs/education/schedule" replace />,
          },
          { path: 'my', element: <MyScheduleListPage /> },
          { path: 'my/calendar', element: <MyScheduleCalendarPage /> },
          { path: ':id', element: <MyScheduleDetailPage /> },
        ],
      },
      {
        path: 'settlements',
        children: [
          {
            index: true,
            element: <Navigate to="/programs/education/enrollment" replace />,
          },
          { path: 'pending', element: <Navigate to="/programs/education/enrollment" replace /> },
          { path: 'review', element: <Navigate to="/programs/education/enrollment" replace /> },
          { path: 'paid', element: <Navigate to="/programs/education/enrollment" replace /> },
          { path: 'overview', element: <Navigate to="/programs/education/enrollment" replace /> },
          { path: 'monthly', element: <Navigate to="/programs/education/enrollment" replace /> },
          {
            path: 'calculation-settings',
            element: <Navigate to="/programs/education/enrollment" replace />,
          },
          {
            path: 'payment-statements',
            element: <Navigate to="/programs/education/enrollment" replace />,
          },
          {
            path: 'schedule-negotiations',
            element: <Navigate to="/programs/education/enrollment" replace />,
          },
          {
            path: 'my',
            children: [
              { index: true, element: <MySettlementListPage /> },
              { path: 'monthly', element: <MyMonthlySettlementPage /> },
              { path: 'submit', element: <MySettlementSubmissionPage /> },
              { path: ':id', element: <MySettlementDetailPage /> },
            ],
          },
        ],
      },
      {
        path: 'users',
        children: [
          { index: true, element: <Navigate to="/users/list?kind=all" replace /> },
          { path: 'list', element: <UserListPage /> },
          { path: 'participants', element: <ParticipantListPage /> },
          {
            path: 'instructors',
            element: <Navigate to="/users/list?kind=instructors" replace />,
          },
        ],
      },
      {
        path: 'mypage',
        children: [
          { index: true, element: <Navigate to="/mypage/profile" replace /> },
          { path: 'profile', element: <ProfilePage /> },
          // 학교(교사) 인증 / 교사 정보 (인증 상태에 따라 동적 처리)
          {
            path: 'school-auth',
            element: (
              <ComingSoonPage
                title="학교(교사) 인증"
                description="학교(교사) 인증 프로세스는 현재 준비 중입니다. 곧 만나보실 수 있습니다."
              />
            ),
          },
          {
            path: 'school-info',
            element: (
              <ComingSoonPage
                title="교사 정보"
                description="교사 정보 조회 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
              />
            ),
          },
          // 강사 인증 / 강사 정보 (인증 상태에 따라 동적 처리)
          {
            path: 'instructor-auth',
            element: (
              <ComingSoonPage
                title="강사 인증"
                description="강사 인증 프로세스는 현재 준비 중입니다. 곧 만나보실 수 있습니다."
              />
            ),
          },
          {
            path: 'instructor-info',
            element: (
              <ComingSoonPage
                title="강사 정보"
                description="강사 정보 조회 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
              />
            ),
          },
          // 내 프로그램 일정 (2뎁스)
          {
            path: 'program-schedule',
            element: (
              <ComingSoonPage
                title="내 프로그램 일정"
                description="내 프로그램 일정 조회 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
              />
            ),
          },
          // 서류 발급 이력 (2뎁스)
          {
            path: 'documents',
            element: (
              <ComingSoonPage
                title="서류 발급 이력"
                description="서류 발급 이력 조회 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
              />
            ),
          },
        ],
      },
      {
        path: 'templates',
        element: <TemplateListPage />,
        children: [
          // 프로그램 양식
          {
            path: 'program-forms',
            children: [
              {
                index: true,
                element: <TemplateProgramFormsPage />,
              },
            ],
          },
          // 파일 양식 (단일 경로, 카테고리는 ?category= 쿼리로 관리)
          {
            path: 'file-forms',
            children: [
              { index: true, element: <TemplateFilesPage /> },
              // 기존 북마크/링크 호환: 하위 경로 → 쿼리 파라미터로 리다이렉트
              {
                path: 'instructor-resume',
                element: <Navigate to="/templates/file-forms?category=instructor-resume" replace />,
              },
              {
                path: 'lecture-report',
                element: <Navigate to="/templates/file-forms?category=lecture-report" replace />,
              },
              {
                path: 'education-plan',
                element: <Navigate to="/templates/file-forms?category=education-plan" replace />,
              },
              {
                path: 'certificate',
                element: <Navigate to="/templates/file-forms?category=certificate" replace />,
              },
              {
                path: 'activity-confirmation',
                element: (
                  <Navigate to="/templates/file-forms?category=activity-confirmation" replace />
                ),
              },
              {
                path: 'receipt',
                element: <Navigate to="/templates/file-forms?category=receipt" replace />,
              },
              {
                path: 'payment-statement',
                element: <Navigate to="/templates/file-forms?category=payment-statement" replace />,
              },
              {
                path: 'employment-certificate',
                element: (
                  <Navigate to="/templates/file-forms?category=employment-certificate" replace />
                ),
              },
            ],
          },
          // 문자(SMS) 양식 (persona: /templates/sms)
          {
            path: 'sms',
            element: <TemplateSmsPage />,
          },
          // 기존 경로 호환: 카카오 알림톡 → sms로 리다이렉트
          {
            path: 'kakao-alimtalk',
            element: <Navigate to="/templates/sms" replace />,
          },
          // 메일 관리 (기존 email 페이지 연결)
          {
            path: 'email',
            element: <TemplateEmailPage />,
          },
          // 배너 관리
          {
            path: 'banner',
            element: (
              <ComingSoonPage
                title="배너 관리"
                description="배너 관리 기능은 현재 준비 중입니다."
              />
            ),
          },
          // 기존 경로 호환성 유지 (리다이렉트)
          {
            index: true,
            element: <Navigate to="file-forms" replace />,
          },
          {
            path: 'files',
            element: <Navigate to="file-forms" replace />,
          },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            path: 'members',
            element: <Navigate to="/users/list?kind=admins" replace />,
          },
          {
            path: 'posts',
            children: [
              { index: true, element: <Navigate to="/admin/posts/notices" replace /> },
              { path: 'categories', element: <AdminCategoryPage /> },
              { path: 'notices', element: <AdminNoticeListPage /> },
              { path: 'faq', element: <AdminFAQPage /> },
              { path: 'inquiries', element: <AdminInquiryPage /> },
            ],
          },
          {
            path: 'settings',
            children: [
              {
                path: 'permissions',
                element: (
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <PermissionCustomizationPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'settlements',
            element: <Navigate to="/programs/education/enrollment" replace />,
          },
          {
            path: 'settlements/*',
            element: <Navigate to="/programs/education/enrollment" replace />,
          },
          {
            path: 'permission-requests',
            element: <Navigate to="/admin/settings/permissions" replace />,
          },
          {
            path: 'permission-requests/*',
            element: <Navigate to="/admin/settings/permissions" replace />,
          },
          {
            path: 'logs',
            children: [
              {
                path: 'audit',
                element: <Navigate to="/logs/bug" replace />,
              },
            ],
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
        children: [
          {
            index: true,
            element: <Navigate to="bug" replace />,
          },
          {
            path: 'bug',
            element: (
              <ComingSoonPage title="버그" description="버그 관리 기능은 현재 준비 중입니다." />
            ),
          },
          {
            path: 'issue',
            element: (
              <ComingSoonPage title="이슈" description="이슈 관리 기능은 현재 준비 중입니다." />
            ),
          },
        ],
      },
      {
        path: 'notices',
        children: [
          { index: true, element: <NoticeListPage /> },
          { path: 'faq', element: <FAQPage /> },
          {
            path: 'inquiries',
            children: [
              { index: true, element: <InquiryPage /> },
              // 내 문의 내역 (2뎁스)
              {
                path: 'my',
                element: (
                  <ComingSoonPage
                    title="내 문의 내역"
                    description="내 문의 내역 조회 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
                  />
                ),
              },
            ],
          },
        ],
      },
      {
        path: 'applications',
        element: <Navigate to="/programs/education/enrollment" replace />,
      },
      {
        path: 'applications/*',
        element: <Navigate to="/programs/education/enrollment" replace />,
      },
      {
        path: 'instructor-applications',
        element: <Navigate to="/programs/education/instructor-recruitment" replace />,
      },
      {
        path: 'instructor-applications/*',
        element: <Navigate to="/programs/education/instructor-recruitment" replace />,
      },
      {
        path: 'application-paths',
        element: <Navigate to="/programs/education" replace />,
      },
      {
        path: 'education-records-v2',
        element: <Navigate to="/education-records" replace />,
      },
      {
        path: 'education-records-v2/*',
        element: <Navigate to="/education-records" replace />,
      },
      {
        path: 'performance',
        element: <Navigate to="/education-records" replace />,
      },
      {
        path: 'schedule-negotiations',
        element: <Navigate to="/programs/education/enrollment" replace />,
      },
      {
        path: 'matchings',
        element: <Navigate to="/programs/education/instructor-recruitment" replace />,
      },
      {
        path: 'matchings/*',
        element: <Navigate to="/programs/education/instructor-recruitment" replace />,
      },
      {
        path: 'interviews',
        element: <Navigate to="/programs/education/instructor-recruitment" replace />,
      },
      {
        path: 'interviews/*',
        element: <Navigate to="/programs/education/instructor-recruitment" replace />,
      },
      {
        path: 'todos',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'todos/*',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'reports',
        element: <Navigate to="/instructor/reports" replace />,
      },
      {
        path: 'reports/*',
        element: <Navigate to="/instructor/reports" replace />,
      },
      {
        path: 'lectures',
        element: <Navigate to="/programs" replace />,
      },
      {
        path: 'lectures/*',
        element: <Navigate to="/programs" replace />,
      },
      {
        path: 'volunteers',
        element: <Navigate to="/programs/volunteer" replace />,
      },
      {
        path: 'volunteers/*',
        element: <Navigate to="/programs/volunteer" replace />,
      },
      {
        path: 'histories',
        element: <Navigate to="/programs" replace />,
      },
      {
        path: 'histories/*',
        element: <Navigate to="/programs" replace />,
      },
      {
        path: 'my',
        children: [
          { path: 'applications', element: <Navigate to="/programs/my" replace /> },
          { path: 'applications/*', element: <Navigate to="/programs/my" replace /> },
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
      // Phase 0.1.5: 404 페이지 개선 - 권한별 존재하지 않는 카테고리는 ComingSoonPage로 표시
      // 실제 404는 ErrorPage로 유지 (권한 체크는 ProtectedRoute에서 처리)
      {
        path: '*',
        element: (
          <ComingSoonPage
            title="페이지를 찾을 수 없습니다"
            description="요청하신 페이지가 존재하지 않거나 이동되었습니다. 해당 기능은 현재 준비 중입니다."
          />
        ),
      },
    ],
  },
])
