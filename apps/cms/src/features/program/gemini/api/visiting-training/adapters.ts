import type { GeminiApprovedTrainingRow } from '@/features/program/gemini/model/approved/types'
import type {
  GeminiInstitutionApplicationRow,
  GeminiInstitutionApprovalStatus,
} from '@/features/program/gemini/model/recruitment/institution-application-types'
import type { GeminiRecruitmentDetail } from '@/features/program/gemini/model/recruitment/detail-types'
import type { GeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'
import type { GeminiRecruitmentInfoEditDraft } from '@/features/program/gemini/model/recruitment/info-edit-draft'
import type { GeminiRecruitmentRow } from '@/features/program/gemini/model/recruitment/types'
import type { GeminiApprovedTrainingItem } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingItem'
import type { GeminiOrganizationApplicationItem } from '@/shared/api/generated/dashboard/schemas/geminiOrganizationApplicationItem'
import type { GeminiRecruitmentDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentDetailResponse'
import type { GeminiRecruitmentItem } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentItem'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
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

function resolveGeminiTargetLevels(
  levels: string[] | undefined,
  detail?: string
): NonNullable<ProgramCreateRequest['targetLevels']> | undefined {
  const fromList = (levels ?? [])
    .map(normalizeTargetLevelValue)
    .filter((level): level is NonNullable<typeof level> => level != null)
  const unique = [...new Set(fromList)]
  if (unique.length > 0) return unique
  const fromLabel = parseTargetLevelsFromDisplayLabel(detail)
  return fromLabel.length > 0 ? fromLabel : undefined
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
  const targetLevels = resolveGeminiTargetLevels(
    snapshot.educationTargetLevels,
    recruitmentTargetDetail
  )
  return {
    programType: GEMINI_VISITING_TRAINING_PROGRAM_TYPE,
    targetLevels,
    targetLevel: targetLevels?.[0],
    title: snapshot.title.trim() || undefined,
    description: snapshot.programDescription || undefined,
    businessStartDate: optionalDate(snapshot.applicationPeriodStart),
    businessEndDate: optionalDate(snapshot.applicationPeriodEnd),
    applicationStartDate: optionalDate(snapshot.applicationPeriodStart),
    applicationEndDate: optionalDate(snapshot.applicationPeriodEnd),
    totalParticipants: snapshot.minStudentCount ?? undefined,
    managerName: contactName,
    contactPhone: snapshot.inquiryTel || undefined,
    contactEmail: snapshot.inquiryEmail || undefined,
    recruitmentGuide: snapshot.recruitmentGuide || undefined,
    learningSupportContent: snapshot.learningSupportContent || undefined,
    additionalContentHtml: snapshot.additionalContentMarkdown || undefined,
    attachmentFileNames: snapshot.attachmentFileNames,
    serviceDetailJson: JSON.stringify({ geminiRecruitment: snapshot }),
    // CreateRequest OpenAPI에 없을 수 있음 — update와 동일 계약으로 실어 보냄
    ...(contactName ? ({ contactName } as Partial<ProgramCreateRequest>) : {}),
    ...(otherMatters ? ({ otherMatters } as Partial<ProgramCreateRequest>) : {}),
    ...(recruitmentTargetDetail
      ? ({ recruitmentTargetDetail } as Partial<ProgramCreateRequest>)
      : {}),
  }
}

function wireGeminiNullableString(
  body: ProgramUpdateRequest,
  clearFields: string[],
  apiField: 'contactName' | 'otherMatters' | 'recruitmentTargetDetail',
  next: string | undefined
): void {
  if (next) {
    body[apiField] = next
    return
  }
  // Gemini draft는 full replace — 빈 값은 "" 대신 clearFields
  clearFields.push(apiField)
}

export function mapGeminiRecruitmentDetailToUpdateRequest(
  draft: GeminiRecruitmentInfoEditDraft
): ProgramUpdateRequest {
  const contactName = draft.inquiryContactName?.trim() || undefined
  const otherMatters =
    draft.notesNotApplicable ? undefined : draft.notes?.trim() || undefined
  const recruitmentTargetDetail = draft.educationTargetDetail?.trim() || undefined
  const targetLevels = resolveGeminiTargetLevels(
    draft.educationTargetLevels,
    recruitmentTargetDetail
  )
  const clearFields: string[] = []
  const body: ProgramUpdateRequest = {
    targetLevels,
    targetLevel: targetLevels?.[0],
    title: draft.title.trim() || undefined,
    description: draft.programDescription || undefined,
    businessStartDate: optionalDate(draft.applicationPeriodStart),
    businessEndDate: optionalDate(draft.applicationPeriodEnd),
    applicationStartDate: optionalDate(draft.applicationPeriodStart),
    applicationEndDate: optionalDate(draft.applicationPeriodEnd),
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
  wireGeminiNullableString(body, clearFields, 'contactName', contactName)
  wireGeminiNullableString(body, clearFields, 'otherMatters', otherMatters)
  wireGeminiNullableString(
    body,
    clearFields,
    'recruitmentTargetDetail',
    recruitmentTargetDetail
  )
  if (clearFields.length > 0) body.clearFields = clearFields
  return body
}

export function mapGeminiRecruitmentItemToRow(
  dto: GeminiRecruitmentItem,
  index: number
): GeminiRecruitmentRow {
  const start = dto.businessStartDate ?? ''
  const end = dto.businessEndDate ?? ''
  return {
    id: toId(dto.programId),
    displayNo: index + 1,
    title: dto.nameKo?.trim() || '제목 없음',
    applicationPeriodStart: start,
    applicationPeriodEnd: end,
    trainingRequestPeriodStart: start,
    trainingRequestPeriodEnd: end,
    isDraft: isDraftStatus(dto.draftStatus),
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
        nameKo: dto.nameKo,
        businessStartDate: dto.businessStartDate,
        businessEndDate: dto.businessEndDate,
        draftStatus: dto.draftStatus,
      },
      0
    )
  const now = new Date().toISOString()
  return {
    ...row,
    title: dto.nameKo?.trim() || row.title,
    applicationPeriodStart: dto.businessStartDate ?? row.applicationPeriodStart,
    applicationPeriodEnd: dto.businessEndDate ?? row.applicationPeriodEnd,
    trainingRequestPeriodStart: dto.businessStartDate ?? row.trainingRequestPeriodStart,
    trainingRequestPeriodEnd: dto.businessEndDate ?? row.trainingRequestPeriodEnd,
    isDraft: isDraftStatus(dto.draftStatus) || row.isDraft,
    createdAt: now,
    createdByName: '-',
    updatedAt: now,
    updatedByName: '-',
    announcementPublished: isDraftStatus(dto.draftStatus) ? 'unpublished' : 'published',
    educationTargetLevels: [],
    educationTargetDetail: '',
    minStudentCount: dto.minimumParticipantCount ?? 0,
    educationForm: 'offline',
    inquiryContactName: '',
    inquiryTel: '',
    inquiryEmail: '',
    notesNotApplicable: true,
    notes: '',
    thumbnailFileName: null,
    programDescription: dto.description ?? dto.summary ?? '',
    recruitmentGuide: '',
    applicationMethod: '',
    learningSupportContent: '',
    additionalContentMarkdown: '',
    attachmentFileNames: [],
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
