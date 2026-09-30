import type { Program } from '@/types/domain'

export type ProgramDetailRecruitmentAudience = 'participant' | 'instructor' | 'volunteer'

const NESTED_RECRUITMENT_INFO_KEY = {
  participant: 'participantRecruitmentInfo',
  instructor: 'instructorRecruitmentInfo',
  volunteer: 'volunteerRecruitmentInfo',
} as const

const RECRUIT_DETAIL_OVERLAY_KEYS = {
  participant: {
    programDescription: 'recruit.detailInfo.programDescription',
    recruitmentGuide: 'recruit.detailInfo.recruitmentGuide',
    applicationMethod: 'recruit.detailInfo.applicationMethod',
    learningSupportContent: 'recruit.detailInfo.learningSupportContent',
    additionalContentHtml: 'recruit.detailInfo.additionalContentHtml',
    otherNotes: 'recruit.detailInfo.otherNotes',
  },
  instructor: {
    programDescription: 'recruitInstructor.detailInfo.programDescription',
    recruitmentGuide: 'recruitInstructor.detailInfo.recruitmentGuide',
    applicationMethod: 'recruitInstructor.detailInfo.applicationMethod',
    learningSupportContent: 'recruitInstructor.detailInfo.learningSupportContent',
    additionalContentHtml: 'recruitInstructor.detailInfo.additionalContentHtml',
    otherNotes: 'recruitInstructor.detailInfo.otherNotes',
  },
  volunteer: {
    programDescription: 'recruitVolunteer.detailInfo.programDescription',
    recruitmentGuide: 'recruitVolunteer.detailInfo.recruitmentGuide',
    applicationMethod: 'recruitVolunteer.detailInfo.applicationMethod',
    learningSupportContent: 'recruitVolunteer.detailInfo.learningSupportContent',
    additionalContentHtml: 'recruitVolunteer.detailInfo.additionalContentHtml',
    otherNotes: 'recruitVolunteer.detailInfo.otherNotes',
  },
} as const

export type RecruitmentDetailInfoFields = {
  description?: string
  recruitmentGuide?: string
  applicationMethod?: string
  learningSupportContent?: string
  additionalContentHtml?: string
  otherNotes?: string
}

/**
 * 모집 양식 상세정보 — 컬럼 + 모집 SSOT(`*RecruitmentInfo`) + overlay를 같이 갱신한다.
 * 조회는 nested `programDescription` 등을 읽으므로 컬럼만 올리면 상세가 옛 문구를 유지한다.
 */
export function applyRecruitmentDetailInfoFields(
  patch: Partial<Program>,
  existing: Program,
  audience: ProgramDetailRecruitmentAudience,
  fields: RecruitmentDetailInfoFields
): Partial<Program> {
  const nestedKey = NESTED_RECRUITMENT_INFO_KEY[audience]
  const overlayKeys = RECRUIT_DETAIL_OVERLAY_KEYS[audience]
  const existingNested = existing.generalCommonInfo?.[nestedKey]
  const patchNested = patch.generalCommonInfo?.[nestedKey]
  const overlayPatch: Record<string, unknown> = {
    ...existing.registrationOverlay,
    ...patch.registrationOverlay,
  }

  const nestedPatch: Record<string, unknown> = {
    ...existingNested,
    ...patchNested,
  }

  if (fields.description !== undefined) {
    nestedPatch.programDescription = fields.description
    overlayPatch[overlayKeys.programDescription] = fields.description
  }
  if (fields.recruitmentGuide !== undefined) {
    nestedPatch.recruitmentGuide = fields.recruitmentGuide
    overlayPatch[overlayKeys.recruitmentGuide] = fields.recruitmentGuide
  }
  if (fields.applicationMethod !== undefined) {
    nestedPatch.applicationMethod = fields.applicationMethod
    overlayPatch[overlayKeys.applicationMethod] = fields.applicationMethod
  }
  if (fields.learningSupportContent !== undefined) {
    nestedPatch.learningSupportContent = fields.learningSupportContent
    overlayPatch[overlayKeys.learningSupportContent] = fields.learningSupportContent
  }
  if (fields.additionalContentHtml !== undefined) {
    nestedPatch.additionalContentHtml = fields.additionalContentHtml
    overlayPatch[overlayKeys.additionalContentHtml] = fields.additionalContentHtml
  }
  if (fields.otherNotes !== undefined) {
    nestedPatch.remarks = fields.otherNotes
    overlayPatch[overlayKeys.otherNotes] = fields.otherNotes
  }

  return {
    ...patch,
    ...(fields.description !== undefined ? { description: fields.description } : {}),
    ...(fields.recruitmentGuide !== undefined
      ? { recruitmentGuide: fields.recruitmentGuide }
      : {}),
    ...(fields.applicationMethod !== undefined
      ? { applicationMethod: fields.applicationMethod }
      : {}),
    ...(fields.learningSupportContent !== undefined
      ? { learningSupportContent: fields.learningSupportContent }
      : {}),
    ...(fields.additionalContentHtml !== undefined
      ? { additionalContentHtml: fields.additionalContentHtml }
      : {}),
    ...(fields.otherNotes !== undefined ? { otherNotes: fields.otherNotes } : {}),
    generalCommonInfo: {
      ...existing.generalCommonInfo,
      ...patch.generalCommonInfo,
      [nestedKey]: nestedPatch as NonNullable<Program['generalCommonInfo']>[typeof nestedKey],
    },
    registrationOverlay: overlayPatch,
  }
}

/**
 * 모집 양식 「추가 내용」 — `applyRecruitmentDetailInfoFields` HTML 전용 래퍼.
 */
export function applyRecruitmentAdditionalContentHtml(
  patch: Partial<Program>,
  existing: Program,
  html: string,
  audience: ProgramDetailRecruitmentAudience
): Partial<Program> {
  return applyRecruitmentDetailInfoFields(patch, existing, audience, {
    additionalContentHtml: html,
  })
}
