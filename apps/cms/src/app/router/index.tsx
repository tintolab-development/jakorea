/**
 * 라우팅 구조 정의
 * Phase 1.1: React Router 설정
 * 코드 스플리팅 적용: React.lazy를 사용한 동적 import
 */

import { lazy, Suspense } from 'react'
import { Navigate, createBrowserRouter, useLocation, useParams } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { ProtectedRoute } from '@/app/components/protected-route'
import { RouterLoadingFallback } from '@/app/router/loading-fallback'
import { useAuthStore } from '@/features/auth/model/auth-store'
import './router.css'

// Lazy loading wrapper - named export를 default export로 변환
// Suspense 경계는 Layout 콘텐츠 영역에서 통합 처리
const lazyLoad = <T extends React.ComponentType<any>>(importFunc: () => Promise<any>) => {
  return lazy(async () => {
    const module = await importFunc()
    const Component = (module.default || Object.values(module)[0]) as T
    if (!Component) {
      throw new Error('Failed to load component: No export found')
    }
    return { default: Component }
  })
}

const ParticipantRecruitmentUserFullPage = lazyLoad(
  () => import('@/pages/programs/general/participant-recruitment-user-full-page')
)

// 인증 관련 페이지 (즉시 로드)
import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { RegisterCompletePage } from '@/pages/auth/register-complete-page'
import { RegisterSocialConnectCompletePage } from '@/pages/auth/register-social-connect-complete-page'
import { RegisterSocialConnectFailedPage } from '@/pages/auth/register-social-connect-failed-page'
import { RegisterSocialConnectPage } from '@/pages/auth/register-social-connect-page'
import { SocialConnectCompletePage } from '@/pages/auth/social-connect-complete-page'
import { RegisterIdentityCallbackPage } from '@/pages/auth/register-identity-callback-page'
import { RegisterIdentityMockNicePage } from '@/pages/auth/register-identity-mock-nice-page'
import { FindEmailPage } from '@/pages/auth/find-email-page'
import { FindEmailIdentityCallbackPage } from '@/pages/auth/find-email-identity-callback-page'
import { FindEmailIdentityMockNicePage } from '@/pages/auth/find-email-identity-mock-nice-page'
import { FindPasswordPage } from '@/pages/auth/find-password-page'
import { FindPasswordIdentityCallbackPage } from '@/pages/auth/find-password-identity-callback-page'
import { FindPasswordIdentityMockNicePage } from '@/pages/auth/find-password-identity-mock-nice-page'
import { MfaPage } from '@/pages/auth/mfa-page'
import { PasswordChangeRequiredPage } from '@/pages/auth/password-change-required-page'
import { PasswordChangeRequiredBirthPage } from '@/pages/auth/password-change-required-birth-page'
import { PasswordChangeRequiredIdentityPage } from '@/pages/auth/password-change-required-identity-page'
import { PasswordChangeRequiredChangePasswordPage } from '@/pages/auth/password-change-required-change-password-page'
import { PasswordChangeRequiredIdentityCallbackPage } from '@/pages/auth/password-change-required-identity-callback-page'
import { PasswordChangeRequiredIdentityMockNicePage } from '@/pages/auth/password-change-required-identity-mock-nice-page'
import { OAuthCallbackPage } from '@/pages/auth/oauth-callback-page'
import { LoginSocialCompletePage } from '@/pages/auth/login-social-complete-page'
import { RegisterSocialSignupCallbackPage } from '@/pages/auth/register-social-signup-callback-page'
import { ForbiddenPage } from '@/pages/error/forbidden-page'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'

const programCategoryPreparing = (
  <ComingSoonPage
    title="페이지 준비중"
    description="해당 프로그램 영역은 현재 준비 중입니다. 곧 이용하실 수 있습니다."
  />
)

/** 레거시 `/programs/education/…`·`/programs/economy-education/…` → 신규 경로로 통일 */
function ProgramsSubpathRedirect({ toBase }: { toBase: string }) {
  const params = useParams()
  const { search } = useLocation()
  const rest = params['*'] ?? ''
  const to = rest ? `${toBase}/${rest}` : toBase
  return <Navigate to={`${to}${search}`} replace />
}
import TemplatesFormManagementOutlet from '@/pages/templates/templates-form-management-outlet'
import { TemplatesRouteLayout } from '@/pages/templates/templates-route-layout'
import { GeneralProgramListRouteShell } from '@/pages/programs/general/general-program-list-route-shell'
import { RedirectLegacyTemplatesProgramForms } from '@/features/template/template-route-redirects'
import { GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID } from '@/features/program/general/lib/detail-common-info-display'

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
const SponsorDataPage = lazyLoad(() => import('@/pages/data-management/sponsor-page'))
const TextbookPage = lazyLoad(() => import('@/pages/data-management/textbook-page'))
const DetailedProgramPage = lazyLoad(() => import('@/pages/data-management/detailed-program-page'))
const ProgramListPage = lazyLoad(() => import('@/pages/programs/program-list-page'))
const ProgramFormPage = lazyLoad(() => import('@/pages/programs/program-form-page'))
const UjatProgramListPage = lazyLoad(() => import('@/pages/programs/UJAT/page'))
const UjatEducationRegionsPage = lazyLoad(
  () => import('@/pages/programs/UJAT/education-regions-page')
)
const TrainedTeachersProgramPage = lazyLoad(
  () => import('@/pages/programs/trained-teachers/page')
)
const GeminiVisitingTrainingPage = lazyLoad(
  () => import('@/pages/programs/gemini/visiting-training/page')
)
const GeminiPerformancePage = lazyLoad(
  () => import('@/pages/programs/gemini/performance/page')
)
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
const ErrorPage = lazyLoad(() => import('@/pages/error/error-page'))
const TemplateListPage = lazyLoad(() =>
  import('@/pages/templates/template-list-page').then(m => ({ default: m.TemplateListPage }))
)
const AdminCategoryPage = lazyLoad(() => import('@/pages/posts/admin-category-page'))
const AdminNoticeListPage = lazyLoad(() => import('@/pages/posts/admin-notice-list-page'))
const AdminNoticeDetailPage = lazyLoad(() => import('@/pages/posts/admin-notice-detail-page'))
const AdminFAQPage = lazyLoad(() => import('@/pages/posts/admin-faq-page'))
const AdminFaqDetailPage = lazyLoad(() => import('@/pages/posts/admin-faq-detail-page'))
const AdminInquiryPage = lazyLoad(() => import('@/pages/posts/admin-inquiry-page'))
const PermissionCustomizationPage = lazyLoad(
  () => import('@/pages/admin/settings/permission-customization-page')
)
const PermissionRequestListPage = lazyLoad(
  () => import('@/pages/admin/permission-request-list-page')
)
const KakaoAlimtalkPage = lazyLoad(() => import('@/pages/notifications/kakao-alimtalk-page'))
const MailPage = lazyLoad(() => import('@/pages/notifications/mail-page'))
const SchoolMyLearningPage = lazyLoad(() => import('@/pages/surveys/school-my-learning-page'))
const FAQPage = lazyLoad(() => import('@/pages/notices/faq-page'))
const InquiryPage = lazyLoad(() => import('@/pages/notices/inquiry-page'))
const MemberLoginHistoryPage = lazyLoad(() => import('@/pages/logs/member-login-history-page'))
const FileDownloadHistoryPage = lazyLoad(() => import('@/pages/logs/file-download-history-page'))
const PersonalInfoAccessHistoryPage = lazyLoad(
  () => import('@/pages/logs/personal-info-access-history-page')
)
const BugIssueHistoryPage = lazyLoad(() => import('@/pages/logs/bug-issue-history-page'))
const DesignSystemPage = lazyLoad(() => import('@/pages/design-system/page'))
const E2eErrorLogPage = lazyLoad(() => import('@/pages/e2e-error-log/page'))
const BackendDummiesPage = lazyLoad(() => import('@/pages/backend-dummies/page'))
const BackendDummiesCategoryPage = lazyLoad(() => import('@/pages/backend-dummies/category-page'))

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
    path: '/register/complete',
    element: <RegisterCompletePage />,
  },
  {
    path: '/register/social-connect',
    element: <RegisterSocialConnectPage />,
  },
  {
    path: '/register/social-connect/complete',
    element: <RegisterSocialConnectCompletePage />,
  },
  {
    path: '/register/social-connect/failed',
    element: <RegisterSocialConnectFailedPage />,
  },
  {
    path: '/social-connect/complete',
    element: <SocialConnectCompletePage />,
  },
  {
    path: '/register/social-connect/callback',
    element: <RegisterSocialSignupCallbackPage />,
  },
  {
    path: '/register/identity/callback',
    element: <RegisterIdentityCallbackPage />,
  },
  {
    path: '/register/identity/mock',
    element: <RegisterIdentityMockNicePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/login/social/complete',
    element: <LoginSocialCompletePage />,
  },
  {
    path: '/find-email',
    element: <FindEmailPage />,
  },
  {
    path: '/find-email/identity/callback',
    element: <FindEmailIdentityCallbackPage />,
  },
  {
    path: '/find-email/identity/mock',
    element: <FindEmailIdentityMockNicePage />,
  },
  {
    path: '/find-password',
    element: <FindPasswordPage />,
  },
  {
    path: '/find-password/identity/callback',
    element: <FindPasswordIdentityCallbackPage />,
  },
  {
    path: '/find-password/identity/mock',
    element: <FindPasswordIdentityMockNicePage />,
  },
  {
    path: '/auth/mfa',
    element: <MfaPage />,
  },
  {
    path: '/auth/password-change-required',
    element: <PasswordChangeRequiredPage />,
  },
  {
    path: '/auth/password-change-required/birth',
    element: <PasswordChangeRequiredBirthPage />,
  },
  {
    path: '/auth/password-change-required/identity',
    element: <PasswordChangeRequiredIdentityPage />,
  },
  {
    path: '/auth/password-change-required/identity/callback',
    element: <PasswordChangeRequiredIdentityCallbackPage />,
  },
  {
    path: '/auth/password-change-required/identity/mock',
    element: <PasswordChangeRequiredIdentityMockNicePage />,
  },
  {
    path: '/auth/password-change-required/change-password',
    element: <PasswordChangeRequiredChangePasswordPage />,
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
    path: '/preview/programs/general/participant-recruitment',
    element: (
      <Navigate
        to={`/preview/programs/general/${GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID}/participant-recruitment`}
        replace
      />
    ),
  },
  {
    path: '/preview/programs/general/:programId/participant-recruitment',
    element: (
      <ProtectedRoute>
        <ParticipantRecruitmentUserFullPage />
      </ProtectedRoute>
    ),
  },
  {
    // 로그인·역할 없이 공개 접근 (쇼케이스/문서용)
    path: '/design-system',
    element: (
      <Suspense fallback={<RouterLoadingFallback fullViewport />}>
        <DesignSystemPage />
      </Suspense>
    ),
  },
  {
    // 로컬·E2E 디버그: 테스트 진행·백엔드 에러 Mock 로그 (로그인 불필요, ?tab=error)
    path: '/e2e-error-log',
    element: (
      <Suspense fallback={<RouterLoadingFallback fullViewport />}>
        <E2eErrorLogPage />
      </Suspense>
    ),
  },
  {
    // LNB 전체 도메인 API/더미 적용률 대시보드 (로그인 불필요 · 회원·프로그램 env 게이트 포함)
    path: '/backend-dummies',
    element: (
      <Suspense fallback={<RouterLoadingFallback fullViewport />}>
        <BackendDummiesPage />
      </Suspense>
    ),
  },
  {
    path: '/backend-dummies/:categoryId',
    element: (
      <Suspense fallback={<RouterLoadingFallback fullViewport />}>
        <BackendDummiesCategoryPage />
      </Suspense>
    ),
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
        element: <Navigate to="/sponsor" replace />,
      },
      {
        path: 'sponsors/*',
        element: <Navigate to="/sponsor" replace />,
      },
      {
        path: 'data-management',
        element: <Navigate to="/sponsor" replace />,
      },
      {
        path: 'sponsor',
        element: <SponsorDataPage />,
      },
      {
        path: 'textbook',
        element: <TextbookPage />,
      },
      {
        path: 'detailed-program',
        element: <DetailedProgramPage />,
      },
      {
        path: 'message-management',
        children: [
          { index: true, element: <Navigate to="alimtalk" replace /> },
          {
            path: 'alimtalk',
            element: (
              <ComingSoonPage
                title="알림톡 관리"
                description="알림톡 관리 기능은 현재 준비 중입니다."
              />
            ),
          },
          {
            path: 'mail',
            element: (
              <ComingSoonPage
                title="메일 관리"
                description="메일 관리 기능은 현재 준비 중입니다."
              />
            ),
          },
          {
            path: 'sms',
            element: (
              <ComingSoonPage
                title="문자 관리"
                description="문자 관리 기능은 현재 준비 중입니다."
              />
            ),
          },
        ],
      },
      {
        path: 'programs',
        children: [
          { index: true, element: <ProgramListPage /> },
          { path: 'general', element: <GeneralProgramListRouteShell /> },
          { path: 'general/*', element: <ProgramListPage /> },
          { path: 'company-school', element: <ProgramListPage /> },
          { path: 'company-school/*', element: <ProgramListPage /> },
          { path: 'trained-teachers', element: <TrainedTeachersProgramPage /> },
          { path: 'trained-teachers/*', element: <TrainedTeachersProgramPage /> },
          { path: 'ujat/regions', element: <UjatEducationRegionsPage /> },
          { path: 'ujat/regions/*', element: <UjatEducationRegionsPage /> },
          { path: 'ujat', element: <UjatProgramListPage /> },
          { path: 'ujat/*', element: <UjatProgramListPage /> },
          { path: 'gemini/performance', element: <GeminiPerformancePage /> },
          { path: 'gemini/performance/*', element: <GeminiPerformancePage /> },
          { path: 'gemini/visiting-training', element: <GeminiVisitingTrainingPage /> },
          { path: 'gemini/visiting-training/*', element: <GeminiVisitingTrainingPage /> },
          { path: 'gemini', element: programCategoryPreparing },
          { path: 'gemini/*', element: programCategoryPreparing },
          { path: 'volunteer', element: <ProgramListPage /> }, // 봉사 프로그램 (기존 경로 유지)
          {
            path: 'education/*',
            element: <ProgramsSubpathRedirect toBase="/programs/general" />,
          },
          {
            path: 'economy-education/*',
            element: <ProgramsSubpathRedirect toBase="/programs/company-school" />,
          },
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
        element: <TemplatesRouteLayout />,
        children: [
          {
            element: <TemplateListPage />,
            children: [
              {
                path: 'form-management',
                element: <TemplatesFormManagementOutlet />,
              },
              {
                path: 'banner',
                element: (
                  <ComingSoonPage
                    title="배너 관리"
                    description="배너 관리 기능은 현재 준비 중입니다."
                  />
                ),
              },
              // 구 경로 호환 (쿼리 보존)
              { path: 'program-forms', element: <RedirectLegacyTemplatesProgramForms /> },
              { path: 'program-forms/*', element: <RedirectLegacyTemplatesProgramForms /> },
              { index: true, element: <Navigate to="form-management" replace /> },
            ],
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
              { path: 'notices/:id', element: <AdminNoticeDetailPage /> },
              { path: 'faq/:id', element: <AdminFaqDetailPage /> },
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
            element: (
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <PermissionRequestListPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'permission-requests/*',
            element: (
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <PermissionRequestListPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'notifications',
            children: [
              {
                index: true,
                element: <Navigate to="/admin/notifications/kakao-alimtalk" replace />,
              },
              {
                path: 'kakao-alimtalk',
                element: (
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <KakaoAlimtalkPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'mail',
                element: (
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <MailPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'sms',
                element: (
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <ComingSoonPage
                      title="문자 관리"
                      description="문자 관리 기능은 현재 준비 중입니다."
                    />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'mail-sms',
                element: <Navigate to="/admin/notifications/mail" replace />,
              },
            ],
          },
          {
            path: 'logs',
            children: [
              {
                path: 'audit',
                element: <Navigate to="/logs/file-download-history" replace />,
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
            element: <Navigate to="file-download-history" replace />,
          },
          {
            path: 'member-login-history',
            element: <MemberLoginHistoryPage />,
          },
          {
            path: 'file-download-history',
            element: <FileDownloadHistoryPage />,
          },
          {
            path: 'personal-info-access-history',
            element: <PersonalInfoAccessHistoryPage />,
          },
          {
            path: 'bug-issue-history',
            element: <BugIssueHistoryPage />,
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
        path: 'dashboard',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'dashboard/*',
        element: <Navigate to="/" replace />,
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
