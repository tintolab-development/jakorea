import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import { participantFlagsFromGeneralProgram } from '@/features/program/general/lib/participant-audience-selection'

const INDIVIDUAL_FINAL_ANNOUNCE_ISO = 'recruit.individual.finalAnnounceIso'
const VOLUNTEER_FINAL_ANNOUNCE_ISO = 'recruit.volunteer.finalAnnounceIso'

function overlayText(overlay: Record<string, unknown> | undefined, key: string): string | undefined {
  const raw = overlay?.[key]
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed ? trimmed : undefined
}

/** 등록 시드 `new Date().toISOString()` — 초·밀리초가 있거나 createdAt/updatedAt과 같다. */
export function isSeededNowAnnouncementTimestamp(
  value: string | Date | null | undefined,
  program?: { createdAt?: string | Date | null; updatedAt?: string | Date | null }
): boolean {
  if (value == null) return false
  const iso = String(value).trim()
  if (!iso) return false
  const created = program?.createdAt != null ? String(program.createdAt).trim() : ''
  const updated = program?.updatedAt != null ? String(program.updatedAt).trim() : ''
  if ((created && iso === created) || (updated && iso === updated)) return true
  const parsed = dayjs(iso)
  if (!parsed.isValid()) return false
  return parsed.second() !== 0 || parsed.millisecond() !== 0
}

/**
 * 최종 합격자 발표일.
 * overlay가 있으면 overlay가 정본. 프로그램 컬럼이 등록 시각 시드면 overlay를 이기지 못한다.
 */
export function coalesceResultAnnouncementDate(args: {
  overlayIso?: string | null
  programDate?: string | Date | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  preferOverlay: boolean
}): string | Date | undefined {
  const timestamps = {
    createdAt: args.createdAt ?? undefined,
    updatedAt: args.updatedAt ?? undefined,
  }
  const overlayIso = args.overlayIso?.trim() ? args.overlayIso.trim() : undefined
  if (overlayIso && !isSeededNowAnnouncementTimestamp(overlayIso, timestamps)) return overlayIso
  const seeded = isSeededNowAnnouncementTimestamp(args.programDate, timestamps)
  if (seeded) return undefined
  if (args.preferOverlay) return undefined
  if (args.programDate != null && String(args.programDate).trim() !== '') return args.programDate
  return undefined
}

/** 참여자: institution ?? individual, 없으면 volunteer. */
export function readRecruitFinalAnnounceIsoFromOverlay(
  overlay: Record<string, unknown> | undefined,
  program: Pick<Program, 'generalParticipantTypes' | 'generalProgramAudience'>
): string | undefined {
  if (!overlay) return undefined
  const institution = overlayText(overlay, APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.finalAnnounceIso)
  const individual = overlayText(overlay, INDIVIDUAL_FINAL_ANNOUNCE_ISO)
  const volunteer = overlayText(overlay, VOLUNTEER_FINAL_ANNOUNCE_ISO)
  const organization =
    participantFlagsFromGeneralProgram(program as Program).organization === true
  const participant = organization ? (institution ?? individual) : (individual ?? institution)
  return participant ?? volunteer
}

export function resolveProgramResultAnnouncementDate(
  program: Program,
  overlay: Record<string, unknown> | undefined,
  preferOverlay: boolean
): string | Date | undefined {
  return coalesceResultAnnouncementDate({
    overlayIso: readRecruitFinalAnnounceIsoFromOverlay(overlay, program),
    programDate: program.resultAnnouncementDate,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    preferOverlay,
  })
}
