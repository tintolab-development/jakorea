/**
 * 일정 Mock 데이터
 * Phase 3.1: 40개 이상의 다양한 일정 데이터 (중복 케이스 포함)
 */

import type { Schedule, UUID } from '../../types'
import { mockPrograms } from './programs'
import { mockInstructors } from './instructors'
import { getEconomyPrograms } from './economy-programs'
import {
  getGeneralEducationPrograms,
  getGeminiPrograms,
  getUjatPrograms,
} from './program-schedule-categories'

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

/** 주간 겹침·시간축 레이아웃 확인용: 분 단위 시작·다양한 소요(30분~3시간)·자정 근처·클램프 케이스 포함 */
const ECONOMY_VISIBLE_RANGE_TIME_TEMPLATES: readonly {
  startH: number
  startM: number
  durationM: number
}[] = [
  { startH: 7, startM: 0, durationM: 45 },
  { startH: 7, startM: 45, durationM: 30 },
  { startH: 8, startM: 15, durationM: 75 },
  { startH: 8, startM: 50, durationM: 40 },
  { startH: 9, startM: 0, durationM: 50 },
  { startH: 9, startM: 30, durationM: 90 },
  { startH: 10, startM: 10, durationM: 110 },
  { startH: 10, startM: 45, durationM: 45 },
  { startH: 11, startM: 20, durationM: 70 },
  { startH: 12, startM: 0, durationM: 35 },
  { startH: 12, startM: 25, durationM: 95 },
  { startH: 13, startM: 15, durationM: 105 },
  { startH: 14, startM: 0, durationM: 60 },
  { startH: 14, startM: 30, durationM: 150 },
  { startH: 15, startM: 45, durationM: 75 },
  { startH: 16, startM: 20, durationM: 55 },
  { startH: 17, startM: 0, durationM: 120 },
  { startH: 18, startM: 30, durationM: 90 },
  { startH: 19, startM: 15, durationM: 105 },
  { startH: 22, startM: 0, durationM: 180 },
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function minutesToScheduleEndHHmm(totalMin: number): string {
  const capped = Math.min(Math.max(0, totalMin), 24 * 60)
  if (capped === 24 * 60) return '24:00'
  const h = Math.floor(capped / 60)
  const m = capped % 60
  return `${pad2(h)}:${pad2(m)}`
}

/** 4~6월: 대시보드 위젯 목 일정이 매일 쌓이지 않도록 월 12일만 일정 생성 */
const DASHBOARD_SPARSE_QUARTER_MONTHS = new Set([4, 5, 6])
const DASHBOARD_SPARSE_QUARTER_DAYS = new Set([1, 3, 5, 7, 9, 12, 15, 18, 20, 22, 25, 28])

function isDashboardWidgetScheduleDayForDateKey(dateKey: string): boolean {
  const d = new Date(`${dateKey}T12:00:00`)
  const m = d.getMonth() + 1
  if (!DASHBOARD_SPARSE_QUARTER_MONTHS.has(m)) return true
  return DASHBOARD_SPARSE_QUARTER_DAYS.has(d.getDate())
}

function economyVisibleRangeStartEnd(seq: number): { startTime: string; endTime: string } {
  const t = ECONOMY_VISIBLE_RANGE_TIME_TEMPLATES[(seq - 1) % ECONOMY_VISIBLE_RANGE_TIME_TEMPLATES.length]
  const startTotal = t.startH * 60 + t.startM
  const endTotal = Math.min(startTotal + t.durationM, 24 * 60)
  return {
    startTime: `${pad2(t.startH)}:${pad2(t.startM)}`,
    endTime: minutesToScheduleEndHHmm(endTotal),
  }
}

/** 1사1교 위젯: 출강지(학교) 목 — 일반 `locations`와 구분 */
const ECONOMY_WIDGET_SCHOOL_LOCATIONS = [
  '서울 강서초등학교',
  '인천 연수초등학교',
  '부산 해운대중학교',
  '대구 수성초등학교',
  '광주 서석초등학교',
  '대전 유성초등학교',
  '울산 남부초등학교',
  '세종 다정초등학교',
] as const

/**
 * 1사1교 프로그램 일정 위젯: `economy-prog-*` 가시 구간 동적 목 일정
 * - 날짜 희소(4~6월)는 공통 `isDashboardWidgetScheduleDayForDateKey` 사용
 * - **하루 1건**만 생성 (다른 위젯 대비 캘린더 과밀 완화)
 * - 제목/장소는 출강·회차 맥락에 맞게 program 메타 기반
 */
export function buildEconomySchedulesForVisibleRange(
  visibleDateKeys: string[],
  allowedEconomyProgramIdSet: Set<string> | null
): Schedule[] {
  const economyPrograms = getEconomyPrograms()
  if (economyPrograms.length === 0) return []

  const pool =
    allowedEconomyProgramIdSet == null
      ? economyPrograms
      : economyPrograms.filter(p => allowedEconomyProgramIdSet.has(p.id))

  if (pool.length === 0) return []

  const createdAt = new Date().toISOString()
  const schedules: Schedule[] = []
  let seq = 0

  for (const dateStr of visibleDateKeys) {
    if (!isDashboardWidgetScheduleDayForDateKey(dateStr)) continue
    const maxSlots = 1
    for (let s = 0; s < maxSlots; s++) {
      seq += 1
      const program = pool[(seq - 1) % pool.length]
      const round = program.rounds?.[0]
      const { startTime, endTime } = economyVisibleRangeStartEnd(seq)
      const roundNo = 1 + ((seq - 1) % 4)
      const programShort = (program.mainTitle || program.title || '프로그램').trim()
      const title = `${roundNo}회차 교육`
      const schoolName = ECONOMY_WIDGET_SCHOOL_LOCATIONS[(seq - 1) % ECONOMY_WIDGET_SCHOOL_LOCATIONS.length]
      const location = `${schoolName} · ${programShort}`

      schedules.push({
        id: `sch-economy-vis-${dateStr}-${s}` as UUID,
        programId: program.id,
        roundId: round?.id,
        title,
        date: dateStr,
        startTime,
        endTime,
        location,
        instructorId: mockInstructors[(seq - 1) % mockInstructors.length]?.id,
        createdAt,
        updatedAt: createdAt,
      })
    }
  }

  return schedules
}

/**
 * 일반 교육 프로그램 일정 위젯: 가시 구간 동적 목 일정 (경제 위젯과 동일 패턴)
 */
export function buildGeneralSchedulesForVisibleRange(
  visibleDateKeys: string[],
  allowedProgramIdSet: Set<string> | null
): Schedule[] {
  const generalPrograms = getGeneralEducationPrograms()
  if (generalPrograms.length === 0) return []

  const pool =
    allowedProgramIdSet == null
      ? generalPrograms
      : generalPrograms.filter(p => allowedProgramIdSet.has(p.id))

  if (pool.length === 0) return []

  const createdAt = new Date().toISOString()
  const schedules: Schedule[] = []
  let seq = 0

  for (const dateStr of visibleDateKeys) {
    if (!isDashboardWidgetScheduleDayForDateKey(dateStr)) continue
    const maxSlots = Math.min(2, pool.length)
    for (let s = 0; s < maxSlots; s++) {
      seq += 1
      const program = pool[s % pool.length]
      const round = program.rounds?.[0]
      const startHour = 9 + ((seq + s) % 7)
      const startTime = `${String(startHour).padStart(2, '0')}:00`
      const endTime = `${String(Math.min(startHour + 2, 18)).padStart(2, '0')}:00`

      schedules.push({
        id: `sch-general-vis-${dateStr}-${s}` as UUID,
        programId: program.id,
        roundId: round?.id,
        title: `${scheduleTitles[(seq - 1) % scheduleTitles.length]} ${s + 1}차시`,
        date: dateStr,
        startTime,
        endTime,
        location: locations[(seq - 1) % locations.length],
        instructorId: mockInstructors[(seq - 1) % mockInstructors.length]?.id,
        createdAt,
        updatedAt: createdAt,
      })
    }
  }

  return schedules
}

/**
 * 제미나이 프로그램 일정 위젯: 가시 구간 동적 목 일정
 */
export function buildGeminiSchedulesForVisibleRange(
  visibleDateKeys: string[],
  allowedProgramIdSet: Set<string> | null
): Schedule[] {
  const geminiPrograms = getGeminiPrograms()
  if (geminiPrograms.length === 0) return []

  const pool =
    allowedProgramIdSet == null
      ? geminiPrograms
      : geminiPrograms.filter(p => allowedProgramIdSet.has(p.id))

  if (pool.length === 0) return []

  const createdAt = new Date().toISOString()
  const schedules: Schedule[] = []
  let seq = 0

  for (const dateStr of visibleDateKeys) {
    if (!isDashboardWidgetScheduleDayForDateKey(dateStr)) continue
    const maxSlots = Math.min(2, pool.length)
    for (let s = 0; s < maxSlots; s++) {
      seq += 1
      const program = pool[s % pool.length]
      const round = program.rounds?.[0]
      const startHour = 9 + ((seq + s) % 7)
      const startTime = `${String(startHour).padStart(2, '0')}:00`
      const endTime = `${String(Math.min(startHour + 2, 18)).padStart(2, '0')}:00`

      schedules.push({
        id: `sch-gemini-vis-${dateStr}-${s}` as UUID,
        programId: program.id,
        roundId: round?.id,
        title: `${scheduleTitles[(seq - 1) % scheduleTitles.length]} ${s + 1}차시`,
        date: dateStr,
        startTime,
        endTime,
        location: locations[(seq - 1) % locations.length],
        instructorId: mockInstructors[(seq - 1) % mockInstructors.length]?.id,
        createdAt,
        updatedAt: createdAt,
      })
    }
  }

  return schedules
}

/**
 * UJAT(봉사) 프로그램 일정 위젯: 가시 구간 동적 목 일정
 */
export function buildUjatSchedulesForVisibleRange(
  visibleDateKeys: string[],
  allowedProgramIdSet: Set<string> | null
): Schedule[] {
  const ujatPrograms = getUjatPrograms()
  if (ujatPrograms.length === 0) return []

  const pool =
    allowedProgramIdSet == null
      ? ujatPrograms
      : ujatPrograms.filter(p => allowedProgramIdSet.has(p.id))

  if (pool.length === 0) return []

  const createdAt = new Date().toISOString()
  const schedules: Schedule[] = []
  let seq = 0

  for (const dateStr of visibleDateKeys) {
    if (!isDashboardWidgetScheduleDayForDateKey(dateStr)) continue
    const maxSlots = Math.min(2, pool.length)
    for (let s = 0; s < maxSlots; s++) {
      seq += 1
      const program = pool[s % pool.length]
      const round = program.rounds?.[0]
      const startHour = 9 + ((seq + s) % 7)
      const startTime = `${String(startHour).padStart(2, '0')}:00`
      const endTime = `${String(Math.min(startHour + 2, 18)).padStart(2, '0')}:00`

      schedules.push({
        id: `sch-ujat-vis-${dateStr}-${s}` as UUID,
        programId: program.id,
        roundId: round?.id,
        title: `${scheduleTitles[(seq - 1) % scheduleTitles.length]} ${s + 1}차시`,
        date: dateStr,
        startTime,
        endTime,
        location: locations[(seq - 1) % locations.length],
        instructorId: mockInstructors[(seq - 1) % mockInstructors.length]?.id,
        createdAt,
        updatedAt: createdAt,
      })
    }
  }

  return schedules
}

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
