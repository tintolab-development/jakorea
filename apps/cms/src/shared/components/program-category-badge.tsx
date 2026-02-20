/**
 * 프로그램 카테고리 배지 (학교 프로그램 / 개인 프로그램)
 * 프로그램 목록·상세·만족도 등에서 재사용
 */

import { Tag } from 'antd'

export type ProgramCategory = 'school' | 'individual'

interface ProgramCategoryBadgeProps {
  category: ProgramCategory | string
  className?: string
}

const CONFIG: Record<ProgramCategory, { label: string; color: string }> = {
  school: { label: '학교 프로그램', color: 'blue' },
  individual: { label: '개인 프로그램', color: 'purple' },
}

export function ProgramCategoryBadge({ category, className }: ProgramCategoryBadgeProps) {
  const key = (category === 'school' ? 'school' : 'individual') as ProgramCategory
  const { label, color } = CONFIG[key]
  return (
    <Tag color={color} className={className} style={{ margin: 0 }}>
      {label}
    </Tag>
  )
}
