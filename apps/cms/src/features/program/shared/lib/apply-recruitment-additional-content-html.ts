import type { Program } from '@/types/domain'
import { writeRecruitmentRowCopy } from '@/features/program/shared/lib/recruitment-row-copy'

export type ProgramDetailRecruitmentAudience = 'participant' | 'instructor' | 'volunteer'

/** 모집 탭 비고 폼 필드 — 일반 참여자 remarks / 일반 강사 instructorRecruitmentRemarks / UJAT 강사 otherNotes / 봉사자·UJAT 참여자 oneLineIntroduction */
export type ProgramDetailRecruitmentNotesField =
  | 'remarks'
  | 'otherNotes'
  | 'oneLineIntroduction'
  | 'instructorRecruitmentRemarks'

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

const RECRUIT_NOTES_OVERLAY_KEYS = {
  participant: [
    'recruit.detailInfo.otherNotes',
    'recruit.individual.notes',
    'recruit.notes',
  ],
  instructor: ['recruit.instructor.notes'],
  volunteer: ['recruit.volunteer.notes'],
} as const

const RECRUIT_NOTES_NOT_APPLICABLE_OVERLAY_KEYS = {
  participant: ['recruit.individual.notesNotApplicable', 'recruit.notesNotApplicable'],
  instructor: [] as const,
  volunteer: ['recruit.volunteer.notesNotApplicable'],
} as const

export type RecruitmentDetailInfoFields = {
  description?: string
  recruitmentGuide?: string
  applicationMethod?: string
  learningSupportContent?: string
  additionalContentHtml?: string
  /** 모집 비고 — 기타 안내(`program.otherNotes` / otherMatters)와 분리 */
  remarks?: string
  notesNotApplicable?: boolean
  /**
   * 모집 행 `remarksNotApplicable`(비고 해당 없음)에 그대로 쓴다. 생략 시 행 값을 건드리지 않는다.
   * 일반 프로그램 강사 모집에서만 넘긴다 — 참여자·봉사자·타 유형 기존 저장 경로 유지.
   */
  rowRemarksNotApplicable?: boolean
  /** @deprecated 비고는 `remarks`. 호환용 별칭 */
  otherNotes?: string
  /** 이 모집 행 공고 제목. 프로그램 공고명에는 쓰지 않는다. */
  announcementTitle?: string
  /** 이 모집 행 요약 */
  summary?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  /** 강사·봉사자 행 기타사항. 참여자 행에는 쓰지 않는다. */
  otherMatters?: string
}

/**
 * 모집 양식 상세정보 — 해당 모집의 `*RecruitmentInfo`와 overlay만 갱신한다.
 * 프로그램 공통 컬럼(description·recruitmentGuide 등)에는 쓰지 않는다.
 * 공통 컬럼에 쓰면 다른 모집 탭이 같은 문구로 덮인다.
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

  const remarks = fields.remarks
  const notesNotApplicable = fields.notesNotApplicable === true
  // 비고 overlay는 remarks를 넘긴 저장만 갱신한다. 기타사항(otherMatters) 저장이 비고 overlay를 덮지 않는다.
  if (remarks !== undefined || notesNotApplicable) {
    const nextRemarks = notesNotApplicable ? undefined : remarks?.trim() || undefined
    nestedPatch.remarks = nextRemarks
    nestedPatch.notesNotApplicable = notesNotApplicable
    const overlayNotes = nextRemarks ?? ''
    for (const key of RECRUIT_NOTES_OVERLAY_KEYS[audience]) {
      overlayPatch[key] = overlayNotes
    }
    for (const key of RECRUIT_NOTES_NOT_APPLICABLE_OVERLAY_KEYS[audience]) {
      overlayPatch[key] = notesNotApplicable
    }
  }
  if (fields.otherMatters !== undefined && audience !== 'participant') {
    nestedPatch.otherMatters = fields.otherMatters.trim() || undefined
    overlayPatch[overlayKeys.otherNotes] = fields.otherMatters.trim() || ''
  }

  const {
    description: _sharedDescription,
    recruitmentGuide: _sharedGuide,
    applicationMethod: _sharedMethod,
    learningSupportContent: _sharedLearning,
    additionalContentHtml: _sharedAdditional,
    otherNotes: patchOtherNotes,
    ...audiencePatch
  } = patch

  // 운영 기간처럼 앞에서 갱신한 행 필드는 문구 복사 때 기존 행으로 되돌리지 않는다.
  const recruitmentSource =
    patch.programRecruitments != null
      ? { ...existing, programRecruitments: patch.programRecruitments }
      : existing
  const programRecruitments = writeRecruitmentRowCopy(recruitmentSource, audience, {
    ...(fields.announcementTitle !== undefined
      ? { announcementTitle: fields.announcementTitle.trim() || null }
      : {}),
    ...(fields.summary !== undefined ? { summary: fields.summary.trim() || null } : {}),
    ...(fields.contactName !== undefined
      ? { contactName: fields.contactName.trim() || null }
      : {}),
    ...(fields.contactPhone !== undefined
      ? { contactPhone: fields.contactPhone.trim() || null }
      : {}),
    ...(fields.contactEmail !== undefined
      ? { contactEmail: fields.contactEmail.trim() || null }
      : {}),
    ...(fields.description !== undefined
      ? { programDescription: fields.description.trim() || null }
      : {}),
    ...(fields.recruitmentGuide !== undefined
      ? { recruitmentGuide: fields.recruitmentGuide.trim() || null }
      : {}),
    ...(fields.applicationMethod !== undefined
      ? { applicationMethod: fields.applicationMethod.trim() || null }
      : {}),
    ...(fields.learningSupportContent !== undefined
      ? { learningSupportContent: fields.learningSupportContent.trim() || null }
      : {}),
    ...(fields.additionalContentHtml !== undefined
      ? { additionalContentHtml: fields.additionalContentHtml.trim() || null }
      : {}),
    ...(remarks !== undefined || notesNotApplicable
      ? { remarks: notesNotApplicable ? null : remarks?.trim() || null }
      : {}),
    ...(fields.rowRemarksNotApplicable !== undefined
      ? { remarksNotApplicable: fields.rowRemarksNotApplicable }
      : {}),
    ...(fields.otherMatters !== undefined && audience !== 'participant'
      ? { otherMatters: fields.otherMatters.trim() || null }
      : {}),
  })

  const generalCommonInfo = {
    ...existing.generalCommonInfo,
    ...patch.generalCommonInfo,
    [nestedKey]: nestedPatch as NonNullable<Program['generalCommonInfo']>[typeof nestedKey],
  }
  if (fields.announcementTitle !== undefined) {
    generalCommonInfo.announcementTitle = existing.generalCommonInfo?.announcementTitle
  }

  return {
    ...audiencePatch,
    ...(fields.otherMatters !== undefined && audience !== 'participant'
      ? {}
      : patchOtherNotes !== undefined
        ? { otherNotes: patchOtherNotes }
        : {}),
    generalCommonInfo,
    registrationOverlay: overlayPatch,
    ...(programRecruitments ? { programRecruitments } : {}),
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
