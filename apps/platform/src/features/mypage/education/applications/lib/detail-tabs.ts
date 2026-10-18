import type { ProgramDetailCase } from '@/features/program'

/** 진행·완료·진행중포기 상세 탭 key */
export type EducationActivitySection =
  | 'notice'
  | 'schedule'
  | 'educationJournal'
  | 'students'
  | 'survey'
  | 'satisfaction'
  | 'settlement'

export type EducationDetailTabItem = {
  key: EducationActivitySection
  label: string
}

/** 교육현황 상세 — 일정 탭·패널 제목 SSOT (`detailCase`와 무관) */
export const EDUCATION_ACTIVITY_SCHEDULE_TAB_LABEL = '교육일정'

/**
 * 교육 일정 탭 라벨.
 * - 봉사: 배정현황
 * - UJAT: 배정 및 출결 현황
 * - 강사: 강의 일정
 * - 그 외: 교육일정
 */
export function resolveEducationScheduleTabLabel(detailCase: ProgramDetailCase): string {
  switch (detailCase) {
    case 'volunteer':
      return '배정현황'
    case 'ujat-volunteer':
    case 'ujat-participant':
      return '배정 및 출결 현황'
    case 'instructor':
      return '강의 일정'
    default:
      return '교육일정'
  }
}

/**
 * 봉사현황 상세 탭용 detailCase.
 * 신청 역할(`VOLUNTEER`) 기준 — 프로그램 `detailCase`가 `general`이어도 일정 탭이「교육일정」이 되지 않게 한다.
 */
export function resolveVolunteerActivityDetailCase(
  applicationDetailCase: ProgramDetailCase | undefined,
): ProgramDetailCase {
  return applicationDetailCase === 'ujat-volunteer' ? 'ujat-volunteer' : 'volunteer'
}

type ActivityTabOptions = {
  detailCase: ProgramDetailCase
  /**
   * 일정 탭 라벨 override.
   * 교육현황은 `EDUCATION_ACTIVITY_SCHEDULE_TAB_LABEL`. 봉사·강의현황은 미설정 → `detailCase` 분기.
   */
  scheduleTabLabel?: string
  /** 프로그램에 설문조사 항목이 설정된 경우. false면 탭 비노출. 기본 true */
  surveyConfigured?: boolean
  /** 프로그램에 만족도조사 항목이 설정된 경우. false면 탭 비노출. 기본 true */
  satisfactionConfigured?: boolean
  /**
   * 교사 회원 — 학생 명단 탭(출석 관리 탭 추가 시 동일 플래그).
   * `GET .../student-documents/policy`의 `studentDocumentsSupported === false`이면 false.
   */
  teacherStudentDocumentTabsVisible?: boolean
  /** 서버가 명시적으로 ON인 교육받은 교사 교육일지 탭만 노출한다. */
  educationJournalEnabled?: boolean
}

function resolveActivityScheduleTabLabel(options: ActivityTabOptions): string {
  if (options.scheduleTabLabel != null && options.scheduleTabLabel !== '') {
    return options.scheduleTabLabel
  }
  return resolveEducationScheduleTabLabel(options.detailCase)
}

function isConfigured(flag: boolean | undefined): boolean {
  return flag !== false
}

function isTeacherStudentDocumentTabsVisible(options: ActivityTabOptions): boolean {
  return options.teacherStudentDocumentTabsVisible !== false
}

function appendTeacherStudentDocumentTabs(
  items: EducationDetailTabItem[],
  options: ActivityTabOptions,
): void {
  if (!isTeacherStudentDocumentTabsVisible(options)) return
  items.push({ key: 'students', label: '학생 명단' })
}

function appendTeacherEducationJournalTab(
  items: EducationDetailTabItem[],
  options: ActivityTabOptions,
): void {
  if (options.educationJournalEnabled === true) {
    items.push({ key: 'educationJournal', label: '교육일지' })
  }
}

function appendSurveySatisfactionTabs(
  items: EducationDetailTabItem[],
  options: ActivityTabOptions
): void {
  if (isConfigured(options.surveyConfigured)) {
    items.push({ key: 'survey', label: '설문조사' })
  }
  if (isConfigured(options.satisfactionConfigured)) {
    items.push({ key: 'satisfaction', label: '만족도조사' })
  }
}

/**
 * 진행 중 / 진행 완료 탭 (일반·강사 등).
 * 설문·만족도는 진행 중 내용이 없어도 노출하되, 프로그램 미설정(`*Configured === false`)이면 비노출.
 */
export function buildInProgressDetailTabItems(
  options: ActivityTabOptions
): EducationDetailTabItem[] {
  const items: EducationDetailTabItem[] = [
    { key: 'notice', label: '안내사항' },
    { key: 'schedule', label: resolveActivityScheduleTabLabel(options) },
  ]
  appendSurveySatisfactionTabs(items, options)
  items.push({ key: 'settlement', label: '정산현황' })
  return items
}

/**
 * 교사 회원 — 진행 중 / 진행 완료 탭.
 * 안내사항 / 교육 일정 / 학생 명단 / 설문·만족도. 정산 비노출.
 */
export function buildTeacherInProgressDetailTabItems(
  options: ActivityTabOptions
): EducationDetailTabItem[] {
  const items: EducationDetailTabItem[] = [
    { key: 'notice', label: '안내사항' },
    { key: 'schedule', label: resolveActivityScheduleTabLabel(options) },
  ]
  appendTeacherEducationJournalTab(items, options)
  appendTeacherStudentDocumentTabs(items, options)
  appendSurveySatisfactionTabs(items, options)
  return items
}

/**
 * 교육 진행 중 활동 포기 탭 — 안내사항 제외.
 * 일정·설문·만족도·정산은 포기 이전 회차·활동만 (`lastParticipatedSession`).
 */
export function buildWithdrawnDuringDetailTabItems(
  options: ActivityTabOptions
): EducationDetailTabItem[] {
  return buildInProgressDetailTabItems(options).filter(item => item.key !== 'notice')
}

/**
 * 교사 회원 — 교육 진행 중 포기 탭.
 * 교육 일정 / 학생 명단 / 설문·만족도. 안내사항·정산 비노출.
 */
export function buildTeacherWithdrawnDuringDetailTabItems(
  options: ActivityTabOptions
): EducationDetailTabItem[] {
  return buildTeacherInProgressDetailTabItems(options).filter(item => item.key !== 'notice')
}
