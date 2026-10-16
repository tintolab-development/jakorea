import type { GeminiApprovedTrainingRow } from '@/features/program/gemini/model/approved/types'
import type {
  GeminiInstitutionApplicationRow,
  GeminiInstitutionApprovalStatus,
} from '@/features/program/gemini/model/recruitment/institution-application-types'
import type { GeminiRecruitmentDetail } from '@/features/program/gemini/model/recruitment/detail-types'
import type { GeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'
import {
  GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE,
  type GeminiRecruitmentEducationForm,
  type GeminiRecruitmentEducationStructure,
} from '@/features/program/gemini/lib/recruitment/add-form-options'
import type { GeminiRecruitmentInfoEditDraft } from '@/features/program/gemini/model/recruitment/info-edit-draft'
import type { GeminiRecruitmentRow } from '@/features/program/gemini/model/recruitment/types'
import type { GeminiApprovedTrainingItem } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingItem'
import type { GeminiOrganizationApplicationItem } from '@/shared/api/generated/dashboard/schemas/geminiOrganizationApplicationItem'
import type { GeminiRecruitmentDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentDetailResponse'
import type { GeminiRecruitmentItem } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentItem'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import { ProgramCreateRequestEducationStructure } from '@/shared/api/generated/dashboard/schemas/programCreateRequestEducationStructure'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
import { ProgramUpdateRequestEducationStructure } from '@/shared/api/generated/dashboard/schemas/programUpdateRequestEducationStructure'
import {
  normalizeTargetLevelValue,
  parseTargetLevelsFromDisplayLabel,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { GEMINI_VISITING_TRAINING_PROGRAM_TYPE } from './capabilities'
import { resolveGeminiPreferredLectureSchedule } from './preferred-lecture-schedule'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

function isDraftStatus(value?: string): boolean {
  const normalized = value?.trim().toUpperCase() ?? ''
  return normalized === 'DRAFT' || normalized === 'TEMPORARY' || normalized === 'TEMP'
}

function mapAnnouncementPublishedToDraftStatus(
  value: GeminiRecruitmentAddFormSnapshot['announcementPublished'] | undefined
): 'DRAFT' | 'PUBLISHED' | undefined {
  if (value === 'unpublished') return 'DRAFT'
  if (value === 'published') return 'PUBLISHED'
  return undefined
}

function optionalDate(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function trimmedOrEmpty(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function firstNonEmptyDate(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

/** BE: online|offline|hybrid|null. Gemini UI 셀렉트는 online|offline만 — hybrid·기타는 offline으로 표시(정책: UI 미지원). */
function mapEducationForm(
  value: string | null | undefined
): GeminiRecruitmentEducationForm {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'online') return 'online'
  return 'offline'
}

/** Gemini wire — UI 셀렉트 없으면 SCHEDULE 고정. CURRICULUM은 detailedProgramId 필수. */
function resolveGeminiEducationStructureWire(
  value: string | null | undefined
): typeof ProgramCreateRequestEducationStructure.SCHEDULE | typeof ProgramCreateRequestEducationStructure.CURRICULUM {
  const normalized = value?.trim().toUpperCase()
  if (normalized === ProgramCreateRequestEducationStructure.CURRICULUM) {
    return ProgramCreateRequestEducationStructure.CURRICULUM
  }
  return ProgramCreateRequestEducationStructure.SCHEDULE
}

/** GET 상세 educationStructure — null/미지이면 null 유지(SCHEDULE 하드코딩으로 PATCH 왜곡 금지). */
function resolveGeminiEducationStructureFromDetail(
  value: string | null | undefined
): GeminiRecruitmentEducationStructure | null {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'CURRICULUM') return 'CURRICULUM'
  if (normalized === 'SCHEDULE') return 'SCHEDULE'
  return null
}

/**
 * 교육 대상. 배열이 있으면(빈 배열 포함) 그 배열이 SSOT.
 * 키가 없을 때만 상세 라벨에서 파싱한다. 첫 값이 있으면 targetLevel과 맞춘다.
 */
function wireGeminiTargetLevels(
  levels: string[] | null | undefined,
  detail?: string
): {
  targetLevels: string[]
  targetLevel?: string
} {
  if (Array.isArray(levels)) {
    const unique = [
      ...new Set(
        levels
          .map(normalizeTargetLevelValue)
          .filter((level): level is NonNullable<typeof level> => level != null)
      ),
    ]
    const targetLevel = unique[0]
    return targetLevel ? { targetLevels: unique, targetLevel } : { targetLevels: unique }
  }
  const targetLevels = parseTargetLevelsFromDisplayLabel(detail)
  const targetLevel = targetLevels[0]
  return targetLevel ? { targetLevels, targetLevel } : { targetLevels }
}

function wireGeminiThumbnail(
  body: ProgramCreateRequest | ProgramUpdateRequest,
  clearFields: string[] | null,
  thumbnailFileName: string | null | undefined
): void {
  const name = thumbnailFileName?.trim()
  if (name) {
    body.keyVisualImage = name
    return
  }
  // 상세 GET은 thumbnailFileName ← keyVisualImage. 지우면 clear.
  if (clearFields) clearFields.push('keyVisualImage')
}

/** BulkIdsRequest 용 — 숫자로 파싱 가능한 id만 사용 */
export function toGeminiNumericIds(ids: string[]): number[] {
  const out: number[] = []
  for (const id of ids) {
    const n = Number(id)
    if (Number.isFinite(n) && Number.isInteger(n)) out.push(n)
  }
  return out
}

export function buildGeminiRecruitmentPersistSnapshot(
  draft: GeminiRecruitmentAddFormSnapshot | GeminiRecruitmentInfoEditDraft
): GeminiRecruitmentAddFormSnapshot {
  const defaults = {
    institutionSectionDescription: '',
    detailSectionDescription: '',
  }
  const { targetLevels } = wireGeminiTargetLevels(
    draft.educationTargetLevels,
    draft.educationTargetDetail
  )
  return {
    title: draft.title?.trim() ?? '',
    announcementPublished: draft.announcementPublished,
    educationTargetLevels: targetLevels,
    educationTargetDetail: trimmedOrEmpty(draft.educationTargetDetail),
    applicationPeriodStart: optionalDate(draft.applicationPeriodStart) ?? null,
    applicationPeriodEnd: optionalDate(draft.applicationPeriodEnd) ?? null,
    trainingRequestPeriodStart: optionalDate(draft.trainingRequestPeriodStart) ?? null,
    trainingRequestPeriodEnd: optionalDate(draft.trainingRequestPeriodEnd) ?? null,
    minStudentCount: draft.minStudentCount ?? null,
    educationForm: mapEducationForm(draft.educationForm),
    educationStructure: GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE,
    inquiryContactName: trimmedOrEmpty(draft.inquiryContactName),
    inquiryTel: trimmedOrEmpty(draft.inquiryTel),
    inquiryEmail: trimmedOrEmpty(draft.inquiryEmail),
    notesNotApplicable: draft.notesNotApplicable === true,
    notes: draft.notesNotApplicable ? '' : trimmedOrEmpty(draft.notes),
    thumbnailFileName: draft.thumbnailFileName?.trim() || null,
    programDescription: draft.programDescription ?? '',
    recruitmentGuide: draft.recruitmentGuide ?? '',
    applicationMethod: draft.applicationMethod ?? '',
    learningSupportContent: draft.learningSupportContent ?? '',
    additionalContentMarkdown: draft.additionalContentMarkdown ?? '',
    attachmentFileNames: [...(draft.attachmentFileNames ?? [])],
    institutionSectionDescription:
      'institutionSectionDescription' in draft
        ? (draft.institutionSectionDescription ?? '')
        : defaults.institutionSectionDescription,
    detailSectionDescription:
      'detailSectionDescription' in draft
        ? (draft.detailSectionDescription ?? '')
        : defaults.detailSectionDescription,
  }
}

export function mapGeminiRecruitmentSnapshotToCreateRequest(
  snapshot: GeminiRecruitmentAddFormSnapshot
): ProgramCreateRequest {
  const persist = buildGeminiRecruitmentPersistSnapshot(snapshot)
  const contactName = persist.inquiryContactName.trim() || undefined
  const otherMatters =
    persist.notesNotApplicable ? undefined : persist.notes.trim() || undefined
  const recruitmentTargetDetail = persist.educationTargetDetail.trim() || undefined
  const applicationMethod = persist.applicationMethod.trim() || undefined
  // Gemini create: educationStructure는 ProgramCreateRequest top-level 비즈니스 필수.
  // UI 셀렉트 없음 → SCHEDULE. serviceDetailJson 안 값으로 top-level을 대체하지 않음.
  const educationStructure = resolveGeminiEducationStructureWire(
    persist.educationStructure
  )
  const { targetLevels, targetLevel } = wireGeminiTargetLevels(
    persist.educationTargetLevels,
    recruitmentTargetDetail
  )
  const requestBody: ProgramCreateRequest = {
    programType: GEMINI_VISITING_TRAINING_PROGRAM_TYPE,
    title: persist.title.trim() || undefined,
    description: persist.programDescription || undefined,
    businessStartDate: optionalDate(persist.applicationPeriodStart),
    businessEndDate: optionalDate(persist.applicationPeriodEnd),
    applicationStartDate: optionalDate(persist.applicationPeriodStart),
    applicationEndDate: optionalDate(persist.applicationPeriodEnd),
    trainingRequestStartDate: optionalDate(persist.trainingRequestPeriodStart),
    trainingRequestEndDate: optionalDate(persist.trainingRequestPeriodEnd),
    educationStructure,
    educationForm: persist.educationForm,
    targetLevels,
    ...(targetLevel ? { targetLevel } : {}),
    totalParticipants: persist.minStudentCount ?? undefined,
    managerName: contactName,
    contactName,
    contactPhone: persist.inquiryTel || undefined,
    contactEmail: persist.inquiryEmail || undefined,
    otherMatters,
    recruitmentTargetDetail,
    recruitmentGuide: persist.recruitmentGuide || undefined,
    applicationMethod,
    learningSupportContent: persist.learningSupportContent || undefined,
    additionalContentHtml: persist.additionalContentMarkdown || undefined,
    draftStatus: mapAnnouncementPublishedToDraftStatus(persist.announcementPublished),
    attachmentFileNames: persist.attachmentFileNames,
    serviceDetailJson: JSON.stringify({ geminiRecruitment: persist }),
  }
  wireGeminiThumbnail(requestBody, null, persist.thumbnailFileName)
  return requestBody
}

function wireGeminiClearableString(
  body: ProgramUpdateRequest,
  clearFields: string[],
  apiField:
    | 'contactName'
    | 'otherMatters'
    | 'recruitmentTargetDetail'
    | 'applicationMethod'
    | 'contactPhone'
    | 'contactEmail'
    | 'recruitmentGuide'
    | 'learningSupportContent'
    | 'additionalContentHtml'
    | 'description'
    | 'managerName',
  next: string | undefined
): void {
  if (next) {
    body[apiField] = next
    return
  }
  clearFields.push(apiField)
}

function wireGeminiOptionalDate(
  body: ProgramUpdateRequest,
  clearFields: string[],
  apiField: 'trainingRequestStartDate' | 'trainingRequestEndDate',
  next: string | undefined
): void {
  if (next) {
    body[apiField] = next
    return
  }
  clearFields.push(apiField)
}

export function mapGeminiRecruitmentDetailToUpdateRequest(
  draft: GeminiRecruitmentInfoEditDraft
): ProgramUpdateRequest {
  const persist = buildGeminiRecruitmentPersistSnapshot(draft)
  const contactName = persist.inquiryContactName.trim() || undefined
  const otherMatters =
    persist.notesNotApplicable ? undefined : persist.notes.trim() || undefined
  const recruitmentTargetDetail = persist.educationTargetDetail.trim() || undefined
  const applicationMethod = persist.applicationMethod.trim() || undefined
  const programDescription = persist.programDescription.trim() || undefined
  const recruitmentGuide = persist.recruitmentGuide.trim() || undefined
  const learningSupportContent = persist.learningSupportContent.trim() || undefined
  const additionalContentHtml = persist.additionalContentMarkdown.trim() || undefined
  const inquiryTel = persist.inquiryTel.trim() || undefined
  const inquiryEmail = persist.inquiryEmail.trim() || undefined
  const clearFields: string[] = []
  // GET educationStructure가 null이면 PATCH에 포함하지 않음(SCHEDULE로 채우면 왜곡).
  // SCHEDULE|CURRICULUM이 있으면 그 값을 왕복. clearFields에도 넣지 않음.
  const educationStructureFromDraft = resolveGeminiEducationStructureFromDetail(
    draft.educationStructure
  )
  const educationStructure =
    educationStructureFromDraft === 'CURRICULUM'
      ? ProgramUpdateRequestEducationStructure.CURRICULUM
      : educationStructureFromDraft === 'SCHEDULE'
        ? ProgramUpdateRequestEducationStructure.SCHEDULE
        : undefined
  const { targetLevels, targetLevel } = wireGeminiTargetLevels(
    persist.educationTargetLevels,
    recruitmentTargetDetail
  )
  const body: ProgramUpdateRequest = {
    title: persist.title.trim() || undefined,
    businessStartDate: optionalDate(persist.applicationPeriodStart),
    businessEndDate: optionalDate(persist.applicationPeriodEnd),
    applicationStartDate: optionalDate(persist.applicationPeriodStart),
    applicationEndDate: optionalDate(persist.applicationPeriodEnd),
    ...(educationStructure != null ? { educationStructure } : {}),
    educationForm: persist.educationForm,
    targetLevels: targetLevels as ProgramUpdateRequest['targetLevels'],
    ...(targetLevel ? { targetLevel } : {}),
    totalParticipants: persist.minStudentCount ?? undefined,
    draftStatus: mapAnnouncementPublishedToDraftStatus(persist.announcementPublished),
    attachmentFileNames: persist.attachmentFileNames,
    serviceDetailJson: JSON.stringify({ geminiRecruitment: persist }),
  }
  wireGeminiThumbnail(body, clearFields, persist.thumbnailFileName)
  wireGeminiClearableString(body, clearFields, 'description', programDescription)
  wireGeminiClearableString(body, clearFields, 'contactName', contactName)
  wireGeminiClearableString(body, clearFields, 'managerName', contactName)
  wireGeminiClearableString(body, clearFields, 'otherMatters', otherMatters)
  wireGeminiClearableString(body, clearFields, 'recruitmentTargetDetail', recruitmentTargetDetail)
  wireGeminiClearableString(body, clearFields, 'applicationMethod', applicationMethod)
  wireGeminiClearableString(body, clearFields, 'contactPhone', inquiryTel)
  wireGeminiClearableString(body, clearFields, 'contactEmail', inquiryEmail)
  wireGeminiClearableString(body, clearFields, 'recruitmentGuide', recruitmentGuide)
  wireGeminiClearableString(body, clearFields, 'learningSupportContent', learningSupportContent)
  wireGeminiClearableString(body, clearFields, 'additionalContentHtml', additionalContentHtml)
  wireGeminiOptionalDate(
    body,
    clearFields,
    'trainingRequestStartDate',
    optionalDate(persist.trainingRequestPeriodStart)
  )
  wireGeminiOptionalDate(
    body,
    clearFields,
    'trainingRequestEndDate',
    optionalDate(persist.trainingRequestPeriodEnd)
  )
  if (!targetLevel) clearFields.push('targetLevel')
  if (clearFields.length > 0) body.clearFields = clearFields
  return body
}

export function mapGeminiRecruitmentItemToRow(
  dto: GeminiRecruitmentItem,
  index: number
): GeminiRecruitmentRow {
  const applicationPeriodStart = firstNonEmptyDate(
    dto.applicationStartDate,
    dto.businessStartDate
  )
  const applicationPeriodEnd = firstNonEmptyDate(
    dto.applicationEndDate,
    dto.businessEndDate
  )
  // 연수 요청 기간은 기관 모집/business와 합치지 않는다.
  const trainingRequestPeriodStart = trimmedOrEmpty(dto.trainingRequestStartDate)
  const trainingRequestPeriodEnd = trimmedOrEmpty(dto.trainingRequestEndDate)
  return {
    id: toId(dto.programId),
    displayNo: index + 1,
    title: dto.nameKo?.trim() || '제목 없음',
    applicationPeriodStart,
    applicationPeriodEnd,
    trainingRequestPeriodStart,
    trainingRequestPeriodEnd,
    isDraft: isDraftStatus(dto.draftStatus ?? undefined),
    organizationApplicationCount: dto.organizationApplicationCount ?? 0,
    approvedOrganizationApplicationCount: dto.approvedOrganizationApplicationCount ?? 0,
  }
}

export function mapGeminiRecruitmentDetailToDetail(
  dto: GeminiRecruitmentDetailResponse,
  base?: GeminiRecruitmentRow
): GeminiRecruitmentDetail {
  const row =
    base ??
    mapGeminiRecruitmentItemToRow(
      {
        programId: dto.programId ?? 0,
        programType: dto.programType ?? GEMINI_VISITING_TRAINING_PROGRAM_TYPE,
        nameKo: dto.nameKo ?? '',
        businessStartDate: dto.businessStartDate ?? undefined,
        businessEndDate: dto.businessEndDate ?? undefined,
        applicationStartDate: dto.applicationStartDate ?? undefined,
        applicationEndDate: dto.applicationEndDate ?? undefined,
        trainingRequestStartDate: dto.trainingRequestStartDate ?? undefined,
        trainingRequestEndDate: dto.trainingRequestEndDate ?? undefined,
        draftStatus: dto.draftStatus,
        organizationApplicationCount: dto.organizationApplicationCount ?? undefined,
        approvedOrganizationApplicationCount: dto.approvedOrganizationApplicationCount ?? undefined,
      },
      0
    )
  const applicationPeriodStart = firstNonEmptyDate(
    dto.applicationStartDate,
    dto.businessStartDate,
    row.applicationPeriodStart
  )
  const applicationPeriodEnd = firstNonEmptyDate(
    dto.applicationEndDate,
    dto.businessEndDate,
    row.applicationPeriodEnd
  )
  // 연수 요청 기간은 기관 모집/business와 합치지 않는다 (BE handoff).
  const trainingRequestPeriodStart = trimmedOrEmpty(dto.trainingRequestStartDate)
  const trainingRequestPeriodEnd = trimmedOrEmpty(dto.trainingRequestEndDate)
  const otherMatters = dto.otherMatters?.trim() || null
  const notesNotApplicable = otherMatters == null
  const now = new Date().toISOString()
  return {
    ...row,
    title: dto.nameKo?.trim() || row.title,
    applicationPeriodStart,
    applicationPeriodEnd,
    trainingRequestPeriodStart,
    trainingRequestPeriodEnd,
    isDraft: isDraftStatus(dto.draftStatus) || row.isDraft,
    createdAt: dto.createdAt?.trim() || now,
    createdByName: dto.createdByName?.trim() || '-',
    updatedAt: dto.updatedAt?.trim() || now,
    updatedByName: dto.updatedByName?.trim() || '-',
    announcementPublished: isDraftStatus(dto.draftStatus) ? 'unpublished' : 'published',
    educationTargetLevels: wireGeminiTargetLevels(
      dto.targetLevels,
      dto.recruitmentTargetDetail ?? undefined
    ).targetLevels,
    educationTargetDetail: trimmedOrEmpty(dto.recruitmentTargetDetail),
    minStudentCount: dto.minimumParticipantCount ?? 0,
    educationForm: mapEducationForm(dto.educationForm),
    educationStructure: resolveGeminiEducationStructureFromDetail(dto.educationStructure),
    inquiryContactName: trimmedOrEmpty(dto.contactName),
    inquiryTel: trimmedOrEmpty(dto.contactPhone),
    inquiryEmail: trimmedOrEmpty(dto.contactEmail),
    notesNotApplicable,
    notes: notesNotApplicable ? '' : otherMatters,
    thumbnailFileName: dto.thumbnailFileName?.trim() || null,
    programDescription: trimmedOrEmpty(dto.description) || trimmedOrEmpty(dto.summary),
    recruitmentGuide: trimmedOrEmpty(dto.recruitmentGuide),
    applicationMethod: trimmedOrEmpty(dto.applicationMethod),
    learningSupportContent: trimmedOrEmpty(dto.learningSupportContent),
    additionalContentMarkdown: trimmedOrEmpty(dto.additionalContentHtml),
    attachmentFileNames: Array.isArray(dto.attachmentFileNames)
      ? [...dto.attachmentFileNames]
      : [],
  }
}

function mapApplicationStatus(status?: string): GeminiInstitutionApprovalStatus {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['APPROVED', 'ASSIGNED'].includes(normalized)) return 'APPROVED'
  if (['REJECTED', 'AUTO_REJECTED', 'CANCELLED'].includes(normalized)) return 'REJECTED'
  return 'PENDING'
}

export function mapGeminiOrganizationApplicationToRow(
  dto: GeminiOrganizationApplicationItem,
  index: number
): GeminiInstitutionApplicationRow {
  return {
    id: toId(dto.applicationId),
    no: index + 1,
    institutionName: dto.organizationName?.trim() || '기관명 없음',
    institutionSido: dto.regionSido?.trim() || '',
    institutionSigungu: dto.regionSigungu?.trim() || '',
    approvalStatus: mapApplicationStatus(dto.applicationStatus),
    preferredLectureSchedule: resolveGeminiPreferredLectureSchedule(dto),
    studentCount: dto.requestedStudentCount ?? 0,
    teacherName: dto.teacherName?.trim() || '-',
    resultNotificationSentAt: dto.resultNotificationSentAt ?? null,
    availableActions: dto.availableActions ?? [],
  }
}

/**
 * 승인 연수 목록 행.
 * Primary Case: 행별 예정/중/완료/미진행은 trainingDate+강사로 FE 파생.
 * 목록 progressStatus는 program.period_status일 수 있어 배지에 쓰지 않는다.
 * 확정일(trainingDate)과 3지망 마지막일(lastPreferredDate)을 섞지 않는다.
 * 목록 OpenAPI에 lastPreferredDate가 없어도 BE가 주면 사용한다.
 */
type GeminiApprovedTrainingListItem = GeminiApprovedTrainingItem & {
  lastPreferredDate?: string | null
}

export function mapGeminiRecruitmentItemToApprovedRow(
  dto: GeminiApprovedTrainingListItem,
  index: number
): GeminiApprovedTrainingRow {
  const rawName = dto.instructorName?.trim()
  const instructorAssigned = Boolean(rawName) && rawName !== '미지정'
  const instructorName = instructorAssigned ? rawName! : '미지정'
  // 미매칭이면 확정 연수일로 취급하지 않음(스케줄 잔여 날짜 위장 금지)
  const trainingDate = instructorAssigned ? trimmedOrEmpty(dto.trainingDate) : ''
  const trainingTimeText = instructorAssigned ? trimmedOrEmpty(dto.trainingTimeText) : ''
  // 목록에 lastPreferredDate가 오면 사용. 없으면 빈 문자열(trainingDate 복사 금지)
  const lastPreferredDate = trimmedOrEmpty(dto.lastPreferredDate)
  return {
    id: toId(dto.id ?? dto.organizationApplicationId ?? dto.programId),
    no: index + 1,
    recruitmentTitle: dto.recruitmentTitle?.trim() || undefined,
    institutionName: dto.institutionName?.trim() || '기관명 없음',
    institutionSido: dto.institutionSido?.trim() || '',
    institutionSigungu: dto.institutionSigungu?.trim() || '',
    officialDocumentRequired: dto.officialDocumentRequired === true,
    lastPreferredDate,
    instructorAssigned,
    trainingDate,
    trainingTimeText,
    studentCount: dto.studentCount ?? 0,
    instructorName,
    managerName: dto.managerName?.trim() || '-',
  }
}
