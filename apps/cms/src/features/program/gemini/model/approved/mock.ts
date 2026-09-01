import dayjs, { type Dayjs } from 'dayjs'
import type { GeminiApprovedTrainingRow } from './types'

const TARGET_MOCK_COUNT = 206

const INSTITUTION_NAMES = [
  '강서초등학교',
  '푸른솔초등학교',
  '하늘빛초등학교',
  '새싹초등학교',
  '무지개초등학교',
] as const

const SIDO_SIGUNGU = [
  { sido: '서울특별시', sigungu: '강서구' },
  { sido: '경기도', sigungu: '성남시 분당구' },
  { sido: '인천광역시', sigungu: '연수구' },
  { sido: '부산광역시', sigungu: '해운대구' },
  { sido: '대구광역시', sigungu: '수성구' },
] as const

const MANAGER_NAMES = ['박민수', '김영희', '이철수', '최지우'] as const
const INSTRUCTOR_NAMES = ['홍길동', '김강사', '이연수', '박교육'] as const

function createFeaturedRows(today: Dayjs): GeminiApprovedTrainingRow[] {
  return [
    {
      id: 'gat-215',
      no: 0,
      institutionName: '강서초등학교',
      institutionSido: '서울특별시',
      institutionSigungu: '강서구',
      officialDocumentRequired: false,
      lastPreferredDate: today.add(14, 'day').format('YYYY-MM-DD'),
      instructorAssigned: false,
      trainingDate: '',
      trainingTimeText: '',
      studentCount: 15,
      instructorName: '미지정',
      managerName: '박민수',
    },
    {
      id: 'gat-214',
      no: 0,
      institutionName: '푸른솔초등학교',
      institutionSido: '경기도',
      institutionSigungu: '성남시 분당구',
      officialDocumentRequired: false,
      lastPreferredDate: today.format('YYYY-MM-DD'),
      instructorAssigned: true,
      trainingDate: today.format('YYYY-MM-DD'),
      trainingTimeText: '15:30~16:40(2차시)',
      studentCount: 15,
      instructorName: '홍길동',
      managerName: '박민수',
    },
    {
      id: 'gat-213',
      no: 0,
      institutionName: '하늘빛초등학교',
      institutionSido: '인천광역시',
      institutionSigungu: '연수구',
      officialDocumentRequired: true,
      lastPreferredDate: today.subtract(10, 'day').format('YYYY-MM-DD'),
      instructorAssigned: true,
      trainingDate: today.subtract(7, 'day').format('YYYY-MM-DD'),
      trainingTimeText: '15:30~16:40(2차시)',
      studentCount: 15,
      instructorName: '홍길동',
      managerName: '박민수',
    },
    {
      id: 'gat-212',
      no: 0,
      institutionName: '새싹초등학교',
      institutionSido: '부산광역시',
      institutionSigungu: '해운대구',
      officialDocumentRequired: false,
      lastPreferredDate: today.subtract(5, 'day').format('YYYY-MM-DD'),
      instructorAssigned: false,
      trainingDate: '',
      trainingTimeText: '',
      studentCount: 20,
      instructorName: '미지정',
      managerName: '김영희',
    },
  ]
}

function createGeneratedRows(today: Dayjs, count: number): GeminiApprovedTrainingRow[] {
  const rows: GeminiApprovedTrainingRow[] = []

  for (let i = 0; i < count; i += 1) {
    const bucket = i % 4
    const region = SIDO_SIGUNGU[i % SIDO_SIGUNGU.length]!
    const instructorAssigned = bucket !== 0 && bucket !== 3
    const lastPreferredDate =
      bucket === 0 || bucket === 3
        ? today.subtract(3 + (i % 10), 'day')
        : today.add(i % 20, 'day')

    let trainingDate = ''
    if (instructorAssigned) {
      if (bucket === 1) {
        trainingDate = today.add(5 + (i % 15), 'day').format('YYYY-MM-DD')
      } else if (bucket === 2) {
        trainingDate = today.subtract(1 + (i % 30), 'day').format('YYYY-MM-DD')
      } else {
        trainingDate = today.format('YYYY-MM-DD')
      }
    }

    rows.push({
      id: `gat-gen-${String(i).padStart(4, '0')}`,
      no: 0,
      institutionName: INSTITUTION_NAMES[i % INSTITUTION_NAMES.length]!,
      institutionSido: region.sido,
      institutionSigungu: region.sigungu,
      officialDocumentRequired: i % 5 === 0,
      lastPreferredDate: lastPreferredDate.format('YYYY-MM-DD'),
      instructorAssigned,
      trainingDate,
      trainingTimeText: instructorAssigned ? '15:30~16:40(2차시)' : '',
      studentCount: 10 + (i % 20),
      instructorName: instructorAssigned ? INSTRUCTOR_NAMES[i % INSTRUCTOR_NAMES.length]! : '미지정',
      managerName: MANAGER_NAMES[i % MANAGER_NAMES.length]!,
    })
  }

  return rows
}

export function assignApprovedTrainingNumbers(
  rows: GeminiApprovedTrainingRow[]
): GeminiApprovedTrainingRow[] {
  const sorted = [...rows].sort((a, b) => b.id.localeCompare(a.id))
  const total = sorted.length
  return sorted.map((row, index) => ({
    ...row,
    no: total - index,
  }))
}

export function createApprovedTrainingMockRows(
  referenceDate: Dayjs | string = dayjs()
): GeminiApprovedTrainingRow[] {
  const today = (typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate).startOf(
    'day'
  )
  const featured = createFeaturedRows(today)
  const generated = createGeneratedRows(today, TARGET_MOCK_COUNT - featured.length)
  return assignApprovedTrainingNumbers([...featured, ...generated])
}

/** @deprecated store snapshot 사용 — 하위 호환용 */
export const GEMINI_APPROVED_TRAINING_MOCK_ROWS = createApprovedTrainingMockRows()
