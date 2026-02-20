/**
 * 교재 현황 / 결재 현황 배지 컴포넌트
 * 프로그램 진행현황(교재 현황), 신청자 목록(결재 현황) 등에서 재사용
 * 배경색·텍스트색만 다르고 동일 UI (border-radius 6px, 14px 600)
 */

import { Tag } from 'antd'
import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import { TEXTBOOK_STATUS_LABELS } from '@/data/mock/participating-schools'
import './app-status-badge.css'
import './textbook-status-badge.css'

export type { TextbookStatusKey }

/** 결재 현황 (신청자 목록 탭) — 동일 배지 컴포넌트, 색상만 다름 */
export type ApprovalStatusKey = 'pending' | 'rejected' | 'approved'

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatusKey, string> = {
  pending: '승인 대기',
  rejected: '신청 반려',
  approved: '승인 완료',
}

type StatusBadgeVariant = 'textbook' | 'approval'
type StatusKey = TextbookStatusKey | ApprovalStatusKey

interface TextbookStatusBadgeProps {
  /** 교재 현황(기본) / 결재 현황 */
  variant?: StatusBadgeVariant
  status: StatusKey
  className?: string
}

function getLabel(variant: StatusBadgeVariant, status: StatusKey): string {
  if (variant === 'approval') return APPROVAL_STATUS_LABELS[status as ApprovalStatusKey]
  return TEXTBOOK_STATUS_LABELS[status as TextbookStatusKey]
}

export function TextbookStatusBadge({
  variant = 'textbook',
  status,
  className,
}: TextbookStatusBadgeProps) {
  const label = getLabel(variant, status)
  return (
    <Tag
      className={`app-status-badge textbook-status-badge--${status} ${className ?? ''}`.trim()}
      style={{ margin: 0 }}
    >
      {label}
    </Tag>
  )
}
