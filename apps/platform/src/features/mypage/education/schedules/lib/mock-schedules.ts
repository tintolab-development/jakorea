import type { EducationScheduleItem } from '../model/types'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'

const PERIOD =
  '2026년 04월 03일(금) 15:00 ~ 2026년 04월 10일(금) 18:00'

const MOCK_FILES = [
  {
    id: 'f1',
    fileName: '260424_김범수_FedEx/JA_과제.pdf',
    kind: 'file' as const,
  },
  {
    id: 'f2',
    fileName: '260424_김범수_FedEx/JA_과제_링크',
    kind: 'url' as const,
  },
]

/**
 * 스크린샷 상태 커버용 시드.
 * heldAt 기준: today(2026-09-01) 이전이면 진행 완료, 이후면 진행 예정.
 */
const MOCK_SCHEDULES: EducationScheduleItem[] = [
  {
    id: 'edu-sched-001',
    sessionNumber: 1,
    heldAt: '2026-04-03T10:00:00',
    title: '오리엔테이션',
    attendanceStatus: 'present',
  },
  {
    id: 'edu-sched-002',
    sessionNumber: 2,
    heldAt: '2026-04-04T10:00:00',
    title: '1차 교육',
    attendanceStatus: 'excused',
    absenceReason: '예비군으로 인한 불참',
    assignment: {
      submitStartAt: '2026-04-03T15:00:00',
      submitEndAt: '2099-04-10T18:00:00',
      periodLabel: PERIOD,
      status: 'not_submitted',
    },
  },
  {
    id: 'edu-sched-003',
    sessionNumber: 3,
    heldAt: '2026-04-05T10:00:00',
    title: '2차 교육',
    attendanceStatus: 'present',
    assignment: {
      submitStartAt: '2026-04-03T15:00:00',
      submitEndAt: '2099-04-10T18:00:00',
      periodLabel: PERIOD,
      status: 'submitted',
      files: MOCK_FILES,
    },
  },
  {
    id: 'edu-sched-004',
    sessionNumber: 4,
    heldAt: '2026-04-06T10:00:00',
    title: '3차 교육',
    attendanceStatus: 'late',
    assignment: {
      submitStartAt: '2026-04-03T15:00:00',
      submitEndAt: '2026-04-10T18:00:00',
      periodLabel: PERIOD,
      status: 'submitted',
      files: MOCK_FILES,
    },
  },
  {
    id: 'edu-sched-005',
    sessionNumber: 5,
    heldAt: '2026-04-07T10:00:00',
    title: '4차 교육',
    attendanceStatus: 'late',
    assignment: {
      submitStartAt: '2026-04-03T15:00:00',
      submitEndAt: '2026-04-10T18:00:00',
      periodLabel: PERIOD,
      status: 'not_submitted',
    },
  },
  {
    id: 'edu-sched-006',
    sessionNumber: 6,
    heldAt: '2026-04-08T10:00:00',
    title: '5차 교육',
    attendanceStatus: 'absent',
    assignment: {
      submitStartAt: '2026-04-03T15:00:00',
      submitEndAt: '2099-04-10T18:00:00',
      periodLabel: PERIOD,
      status: 'feedback',
      files: MOCK_FILES,
      feedback: '세부 내용을 더 보완해 주세요.',
    },
  },
  {
    id: 'edu-sched-007',
    sessionNumber: 7,
    heldAt: '2026-04-09T10:00:00',
    title: '6차 교육',
    attendanceStatus: 'present',
    assignment: {
      submitStartAt: '2026-04-03T15:00:00',
      submitEndAt: '2026-04-10T18:00:00',
      periodLabel: PERIOD,
      status: 'revision_submitted',
      files: MOCK_FILES,
    },
  },
  {
    id: 'edu-sched-008',
    sessionNumber: 8,
    heldAt: '2026-10-17T10:00:00',
    title: '7차 교육',
    attendanceStatus: null,
    assignment: {
      submitStartAt: '2026-10-17T15:00:00',
      submitEndAt: '2026-10-24T18:00:00',
      periodLabel: '2026년 10월 17일(금) 15:00 ~ 2026년 10월 24일(금) 18:00',
      status: 'not_submitted',
    },
  },
  ...Array.from({ length: 34 }, (_, index) => {
    const sessionNumber = 9 + index
    const day = 18 + (index % 10)
    const month = index < 12 ? 10 : 11
    return {
      id: `edu-sched-${String(sessionNumber).padStart(3, '0')}`,
      sessionNumber,
      heldAt: `2026-${String(month).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}T10:00:00`,
      title: `${sessionNumber - 1}차 교육`,
      attendanceStatus: null,
    } satisfies EducationScheduleItem
  }),
]

export function getMockEducationSchedules(_programId: string): EducationScheduleItem[] {
  if (!shouldUsePlatformMockData()) return []
  return MOCK_SCHEDULES.map(item => ({
    ...item,
    assignment: item.assignment
      ? { ...item.assignment, files: item.assignment.files?.map(file => ({ ...file })) }
      : undefined,
  }))
}
