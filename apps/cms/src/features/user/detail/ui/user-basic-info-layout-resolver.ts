import type { InstructorMemberProfile } from '@/types/user'

/** URL·entrySource와 동일한 본문 분기 키 (`UserBasicInfoEntrySource`와 동일 집합) */
export type BasicInfoBodyKey = 'all_users' | 'institution' | 'instructor' | 'admin'

/** 무엇을 그릴지(섹션 타입) */
export const BasicInfoSectionTypes = {
  META: 'META',
  PROFILE: 'PROFILE',
  ALL_USERS: 'ALL_USERS',
  INSTITUTION: 'INSTITUTION',
  ADMIN: 'ADMIN',
} as const

export type BasicInfoSectionType = (typeof BasicInfoSectionTypes)[keyof typeof BasicInfoSectionTypes]

/** 어떻게 배치할지(레이아웃 타입) */
export const BasicInfoLayout = {
  SINGLE_CARD: 'SINGLE_CARD',
  SPLIT_CARD: 'SPLIT_CARD',
} as const

export type BasicInfoLayout = (typeof BasicInfoLayout)[keyof typeof BasicInfoLayout]

export type InstructorSectionVariant = 'school_teacher' | 'instructor'

export type BasicInfoLayoutResolved =
  | {
      layout: typeof BasicInfoLayout.SPLIT_CARD
      sections: readonly [typeof BasicInfoSectionTypes.META, typeof BasicInfoSectionTypes.PROFILE]
      instructorSectionVariant: InstructorSectionVariant
    }
  | {
      layout: typeof BasicInfoLayout.SINGLE_CARD
      sections: readonly [
        | typeof BasicInfoSectionTypes.ALL_USERS
        | typeof BasicInfoSectionTypes.INSTITUTION
        | typeof BasicInfoSectionTypes.ADMIN,
      ]
    }

function resolveInstructorSectionVariant(
  instructorProfile: InstructorMemberProfile | null | undefined
): InstructorSectionVariant {
  return instructorProfile === 'school_teacher' ? 'school_teacher' : 'instructor'
}

/**
 * 기본 정보 레이아웃/섹션 순서 결정기.
 * - 입력: bodyKey + instructorProfile
 * - 출력: layout + ordered sections
 * - 제약: 순수 로직 (React/JSX 없음)
 */
export function resolveBasicInfoLayout({
  bodyKey,
  instructorProfile,
}: {
  bodyKey: BasicInfoBodyKey
  instructorProfile: InstructorMemberProfile | null | undefined
}): BasicInfoLayoutResolved {
  if (bodyKey === 'instructor') {
    return {
      layout: BasicInfoLayout.SPLIT_CARD,
      sections: [BasicInfoSectionTypes.META, BasicInfoSectionTypes.PROFILE],
      instructorSectionVariant: resolveInstructorSectionVariant(instructorProfile),
    }
  }

  if (bodyKey === 'institution') {
    return {
      layout: BasicInfoLayout.SINGLE_CARD,
      sections: [BasicInfoSectionTypes.INSTITUTION],
    }
  }

  if (bodyKey === 'admin') {
    return {
      layout: BasicInfoLayout.SINGLE_CARD,
      sections: [BasicInfoSectionTypes.ADMIN],
    }
  }

  return {
    layout: BasicInfoLayout.SINGLE_CARD,
    sections: [BasicInfoSectionTypes.ALL_USERS],
  }
}
