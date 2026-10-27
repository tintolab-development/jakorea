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
import { resolveAudienceProgramOperationIsoRange } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import {
  applyGeneralRecruitOverlayToProgram,
  resolveGeneralRecruitDetailDisplayProgram,
} from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { liveRecruitPreviewOverlay } from '@/features/program/shared/lib/platform-preview/poster-url'
import { resolveRecruitmentOtherMatters } from '@/features/program/shared/lib/recruitment-row-copy'
import {
  pickPreviewRecruitmentRow,
  previewCopyAudienceForTab,
  type ProgramPreviewAudience,
} from '@/features/program/shared/lib/platform-preview/preview-audience'
import {
  formatInstructorTargetsLabel,
  formatVolunteerTargetsLabel,
  resolveProgramInstructorTargets,
  resolveProgramVolunteerTargets,
} from '@/features/program/shared/lib/program-detail-info-constants'

export type { ProgramPreviewAudience }

export function previewAudienceFromGeneralRecruitTab(
  tab: GeneralRecruitTabKey,
  program: Program
): ProgramPreviewAudience {
  if (tab === 'instructors' || tab === 'volunteers') return tab
  return isGeneralIndividualProgram(program) ? 'individuals' : 'institutions'
}

/** 해당 탭 catalog overlay + 모집 행. 다른 탭 양식·프로그램 공통 문구로 채우지 않는다. */
export function resolveRecruitmentPreviewProgram(
  program: Program,
  audience: ProgramPreviewAudience
): Program {
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  const row = pickPreviewRecruitmentRow(program, audience)
  const focused =
    row?.id != null && program.activeRecruitmentId !== row.id
      ? { ...program, activeRecruitmentId: row.id }
      : program
  const live = liveRecruitPreviewOverlay(focused, audience)
  const withLive =
    Object.keys(live).length > 0
      ? applyGeneralRecruitOverlayToProgram(focused, live, { preferOverlay: true })
      : focused
  return resolveGeneralRecruitDetailDisplayProgram(withLive, previewCopyAudienceForTab(audience))
}

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

function isIndividualPreview(program: Program, audience: ProgramPreviewAudience): boolean {
  if (audience === 'individuals') return true
  if (audience === 'institutions') return false
  return isGeneralIndividualProgram(program)
}

function isParticipantPreview(audience: ProgramPreviewAudience): boolean {
  return audience === 'institutions' || audience === 'individuals'
}

function previewCopyValue(
  row: ReturnType<typeof pickPreviewRecruitmentRow>,
  key:
    | 'programDescription'
    | 'recruitmentGuide'
    | 'applicationMethod'
    | 'learningSupportContent'
    | 'additionalContentHtml'
    | 'remarks',
  nested?: string,
  programFallback?: string
): string | undefined {
  if (row && Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined) {
    const value = row[key]
    return typeof value === 'string' ? value : undefined
  }
  return firstTrimmed(nested, programFallback)
}

/** BE `programType` — 미리보기 탭이 참여자/참여기관이면 그 탭 유형. 그 외 저장된 값. */
export function resolveGeneralPreviewProgramType(
  program: Program,
  audience?: ProgramPreviewAudience
): string {
  if (audience === 'individuals') return 'GENERAL_INDIVIDUAL'
  const stored = trimmedOrUndefined(program.backendProgramType)?.toUpperCase()
  if (audience === 'institutions') {
    if (stored === 'COMPANY_SCHOOL' || stored === 'TRAINED_TEACHER' || stored === 'UJAT') {
      return stored
    }
    if (isCompanySchoolProgram(program)) return 'COMPANY_SCHOOL'
    return 'GENERAL_ORGANIZATION'
  }
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
  if (audience == null) {
    return isGeneralIndividualProgram(program) ? 'GENERAL_INDIVIDUAL' : 'GENERAL_ORGANIZATION'
  }
  return isIndividualPreview(program, audience) ? 'GENERAL_INDIVIDUAL' : 'GENERAL_ORGANIZATION'
}

function portalCategoriesFor(
  program: Program,
  audience: ProgramPreviewAudience
): string[] | undefined {
  if (audience === 'instructors') return ['INSTRUCTOR']
  if (audience === 'volunteers') return undefined
  return [isIndividualPreview(program, audience) ? 'YOUTH_YOUNG' : 'ORGANIZATION']
}

function operationDatesFor(
  program: Program,
  audience: ProgramPreviewAudience
): Pick<PortalRecruitment, 'operationStartDate' | 'operationEndDate'> {
  const recruitAudience =
    audience === 'instructors' ? 'instructor' : audience === 'volunteers' ? 'volunteer' : 'participant'
  const range = resolveAudienceProgramOperationIsoRange(program, recruitAudience)
  return {
    operationStartDate: range.start,
    operationEndDate: range.end,
  }
}

function recruitmentCopyFields(
  program: Program,
  audience: ProgramPreviewAudience,
  info: RecruitmentInfo
): Pick<
  PortalRecruitment,
  | 'programDescription'
  | 'recruitmentGuide'
  | 'applicationMethod'
  | 'learningSupportContent'
  | 'additionalContentHtml'
  | 'remarks'
  | 'thumbnailFileObjectId'
  | 'attachments'
  | 'contactName'
  | 'contactPhone'
  | 'contactEmail'
> {
  const row = pickPreviewRecruitmentRow(program, audience)
  const thumbId =
    typeof row?.thumbnailFileObjectId === 'number' && row.thumbnailFileObjectId > 0
      ? row.thumbnailFileObjectId
      : null
  const attachments = (row?.attachments ?? [])
    .map(file => ({
      originalFileName: file.originalFileName?.trim() || undefined,
      fileObjectId: file.fileObjectId,
      attachmentId: file.attachmentId,
    }))
    .filter(file => file.originalFileName)
  return {
    programDescription: previewCopyValue(
      row,
      'programDescription',
      info.programDescription,
      program.description
    ),
    recruitmentGuide: previewCopyValue(
      row,
      'recruitmentGuide',
      info.recruitmentGuide,
      program.recruitmentGuide
    ),
    applicationMethod: previewCopyValue(
      row,
      'applicationMethod',
      info.applicationMethod,
      program.applicationMethod
    ),
    learningSupportContent: previewCopyValue(
      row,
      'learningSupportContent',
      info.learningSupportContent,
      program.learningSupportContent
    ),
    additionalContentHtml: previewCopyValue(
      row,
      'additionalContentHtml',
      info.additionalContentHtml,
      program.additionalContentHtml
    ),
    remarks: info.notesNotApplicable
      ? undefined
      : previewCopyValue(row, 'remarks', info.remarks, program.remarks),
    thumbnailFileObjectId: thumbId,
    attachments: attachments.length > 0 ? attachments : undefined,
    contactName: firstTrimmed(
      row?.contactName,
      info.contactOrganizationName,
      info.contactName,
      isParticipantPreview(audience) ? program.contactName : undefined
    ),
    contactPhone: firstTrimmed(
      row?.contactPhone,
      info.inquiryTel,
      info.tel,
      info.contactPhone,
      isParticipantPreview(audience) ? program.contactPhone : undefined
    ),
    contactEmail: firstTrimmed(
      row?.contactEmail,
      info.inquiryEmail,
      info.email,
      info.contactEmail,
      isParticipantPreview(audience) ? program.contactEmail : undefined
    ),
  }
}

function buildRecruitment(
  program: Program,
  audience: ProgramPreviewAudience,
  info: RecruitmentInfo
): PortalRecruitment {
  const row = pickPreviewRecruitmentRow(program, audience)
  const operationDates = operationDatesFor(program, audience)
  const copy = recruitmentCopyFields(program, audience, info)
  const startAt = toPortalDateTime(
    row?.startAt ??
      (audience === 'instructors'
        ? (program.instructorApplicationStartDate ?? program.applicationStartDate)
        : audience === 'volunteers'
          ? (program.volunteerApplicationStartDate ?? program.applicationStartDate)
          : program.applicationStartDate)
  )
  const endAt = toPortalDateTime(
    row?.endAt ??
      (audience === 'instructors'
        ? (program.instructorApplicationEndDate ?? program.applicationEndDate)
        : audience === 'volunteers'
          ? (program.volunteerApplicationEndDate ?? program.applicationEndDate)
          : program.applicationEndDate)
  )
  if (audience === 'instructors') {
    return {
      recruitmentId: typeof row?.id === 'number' ? row.id : undefined,
      recruitmentType: 'INSTRUCTOR',
      targetType: 'TEACHER',
      applicationType: 'INSTRUCTOR',
      ...operationDates,
      startAt,
      endAt,
      interviewEnabled: false,
      finalPassAnnouncementAt: toPortalDateTime(program.finalPassAnnouncementDate) ?? null,
      ...copy,
    }
  }
  if (audience === 'volunteers') {
    return {
      recruitmentId: typeof row?.id === 'number' ? row.id : undefined,
      recruitmentType: 'VOLUNTEER',
      targetType: 'COLLEGE_STUDENT',
      applicationType: 'VOLUNTEER',
      ...operationDates,
      startAt,
      endAt,
      interviewEnabled:
        program.generalVolunteerInterviewEnabled ??
        info.generalVolunteerInterviewEnabled ??
        info.volunteerInterviewEnabled ??
        null,
      documentPassAnnouncementAt:
        toPortalDateTime(info.documentPassAnnouncementDate ?? program.documentPassAnnouncementDate) ??
        null,
      interviewStartAt:
        toPortalDateTime(row?.interviewStartAt ?? info.interviewStartDate ?? program.interviewStartDate) ??
        null,
      interviewEndAt:
        toPortalDateTime(row?.interviewEndAt ?? info.interviewEndDate ?? program.interviewEndDate) ??
        null,
      finalPassAnnouncementAt:
        toPortalDateTime(info.finalPassAnnouncementDate ?? program.finalPassAnnouncementDate) ??
        null,
      ...copy,
    }
  }
  const individual = isIndividualPreview(program, audience)
  return {
    recruitmentId: typeof row?.id === 'number' ? row.id : undefined,
    recruitmentType: 'PARTICIPANT',
    targetType: individual ? 'INDIVIDUAL' : 'ORGANIZATION',
    applicationType: individual ? 'INDIVIDUAL' : 'ORGANIZATION',
    ...operationDates,
    startAt,
    endAt,
    preEducationNoticeRequired:
      info.preEducationNoticeRequired ?? info.advanceGuidanceRequired ?? null,
    advanceGuidanceRequired:
      info.advanceGuidanceRequired ?? info.preEducationNoticeRequired ?? null,
    interviewEnabled:
      row?.interviewEnabled ??
      program.generalParticipantInterviewEnabled ??
      info.interviewEnabled ??
      null,
    documentPassAnnouncementAt: toPortalDateTime(program.documentPassAnnouncementDate) ?? null,
    interviewStartAt:
      toPortalDateTime(row?.interviewStartAt ?? program.interviewStartDate) ?? null,
    interviewEndAt: toPortalDateTime(row?.interviewEndAt ?? program.interviewEndDate) ?? null,
    finalPassAnnouncementAt:
      toPortalDateTime(program.resultAnnouncementDate ?? program.finalPassAnnouncementDate) ?? null,
    ...copy,
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
  const program = resolveRecruitmentPreviewProgram(input.program, input.audience)
  const { sponsorName, audience, programType, portalCategories } = input
  const common = program.generalCommonInfo
  const info = recruitmentInfoFor(program, audience)
  const copy = recruitmentCopyFields(program, audience, info)
  const participantRecruitment = common?.participantRecruitmentInfo
  const targetLevels = resolveProgramTargetLevels(program)
  const participantPreview = isParticipantPreview(audience)

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
    summary: copy.programDescription,
    description: copy.programDescription,
    operationMethod:
      toPortalOperationMethod(common?.educationFormLabel) ?? toPortalOperationMethod(program.type),
    businessStartDate: toPortalDateTime(program.startDate),
    businessEndDate: toPortalDateTime(program.endDate),
    applicationTargetMode: isIndividualPreview(program, audience) ? 'INDIVIDUAL' : 'ORGANIZATION',
    participationMethod: common?.participationMethod,
    businessField: normalizeProgramBusinessAreaValue(program.businessArea) || undefined,
    venue: buildVenue(program),
    contactName: copy.contactName,
    contactPhone: copy.contactPhone,
    contactEmail: copy.contactEmail,
    additionalContentHtml: copy.additionalContentHtml,
    recruitmentGuide: copy.recruitmentGuide,
    learningSupportContent: copy.learningSupportContent,
    preEducationNoticeRequired:
      info.preEducationNoticeRequired ?? info.advanceGuidanceRequired ?? null,
    advanceGuidanceRequired:
      info.advanceGuidanceRequired ?? info.preEducationNoticeRequired ?? null,
    otherMatters: participantPreview
      ? undefined
      : resolveRecruitmentOtherMatters(
          program,
          audience === 'instructors' ? 'instructor' : 'volunteer'
        ),
    remarks: copy.remarks,
    applicationMethod: copy.applicationMethod ?? null,
    thumbnailFileObjectId: copy.thumbnailFileObjectId,
    attachments: copy.attachments ?? undefined,
    educationTargets:
      participantPreview && targetLevels.length > 0 ? targetLevels : undefined,
    educationTargetDetail: participantPreview
      ? firstTrimmed(participantRecruitment?.educationTargetDetail, program.educationTargetDetail)
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
      audience === 'individuals' ? program.recruitmentTargetDetail : undefined,
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
    programType: resolveGeneralPreviewProgramType(input.program, input.audience),
    portalCategories: portalCategoriesFor(input.program, input.audience),
  })
}
