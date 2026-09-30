import type {
  AdminProgramListItemDto,
} from '@/features/program/general/api/programs-api-client'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import { ProgramCreateRequestEducationStructure } from '@/shared/api/generated/dashboard/schemas/programCreateRequestEducationStructure'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import { ProgramRecruitmentRequestRecruitmentType } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestRecruitmentType'
import { ProgramRecruitmentRequestStatus } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequestStatus'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type {
  Program,
  ProgramCategory,
  ProgramFormat,
  ProgramLifecycleStatus,
  ProgramType,
} from '@/types/domain'
import type { Status } from '@/types/index'
import { resolveUjatPrimaryProgressById } from '@/features/program/ujat/lib/is-ujat-primary-program'
import {
  mapPeriodStatusToLifecycle,
  resolveUjatProgressStatus,
} from '@/features/program/ujat/lib/normalize-ujat-progress-status'
import { parseDetailedProgramMasterId } from '@/features/program/general/lib/detailed-program-request-id'
import {
  buildProgramSponsorAssignmentsWire,
  encodeSponsorManagerContactRef,
  normalizeSponsorManagerContactIds,
} from '@/features/program/general/model/common-info-edit-schema'
import { isSponsorContactUnselected } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { patchTouchesProgramSponsors } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import type { ProgramUpdateRequestTargetLevelsItem } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestTargetLevelsItem'
import {
  stripUnselectedUjatSponsorContactsFromOverlay,
  ujatSponsorManagerContactIdsForApi,
} from '@/features/program/ujat/lib/ujat-sponsor-contact-api-payload'
import { stripRegistrationOverlayDebugKeys } from '@/features/program/shared/lib/program-create-service-detail-json'
import { mapListParticipantRecruitment } from '@/features/program/shared/lib/format-recruitment-headcount'
import { applyResolvedAnnouncementTitle } from '@/features/program/shared/lib/public-program-title'
import { resolveBusinessPeriodDates } from '@/features/program/shared/lib/program-business-period'
import { toProgramRecruitmentWindows } from '@/features/program/shared/lib/program-edit-window'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  applyProgramMissingCommonStringFieldsToUpdateRequest,
  mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo,
  resolveOtherNotesFromProgramResponse,
} from '@/features/program/shared/lib/program-update-common-string-fields'
import { reconcileUjatRegistrationOverlayFromProgramResponse } from '@/features/program/ujat/lib/ujat-registration-basic-info-overlay-sync'
import {
  parseRegistrationOverlay,
  parseServiceDetail,
  parseUjatServiceDetailExtras,
  serializeServiceDetail,
  type RegistrationPersistSnapshot,
  type RegistrationSnapshot,
  type UjatServiceDetailExtras,
} from './service-detail'

const DEFAULT_SPONSOR_ID = 'sponsor-default'

export type UjatProgramWithExtras = Program & {
  /** Primary serviceDetail extras — Semester 자식 없이 FULL_YEAR */
  ujatServiceDetailExtras?: UjatServiceDetailExtras
  /** 등록 폼 overlay — 상세 화면 SSOT. 세션 기본값으로 대체하지 않는다. */
  ujatRegistrationOverlay?: Record<string, unknown>
  periodStatus?: string
}

function now(): string {
  return new Date().toISOString()
}

function idOf(value: string | number | undefined): string {
  return value == null ? '' : String(value)
}

function overlayText(overlay: Record<string, unknown>, key: string): string | undefined {
  const value = overlay[key]
  return typeof value === 'string' ? value.trim() || undefined : undefined
}

function dateValue(value: Date | string | undefined): string | undefined {
  return value instanceof Date ? value.toISOString() : value
}

function parsedMillis(value: string | undefined): number | undefined {
  if (!value) return undefined
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : undefined
}

/**
 * 레거시 application* 는 사업 기간 안에 있을 때만 보낸다.
 * UJAT 기관·봉사 모집은 사업 시작 전이 정상 — 그때는 recruitments[]만 쓴다.
 */
function applicationDatesInsideBusiness(program: Program): {
  applicationStartDate?: string
  applicationEndDate?: string
} {
  const applicationStartDate = dateValue(program.applicationStartDate)
  const applicationEndDate = dateValue(program.applicationEndDate)
  const businessStart = parsedMillis(dateValue(program.startDate))
  const businessEnd = parsedMillis(dateValue(program.endDate))
  const applyStart = parsedMillis(applicationStartDate)
  const applyEnd = parsedMillis(applicationEndDate)
  if (!applicationStartDate || !applicationEndDate || applyStart == null || applyEnd == null) {
    return {}
  }
  if (businessStart != null && applyEnd < businessStart) return {}
  if (businessEnd != null && applyStart > businessEnd) return {}
  return { applicationStartDate, applicationEndDate }
}

function recruitmentRow(input: {
  recruitmentType: ProgramRecruitmentRequest['recruitmentType']
  targetType: string
  startAt?: string
  endAt?: string
  operationStartDate?: string
  operationEndDate?: string
  maxCount?: number
}): ProgramRecruitmentRequest {
  return {
    recruitmentType: input.recruitmentType,
    targetType: input.targetType,
    status: ProgramRecruitmentRequestStatus.ACTIVE,
    ...(input.startAt ? { startAt: input.startAt } : {}),
    ...(input.endAt ? { endAt: input.endAt } : {}),
    ...(input.operationStartDate ? { operationStartDate: input.operationStartDate } : {}),
    ...(input.operationEndDate ? { operationEndDate: input.operationEndDate } : {}),
    ...(input.maxCount != null && input.maxCount > 0 ? { maxCount: input.maxCount } : {}),
    selectionMethod: 'ADMIN_REVIEW',
  }
}

/**
 * 기관 + 봉사자 formBindings targetType과 맞출 canonical 모집 row.
 * BE `STRUCTURED_RECRUITMENTS_GENERAL_ONLY` 가 UJAT를 거절하면 서버에서 허용해야 한다.
 */
export function mapUjatProgramRecruitmentsToRequest(program: Program): ProgramRecruitmentRequest[] {
  const operationStartDate = dateValue(program.startDate)
  const operationEndDate = dateValue(program.endDate)
  const institutionStart = dateValue(program.applicationStartDate)
  const institutionEnd = dateValue(program.applicationEndDate)
  const volunteerStart = dateValue(
    program.volunteerApplicationStartDate ?? program.applicationStartDate
  )
  const volunteerEnd = dateValue(
    program.volunteerApplicationEndDate ?? program.applicationEndDate
  )
  return [
    recruitmentRow({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.PARTICIPANT,
      targetType: 'ORGANIZATION',
      startAt: institutionStart,
      endAt: institutionEnd,
      operationStartDate,
      operationEndDate,
      maxCount: program.participatingSchoolCount ?? program.approvedStudentCount,
    }),
    recruitmentRow({
      recruitmentType: ProgramRecruitmentRequestRecruitmentType.VOLUNTEER,
      targetType: 'COLLEGE_STUDENT',
      startAt: volunteerStart,
      endAt: volunteerEnd,
      operationStartDate,
      operationEndDate,
      maxCount: program.generalVolunteers ?? program.ujatFirstHalfVolunteerCount,
    }),
  ]
}

function programIps(value: string | null | undefined): Program['ips'] | undefined {
  if (value === 'Inspire' || value === 'Succeed' || value === 'Prepare') return value
  return undefined
}

/** 공통정보 후원사·담당자 → sponsors[] (1사1교와 같은 배정 계약) */
function mapUjatSponsorAssignments(program: Program) {
  const sponsorId =
    program.generalCommonInfo?.sponsorManagementIds?.[0] ??
    program.generalCommonInfo?.sponsorManagementId ??
    program.sponsorId
  if (!sponsorId || sponsorId === DEFAULT_SPONSOR_ID) return []
  const sponsorIds = [String(sponsorId).trim()].filter(Boolean)
  const contactRefs = normalizeSponsorManagerContactIds({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
  })
    .filter(id => id !== '__all__' && !isSponsorContactUnselected(id))
    .map(id =>
      id.includes('::') ? id : encodeSponsorManagerContactRef(String(sponsorId), id)
    )
  return buildProgramSponsorAssignmentsWire(sponsorIds, contactRefs)
}

/** UJAT는 상·하반기 교육 일정 구조. BE create는 educationStructure 필수. */
function resolveUjatEducationStructure(
  program: Program
): ProgramCreateRequestEducationStructure {
  if (program.generalProgramEducationStructure === 'curriculum') {
    return ProgramCreateRequestEducationStructure.CURRICULUM
  }
  return ProgramCreateRequestEducationStructure.SCHEDULE
}

function baseProgram(partial: Partial<Program> & Pick<Program, 'id' | 'title'>): Program {
  const timestamp = now()
  return {
    sponsorId: DEFAULT_SPONSOR_ID,
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: timestamp,
    endDate: timestamp,
    status: 'pending',
    lifecycleStatus: 'planned',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...partial,
  }
}

export function fromListItem(dto: AdminProgramListItemDto): Program {
  const id = idOf(dto.id ?? dto.uuid)
  const dtoExt = dto as AdminProgramListItemDto & {
    serviceDetailJson?: string
    ujatProgressStatus?: string
  }
  const fromJson = parseServiceDetail(dtoExt.serviceDetailJson)
  const registrationOverlay = parseRegistrationOverlay(dtoExt.serviceDetailJson)
  const title =
    overlayText(registrationOverlay, 'ujat.basicInfo.programManagementName') ||
    dto.title?.trim() ||
    dto.nameKo?.trim() ||
    overlayText(registrationOverlay, 'ujat.basicInfo.repKo') ||
    dto.mainTitle?.trim() ||
    '제목 없음'
  const mainTitle =
    dto.mainTitle?.trim() ||
    overlayText(registrationOverlay, 'ujat.basicInfo.repKo') ||
    title
  const ujatProgressStatus = resolveUjatProgressStatus({
    ujatProgressStatus: fromJson.ujatProgressStatus ?? dtoExt.ujatProgressStatus,
    periodStatus: dto.periodStatus,
    primaryFallback: resolveUjatPrimaryProgressById(id),
  })
  const lifecycleStatus =
    (dto.lifecycleStatus as ProgramLifecycleStatus | undefined) ??
    mapPeriodStatusToLifecycle(dto.periodStatus) ??
    'planned'

  // UJAT: target_instructor_count=0 → 강사 KPI를 "-"로 위장하지 않음 (0 유지)
  const instructorCount = dto.instructorApplicantCount ?? 0

  return baseProgram({
    id,
    title,
    mainTitle,
    titleEn: dto.titleEn?.trim() || undefined,
    ...resolveBusinessPeriodDates(dto),
    lifecycleStatus,
    ujatProgressStatus,
    approvedStudentCount: dto.approvedOrganizationApplicationCount ?? dto.applicantCount ?? 0,
    ...mapListParticipantRecruitment(dto),
    participatingSchoolCount: dto.organizationApplicationCount ?? 0,
    instructors: instructorCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    ...fromJson,
    ...(Object.keys(registrationOverlay).length > 0
      ? { ujatRegistrationOverlay: registrationOverlay }
      : {}),
  })
}

export function fromDetail(dto: ProgramResponse): UjatProgramWithExtras {
  const id = idOf(dto.id)
  const dtoExt = dto as ProgramResponse & {
    nameKo?: string
    periodStatus?: string
    remarks?: string
    businessField?: string
  }
  const rawOverlay = parseRegistrationOverlay(dto.serviceDetailJson)
  const timestamp = now()
  const details = parseServiceDetail(dto.serviceDetailJson)
  const extras = parseUjatServiceDetailExtras(dto.serviceDetailJson)
  const surveyKeys =
    details.generalSurveyMenuKeys ??
    extras.surveyMenuKeys ??
    undefined

  // BE가 숫자 id로 조회해 내려주는 detailedProgramName을 우선 반영 (다른 유형과 동일 계약).
  const generalCommonInfoBase =
    dto.detailedProgramName?.trim()
      ? { ...details.generalCommonInfo, detailedProgramName: dto.detailedProgramName.trim() }
      : details.generalCommonInfo
  const generalCommonInfo = generalCommonInfoBase
    ? {
        ...generalCommonInfoBase,
        participantRecruitmentInfo: mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo(
          generalCommonInfoBase.participantRecruitmentInfo,
          dto
        ),
      }
    : {
        participantRecruitmentInfo: mergeProgramResponseCommonStringFieldsIntoRecruitmentInfo(
          undefined,
          dto
        ),
      }

  const ips = programIps(dto.ips)
  const overlay = reconcileUjatRegistrationOverlayFromProgramResponse(dto, rawOverlay, {
    generalSurveyMenuKeys: surveyKeys,
    sponsorManagerContactIds: generalCommonInfo?.sponsorManagerContactIds,
    sponsorManagerLine: generalCommonInfo?.sponsorManagerLine,
    kpi: generalCommonInfo?.kpi,
  })
  const title =
    dto.title?.trim() ||
    dtoExt.nameKo?.trim() ||
    overlayText(overlay, 'ujat.basicInfo.programManagementName') ||
    overlayText(overlay, 'ujat.basicInfo.repKo') ||
    dto.mainTitle?.trim() ||
    '제목 없음'
  const periodStatus = dtoExt.periodStatus
  const ujatProgressStatus = resolveUjatProgressStatus({
    ujatProgressStatus: details.ujatProgressStatus,
    periodStatus,
    primaryFallback: resolveUjatPrimaryProgressById(id),
  })
  const lifecycleStatus =
    (dto.lifecycleStatus as ProgramLifecycleStatus | undefined) ??
    mapPeriodStatusToLifecycle(periodStatus) ??
    'planned'

  const mapped = applyResolvedAnnouncementTitle(
    {
    ...baseProgram({
      ...details,
      generalCommonInfo,
      id,
      sponsorId: dto.sponsorId ?? DEFAULT_SPONSOR_ID,
      title,
      mainTitle:
        dto.mainTitle?.trim() || overlayText(overlay, 'ujat.basicInfo.repKo') || title,
      type: (dto.type as ProgramType | undefined) ?? 'offline',
      format: (dto.format as ProgramFormat | undefined) ?? 'course',
      category: (dto.category as ProgramCategory | undefined) ?? 'school',
      description: dto.description,
      rounds:
        dto.rounds?.map((round, index) => ({
          id: idOf(round.id) || `${id}-round-${index + 1}`,
          programId: id,
          roundNumber: round.roundNumber ?? index + 1,
          startDate: round.startDate ?? dto.startDate ?? timestamp,
          endDate: round.endDate ?? dto.endDate ?? timestamp,
          capacity: round.capacity,
          classCount: round.classCount,
          status: (round.status as Status | undefined) ?? 'pending',
          curriculum: round.curriculum,
          deliveryType: round.deliveryType as Program['rounds'][number]['deliveryType'],
        })) ?? [],
      ...resolveBusinessPeriodDates(dto),
      applicationStartDate: dto.applicationStartDate,
      applicationEndDate: dto.applicationEndDate,
      programRecruitments: toProgramRecruitmentWindows(dto.recruitments),
      status: (dto.status as Status | undefined) ?? 'pending',
      lifecycleStatus,
      ujatProgressStatus,
      businessArea:
        normalizeProgramBusinessAreaValue(dto.businessArea || dtoExt.businessField) || undefined,
      detailedProgramId: dto.detailedProgramId != null ? String(dto.detailedProgramId) : undefined,
      titleEn: dto.titleEn,
      textbookName: dto.textbookName,
      textbookNameEn: dto.textbookNameEn,
      schoolId: dto.schoolId,
      district: dto.district,
      targetLevel: dto.targetLevel as Program['targetLevel'],
      institutionType: dto.institutionType as Program['institutionType'],
      ipOwned: dto.ipOwned,
      courseDeliveredBy: dto.courseDeliveredBy as Program['courseDeliveredBy'],
      partnerInvolvement: dto.partnerInvolvement,
      ...(ips ? { ips } : {}),
      programCategory: dto.programCategory,
      programChannel: dto.programChannel,
      educationTime: dto.educationTime,
      teamDivision: dto.teamDivision,
      educationProcess: dto.educationProcess,
      maleParticipants: dto.maleParticipants,
      femaleParticipants: dto.femaleParticipants,
      totalParticipants: dto.totalParticipants,
      generalVolunteers: dto.generalVolunteers ?? 0,
      staffVolunteers: dto.staffVolunteers ?? 0,
      returningVolunteers: dto.returningVolunteers ?? 0,
      generalTeachers: dto.generalTeachers,
      educatedTeachers: dto.educatedTeachers,
      instructors: dto.instructors ?? 0,
      managerName: dto.managerName,
      venue: dto.venue,
      curriculum: dto.curriculum,
      contactName: dto.contactName?.trim() || undefined,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      oneLineIntroduction: dto.oneLineIntroduction,
      keyVisualImage: dto.keyVisualImage,
      settlementRuleId: dto.settlementRuleId,
      applicationPathId: dto.applicationPathId,
      additionalContentHtml: dto.additionalContentHtml,
      recruitmentGuide: dto.recruitmentGuide,
      learningSupportContent: dto.learningSupportContent,
      attachmentFileNames: dto.attachmentFileNames,
      otherNotes:
        resolveOtherNotesFromProgramResponse({
          otherMatters: dto.otherMatters,
          otherNotes: details.otherNotes,
        }) || undefined,
      recruitmentTargetDetail: dto.recruitmentTargetDetail?.trim() || undefined,
      generalSurveyMenuKeys: surveyKeys as Program['generalSurveyMenuKeys'],
      generalProgramEducationStructure:
        String(dto.educationStructure ?? '').toUpperCase() === 'CURRICULUM'
          ? 'curriculum'
          : 'schedule',
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    }),
    ujatRegistrationOverlay: overlay,
  },
    {
      serviceDetailJson: dto.serviceDetailJson,
      overlay,
    }
  )
  return {
    ...mapped,
    ujatServiceDetailExtras: {
      ...extras,
      semesterType: extras.semesterType ?? 'FULL_YEAR',
    },
    ujatRegistrationOverlay: overlay,
    periodStatus,
  }
}

function looksMaskedPii(value: string | null | undefined): boolean {
  if (value == null) return false
  return value.includes('*')
}

function patchHasKey(patch: Partial<Program>, key: keyof Program): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key)
}

function resolveRequestTargetLevels(
  program: Program
): ProgramUpdateRequestTargetLevelsItem[] | undefined {
  if (program.targetLevels != null) {
    return [...program.targetLevels] as ProgramUpdateRequestTargetLevelsItem[]
  }
  if (program.targetLevel) {
    return [program.targetLevel as ProgramUpdateRequestTargetLevelsItem]
  }
  return undefined
}

function mapUjatProgramSponsorAssignments(program: Program) {
  const sponsorId = program.sponsorId != null ? String(program.sponsorId).trim() : ''
  const contactRefs = ujatSponsorManagerContactIdsForApi({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
    managerLine: program.generalCommonInfo?.sponsorManagerLine,
  })
  const normalized = normalizeSponsorManagerContactIds({
    ids: contactRefs,
    id: contactRefs[0],
  }).filter(ref => !isSponsorContactUnselected(ref))
  return buildProgramSponsorAssignmentsWire(sponsorId ? [sponsorId] : [], normalized)
}

function registrationSnapshotForApi(
  registration?: RegistrationPersistSnapshot
): RegistrationPersistSnapshot | undefined {
  if (!registration) return undefined
  // create()가 `{ ...input, overlay }`로 넘기면 idempotencyKey·preparedFormBindings가
  // registration에 섞인다. JSON.stringify가 그대로 실어 BE schema를 깨뜨린다.
  return {
    ...(registration.draft != null ? { draft: registration.draft } : {}),
    overlay: stripRegistrationOverlayDebugKeys(
      stripUnselectedUjatSponsorContactsFromOverlay(registration.overlay)
    ),
  }
}

function coreRequest(
  program: Program,
  registration?: RegistrationPersistSnapshot
): ProgramUpdateRequest {
  const targetLevels = resolveRequestTargetLevels(program)
  const sponsors = mapUjatProgramSponsorAssignments(program)
  const primarySponsorId =
    sponsors.find(s => s.sponsorContactId)?.sponsorId ||
    sponsors[0]?.sponsorId ||
    (program.sponsorId != null ? String(program.sponsorId) : undefined)
  const businessArea = normalizeProgramBusinessAreaValue(program.businessArea) || undefined
  const applicationDates = applicationDatesInsideBusiness(program)
  const body: ProgramUpdateRequest = {
    sponsorId: primarySponsorId,
    sponsors: sponsors.length > 0 ? sponsors : undefined,
    title: program.title,
    type: program.type,
    format: program.format,
    category: program.category,
    description: program.description,
    startDate: dateValue(program.startDate),
    endDate: dateValue(program.endDate),
    businessStartDate: dateValue(program.startDate),
    businessEndDate: dateValue(program.endDate),
    educationStructure: resolveUjatEducationStructure(program),
    applicationStartDate: applicationDates.applicationStartDate,
    applicationEndDate: applicationDates.applicationEndDate,
    recruitments: mapUjatProgramRecruitmentsToRequest(program),
    businessArea,
    // UJAT은 실제 카탈로그를 쓰지 않는 고정형이지만, 다른 유형과 동일하게 id·name을
    // 항상 함께 반영한다 (name은 teamDivision/generalCommonInfo.detailedProgramName에 실림).
    detailedProgramId: parseDetailedProgramMasterId(program.detailedProgramId),
    titleEn: program.titleEn,
    mainTitle: program.mainTitle ?? program.title,
    textbookName: program.textbookName,
    textbookNameEn: program.textbookNameEn,
    schoolId: program.schoolId,
    district: program.district,
    targetLevel: targetLevels?.[0] ?? program.targetLevel,
    targetLevels,
    institutionType: program.institutionType,
    ipOwned: program.ipOwned,
    courseDeliveredBy: program.courseDeliveredBy,
    partnerInvolvement: program.partnerInvolvement,
    ips: program.ips,
    programCategory: program.programCategory ?? undefined,
    programChannel: program.programChannel ?? undefined,
    educationTime: program.educationTime,
    teamDivision: program.teamDivision,
    educationProcess: program.educationProcess,
    maleParticipants: program.maleParticipants,
    femaleParticipants: program.femaleParticipants,
    totalParticipants: program.totalParticipants,
    generalVolunteers: program.generalVolunteers,
    staffVolunteers: program.staffVolunteers,
    returningVolunteers: program.returningVolunteers,
    generalTeachers: program.generalTeachers,
    educatedTeachers: program.educatedTeachers,
    instructors: program.instructors,
    managerName: program.managerName,
    venue: program.venue,
    curriculum: program.curriculum,
    contactEmail: program.contactEmail,
    contactPhone: program.contactPhone,
    oneLineIntroduction: program.oneLineIntroduction,
    keyVisualImage: program.keyVisualImage ?? program.posterImage,
    settlementRuleId: program.settlementRuleId,
    applicationPathId: program.applicationPathId,
    additionalContentHtml: program.additionalContentHtml,
    recruitmentGuide: program.recruitmentGuide,
    learningSupportContent: program.learningSupportContent,
    attachmentFileNames: program.attachmentFileNames,
    rounds: program.rounds.map(round => ({
      roundNumber: round.roundNumber,
      startDate: dateValue(round.startDate),
      endDate: dateValue(round.endDate),
      capacity: round.capacity,
      classCount: round.classCount,
      status: round.status,
      curriculum: round.curriculum,
      deliveryType: round.deliveryType,
    })),
    serviceDetailJson: serializeServiceDetail(program, registrationSnapshotForApi(registration)),
  }
  applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
    mode: 'full',
    merged: program,
    existing: program,
  })
  return body
}

/** patch 키만 직렬화 — rounds·마스킹 담당자 등 화면 밖 필드 미전송 */
function patchRequest(
  merged: Program,
  patch: Partial<Program>,
  registration: RegistrationPersistSnapshot | undefined,
  existing: Program
): ProgramUpdateRequest {
  const body: ProgramUpdateRequest = {}
  const has = (key: keyof Program) => patchHasKey(patch, key)

  if (has('sponsorId') || patchTouchesProgramSponsors(patch)) {
    const sponsors = mapUjatSponsorAssignments(merged)
    body.sponsorId =
      sponsors.find(row => row.sponsorContactId)?.sponsorId ||
      sponsors[0]?.sponsorId ||
      (merged.sponsorId != null ? String(merged.sponsorId) : undefined)
    body.sponsors = sponsors
  }
  if (has('ips')) body.ips = merged.ips
  if (has('generalProgramEducationStructure') || has('generalCommonInfo')) {
    body.educationStructure = resolveUjatEducationStructure(merged)
  }
  if (has('title')) body.title = merged.title
  if (has('type')) body.type = merged.type
  if (has('format')) body.format = merged.format
  if (has('category')) body.category = merged.category
  if (has('description')) body.description = merged.description
  if (has('startDate') || has('endDate')) {
    body.startDate = dateValue(merged.startDate)
    body.endDate = dateValue(merged.endDate)
    body.businessStartDate = dateValue(merged.startDate)
    body.businessEndDate = dateValue(merged.endDate)
  }
  if (
    has('applicationStartDate') ||
    has('applicationEndDate') ||
    has('volunteerApplicationStartDate') ||
    has('volunteerApplicationEndDate')
  ) {
    const applicationDates = applicationDatesInsideBusiness(merged)
    body.applicationStartDate = applicationDates.applicationStartDate
    body.applicationEndDate = applicationDates.applicationEndDate
    body.recruitments = mapUjatProgramRecruitmentsToRequest(merged)
  }
  if (has('businessArea')) {
    const businessArea = normalizeProgramBusinessAreaValue(merged.businessArea) || undefined
    body.businessArea = businessArea
  }
  if (has('detailedProgramId') || has('generalCommonInfo')) {
    body.detailedProgramId = parseDetailedProgramMasterId(merged.detailedProgramId)
  }
  if (has('titleEn')) body.titleEn = merged.titleEn
  if (has('mainTitle')) body.mainTitle = merged.mainTitle ?? merged.title
  if (has('textbookName')) body.textbookName = merged.textbookName
  if (has('textbookNameEn')) body.textbookNameEn = merged.textbookNameEn
  if (has('schoolId')) body.schoolId = merged.schoolId
  if (has('district')) body.district = merged.district
  if (has('targetLevel') || has('targetLevels')) {
    body.targetLevel = merged.targetLevels?.[0] ?? merged.targetLevel
  }
  if (has('institutionType')) body.institutionType = merged.institutionType
  if (has('ipOwned')) body.ipOwned = merged.ipOwned
  if (has('courseDeliveredBy')) body.courseDeliveredBy = merged.courseDeliveredBy
  if (has('partnerInvolvement')) body.partnerInvolvement = merged.partnerInvolvement
  if (has('programCategory')) body.programCategory = merged.programCategory ?? undefined
  if (has('programChannel')) body.programChannel = merged.programChannel ?? undefined
  if (has('educationTime')) body.educationTime = merged.educationTime
  if (has('teamDivision')) body.teamDivision = merged.teamDivision
  if (has('educationProcess')) body.educationProcess = merged.educationProcess
  if (has('maleParticipants')) body.maleParticipants = merged.maleParticipants
  if (has('femaleParticipants')) body.femaleParticipants = merged.femaleParticipants
  if (has('totalParticipants')) body.totalParticipants = merged.totalParticipants
  if (has('generalVolunteers')) body.generalVolunteers = merged.generalVolunteers
  if (has('staffVolunteers')) body.staffVolunteers = merged.staffVolunteers
  if (has('returningVolunteers')) body.returningVolunteers = merged.returningVolunteers
  if (has('generalTeachers')) body.generalTeachers = merged.generalTeachers
  if (has('educatedTeachers')) body.educatedTeachers = merged.educatedTeachers
  if (has('instructors')) body.instructors = merged.instructors
  if (has('managerName') && !looksMaskedPii(merged.managerName)) {
    body.managerName = merged.managerName
  }
  if (has('venue')) body.venue = merged.venue
  if (has('curriculum')) body.curriculum = merged.curriculum
  if (has('contactEmail') && !looksMaskedPii(merged.contactEmail)) {
    body.contactEmail = merged.contactEmail
  }
  if (has('contactPhone') && !looksMaskedPii(merged.contactPhone)) {
    body.contactPhone = merged.contactPhone
  }
  if (has('oneLineIntroduction')) body.oneLineIntroduction = merged.oneLineIntroduction
  if (has('keyVisualImage') || has('posterImage')) {
    body.keyVisualImage = merged.keyVisualImage ?? merged.posterImage
  }
  if (has('settlementRuleId')) body.settlementRuleId = merged.settlementRuleId
  if (has('applicationPathId')) body.applicationPathId = merged.applicationPathId
  if (has('additionalContentHtml')) body.additionalContentHtml = merged.additionalContentHtml
  if (has('recruitmentGuide')) body.recruitmentGuide = merged.recruitmentGuide
  if (has('learningSupportContent')) {
    body.learningSupportContent = merged.learningSupportContent
  }
  if (has('attachmentFileNames')) body.attachmentFileNames = merged.attachmentFileNames
  if (has('rounds')) {
    body.rounds = merged.rounds.map(round => ({
      roundNumber: round.roundNumber,
      startDate: dateValue(round.startDate),
      endDate: dateValue(round.endDate),
      capacity: round.capacity,
      classCount: round.classCount,
      status: round.status,
      curriculum: round.curriculum,
      deliveryType: round.deliveryType,
    }))
  }

  // UJAT registration overlay 보존을 위해 patch 저장 시 serviceDetailJson은 항상 포함
  body.serviceDetailJson = serializeServiceDetail(merged, registrationSnapshotForApi(registration))
  applyProgramMissingCommonStringFieldsToUpdateRequest(body, {
    mode: 'patch',
    merged,
    existing,
    patch,
  })
  return body
}

export function toCreateRequest(
  program: Program,
  registration?: RegistrationSnapshot
): ProgramCreateRequest {
  const apiRegistration = registrationSnapshotForApi(registration)
  const core = coreRequest(program, apiRegistration)
  const serviceDetailJson = core.serviceDetailJson
  const { serviceDetailJson: _serviceDetailOmit, ...coreWithoutDetail } = core
  // programType·serviceDetailJson을 앞에 — DevTools/문서 복사 시 detail 잘림·BE INVALID_VALUE 방지
  return {
    programType: 'UJAT',
    serviceDetailJson,
    ...coreWithoutDetail,
    businessStartDate: dateValue(program.startDate),
    businessEndDate: dateValue(program.endDate),
    autoApplyDefaultFormBindings: true,
  }
}

export function toUpdateRequest(
  program: Program,
  patch?: Partial<Program>,
  registration?: RegistrationPersistSnapshot
): ProgramUpdateRequest {
  if (patch && Object.keys(patch).length > 0) {
    return patchRequest({ ...program, ...patch }, patch, registration, program)
  }
  return coreRequest(program, registration)
}
