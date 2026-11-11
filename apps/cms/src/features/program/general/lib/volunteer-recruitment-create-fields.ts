import { isSeededNowAnnouncementTimestamp } from '@/features/program/shared/lib/resolve-result-announcement-date'
import { GENERAL_RECRUIT_OVERLAY_KEYS as KEYS } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import type { Program } from '@/types/domain'

export type VolunteerRecruitmentCreateFields = Pick<
  ProgramRecruitmentRequest,
  | 'documentPassAnnouncementAt'
  | 'documentPassAnnouncementMethod'
  | 'interviewMethod'
  | 'finalPassAnnouncementAt'
  | 'finalPassAnnouncementMethod'
  | 'volunteerTargetDetail'
>

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function instant(value: unknown, program: Program): string | undefined {
  const iso = text(value)
  if (!iso) return undefined
  if (
    isSeededNowAnnouncementTimestamp(iso, {
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    })
  ) {
    return undefined
  }
  return iso
}

/**
 * 일반 봉사 모집 행 생성 본문 — 발표·면접 방법·봉사 대상 상세를 행 칸에도 싣는다.
 * 행 칸이 비면 BE 알림(`#{면접 유형}` 등)과 행 기준 화면이 「미정」·빈 값이 된다.
 * 값은 이번 생성 overlay → 모집 탭 nested 순으로 읽는다. 면접 없음이면 서류 발표·면접 유형은 싣지 않는다.
 */
export function volunteerRecruitmentCreateFields(
  overlay: Record<string, unknown>,
  program: Program,
  interviewEnabled: boolean
): VolunteerRecruitmentCreateFields {
  const nested = program.generalCommonInfo?.volunteerRecruitmentInfo
  const out: VolunteerRecruitmentCreateFields = {}

  const finalAt =
    instant(overlay[KEYS.volunteer.finalAnnounceIso], program) ??
    instant(nested?.finalPassAnnouncementDate, program)
  const finalMethod =
    text(overlay[KEYS.volunteer.finalAnnounceMethod]) ?? text(nested?.finalPassAnnouncementMethod)
  const targetDetail =
    text(overlay[KEYS.volunteer.volunteerTargetDetail]) ?? text(nested?.recruitmentTargetDetail)
  if (finalAt) out.finalPassAnnouncementAt = finalAt
  if (finalMethod) out.finalPassAnnouncementMethod = finalMethod
  if (targetDetail) out.volunteerTargetDetail = targetDetail
  if (!interviewEnabled) return out

  const documentAt =
    instant(overlay[KEYS.volunteer.docDeadlineIso], program) ??
    instant(nested?.documentPassAnnouncementDate, program)
  const documentMethod =
    text(overlay[KEYS.volunteer.docAnnounceMethod]) ?? text(nested?.documentPassAnnouncementMethod)
  const interviewMethod =
    text(overlay[KEYS.volunteer.interviewMethod]) ?? text(nested?.interviewMethod)
  if (documentAt) out.documentPassAnnouncementAt = documentAt
  if (documentMethod) out.documentPassAnnouncementMethod = documentMethod
  if (interviewMethod) out.interviewMethod = interviewMethod
  return out
}
