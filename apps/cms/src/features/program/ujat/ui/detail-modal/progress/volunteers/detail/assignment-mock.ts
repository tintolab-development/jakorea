import { parseEducationProgressVolunteerProfileId } from '@/data/mock/ujat-volunteer-mock-profiles'
import type { UjatVolunteerMockProfileId } from '@/data/mock/ujat-volunteer-mock-profiles'
import type {
  UjatVolunteerAssignmentProgressBundle,
  UjatVolunteerAssignmentProgressRow,
} from './assignment-types'

const PARK_TINTO_ASSIGNMENT_ROWS: UjatVolunteerAssignmentProgressRow[] = [
  {
    id: 'sched-1',
    scheduleLabel: '2025. 04. 03(목)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '틴토초등학교' },
    partner: { kind: 'undecided' },
    classDisplay: { kind: 'dash' },
    attendance: { kind: 'dash' },
    educationPlanSubmitted: false,
    educationLogSubmitted: false,
    educationProgress: 'scheduled',
    isWithdrawn: false,
  },
  {
    id: 'sched-2',
    scheduleLabel: '2025. 04. 10(목)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '틴토초등학교' },
    partner: { kind: 'dash' },
    classDisplay: { kind: 'dash' },
    attendance: { kind: 'dash' },
    educationPlanSubmitted: false,
    educationLogSubmitted: false,
    educationProgress: 'scheduled',
    isWithdrawn: false,
  },
  {
    id: 'sched-3',
    scheduleLabel: '2025. 04. 17(목)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '틴토초등학교' },
    partner: { kind: 'name', value: '김태군' },
    classDisplay: { kind: 'class', label: '1-1' },
    attendance: { kind: 'late', time: '8:35' },
    educationPlanSubmitted: true,
    educationLogSubmitted: true,
    educationProgress: 'completed',
    isWithdrawn: false,
  },
  {
    id: 'sched-4',
    scheduleLabel: '2025. 05. 01(목)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '틴토초등학교' },
    partner: { kind: 'dash' },
    classDisplay: { kind: 'dash' },
    attendance: { kind: 'excused_absence' },
    educationPlanSubmitted: false,
    educationLogSubmitted: false,
    educationProgress: 'completed',
    isWithdrawn: false,
  },
  {
    id: 'sched-5',
    scheduleLabel: '2025. 05. 08(목)',
    role: 'attendance_manager',
    assignedInstitution: { kind: 'name', value: '틴토초등학교' },
    partner: { kind: 'name', value: '김도영' },
    classDisplay: { kind: 'class', label: '2-3' },
    attendance: { kind: 'present' },
    educationPlanSubmitted: true,
    educationLogSubmitted: true,
    educationProgress: 'completed',
    isWithdrawn: false,
  },
  {
    id: 'sched-6',
    scheduleLabel: '2025. 05. 15(목)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '틴토초등학교' },
    partner: { kind: 'dash' },
    classDisplay: { kind: 'dash' },
    attendance: { kind: 'dash' },
    educationPlanSubmitted: false,
    educationLogSubmitted: false,
    educationProgress: 'scheduled',
    isWithdrawn: false,
  },
  {
    id: 'sched-7',
    scheduleLabel: '2025. 06. 12(목)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '틴토초등학교' },
    partner: { kind: 'name', value: '나성범' },
    classDisplay: { kind: 'class', label: '5-1' },
    attendance: { kind: 'present' },
    educationPlanSubmitted: true,
    educationLogSubmitted: true,
    educationProgress: 'completed',
    isWithdrawn: true,
  },
  {
    id: 'sched-8',
    scheduleLabel: '2025. 06. 19(목)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '틴토초등학교' },
    partner: { kind: 'dash' },
    classDisplay: { kind: 'withdrawn' },
    attendance: { kind: 'present' },
    educationPlanSubmitted: true,
    educationLogSubmitted: true,
    educationProgress: 'completed',
    isWithdrawn: true,
  },
]

const DEFAULT_ASSIGNMENT_ROWS: UjatVolunteerAssignmentProgressRow[] = [
  {
    id: 'sched-a',
    scheduleLabel: '2025. 04. 03(목)',
    role: 'attendance_manager',
    assignedInstitution: { kind: 'name', value: '샘플초등학교' },
    partner: { kind: 'undecided' },
    classDisplay: { kind: 'dash' },
    attendance: { kind: 'dash' },
    educationPlanSubmitted: false,
    educationLogSubmitted: false,
    educationProgress: 'scheduled',
    isWithdrawn: false,
  },
  {
    id: 'sched-b',
    scheduleLabel: '2025. 04. 17(목)',
    role: 'none',
    assignedInstitution: { kind: 'name', value: '샘플초등학교' },
    partner: { kind: 'name', value: '이파트너' },
    classDisplay: { kind: 'class', label: '3-2' },
    attendance: { kind: 'excused_absence' },
    educationPlanSubmitted: false,
    educationLogSubmitted: false,
    educationProgress: 'completed',
    isWithdrawn: false,
  },
]

const PARK_TINTO_ABSENCE_REASONS: UjatVolunteerAssignmentProgressBundle['absenceReasons'] = [
  {
    id: 'abs-1',
    dateLabel: '5월 8일',
    reason: '예비군으로 인한 불참',
    fileName: '박틴토_0508_예비군 불참.pdf',
  },
  {
    id: 'abs-2',
    dateLabel: '5월 29일',
    reason: '중간고사로 인한 불참',
    fileName: '박틴토_0529_중간고사 불참.pdf',
  },
]

export function sortVolunteerAssignmentRows(
  rows: UjatVolunteerAssignmentProgressRow[]
): UjatVolunteerAssignmentProgressRow[] {
  const active = rows.filter(row => row.classDisplay.kind !== 'withdrawn')
  const classWithdrawn = rows.filter(row => row.classDisplay.kind === 'withdrawn')
  return [...active, ...classWithdrawn]
}

export function getUjatVolunteerAssignmentProgressBundle(
  volunteerRowId: string
): UjatVolunteerAssignmentProgressBundle {
  const profileId = parseEducationProgressVolunteerProfileId(volunteerRowId)

  if (profileId === 'park-tinto') {
    return {
      rows: sortVolunteerAssignmentRows(PARK_TINTO_ASSIGNMENT_ROWS.map(row => ({ ...row }))),
      attendanceSummary: {
        completionStatus: '교육 진행 전',
        lateCountLabel: '1회',
      },
      absenceReasons: PARK_TINTO_ABSENCE_REASONS.map(item => ({ ...item })),
    }
  }

  const baseRows = DEFAULT_ASSIGNMENT_ROWS.map(row => ({ ...row }))

  return {
    rows: sortVolunteerAssignmentRows(baseRows),
    attendanceSummary: {
      completionStatus: '교육 진행 중',
      lateCountLabel: '0회',
    },
    absenceReasons: [],
  }
}

export function resolveProfileIdFromVolunteerRowId(
  volunteerRowId: string
): UjatVolunteerMockProfileId | null {
  return parseEducationProgressVolunteerProfileId(volunteerRowId)
}
