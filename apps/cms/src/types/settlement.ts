/**
 * 정산 관련 확장 타입
 * V3 Phase 4: 정산 승인 워크플로우
 */

import type { UUID, DateValue } from './index'

// 승인 단계 타입
export type ApprovalStep = 'pending' | 'review' | 'approval' | 'payment'

// 승인 단계 라벨
export const approvalStepLabels: Record<ApprovalStep, string> = {
  pending: '대기',
  review: '검토',
  approval: '승인',
  payment: '지급',
}

// 승인 이력
export interface ApprovalHistory {
  id: UUID
  settlementId: UUID
  step: ApprovalStep
  action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'paid' | 'cancelled'
  actionLabel: string // '제출', '검토 완료', '승인', '반려', '지급 완료', '취소'
  reviewerId?: UUID // 담당자 ID
  reviewerName?: string // 담당자 이름
  comment?: string // 의견/사유
  createdAt: DateValue
}

// 담당자 정보
export interface Reviewer {
  id: UUID
  name: string
  role: string // '담당자', '팀장', '관리자' 등
}

