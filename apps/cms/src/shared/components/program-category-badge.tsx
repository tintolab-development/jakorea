/**
 * 프로그램 참여자 유형 배지
 * 프로그램 목록·상세·만족도 등에서 재사용
 */

import { Tag } from 'antd'
import type { ProgramCategory } from '@/types/domain'
import { getProgramParticipantTypeLabel } from '@/features/program/general/ui/constants/program-list-constants'

interface ProgramCategoryBadgeProps {
  category: ProgramCategory | string
  className?: string
}

const BADGE_COLORS: Record<ProgramCategory, string> = {
  school: 'blue',
  individual: 'purple',
  instructor: 'cyan',
  volunteer: 'green',
}

export function ProgramCategoryBadge({ category, className }: ProgramCategoryBadgeProps) {
  const key = (['school', 'individual', 'instructor', 'volunteer'].includes(category)
    ? category
    : 'individual') as ProgramCategory
  const label = getProgramParticipantTypeLabel(key)
  const color = BADGE_COLORS[key]
  return (
    <Tag color={color} className={className} style={{ margin: 0 }}>
      {label}
    </Tag>
  )
}
