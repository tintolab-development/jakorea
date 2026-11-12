/**
 * 1사1교 「결연 금융 회사」 표시값 — 기관 신청 상세와 같은 규칙
 * (`resolveAffiliatedFinancialCompanyDisplay`, partner면 프로그램 후원사명).
 */
import { resolveAffiliatedFinancialCompanyDisplay } from '@/features/program/1c-1s/lib/affiliated-financial-company-display'
import { SponsorNameById } from '@/features/sponsor/ui/sponsor-name-by-id'

export function AffiliatedFinancialCompanyValue({
  value,
  sponsorId,
}: {
  value: string | null | undefined
  sponsorId?: string | null
}) {
  const display = resolveAffiliatedFinancialCompanyDisplay(value)
  if (display.kind === 'text') return <>{display.text}</>
  if (display.kind === 'partner' && sponsorId) return <SponsorNameById sponsorId={sponsorId} />
  return <>-</>
}
