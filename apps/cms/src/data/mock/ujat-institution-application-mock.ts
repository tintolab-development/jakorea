import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ui/detail-modal/ujat-institution-application/ujat-institution-application-regions'
import type {
  UjatInstitutionApplicationRow,
  UjatInstitutionScheduleSlotKey,
  UjatInstitutionTempAssignmentStatus,
} from '@/features/program/ui/detail-modal/ujat-institution-application/ujat-institution-application-types'
import { UJAT_INSTITUTION_SCHEDULE_COLUMNS } from '@/features/program/ui/detail-modal/ujat-institution-application/ujat-institution-application-types'

const SEOUL_SCHOOLS = [
  '신사초등학교',
  '마포초등학교',
  '서울숭인초등학교',
  '서울대명초등학교',
  '서울신동초등학교',
  '서울장안초등학교',
  '서울중곡초등학교',
  '서울화곡초등학교',
  '서울가락초등학교',
  '서울문정초등학교',
  '서울잠실초등학교',
  '서울풍납초등학교',
  '서울송파초등학교',
  '서울거여초등학교',
  '서울방이초등학교',
  '서울오금초등학교',
  '서울가락본동초등학교',
  '서울문정동초등학교',
  '서울석촌초등학교',
  '서울삼전초등학교',
  '서울잠실본초등학교',
  '서울신천초등학교',
  '서울풍납동초등학교',
  '서울거여동초등학교',
  '서울마천초등학교',
  '서울문정본동초등학교',
  '서울가락본초등학교',
  '서울송파본초등학교',
  '서울방이동초등학교',
  '서울잠실동초등학교',
] as const

const REGION_SCHOOL_PREFIX: Record<UjatInstitutionApplicationRegionKey, string> = {
  seoul: '서울',
  gyeonggi_south: '경기',
  incheon: '인천',
  daejeon: '대전',
  daegu: '대구',
  busan: '부산',
  gwangju: '광주',
  jeonbuk_jeonju: '전주',
}

const TEACHERS = [
  '홍길동',
  '김철수',
  '이영희',
  '박민수',
  '최지연',
  '정하늘',
  '한소희',
  '윤서준',
  '임도현',
  '강미래',
]

const STATUSES: UjatInstitutionTempAssignmentStatus[] = [
  'evaluation_pending',
  'temp_rejected',
  'temp_assigned',
  'evaluation_pending',
  'temp_assigned',
  'evaluation_pending',
]

function randomScheduleSlots(seed: number): Record<UjatInstitutionScheduleSlotKey, 'O' | '-'> {
  const slots = {} as Record<UjatInstitutionScheduleSlotKey, 'O' | '-'>
  for (const col of UJAT_INSTITUTION_SCHEDULE_COLUMNS) {
    slots[col.key] = (seed + col.key.length) % 3 === 0 ? 'O' : '-'
  }
  return slots
}

function buildGradeBreakdown(seed: number) {
  const templates = [
    [
      { gradeLabel: '1학년', classCount: 4 },
      { gradeLabel: '2학년', classCount: 6 },
      { gradeLabel: '3학년', classCount: 1 },
      { gradeLabel: '6학년', classCount: 6 },
    ],
    [
      { gradeLabel: '2학년', classCount: 3 },
      { gradeLabel: '4학년', classCount: 5 },
      { gradeLabel: '5학년', classCount: 2 },
    ],
    [
      { gradeLabel: '1학년', classCount: 2 },
      { gradeLabel: '3학년', classCount: 4 },
      { gradeLabel: '4학년', classCount: 3 },
    ],
  ]
  return templates[seed % templates.length]
}

function schoolNameForRegion(region: UjatInstitutionApplicationRegionKey, index: number): string {
  if (region === 'seoul' && index < SEOUL_SCHOOLS.length) {
    return SEOUL_SCHOOLS[index]
  }
  const prefix = REGION_SCHOOL_PREFIX[region]
  return `${prefix}${['가락', '문정', '잠실', '풍납', '중곡', '화곡'][index % 6]}초등학교`
}

function buildRowsForRegion(
  region: UjatInstitutionApplicationRegionKey,
  count: number
): UjatInstitutionApplicationRow[] {
  return Array.from({ length: count }, (_, i) => {
    const gradeClassCounts = buildGradeBreakdown(i + region.length)
    const totalClassCount = gradeClassCounts.reduce((sum, g) => sum + g.classCount, 0)
    return {
      id: `${region}-${i + 1}`,
      regionKey: region,
      no: count - i,
      institutionName: schoolNameForRegion(region, i),
      tempAssignmentStatus: STATUSES[(i + region.length) % STATUSES.length],
      gradeClassCounts,
      totalClassCount,
      scheduleSlots: randomScheduleSlots(i + region.length * 3),
      teacherName: TEACHERS[i % TEACHERS.length],
    }
  })
}

const ROW_COUNTS: Record<UjatInstitutionApplicationRegionKey, number> = {
  seoul: 30,
  gyeonggi_south: 28,
  incheon: 22,
  daejeon: 18,
  daegu: 20,
  busan: 24,
  gwangju: 16,
  jeonbuk_jeonju: 14,
}

/** 지역별 일 예상 최대 학급 수(mock) */
export const UJAT_INSTITUTION_MAX_CLASSES_PER_DAY: Record<
  UjatInstitutionApplicationRegionKey,
  number
> = {
  seoul: 12,
  gyeonggi_south: 11,
  incheon: 10,
  daejeon: 9,
  daegu: 10,
  busan: 11,
  gwangju: 8,
  jeonbuk_jeonju: 8,
}

let mockRows: UjatInstitutionApplicationRow[] | null = null

function ensureMockRows(): UjatInstitutionApplicationRow[] {
  if (!mockRows) {
    mockRows = (
      Object.keys(ROW_COUNTS) as UjatInstitutionApplicationRegionKey[]
    ).flatMap(region => buildRowsForRegion(region, ROW_COUNTS[region]))
  }
  return mockRows
}

export function getUjatInstitutionApplicationMockRows(): UjatInstitutionApplicationRow[] {
  return ensureMockRows()
}

export function patchUjatInstitutionApplicationRows(
  ids: string[],
  status: UjatInstitutionTempAssignmentStatus
): void {
  const set = new Set(ids)
  mockRows = ensureMockRows().map(row =>
    set.has(row.id) ? { ...row, tempAssignmentStatus: status } : row
  )
}
