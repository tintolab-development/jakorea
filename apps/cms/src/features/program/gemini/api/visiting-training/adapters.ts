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

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

function isDraftStatus(value?: string): boolean {
  const normalized = value?.trim().toUpperCase() ?? ''
  return normalized === 'DRAFT' || normalized === 'TEMPORARY' || normalized === 'TEMP'
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

/** BE: online|offline|hybrid|null. UI 셀렉트는 online|offline만. */
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

/**
 * 교육 대상. 공유 enum 정규화 후 배열이 비면 상세 라벨에서 파싱한다.
 * 그래도 비면 빈 배열(대상 삭제). 첫 값이 있으면 targetLevel과 맞춘다.
 */
function wireGeminiTargetLevels(
  levels: string[] | null | undefined,
  detail?: string
): {
  targetLevels: string[]
  targetLevel?: string
} {
  const fromList = (levels ?? [])
    .map(normalizeTargetLevelValue)
    .filter((level): level is NonNullable<typeof level> => level != null)
  const unique = [...new Set(fromList)]
  const targetLevels =
    unique.length > 0 ? unique : parseTargetLevelsFromDisplayLabel(detail)
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

export function mapGeminiRecruitmentSnapshotToCreateRequest(
  snapshot: GeminiRecruitmentAddFormSnapshot
): ProgramCreateRequest {
  const contactName = snapshot.inquiryContactName?.trim() || undefined
  const otherMatters =
    snapshot.notesNotApplicable ? undefined : snapshot.notes?.trim() || undefined
  const recruitmentTargetDetail = snapshot.educationTargetDetail?.trim() || undefined
  const applicationMethod = snapshot.applicationMethod?.trim() || undefined
  // Gemini create: educationStructure는 ProgramCreateRequest top-level 비즈니스 필수.
  // UI 셀렉트 없음 → SCHEDULE. serviceDetailJson 안 값으로 top-level을 대체하지 않음.
  const educationStructure = resolveGeminiEducationStructureWire(
    snapshot.educationStructure ?? GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE
  )
  const { targetLevels, targetLevel } = wireGeminiTargetLevels(
    snapshot.educationTargetLevels,
    recruitmentTargetDetail
  )
  const requestBody: ProgramCreateRequest = {
    programType: GEMINI_VISITING_TRAINING_PROGRAM_TYPE,
    title: snapshot.title.trim() || undefined,
    description: snapshot.programDescription || undefined,
    businessStartDate: optionalDate(snapshot.applicationPeriodStart),
    businessEndDate: optionalDate(snapshot.applicationPeriodEnd),
    applicationStartDate: optionalDate(snapshot.applicationPeriodStart),
    applicationEndDate: optionalDate(snapshot.applicationPeriodEnd),
    trainingRequestStartDate: optionalDate(snapshot.trainingRequestPeriodStart),
    trainingRequestEndDate: optionalDate(snapshot.trainingRequestPeriodEnd),
    educationStructure,
    educationForm: mapEducationForm(snapshot.educationForm),
    targetLevels,
    ...(targetLevel ? { targetLevel } : {}),
    totalParticipants: snapshot.minStudentCount ?? undefined,
    managerName: contactName,
    contactName,
    contactPhone: snapshot.inquiryTel || undefined,
    contactEmail: snapshot.inquiryEmail || undefined,
    otherMatters,
    recruitmentTargetDetail,
    recruitmentGuide: snapshot.recruitmentGuide || undefined,
    applicationMethod,
    learningSupportContent: snapshot.learningSupportContent || undefined,
    additionalContentHtml: snapshot.additionalContentMarkdown || undefined,
    attachmentFileNames: snapshot.attachmentFileNames,
    serviceDetailJson: JSON.stringify({ geminiRecruitment: snapshot }),
  }
  wireGeminiThumbnail(requestBody, null, snapshot.thumbnailFileName)
  return requestBody
}

function wireGeminiNullableString(
  body: ProgramUpdateRequest,
  clearFields: string[],
  apiField:
    | 'contactName'
    | 'otherMatters'
    | 'recruitmentTargetDetail'
    | 'applicationMethod',
  next: string | undefined
): void {
  if (next) {
    body[apiField] = next
    return
  }
  // Gemini draft는 full replace — 빈 값은 "" 대신 clearFields
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
  const contactName = draft.inquiryContactName?.trim() || undefined
  const otherMatters =
    draft.notesNotApplicable ? undefined : draft.notes?.trim() || undefined
  const recruitmentTargetDetail = draft.educationTargetDetail?.trim() || undefined
  const applicationMethod = draft.applicationMethod?.trim() || undefined
  const clearFields: string[] = []
  // PATCH에서 educationStructure를 null/clear하지 않음 — Gemini UI 없으면 SCHEDULE 유지
  const educationStructureWire = resolveGeminiEducationStructureWire(
    draft.educationStructure ?? GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE
  )
  const educationStructure =
    educationStructureWire === ProgramCreateRequestEducationStructure.CURRICULUM
      ? ProgramUpdateRequestEducationStructure.CURRICULUM
      : ProgramUpdateRequestEducationStructure.SCHEDULE
  const { targetLevels, targetLevel } = wireGeminiTargetLevels(
    draft.educationTargetLevels,
    recruitmentTargetDetail
  )
  const body: ProgramUpdateRequest = {
    title: draft.title.trim() || undefined,
    description: draft.programDescription || undefined,
    businessStartDate: optionalDate(draft.applicationPeriodStart),
    businessEndDate: optionalDate(draft.applicationPeriodEnd),
    applicationStartDate: optionalDate(draft.applicationPeriodStart),
    applicationEndDate: optionalDate(draft.applicationPeriodEnd),
    educationStructure,
    educationForm: mapEducationForm(draft.educationForm),
    targetLevels,
    ...(targetLevel ? { targetLevel } : {}),
    totalParticipants: draft.minStudentCount ?? undefined,
    // 문의처 표시명 → contactName (TT managerName/후원 담당자와 별개 — Gemini는 문의처 레거시용 managerName 병행)
    managerName: contactName,
    contactPhone: draft.inquiryTel || undefined,
    contactEmail: draft.inquiryEmail || undefined,
    recruitmentGuide: draft.recruitmentGuide || undefined,
    learningSupportContent: draft.learningSupportContent || undefined,
    additionalContentHtml: draft.additionalContentMarkdown || undefined,
    attachmentFileNames: draft.attachmentFileNames,
    serviceDetailJson: JSON.stringify({ geminiRecruitment: draft }),
  }
  wireGeminiThumbnail(body, clearFields, draft.thumbnailFileName)
  wireGeminiNullableString(body, clearFields, 'contactName', contactName)
  wireGeminiNullableString(body, clearFields, 'otherMatters', otherMatters)
  wireGeminiNullableString(
    body,
    clearFields,
    'recruitmentTargetDetail',
    recruitmentTargetDetail
  )
  wireGeminiNullableString(body, clearFields, 'applicationMethod', applicationMethod)
  wireGeminiOptionalDate(
    body,
    clearFields,
    'trainingRequestStartDate',
    optionalDate(draft.trainingRequestPeriodStart)
  )
  wireGeminiOptionalDate(
    body,
    clearFields,
    'trainingRequestEndDate',
    optionalDate(draft.trainingRequestPeriodEnd)
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
        programId: dto.programId,
        programType: dto.programType ?? GEMINI_VISITING_TRAINING_PROGRAM_TYPE,
        nameKo: dto.nameKo,
        businessStartDate: dto.businessStartDate ?? undefined,
        businessEndDate: dto.businessEndDate ?? undefined,
        applicationStartDate: dto.applicationStartDate ?? undefined,
        applicationEndDate: dto.applicationEndDate ?? undefined,
        trainingRequestStartDate: dto.trainingRequestStartDate ?? undefined,
        trainingRequestEndDate: dto.trainingRequestEndDate ?? undefined,
        draftStatus: dto.draftStatus,
        organizationApplicationCount: dto.organizationApplicationCount ?? null,
        approvedOrganizationApplicationCount:
          dto.approvedOrganizationApplicationCount ?? null,
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
    educationStructure: GEMINI_RECRUITMENT_DEFAULT_EDUCATION_STRUCTURE,
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
    institutionSido: '',
    institutionSigungu: '',
    approvalStatus: mapApplicationStatus(dto.applicationStatus),
    preferredLectureSchedule: '',
    studentCount: dto.requestedStudentCount ?? 0,
    teacherName: '-',
    resultNotificationSentAt: dto.resultNotificationSentAt ?? null,
    availableActions: dto.availableActions ?? [],
  }
}

export function mapGeminiRecruitmentItemToApprovedRow(
  dto: GeminiApprovedTrainingItem,
  index: number
): GeminiApprovedTrainingRow {
  const instructorName = dto.instructorName?.trim() || '미지정'
  return {
    id: toId(dto.id ?? dto.programId),
    no: index + 1,
    recruitmentTitle: dto.recruitmentTitle?.trim() || undefined,
    institutionName: dto.institutionName?.trim() || '기관명 없음',
    institutionSido: dto.institutionSido?.trim() || '',
    institutionSigungu: dto.institutionSigungu?.trim() || '',
    officialDocumentRequired: dto.officialDocumentRequired ?? false,
    lastPreferredDate: dto.trainingDate ?? '',
    instructorAssigned: instructorName !== '미지정',
    trainingDate: dto.trainingDate ?? '',
    trainingTimeText: dto.trainingTimeText ?? '',
    studentCount: dto.studentCount ?? 0,
    instructorName,
    managerName: dto.managerName?.trim() || '-',
  }
}
