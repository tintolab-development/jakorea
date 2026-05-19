import { UJAT_INSTITUTION_APPLICATION_REGIONS } from '@/features/program/ui/detail-modal/ujat-institution-application/ujat-institution-application-regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ui/detail-modal/ujat-institution-application/ujat-institution-application-regions'
import type { UjatInstitutionApplicationDetail } from '@/features/program/ui/detail-modal/ujat-institution-application/ujat-institution-application-detail-types'
import type {
  UjatInstitutionApplicationRow,
  UjatInstitutionScheduleSlotKey,
  UjatInstitutionTempAssignmentStatus,
} from '@/features/program/ui/detail-modal/ujat-institution-application/ujat-institution-application-types'
import {
  UJAT_INSTITUTION_SCHEDULE_COLUMNS,
  buildEmptyScheduleSlots,
  formatUjatInstitutionFridayDisplay,
  sumGradeClassCounts,
} from '@/features/program/ui/detail-modal/ujat-institution-application/ujat-institution-application-types'

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

const GRADE_BREAKDOWN_TEMPLATES: ReadonlyArray<
  ReadonlyArray<{ gradeLabel: string; classCount: number }>
> = [
  [
    { gradeLabel: '1학년', classCount: 4 },
    { gradeLabel: '2학년', classCount: 7 },
    { gradeLabel: '3학년', classCount: 5 },
    { gradeLabel: '4학년', classCount: 1 },
  ],
  [
    { gradeLabel: '2학년', classCount: 3 },
    { gradeLabel: '3학년', classCount: 5 },
    { gradeLabel: '5학년', classCount: 2 },
  ],
  [
    { gradeLabel: '1학년', classCount: 2 },
    { gradeLabel: '3학년', classCount: 4 },
    { gradeLabel: '4학년', classCount: 3 },
    { gradeLabel: '6학년', classCount: 6 },
  ],
  [
    { gradeLabel: '1학년', classCount: 3 },
    { gradeLabel: '2학년', classCount: 4 },
    { gradeLabel: '5학년', classCount: 5 },
    { gradeLabel: '6학년', classCount: 5 },
  ],
  [
    { gradeLabel: '3학년', classCount: 8 },
    { gradeLabel: '4학년', classCount: 6 },
  ],
  [
    { gradeLabel: '1학년', classCount: 5 },
    { gradeLabel: '2학년', classCount: 5 },
    { gradeLabel: '3학년', classCount: 5 },
    { gradeLabel: '4학년', classCount: 2 },
  ],
]

const SCHEDULE_SLOT_KEYS = UJAT_INSTITUTION_SCHEDULE_COLUMNS.map(col => col.key)

function buildGradeBreakdown(seed: number) {
  return [...GRADE_BREAKDOWN_TEMPLATES[seed % GRADE_BREAKDOWN_TEMPLATES.length]]
}

/** 기관이 신청한 금요일만 O, 나머지 교육 일자 열은 - */
function buildAppliedScheduleSlots(seed: number): Record<UjatInstitutionScheduleSlotKey, 'O' | '-'> {
  const slots = buildEmptyScheduleSlots()
  const applyCount = 2 + (seed % 4)
  for (let i = 0; i < applyCount; i += 1) {
    const key = SCHEDULE_SLOT_KEYS[(seed + i * 3) % SCHEDULE_SLOT_KEYS.length]
    slots[key] = 'O'
  }
  return slots
}

function schoolNameForRegion(region: UjatInstitutionApplicationRegionKey, index: number): string {
  if (region === 'gwangju' && index === 0) {
    return '진월초등학교'
  }
  if (region === 'seoul' && index < SEOUL_SCHOOLS.length) {
    return SEOUL_SCHOOLS[index]
  }
  const prefix = REGION_SCHOOL_PREFIX[region]
  return `${prefix}${['가락', '문정', '잠실', '풍납', '중곡', '화곡'][index % 6]}초등학교`
}

const DEFAULT_CLASS_TIME_ROWS: UjatInstitutionApplicationDetail['classTimeRows'] = [
  {
    gradeRangeLabel: '1, 2, 3학년',
    periods: ['09:00 ~ 09:40', '09:50 ~ 10:30', '10:40 ~ 11:20', '12:10 ~ 12:50'],
  },
  {
    gradeRangeLabel: '4, 5, 6학년',
    periods: ['09:00 ~ 09:40', '09:50 ~ 10:30', '10:40 ~ 11:20', '11:30 ~ 12:10'],
  },
]

const JINWOL_DETAIL_FIXTURE: Omit<
  UjatInstitutionApplicationDetail,
  'institutionName' | 'regionLabel' | 'tempAssignmentStatus' | 'preferredEducationDates'
> = {
  address: '광주광역시 남구 광복마을4길 40',
  addressDetail: '1층 교무실 이길동 선생님 앞',
  teacherInfoMasked:
    '담당 교사 : 이길동 | Tel : 062-***-0000 | M : 010-****-0000 | E-mail : ti***@naver.com',
  teacherInfoRevealed:
    '담당 교사 : 이길동 | Tel : 062-123-0000 | M : 010-1234-0000 | E-mail : teacher@naver.com',
  otherRequests: '-',
  gradeBlocks: [
    {
      gradeLabel: '1학년',
      classCount: 8,
      classes: [
        { classNo: 1, studentCount: 28 },
        { classNo: 2, studentCount: 28 },
        { classNo: 3, studentCount: 28 },
        { classNo: 4, studentCount: 28 },
        { classNo: 5, studentCount: 28 },
        { classNo: 6, studentCount: 28 },
        { classNo: 7, studentCount: 28 },
        { classNo: 8, studentCount: 24 },
      ],
    },
    {
      gradeLabel: '2학년',
      classCount: 4,
      classes: [
        { classNo: 1, studentCount: 28 },
        { classNo: 2, studentCount: 28 },
        { classNo: 3, studentCount: 28 },
        { classNo: 4, studentCount: 22 },
      ],
    },
  ],
  classTimeRows: DEFAULT_CLASS_TIME_ROWS,
}

function regionLabelForKey(regionKey: UjatInstitutionApplicationRegionKey): string {
  return (
    UJAT_INSTITUTION_APPLICATION_REGIONS.find(r => r.key === regionKey)?.label ??
    regionKey
  )
}

function buildTeacherInfo(teacherName: string, revealed: boolean): string {
  if (revealed) {
    return `담당 교사 : ${teacherName} | Tel : 02-123-4567 | M : 010-1234-5678 | E-mail : ${teacherName.slice(0, 1)}***@school.go.kr`
  }
  return `담당 교사 : ${teacherName} | Tel : 02-***-4567 | M : 010-****-5678 | E-mail : ${teacherName.slice(0, 1)}***@school.go.kr`
}

function buildGradeBlocksFromRow(
  row: UjatInstitutionApplicationRow,
  seed: number
): UjatInstitutionApplicationDetail['gradeBlocks'] {
  return row.gradeClassCounts.map((grade, gradeIndex) => {
    const classes = Array.from({ length: grade.classCount }, (_, classIndex) => ({
      classNo: classIndex + 1,
      studentCount: 28 - ((seed + gradeIndex + classIndex) % 5),
    }))
    return {
      gradeLabel: grade.gradeLabel,
      classCount: grade.classCount,
      classes,
    }
  })
}

function preferredDatesFromSlots(
  slots: UjatInstitutionApplicationRow['scheduleSlots']
): string[] {
  return UJAT_INSTITUTION_SCHEDULE_COLUMNS.filter(col => slots[col.key] === 'O').map(col =>
    formatUjatInstitutionFridayDisplay(col.isoDate)
  )
}

function buildRowsForRegion(
  region: UjatInstitutionApplicationRegionKey,
  count: number
): UjatInstitutionApplicationRow[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = i + region.length
    const gradeClassCounts = buildGradeBreakdown(seed)
    const totalClassCount = sumGradeClassCounts(gradeClassCounts)
    return {
      id: `${region}-${i + 1}`,
      regionKey: region,
      no: count - i,
      institutionName: schoolNameForRegion(region, i),
      tempAssignmentStatus:
        region === 'gwangju' && i === 0
          ? 'evaluation_pending'
          : STATUSES[seed % STATUSES.length],
      gradeClassCounts,
      totalClassCount,
      scheduleSlots: buildAppliedScheduleSlots(seed * 5),
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

export function getUjatInstitutionApplicationDetail(
  row: UjatInstitutionApplicationRow
): UjatInstitutionApplicationDetail {
  const regionLabel = regionLabelForKey(row.regionKey)
  const preferredEducationDates = preferredDatesFromSlots(row.scheduleSlots)
  const seed = row.id.length + row.no

  if (row.institutionName === '진월초등학교') {
    return {
      institutionName: row.institutionName,
      regionLabel,
      tempAssignmentStatus: row.tempAssignmentStatus,
      preferredEducationDates:
        preferredEducationDates.length > 0
          ? preferredEducationDates
          : [
              '26년 4월 24일(금)',
              '26년 5월 8일(금)',
              '26년 10월 30일(금)',
              '26년 11월 20일(금)',
            ],
      ...JINWOL_DETAIL_FIXTURE,
    }
  }

  const teacherName = row.teacherName
  return {
    institutionName: row.institutionName,
    regionLabel,
    tempAssignmentStatus: row.tempAssignmentStatus,
    address: `${regionLabel}광역시 ${row.institutionName.replace(/초등학교$/, '')}구 mock 주소`,
    addressDetail: '상세 주소 mock',
    teacherInfoMasked: buildTeacherInfo(teacherName, false),
    teacherInfoRevealed: buildTeacherInfo(teacherName, true),
    otherRequests: '-',
    gradeBlocks: buildGradeBlocksFromRow(row, seed),
    classTimeRows: DEFAULT_CLASS_TIME_ROWS,
    preferredEducationDates,
  }
}
