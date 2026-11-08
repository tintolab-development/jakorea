/**
 * 상세 기본 정보 — 참여자·강사·봉사 모집 현황 Text (일반·UJAT 공통).
 * 색은 모집 신청 현황 톤 정본(`getProgramRecruitmentApplicationTextColor`), 라벨은 호출처 문구.
 * 블록·말줄임 레이아웃은 `.program-detail-info-tab__lifecycle-status-text`.
 */

import type { ReactNode } from 'react'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { StatusBadge } from '@/shared/components/status-badge'
import { getProgramRecruitmentApplicationTextColor } from '@/shared/constants/status'

export function RecruitmentLifecycleStatusText({
  status,
  label,
}: {
  status: ProgramLifecycleStatus
  label: ReactNode
}) {
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      className="program-detail-info-tab__lifecycle-status-text"
      label={label}
      accentColor={getProgramRecruitmentApplicationTextColor(status)}
    />
  )
}
