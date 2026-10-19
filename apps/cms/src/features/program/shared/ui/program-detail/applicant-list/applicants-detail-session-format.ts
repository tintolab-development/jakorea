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
}

import { appendCurriculumSingleDateFixedScheduleSessionSuffix } from '@jakorea/form-schema/program-application'
import type { SessionLinePreset } from './applicant-list-menu'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { resolveInstitutionApplicationSessionPeriodPart } from '@/features/program/general/lib/institution-application-session-display'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'

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
  const datePart = `${s.date.replace(/\./g, '. ')}(${s.dayOfWeek})`
  if (preset === 'general-detail') {
    const timePart = s.timeRange.replace('~', ' ~ ')
    const periodPart = bridge
      ? (resolveInstitutionApplicationSessionPeriodPart(s, bridge) ?? '')
      : (() => {
          const roundLabel =
            s.round != null
              ? s.round
              : Number.parseInt(s.classNum.replace(/\D/g, ''), 10) || 1
          return `${roundLabel}차시`
        })()
    return { datePart, durationPart: timePart, periodPart, preset }
  }
  const durationPart = `${s.duration} (${s.format})`
  const periodPart = `${s.classNum} (${s.timeRange.replace('~', ' ~ ')})`
  return { datePart, durationPart, periodPart, preset }
}

/** 일반 상세 목록 — `2026. 01. 09(금) 09:20 ~ 11:20 | 1차시` 한 줄 표기 */
export function formatGeneralDetailSessionLine(
  s: ApplicantSessionLineInput,
  bridge?: InstitutionApplicationProgramBridge | null
): string {
  const scheduleLabel = s.scheduleLabel?.trim()
  if (scheduleLabel) {
    return formatCmsScheduleDisplayLabel(enrichGeneralDetailScheduleLineLabel(scheduleLabel, bridge))
  }
  const { datePart, durationPart, periodPart } = getSessionLineParts(s, 'general-detail', bridge)
  if (!periodPart) {
    return formatCmsScheduleDisplayLabel(
      enrichGeneralDetailScheduleLineLabel(`${datePart} ${durationPart}`, bridge)
    )
  }
  return formatCmsScheduleDisplayLabel(`${datePart} ${durationPart} | ${periodPart}`)
}
