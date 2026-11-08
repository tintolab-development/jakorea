export type ApplicantSessionLineInput = {
  date: string
  dayOfWeek: string
  duration: string
  format: string
  classNum: string
  timeRange: string
  round?: number
  /** `line:N` 선택. 있으면 날짜·시간 조합 대신 이 문자열을 쓴다. */
  scheduleLabel?: string
  /** 일반 기관 PERIOD 희망 행만 — true 「확정」, false 「미확정(희망)」 */
  hopeScheduleConfirmed?: boolean
}

/** PERIOD 희망 행 확정 여부 문구. `unresolvedReason` 등 내부 코드는 노출하지 않는다. */
export function formatHopeScheduleConfirmationLabel(confirmed: boolean | undefined): string {
  if (confirmed === undefined) return ''
  return confirmed ? '확정' : '미확정(희망)'
}

import { appendCurriculumSingleDateFixedScheduleSessionSuffix } from '@jakorea/form-schema/program-application'
import type { SessionLinePreset } from './applicant-list-menu'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { formatHopeScheduleFormOptionLine } from '@/features/program/general/lib/hope-schedule-form-option'
import { resolveInstitutionApplicationSessionPeriodPart } from '@/features/program/general/lib/institution-application-session-display'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { formatEducationRoundSessionLabel } from '@/shared/lib/education-schedule-name'
import {
  formatGeneralEducationScheduleLine,
  type GeneralEducationScheduleShape,
} from '@/features/program/general/lib/participating-school-session-display'

/** 신청 폼 고정 일정 선택지와 동일 — 커리큘럼·단일·날짜 `예정일 | N차시` */
export function enrichGeneralDetailScheduleLineLabel(
  baseLabel: string,
  bridge?: InstitutionApplicationProgramBridge | null
): string {
  const trimmed = baseLabel.trim()
  if (!trimmed || !bridge) return trimmed || baseLabel
  return appendCurriculumSingleDateFixedScheduleSessionSuffix(
    trimmed,
    {
      educationStructure: bridge.educationStructure,
      sessionRound: bridge.sessionRound,
      educationScheduleMode: bridge.educationScheduleMode,
      educationScheduleLines: bridge.educationScheduleLines,
    },
    {
      curriculumChartSessionCount: bridge.curriculumChartSessionCount,
      educationRoundCount: bridge.educationRoundCount,
      sessionsPerRound: bridge.sessionsPerRound,
    }
  )
}

/** 날짜·시간·교시 구간 텍스트 (participating-institutions-section과 동일) */
export function getSessionLineParts(
  s: ApplicantSessionLineInput,
  preset: SessionLinePreset = 'legacy',
  bridge?: InstitutionApplicationProgramBridge | null
) {
  const datePart = formatCmsScheduleDisplayLabel(`${s.date}(${s.dayOfWeek})`)
  if (preset === 'general-detail') {
    const timePart = s.timeRange.replace('~', ' ~ ')
    const periodPart = bridge
      ? (resolveInstitutionApplicationSessionPeriodPart(s, bridge) ?? '')
      : (() => {
          const roundLabel =
            s.round != null
              ? s.round
              : Number.parseInt(s.classNum.replace(/\D/g, ''), 10) || 1
          return formatEducationRoundSessionLabel({ roundNumber: roundLabel })
        })()
    return { datePart, durationPart: timePart, periodPart, preset }
  }
  const durationPart = `${s.duration} (${s.format})`
  const periodPart = `${s.classNum} (${s.timeRange.replace('~', ' ~ ')})`
  return { datePart, durationPart, periodPart, preset }
}

export function generalEducationScheduleShapeFromBridge(
  bridge?: InstitutionApplicationProgramBridge | null
): GeneralEducationScheduleShape | null {
  if (!bridge) return null
  return {
    educationStructure: bridge.educationStructure,
    sessionRound: bridge.sessionRound,
    educationScheduleMode: bridge.educationScheduleMode,
    curriculumSessionCount: bridge.curriculumChartSessionCount,
  }
}

/** 일반 상세 목록 — `preferFormOptionLabel`이면 폼 선택지 문구, 아니면 진행 화면과 같은 한 줄 */
export function formatGeneralDetailSessionLine(
  s: ApplicantSessionLineInput,
  bridge?: InstitutionApplicationProgramBridge | null,
  options?: {
    detailScheduleTimeSpan?: string | null
    curriculumSessionLabels?: readonly string[] | null
    preferFormOptionLabel?: boolean
  }
): string {
  const line = formatGeneralDetailSessionBaseLine(s, bridge, options)
  const confirmation = formatHopeScheduleConfirmationLabel(s.hopeScheduleConfirmed)
  return line && confirmation ? `${line} | ${confirmation}` : line
}

function formatGeneralDetailSessionBaseLine(
  s: ApplicantSessionLineInput,
  bridge?: InstitutionApplicationProgramBridge | null,
  options?: {
    detailScheduleTimeSpan?: string | null
    curriculumSessionLabels?: readonly string[] | null
    preferFormOptionLabel?: boolean
  }
): string {
  if (options?.preferFormOptionLabel) {
    const formOptionLine = formatHopeScheduleFormOptionLine(s, bridge)
    if (formOptionLine) return formOptionLine
  }
  const shape = generalEducationScheduleShapeFromBridge(bridge)
  return formatGeneralEducationScheduleLine(
    s,
    shape ? { ...shape, curriculumSessionLabels: options?.curriculumSessionLabels } : null,
    options
  )
}
