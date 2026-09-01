import type { GeminiApprovedTrainingRow } from '@/features/program/gemini/model/approved/types'
import type {
  GeminiInstitutionApplicationRow,
  GeminiInstitutionApprovalStatus,
} from '@/features/program/gemini/model/recruitment/institution-application-mock'
import type { GeminiRecruitmentDetail } from '@/features/program/gemini/model/recruitment/detail-types'
import type { GeminiRecruitmentAddFormSnapshot } from '@/features/program/gemini/lib/recruitment/add-local-save'
import type { GeminiRecruitmentInfoEditDraft } from '@/features/program/gemini/model/recruitment/info-edit-draft'
import type { GeminiRecruitmentRow } from '@/features/program/gemini/model/recruitment/types'
import type { GeminiOrganizationApplicationItem } from '@/shared/api/generated/dashboard/schemas/geminiOrganizationApplicationItem'
import type { GeminiRecruitmentDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentDetailResponse'
import type { GeminiRecruitmentItem } from '@/shared/api/generated/dashboard/schemas/geminiRecruitmentItem'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { ProgramUpdateRequest } from '@/shared/api/generated/dashboard/schemas/programUpdateRequest'
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
  return {
    programType: GEMINI_VISITING_TRAINING_PROGRAM_TYPE,
    title: snapshot.title.trim() || undefined,
    description: snapshot.programDescription || undefined,
    businessStartDate: optionalDate(snapshot.applicationPeriodStart),
    businessEndDate: optionalDate(snapshot.applicationPeriodEnd),
    applicationStartDate: optionalDate(snapshot.applicationPeriodStart),
    applicationEndDate: optionalDate(snapshot.applicationPeriodEnd),
    totalParticipants: snapshot.minStudentCount ?? undefined,
    managerName: snapshot.inquiryContactName || undefined,
    contactPhone: snapshot.inquiryTel || undefined,
    contactEmail: snapshot.inquiryEmail || undefined,
    recruitmentGuide: snapshot.recruitmentGuide || undefined,
    learningSupportContent: snapshot.learningSupportContent || undefined,
    additionalContentHtml: snapshot.additionalContentMarkdown || undefined,
    attachmentFileNames: snapshot.attachmentFileNames,
    serviceDetailJson: JSON.stringify({ geminiRecruitment: snapshot }),
  }
}

export function mapGeminiRecruitmentDetailToUpdateRequest(
  draft: GeminiRecruitmentInfoEditDraft
): ProgramUpdateRequest {
  return {
    title: draft.title.trim() || undefined,
    description: draft.programDescription || undefined,
    businessStartDate: optionalDate(draft.applicationPeriodStart),
    businessEndDate: optionalDate(draft.applicationPeriodEnd),
    applicationStartDate: optionalDate(draft.applicationPeriodStart),
    applicationEndDate: optionalDate(draft.applicationPeriodEnd),
    totalParticipants: draft.minStudentCount ?? undefined,
    managerName: draft.inquiryContactName || undefined,
    contactPhone: draft.inquiryTel || undefined,
    contactEmail: draft.inquiryEmail || undefined,
    recruitmentGuide: draft.recruitmentGuide || undefined,
    learningSupportContent: draft.learningSupportContent || undefined,
    additionalContentHtml: draft.additionalContentMarkdown || undefined,
    attachmentFileNames: draft.attachmentFileNames,
    serviceDetailJson: JSON.stringify({ geminiRecruitment: draft }),
  }
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
  }
}

/**
 * OpenAPI approved list는 GeminiRecruitmentItem 재사용 — FE 승인 연수 행과 필드 갭이 큼.
 * 식별·제목·기간만 매핑하고 나머지는 빈 값/기본값.
 */
export function mapGeminiRecruitmentItemToApprovedRow(
  dto: GeminiRecruitmentItem,
  index: number
): GeminiApprovedTrainingRow {
  return {
    id: toId(dto.programId),
    no: index + 1,
    recruitmentTitle: dto.nameKo?.trim() || undefined,
    institutionName: dto.nameKo?.trim() || '기관명 없음',
    institutionSido: '',
    institutionSigungu: '',
    officialDocumentRequired: false,
    lastPreferredDate: dto.businessEndDate ?? '',
    instructorAssigned: false,
    trainingDate: dto.businessStartDate ?? '',
    trainingTimeText: '',
    studentCount: dto.approvedOrganizationApplicationCount ?? 0,
    instructorName: '미지정',
    managerName: '-',
  }
}
