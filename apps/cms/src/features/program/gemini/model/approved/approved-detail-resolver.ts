import type { GeminiApprovedTrainingDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingDetailResponse'
import type { GeminiAssignedInstructor } from '@/shared/api/generated/dashboard/schemas/geminiAssignedInstructor'
import type { GeminiInstructorApplicationItem } from '@/shared/api/generated/dashboard/schemas/geminiInstructorApplicationItem'
import type {
  GeminiApprovedTrainingDetail,
  GeminiApprovedTrainingEmploymentStatus,
  GeminiApprovedTrainingInstructorInfo,
} from './detail-types'
import type {
  GeminiInstructorApplicationApprovalStatus,
  GeminiInstructorApplicationRow,
} from './instructor-application-types'
import type { GeminiApprovedTrainingStatus } from './types'
import { formatInstructorFeeGradeLabel } from '@/shared/constants/instructor-fee-grade'
import { formatGeminiInstructorApplicationGrade } from '../../lib/instructor-application-grade-label'
import { toGenderLabelOrRaw } from '@/features/user/api/map-member-gender-birth'
import { mapGeminiTrainingDateCandidates } from '../../lib/approved/training-date-candidates'
import { coercePositiveInt } from '@/features/user/api/user-response-row-id'

function toId(value: number | string | null | undefined): string {
  if (value == null) return ''
  return String(value)
}
function trimmed(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function emptyInstructor(): GeminiApprovedTrainingInstructorInfo {
  return {
    name: '-',
    region: '-',
    experienceYears: null,
    grade: '-',
    contact: '-',
    email: '-',
  }
}

/** 섹션 노출은 assignedInstructor 객체만. instructorName·일정 매칭으로 대체하지 않는다. */
function mapAssignedInstructor(assigned: GeminiAssignedInstructor | null | undefined): {
  instructor: GeminiApprovedTrainingInstructorInfo
  instructorAssigned: boolean
} {
  const assignedMemberId = coercePositiveInt(assigned?.memberId)
  if (assigned == null || assignedMemberId == null) {
    return { instructor: emptyInstructor(), instructorAssigned: false }
  }
  return {
    instructorAssigned: true,
    instructor: {
      memberId: String(assignedMemberId),
      name: trimmed(assigned.name) || '-',
      region: trimmed(assigned.homeAddress) || '-',
      experienceYears: assigned.experienceYears ?? null,
      grade: formatGeminiInstructorApplicationGrade(assigned.grade),
      contact: trimmed(assigned.phone) || '-',
      email: trimmed(assigned.email) || '-',
    },
  }
}

function mapEmploymentStatus(
  value: string | null | undefined
): GeminiApprovedTrainingEmploymentStatus | null {
  if (value == null || !value.trim()) return null
  const normalized = value.trim().toUpperCase()
  if (normalized === 'ACTIVE') return 'ACTIVE'
  if (normalized === 'LEAVE' || normalized === 'ON_LEAVE') return 'LEAVE'
  if (normalized === 'TRANSFER' || normalized === 'TRANSFERRED') return 'TRANSFER'
  return null
}

function mapProgressStatus(value: string | null | undefined): GeminiApprovedTrainingStatus | null {
  const normalized = value?.trim().toUpperCase()
  if (
    normalized === 'SCHEDULED' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'COMPLETED' ||
    normalized === 'NOT_CONDUCTED'
  ) {
    return normalized
  }
  return null
}

function buildInstitutionAddress(dto: GeminiApprovedTrainingDetailResponse): string {
  const road = [trimmed(dto.institutionAddress), trimmed(dto.institutionAddressDetail)]
    .filter(Boolean)
    .join(' ')
  if (road) return road
  return `${trimmed(dto.institutionSido)} ${trimmed(dto.institutionSigungu)}`.trim()
}

/** 승인 연수 상세 GET → UI 모델. 목록 캐시 폴백용 기본값을 넣지 않는다. */
export function mapGeminiApprovedTrainingDetailResponseToDetail(
  dto: GeminiApprovedTrainingDetailResponse
): GeminiApprovedTrainingDetail {
  const { instructor, instructorAssigned } = mapAssignedInstructor(dto.assignedInstructor)
  const officialRequired =
    dto.officialDocumentRequired === true
      ? true
      : dto.officialDocumentRequired === false
        ? false
        : null
  const officialInfo = trimmed(dto.officialDocumentRequiredInfo)
  const teacherName = trimmed(dto.teacherName) || trimmed(dto.managerName)

  return {
    id: toId(dto.id ?? dto.organizationApplicationId),
    programId: toId(dto.programId),
    recruitmentTitle: trimmed(dto.recruitmentTitle),
    institutionName: trimmed(dto.institutionName) || '기관명 없음',
    trainingDate: dto.trainingDate ?? '',
    trainingTimeText: dto.trainingTimeText ?? '',
    classCount: dto.classCount ?? null,
    trainingDateCandidates: mapGeminiTrainingDateCandidates(dto.trainingDateCandidates),
    studentCount: dto.studentCount ?? null,
    recruitmentCount: dto.institutionApplicationCount ?? null,
    completedRecruitmentCount: dto.institutionCompletedTrainingCount ?? null,
    institutionAddress: buildInstitutionAddress(dto),
    joinedAt: trimmed(dto.institutionJoinedAt),
    managerMemberId: dto.teacherMemberId != null ? String(dto.teacherMemberId) : undefined,
    teacherSchoolOrganizationId: coercePositiveInt(dto.teacherSchoolOrganizationId) ?? null,
    managerNameKo: teacherName,
    managerScheduleChangeCount: dto.teacherScheduleChangeCount ?? 0,
    managerGender: toGenderLabelOrRaw(dto.teacherGender) ?? '',
    managerBirthDate: trimmed(dto.teacherBirthDate),
    managerEmploymentStatus: mapEmploymentStatus(dto.teacherEmploymentStatus),
    managerContact: trimmed(dto.teacherPhone),
    managerEmail: trimmed(dto.teacherEmail),
    managerSchool: trimmed(dto.teacherSchoolName),
    managerHomeAddress: trimmed(dto.teacherHomeAddress),
    managerLectureExperience: trimmed(dto.teacherLectureExperience),
    managerAccountBank: trimmed(dto.teacherAccountBank),
    managerAccountNumber: trimmed(dto.teacherAccountNumber),
    managerAccountHolder: trimmed(dto.teacherAccountHolder),
    managerInstructorFeeGrade: formatInstructorFeeGradeLabel(dto.teacherInstructorFeeGrade),
    managerBusinessIncomeLabel: trimmed(dto.teacherBusinessIncomeLabel),
    managerOneLineIntro: trimmed(dto.teacherOneLineIntro),
    managerPosition: dto.teacherPosition ?? '',
    managerSubject: dto.teacherSubject ?? '',
    instructor,
    trainingContent: '',
    instructorAssigned,
    lastPreferredDate: trimmed(dto.lastPreferredDate),
    officialDocumentRequired: officialRequired,
    officialDocumentRequiredInfo: officialInfo || null,
    progressStatus: mapProgressStatus(dto.progressStatus),
  }
}

function mapInstructorApplicationStatus(
  status?: string
): GeminiInstructorApplicationApprovalStatus {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['APPROVED', 'APPROVAL_COMPLETED', 'FINAL_SELECTED'].includes(normalized)) {
    return 'APPROVED'
  }
  if (['REJECTED', 'AUTO_REJECTED', 'CANCELLED'].includes(normalized)) {
    return 'REJECTED'
  }
  return 'PENDING'
}

export function mapGeminiInstructorApplicationItemToRow(
  dto: GeminiInstructorApplicationItem,
  approvedTrainingId: string,
  index: number
): GeminiInstructorApplicationRow {
  return {
    id: toId(dto.applicationId),
    approvedTrainingId,
    no: index + 1,
    instructorName: trimmed(dto.instructorName) || '강사명 없음',
    homeSido: trimmed(dto.homeSido),
    homeSigungu: trimmed(dto.homeSigungu),
    experienceYears: dto.experienceYears ?? 0,
    grade: formatGeminiInstructorApplicationGrade(dto.grade, dto.instructorFeeGradeSnapshot),
    contact: trimmed(dto.phone) || '-',
    email: trimmed(dto.email) || '-',
    monthlyAssignmentCount: dto.monthlyAssignmentCount ?? 0,
    approvalStatus: mapInstructorApplicationStatus(dto.applicationStatus),
  }
}
