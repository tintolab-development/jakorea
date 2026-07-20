import type { GeminiApprovedTrainingStatus } from '../approved/types'

export type GeminiInstitutionApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type GeminiInstitutionApplicationRow = {
  id: string
  no: number
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  approvalStatus: GeminiInstitutionApprovalStatus
  preferredLectureSchedule: string
  studentCount: number
  teacherName: string
  /** 승인 완료 기관의 프로그램 진행 현황 집계용 (mock) */
  programProgressStatus?: GeminiApprovedTrainingStatus
}

const PREFERRED_SCHEDULE_SAMPLE =
  '1지망 : 2026. 01. 09(금) | 15:30~16:40(2차시)\n2지망 : 2026. 01. 16(금) | 15:30~16:40(2차시)\n3지망 : 2026. 01. 23(금) | 15:30~16:40(2차시)'

const MOCK_INSTITUTION_SEEDS: Omit<GeminiInstitutionApplicationRow, 'id' | 'no'>[] = [
  {
    institutionName: '강서초등학교',
    institutionSido: '서울특별시',
    institutionSigungu: '강서구',
    approvalStatus: 'PENDING',
    preferredLectureSchedule: PREFERRED_SCHEDULE_SAMPLE,
    studentCount: 15,
    teacherName: '홍길동',
  },
  {
    institutionName: '푸른솔초등학교',
    institutionSido: '경기도',
    institutionSigungu: '성남시 분당구',
    approvalStatus: 'APPROVED',
    programProgressStatus: 'IN_PROGRESS',
    preferredLectureSchedule: PREFERRED_SCHEDULE_SAMPLE,
    studentCount: 15,
    teacherName: '홍길동',
  },
  {
    institutionName: '하늘빛초등학교',
    institutionSido: '인천광역시',
    institutionSigungu: '연수구',
    approvalStatus: 'REJECTED',
    preferredLectureSchedule: PREFERRED_SCHEDULE_SAMPLE,
    studentCount: 15,
    teacherName: '홍길동',
  },
  {
    institutionName: '새솔초등학교',
    institutionSido: '서울특별시',
    institutionSigungu: '양천구',
    approvalStatus: 'PENDING',
    preferredLectureSchedule: PREFERRED_SCHEDULE_SAMPLE,
    studentCount: 18,
    teacherName: '김영희',
  },
  {
    institutionName: '한빛초등학교',
    institutionSido: '경기도',
    institutionSigungu: '수원시 영통구',
    approvalStatus: 'APPROVED',
    programProgressStatus: 'SCHEDULED',
    preferredLectureSchedule: PREFERRED_SCHEDULE_SAMPLE,
    studentCount: 20,
    teacherName: '이철수',
  },
  {
    institutionName: '무지개초등학교',
    institutionSido: '부산광역시',
    institutionSigungu: '해운대구',
    approvalStatus: 'PENDING',
    preferredLectureSchedule: PREFERRED_SCHEDULE_SAMPLE,
    studentCount: 16,
    teacherName: '박민수',
  },
]

function buildMockRows(): GeminiInstitutionApplicationRow[] {
  const total = 30
  return Array.from({ length: total }, (_, index) => {
    const no = total - index
    const seed = MOCK_INSTITUTION_SEEDS[index % MOCK_INSTITUTION_SEEDS.length]
    return {
      ...seed,
      id: `gia-${no}`,
      no,
      institutionName:
        index < MOCK_INSTITUTION_SEEDS.length
          ? seed.institutionName
          : `${seed.institutionName.replace('초등학교', '')}${index + 1}초등학교`,
    }
  })
}

let mockRowsStore: GeminiInstitutionApplicationRow[] = buildMockRows()

export const GEMINI_INSTITUTION_APPLICATION_MOCK_ROWS: GeminiInstitutionApplicationRow[] =
  mockRowsStore

export function getGeminiInstitutionApplicationRows(): GeminiInstitutionApplicationRow[] {
  return mockRowsStore
}

export function patchGeminiInstitutionApplicationApprovalStatus(
  ids: string[],
  status: GeminiInstitutionApprovalStatus
): void {
  const idSet = new Set(ids)
  mockRowsStore = mockRowsStore.map(row =>
    idSet.has(row.id)
      ? {
          ...row,
          approvalStatus: status,
          programProgressStatus:
            status === 'APPROVED' ? (row.programProgressStatus ?? 'SCHEDULED') : undefined,
        }
      : row
  )
}

export function resetGeminiInstitutionApplicationMockRows(): void {
  mockRowsStore = buildMockRows()
}

export function getApprovedInstitutionProgressStatuses(
  recruitmentId: string
): GeminiApprovedTrainingStatus[] {
  if (recruitmentId === 'gvt-recruitment-in-progress') {
    return []
  }
  return getGeminiInstitutionApplicationRows()
    .filter(row => row.approvalStatus === 'APPROVED' && row.programProgressStatus != null)
    .map(row => row.programProgressStatus as GeminiApprovedTrainingStatus)
}
