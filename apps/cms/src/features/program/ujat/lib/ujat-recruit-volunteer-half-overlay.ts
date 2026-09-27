/**
 * UJAT 봉사자 모집 — 상반기/하반기 overlay 분리
 * 공통 키는 두 반기 모두 키가 없을 때만 폴백. 저장은 반기 키만 쓰고 반대 반기는 스냅샷한다.
 */

import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  buildUjatRecruitVolunteerOverlayFromDetailEditValues,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS as KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
export type UjatVolunteerRecruitHalf = 'h1' | 'h2'

const HALF_FIELD_TO_LEGACY: Record<string, string> = {
  publicTitle: KEYS.publicTitle,
  announcementPublished: KEYS.announcementPublished,
  noticeExposure: KEYS.noticeExposure,
  programRange: KEYS.programRange,
  volunteerTargets: KEYS.volunteerTargets,
  targetDetail: KEYS.targetDetail,
  docAnnounce: KEYS.docAnnounce,
  interviewRange: KEYS.interviewRange,
  interviewMethod: KEYS.interviewMethod,
  finalAnnounce: KEYS.finalAnnounce,
  contact: KEYS.contact,
  notes: KEYS.notes,
  description: KEYS.description,
  recruitmentGuide: KEYS.recruitmentGuide,
  applicationMethod: KEYS.applicationMethod,
  otherNotes: KEYS.otherNotes,
  additionalContentHtml: KEYS.additionalContentHtml,
  attachmentFileNames: KEYS.attachmentFileNames,
}

export function ujatVolunteerHalfOverlayKey(
  half: UjatVolunteerRecruitHalf,
  field: keyof typeof HALF_FIELD_TO_LEGACY
): string {
  return `ujat.recruit.volunteer.${half}.${field}`
}

function isPresent(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function hasVolunteerHalfOverlayKeys(
  overlay: Record<string, unknown>,
  half: UjatVolunteerRecruitHalf
): boolean {
  const prefix = `ujat.recruit.volunteer.${half}.`
  return Object.entries(overlay).some(([key, value]) => key.startsWith(prefix) && isPresent(value))
}

function halfFieldKey(
  half: UjatVolunteerRecruitHalf,
  field: keyof typeof HALF_FIELD_TO_LEGACY
): string {
  return ujatVolunteerHalfOverlayKey(half, field)
}

/** 레거시 공유 키 → 해당 반기에서 아직 없는 필드만 복사 */
export function snapshotVolunteerHalfFromLegacy(
  overlay: Record<string, unknown>,
  half: UjatVolunteerRecruitHalf
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [field, legacyKey] of Object.entries(HALF_FIELD_TO_LEGACY)) {
    const halfKey = halfFieldKey(half, field as keyof typeof HALF_FIELD_TO_LEGACY)
    if (isPresent(overlay[halfKey]) || !isPresent(overlay[legacyKey])) continue
    out[halfKey] = overlay[legacyKey]
  }
  const recruitKey = half === 'h1' ? KEYS.recruitRangeH1 : KEYS.recruitRangeH2
  if (!isPresent(overlay[recruitKey]) && isPresent(overlay[KEYS.recruitRange])) {
    out[recruitKey] = overlay[KEYS.recruitRange]
  }
  return out
}

/**
 * 현재 반기 값만 레거시 키로 옮긴다. 다른 반기 키는 넣지 않는다.
 * 같은 필드의 반기 키가 있으면 그걸 쓰고, 반대 반기만 있으면 공유 키를 쓰지 않는다.
 */
export function resolveVolunteerOverlayForHalf(
  overlay: Record<string, unknown>,
  half: UjatVolunteerRecruitHalf
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}
  const other: UjatVolunteerRecruitHalf = half === 'h1' ? 'h2' : 'h1'

  for (const [field, legacyKey] of Object.entries(HALF_FIELD_TO_LEGACY)) {
    const typedField = field as keyof typeof HALF_FIELD_TO_LEGACY
    const halfKey = halfFieldKey(half, typedField)
    const otherKey = halfFieldKey(other, typedField)
    if (isPresent(overlay[halfKey])) {
      resolved[legacyKey] = overlay[halfKey]
    } else if (!isPresent(overlay[otherKey]) && isPresent(overlay[legacyKey])) {
      resolved[legacyKey] = overlay[legacyKey]
    }
  }

  const recruitHalfKey = half === 'h1' ? KEYS.recruitRangeH1 : KEYS.recruitRangeH2
  const recruitOtherKey = half === 'h1' ? KEYS.recruitRangeH2 : KEYS.recruitRangeH1
  if (isPresent(overlay[recruitHalfKey])) {
    resolved[KEYS.recruitRange] = overlay[recruitHalfKey]
    resolved[recruitHalfKey] = overlay[recruitHalfKey]
  } else if (!isPresent(overlay[recruitOtherKey]) && isPresent(overlay[KEYS.recruitRange])) {
    resolved[KEYS.recruitRange] = overlay[KEYS.recruitRange]
    resolved[recruitHalfKey] = overlay[KEYS.recruitRange]
  }

  const activityKey = half === 'h1' ? KEYS.activityTermH1 : KEYS.activityTermH2
  if (isPresent(overlay[activityKey])) {
    resolved[activityKey] = overlay[activityKey]
  }

  return resolved
}

export function buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues(
  values: ProgramDetailEditFormValues,
  half: UjatVolunteerRecruitHalf
): Record<string, unknown> {
  const shared = buildUjatRecruitVolunteerOverlayFromDetailEditValues(values)
  const prefix = `ujat.recruit.volunteer.${half}.`
  const recruitKey = half === 'h1' ? KEYS.recruitRangeH1 : KEYS.recruitRangeH2
  const activityKey = half === 'h1' ? KEYS.activityTermH1 : KEYS.activityTermH2
  return {
    [`${prefix}publicTitle`]: shared[KEYS.publicTitle],
    [`${prefix}announcementPublished`]: shared[KEYS.announcementPublished],
    ...(shared[KEYS.noticeExposure] != null
      ? { [`${prefix}noticeExposure`]: shared[KEYS.noticeExposure] }
      : {}),
    [`${prefix}programRange`]: shared[KEYS.programRange],
    [`${prefix}volunteerTargets`]: shared[KEYS.volunteerTargets],
    [`${prefix}targetDetail`]: shared[KEYS.targetDetail],
    [`${prefix}docAnnounce`]: shared[KEYS.docAnnounce],
    [`${prefix}interviewRange`]: shared[KEYS.interviewRange],
    [`${prefix}interviewMethod`]: shared[KEYS.interviewMethod],
    [`${prefix}finalAnnounce`]: shared[KEYS.finalAnnounce],
    [`${prefix}contact`]: shared[KEYS.contact],
    [`${prefix}notes`]: shared[KEYS.notes],
    [recruitKey]: half === 'h1' ? shared[KEYS.recruitRangeH1] : shared[KEYS.recruitRangeH2],
    [activityKey]: shared[activityKey],
  }
}

/** 다른 반기·공통정보 컬럼이 조회에 새지 않게 모집 스칼라를 비운다 */
export function blankUjatVolunteerRecruitProgramFields(program: Program): Program {
  return {
    ...program,
    volunteerTargets: undefined,
    volunteerTarget: undefined,
    volunteerTargetDetail: undefined,
    volunteerApplicationStartDate: undefined,
    volunteerApplicationEndDate: undefined,
    documentPassAnnouncementDate: undefined,
    documentPassAnnouncementMethod: undefined,
    interviewStartDate: undefined,
    interviewEndDate: undefined,
    interviewMethod: undefined,
    finalPassAnnouncementDate: undefined,
    finalPassAnnouncementMethod: undefined,
    contactPhone: undefined,
    contactEmail: undefined,
    otherNotes: undefined,
    startDate: '',
    endDate: '',
    description: undefined,
    recruitmentGuide: undefined,
    applicationMethod: undefined,
    additionalContentHtml: undefined,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      volunteerRecruitmentInfo: {
        ...program.generalCommonInfo?.volunteerRecruitmentInfo,
        announcementPublished: undefined,
        contactOrganizationName: undefined,
        remarks: undefined,
        recruitmentTarget: undefined,
        recruitmentTargetDetail: undefined,
      },
    },
  }
}

export function restoreUjatVolunteerRecruitProgramColumns(
  draft: Program,
  existing: Program,
  half: UjatVolunteerRecruitHalf
): Program {
  const roundIndex = half === 'h1' ? 0 : 1
  return {
    ...draft,
    volunteerTargets: existing.volunteerTargets,
    volunteerTarget: existing.volunteerTarget,
    volunteerTargetDetail: existing.volunteerTargetDetail,
    volunteerApplicationStartDate: existing.volunteerApplicationStartDate,
    volunteerApplicationEndDate: existing.volunteerApplicationEndDate,
    documentPassAnnouncementDate: existing.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: existing.documentPassAnnouncementMethod,
    interviewStartDate: existing.interviewStartDate,
    interviewEndDate: existing.interviewEndDate,
    interviewMethod: existing.interviewMethod,
    finalPassAnnouncementDate: existing.finalPassAnnouncementDate,
    finalPassAnnouncementMethod: existing.finalPassAnnouncementMethod,
    resultAnnouncementDate: existing.resultAnnouncementDate,
    resultAnnouncementMethod: existing.resultAnnouncementMethod,
    contactPhone: existing.contactPhone,
    contactEmail: existing.contactEmail,
    managerName: existing.managerName,
    otherNotes: existing.otherNotes,
    startDate: existing.startDate,
    endDate: existing.endDate,
    description: existing.description,
    recruitmentGuide: existing.recruitmentGuide,
    applicationMethod: existing.applicationMethod,
    additionalContentHtml: existing.additionalContentHtml,
    rounds: (existing.rounds ?? []).map((round, index) =>
      index === roundIndex ? (draft.rounds?.[index] ?? round) : round
    ),
    generalCommonInfo: {
      ...draft.generalCommonInfo,
      announcementTitle: existing.generalCommonInfo?.announcementTitle,
      volunteerRecruitmentInfo: existing.generalCommonInfo?.volunteerRecruitmentInfo,
    },
  }
}
