import { recordMetric } from './session'

export const ANALYTICS_CLICK_METRICS = {
  annualReportDownload: 'JA_TRANSPARENCY_ANNUAL_REPORT_DOWNLOAD',
  auditReportDownload: 'JA_TRANSPARENCY_AUDIT_REPORT_DOWNLOAD',
  disclosureOutbound: 'JA_TRANSPARENCY_DISCLOSURE_OUTBOUND_CLICK',
  onlineLearning: 'PARTICIPATION_ONLINE_CLICK',
  alumni: 'PARTICIPATION_ALUMNI_CLICK',
  donationOutbound: 'DONATION_OUTBOUND_CLICK',
} as const

const MENU_CLICK_METRICS: Record<string, string> = {
  PARTICIPATION_ONLINE: ANALYTICS_CLICK_METRICS.onlineLearning,
  PARTICIPATION_ALUMNI: ANALYTICS_CLICK_METRICS.alumni,
}

/** GNB 외부 메뉴 클릭. 페이지 진입 metric이 없는 항목만. */
export function recordMenuClick(menuCode: string): void {
  const metricCode = MENU_CLICK_METRICS[menuCode]
  if (!metricCode) return
  recordMetric(metricCode)
}
