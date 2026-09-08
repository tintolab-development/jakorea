import type { GeneralProgramScheduleDetailKind } from '@/types/domain'

/** 일반(개인) 복수 회차 extra 테이블에 올 수 있는 필드 */
export type IndividualPerScheduleTableField =
  | 'assignment'
  | 'education'
  | 'ips'
  | 'participation'

export type IndividualPerScheduleTableRow =
  | { type: 'single'; field: IndividualPerScheduleTableField }
  | {
      type: 'double'
      left: IndividualPerScheduleTableField
      right: IndividualPerScheduleTableField
    }

/**
 * 일반(개인) 복수 회차 — 교육 진행 extra 행 배치.
 * Notion: 일정 별 상이 항목 수에 따라 과제 설정과 2단/1단 테이블을 나눈다.
 * - 0개: 과제 설정 1단
 * - 1개: 과제 설정 + 해당 항목 2단
 * - 2개: 항목 2개 2단(교육 형태 > IPS 유형 > 참여 방식) + 과제 설정 1단
 * - 3개: 교육 형태|IPS 유형 한 줄, 과제 설정|참여 방식 한 줄
 */
export function getIndividualMultiRoundPerScheduleTableRows(input: {
  educationFormScheduleDetail: GeneralProgramScheduleDetailKind
  participationScheduleDetail: GeneralProgramScheduleDetailKind
  ipsScheduleDetail: GeneralProgramScheduleDetailKind
}): IndividualPerScheduleTableRow[] {
  const perFields: Array<Exclude<IndividualPerScheduleTableField, 'assignment'>> = []
  if (input.educationFormScheduleDetail === 'perSchedule') perFields.push('education')
  if (input.ipsScheduleDetail === 'perSchedule') perFields.push('ips')
  if (input.participationScheduleDetail === 'perSchedule') perFields.push('participation')

  if (perFields.length === 0) {
    return [{ type: 'single', field: 'assignment' }]
  }
  if (perFields.length === 1) {
    const only = perFields[0]
    if (only == null) return [{ type: 'single', field: 'assignment' }]
    return [{ type: 'double', left: 'assignment', right: only }]
  }
  if (perFields.length === 2) {
    const left = perFields[0]
    const right = perFields[1]
    if (left == null || right == null) return [{ type: 'single', field: 'assignment' }]
    return [
      { type: 'double', left, right },
      { type: 'single', field: 'assignment' },
    ]
  }
  return [
    { type: 'double', left: 'education', right: 'ips' },
    { type: 'double', left: 'assignment', right: 'participation' },
  ]
}
