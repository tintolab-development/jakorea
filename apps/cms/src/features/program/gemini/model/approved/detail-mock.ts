import { getGeminiApprovedTrainingRowsSnapshot } from './approved-training-store'
import type { GeminiApprovedTrainingDetail } from './detail-types'
import type { GeminiApprovedTrainingRow } from './types'

function emptyInstructor(): GeminiApprovedTrainingDetail['instructor'] {
  return {
    name: '미지정',
    region: '-',
    experienceYears: 0,
    grade: '-',
    contact: '-',
    email: '-',
  }
}

function buildInstructor(row: GeminiApprovedTrainingRow): GeminiApprovedTrainingDetail['instructor'] {
  if (!row.instructorAssigned) return emptyInstructor()
  return {
    name: row.instructorName,
    region: '-',
    experienceYears: 0,
    grade: '-',
    contact: '-',
    email: '-',
  }
}

function rowToDetail(row: GeminiApprovedTrainingRow): GeminiApprovedTrainingDetail {
  return {
    id: row.id,
    recruitmentTitle: row.recruitmentTitle ?? '',
    recruitmentCount: 0,
    completedRecruitmentCount: 0,
    institutionAddress: `${row.institutionSido} ${row.institutionSigungu}`.trim(),
    joinedAt: '',
    managerMemberId: '',
    managerNameKo: row.managerName,
    managerScheduleChangeCount: 0,
    managerGender: '',
    managerBirthDate: '',
    managerEmploymentStatus: 'ACTIVE',
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
    trainingDate: row.instructorAssigned ? row.trainingDate : row.lastPreferredDate,
    trainingTimeText: row.instructorAssigned ? row.trainingTimeText : '-',
    studentCount: row.studentCount,
    instructor: buildInstructor(row),
    officialDocumentType: row.officialDocumentRequired ? '필요' : '필요 없음',
    officialDocumentRequiredInfo: row.officialDocumentRequired
      ? '이름, 소속(학교), 연수예정일시, 연수인원'
      : '-',
    instructorAssigned: row.instructorAssigned,
    lastPreferredDate: row.lastPreferredDate,
    officialDocumentRequired: row.officialDocumentRequired,
  }
}

export function getGeminiApprovedTrainingDetail(rowId: string): GeminiApprovedTrainingDetail | null {
  const row = getGeminiApprovedTrainingRowsSnapshot().find(x => x.id === rowId)
  if (!row) return null
  return rowToDetail(row)
}

export function getGeminiApprovedTrainingRowById(rowId: string): GeminiApprovedTrainingRow | null {
  return getGeminiApprovedTrainingRowsSnapshot().find(x => x.id === rowId) ?? null
}
