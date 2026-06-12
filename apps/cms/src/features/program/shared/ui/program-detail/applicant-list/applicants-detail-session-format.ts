export type ApplicantSessionLineInput = {
  date: string
  dayOfWeek: string
  duration: string
  format: string
  classNum: string
  timeRange: string
  round?: number
}

import type { SessionLinePreset } from './applicant-list-menu'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { resolveInstitutionApplicationSessionPeriodPart } from '@/features/program/general/lib/institution-application-session-display'

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
  const { datePart, durationPart, periodPart } = getSessionLineParts(s, 'general-detail', bridge)
  if (!periodPart) return `${datePart} ${durationPart}`
  return `${datePart} ${durationPart} | ${periodPart}`
}
