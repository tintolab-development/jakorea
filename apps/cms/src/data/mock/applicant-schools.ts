/**
 * 프로그램 상세 - 신청자 목록 탭 (신청 학교) Mock 데이터
 * 수강 신청 학교 목록 (필터: 학교명, 지역, 대상 학년, 담당 교사명, 결재 현황)
 */

export type ApplicantApprovalStatusKey = 'pending' | 'rejected' | 'approved'

export interface ApplicantSchoolRow {
  id: string
  no: number
  schoolName: string
  region: string
  /** 희망 교육 진행 기간 (예: 26.01.09(금)~26.01.30(금)) */
  desiredEducationPeriod?: string
  educationGrade: string
  classCount: number
  studentCount: number
  teacherName: string
  contact?: string
  appliedAt?: string
  approvalStatus: ApplicantApprovalStatusKey
  /** 일정 변경&취소 이력 횟수 (참여 학교명 옆 배지용) */
  scheduleChangeCancelCount?: number
  /** 프로그램 ID (수강 신청 학교 목록 모달에서 프로그램별 필터용) */
  programId?: string
}

const SCHOOL_NAMES = [
  '강서초등학교',
  '마포초등학교',
  '학사초등학교',
  '진월초등학교',
  '대구수성초등학교',
  '부산해운대초등학교',
  '인천남동초등학교',
  '광주광산초등학교',
  '대전유성초등학교',
  '울산중구초등학교',
  '세종반곡초등학교',
  '수원영덕초등학교',
  '성남분당초등학교',
  '고양일산초등학교',
  '용인기흥초등학교',
  '창원성산초등학교',
  '청주상당초등학교',
  '전주완산초등학교',
  '천안서북구초등학교',
  '안양만안초등학교',
  '안산상록초등학교',
  '김해율하초등학교',
  '포항남구초등학교',
  '진주초등학교',
  '춘천초등학교',
  '원주초등학교',
  '제주초등학교',
  '목포초등학교',
  '여수초등학교',
  '순천초등학교',
]

const REGIONS = [
  '서울특별시 강서구',
  '서울특별시 마포구',
  '서울특별시 관악구',
  '부산광역시 북구',
  '부산광역시 해운대구',
  '대구광역시 수성구',
  '인천광역시 남동구',
  '광주광역시 남구',
  '대전광역시 유성구',
  '울산광역시 중구',
  '세종특별자치시',
  '경기도 수원시',
  '경기도 성남시',
  '경기도 고양시',
  '강원특별자치도 춘천시',
  '충청북도 청주시',
  '충청남도 천안시',
  '전북특별자치도 전주시',
  '전라남도 목포시',
  '경상북도 포항시',
  '경상남도 창원시',
  '제주특별자치도',
]

const GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

const TEACHER_NAMES = [
  '홍채원',
  '김민지',
  '박지훈',
  '이수진',
  '최현아',
  '정다은',
  '강태양',
  '조아람',
]

const APPROVAL_STATUSES: ApplicantApprovalStatusKey[] = ['pending', 'rejected', 'approved']

const DESIRED_PERIODS = [
  '26.01.09(금)~26.01.30(금)',
  '26.02.01(월)~26.02.28(금)',
  '26.03.01(일)~26.03.31(월)',
]

function buildMockList(count: number, programIds?: string[]): ApplicantSchoolRow[] {
  const rows: ApplicantSchoolRow[] = []
  for (let i = 0; i < count; i++) {
    const idx = i % SCHOOL_NAMES.length
    const statusIdx = i % APPROVAL_STATUSES.length
    const scheduleChangeCancelCount = i % 5 === 0 ? 0 : i % 5 === 1 ? 1 : 2
    rows.push({
      id: `applicant-school-${i + 1}`,
      no: count - i,
      schoolName: SCHOOL_NAMES[idx],
      region: REGIONS[idx % REGIONS.length],
      desiredEducationPeriod: DESIRED_PERIODS[i % DESIRED_PERIODS.length],
      educationGrade: GRADES[i % GRADES.length],
      classCount: 5 + (i % 4),
      studentCount: 130 + (i % 50),
      teacherName: TEACHER_NAMES[i % TEACHER_NAMES.length],
      contact: `010-1234-${(1000 + i).toString()}`,
      appliedAt: `2026.01.${(10 + (i % 20)).toString().padStart(2, '0')}`,
      approvalStatus: APPROVAL_STATUSES[statusIdx],
      scheduleChangeCancelCount:
        scheduleChangeCancelCount > 0 ? scheduleChangeCancelCount : undefined,
      programId: programIds?.[i % programIds.length],
    })
  }
  return rows
}

export const MOCK_APPLICANT_SCHOOLS: ApplicantSchoolRow[] = buildMockList(30)

/**
 * 프로그램별 수강 신청 학교 목록 (모달용).
 * programId가 있으면 해당 프로그램에 연결된 행만 반환, 없으면 전체 목록 반환.
 */
export function getApplicantSchoolsByProgramId(programId: string): ApplicantSchoolRow[] {
  const withProgramId = MOCK_APPLICANT_SCHOOLS.some(s => s.programId != null)
  if (withProgramId) {
    return MOCK_APPLICANT_SCHOOLS.filter(s => s.programId === programId)
  }
  return [...MOCK_APPLICANT_SCHOOLS]
}

/**
 * 수강 신청 학교 결재 현황 변경 (mock 동기화).
 * 모달/탭에서 상태 변경 시 호출하면 MOCK_APPLICANT_SCHOOLS에 반영됨.
 */
export function updateApplicantSchoolApprovalStatus(
  schoolId: string,
  approvalStatus: ApplicantApprovalStatusKey
): void {
  const row = MOCK_APPLICANT_SCHOOLS.find(s => s.id === schoolId)
  if (row) {
    row.approvalStatus = approvalStatus
  }
}
