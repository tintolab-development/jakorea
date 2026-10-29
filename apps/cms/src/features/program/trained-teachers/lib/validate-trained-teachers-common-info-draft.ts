import { findEducationScheduleLinesOutsideOperationRange } from '@/features/program/shared/lib/education-schedule-change'
import {
  EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
  EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE,
} from '@/features/program/general/model/common-info-edit-schema'
import type { DateValue } from '@/types'

function progressGroupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

function formatScheduleIndex(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export interface ValidateTrainedTeachersCommonInfoDraftInput {
  educationStructure: string
  sessionRound: string
  scheduleDetails: Array<{ name?: string }>
  progressGroupsByDetail: string[][]
  educationScheduleLines?: (string | undefined | null)[]
  /** 사업 운영 기간 — 교육 진행 일정 범위 검증 (일반 공통정보와 동일) */
  operationStart?: DateValue | null
  operationEnd?: DateValue | null
}

export type TrainedTeachersCommonInfoDraftValidationAlert = {
  title: string
  content: string
}

/** RHF 밖 draft 필드 — 저장 전 한글 검증 메시지 */
export function validateTrainedTeachersCommonInfoDraft(
  input: ValidateTrainedTeachersCommonInfoDraftInput | null | undefined
): string | undefined {
  return resolveTrainedTeachersCommonInfoDraftValidationAlert(input)?.content
}

/** 저장 전 AlertModal title/content — 일반 공통정보 운영기간 검증과 동일 카피 */
export function resolveTrainedTeachersCommonInfoDraftValidationAlert(
  input: ValidateTrainedTeachersCommonInfoDraftInput | null | undefined
): TrainedTeachersCommonInfoDraftValidationAlert | undefined {
  if (!input) return undefined

  const hideEducationSchedule =
    input.educationStructure === 'schedule' && input.sessionRound === 'multi'

  if (!hideEducationSchedule) {
    const lines = (input.educationScheduleLines ?? []).map(line => line?.trim() ?? '')
    if (!lines.some(Boolean)) {
      return { title: '입력 확인', content: '교육 진행 예정일을 입력해 주세요.' }
    }

    const outOfRangeLineIndices = findEducationScheduleLinesOutsideOperationRange(
      lines.filter(Boolean),
      input.operationStart,
      input.operationEnd
    )
    if (outOfRangeLineIndices.length > 0) {
      return {
        title: EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
        content: EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE,
      }
    }
  }

  if (input.educationStructure === 'schedule') {
    for (let i = 0; i < input.scheduleDetails.length; i += 1) {
      const detail = input.scheduleDetails[i]
      const scheduleLabel =
        input.sessionRound === 'multi' ? '행사 일정' : '세부 일정'
      if (!detail.name?.trim()) {
        return {
          title: '입력 확인',
          content: `${scheduleLabel} ${formatScheduleIndex(i)}의 일정명을 입력해 주세요.`,
        }
      }

      if (input.sessionRound === 'single') {
        const groups = input.progressGroupsByDetail[i] ?? ['']
        for (let g = 0; g < groups.length; g += 1) {
          if (!groups[g]?.trim()) {
            if (groups.length > 1) {
              return {
                title: '입력 확인',
                content: `${scheduleLabel} ${formatScheduleIndex(i)}의 진행 시간(그룹 ${progressGroupLetter(g)})을 입력해 주세요.`,
              }
            }
            return {
              title: '입력 확인',
              content: `${scheduleLabel} ${formatScheduleIndex(i)}의 진행 시간을 입력해 주세요.`,
            }
          }
        }
      }
    }
  }

  return undefined
}
