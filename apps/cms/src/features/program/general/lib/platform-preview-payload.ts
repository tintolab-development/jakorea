/**
 * 일반 프로그램(1사1교·교육받은 교사 포함) 편집값 → Portal 상세 응답 형태.
 * Platform 미리보기 번들이 실제 `/programs/:id`와 같은 매퍼로 렌더한다.
 */

import type {
  PortalCurriculum,
  PortalProgramDetail,
  PortalRecruitment,
  PortalSchedule,
} from '@jakorea/domain/portal/program-detail'
import type {
  GeneralProgramInstructorRecruitmentInfo,
  GeneralProgramParticipantRecruitmentInfo,
  GeneralProgramVolunteerRecruitmentInfo,
  Program,
} from '@/types/domain'
import {
  firstTrimmed,
  parseScheduleLabelRange,
  toPortalDateTime,
  toPortalOperationMethod,
  toPortalProgramId,
  toPortalSponsorNames,
  trimmedOrUndefined,
} from '@/features/program/shared/lib/platform-preview/portal-fields'
import { resolvePublicProgramTitle } from '@/features/program/shared/lib/public-program-title'
import {
  normalizeProgramBusinessAreaValue,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { looksLikeTrainedTeacherProgramId } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'
import type { GeneralRecruitTabKey } from '@/features/program/general/lib/recruitment-tabs'
import { resolveRecruitmentOtherMatters } from '@/features/program/shared/lib/recruitment-row-copy'
import {
  formatInstructorTargetsLabel,
  formatVolunteerTargetsLabel,
  resolveProgramInstructorTargets,
  resolveProgramVolunteerTargets,
} from '@/features/program/shared/lib/program-detail-info-constants'

export type ProgramPreviewAudience = GeneralRecruitTabKey

export type ProgramPortalPreviewInput = {
  program: Program
  sponsorName?: string
  audience: ProgramPreviewAudience
}

type RecruitmentInfo = Partial<
  GeneralProgramParticipantRecruitmentInfo &
    GeneralProgramInstructorRecruitmentInfo &
    GeneralProgramVolunteerRecruitmentInfo
>

function recruitmentInfoFor(program: Program, audience: ProgramPreviewAudience): RecruitmentInfo {
  const common = program.generalCommonInfo
  switch (audience) {
    case 'instructors':
      return common?.instructorRecruitmentInfo ?? {}
    case 'volunteers':
      return common?.volunteerRecruitmentInfo ?? {}
    default:
      return common?.participantRecruitmentInfo ?? {}
  }
}

function isIndividualAudience(program: Program): boolean {
  if (program.generalProgramAudience != null) return program.generalProgramAudience === 'individual'
  const types = program.generalParticipantTypes ?? []
  return types.includes('individual') && !types.includes('school_institution')
}

/** BE `programType` — 저장된 값 우선, 없으면 등록 경로·대분류로 판단 */
export function resolveGeneralPreviewProgramType(program: Program): string {
  const stored = trimmedOrUndefined(program.backendProgramType)?.toUpperCase()
  if (stored) return stored
  const id = String(program.id)
  if (isCompanySchoolProgram(program)) return 'COMPANY_SCHOOL'
  if (
    looksLikeTrainedTeacherProgramId(id) ||
    id.startsWith('trained-teachers-prog-') ||
    id.startsWith('trained-teachers-local-')
  ) {
    return 'TRAINED_TEACHER'
  }
  return isIndividualAudience(program) ? 'GENERAL_INDIVIDUAL' : 'GENERAL_ORGANIZATION'
}

function portalCategoriesFor(
  program: Program,
  audience: ProgramPreviewAudience
): string[] | undefined {
  if (audience === 'instructors') return ['INSTRUCTOR']
  if (audience === 'volunteers') return undefined
  return [isIndividualAudience(program) ? 'YOUTH_YOUNG' : 'ORGANIZATION']
}

function buildRecruitment(
  program: Program,
  audience: ProgramPreviewAudience,
  info: RecruitmentInfo
): PortalRecruitment {
  if (audience === 'instructors') {
    return {
      recruitmentType: 'INSTRUCTOR',
      targetType: 'TEACHER',
      startAt: toPortalDateTime(program.instructorApplicationStartDate ?? program.applicationStartDate),
      endAt: toPortalDateTime(program.instructorApplicationEndDate ?? program.applicationEndDate),
      interviewEnabled: false,
      finalPassAnnouncementAt: toPortalDateTime(program.finalPassAnnouncementDate) ?? null,
    }
  }
  if (audience === 'volunteers') {
    return {
      recruitmentType: 'VOLUNTEER',
      targetType: 'COLLEGE_STUDENT',
      startAt: toPortalDateTime(program.volunteerApplicationStartDate ?? program.applicationStartDate),
      endAt: toPortalDateTime(program.volunteerApplicationEndDate ?? program.applicationEndDate),
      interviewEnabled:
        program.generalVolunteerInterviewEnabled ??
        info.generalVolunteerInterviewEnabled ??
        info.volunteerInterviewEnabled ??
        null,
      documentPassAnnouncementAt:
        toPortalDateTime(info.documentPassAnnouncementDate ?? program.documentPassAnnouncementDate) ??
        null,
      interviewStartAt:
        toPortalDateTime(info.interviewStartDate ?? program.interviewStartDate) ?? null,
      interviewEndAt: toPortalDateTime(info.interviewEndDate ?? program.interviewEndDate) ?? null,
      finalPassAnnouncementAt:
        toPortalDateTime(info.finalPassAnnouncementDate ?? program.finalPassAnnouncementDate) ??
        null,
    }
  }
  return {
    recruitmentType: 'PARTICIPANT',
    targetType: isIndividualAudience(program) ? 'INDIVIDUAL' : 'ORGANIZATION',
    startAt: toPortalDateTime(program.applicationStartDate),
    endAt: toPortalDateTime(program.applicationEndDate),
    interviewEnabled: program.generalParticipantInterviewEnabled ?? info.interviewEnabled ?? null,
    documentPassAnnouncementAt: toPortalDateTime(program.documentPassAnnouncementDate) ?? null,
    interviewStartAt: toPortalDateTime(program.interviewStartDate) ?? null,
    interviewEndAt: toPortalDateTime(program.interviewEndDate) ?? null,
    finalPassAnnouncementAt:
      toPortalDateTime(program.resultAnnouncementDate ?? program.finalPassAnnouncementDate) ?? null,
  }
}

function buildCurricula(program: Program): PortalCurriculum[] | undefined {
  if (program.generalProgramEducationStructure === 'schedule') return undefined
  const rows = program.generalCommonInfo?.curriculumSessions ?? []
  const sessions = rows
    .filter(row => row.title?.trim() || row.description?.trim())
    .map((row, index) => ({
      sessionNo: index + 1,
      title: trimmedOrUndefined(row.title),
      content: trimmedOrUndefined(row.description),
    }))
  return sessions.length > 0 ? [{ sessions }] : undefined
}

function buildSchedules(program: Program): PortalSchedule[] | undefined {
  const common = program.generalCommonInfo
  const details = common?.scheduleDetails ?? []
  const fromDetails = details.flatMap((row, index) => {
    const range = parseScheduleLabelRange(row.scheduleDateLabel ?? row.progressTimeSummary)
    if (!range) return []
    return [{ sessionNo: index + 1, scheduleName: trimmedOrUndefined(row.name), ...range }]
  })
  if (fromDetails.length > 0) return fromDetails
  const fromLines = (common?.educationScheduleLines ?? []).flatMap((line, index) => {
    const range = parseScheduleLabelRange(line)
    return range ? [{ sessionNo: index + 1, ...range }] : []
  })
  return fromLines.length > 0 ? fromLines : undefined
}

function buildVenue(program: Program): string | undefined {
  const parts = [program.venue, program.generalCommonInfo?.venueDetail]
    .map(trimmedOrUndefined)
    .filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' ') : undefined
}

export function buildProgramPortalPreviewDetail(
  input: ProgramPortalPreviewInput & { programType: string; portalCategories?: string[] }
): PortalProgramDetail {
  const { program, sponsorName, audience, programType, portalCategories } = input
  const common = program.generalCommonInfo
  const info = recruitmentInfoFor(program, audience)
  const targetLevels = audience === 'institutions' ? resolveProgramTargetLevels(program) : []

  return {
    programId: toPortalProgramId(program.id),
    programType,
    portalCategories,
    title:
      resolvePublicProgramTitle({
        announcementTitle: common?.announcementTitle,
        overlay: program.registrationOverlay ?? program.ujatRegistrationOverlay,
        mainTitle: program.mainTitle,
        title: program.title,
      }) ||
      trimmedOrUndefined(program.title) ||
      '(프로그램명 없음)',
    titleEn: trimmedOrUndefined(program.titleEn),
    summary: firstTrimmed(info.programDescription, program.description),
    operationMethod:
      toPortalOperationMethod(common?.educationFormLabel) ?? toPortalOperationMethod(program.type),
    businessStartDate: toPortalDateTime(program.startDate),
    businessEndDate: toPortalDateTime(program.endDate),
    applicationTargetMode: isIndividualAudience(program) ? 'INDIVIDUAL' : 'ORGANIZATION',
    participationMethod: common?.participationMethod,
    businessField: normalizeProgramBusinessAreaValue(program.businessArea) || undefined,
    venue: buildVenue(program),
    contactName: firstTrimmed(info.contactOrganizationName, info.contactName, program.contactName),
    contactPhone: firstTrimmed(info.inquiryTel, info.tel, info.contactPhone, program.contactPhone),
    contactEmail: firstTrimmed(info.inquiryEmail, info.email, info.contactEmail, program.contactEmail),
    additionalContentHtml: firstTrimmed(info.additionalContentHtml, program.additionalContentHtml),
    recruitmentGuide: firstTrimmed(info.recruitmentGuide, program.recruitmentGuide),
    learningSupportContent: firstTrimmed(info.learningSupportContent, program.learningSupportContent),
    otherMatters:
      audience === 'institutions'
        ? undefined
        : resolveRecruitmentOtherMatters(
            program,
            audience === 'instructors' ? 'instructor' : 'volunteer'
          ),
    remarks: info.notesNotApplicable ? undefined : firstTrimmed(info.remarks, program.remarks),
    applicationMethod: firstTrimmed(info.applicationMethod, program.applicationMethod) ?? null,
    educationTargets: audience === 'institutions' && targetLevels.length > 0 ? targetLevels : undefined,
    educationTargetDetail:
      audience === 'institutions'
        ? firstTrimmed(info.educationTargetDetail, program.educationTargetDetail)
        : undefined,
    recruitmentTarget:
      audience === 'volunteers'
        ? firstTrimmed(
            info.recruitmentTarget,
            (() => {
              const label = formatVolunteerTargetsLabel(resolveProgramVolunteerTargets(program))
              return label === '-' ? undefined : label
            })()
          )
        : audience === 'instructors'
          ? firstTrimmed(
              info.recruitmentTarget,
              (() => {
                const label = formatInstructorTargetsLabel(resolveProgramInstructorTargets(program))
                return label === '-' ? undefined : label
              })()
            )
          : undefined,
    recruitmentTargets:
      audience === 'volunteers'
        ? resolveProgramVolunteerTargets(program)
        : audience === 'instructors'
          ? resolveProgramInstructorTargets(program)
          : undefined,
    recruitmentTargetDetail: firstTrimmed(
      info.recruitmentTargetDetail,
      audience === 'instructors' ? program.instructorTargetDetail : undefined,
      audience === 'volunteers' ? program.volunteerTargetDetail : undefined,
      audience === 'institutions' ? program.recruitmentTargetDetail : undefined
    ),
    sponsorNames: toPortalSponsorNames(sponsorName ?? common?.sponsorDisplayName),
    recruitments: [buildRecruitment(program, audience, info)],
    schedules: buildSchedules(program),
    curricula: buildCurricula(program),
  }
}

/** 일반·1사1교·교육받은 교사 모집 탭 미리보기 */
export function buildGeneralProgramPortalPreview(input: ProgramPortalPreviewInput): PortalProgramDetail {
  return buildProgramPortalPreviewDetail({
    ...input,
    programType: resolveGeneralPreviewProgramType(input.program),
    portalCategories: portalCategoriesFor(input.program, input.audience),
  })
}
