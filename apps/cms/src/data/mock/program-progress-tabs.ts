/**
 * 전체 프로그램 진행 현황 탭별 Mock 데이터
 * 탭: 모집 예정 / 수강 대기 신청 / 강의 대기 신청 / 교재 준비중 / 정산 대기
 */

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
  /** 프로그램 진행 현황(표시용 라벨) */
  programProgressStatus: string
  /** 참여자 모집 인원 — 예: "12 / 40" */
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

/** 테이블「프로그램 진행 현황」셀렉트 필터 옵션 (6단계 라벨과 동일) */
export const PROGRAM_PROGRESS_TABLE_STATUS_FILTER_OPTIONS = PROGRAM_PROGRESS_STAGE_ORDER.map(
  key => ({
    label: PROGRAM_PROGRESS_STAGE_LABELS[key],
    value: PROGRAM_PROGRESS_STAGE_LABELS[key],
  })
)

const STAGE_LABELS_CYCLE = PROGRAM_PROGRESS_STAGE_ORDER.map(
  k => PROGRAM_PROGRESS_STAGE_LABELS[k]
)

const baseRows: Omit<ProgramProgressTabRow, 'id' | 'no'>[] = [
  {
    programName: '2026년 JA Korea 초등 경제교육 대상학교 모집',
    programProgressStatus: STAGE_LABELS_CYCLE[0],
    participantRecruitment: '0 / 120',
    participantType: '학교',
    educationTarget: '초등학생',
  },
  {
    programName: '1사1교 경제금융교육 디자인 세미나 1차시',
    programProgressStatus: STAGE_LABELS_CYCLE[1],
    participantRecruitment: '45 / 80',
    participantType: '학교',
    educationTarget: '초등학생',
  },
  {
    programName: 'Dream and Plan the Future',
    programProgressStatus: STAGE_LABELS_CYCLE[2],
    participantRecruitment: '32 / 50',
    participantType: '학교',
    educationTarget: '초등학생',
  },
  {
    programName: '신용케어 아카데미',
    programProgressStatus: STAGE_LABELS_CYCLE[3],
    participantRecruitment: '18 / 40',
    participantType: '개인',
    educationTarget: '초등학생',
  },
  {
    programName: '개인 재무 기초 교육',
    programProgressStatus: STAGE_LABELS_CYCLE[4],
    participantRecruitment: '12 / 30',
    participantType: '학교',
    educationTarget: '고등학생',
  },
  {
    programName: 'Invest in Your Future',
    programProgressStatus: STAGE_LABELS_CYCLE[5],
    participantRecruitment: '24 / 24',
    participantType: '개인',
    educationTarget: '중등학생',
  },
  {
    programName: '경제금융 리터러시 과정',
    programProgressStatus: STAGE_LABELS_CYCLE[0],
    participantRecruitment: '55 / 60',
    participantType: '학교',
    educationTarget: '중등학생',
  },
  {
    programName: '기업가정신 워크샵',
    programProgressStatus: STAGE_LABELS_CYCLE[2],
    participantRecruitment: '8 / 25',
    participantType: '개인',
    educationTarget: '고등학생',
  },
  {
    programName: '진로취업 멘토링 프로그램',
    programProgressStatus: STAGE_LABELS_CYCLE[1],
    participantRecruitment: '0 / 100',
    participantType: '학교',
    educationTarget: '고등학생',
  },
]

function buildTabData(tabKey: ProgramProgressTabKey, count: number): ProgramProgressTabRow[] {
  const rows: ProgramProgressTabRow[] = []
  for (let i = 0; i < count; i++) {
    const base = baseRows[i % baseRows.length]
    rows.push({
      id: `${tabKey}-${i + 1}`,
      no: i + 1,
      ...base,
    })
  }
  return rows
}

export const mockProgramProgressByTab: Record<ProgramProgressTabKey, ProgramProgressTabRow[]> = {
  planned: buildTabData('planned', 9),
  course_waiting: buildTabData('course_waiting', 15),
  lecture_waiting: buildTabData('lecture_waiting', 2),
  material_preparing: buildTabData('material_preparing', 12),
  settlement_waiting: buildTabData('settlement_waiting', 2),
}

export const PROGRAM_PROGRESS_TAB_ORDER: ProgramProgressTabKey[] = [
  'planned',
  'course_waiting',
  'lecture_waiting',
  'material_preparing',
  'settlement_waiting',
]
