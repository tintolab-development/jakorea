/**
 * 일정 Mock 데이터
 * Phase 3.1: 다양한 일정 케이스 생성 (중복 케이스 포함)
 */

import type { Schedule, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockInstructors } from './instructors'

// 일정 생성 함수
function createSchedule(
  id: string,
  programIndex: number,
  roundIndex: number | null,
  instructorIndex: number | null,
  dateOffset: number, // 오늘 기준 며칠 후
  startHour: number, // 시작 시간 (0-23)
  startMinute: number, // 시작 분 (0-59)
  durationHours: number, // 지속 시간 (시간)
  title: string,
  location?: string,
  onlineLink?: string
): Schedule {
  const program = mockPrograms[programIndex]
  const round = roundIndex !== null && program.rounds[roundIndex] ? program.rounds[roundIndex] : null
  const instructor =
    instructorIndex !== null ? mockInstructors[instructorIndex % mockInstructors.length] : undefined

  // 날짜 생성
  const date = new Date()
  date.setDate(date.getDate() + dateOffset)
  date.setHours(0, 0, 0, 0)

  // 시간 문자열 생성
  const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
  const endHour = startHour + durationHours
  const endTime = `${String(endHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`

  const createdAt = new Date(date)
  createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7)) // 7일 전~오늘 사이

  const updatedAt = new Date(createdAt)
  if (Math.random() > 0.7) {
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 5))
  }

  return {
    id,
    programId: program.id,
    roundId: round?.id || undefined,
    title,
    date: date.toISOString().split('T')[0], // YYYY-MM-DD 형식
    startTime,
    endTime,
    location: location || undefined,
    onlineLink: onlineLink || undefined,
    instructorId: instructor?.id || undefined,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

// Mock 데이터 생성 (최소 35개, 중복 케이스 포함)
export const mockSchedules: Schedule[] = [
  // 프로그램 0: 다양한 일정 (중복 없음)
  createSchedule('sch-001', 0, 0, 0, 5, 9, 0, 2, 'AI 기초 교육 1차시', '서울시 강남구', undefined),
  createSchedule('sch-002', 0, 0, 1, 7, 14, 0, 3, 'AI 기초 교육 2차시', '서울시 강남구', undefined),
  createSchedule('sch-003', 0, 1, 0, 12, 10, 30, 2.5, 'AI 심화 교육 1차시', undefined, 'https://zoom.us/j/123456'),
  createSchedule('sch-004', 0, 1, 2, 14, 15, 0, 2, 'AI 심화 교육 2차시', undefined, 'https://zoom.us/j/123456'),

  // 프로그램 1: 온라인 일정들
  createSchedule('sch-005', 1, 0, 3, 3, 10, 0, 2, '데이터 분석 워크샵 1', undefined, 'https://zoom.us/j/789012'),
  createSchedule('sch-006', 1, 0, 4, 6, 10, 0, 2, '데이터 분석 워크샵 2', undefined, 'https://zoom.us/j/789012'),
  createSchedule('sch-007', 1, 1, 5, 10, 14, 0, 3, '데이터 분석 워크샵 3', undefined, 'https://zoom.us/j/789012'),

  // 프로그램 2: 오프라인 일정들 (같은 강사, 다른 시간 - 중복 없음)
  createSchedule('sch-008', 2, null, 6, 4, 9, 0, 2, '웹 개발 강의 오전', '부산시 해운대구', undefined),
  createSchedule('sch-009', 2, null, 6, 4, 14, 0, 2, '웹 개발 강의 오후', '부산시 해운대구', undefined), // 같은 강사, 같은 날, 다른 시간

  // 프로그램 3: 중복 케이스 (같은 강사, 같은 시간대)
  createSchedule('sch-010', 3, 0, 7, 8, 10, 0, 2, '디자인 세미나 1', '대구시 중구', undefined),
  createSchedule('sch-011', 3, 0, 7, 8, 10, 30, 2, '디자인 세미나 2 (중복)', '대구시 남구', undefined), // 같은 강사, 같은 날, 겹치는 시간

  // 프로그램 4: 혼합 일정들
  createSchedule('sch-012', 4, null, 8, 11, 13, 0, 1.5, '마케팅 워크샵', '인천시 연수구', undefined),
  createSchedule('sch-013', 4, null, 9, 13, 10, 0, 2, '비즈니스 강의', undefined, 'https://zoom.us/j/345678'),
  createSchedule('sch-014', 4, 0, 10, 15, 15, 30, 2, '언어학 특강', '광주시 북구', undefined),

  // 프로그램 5-11: 추가 일정들
  createSchedule('sch-015', 5, 0, 11, 9, 9, 0, 3, '과학 교육 프로그램', '대전시 유성구', undefined),
  createSchedule('sch-016', 5, 0, 12, 11, 14, 0, 2, '과학 교육 프로그램 2', '대전시 유성구', undefined),
  createSchedule('sch-017', 6, null, 13, 16, 10, 0, 2, '예술 워크샵', '울산시 남구', undefined),
  createSchedule('sch-018', 7, 0, 14, 18, 13, 0, 2.5, '체육 강의', '세종시 조치원읍', undefined),
  createSchedule('sch-019', 8, null, 15, 20, 11, 0, 2, '외국어 교육', undefined, 'https://zoom.us/j/901234'),
  createSchedule('sch-020', 9, 0, 16, 22, 15, 0, 1.5, '역사 특강', '강원도 춘천시', undefined),
  createSchedule('sch-021', 10, null, 17, 25, 10, 0, 2, '지리학 강의', '충청북도 청주시', undefined),
  createSchedule('sch-022', 11, 0, 18, 27, 14, 0, 2, '철학 세미나', '충청남도 천안시', undefined),

  // 더 많은 일정들 (다양성 확보)
  createSchedule('sch-023', 0, 0, 19, 30, 9, 0, 2, 'AI 기초 교육 추가', '서울시 강남구', undefined),
  createSchedule('sch-024', 1, 1, 20, 32, 13, 0, 3, '데이터 분석 워크샵 추가', undefined, 'https://zoom.us/j/789012'),
  createSchedule('sch-025', 2, null, 21, 35, 10, 0, 2, '웹 개발 강의 추가', '부산시 해운대구', undefined),
  createSchedule('sch-026', 3, 1, 22, 38, 15, 0, 2, '디자인 세미나 추가', '대구시 중구', undefined),
  createSchedule('sch-027', 4, null, 23, 40, 11, 0, 2, '마케팅 워크샵 추가', '인천시 연수구', undefined),
  createSchedule('sch-028', 5, 1, 24, 42, 14, 0, 2.5, '과학 교육 프로그램 추가', '대전시 유성구', undefined),
  createSchedule('sch-029', 6, null, 25, 45, 10, 0, 2, '예술 워크샵 추가', '울산시 남구', undefined),
  createSchedule('sch-030', 7, 0, 26, 48, 13, 0, 2, '체육 강의 추가', '세종시 조치원읍', undefined),

  // 중복 케이스 추가 (같은 강사, 겹치는 시간대)
  createSchedule('sch-031', 8, null, 27, 50, 9, 0, 2, '외국어 교육 오전 (중복 가능)', undefined, 'https://zoom.us/j/901234'),
  createSchedule('sch-032', 9, 0, 27, 50, 9, 30, 2, '다른 프로그램 오전 (중복)', '강원도 춘천시', undefined), // 같은 강사, 같은 날, 겹치는 시간

  // 추가 중복 케이스
  createSchedule('sch-033', 10, null, 28, 52, 14, 0, 2, '지리학 강의 (중복 가능)', '충청북도 청주시', undefined),
  createSchedule('sch-034', 11, 0, 28, 52, 14, 30, 2, '철학 세미나 (중복)', '충청남도 천안시', undefined), // 같은 강사, 같은 날, 겹치는 시간

  // 정상 케이스 (같은 강사, 같은 날, 겹치지 않는 시간)
  createSchedule('sch-035', 0, 1, 29, 55, 9, 0, 2, 'AI 심화 교육 추가 오전', undefined, 'https://zoom.us/j/123456'),
  createSchedule('sch-036', 1, 0, 29, 55, 14, 0, 2, '데이터 분석 워크샵 추가 오후', undefined, 'https://zoom.us/j/789012'), // 같은 강사, 같은 날, 겹치지 않는 시간
]

// 효율적인 조회를 위한 Map
export const mockSchedulesMap = new Map<UUID, Schedule>()
mockSchedules.forEach(schedule => {
  mockSchedulesMap.set(schedule.id, schedule)
})

// 강사별 일정 그룹화 (중복 감지용)
export const mockSchedulesByInstructor = new Map<UUID, Schedule[]>()
mockSchedules.forEach(schedule => {
  if (schedule.instructorId) {
    const instructorSchedules = mockSchedulesByInstructor.get(schedule.instructorId) || []
    instructorSchedules.push(schedule)
    mockSchedulesByInstructor.set(schedule.instructorId, instructorSchedules)
  }
})

