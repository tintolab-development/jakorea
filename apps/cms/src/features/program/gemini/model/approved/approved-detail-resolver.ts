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
import type { GeminiApprovedTrainingRow, GeminiApprovedTrainingStatus } from './types'
import { getGeminiApprovedTrainingRowsSnapshot } from './approved-training-store'
import { formatInstructorFeeGradeLabel } from '@/shared/constants/instructor-fee-grade'
import { toGenderLabelOrRaw } from '@/features/user/api/map-member-gender-birth'
import { mapGeminiTrainingDateCandidates } from '../../lib/approved/training-date-candidates'

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
function mapAssignedInstructor(
  assigned: GeminiAssignedInstructor | null | undefined
): { instructor: GeminiApprovedTrainingInstructorInfo; instructorAssigned: boolean } {
  if (assigned == null) {
    return { instructor: emptyInstructor(), instructorAssigned: false }
  }
  return {
    instructorAssigned: true,
    instructor: {
      memberId: assigned.memberId != null ? String(assigned.memberId) : undefined,
      name: trimmed(assigned.name) || '-',
      region: trimmed(assigned.homeAddress) || '-',
      experienceYears: assigned.experienceYears ?? null,
      grade: trimmed(assigned.grade) || '-',
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
  const officialRequired = dto.officialDocumentRequired === true
  const teacherName = trimmed(dto.teacherName) || trimmed(dto.managerName)

  return {
    id: toId(dto.id ?? dto.organizationApplicationId),
    programId: toId(dto.programId),
    recruitmentTitle: trimmed(dto.recruitmentTitle),
    institutionName: trimmed(dto.institutionName) || '기관명 없음',
    trainingDate: trimmed(dto.trainingDate),
    trainingTimeText: trimmed(dto.trainingTimeText) || '-',
    trainingDateCandidates: mapGeminiTrainingDateCandidates(dto.trainingDateCandidates),
    studentCount: dto.studentCount ?? null,
    recruitmentCount: dto.institutionApplicationCount ?? null,
    completedRecruitmentCount: dto.institutionCompletedTrainingCount ?? null,
    institutionAddress: buildInstitutionAddress(dto),
    joinedAt: trimmed(dto.institutionJoinedAt),
    managerMemberId: dto.teacherMemberId != null ? String(dto.teacherMemberId) : undefined,
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
    managerPosition: trimmed(dto.teacherPosition),
    managerSubject: trimmed(dto.teacherSubject),
    instructor,
    officialDocumentType: officialRequired ? '필요' : '필요 없음',
    officialDocumentRequiredInfo: officialRequired
      ? '이름, 소속(학교), 연수예정일시, 연수인원'
      : '-',
    trainingContent: '',
    instructorAssigned,
    lastPreferredDate: trimmed(dto.lastPreferredDate),
    officialDocumentRequired: officialRequired,
    progressStatus: mapProgressStatus(dto.progressStatus),
  }
}

function mapInstructorApplicationStatus(
  status?: string
): GeminiInstructorApplicationApprovalStatus {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (normalized === 'APPROVED') return 'APPROVED'
  if (normalized === 'REJECTED') return 'REJECTED'
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
    grade: trimmed(dto.grade) || trimmed(dto.instructorFeeGradeSnapshot) || '-',
    contact: trimmed(dto.phone) || '-',
    email: trimmed(dto.email) || '-',
    monthlyAssignmentCount: dto.monthlyAssignmentCount ?? 0,
    approvalStatus: mapInstructorApplicationStatus(dto.applicationStatus),
  }
}

/** @deprecated 목록 캐시 폴백 — 상세 GET 전환 후 호출하지 않는다. */
export function mapGeminiApprovedTrainingRowToDetail(
  row: GeminiApprovedTrainingRow
): GeminiApprovedTrainingDetail {
  const instructorAssigned = row.instructorAssigned
  return {
    id: row.id,
    programId: '',
    recruitmentTitle: row.recruitmentTitle ?? '',
    recruitmentCount: null,
    completedRecruitmentCount: null,
    institutionAddress: `${row.institutionSido} ${row.institutionSigungu}`.trim(),
    joinedAt: '',
    managerMemberId: '',
    managerNameKo: row.managerName,
    managerScheduleChangeCount: 0,
    managerGender: '',
    managerBirthDate: '',
    managerEmploymentStatus: null,
    managerContact: '',
    managerEmail: '',
    managerSchool: '',
    managerHomeAddress: '',
    managerLectureExperience: '',
    managerAccountBank: '',
    managerAccountNumber: '',
    managerAccountHolder: '',
    managerInstructorFeeGrade: '',
    managerBusinessIncomeLabel: '',
    managerOneLineIntro: '',
    managerPosition: '',
    managerSubject: '',
    trainingContent: '',
    institutionName: row.institutionName,
    trainingDate: row.trainingDate,
    trainingTimeText: row.trainingTimeText,
    trainingDateCandidates: row.trainingDateCandidates,
    studentCount: row.studentCount,
    instructor: emptyInstructor(),
    officialDocumentType: row.officialDocumentRequired ? '필요' : '필요 없음',
    officialDocumentRequiredInfo: row.officialDocumentRequired
      ? '이름, 소속(학교), 연수예정일시, 연수인원'
      : '-',
    instructorAssigned,
    lastPreferredDate: row.lastPreferredDate,
    officialDocumentRequired: row.officialDocumentRequired,
    progressStatus: null,
  }
}

export function getGeminiApprovedTrainingDetail(rowId: string): GeminiApprovedTrainingDetail | null {
  const row = getGeminiApprovedTrainingRowsSnapshot().find(x => x.id === rowId)
  if (!row) return null
  return mapGeminiApprovedTrainingRowToDetail(row)
}

export function getGeminiApprovedTrainingRowById(rowId: string): GeminiApprovedTrainingRow | null {
  return getGeminiApprovedTrainingRowsSnapshot().find(x => x.id === rowId) ?? null
}
