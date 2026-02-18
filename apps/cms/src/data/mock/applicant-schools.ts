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
  educationGrade: string
  classCount: number
  studentCount: number
  teacherName: string
  approvalStatus: ApplicantApprovalStatusKey
  /** 일정 변경&취소 이력 횟수 (참여 학교명 옆 배지용) */
  scheduleChangeCancelCount?: number
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
  '홍길동',
  '김길동',
  '박길동',
  '이길동',
  '최길동',
  '정길동',
  '강길동',
  '조길동',
]

const APPROVAL_STATUSES: ApplicantApprovalStatusKey[] = ['pending', 'rejected', 'approved']

function buildMockList(count: number): ApplicantSchoolRow[] {
  const rows: ApplicantSchoolRow[] = []
  for (let i = 0; i < count; i++) {
    const idx = i % SCHOOL_NAMES.length
    const statusIdx = i % APPROVAL_STATUSES.length
    /* 일부 학교에만 일정 변경&취소 이력 있음 (0, 1, 2회) */
    const scheduleChangeCancelCount = i % 5 === 0 ? 0 : i % 5 === 1 ? 1 : 2
    rows.push({
      id: `applicant-school-${i + 1}`,
      no: count - i,
      schoolName: SCHOOL_NAMES[idx],
      region: REGIONS[idx % REGIONS.length],
      educationGrade: GRADES[i % GRADES.length],
      classCount: 5 + (i % 4),
      studentCount: 130 + (i % 50),
      teacherName: TEACHER_NAMES[i % TEACHER_NAMES.length],
      approvalStatus: APPROVAL_STATUSES[statusIdx],
      scheduleChangeCancelCount:
        scheduleChangeCancelCount > 0 ? scheduleChangeCancelCount : undefined,
    })
  }
  return rows
}

export const MOCK_APPLICANT_SCHOOLS: ApplicantSchoolRow[] = buildMockList(30)
