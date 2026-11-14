import { LnbProgramIcon } from '@/shared/ui/icons'

/** 회원 상세 LNB — 프로그램 참여·강의·담당 이력: 시안 `Icon / LNB / w24` program 원본 (활성 시 부모 color = 민트) */
export function UserProgramsHistoryLnbIcon({ className }: { className?: string }) {
  return (
    <LnbProgramIcon
      className={['detail-fullpage-modal__lnb-icon', className].filter(Boolean).join(' ')}
    />
  )
}
