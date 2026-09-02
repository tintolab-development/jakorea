import type { EducationSettlementItem } from '../model/types'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'

const MOCK_SETTLEMENTS: EducationSettlementItem[] = [
  {
    id: 'edu-settle-001',
    sessionNumber: 1,
    heldAt: '2026-04-03T10:00:00',
    sessionMeta: '10:00~11:20 1차시',
    progress: 'completed',
    status: 'report_pending',
    deadlineLabel: '2026년 04월 08일까지',
    amount: 300000,
  },
  {
    id: 'edu-settle-002',
    sessionNumber: 2,
    heldAt: '2026-04-04T10:00:00',
    sessionMeta: '10:00~11:20 2차시',
    progress: 'completed',
    status: 'pending_submit',
    deadlineLabel: '2026년 04월 09일까지',
    amount: 300000,
  },
  {
    id: 'edu-settle-003',
    sessionNumber: 3,
    heldAt: '2026-04-05T10:00:00',
    sessionMeta: '10:00~11:20 3차시',
    progress: 'completed',
    status: 'overdue',
    deadlineLabel: '2026년 04월 10일까지',
    amount: 300000,
  },
  {
    id: 'edu-settle-004',
    sessionNumber: 4,
    heldAt: '2026-04-06T10:00:00',
    sessionMeta: '10:00~11:20 4차시',
    progress: 'completed',
    status: 'waiting_confirm',
    amount: 300000,
  },
  {
    id: 'edu-settle-005',
    sessionNumber: 5,
    heldAt: '2026-04-07T10:00:00',
    sessionMeta: '10:00~11:20 5차시',
    progress: 'completed',
    status: 'reapplied',
    amount: 300000,
  },
  {
    id: 'edu-settle-006',
    sessionNumber: 6,
    heldAt: '2026-04-08T10:00:00',
    sessionMeta: '10:00~11:20 6차시',
    progress: 'completed',
    status: 'confirmed',
    amount: 300000,
  },
  {
    id: 'edu-settle-007',
    sessionNumber: 7,
    heldAt: '2026-04-09T10:00:00',
    sessionMeta: '10:00~11:20 7차시',
    progress: 'completed',
    status: 'paid',
    amount: 300000,
  },
  {
    id: 'edu-settle-008',
    sessionNumber: 8,
    heldAt: '2026-04-10T10:00:00',
    sessionMeta: '10:00~11:20 8차시',
    progress: 'completed',
    status: 'rejected',
    amount: 300000,
    rejectReason: '제출 서류의 금액과 강의 시수가 일치하지 않습니다. 수정 후 재신청해 주세요.',
  },
  {
    id: 'edu-settle-009',
    sessionNumber: 9,
    heldAt: '2026-09-15T10:00:00',
    sessionMeta: '10:00~11:20 9차시',
    progress: 'upcoming',
    status: 'upcoming',
  },
]

export function getMockEducationSettlements(_programId: string): EducationSettlementItem[] {
  if (!shouldUsePlatformMockData()) return []
  return MOCK_SETTLEMENTS
}
