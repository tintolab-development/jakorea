import { createBrowserRouter } from 'react-router-dom'
import {
  AdminRegisteredBirthPage,
  AdminRegisteredChangePasswordPage,
  AdminRegisteredCompletePage,
  AdminRegisteredConfirmPage,
  AdminRegisteredEditPage,
  AdminRegisteredIdentityPage,
  AdminRegisteredNoticePage,
  AdminRegisteredOnboardingLayout,
  FindEmailCompletePage,
  FindEmailPage,
  FindPasswordCompletePage,
  FindPasswordIdentityCallbackPage,
  FindPasswordPage,
  FindPasswordResetPage,
  RequiredPage,
  SignInPage,
  SignUpCompletePage,
  SignUpPage,
  SignUpIdentityCallbackPage,
  SignUpGuardianIdentityCallbackPage,
  SignUpIdentityMockNicePage,
  SignUpGuardianIdentityMockNicePage,
  FindPasswordIdentityMockNicePage,
  SignUpSocialConnectCompletePage,
  SignUpSocialConnectErrorPage,
  SignUpSocialConnectPage,
  SocialErrorPage,
} from '@/pages/auth'
import { HomePage } from '@/pages/home'
import {
  MypageHomePage,
  MypageInstructorApplyConsentPage,
  MypageInstructorApplyPage,
  MypageInquiriesPage,
  MypageEducationPage,
  MypageEducationDetailPage,
  MypageEducationSettlementConfirmPage,
  MypageEducationSettlementWritePage,
  MypageVolunteerPage,
  MypageVolunteerDetailPage,
  MypageSettingsPage,
} from '@/pages/mypage'
import {
  ProgramApplyCompletePage,
  ProgramApplyPage,
  ProgramDetailPage,
  ProgramsPage,
} from '@/pages/programs'
import { NoticeDetailPage, NoticesPage } from '@/pages/notices'
import { ResultDetailPage, ResultsPage } from '@/pages/results'
import { TextbooksPage } from '@/pages/education/textbooks'
import { DirectionsPage } from '@/pages/about/directions'
import { IntroductionPage } from '@/pages/about/introduction'
import { PeoplePage } from '@/pages/about/people'
import { TransparencyPage, TransparencyReportsPage } from '@/pages/about/transparency'
import { DesignSystemPage } from '@/pages/design-system'
import { ImpactStoriesPage, ImpactStoryDetailPage } from '@/pages/impact'
import { CorporateDonationPage } from '@/pages/support/corporate'
import { IndividualDonationPage } from '@/pages/support/individual'
import { TalentDonationPage } from '@/pages/support/talent'
import { TalentDonationApplyPage } from '@/pages/support/talent/apply'
import { TemporaryPage } from '@/pages/temporary'
import { CORPORATE_DONATION_PATH } from '@/features/corporate-donation'
import { IMPACT_STORIES_PATH } from '@/features/impact-story'
import { INTRODUCTION_PATH } from '@/features/introduction'
import { INDIVIDUAL_DONATION_PATH } from '@/features/individual-donation'
import { TALENT_DONATION_APPLY_PATH, TALENT_DONATION_PATH } from '@/features/talent-donation'
import {
  ABOUT_CAREERS_PATH,
  ABOUT_HISTORY_PATH,
  EDUCATION_CAREER_PATH,
  EDUCATION_DIGITAL_LITERACY_PATH,
  EDUCATION_ENTREPRENEURSHIP_PATH,
  EDUCATION_FINANCE_PATH,
} from '@/shared/config/gnb-temporary-paths'
import { AppLayoutRoute } from './app-layout-route'

export const router = createBrowserRouter([
  {
    element: <AppLayoutRoute layout="home" />,
    children: [{ path: '/', element: <HomePage /> }],
  },
  {
    element: <AppLayoutRoute layout="default" />,
    children: [
      { path: '/programs', element: <ProgramsPage /> },
      { path: '/programs/:programId/apply/complete', element: <ProgramApplyCompletePage /> },
      { path: '/mypage/education/:applicationId', element: <MypageEducationDetailPage /> },
      { path: '/mypage/volunteer/:applicationId', element: <MypageVolunteerDetailPage /> },
      { path: '/notices/:noticeId', element: <NoticeDetailPage /> },
      { path: '/results/:resultId', element: <ResultDetailPage /> },
      { path: '/impact/:storyId', element: <ImpactStoryDetailPage /> },
    ],
  },
  {
    element: <AppLayoutRoute layout="hero" />,
    children: [
      { path: '/results', element: <ResultsPage /> },
      { path: '/notices', element: <NoticesPage /> },
      { path: '/education/textbooks', element: <TextbooksPage /> },
      { path: EDUCATION_CAREER_PATH, element: <TemporaryPage /> },
      { path: EDUCATION_FINANCE_PATH, element: <TemporaryPage /> },
      { path: EDUCATION_ENTREPRENEURSHIP_PATH, element: <TemporaryPage /> },
      { path: EDUCATION_DIGITAL_LITERACY_PATH, element: <TemporaryPage /> },
      { path: '/about/people', element: <PeoplePage /> },
      { path: '/about/directions', element: <DirectionsPage /> },
      { path: '/about/transparency', element: <TransparencyPage /> },
      {
        path: '/about/transparency/annual-reports',
        element: <TransparencyReportsPage type="annual" />,
      },
      {
        path: '/about/transparency/audit-reports',
        element: <TransparencyReportsPage type="audit" />,
      },
      { path: ABOUT_HISTORY_PATH, element: <TemporaryPage /> },
      { path: ABOUT_CAREERS_PATH, element: <TemporaryPage /> },
      { path: IMPACT_STORIES_PATH, element: <ImpactStoriesPage /> },
    ],
  },
  {
    /* 기관소개 — ContentShell 없는 풀블리드 (support와 동일 계열) */
    element: <AppLayoutRoute layout="introduction" />,
    children: [{ path: INTRODUCTION_PATH, element: <IntroductionPage /> }],
  },
  {
    element: <AppLayoutRoute layout="support" />,
    children: [
      { path: INDIVIDUAL_DONATION_PATH, element: <IndividualDonationPage /> },
      { path: CORPORATE_DONATION_PATH, element: <CorporateDonationPage /> },
      { path: TALENT_DONATION_PATH, element: <TalentDonationPage /> },
      { path: TALENT_DONATION_APPLY_PATH, element: <TalentDonationApplyPage /> },
    ],
  },
  {
    element: <AppLayoutRoute layout="mypage" />,
    children: [{ path: '/mypage', element: <MypageHomePage /> }],
  },
  {
    element: <AppLayoutRoute layout="mypage-subpage" />,
    children: [
      { path: '/mypage/settings', element: <MypageSettingsPage /> },
      { path: '/mypage/education', element: <MypageEducationPage /> },
      { path: '/mypage/volunteer', element: <MypageVolunteerPage /> },
      { path: '/mypage/inquiries', element: <MypageInquiriesPage /> },
    ],
  },
  {
    element: <AppLayoutRoute layout="auth" />,
    children: [
      { path: '/auth/required', element: <RequiredPage /> },
      { path: '/auth/sign-in', element: <SignInPage /> },
      { path: '/auth/admin-registered/notice', element: <AdminRegisteredNoticePage /> },
      {
        element: <AdminRegisteredOnboardingLayout />,
        children: [
          { path: '/auth/admin-registered/birth', element: <AdminRegisteredBirthPage /> },
          { path: '/auth/admin-registered/identity', element: <AdminRegisteredIdentityPage /> },
          {
            path: '/auth/admin-registered/change-password',
            element: <AdminRegisteredChangePasswordPage />,
          },
          { path: '/auth/admin-registered/confirm', element: <AdminRegisteredConfirmPage /> },
          { path: '/auth/admin-registered/edit', element: <AdminRegisteredEditPage /> },
          { path: '/auth/admin-registered/complete', element: <AdminRegisteredCompletePage /> },
        ],
      },
      { path: '/auth/find-email', element: <FindEmailPage /> },
      { path: '/auth/find-email/complete', element: <FindEmailCompletePage /> },
      { path: '/auth/find-password', element: <FindPasswordPage /> },
      { path: '/auth/find-password/reset', element: <FindPasswordResetPage /> },
      { path: '/auth/find-password/complete', element: <FindPasswordCompletePage /> },
      { path: '/auth/sign-up', element: <SignUpPage /> },
      { path: '/auth/sign-up/complete', element: <SignUpCompletePage /> },
      { path: '/auth/sign-up/social-connect', element: <SignUpSocialConnectPage /> },
      {
        path: '/auth/sign-up/social-connect/complete',
        element: <SignUpSocialConnectCompletePage />,
      },
      { path: '/auth/sign-up/social-connect/error', element: <SignUpSocialConnectErrorPage /> },
      { path: '/auth/social/error', element: <SocialErrorPage /> },
    ],
  },
  {
    element: <AppLayoutRoute layout="full" />,
    children: [
      { path: '/auth/sign-up/identity/callback', element: <SignUpIdentityCallbackPage /> },
      { path: '/auth/sign-up/identity/mock', element: <SignUpIdentityMockNicePage /> },
      {
        path: '/auth/sign-up/guardian-identity/callback',
        element: <SignUpGuardianIdentityCallbackPage />,
      },
      {
        path: '/auth/sign-up/guardian-identity/mock',
        element: <SignUpGuardianIdentityMockNicePage />,
      },
      {
        path: '/auth/find-password/identity/callback',
        element: <FindPasswordIdentityCallbackPage />,
      },
      {
        path: '/auth/find-password/identity/mock',
        element: <FindPasswordIdentityMockNicePage />,
      },
      { path: '/programs/:programId', element: <ProgramDetailPage /> },
      { path: '/programs/:programId/apply', element: <ProgramApplyPage /> },
      { path: '/mypage/instructor-apply', element: <MypageInstructorApplyPage /> },
      {
        path: '/mypage/instructor-apply/consent/:consentKey',
        element: <MypageInstructorApplyConsentPage />,
      },
      {
        path: '/mypage/education/:applicationId/settlement/write',
        element: <MypageEducationSettlementWritePage />,
      },
      {
        path: '/mypage/education/:applicationId/settlement/confirm',
        element: <MypageEducationSettlementConfirmPage />,
      },
      { path: '/design-system', element: <DesignSystemPage /> },
    ],
  },
  {
    element: <AppLayoutRoute layout="home" />,
    children: [{ path: '*', element: <HomePage /> }],
  },
])
