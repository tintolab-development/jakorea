/**
 * 전체 프로그램 진행 현황 탭별 Mock 데이터
 * 탭: 모집 예정 / 수강 대기 신청 / 강의 대기 신청 / 교재 준비중 / 정산 대기
 */

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
  sponsor: string
  participantType: string
  educationTarget: string
  applicationPeriod: string
  operatingPeriod: string
}

export const PROGRAM_PROGRESS_TAB_LABELS: Record<ProgramProgressTabKey, string> = {
  planned: '모집 예정',
  course_waiting: '수강 대기 신청',
  lecture_waiting: '강의 대기 신청',
  material_preparing: '교재 준비중',
  settlement_waiting: '정산 대기',
}

const baseRows: Omit<ProgramProgressTabRow, 'id' | 'no'>[] = [
  {
    programName: '2026년 JA Korea 초등 경제교육 대상학교 모집',
    sponsor: 'JA Korea 고유목적사업',
    participantType: '학교',
    educationTarget: '초등학생',
    applicationPeriod: '26.04.03 ~ 26.11.20',
    operatingPeriod: '25.12.08 ~ 26.01.16',
  },
  {
    programName: '1사1교 경제금융교육 디자인 세미나 1차시',
    sponsor: 'JA Korea 고유목적사업',
    participantType: '학교',
    educationTarget: '초등학생',
    applicationPeriod: '26.03.01 ~ 26.05.31',
    operatingPeriod: '26.06.01 ~ 26.08.31',
  },
  {
    programName: 'Dream and Plan the Future',
    sponsor: 'BNP PARIBAS CIB',
    participantType: '학교',
    educationTarget: '초등학생',
    applicationPeriod: '26.02.01 ~ 26.04.30',
    operatingPeriod: '26.05.01 ~ 26.07.31',
  },
  {
    programName: '신용케어 아카데미',
    sponsor: 'BNP 파리바 카디프생명',
    participantType: '개인',
    educationTarget: '초등학생',
    applicationPeriod: '26.01.15 ~ 26.03.15',
    operatingPeriod: '26.03.20 ~ 26.05.20',
  },
  {
    programName: '개인 재무 기초 교육',
    sponsor: '베어링 자산운용',
    participantType: '학교',
    educationTarget: '고등학생',
    applicationPeriod: '25.12.01 ~ 26.02.28',
    operatingPeriod: '26.03.01 ~ 26.05.31',
  },
  {
    programName: 'Invest in Your Future',
    sponsor: 'Barings',
    participantType: '개인',
    educationTarget: '중등학생',
    applicationPeriod: '26.05.01 ~ 26.07.31',
    operatingPeriod: '26.08.01 ~ 26.10.31',
  },
  {
    programName: '경제금융 리터러시 과정',
    sponsor: '삼성전자',
    participantType: '학교',
    educationTarget: '중등학생',
    applicationPeriod: '26.06.01 ~ 26.08.31',
    operatingPeriod: '26.09.01 ~ 26.11.30',
  },
  {
    programName: '기업가정신 워크샵',
    sponsor: 'LG전자',
    participantType: '개인',
    educationTarget: '고등학생',
    applicationPeriod: '26.07.01 ~ 26.09.30',
    operatingPeriod: '26.10.01 ~ 26.12.31',
  },
  {
    programName: '진로취업 멘토링 프로그램',
    sponsor: 'SK텔레콤',
    participantType: '학교',
    educationTarget: '고등학생',
    applicationPeriod: '26.08.01 ~ 26.10.31',
    operatingPeriod: '26.11.01 ~ 27.01.31',
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
