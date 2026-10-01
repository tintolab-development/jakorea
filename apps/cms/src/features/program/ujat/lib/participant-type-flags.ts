import type { Program } from '@/types/domain'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { createUjatRegistrationBasicInfoOverlayDefaults } from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'

export type UjatParticipantTypeFlags = {
  individual: boolean
  organization: boolean
  teacher: boolean
  volunteer: boolean
}

const PARTICIPANT_OVERLAY_KEYS = {
  individual: 'ujat.basicInfo.participant.individual',
  organization: 'ujat.basicInfo.participant.organization',
  teacher: 'ujat.basicInfo.participant.teacher',
  volunteer: 'ujat.basicInfo.participant.volunteer',
} as const

function overlayBoolean(overlay: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = overlay[key]
  return typeof value === 'boolean' ? value : fallback
}

function overlayHasParticipantKey(overlay: Record<string, unknown>): boolean {
  return Object.values(PARTICIPANT_OVERLAY_KEYS).some(key => typeof overlay[key] === 'boolean')
}

function flagsFromOverlay(overlay: Record<string, unknown>): UjatParticipantTypeFlags {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  return {
    individual: overlayBoolean(overlay, PARTICIPANT_OVERLAY_KEYS.individual, defaults.participantIndividual),
    organization: overlayBoolean(
      overlay,
      PARTICIPANT_OVERLAY_KEYS.organization,
      defaults.participantOrganization
    ),
    teacher: overlayBoolean(overlay, PARTICIPANT_OVERLAY_KEYS.teacher, defaults.participantTeacher),
    volunteer: overlayBoolean(overlay, PARTICIPANT_OVERLAY_KEYS.volunteer, defaults.participantVolunteer),
  }
}

function flagsFromProgramTypes(program: Program): UjatParticipantTypeFlags | null {
  const types = new Set(program.generalParticipantTypes ?? [])
  const audience = program.generalProgramAudience
  if (types.size === 0 && audience == null) return null
  return {
    individual: types.has('individual') || audience === 'individual',
    organization: types.has('school_institution') || audience === 'organization',
    teacher: types.has('teacher_instructor'),
    volunteer: types.has('volunteer'),
  }
}

function flagsFromRecruitments(program: Program): UjatParticipantTypeFlags | null {
  const rows = program.programRecruitments ?? []
  if (rows.length === 0) return null
  const organization = rows.some(
    row => row.recruitmentType === 'PARTICIPANT' || row.targetType === 'ORGANIZATION'
  )
  const volunteer = rows.some(row => row.recruitmentType === 'VOLUNTEER')
  const teacher = rows.some(row => row.recruitmentType === 'INSTRUCTOR')
  const individual = rows.some(row => row.targetType === 'INDIVIDUAL')
  if (!organization && !volunteer && !teacher && !individual) return null
  return {
    individual,
    organization,
    teacher,
    volunteer,
  }
}

function flagsHaveSelection(flags: UjatParticipantTypeFlags): boolean {
  return flags.individual || flags.organization || flags.teacher || flags.volunteer
}

function ujatDefaultFlags(): UjatParticipantTypeFlags {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  return {
    individual: defaults.participantIndividual,
    organization: defaults.participantOrganization,
    teacher: defaults.participantTeacher,
    volunteer: defaults.participantVolunteer,
  }
}

/** 프로그램 유형 → overlay 선택값 → 모집 row → UJAT 기본(학교/기관·봉사자) */
export function resolveUjatParticipantTypeFlags(
  program: Program,
  overlayInput?: Record<string, unknown>
): UjatParticipantTypeFlags {
  const fromTypes = flagsFromProgramTypes(program)
  if (fromTypes && flagsHaveSelection(fromTypes)) return fromTypes

  const overlay = overlayInput ?? program.ujatRegistrationOverlay ?? {}
  if (overlayHasParticipantKey(overlay)) {
    const fromOverlay = flagsFromOverlay(overlay)
    if (flagsHaveSelection(fromOverlay)) return fromOverlay
  }

  const fromRecruitments = flagsFromRecruitments(program)
  if (fromRecruitments) return fromRecruitments

  return ujatDefaultFlags()
}

export function ujatParticipantTypeLabels(flags: UjatParticipantTypeFlags): string {
  const labels = TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.filter(option => {
    switch (option.value) {
      case 'individual':
        return flags.individual
      case 'school_institution':
        return flags.organization
      case 'teacher_instructor':
        return flags.teacher
      case 'volunteer':
        return flags.volunteer
      default:
        return false
    }
  }).map(option => option.label)
  return labels.length > 0 ? labels.join(', ') : '-'
}

export function ujatParticipantOverlayFromFlags(
  flags: UjatParticipantTypeFlags
): Record<string, boolean> {
  return {
    [PARTICIPANT_OVERLAY_KEYS.individual]: flags.individual,
    [PARTICIPANT_OVERLAY_KEYS.organization]: flags.organization,
    [PARTICIPANT_OVERLAY_KEYS.teacher]: flags.teacher,
    [PARTICIPANT_OVERLAY_KEYS.volunteer]: flags.volunteer,
  }
}

export function generalParticipantTypesFromUjatFlags(
  flags: UjatParticipantTypeFlags
): NonNullable<Program['generalParticipantTypes']> {
  const types: NonNullable<Program['generalParticipantTypes']> = []
  if (flags.individual) types.push('individual')
  if (flags.organization) types.push('school_institution')
  if (flags.teacher) types.push('teacher_instructor')
  if (flags.volunteer) types.push('volunteer')
  return types
}
