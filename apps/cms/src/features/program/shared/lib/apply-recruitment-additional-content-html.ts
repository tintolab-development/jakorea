import type { Program } from '@/types/domain'

export type ProgramDetailRecruitmentAudience = 'participant' | 'instructor' | 'volunteer'

const NESTED_RECRUITMENT_INFO_KEY = {
  participant: 'participantRecruitmentInfo',
  instructor: 'instructorRecruitmentInfo',
  volunteer: 'volunteerRecruitmentInfo',
} as const

const RECRUIT_OVERLAY_ADDITIONAL_HTML_KEY = {
  participant: 'recruit.detailInfo.additionalContentHtml',
  instructor: 'recruitInstructor.detailInfo.additionalContentHtml',
  volunteer: 'recruitVolunteer.detailInfo.additionalContentHtml',
} as const

/**
 * 모집 양식 「추가 내용」 — 컬럼 + 모집 SSOT(`*RecruitmentInfo`) + overlay 키를 같이 갱신한다.
 * 조회는 nested `additionalContentHtml`을 읽으므로 컬럼만 올리면 상세가 옛 본문을 유지한다.
 */
export function applyRecruitmentAdditionalContentHtml(
  patch: Partial<Program>,
  existing: Program,
  html: string,
  audience: ProgramDetailRecruitmentAudience
): Partial<Program> {
  const nestedKey = NESTED_RECRUITMENT_INFO_KEY[audience]
  const overlayKey = RECRUIT_OVERLAY_ADDITIONAL_HTML_KEY[audience]
  const existingNested = existing.generalCommonInfo?.[nestedKey]
  const patchNested = patch.generalCommonInfo?.[nestedKey]

  return {
    ...patch,
    additionalContentHtml: html,
    generalCommonInfo: {
      ...existing.generalCommonInfo,
      ...patch.generalCommonInfo,
      [nestedKey]: {
        ...existingNested,
        ...patchNested,
        additionalContentHtml: html,
      },
    },
    registrationOverlay: {
      ...existing.registrationOverlay,
      ...patch.registrationOverlay,
      [overlayKey]: html,
    },
  }
}
