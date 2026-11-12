/**
 * 대시보드 메뉴 바로가기 아이콘 — 시안 `Icon / 바로가기 / w24` 원본(`shared/assets/icons/shortcut`).
 * 시안 대시보드 화면 기준: 프로그램 유형(일반·1사1교·Gemini·UJAT·전체)은 모두 같은 프로그램 아이콘.
 * mask로 그려 색은 currentColor(브랜드 민트)를 따른다.
 */

import accountCheckUrl from '@/shared/assets/icons/shortcut/account-check.svg'
import authAdminUrl from '@/shared/assets/icons/shortcut/auth-admin.svg'
import authApprovalUrl from '@/shared/assets/icons/shortcut/auth-approval.svg'
import authProgramUrl from '@/shared/assets/icons/shortcut/auth-program.svg'
import faqUrl from '@/shared/assets/icons/shortcut/faq.svg'
import inquiryUrl from '@/shared/assets/icons/shortcut/inquiry.svg'
import logBugUrl from '@/shared/assets/icons/shortcut/log-bug.svg'
import logDownloadUrl from '@/shared/assets/icons/shortcut/log-download.svg'
import logLoginUrl from '@/shared/assets/icons/shortcut/log-login.svg'
import logPrivacyUrl from '@/shared/assets/icons/shortcut/log-privacy.svg'
import memberAdminUrl from '@/shared/assets/icons/shortcut/member-admin.svg'
import memberAllUrl from '@/shared/assets/icons/shortcut/member-all.svg'
import memberInstructorUrl from '@/shared/assets/icons/shortcut/member-instructor.svg'
import memberTeacherUrl from '@/shared/assets/icons/shortcut/member-teacher.svg'
import noticeUrl from '@/shared/assets/icons/shortcut/notice.svg'
import notificationUrl from '@/shared/assets/icons/shortcut/notification.svg'
import paymentStatementUrl from '@/shared/assets/icons/shortcut/payment-statement.svg'
import performanceUrl from '@/shared/assets/icons/shortcut/performance.svg'
import programDetailUrl from '@/shared/assets/icons/shortcut/program-detail.svg'
import programUrl from '@/shared/assets/icons/shortcut/program.svg'
import settlementItemUrl from '@/shared/assets/icons/shortcut/settlement-item.svg'
import sponsorUrl from '@/shared/assets/icons/shortcut/sponsor.svg'
import templateUrl from '@/shared/assets/icons/shortcut/template.svg'
import textbookUrl from '@/shared/assets/icons/shortcut/textbook.svg'
import { MaskIcon } from '@/shared/ui/icons'

const SHORTCUT_ICON_URL: Record<string, string> = {
  'programs-general-education': programUrl,
  'programs-economy': programUrl,
  'programs-gemini': programUrl,
  'programs-ujat': programUrl,
  'users-all': memberAllUrl,
  'users-school': memberTeacherUrl,
  'users-instructor': memberInstructorUrl,
  'users-admin': memberAdminUrl,
  'permission-requests': authApprovalUrl,
  'admin-permission-settings': authAdminUrl,
  'program-permission-settings': authProgramUrl,
  'settlement-payment-orders': paymentStatementUrl,
  'settlement-account-payments': accountCheckUrl,
  'settlement-item-settings': settlementItemUrl,
  notices: noticeUrl,
  faq: faqUrl,
  inquiries: inquiryUrl,
  'template-management': templateUrl,
  sponsors: sponsorUrl,
  textbooks: textbookUrl,
  'programs-detail': programDetailUrl,
  'notification-messages': notificationUrl,
  performance: performanceUrl,
  'member-login-history': logLoginUrl,
  'file-download-history': logDownloadUrl,
  'privacy-query-history': logPrivacyUrl,
  'bug-issue-history': logBugUrl,
}

/** 바로가기 id별 시안 아이콘. 모르는 id는 프로그램 아이콘(시안 기본). */
export function ShortcutIcon({ shortcutId }: { shortcutId: string }) {
  return <MaskIcon src={SHORTCUT_ICON_URL[shortcutId] ?? programUrl} />
}
