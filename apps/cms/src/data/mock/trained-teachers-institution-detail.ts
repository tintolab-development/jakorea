/**
 * 교육받은 교사 — 참여 기관 상세 mock (지망 일정·교육일지)
 */

export type TrainedTeachersPreferredScheduleSessionTime = {
  sessionIndex: number
  classPeriod: string
  timeRange: string
}

/** 지망 블록 — 스크린샷 SSOT */
export type TrainedTeachersPreferredScheduleBlock = {
  preferenceRank: number
  date: string
  dayOfWeek: string
  sessionCount: number
  sessionTimes: TrainedTeachersPreferredScheduleSessionTime[]
}

/** 교육일지 (제출된 항목만 mock에 포함) */
export type TrainedTeachersEducationJournalEntry = {
  id: string
  no: number
  date: string
  dayOfWeek: string
  timeRange: string
  roundOrScheduleLabel?: string
  fileName: string
  submittedAt: string
}

export const TRAINED_TEACHERS_APPLICANT_PENDING_ID = 'trained-teachers-applicant-pending'
export const TRAINED_TEACHERS_APPLICANT_APPROVED_ID = 'trained-teachers-applicant-approved'
export const TRAINED_TEACHERS_PARTICIPATING_SCHOOL_ID = 'trained-teachers-participating-jinwol'

/** 스크린샷 시안 — 진월초등학교 1·2지망 일정 */
export const TRAINED_TEACHERS_JINWOL_PREFERRED_SCHEDULE_BLOCKS: TrainedTeachersPreferredScheduleBlock[] =
  [
    {
      preferenceRank: 1,
      date: '2026.04.20',
      dayOfWeek: '월',
      sessionCount: 1,
      sessionTimes: [{ sessionIndex: 1, classPeriod: '1교시', timeRange: '09:00 ~ 09:40' }],
    },
    {
      preferenceRank: 2,
      date: '2026.04.27',
      dayOfWeek: '월',
      sessionCount: 2,
      sessionTimes: [
        { sessionIndex: 1, classPeriod: '1교시', timeRange: '09:00 ~ 09:40' },
        { sessionIndex: 2, classPeriod: '2교시', timeRange: '09:50 ~ 10:30' },
      ],
    },
  ]

const JINWOL_DETAIL_BASE = {
  addressDetail: '1층 교무실 이길동 선생님 앞',
  educationType: '온/오프라인',
  teacherInfo:
    '담당 교사 : 이길동 | Tel : 062-1234-0000 | M : 010-1234-0000 | E-mail : tinto@naver.com',
  applicationReason: '아이들의 경제감각 성장에 큰 도움이 될 것 같아 신청합니다!',
  otherRequests: '혹시 다른 학년도 동일하게 추가 신청이 가능할까요?',
} as const

/** 승인 대기 — 스크린샷 1 */
export const TRAINED_TEACHERS_APPLICANT_PENDING_DETAIL = {
  ...JINWOL_DETAIL_BASE,
  textbookName: undefined,
  textbookId: undefined,
} as const

/** 승인 완료 — 스크린샷 2 */
export const TRAINED_TEACHERS_APPLICANT_APPROVED_DETAIL = {
  ...JINWOL_DETAIL_BASE,
  textbookName: '성공하는 경제생활',
  textbookId: 'TB-110',
} as const

export const TRAINED_TEACHERS_JINWOL_EDUCATION_JOURNALS: TrainedTeachersEducationJournalEntry[] = [
  {
    id: 'tt-journal-001',
    no: 1,
    date: '2026.04.20',
    dayOfWeek: '월',
    timeRange: '09:00 ~ 09:40',
    roundOrScheduleLabel: '1차시',
    fileName: '진월초등학교_20260420_1차시_교육일지.pdf',
    submittedAt: '2026.04.20 11:32:15',
  },
  {
    id: 'tt-journal-002',
    no: 2,
    date: '2026.04.27',
    dayOfWeek: '월',
    timeRange: '09:00 ~ 10:30',
    roundOrScheduleLabel: '2차시',
    fileName: '진월초등학교_20260427_교육일지.hwp',
    submittedAt: '2026.04.27 10:45:00',
  },
]

const journalByInstitutionId = new Map<string, TrainedTeachersEducationJournalEntry[]>([
  [TRAINED_TEACHERS_APPLICANT_APPROVED_ID, TRAINED_TEACHERS_JINWOL_EDUCATION_JOURNALS],
  [TRAINED_TEACHERS_PARTICIPATING_SCHOOL_ID, TRAINED_TEACHERS_JINWOL_EDUCATION_JOURNALS],
])

const scheduleBlocksByInstitutionId = new Map<string, TrainedTeachersPreferredScheduleBlock[]>([
  [TRAINED_TEACHERS_APPLICANT_PENDING_ID, TRAINED_TEACHERS_JINWOL_PREFERRED_SCHEDULE_BLOCKS],
  [TRAINED_TEACHERS_APPLICANT_APPROVED_ID, TRAINED_TEACHERS_JINWOL_PREFERRED_SCHEDULE_BLOCKS],
  [TRAINED_TEACHERS_PARTICIPATING_SCHOOL_ID, TRAINED_TEACHERS_JINWOL_PREFERRED_SCHEDULE_BLOCKS],
])

export function getTrainedTeachersPreferredScheduleBlocks(
  institutionId: string
): TrainedTeachersPreferredScheduleBlock[] {
  return scheduleBlocksByInstitutionId.get(institutionId) ?? []
}

export function getTrainedTeachersEducationJournals(
  institutionId: string
): TrainedTeachersEducationJournalEntry[] {
  return journalByInstitutionId.get(institutionId) ?? []
}

export function formatTrainedTeachersEducationJournalScheduleLabel(
  entry: TrainedTeachersEducationJournalEntry
): string {
  const datePart = `${entry.date.replace(/\./g, '. ')}(${entry.dayOfWeek})`.replace(/\s+/g, ' ')
  const parts = [datePart, entry.timeRange]
  if (entry.roundOrScheduleLabel?.trim()) {
    parts.push(entry.roundOrScheduleLabel.trim())
  }
  return parts.join(' | ')
}
