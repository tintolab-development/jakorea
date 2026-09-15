/**
 * 일반 프로그램 모집 양식 overlay → Program 필드 병합
 * (UJAT applyUjatRecruit*TemplateDefaults 와 동일 역할)
 */

import type { Program, TargetLevel } from '@/types/domain'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS,
  getApplicantRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  formatDateRange,
  formatInstructorTargetsLabel,
  formatTargetLevelsLabel,
  formatVolunteerTargetsLabel,
} from '@/features/program/shared/lib/program-detail-info-constants'

type RangeSeal = { start?: string | null; end?: string | null }

const TARGET_LEVEL_VALUES = new Set<string>([
  'elementary',
  'middle',
  'high',
  'university',
  'adult',
])

/** 개인·강사·봉사자 모집 overlay 키 */
export const GENERAL_RECRUIT_OVERLAY_KEYS = {
  individual: {
    recruitRangeSeal: 'recruit.individual.recruitRangeSeal',
    programRangeSeal: 'recruit.individual.programRangeSeal',
    targetLevels: 'recruit.individual.targetLevels',
    targetLevelDetail: 'recruit.individual.targetLevelDetail',
    inquiryContact: 'recruit.individual.inquiryContact',
    inquiryTel: 'recruit.individual.inquiryTel',
    inquiryEmail: 'recruit.individual.inquiryEmail',
    notes: 'recruit.individual.notes',
    notesNotApplicable: 'recruit.individual.notesNotApplicable',
  },
  instructor: {
    recruitRangeSeal: 'recruit.instructor.recruitRangeSeal',
    programRangeSeal: 'recruit.instructor.programRangeSeal',
    recruitTargets: 'recruit.instructor.recruitTargets',
    recruitTargetDetail: 'recruit.instructor.recruitTargetDetail',
    inquiryContact: 'recruit.instructor.inquiryContact',
    inquiryTel: 'recruit.instructor.inquiryTel',
    inquiryEmail: 'recruit.instructor.inquiryEmail',
    notes: 'recruit.instructor.notes',
  },
  volunteer: {
    recruitRangeSeal: 'recruit.volunteer.recruitRangeSeal',
    programRangeSeal: 'recruit.volunteer.programRangeSeal',
    volunteerTargets: 'recruit.volunteer.volunteerTargets',
    volunteerTargetDetail: 'recruit.volunteer.volunteerTargetDetail',
    inquiryContact: 'recruit.volunteer.inquiryContact',
    inquiryTel: 'recruit.volunteer.inquiryTel',
    inquiryEmail: 'recruit.volunteer.inquiryEmail',
    notes: 'recruit.volunteer.notes',
    notesNotApplicable: 'recruit.volunteer.notesNotApplicable',
  },
  detailInfo: {
    participantDescription: 'recruit.detailInfo.programDescription',
    participantGuide: 'recruit.detailInfo.recruitmentGuide',
    participantMethod: 'recruit.detailInfo.applicationMethod',
    participantLearningSupport: 'recruit.detailInfo.learningSupportContent',
    participantAdditionalHtml: 'recruit.detailInfo.additionalContentHtml',
    participantOtherNotes: 'recruit.detailInfo.otherNotes',
    instructorDescription: 'recruitInstructor.detailInfo.programDescription',
    instructorGuide: 'recruitInstructor.detailInfo.recruitmentGuide',
    instructorMethod: 'recruitInstructor.detailInfo.applicationMethod',
    instructorLearningSupport: 'recruitInstructor.detailInfo.learningSupportContent',
    instructorAdditionalHtml: 'recruitInstructor.detailInfo.additionalContentHtml',
    instructorOtherNotes: 'recruitInstructor.detailInfo.otherNotes',
    volunteerDescription: 'recruitVolunteer.detailInfo.programDescription',
    volunteerGuide: 'recruitVolunteer.detailInfo.recruitmentGuide',
    volunteerMethod: 'recruitVolunteer.detailInfo.applicationMethod',
    volunteerLearningSupport: 'recruitVolunteer.detailInfo.learningSupportContent',
    volunteerAdditionalHtml: 'recruitVolunteer.detailInfo.additionalContentHtml',
    volunteerOtherNotes: 'recruitVolunteer.detailInfo.otherNotes',
  },
} as const

function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const v = overlay[key]
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  return trimmed ? trimmed : undefined
}

function overlayStringArray(overlay: Record<string, unknown>, key: string): string[] | undefined {
  const v = overlay[key]
  if (!Array.isArray(v)) return undefined
  const out = v.map(String).map(s => s.trim()).filter(Boolean)
  return out.length > 0 ? out : undefined
}

function readRangeSeal(
  overlay: Record<string, unknown>,
  key: string
): { start: string; end: string } | undefined {
  const v = overlay[key]
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined
  const start = (v as RangeSeal).start
  const end = (v as RangeSeal).end
  if (typeof start !== 'string' || typeof end !== 'string') return undefined
  if (!start.trim() || !end.trim()) return undefined
  return { start, end }
}

function coalesceString(
  programVal: string | undefined,
  overlayVal: string | undefined,
  preferOverlay: boolean
): string | undefined {
  if (preferOverlay) {
    if (overlayVal?.trim()) return overlayVal
    const trimmed = programVal?.trim()
    return trimmed ? programVal : overlayVal
  }
  const trimmed = programVal?.trim()
  if (trimmed) return programVal
  return overlayVal
}

function coalesceIso(
  programVal: string | Date | undefined,
  overlayIso: string | undefined,
  preferOverlay: boolean
): string | Date | undefined {
  if (preferOverlay) {
    if (overlayIso?.trim()) return overlayIso
    if (programVal != null && String(programVal).trim() !== '') return programVal
    return overlayIso
  }
  if (programVal != null && String(programVal).trim() !== '') return programVal
  return overlayIso
}

function parseTargetLevels(raw: string[] | undefined): TargetLevel[] | undefined {
  if (!raw?.length) return undefined
  const levels = raw.filter((item): item is TargetLevel => TARGET_LEVEL_VALUES.has(item))
  return levels.length > 0 ? levels : undefined
}

export type ApplyGeneralRecruitOverlayOptions = {
  /**
   * true: 모집 양식 overlay 우선 (등록 create / 세션 중 미리보기)
   * false: Program 값 우선, 비었을 때만 overlay (UJAT defaults 와 동일)
   */
  preferOverlay?: boolean
}

/**
 * 기관·개인·강사·봉사자 모집 overlay를 하나의 Program 스냅샷에 병합.
 * `institutionOverlay` + `generalOverlay` 를 합친 record를 넘기거나, 각각 전달.
 */
export function applyGeneralRecruitOverlayToProgram(
  program: Program,
  overlay: Record<string, unknown>,
  options?: ApplyGeneralRecruitOverlayOptions
): Program {
  if (!overlay || Object.keys(overlay).length === 0) return program

  const preferOverlay = options?.preferOverlay === true
  const keys = GENERAL_RECRUIT_OVERLAY_KEYS
  const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS

  const participantRecruitRange =
    readRangeSeal(overlay, inst.recruitRangeSeal) ??
    readRangeSeal(overlay, keys.individual.recruitRangeSeal)
  const participantProgramRange =
    readRangeSeal(overlay, inst.programRangeSeal) ??
    readRangeSeal(overlay, keys.individual.programRangeSeal)
  const instructorRecruitRange = readRangeSeal(overlay, keys.instructor.recruitRangeSeal)
  const instructorProgramRange = readRangeSeal(overlay, keys.instructor.programRangeSeal)
  const volunteerRecruitRange = readRangeSeal(overlay, keys.volunteer.recruitRangeSeal)
  const volunteerProgramRange = readRangeSeal(overlay, keys.volunteer.programRangeSeal)

  const targetLevels =
    parseTargetLevels(overlayStringArray(overlay, inst.targetLevels)) ??
    parseTargetLevels(overlayStringArray(overlay, keys.individual.targetLevels))
  const targetLevelDetail =
    overlayString(overlay, inst.targetLevelDetail) ??
    overlayString(overlay, keys.individual.targetLevelDetail)

  const instructorTargets = overlayStringArray(overlay, keys.instructor.recruitTargets)
  const instructorTargetDetail = overlayString(overlay, keys.instructor.recruitTargetDetail)
  const volunteerTargets = overlayStringArray(overlay, keys.volunteer.volunteerTargets)
  const volunteerTargetDetail = overlayString(overlay, keys.volunteer.volunteerTargetDetail)

  const participantContact =
    overlayString(overlay, inst.inquiryContact) ??
    overlayString(overlay, keys.individual.inquiryContact)
  const participantTel =
    overlayString(overlay, inst.inquiryTel) ??
    overlayString(overlay, keys.individual.inquiryTel)
  const participantEmail =
    overlayString(overlay, inst.inquiryEmail) ??
    overlayString(overlay, keys.individual.inquiryEmail)

  const instructorContact = overlayString(overlay, keys.instructor.inquiryContact)
  const instructorTel = overlayString(overlay, keys.instructor.inquiryTel)
  const instructorEmail = overlayString(overlay, keys.instructor.inquiryEmail)

  const volunteerContact = overlayString(overlay, keys.volunteer.inquiryContact)
  const volunteerTel = overlayString(overlay, keys.volunteer.inquiryTel)
  const volunteerEmail = overlayString(overlay, keys.volunteer.inquiryEmail)

  const description = coalesceString(
    program.description,
    overlayString(overlay, keys.detailInfo.participantDescription) ??
      overlayString(overlay, keys.detailInfo.instructorDescription) ??
      overlayString(overlay, keys.detailInfo.volunteerDescription),
    preferOverlay
  )
  const recruitmentGuide = coalesceString(
    program.recruitmentGuide,
    overlayString(overlay, keys.detailInfo.participantGuide) ??
      overlayString(overlay, keys.detailInfo.instructorGuide) ??
      overlayString(overlay, keys.detailInfo.volunteerGuide),
    preferOverlay
  )
  const applicationMethod = coalesceString(
    program.applicationMethod,
    overlayString(overlay, keys.detailInfo.participantMethod) ??
      overlayString(overlay, keys.detailInfo.instructorMethod) ??
      overlayString(overlay, keys.detailInfo.volunteerMethod),
    preferOverlay
  )
  const otherNotes = coalesceString(
    program.otherNotes,
    overlayString(overlay, keys.detailInfo.participantOtherNotes) ??
      overlayString(overlay, keys.detailInfo.instructorOtherNotes) ??
      overlayString(overlay, keys.detailInfo.volunteerOtherNotes) ??
      overlayString(overlay, keys.instructor.notes) ??
      overlayString(overlay, keys.volunteer.notes) ??
      overlayString(overlay, keys.individual.notes) ??
      overlayString(overlay, inst.notes),
    preferOverlay
  )

  const participantPeriodLabel = participantRecruitRange
    ? formatDateRange(participantRecruitRange.start, participantRecruitRange.end)
    : undefined
  const instructorPeriodLabel = instructorRecruitRange
    ? formatDateRange(instructorRecruitRange.start, instructorRecruitRange.end)
    : undefined
  const volunteerPeriodLabel = volunteerRecruitRange
    ? formatDateRange(volunteerRecruitRange.start, volunteerRecruitRange.end)
    : undefined

  const operationFromParticipant = participantProgramRange
    ? formatDateRange(participantProgramRange.start, participantProgramRange.end)
    : undefined
  const operationFromInstructor = instructorProgramRange
    ? formatDateRange(instructorProgramRange.start, instructorProgramRange.end)
    : undefined
  const operationFromVolunteer = volunteerProgramRange
    ? formatDateRange(volunteerProgramRange.start, volunteerProgramRange.end)
    : undefined

  const common = program.generalCommonInfo ?? {}
  const participantInfo = { ...(common.participantRecruitmentInfo ?? {}) }
  const instructorInfo = { ...(common.instructorRecruitmentInfo ?? {}) }
  const volunteerInfo = { ...(common.volunteerRecruitmentInfo ?? {}) }

  const participantTargetLabel =
    targetLevels?.length ? formatTargetLevelsLabel(targetLevels) : undefined
  if (participantTargetLabel && participantTargetLabel !== '-') {
    const nextTarget = coalesceString(
      participantInfo.educationTarget ?? participantInfo.recruitmentTarget,
      participantTargetLabel,
      preferOverlay
    )
    if (nextTarget) {
      participantInfo.educationTarget = nextTarget
      participantInfo.recruitmentTarget = nextTarget
    }
  }
  if (targetLevelDetail) {
    const nextDetail = coalesceString(
      participantInfo.educationTargetDetail ?? participantInfo.recruitmentTargetDetail,
      targetLevelDetail,
      preferOverlay
    )
    if (nextDetail) {
      participantInfo.educationTargetDetail = nextDetail
      participantInfo.recruitmentTargetDetail = nextDetail
    }
  }
  if (participantContact) {
    participantInfo.contactOrganizationName = coalesceString(
      participantInfo.contactOrganizationName,
      participantContact,
      preferOverlay
    )
  }
  if (participantTel) {
    participantInfo.inquiryTel = coalesceString(
      participantInfo.inquiryTel ?? participantInfo.tel ?? participantInfo.contactPhone,
      participantTel,
      preferOverlay
    )
  }
  if (participantEmail) {
    participantInfo.inquiryEmail = coalesceString(
      participantInfo.inquiryEmail ?? participantInfo.email ?? participantInfo.contactEmail,
      participantEmail,
      preferOverlay
    )
  }
  if (participantPeriodLabel && participantPeriodLabel !== '-') {
    participantInfo.recruitmentPeriodLabel = coalesceString(
      participantInfo.recruitmentPeriodLabel,
      participantPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromParticipant && operationFromParticipant !== '-') {
    participantInfo.operationPeriodLabel = coalesceString(
      participantInfo.operationPeriodLabel,
      operationFromParticipant,
      preferOverlay
    )
  }
  const participantDescription = overlayString(overlay, keys.detailInfo.participantDescription)
  const participantGuide = overlayString(overlay, keys.detailInfo.participantGuide)
  const participantMethod = overlayString(overlay, keys.detailInfo.participantMethod)
  const participantRemarks =
    overlayString(overlay, keys.detailInfo.participantOtherNotes) ??
    overlayString(overlay, keys.individual.notes) ??
    overlayString(overlay, inst.notes)
  if (participantDescription) {
    participantInfo.programDescription = coalesceString(
      participantInfo.programDescription,
      participantDescription,
      preferOverlay
    )
  }
  if (participantGuide) {
    participantInfo.recruitmentGuide = coalesceString(
      participantInfo.recruitmentGuide,
      participantGuide,
      preferOverlay
    )
  }
  if (participantMethod) {
    participantInfo.applicationMethod = coalesceString(
      participantInfo.applicationMethod,
      participantMethod,
      preferOverlay
    )
  }
  const participantLearning = overlayString(overlay, keys.detailInfo.participantLearningSupport)
  const participantAdditional = overlayString(overlay, keys.detailInfo.participantAdditionalHtml)
  if (participantLearning) {
    participantInfo.learningSupportContent = coalesceString(
      participantInfo.learningSupportContent,
      participantLearning,
      preferOverlay
    )
  }
  if (participantAdditional) {
    participantInfo.additionalContentHtml = coalesceString(
      participantInfo.additionalContentHtml,
      participantAdditional,
      preferOverlay
    )
  }
  if (participantRemarks) {
    participantInfo.remarks = coalesceString(participantInfo.remarks, participantRemarks, preferOverlay)
  }

  const instructorTargetLabel =
    instructorTargets?.length ? formatInstructorTargetsLabel(instructorTargets) : undefined
  if (instructorTargetLabel && instructorTargetLabel !== '-') {
    instructorInfo.recruitmentTarget = coalesceString(
      instructorInfo.recruitmentTarget,
      instructorTargetLabel,
      preferOverlay
    )
  }
  if (instructorTargetDetail) {
    instructorInfo.recruitmentTargetDetail = coalesceString(
      instructorInfo.recruitmentTargetDetail,
      instructorTargetDetail,
      preferOverlay
    )
  }
  if (instructorContact) {
    instructorInfo.contactOrganizationName = coalesceString(
      instructorInfo.contactOrganizationName,
      instructorContact,
      preferOverlay
    )
  }
  if (instructorTel) {
    instructorInfo.inquiryTel = coalesceString(
      instructorInfo.inquiryTel ?? instructorInfo.tel ?? instructorInfo.contactPhone,
      instructorTel,
      preferOverlay
    )
  }
  if (instructorEmail) {
    instructorInfo.inquiryEmail = coalesceString(
      instructorInfo.inquiryEmail ?? instructorInfo.email ?? instructorInfo.contactEmail,
      instructorEmail,
      preferOverlay
    )
  }
  if (instructorPeriodLabel && instructorPeriodLabel !== '-') {
    instructorInfo.recruitmentPeriodLabel = coalesceString(
      instructorInfo.recruitmentPeriodLabel,
      instructorPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromInstructor && operationFromInstructor !== '-') {
    instructorInfo.operationPeriodLabel = coalesceString(
      instructorInfo.operationPeriodLabel,
      operationFromInstructor,
      preferOverlay
    )
  }
  const instructorDescription = overlayString(overlay, keys.detailInfo.instructorDescription)
  const instructorGuide = overlayString(overlay, keys.detailInfo.instructorGuide)
  const instructorMethod = overlayString(overlay, keys.detailInfo.instructorMethod)
  const instructorRemarks =
    overlayString(overlay, keys.detailInfo.instructorOtherNotes) ??
    overlayString(overlay, keys.instructor.notes)
  if (instructorDescription) {
    instructorInfo.programDescription = coalesceString(
      instructorInfo.programDescription,
      instructorDescription,
      preferOverlay
    )
  }
  if (instructorGuide) {
    instructorInfo.recruitmentGuide = coalesceString(
      instructorInfo.recruitmentGuide,
      instructorGuide,
      preferOverlay
    )
  }
  if (instructorMethod) {
    instructorInfo.applicationMethod = coalesceString(
      instructorInfo.applicationMethod,
      instructorMethod,
      preferOverlay
    )
  }
  const instructorLearning = overlayString(overlay, keys.detailInfo.instructorLearningSupport)
  const instructorAdditional = overlayString(overlay, keys.detailInfo.instructorAdditionalHtml)
  if (instructorLearning) {
    instructorInfo.learningSupportContent = coalesceString(
      instructorInfo.learningSupportContent,
      instructorLearning,
      preferOverlay
    )
  }
  if (instructorAdditional) {
    instructorInfo.additionalContentHtml = coalesceString(
      instructorInfo.additionalContentHtml,
      instructorAdditional,
      preferOverlay
    )
  }
  if (instructorRemarks) {
    instructorInfo.remarks = coalesceString(instructorInfo.remarks, instructorRemarks, preferOverlay)
  }

  const volunteerTargetLabel =
    volunteerTargets?.length ? formatVolunteerTargetsLabel(volunteerTargets) : undefined
  if (volunteerTargetLabel && volunteerTargetLabel !== '-') {
    volunteerInfo.recruitmentTarget = coalesceString(
      volunteerInfo.recruitmentTarget,
      volunteerTargetLabel,
      preferOverlay
    )
  }
  if (volunteerTargetDetail) {
    volunteerInfo.recruitmentTargetDetail = coalesceString(
      volunteerInfo.recruitmentTargetDetail,
      volunteerTargetDetail,
      preferOverlay
    )
  }
  if (volunteerContact) {
    volunteerInfo.contactOrganizationName = coalesceString(
      volunteerInfo.contactOrganizationName,
      volunteerContact,
      preferOverlay
    )
  }
  if (volunteerTel) {
    volunteerInfo.inquiryTel = coalesceString(
      volunteerInfo.inquiryTel ?? volunteerInfo.tel ?? volunteerInfo.contactPhone,
      volunteerTel,
      preferOverlay
    )
  }
  if (volunteerEmail) {
    volunteerInfo.inquiryEmail = coalesceString(
      volunteerInfo.inquiryEmail ?? volunteerInfo.email ?? volunteerInfo.contactEmail,
      volunteerEmail,
      preferOverlay
    )
  }
  if (volunteerPeriodLabel && volunteerPeriodLabel !== '-') {
    volunteerInfo.recruitmentPeriodLabel = coalesceString(
      volunteerInfo.recruitmentPeriodLabel,
      volunteerPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromVolunteer && operationFromVolunteer !== '-') {
    volunteerInfo.operationPeriodLabel = coalesceString(
      volunteerInfo.operationPeriodLabel,
      operationFromVolunteer,
      preferOverlay
    )
  }
  const volunteerDescription = overlayString(overlay, keys.detailInfo.volunteerDescription)
  const volunteerGuide = overlayString(overlay, keys.detailInfo.volunteerGuide)
  const volunteerMethod = overlayString(overlay, keys.detailInfo.volunteerMethod)
  const volunteerRemarks =
    overlayString(overlay, keys.detailInfo.volunteerOtherNotes) ??
    overlayString(overlay, keys.volunteer.notes)
  if (volunteerDescription) {
    volunteerInfo.programDescription = coalesceString(
      volunteerInfo.programDescription,
      volunteerDescription,
      preferOverlay
    )
  }
  if (volunteerGuide) {
    volunteerInfo.recruitmentGuide = coalesceString(
      volunteerInfo.recruitmentGuide,
      volunteerGuide,
      preferOverlay
    )
  }
  if (volunteerMethod) {
    volunteerInfo.applicationMethod = coalesceString(
      volunteerInfo.applicationMethod,
      volunteerMethod,
      preferOverlay
    )
  }
  const volunteerLearning = overlayString(overlay, keys.detailInfo.volunteerLearningSupport)
  const volunteerAdditional = overlayString(overlay, keys.detailInfo.volunteerAdditionalHtml)
  if (volunteerLearning) {
    volunteerInfo.learningSupportContent = coalesceString(
      volunteerInfo.learningSupportContent,
      volunteerLearning,
      preferOverlay
    )
  }
  if (volunteerAdditional) {
    volunteerInfo.additionalContentHtml = coalesceString(
      volunteerInfo.additionalContentHtml,
      volunteerAdditional,
      preferOverlay
    )
  }
  if (volunteerRemarks) {
    volunteerInfo.remarks = coalesceString(volunteerInfo.remarks, volunteerRemarks, preferOverlay)
  }

  const contactPhone = coalesceString(
    typeof program.contactPhone === 'string' ? program.contactPhone : undefined,
    participantTel ?? instructorTel ?? volunteerTel,
    preferOverlay
  )
  const contactEmail = coalesceString(
    typeof program.contactEmail === 'string' ? program.contactEmail : undefined,
    participantEmail ?? instructorEmail ?? volunteerEmail,
    preferOverlay
  )

  const nextTargetLevels =
    preferOverlay && targetLevels?.length
      ? targetLevels
      : program.targetLevels?.length
        ? program.targetLevels
        : targetLevels

  const nextInstructorTargets =
    preferOverlay && instructorTargets?.length
      ? instructorTargets
      : program.instructorTargets?.length
        ? program.instructorTargets
        : instructorTargets

  const nextVolunteerTargets =
    preferOverlay && volunteerTargets?.length
      ? volunteerTargets
      : program.volunteerTargets?.length
        ? program.volunteerTargets
        : volunteerTargets

  return {
    ...program,
    description: description ?? program.description,
    recruitmentGuide: recruitmentGuide ?? program.recruitmentGuide,
    applicationMethod: applicationMethod ?? program.applicationMethod,
    otherNotes: otherNotes ?? program.otherNotes,
    oneLineIntroduction: coalesceString(
      program.oneLineIntroduction,
      overlayString(overlay, keys.individual.notes) ?? overlayString(overlay, inst.notes),
      preferOverlay
    ),
    targetLevels: nextTargetLevels,
    targetLevel: nextTargetLevels?.[0] ?? program.targetLevel,
    district: coalesceString(program.district, targetLevelDetail, preferOverlay),
    instructorTargets: nextInstructorTargets,
    instructorTargetDetail: coalesceString(
      program.instructorTargetDetail,
      instructorTargetDetail,
      preferOverlay
    ),
    volunteerTargets: nextVolunteerTargets,
    volunteerTargetDetail: coalesceString(
      program.volunteerTargetDetail,
      volunteerTargetDetail,
      preferOverlay
    ),
    applicationStartDate: coalesceIso(
      program.applicationStartDate,
      participantRecruitRange?.start,
      preferOverlay
    ),
    applicationEndDate: coalesceIso(
      program.applicationEndDate,
      participantRecruitRange?.end,
      preferOverlay
    ),
    instructorApplicationStartDate: coalesceIso(
      program.instructorApplicationStartDate,
      instructorRecruitRange?.start,
      preferOverlay
    ),
    instructorApplicationEndDate: coalesceIso(
      program.instructorApplicationEndDate,
      instructorRecruitRange?.end,
      preferOverlay
    ),
    volunteerApplicationStartDate: coalesceIso(
      program.volunteerApplicationStartDate,
      volunteerRecruitRange?.start,
      preferOverlay
    ),
    volunteerApplicationEndDate: coalesceIso(
      program.volunteerApplicationEndDate,
      volunteerRecruitRange?.end,
      preferOverlay
    ),
    startDate:
      coalesceIso(
        program.startDate,
        participantProgramRange?.start ??
          instructorProgramRange?.start ??
          volunteerProgramRange?.start,
        preferOverlay
      ) ?? program.startDate,
    endDate:
      coalesceIso(
        program.endDate,
        participantProgramRange?.end ??
          instructorProgramRange?.end ??
          volunteerProgramRange?.end,
        preferOverlay
      ) ?? program.endDate,
    contactPhone: contactPhone ?? program.contactPhone,
    contactEmail: contactEmail ?? program.contactEmail,
    generalCommonInfo: {
      ...common,
      participantRecruitmentInfo: participantInfo,
      instructorRecruitmentInfo: instructorInfo,
      volunteerRecruitmentInfo: volunteerInfo,
    },
  }
}

/** 등록 완료·상세 표시 — 현재 in-memory 모집 overlay를 Program에 병합 */
export function resolveGeneralRecruitDisplayProgram(
  program: Program,
  options?: ApplyGeneralRecruitOverlayOptions
): Program {
  const overlay = {
    ...getApplicantRecruitInstitutionOverlayRecord(),
    ...getGeneralRecruitOverlayRecord(),
  }
  return applyGeneralRecruitOverlayToProgram(program, overlay, {
    preferOverlay: options?.preferOverlay ?? true,
  })
}

export type GeneralRecruitDetailAudience = 'participant' | 'instructor' | 'volunteer'

/**
 * 모집 정보 탭 상세정보(프로그램 설명·모집 안내 등) — *RecruitmentInfo SSOT.
 * 공통정보 Program.description 등을 끌어오지 않는다.
 */
export function resolveGeneralRecruitDetailDisplayProgram(
  program: Program,
  audience: GeneralRecruitDetailAudience
): Program {
  const common = program.generalCommonInfo
  const info =
    audience === 'participant'
      ? common?.participantRecruitmentInfo
      : audience === 'instructor'
        ? common?.instructorRecruitmentInfo
        : common?.volunteerRecruitmentInfo

  const description = info?.programDescription?.trim() || undefined
  const recruitmentGuide = info?.recruitmentGuide?.trim() || undefined
  const applicationMethod = info?.applicationMethod?.trim() || undefined
  const learningSupportContent = info?.learningSupportContent?.trim() || undefined
  const additionalContentHtml = info?.additionalContentHtml?.trim() || undefined
  const otherNotes =
    info && 'notesNotApplicable' in info && info.notesNotApplicable
      ? undefined
      : info?.remarks?.trim() || undefined

  return {
    ...program,
    description,
    recruitmentGuide,
    applicationMethod,
    learningSupportContent,
    additionalContentHtml,
    otherNotes,
    oneLineIntroduction: otherNotes,
  }
}
