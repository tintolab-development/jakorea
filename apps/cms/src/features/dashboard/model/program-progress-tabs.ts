import {
  PROGRAM_PROGRESS_STAGE_LABELS,
  PROGRAM_PROGRESS_STAGE_ORDER,
} from '@/shared/config/program-progress-stages'

export type ProgramProgressTabKey =
  | 'planned'
  | 'course_waiting'
  | 'lecture_waiting'
  | 'material_preparing'
  | 'settlement_waiting'

export interface ProgramProgressTabRow {
  id: string
  no: number
  programName: string
  programProgressStatus: string
  participantRecruitment: string
  participantType: string
  educationTarget: string
}

export const PROGRAM_PROGRESS_TAB_LABELS: Record<ProgramProgressTabKey, string> = {
  planned: '모집 예정',
  course_waiting: '수강 대기 신청',
  lecture_waiting: '강의 대기 신청',
  material_preparing: '교재 준비중',
  settlement_waiting: '정산 대기',
}

export const PROGRAM_PROGRESS_TABLE_STATUS_FILTER_OPTIONS = PROGRAM_PROGRESS_STAGE_ORDER.map(
  key => ({
    label: PROGRAM_PROGRESS_STAGE_LABELS[key],
    value: PROGRAM_PROGRESS_STAGE_LABELS[key],
  })
)

export const PROGRAM_PROGRESS_TAB_ORDER: ProgramProgressTabKey[] = [
  'planned',
  'course_waiting',
  'lecture_waiting',
  'material_preparing',
  'settlement_waiting',
]

export const mockProgramProgressByTab: Record<ProgramProgressTabKey, ProgramProgressTabRow[]> = {
  planned: [],
  course_waiting: [],
  lecture_waiting: [],
  material_preparing: [],
  settlement_waiting: [],
}
