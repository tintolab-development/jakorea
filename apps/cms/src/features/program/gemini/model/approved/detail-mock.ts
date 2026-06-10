import { GEMINI_APPROVED_TRAINING_MOCK_ROWS } from './mock'
import type { GeminiApprovedTrainingDetail } from './detail-types'

const DEFAULT_DETAIL: GeminiApprovedTrainingDetail = {
  id: 'gat-default',
  institutionName: '강서초등학교',
  status: 'IN_PROGRESS',
  trainingDate: '2026-01-09',
  trainingTimeText: '15:30~17:30(2차시)',
  studentCount: 15,
  recruitmentCount: 8,
  completedRecruitmentCount: 5,
  institutionAddress: '광주광역시 남구 광복마을4길 40',
  joinedAt: '2025. 09. 15',
  managerNameKo: '박틴토',
  managerScheduleChangeCount: 1,
  managerGender: '남성',
  managerBirthDate: '1990. 09. 15 (만 35세)',
  managerEmploymentStatus: 'ACTIVE',
  managerContact: '010-****-0000',
  managerEmail: 'ti***@naver.com',
  managerSchool: '진월초등학교',
  managerPosition: '교장',
  managerSubject: '과학',
  instructor: {
    name: '박틴토',
    region: '서울특별시 강서구',
    experienceYears: 3,
    grade: 'A등급',
    contact: '010-****-0000',
    email: 'ti***@naver.com',
  },
  officialDocumentType: '필요',
  officialDocumentRequiredInfo: '이름, 소속(학교), 연수예정일시, 연수인원',
}

function toDetail(rowId: string): GeminiApprovedTrainingDetail {
  const row = GEMINI_APPROVED_TRAINING_MOCK_ROWS.find(x => x.id === rowId)
  if (!row) return DEFAULT_DETAIL
  return {
    ...DEFAULT_DETAIL,
    id: row.id,
    institutionName: row.institutionName,
    status: row.status,
    trainingDate: row.trainingDate,
    trainingTimeText: row.trainingTimeText,
    studentCount: row.studentCount,
  }
}

export function getGeminiApprovedTrainingDetail(rowId: string): GeminiApprovedTrainingDetail | null {
  const row = GEMINI_APPROVED_TRAINING_MOCK_ROWS.find(x => x.id === rowId)
  if (!row) return null
  return toDetail(rowId)
}
