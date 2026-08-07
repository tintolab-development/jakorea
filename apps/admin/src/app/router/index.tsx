import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { HomePage } from '@/pages/home/page'
import { BiPage } from '@/pages/ja-korea/bi/page'
import { DirectionsPage } from '@/pages/ja-korea/directions/page'
import { HistoryAwardsCertsPage } from '@/pages/ja-korea/history-awards-certs/page'
import { IncomeExpensePage } from '@/pages/ja-korea/income-expense/page'
import { IntroPage } from '@/pages/ja-korea/intro/page'
import { GlobalValuePage } from '@/pages/ja-korea/global-value/page'
import { PeoplePage } from '@/pages/ja-korea/people/page'
import { PrinciplesPage } from '@/pages/ja-korea/principles/page'
import { ReportsDisclosurePage } from '@/pages/ja-korea/reports-disclosure/page'
import { NoticesPage } from '@/pages/ja-korea/notices/page'
import { NoticeDetailPage } from '@/pages/ja-korea/notices/detail-page'
import { ImpactStoriesPage } from '@/pages/impact/stories/page'
import { ImpactStoryDetailPage } from '@/pages/impact/stories/detail-page'
import { WorldwidePage } from '@/pages/ja-korea/worldwide/page'
import { HeroBannersPage } from '@/pages/main/hero-banners/page'
import { StripBannersPage } from '@/pages/main/strip-banners/page'
import { SocialLinksPage } from '@/pages/main/social-links/page'
import { ContentsPage } from '@/pages/main/contents/page'
import { PopupsPage } from '@/pages/main/popups/page'
import { DesignSystemPage } from '@/pages/design-system/page'
import { EducationFieldsPage } from '@/pages/education/fields/page'
import { EducationTextbooksPage } from '@/pages/education/textbooks/page'
import { IndividualDonationPage } from '@/pages/sponsor/individual/page'
import { CorporateGuidePage } from '@/pages/sponsor/corporate/guide/page'
import { CorporatePartnersPage } from '@/pages/sponsor/corporate/partners/page'
import { CorporateConsultationsPage } from '@/pages/sponsor/corporate/consultations/page'
import { SiteInfoPage } from '@/pages/site/info/page'
import { GnbMenuPage } from '@/pages/site/gnb/page'
import { FooterPage } from '@/pages/site/footer/page'
import { ParticipatePage } from '@/pages/participate/page'
import { MenuViewsStatsPage } from '@/pages/stats/menu-views/page'
import { VisitorsStatsPage } from '@/pages/stats/visitors/page'
import { MemberLoginLogPage } from '@/pages/logs/member-login/page'
import { AdminAccountLogPage } from '@/pages/logs/admin-account/page'
import { FileDownloadLogPage } from '@/pages/logs/file-download/page'
import { PiiAccessLogPage } from '@/pages/logs/pii-access/page'
import { BugIssueLogPage } from '@/pages/logs/bugs/page'
import { PlaceholderPage } from '@/pages/placeholder/page'
import { getLeafMenuPaths } from '@/shared/config/menu-config'

const IMPLEMENTED_LEAF_PATHS = new Set([
  '/main/strip-banners',
  '/main/hero-banners',
  '/main/social-links',
  '/main/contents',
  '/main/popups',
  '/ja-korea/intro',
  '/ja-korea/global-value',
  '/ja-korea/worldwide',
  '/ja-korea/history-awards-certs',
  '/ja-korea/bi',
  '/ja-korea/principles',
  '/ja-korea/income-expense',
  '/ja-korea/reports-disclosure',
  '/ja-korea/notices',
  '/ja-korea/directions',
  '/ja-korea/people',
  '/impact/stories',
  '/education/fields',
  '/education/textbooks',
  '/sponsor/individual',
  '/sponsor/corporate/guide',
  '/sponsor/corporate/partners',
  '/sponsor/corporate/consultations',
  '/site/info',
  '/site/gnb',
  '/site/footer',
  '/participate',
  '/stats/visitors',
  '/stats/menu-views',
  '/logs/member-login',
  '/logs/admin-account',
  '/logs/file-download',
  '/logs/pii-access',
  '/logs/bugs',
])

/** LNB 리프 경로 → 빈 화면(플레이스홀더). 구현된 화면은 제외 */
const leafRoutes = getLeafMenuPaths()
  .filter(path => !IMPLEMENTED_LEAF_PATHS.has(path))
  .map(path => path.replace(/^\//, ''))
  .map(path => ({
    path,
    element: <PlaceholderPage />,
  }))

export const router = createBrowserRouter([
  {
    path: '/design-system',
    element: <DesignSystemPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'main/strip-banners', element: <StripBannersPage /> },
      { path: 'main/hero-banners', element: <HeroBannersPage /> },
      { path: 'main/social-links', element: <SocialLinksPage /> },
      { path: 'main/contents', element: <ContentsPage /> },
      { path: 'main/popups', element: <PopupsPage /> },
      { path: 'ja-korea/intro', element: <IntroPage /> },
      { path: 'ja-korea/global-value', element: <GlobalValuePage /> },
      { path: 'ja-korea/worldwide', element: <WorldwidePage /> },
      { path: 'ja-korea/history-awards-certs', element: <HistoryAwardsCertsPage /> },
      { path: 'ja-korea/bi', element: <BiPage /> },
      { path: 'ja-korea/principles', element: <PrinciplesPage /> },
      { path: 'ja-korea/income-expense', element: <IncomeExpensePage /> },
      { path: 'ja-korea/reports-disclosure', element: <ReportsDisclosurePage /> },
      { path: 'ja-korea/notices', element: <NoticesPage /> },
      { path: 'ja-korea/notices/:id', element: <NoticeDetailPage /> },
      { path: 'ja-korea/directions', element: <DirectionsPage /> },
      { path: 'ja-korea/people', element: <PeoplePage /> },
      {
        path: 'ja-korea/organization',
        element: <Navigate to="/ja-korea/people" replace />,
      },
      {
        path: 'ja-korea/board',
        element: <Navigate to="/ja-korea/people?tab=board" replace />,
      },
      { path: 'impact/stories', element: <ImpactStoriesPage /> },
      { path: 'impact/stories/:id', element: <ImpactStoryDetailPage /> },
      { path: 'education/fields', element: <EducationFieldsPage /> },
      { path: 'education/textbooks', element: <EducationTextbooksPage /> },
      { path: 'sponsor/individual', element: <IndividualDonationPage /> },
      { path: 'sponsor/corporate/guide', element: <CorporateGuidePage /> },
      { path: 'sponsor/corporate/partners', element: <CorporatePartnersPage /> },
      {
        path: 'sponsor/corporate/consultations',
        element: <CorporateConsultationsPage />,
      },
      { path: 'site/info', element: <SiteInfoPage /> },
      { path: 'site/gnb', element: <GnbMenuPage /> },
      { path: 'site/footer', element: <FooterPage /> },
      {
        path: 'sponsor/individual/banner',
        element: <Navigate to="/sponsor/individual" replace />,
      },
      {
        path: 'sponsor/individual/usage-guide',
        element: <Navigate to="/sponsor/individual" replace />,
      },
      {
        path: 'sponsor/individual/links',
        element: <Navigate to="/sponsor/individual" replace />,
      },
      { path: 'participate', element: <ParticipatePage /> },
      { path: 'stats/visitors', element: <VisitorsStatsPage /> },
      { path: 'stats/menu-views', element: <MenuViewsStatsPage /> },
      { path: 'logs/member-login', element: <MemberLoginLogPage /> },
      { path: 'logs/admin-account', element: <AdminAccountLogPage /> },
      { path: 'logs/file-download', element: <FileDownloadLogPage /> },
      { path: 'logs/pii-access', element: <PiiAccessLogPage /> },
      { path: 'logs/bugs', element: <BugIssueLogPage /> },
      ...leafRoutes,
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
