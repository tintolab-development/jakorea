/**
 * 프로그램 상세 모집·운영 overlay 저장 병합 — RHF PATCH 우선, catalog peek 기반.
 */
import type { Program } from '@/types/domain'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import {
  listVisibleOperationalFormSpecs,
} from '@/features/program/general/lib/operational-form-bindings'
import type { ProgramDetailRecruitmentAudience } from '@/features/program/shared/lib/apply-recruitment-additional-content-html'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  applyGeneralRecruitOverlayToProgram,
  GENERAL_RECRUIT_OVERLAY_KEYS,
} from '@/features/program/general/lib/general-recruit-overlay-to-program'
import {
  buildGeneralRecruitOverlayFromProgram,
  volunteerRecruitOverlayPatchFromDetailEditValues,
} from '@/features/program/general/lib/general-recruit-overlay-from-program'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { peekGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  applyOperationalOverlayForCatalogId,
  keyMatchesOperationalOverlayPrefixes,
  operationalOverlayKeyPrefixesForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { announcementPublishedFromFormValue } from '@/features/program/shared/lib/participant-recruitment-form-options'

const keys = GENERAL_RECRUIT_OVERLAY_KEYS
const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS

function pickOverlayKeysByPrefixes(
  record: Record<string, unknown>,
  prefixes: readonly string[]
): Record<string, unknown> {
  if (prefixes.length === 0) return {}
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (keyMatchesOperationalOverlayPrefixes(key, prefixes)) out[key] = value
  }
  return out
}

function rangeSealFromDates(
  start?: string | Date,
  end?: string | Date
): { start: string; end: string } | undefined {
  if (start == null || end == null || start === '' || end === '') return undefined
  return { start: String(start), end: String(end) }
}

function needNoneFromStudentList(
  value: ProgramDetailEditFormValues['studentListRequired']
): 'need' | 'none' | undefined {
  if (value === 'required') return 'need'
  if (value === 'not_required') return 'none'
  return undefined
}

/** 상세 모집 폼(RHF) → in-memory overlay patch (participant) */
export function participantRecruitOverlayPatchFromDetailEditValues(
  values: ProgramDetailEditFormValues
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  if (values.targetLevels != null) {
    patch[inst.targetLevels] = values.targetLevels
    patch[keys.individual.targetLevels] = values.targetLevels
  }
  if (values.district != null) {
    const detail = values.district.trim()
    patch[inst.targetLevelDetail] = detail
    patch[keys.individual.targetLevelDetail] = detail
  }
  const inquiryContact = values.recruitmentContactOrganizationName?.trim()
  if (inquiryContact != null) {
    patch[inst.inquiryContact] = inquiryContact
    patch[keys.individual.inquiryContact] = inquiryContact
  }
  if (values.contactPhone != null) {
    patch[inst.inquiryTel] = values.contactPhone
    patch[keys.individual.inquiryTel] = values.contactPhone
  }
  if (values.contactEmail != null) {
    patch[inst.inquiryEmail] = values.contactEmail
    patch[keys.individual.inquiryEmail] = values.contactEmail
  }
  const published = announcementPublishedFromFormValue(
    values.participantRecruitmentAnnouncementPublished
  )
  if (published != null) {
    patch[inst.announcementPublished] = published
    patch[keys.individual.announcementPublished] = published
  }
  const studentList = needNoneFromStudentList(values.studentListRequired)
  if (studentList) patch[inst.studentListRequired] = studentList
  const recruitRange = rangeSealFromDates(values.applicationStartDate, values.applicationEndDate)
  if (recruitRange) {
    patch[inst.recruitRangeSeal] = recruitRange
    patch[keys.individual.recruitRangeSeal] = recruitRange
  }
  const programRange = rangeSealFromDates(values.startDate, values.endDate)
  if (programRange) {
    patch[inst.programRangeSeal] = programRange
    patch[keys.individual.programRangeSeal] = programRange
  }
  return patch
}

/** 상세 모집 폼(RHF) → in-memory overlay patch (instructor) */
export function instructorRecruitOverlayPatchFromDetailEditValues(
  values: Pick<ProgramDetailEditFormValues, 'instructorTargets' | 'instructorTargetDetail'> &
    Partial<
      Pick<
        ProgramDetailEditFormValues,
        | 'instructorRecruitmentContactOrganizationName'
        | 'instructorContactPhone'
        | 'instructorContactEmail'
        | 'instructorRecruitmentAnnouncementPublished'
        | 'instructorApplicationStartDate'
        | 'instructorApplicationEndDate'
        | 'startDate'
        | 'endDate'
      >
    >
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  if (values.instructorTargets != null) {
    patch[keys.instructor.recruitTargets] = values.instructorTargets
  }
  if (values.instructorTargetDetail != null) {
    patch[keys.instructor.recruitTargetDetail] = values.instructorTargetDetail.trim()
  }
  const inquiryContact = values.instructorRecruitmentContactOrganizationName?.trim()
  if (inquiryContact != null) patch[keys.instructor.inquiryContact] = inquiryContact
  if (values.instructorContactPhone != null) {
    patch[keys.instructor.inquiryTel] = values.instructorContactPhone
  }
  if (values.instructorContactEmail != null) {
    patch[keys.instructor.inquiryEmail] = values.instructorContactEmail
  }
  const published = announcementPublishedFromFormValue(
    values.instructorRecruitmentAnnouncementPublished
  )
  if (published != null) patch[keys.instructor.announcementPublished] = published
  const recruitRange = rangeSealFromDates(
    values.instructorApplicationStartDate,
    values.instructorApplicationEndDate
  )
  if (recruitRange) patch[keys.instructor.recruitRangeSeal] = recruitRange
  const programRange = rangeSealFromDates(values.startDate, values.endDate)
  if (programRange) patch[keys.instructor.programRangeSeal] = programRange
  return patch
}

export function recruitOverlayPatchFromDetailEditValues(
  values: ProgramDetailEditFormValues,
  audience: ProgramDetailRecruitmentAudience
): Record<string, unknown> {
  if (audience === 'volunteer') return volunteerRecruitOverlayPatchFromDetailEditValues(values)
  if (audience === 'instructor') return instructorRecruitOverlayPatchFromDetailEditValues(values)
  return participantRecruitOverlayPatchFromDetailEditValues(values)
}

export function recruitCatalogTemplateCodesForAudience(
  program: Program,
  audience: ProgramDetailRecruitmentAudience
): string[] {
  const specs = listVisibleOperationalFormSpecs(program).filter(
    spec => spec.formType === 'RECRUITMENT'
  )
  if (audience === 'instructor') {
    return specs.filter(spec => spec.targetRole === 'INSTRUCTOR').map(spec => spec.templateCode)
  }
  if (audience === 'volunteer') {
    return specs.filter(spec => spec.targetRole === 'VOLUNTEER').map(spec => spec.templateCode)
  }
  const types = getGeneralParticipantTypes(program)
  const roles: string[] = []
  if (types.includes('school_institution')) roles.push('ORGANIZATION')
  if (types.includes('individual')) roles.push('INDIVIDUAL')
  return specs
    .filter(spec => spec.targetRole != null && roles.includes(spec.targetRole))
    .map(spec => spec.templateCode)
}

export function recruitCatalogTemplateCodeForAudience(
  program: Program,
  audience: ProgramDetailRecruitmentAudience
): string | undefined {
  return recruitCatalogTemplateCodesForAudience(program, audience)[0]
}

function peekRecruitOverlaySlicesForCatalogs(
  catalogTemplateCodes: readonly string[]
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const catalogId of catalogTemplateCodes) {
    const prefixes = operationalOverlayKeyPrefixesForCatalogId(catalogId)
    const peeked = peekGeneralRecruitOverlayRecord(catalogId)
    Object.assign(merged, pickOverlayKeysByPrefixes(peeked, prefixes))
  }
  return merged
}

export function buildMergedRegistrationOverlayForRecruitSave(args: {
  program: Program
  remotePatch: Partial<Program>
  values: ProgramDetailEditFormValues
  audience: ProgramDetailRecruitmentAudience
}): Record<string, unknown> {
  const catalogCodes = recruitCatalogTemplateCodesForAudience(args.program, args.audience)
  const formPatch = recruitOverlayPatchFromDetailEditValues(args.values, args.audience)
  const peeked = peekRecruitOverlaySlicesForCatalogs(catalogCodes)
  return {
    ...(args.program.registrationOverlay ?? {}),
    ...(args.remotePatch.registrationOverlay ?? {}),
    ...peeked,
    ...formPatch,
  }
}

/** 상세 모집 저장 — overlay 병합 후 폼 PATCH가 nested·컬럼 값을 이기게 한다 */
export function mergeVolunteerRecruitmentInfoAfterOverlayApply<
  T extends Record<string, unknown>,
>(fromOverlay: T | undefined, fromFormPatch: T | undefined): T | undefined {
  if (!fromOverlay && !fromFormPatch) return undefined
  return { ...(fromOverlay ?? {}), ...(fromFormPatch ?? {}) } as T
}

/** 봉사자 모집 저장 — 면접 일정 등 overlay-only 키만 nested에 반영 */
export function mergeOverlayOnlyVolunteerInterviewSchedule(
  program: Program,
  remotePatch: Partial<Program>,
  scopedOverlay: Record<string, unknown>,
  values: ProgramDetailEditFormValues
): Partial<Program> {
  if (Object.keys(scopedOverlay).length === 0) return remotePatch
  const draftWithLiveOverlay = applyGeneralRecruitOverlayToProgram(
    {
      ...program,
      ...remotePatch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...remotePatch.generalCommonInfo,
      },
      registrationOverlay: {
        ...(program.registrationOverlay ?? {}),
        ...scopedOverlay,
      },
    },
    scopedOverlay,
    { preferOverlay: true }
  )
  const scheduleFromOverlay =
    draftWithLiveOverlay.generalCommonInfo?.volunteerInterviewScheduleInfo
  const formVolunteerInfo = remotePatch.generalCommonInfo?.volunteerRecruitmentInfo
  return {
    ...remotePatch,
    generalCommonInfo: {
      ...remotePatch.generalCommonInfo,
      volunteerRecruitmentInfo: mergeVolunteerRecruitmentInfoAfterOverlayApply(
        draftWithLiveOverlay.generalCommonInfo?.volunteerRecruitmentInfo as
          | Record<string, unknown>
          | undefined,
        formVolunteerInfo as Record<string, unknown> | undefined
      ) as typeof formVolunteerInfo,
      volunteerInterviewScheduleInfo:
        values.volunteerRecruitmentInterviewEnabled === 'no'
          ? undefined
          : (scheduleFromOverlay ??
            remotePatch.generalCommonInfo?.volunteerInterviewScheduleInfo),
    },
  }
}

/** 모집 편집 진입 — program.registrationOverlay를 audience별 catalog scope에 시드 */
export function seedOperationalRecruitOverlaysFromProgram(program: Program): void {
  const registrationOverlay =
    program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
      ? (program.registrationOverlay as Record<string, unknown>)
      : {}
  const fromProgram = buildGeneralRecruitOverlayFromProgram(program)
  const mergedSource = { ...registrationOverlay, ...fromProgram }

  for (const spec of listVisibleOperationalFormSpecs(program)) {
    if (spec.formType !== 'RECRUITMENT') continue
    const prefixes = operationalOverlayKeyPrefixesForCatalogId(spec.templateCode)
    const slice = pickOverlayKeysByPrefixes(mergedSource, prefixes)
    applyOperationalOverlayForCatalogId(spec.templateCode, slice)
  }
}

/** 신청·모집 양식 편집 진입 — 단일 catalog overlay 시드 */
export function seedOperationalOverlayFromProgramCatalog(
  program: Program,
  catalogTemplateId: string
): void {
  const registrationOverlay =
    program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
      ? (program.registrationOverlay as Record<string, unknown>)
      : {}
  const prefixes = operationalOverlayKeyPrefixesForCatalogId(catalogTemplateId)
  const slice = pickOverlayKeysByPrefixes(registrationOverlay, prefixes)
  if (Object.keys(slice).length === 0) return
  applyOperationalOverlayForCatalogId(catalogTemplateId, slice)
}
