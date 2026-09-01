import type { ProgramDetailCase } from '@/features/program'

/** 진행·완료·진행중포기 상세 탭 key */
export type EducationActivitySection =
  | 'notice'
  | 'schedule'
  | 'survey'
  | 'satisfaction'
  | 'settlement'

export type EducationDetailTabItem = {
  key: EducationActivitySection
  label: string
}

/**
 * 교육 일정 탭 라벨.
 * - 봉사: 배정현황
 * - UJAT: 배정 및 출결 현황
 * - 그 외: 교육일정
 */
export function resolveEducationScheduleTabLabel(detailCase: ProgramDetailCase): string {
  switch (detailCase) {
    case 'volunteer':
      return '배정현황'
    case 'ujat-volunteer':
    case 'ujat-participant':
      return '배정 및 출결 현황'
    default:
      return '교육일정'
  }
}

type ActivityTabOptions = {
  detailCase: ProgramDetailCase
  /** 프로그램에 설문조사 항목이 설정된 경우. false면 탭 비노출. 기본 true */
  surveyConfigured?: boolean
  /** 프로그램에 만족도조사 항목이 설정된 경우. false면 탭 비노출. 기본 true */
  satisfactionConfigured?: boolean
}

function isConfigured(flag: boolean | undefined): boolean {
  return flag !== false
}

/**
 * 진행 중 / 진행 완료 탭.
 * 설문·만족도는 진행 중 내용이 없어도 노출하되, 프로그램 미설정(`*Configured === false`)이면 비노출.
 */
export function buildInProgressDetailTabItems(
  options: ActivityTabOptions,
): EducationDetailTabItem[] {
  const items: EducationDetailTabItem[] = [
    { key: 'notice', label: '안내사항' },
    { key: 'schedule', label: resolveEducationScheduleTabLabel(options.detailCase) },
  ]
  if (isConfigured(options.surveyConfigured)) {
    items.push({ key: 'survey', label: '설문조사' })
  }
  if (isConfigured(options.satisfactionConfigured)) {
    items.push({ key: 'satisfaction', label: '만족도조사' })
  }
  items.push({ key: 'settlement', label: '정산현황' })
  return items
}

/**
 * 교육 진행 중 활동 포기 탭 — 안내사항 제외.
 * 일정·설문·만족도·정산은 포기 이전 회차·활동만 (`lastParticipatedSession`).
 */
export function buildWithdrawnDuringDetailTabItems(
  options: ActivityTabOptions,
): EducationDetailTabItem[] {
  return buildInProgressDetailTabItems(options).filter(item => item.key !== 'notice')
}
