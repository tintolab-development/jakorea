/**
 * 일정 Mock 데이터
 * Phase 3.1: 40개 이상의 다양한 일정 데이터 (중복 케이스 포함)
 */

import type { Schedule, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockInstructors } from './instructors'

// Phase 0.2.6: instructor-1-fixed-id-for-testing용 일정 할당
const INSTRUCTOR1_ID = 'instructor-1-fixed-id-for-testing'

function createSchedule(
  id: string,
  programIndex: number,
  roundIndex: number | null,
  instructorIndex: number | null,
  dateOffset: number,
  startHour: number,
  startMinute: number,
  durationHours: number,
  title: string,
  location?: string,
  onlineLink?: string
): Schedule {
  const program = mockPrograms[programIndex % mockPrograms.length]
  const round =
    roundIndex !== null && program.rounds[roundIndex] ? program.rounds[roundIndex] : null
  const instructor =
    instructorIndex !== null ? mockInstructors[instructorIndex % mockInstructors.length] : undefined

  const date = new Date()
  date.setDate(date.getDate() + dateOffset)
  date.setHours(0, 0, 0, 0)

  const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
  const endHour = startHour + durationHours
  const endTime = `${String(endHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`

  const createdAt = new Date(date)
  createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7))

  const updatedAt = new Date(createdAt)
  if (Math.random() > 0.7) {
    updatedAt.setDate(updatedAt.getDate() + Math.floor(Math.random() * 5))
  }

  return {
    id,
    programId: program.id,
    roundId: round?.id || undefined,
    title,
    date: date.toISOString().split('T')[0],
    startTime,
    endTime,
    location: location || undefined,
    onlineLink: onlineLink || undefined,
    instructorId: instructor?.id || undefined,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

const scheduleTitles = [
  'AI 기초 교육',
  '데이터 분석 워크샵',
  '웹 개발 강의',
  '디자인 세미나',
  '마케팅 워크샵',
  '비즈니스 강의',
  '언어학 특강',
  '과학 교육 프로그램',
  '예술 워크샵',
  '체육 강의',
  '외국어 교육',
  '역사 특강',
  '지리학 강의',
  '철학 세미나',
  '수학 특강',
  '문학 강의',
]

const locations = [
  '서울시 강남구',
  '부산시 해운대구',
  '대구시 중구',
  '인천시 연수구',
  '광주시 북구',
  '대전시 유성구',
  '울산시 남구',
  '세종시 조치원읍',
  '강원도 춘천시',
  '충청북도 청주시',
  '충청남도 천안시',
]

// Phase 0.2.6: 일반 일정 생성 (30개)
const baseSchedules: Schedule[] = Array.from({ length: 30 }, (_, index) => {
  const programIndex = Math.floor(Math.random() * mockPrograms.length)
  const program = mockPrograms[programIndex]
  const hasRound = program.rounds.length > 0 && Math.random() > 0.3
  const roundIndex = hasRound ? Math.floor(Math.random() * program.rounds.length) : null
  const hasInstructor = Math.random() > 0.2
  const instructorIndex = hasInstructor ? Math.floor(Math.random() * mockInstructors.length) : null
  const dateOffset = Math.floor(Math.random() * 60) + 1
  const startHour = Math.floor(Math.random() * 8) + 9
  const startMinute = Math.random() > 0.5 ? 0 : 30
  const durationHours = Math.random() > 0.5 ? 2 : 3
  const title = `${scheduleTitles[index % scheduleTitles.length]} ${Math.floor(index / scheduleTitles.length) + 1}차시`
  const isOnline = program.type === 'online' || (program.type === 'hybrid' && Math.random() > 0.5)
  const location = !isOnline ? locations[Math.floor(Math.random() * locations.length)] : undefined
  const onlineLink = isOnline
    ? `https://zoom.us/j/${Math.floor(Math.random() * 900000) + 100000}`
    : undefined

  return createSchedule(
    `sch-${String(index + 1).padStart(3, '0')}`,
    programIndex,
    roundIndex,
    instructorIndex,
    dateOffset,
    startHour,
    startMinute,
    durationHours,
    title,
    location,
    onlineLink
  )
})

// Phase 0.2.6: instructor-1-fixed-id-for-testing용 일정 (10개)
const instructor1Schedules: Schedule[] = Array.from({ length: 10 }, (_, index) => {
  const programIndex = Math.floor(Math.random() * mockPrograms.length)
  const program = mockPrograms[programIndex]
  const hasRound = program.rounds.length > 0 && Math.random() > 0.3
  const roundIndex = hasRound ? Math.floor(Math.random() * program.rounds.length) : null
  const dateOffset = Math.floor(Math.random() * 60) - 10 // 과거/현재/미래 일정
  const startHour = Math.floor(Math.random() * 8) + 9
  const startMinute = Math.random() > 0.5 ? 0 : 30
  const durationHours = Math.random() > 0.5 ? 2 : 3
  const title = `${scheduleTitles[index % scheduleTitles.length]} ${Math.floor(index / scheduleTitles.length) + 1}차시`
  const isOnline = program.type === 'online' || (program.type === 'hybrid' && Math.random() > 0.5)
  const location = !isOnline ? locations[Math.floor(Math.random() * locations.length)] : undefined
  const onlineLink = isOnline
    ? `https://zoom.us/j/${Math.floor(Math.random() * 900000) + 100000}`
    : undefined

  const schedule = createSchedule(
    `sch-instructor1-${String(index + 1).padStart(3, '0')}`,
    programIndex,
    roundIndex,
    0, // instructorIndex는 사용하지 않고 직접 할당
    dateOffset,
    startHour,
    startMinute,
    durationHours,
    title,
    location,
    onlineLink
  )
  // instructor-1-fixed-id-for-testing으로 직접 할당
  return {
    ...schedule,
    instructorId: INSTRUCTOR1_ID,
  }
})

// 오늘(27일) 기준 일정 10개
const todaySchedules: Schedule[] = Array.from({ length: 10 }, (_, index) => {
  const programIndex = Math.floor(Math.random() * mockPrograms.length)
  const program = mockPrograms[programIndex]
  const hasRound = program.rounds.length > 0 && Math.random() > 0.3
  const roundIndex = hasRound ? Math.floor(Math.random() * program.rounds.length) : null
  const hasInstructor = Math.random() > 0.2
  const instructorIndex = hasInstructor ? Math.floor(Math.random() * mockInstructors.length) : null
  // 오늘 날짜 (dateOffset = 0)
  const dateOffset = 0
  // 시간대 다양하게 분산 (9시~17시)
  const startHour = 9 + Math.floor(index % 9)
  const startMinute = index % 2 === 0 ? 0 : 30
  const durationHours = Math.random() > 0.5 ? 2 : 3
  const title = `${scheduleTitles[index % scheduleTitles.length]} ${index + 1}차시`
  const isOnline = program.type === 'online' || (program.type === 'hybrid' && Math.random() > 0.5)
  const location = !isOnline ? locations[Math.floor(Math.random() * locations.length)] : undefined
  const onlineLink = isOnline
    ? `https://zoom.us/j/${Math.floor(Math.random() * 900000) + 100000}`
    : undefined

  return createSchedule(
    `sch-today-${String(index + 1).padStart(3, '0')}`,
    programIndex,
    roundIndex,
    instructorIndex,
    dateOffset,
    startHour,
    startMinute,
    durationHours,
    title,
    location,
    onlineLink
  )
})

// 내일(28일) 기준 일정 10개
const tomorrowSchedules: Schedule[] = Array.from({ length: 10 }, (_, index) => {
  const programIndex = Math.floor(Math.random() * mockPrograms.length)
  const program = mockPrograms[programIndex]
  const hasRound = program.rounds.length > 0 && Math.random() > 0.3
  const roundIndex = hasRound ? Math.floor(Math.random() * program.rounds.length) : null
  const hasInstructor = Math.random() > 0.2
  const instructorIndex = hasInstructor ? Math.floor(Math.random() * mockInstructors.length) : null
  // 내일 날짜 (dateOffset = 1)
  const dateOffset = 1
  // 시간대 다양하게 분산 (9시~17시)
  const startHour = 9 + Math.floor(index % 9)
  const startMinute = index % 2 === 0 ? 0 : 30
  const durationHours = Math.random() > 0.5 ? 2 : 3
  const title = `${scheduleTitles[(index + 10) % scheduleTitles.length]} ${index + 1}차시`
  const isOnline = program.type === 'online' || (program.type === 'hybrid' && Math.random() > 0.5)
  const location = !isOnline ? locations[Math.floor(Math.random() * locations.length)] : undefined
  const onlineLink = isOnline
    ? `https://zoom.us/j/${Math.floor(Math.random() * 900000) + 100000}`
    : undefined

  return createSchedule(
    `sch-tomorrow-${String(index + 1).padStart(3, '0')}`,
    programIndex,
    roundIndex,
    instructorIndex,
    dateOffset,
    startHour,
    startMinute,
    durationHours,
    title,
    location,
    onlineLink
  )
})

// 내일(28일) 기준 추가 일정 10개
const tomorrowSchedulesAdditional: Schedule[] = Array.from({ length: 10 }, (_, index) => {
  const programIndex = Math.floor(Math.random() * mockPrograms.length)
  const program = mockPrograms[programIndex]
  const hasRound = program.rounds.length > 0 && Math.random() > 0.3
  const roundIndex = hasRound ? Math.floor(Math.random() * program.rounds.length) : null
  const hasInstructor = Math.random() > 0.2
  const instructorIndex = hasInstructor ? Math.floor(Math.random() * mockInstructors.length) : null
  // 내일 날짜 (dateOffset = 1)
  const dateOffset = 1
  // 시간대 다양하게 분산 (오후 시간대 포함)
  const startHour = 13 + Math.floor(index % 5) // 13시~17시
  const startMinute = index % 2 === 0 ? 0 : 30
  const durationHours = Math.random() > 0.5 ? 2 : 3
  const title = `${scheduleTitles[(index + 5) % scheduleTitles.length]} ${index + 11}차시`
  const isOnline = program.type === 'online' || (program.type === 'hybrid' && Math.random() > 0.5)
  const location = !isOnline ? locations[Math.floor(Math.random() * locations.length)] : undefined
  const onlineLink = isOnline
    ? `https://zoom.us/j/${Math.floor(Math.random() * 900000) + 100000}`
    : undefined

  return createSchedule(
    `sch-tomorrow-additional-${String(index + 1).padStart(3, '0')}`,
    programIndex,
    roundIndex,
    instructorIndex,
    dateOffset,
    startHour,
    startMinute,
    durationHours,
    title,
    location,
    onlineLink
  )
})

export const mockSchedules: Schedule[] = [
  ...baseSchedules,
  ...instructor1Schedules,
  ...todaySchedules,
  ...tomorrowSchedules,
  ...tomorrowSchedulesAdditional,
]

export const mockSchedulesMap = new Map<UUID, Schedule>()
mockSchedules.forEach(schedule => {
  mockSchedulesMap.set(schedule.id, schedule)
})
