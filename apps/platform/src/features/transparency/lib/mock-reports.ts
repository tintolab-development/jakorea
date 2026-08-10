import type { TransparencyReport } from '../model/types'

/**
 * 연차보고서 커버 팔레트 — 시안 커버 무드(그린·틸·오렌지)를 연도별로 순환.
 * 실 커버 이미지가 준비되면 coverUrl 로 교체한다.
 */
const ANNUAL_COVER_GRADIENTS = [
  'linear-gradient(160deg, #1f8a70 0%, #4cd9a4 100%)',
  'linear-gradient(160deg, #14424e 0%, #2b8a9e 100%)',
  'linear-gradient(160deg, #eef7f2 0%, #bfe8d6 100%)',
  'linear-gradient(160deg, #f4f9ee 0%, #cfe8a8 100%)',
  'linear-gradient(160deg, #1c5c3f 0%, #3fae70 100%)',
  'linear-gradient(160deg, #10493f 0%, #0f7a5c 100%)',
  'linear-gradient(160deg, #f6efe2 0%, #f2b56b 100%)',
  'linear-gradient(160deg, #d9efc9 0%, #6fbf4f 100%)',
] as const

/** 회계감사 커버 팔레트 — 시안 딥틸 → 그린 그라디언트 순환 */
const AUDIT_COVER_GRADIENTS = [
  'linear-gradient(135deg, #14424e 0%, #1f6f7d 100%)',
  'linear-gradient(135deg, #1a5d6b 0%, #2f8a8a 100%)',
  'linear-gradient(135deg, #3f8f6e 0%, #a4c95d 100%)',
] as const

const ANNUAL_TITLE_SUFFIXES: Record<number, string> = {
  2023: '',
  2022: ' Junior Achievemnt Korea',
  2021: ' Junior Achievemnt Korea',
  2019: ' EMPOWERING YOUTH',
}

function buildAnnualReports(): TransparencyReport[] {
  const reports: TransparencyReport[] = []

  for (let index = 0; index < 18; index += 1) {
    const year = 2025 - index
    const suffix = ANNUAL_TITLE_SUFFIXES[year] ?? ' JA Korea'
    reports.push({
      id: `annual-${year}`,
      title: `${year} Annual Report${suffix}`,
      coverLabel: `${year}\nAnnual Report`,
      coverGradient: ANNUAL_COVER_GRADIENTS[index % ANNUAL_COVER_GRADIENTS.length],
      fileName: `${year}_annual_report_ja_korea.pdf`,
    })
  }

  return reports
}

function buildAuditReports(): TransparencyReport[] {
  const reports: TransparencyReport[] = []

  for (let index = 0; index < 18; index += 1) {
    const year = 2025 - index
    reports.push({
      id: `audit-${year}`,
      title: `${year}년 외부 회계감사 보고서`,
      date: `${year + 1}년 05월 08일`,
      coverLabel: `${year}년\n외부 회계감사`,
      coverGradient: AUDIT_COVER_GRADIENTS[index % AUDIT_COVER_GRADIENTS.length],
      fileName: `${year}_external_audit_report_ja_korea.pdf`,
    })
  }

  return reports
}

export const MOCK_ANNUAL_REPORTS: readonly TransparencyReport[] = buildAnnualReports()
export const MOCK_AUDIT_REPORTS: readonly TransparencyReport[] = buildAuditReports()

export function filterReports(
  reports: readonly TransparencyReport[],
  q: string
): TransparencyReport[] {
  const keyword = q.trim().toLowerCase()
  if (!keyword) return [...reports]

  return reports.filter(report =>
    [report.title, report.date ?? '', report.coverLabel]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  )
}
