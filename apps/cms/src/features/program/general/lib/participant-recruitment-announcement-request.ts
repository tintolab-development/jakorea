import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as INST } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import { isSeededNowAnnouncementTimestamp } from '@/features/program/shared/lib/resolve-result-announcement-date'
import type { Program } from '@/types/domain'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import { GENERAL_RECRUIT_OVERLAY_KEYS as KEYS } from '@/features/program/general/lib/general-recruit-overlay-to-program'

const INTERVIEW_OFF_SUFFIXES = [
  'docDeadlineIso',
  'interviewRangeSeal',
  'interviewAnchorIso',
] as const

const ANNOUNCEMENT_PREFIXES = [
  'recruit.individual',
  'recruit.volunteer',
  'recruit.institution',
] as const

function overlayText(overlay: Record<string, unknown>, key: string): string | undefined {
  const raw = overlay[key]
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  return trimmed ? trimmed : undefined
}

function overlayYesNo(overlay: Record<string, unknown>, key: string): boolean | undefined {
  const raw = overlay[key]
  if (raw === 'yes' || raw === true) return true
  if (raw === 'no' || raw === false) return false
  return undefined
}

function overlayRange(
  overlay: Record<string, unknown>,
  key: string
): { start?: string; end?: string } | undefined {
  const raw = overlay[key]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const start = overlayText(raw as Record<string, unknown>, 'start')
  const end = overlayText(raw as Record<string, unknown>, 'end')
  if (!start && !end) return undefined
  return { start, end }
}

function usableIso(
  value: string | Date | null | undefined,
  timestamps?: { createdAt?: string | Date | null; updatedAt?: string | Date | null }
): string | undefined {
  if (value == null) return undefined
  const iso = typeof value === 'string' ? value.trim() : value.toISOString()
  if (!iso) return undefined
  if (isSeededNowAnnouncementTimestamp(iso, timestamps)) return undefined
  return iso
}

function participantTypes(program: Program): string[] {
  return program.generalParticipantTypes ?? []
}

function overlayOf(program: Program): Record<string, unknown> {
  return program.registrationOverlay ?? {}
}

function timestampsOf(program: Program) {
  return { createdAt: program.createdAt, updatedAt: program.updatedAt }
}

/** 면접 없음·등록 시각 시드 서류 발표 키는 overlay에 남기지 않는다. 개인 값을 volunteer에 복사하지 않는다. */
export function sanitizeRecruitAnnouncementOverlay(
  overlay: Record<string, unknown>,
  program?: Pick<Program, 'createdAt' | 'updatedAt' | 'generalParticipantTypes'>
): Record<string, unknown> {
  const next = { ...overlay }
  const types = program?.generalParticipantTypes ?? []
  const keepVolunteer = types.length === 0 || types.includes('volunteer')
  const stamps = { createdAt: program?.createdAt, updatedAt: program?.updatedAt }

  if (!keepVolunteer) {
    for (const key of Object.keys(next)) {
      if (key.startsWith('recruit.volunteer.') || key.startsWith('recruitVolunteer.')) {
        delete next[key]
      }
    }
  }

  for (const prefix of ANNOUNCEMENT_PREFIXES) {
    const required = overlayYesNo(next, `${prefix}.interviewRequired`)
    if (required === false) {
      for (const suffix of INTERVIEW_OFF_SUFFIXES) {
        delete next[`${prefix}.${suffix}`]
      }
    }
    const docKey = `${prefix}.docDeadlineIso`
    const doc = next[docKey]
    if (typeof doc === 'string' && !usableIso(doc, stamps)) delete next[docKey]
  }

  return next
}

function announcementFromKeys(
  overlay: Record<string, unknown>,
  keys: {
    interviewRequired?: string
    docDeadlineIso?: string
    interviewRangeSeal?: string
    finalAnnounceIso?: string
  },
  fallback: {
    interviewEnabled?: boolean
    documentPassAnnouncementAt?: string
    interviewStartAt?: string
    interviewEndAt?: string
    finalPassAnnouncementAt?: string
  },
  timestamps: { createdAt?: string | Date | null; updatedAt?: string | Date | null }
): Pick<
  ProgramRecruitmentRequest,
  | 'interviewEnabled'
  | 'documentPassAnnouncementAt'
  | 'interviewStartAt'
  | 'interviewEndAt'
  | 'finalPassAnnouncementAt'
> {
  const interviewEnabled =
    (keys.interviewRequired ? overlayYesNo(overlay, keys.interviewRequired) : undefined) ??
    fallback.interviewEnabled
  const finalPassAnnouncementAt =
    usableIso(keys.finalAnnounceIso ? overlayText(overlay, keys.finalAnnounceIso) : undefined, timestamps) ??
    fallback.finalPassAnnouncementAt
  const out: ReturnType<typeof announcementFromKeys> = {}
  if (typeof interviewEnabled === 'boolean') out.interviewEnabled = interviewEnabled
  if (finalPassAnnouncementAt) out.finalPassAnnouncementAt = finalPassAnnouncementAt
  if (interviewEnabled === false) return out

  const documentPassAnnouncementAt =
    usableIso(keys.docDeadlineIso ? overlayText(overlay, keys.docDeadlineIso) : undefined, timestamps) ??
    (interviewEnabled === true ? fallback.documentPassAnnouncementAt : undefined)
  const range = keys.interviewRangeSeal ? overlayRange(overlay, keys.interviewRangeSeal) : undefined
  const interviewStartAt = usableIso(range?.start, timestamps) ?? fallback.interviewStartAt
  const interviewEndAt = usableIso(range?.end, timestamps) ?? fallback.interviewEndAt
  if (documentPassAnnouncementAt) out.documentPassAnnouncementAt = documentPassAnnouncementAt
  if (interviewStartAt) out.interviewStartAt = interviewStartAt
  if (interviewEndAt) out.interviewEndAt = interviewEndAt
  return out
}

export function participantRecruitmentAnnouncementRequestFields(
  program: Program,
  target: 'INDIVIDUAL' | 'ORGANIZATION'
): Pick<
  ProgramRecruitmentRequest,
  | 'interviewEnabled'
  | 'documentPassAnnouncementAt'
  | 'interviewStartAt'
  | 'interviewEndAt'
  | 'finalPassAnnouncementAt'
> {
  const overlay = overlayOf(program)
  const stamps = timestampsOf(program)
  const types = participantTypes(program)
  const mixedParticipant =
    types.includes('individual') && types.includes('school_institution')
  const sharedFallback = {
    interviewEnabled: program.generalParticipantInterviewEnabled,
    documentPassAnnouncementAt: usableIso(program.documentPassAnnouncementDate, stamps),
    interviewStartAt: usableIso(program.interviewStartDate, stamps),
    interviewEndAt: usableIso(program.interviewEndDate, stamps),
    finalPassAnnouncementAt: usableIso(program.resultAnnouncementDate, stamps),
  }

  if (target === 'INDIVIDUAL') {
    return announcementFromKeys(
      overlay,
      {
        interviewRequired: KEYS.individual.interviewRequired,
        docDeadlineIso: KEYS.individual.docDeadlineIso,
        interviewRangeSeal: KEYS.individual.interviewRangeSeal,
        finalAnnounceIso: KEYS.individual.finalAnnounceIso,
      },
      mixedParticipant ? { interviewEnabled: sharedFallback.interviewEnabled } : sharedFallback,
      stamps
    )
  }

  return announcementFromKeys(
    overlay,
    {
      interviewRequired: 'recruit.institution.interviewRequired',
      docDeadlineIso: 'recruit.institution.docDeadlineIso',
      interviewRangeSeal: 'recruit.institution.interviewRangeSeal',
      finalAnnounceIso: overlayText(overlay, 'recruit.institution.finalAnnounceIso')
        ? 'recruit.institution.finalAnnounceIso'
        : INST.finalAnnounceIso,
    },
    mixedParticipant ? {} : sharedFallback,
    stamps
  )
}
