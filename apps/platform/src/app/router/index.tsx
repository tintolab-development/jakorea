import { createBrowserRouter } from 'react-router-dom'
import {
  AdminRegisteredBirthPage,
  AdminRegisteredChangePasswordPage,
  AdminRegisteredCompletePage,
  AdminRegisteredConfirmPage,
  AdminRegisteredEditPage,
  AdminRegisteredIdentityPage,
  AdminRegisteredNoticePage,
  FindEmailCompletePage,
  FindEmailPage,
  FindPasswordCompletePage,
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
  SignUpSocialConnectCompletePage,
  SignUpSocialConnectErrorPage,
  SignUpSocialConnectPage,
  SocialErrorPage,
} from '@/pages/auth'
import { HomePage } from '@/pages/home'
import { MypageHomePage } from '@/pages/mypage'
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
import { PeoplePage } from '@/pages/about/people'
import { DesignSystemPage } from '@/pages/design-system'
import { YoutubeEmbedPage } from '@/pages/youtube-embed'
import { AppLayoutRoute } from './app-layout-route'

export const router = createBrowserRouter([
  {
    element: <AppLayoutRoute layout="default" />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/programs', element: <ProgramsPage /> },
      { path: '/programs/:programId', element: <ProgramDetailPage /> },
      { path: '/programs/:programId/apply/complete', element: <ProgramApplyCompletePage /> },
      { path: '/notices/:noticeId', element: <NoticeDetailPage /> },
      { path: '/results/:resultId', element: <ResultDetailPage /> },
    ],
  },
  {
    element: <AppLayoutRoute layout="hero" />,
    children: [
      { path: '/results', element: <ResultsPage /> },
      { path: '/notices', element: <NoticesPage /> },
      { path: '/education/textbooks', element: <TextbooksPage /> },
      { path: '/about/people', element: <PeoplePage /> },
      { path: '/about/directions', element: <DirectionsPage /> },
    ],
  },
  {
    element: <AppLayoutRoute layout="mypage" />,
    children: [{ path: '/mypage', element: <MypageHomePage /> }],
  },
  {
    element: <AppLayoutRoute layout="auth" />,
    children: [
      { path: '/auth/required', element: <RequiredPage /> },
      { path: '/auth/sign-in', element: <SignInPage /> },
      { path: '/auth/admin-registered/notice', element: <AdminRegisteredNoticePage /> },
      { path: '/auth/admin-registered/birth', element: <AdminRegisteredBirthPage /> },
      { path: '/auth/admin-registered/identity', element: <AdminRegisteredIdentityPage /> },
      {
        path: '/auth/admin-registered/change-password',
        element: <AdminRegisteredChangePasswordPage />,
      },
      { path: '/auth/admin-registered/confirm', element: <AdminRegisteredConfirmPage /> },
      { path: '/auth/admin-registered/edit', element: <AdminRegisteredEditPage /> },
      { path: '/auth/admin-registered/complete', element: <AdminRegisteredCompletePage /> },
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
      { path: '/programs/:programId/apply', element: <ProgramApplyPage /> },
      { path: '/design-system', element: <DesignSystemPage /> },
      { path: '/dev/youtube', element: <YoutubeEmbedPage /> },
    ],
  },
  {
    element: <AppLayoutRoute layout="default" />,
    children: [{ path: '*', element: <HomePage /> }],
  },
])
