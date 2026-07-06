import { getGeminiApprovedTrainingRowsSnapshot } from './approved-training-store'
import type { GeminiApprovedTrainingDetail } from './detail-types'
import type { GeminiApprovedTrainingRow } from './types'

const TRAINING_CONTENT = `안녕하세요, JA Korea입니다.
2025년 Google for Education & JA Korea Gemini Academy 찾아가는 연수를 아래와 같이 안내드립니다.

1. 연수 기간 : 2025년 8월 1일(금) ~ 12월 19일(금)
2. 신청 기간 : 2025년 11월 12일(금)까지
3. 연수 내용
- AI 활용 교육 역량 강화 및 Gemini 기반 실습 중심 연수
- 학교 현장 적용을 위한 수업 설계·평가 방법 안내
- 학생의 비판적 사고력·창의적 문제 해결 역량 함양을 위한 교육 프로그램
4. 연수 진행 절차
- 온라인 신청서 제출 → 강사 배정 → 일정 확정 → 현장 연수 진행
5. 문의 : gfc@jakorea.org (평일 10:00 ~ 17:00)

감사합니다.
JA Korea 드림`

const DEFAULT_DETAIL: Omit<
  GeminiApprovedTrainingDetail,
  | 'id'
  | 'institutionName'
  | 'trainingDate'
  | 'trainingTimeText'
  | 'studentCount'
  | 'officialDocumentType'
  | 'officialDocumentRequiredInfo'
  | 'instructor'
  | 'instructorAssigned'
  | 'lastPreferredDate'
  | 'officialDocumentRequired'
> = {
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
  trainingContent: TRAINING_CONTENT,
}

function buildInstructor(row: GeminiApprovedTrainingRow): GeminiApprovedTrainingDetail['instructor'] {
  if (!row.instructorAssigned) {
    return {
      name: '미지정',
      region: '-',
      experienceYears: 0,
      grade: '-',
      contact: '-',
      email: '-',
    }
  }
  return {
    name: row.instructorName,
    region: `${row.institutionSido} ${row.institutionSigungu}`,
    experienceYears: 3,
    grade: 'A등급',
    contact: '010-****-0000',
    email: 'ti***@naver.com',
  }
}

function rowToDetail(row: GeminiApprovedTrainingRow): GeminiApprovedTrainingDetail {
  return {
    ...DEFAULT_DETAIL,
    id: row.id,
    institutionName: row.institutionName,
    trainingDate: row.instructorAssigned ? row.trainingDate : row.lastPreferredDate,
    trainingTimeText: row.instructorAssigned ? row.trainingTimeText : '-',
    studentCount: row.studentCount,
    institutionAddress: `${row.institutionSido} ${row.institutionSigungu}`,
    managerNameKo: row.managerName,
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
