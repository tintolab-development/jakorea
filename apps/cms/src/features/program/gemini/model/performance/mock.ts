import dayjs from 'dayjs'
import type { GeminiPerformanceRow, GeminiPerformanceTrainingMethod } from './types'

const TOTAL_ROWS = 206

const LOCATIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원'] as const

const TOPICS = [
  '제미나이 아카데미',
  'Gemini Academy Coding Bootcamp',
  'Gemini Academy STEAM Education Workshop',
  'Gemini Academy AI for Education Workshop',
  'Google for Education 실습',
] as const

const INSTRUCTORS = ['홍길동', '김민수', '이영희', '박민지', '최지우', '정하늘'] as const

const ASSISTANT_PAIRS = [
  '김민수, 박민지',
  '이영희, 최지우',
  '박민지, 정하늘',
  '김민수',
  '최지우, 정하늘',
] as const

const FORMATS = ['교사 자체 연수', '학교 주관 연수', 'JA Korea 주관 연수', '혼합형 연수'] as const

const METHODS: GeminiPerformanceTrainingMethod[] = ['OFFLINE', 'ONLINE', 'HYBRID']

const DETAIL_TIMES = ['10:00~17:00', '09:00~12:00', '13:00~16:00', '14:00~17:30'] as const

const TRAINING_HOURS = [4, 5, 6, 7, 8] as const

function createRow(
  no: number,
  overrides: Partial<GeminiPerformanceRow> & Pick<GeminiPerformanceRow, 'id'>
): GeminiPerformanceRow {
  const index = TOTAL_ROWS - no
  const method = METHODS[index % METHODS.length] ?? 'OFFLINE'
  const assistants = ASSISTANT_PAIRS[index % ASSISTANT_PAIRS.length] ?? ASSISTANT_PAIRS[0]
  const instructorCount = assistants.includes(',') ? 2 : 1

  return {
    no,
    trainingLocation: LOCATIONS[index % LOCATIONS.length] ?? LOCATIONS[0],
    trainingDate: dayjs('2025-09-15').add(index, 'day').format('YYYY-MM-DD'),
    participantCount: 10 + (index % 11),
    detailTimeText: DETAIL_TIMES[index % DETAIL_TIMES.length] ?? DETAIL_TIMES[0],
    trainingHours: TRAINING_HOURS[index % TRAINING_HOURS.length] ?? TRAINING_HOURS[0],
    trainingTopic: TOPICS[index % TOPICS.length] ?? TOPICS[0],
    instructorName: INSTRUCTORS[index % INSTRUCTORS.length] ?? INSTRUCTORS[0],
    assistantInstructorNames: assistants,
    instructorCount,
    trainingFormat: FORMATS[index % FORMATS.length] ?? FORMATS[0],
    trainingMethod: method,
    ...overrides,
  }
}

/** Gemini 실적 관리 목록 mock — 총 206건, No. 내림차순 */
export function createPerformanceMockRows(): GeminiPerformanceRow[] {
  const rows: GeminiPerformanceRow[] = []

  for (let no = TOTAL_ROWS; no >= 1; no -= 1) {
    if (no === TOTAL_ROWS) {
      rows.push(
        createRow(no, {
          id: 'gperf-206',
          trainingLocation: '서울',
          trainingDate: '2026-03-02',
          participantCount: 15,
          detailTimeText: '10:00~17:00',
          trainingHours: 6,
          trainingTopic: '제미나이 아카데미',
          instructorName: '홍길동',
          assistantInstructorNames: '김민수, 박민지',
          instructorCount: 2,
          trainingFormat: '교사 자체 연수',
          trainingMethod: 'OFFLINE',
        })
      )
      continue
    }

    rows.push(
      createRow(no, {
        id: `gperf-${no}`,
      })
    )
  }

  return rows
}
