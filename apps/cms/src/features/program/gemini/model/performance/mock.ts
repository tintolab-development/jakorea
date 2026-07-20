import dayjs from 'dayjs'
import { calculateInstructorCount } from '../../lib/performance/calculate-instructor-count'
import type { GeminiPerformanceRow, GeminiPerformanceTrainingMethod } from './types'

const TOTAL_ROWS = 206

const LOCATIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원'] as const

const INSTRUCTORS = ['홍길동', '김민수', '이영희', '박민지', '최지우', '정하늘'] as const

const ASSISTANT_PAIRS = [
  '김민수, 박민지',
  '이영희, 최지우',
  '박민지, 정하늘',
  '김민수',
  '최지우, 정하늘',
] as const

const FORMATS = ['교사 자체 연수', '학교 주관 연수', 'JA Korea 주관 연수', '혼합형 연수'] as const

const METHODS: GeminiPerformanceTrainingMethod[] = ['OFFLINE', 'ONLINE']

const DETAIL_TIMES = ['10:00~17:00', '09:00~12:00', '13:00~16:00', '14:00~17:30'] as const

const TRAINING_HOURS = [4, 5, 6, 7, 8] as const

function createRow(
  no: number,
  overrides: Partial<GeminiPerformanceRow> & Pick<GeminiPerformanceRow, 'id' | 'duplicateKey' | 'createdAt'>
): GeminiPerformanceRow {
  const index = TOTAL_ROWS - no
  const method = METHODS[index % METHODS.length] ?? 'OFFLINE'
  const assistants = ASSISTANT_PAIRS[index % ASSISTANT_PAIRS.length] ?? ASSISTANT_PAIRS[0]
  const instructorName = INSTRUCTORS[index % INSTRUCTORS.length] ?? INSTRUCTORS[0]
  const trainingDate = dayjs('2025-09-15').add(index, 'day').format('YYYY-MM-DD')

  return {
    no,
    trainingLocation: LOCATIONS[index % LOCATIONS.length] ?? LOCATIONS[0],
    trainingDate,
    participantCount: 10 + (index % 11),
    detailTimeText: DETAIL_TIMES[index % DETAIL_TIMES.length] ?? DETAIL_TIMES[0],
    trainingHours: TRAINING_HOURS[index % TRAINING_HOURS.length] ?? TRAINING_HOURS[0],
    trainingTopic: '제미나이 아카데미',
    instructorName,
    assistantInstructorNames: assistants,
    instructorCount: calculateInstructorCount(assistants),
    trainingFormat: FORMATS[index % FORMATS.length] ?? FORMATS[0],
    trainingMethod: method,
    contact: `010-0000-${String(index).padStart(4, '0')}`,
    ...overrides,
  }
}

/** Gemini 실적 관리 목록 mock — 총 206건, No. 내림차순 */
export function createPerformanceMockRows(): GeminiPerformanceRow[] {
  const rows: GeminiPerformanceRow[] = []

  for (let no = TOTAL_ROWS; no >= 1; no -= 1) {
    const index = TOTAL_ROWS - no
    const createdAt = dayjs('2025-09-15').add(index, 'day').toISOString()
    const instructorName = no === TOTAL_ROWS ? '홍길동' : (INSTRUCTORS[index % INSTRUCTORS.length] ?? INSTRUCTORS[0])
    const trainingDate = no === TOTAL_ROWS ? '2026-03-02' : dayjs('2025-09-15').add(index, 'day').format('YYYY-MM-DD')
    const trainingLocation = no === TOTAL_ROWS ? '서울' : (LOCATIONS[index % LOCATIONS.length] ?? LOCATIONS[0])
    const trainingStartTime = no === TOTAL_ROWS ? '10:00' : '09:00'
    const duplicateKey = [instructorName, `010-0000-${String(index).padStart(4, '0')}`, trainingDate, trainingLocation, trainingStartTime].join('|')

    if (no === TOTAL_ROWS) {
      rows.push(
        createRow(no, {
          id: 'gperf-206',
          createdAt,
          duplicateKey,
          trainingLocation: '서울',
          trainingDate: '2026-03-02',
          participantCount: 15,
          detailTimeText: '10:00~17:00',
          trainingHours: 6,
          trainingTopic: '제미나이 아카데미',
          instructorName: '홍길동',
          assistantInstructorNames: '김민수, 박민지',
          instructorCount: 3,
          trainingFormat: '교사 자체 연수',
          trainingMethod: 'OFFLINE',
          contact: '010-0000-0205',
        })
      )
      continue
    }

    rows.push(
      createRow(no, {
        id: `gperf-${no}`,
        createdAt,
        duplicateKey,
      })
    )
  }

  return rows
}
