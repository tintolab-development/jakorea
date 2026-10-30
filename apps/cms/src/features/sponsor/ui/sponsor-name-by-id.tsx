import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'

export function SponsorNameById({ sponsorId }: { sponsorId?: string | null }) {
  // 후원사 목록이 도착하면 다시 계산되도록 query data를 deps로 쓰는 공용 훅을 사용한다.
  const name = useSponsorNameById(sponsorId)
  if (!sponsorId?.trim()) return <>-</>
  return <>{name ?? sponsorId}</>
}
