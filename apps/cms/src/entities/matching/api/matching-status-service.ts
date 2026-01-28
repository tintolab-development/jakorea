/**
 * 매칭 현황 서비스
 * Phase 4.4: 매칭 관리 (FR-F03)
 */

import type { UUID } from '@/types'
import { matchingService } from './matching-service'
import { scheduleService } from '@/entities/schedule/api/schedule-service'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { mockApplications } from '@/data/mock/applications'

export interface MatchingStatusItem {
  id: string
  date: string
  schoolName: string
  programName: string
  instructors: {
    id: string
    name: string
    role: 'LEAD' | 'SUPPORT'
  }[]
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED'
  scheduleId?: UUID
  programId: UUID
}

export interface MatchingStatusFilters {
  startDate?: string
  endDate?: string
  programId?: UUID
  schoolId?: UUID
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'ALL'
}

/**
 * Matching 상태를 MatchingStatusItem 상태로 변환
 */
function mapMatchingStatusToStatusItem(
  status: string
): 'PENDING' | 'CONFIRMED' | 'COMPLETED' {
  switch (status) {
    case 'pending':
      return 'PENDING'
    case 'active':
    case 'confirmed':
      return 'CONFIRMED'
    case 'completed':
      return 'COMPLETED'
    default:
      return 'PENDING'
  }
}

/**
 * 매칭 현황 목록 조회
 */
export async function getMatchingStatusList(
  filters?: MatchingStatusFilters
): Promise<MatchingStatusItem[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 모든 매칭 조회
  const allMatchings = await matchingService.getAll()

  // 매칭 현황 아이템으로 변환
  const statusItems: MatchingStatusItem[] = []

  for (const matching of allMatchings) {
    // Schedule 정보 가져오기
    const schedule = matching.scheduleId
      ? await scheduleService.getById(matching.scheduleId)
      : null

    if (!schedule) continue

    // Program 정보 가져오기
    const program = programService.getByIdSync(matching.programId)
    if (!program) continue

    // 학교 정보 찾기 (Application에서 school 타입 찾기)
    const schoolApplication = mockApplications.find(
      app =>
        app.programId === matching.programId &&
        app.subjectType === 'school' &&
        app.status === 'approved'
    )

    const school = schoolApplication
      ? schoolService.getByIdSync(schoolApplication.subjectId)
      : null

    // 강사 정보 가져오기
    const instructor = instructorService.getByIdSync(matching.instructorId)
    if (!instructor) continue

    // 날짜 필터 적용
    const scheduleDate = typeof schedule.date === 'string' ? schedule.date : schedule.date.toISOString().split('T')[0]
    if (filters?.startDate && scheduleDate < filters.startDate) continue
    if (filters?.endDate && scheduleDate > filters.endDate) continue

    // 프로그램 필터 적용
    if (filters?.programId && matching.programId !== filters.programId) continue

    // 학교 필터 적용
    if (filters?.schoolId && schoolApplication?.subjectId !== filters.schoolId) continue

    // 상태 필터 적용
    const itemStatus = mapMatchingStatusToStatusItem(matching.status)
    if (filters?.status && filters.status !== 'ALL' && itemStatus !== filters.status) continue

    statusItems.push({
      id: matching.id,
      date: scheduleDate,
      schoolName: school?.name || '미지정',
      programName: program.title,
      instructors: [
        {
          id: instructor.id,
          name: instructor.name,
          role: 'LEAD', // 기본적으로 대표강사로 설정
        },
      ],
      status: itemStatus,
      scheduleId: schedule.id,
      programId: matching.programId,
    })
  }

  // 날짜순 정렬
  return statusItems.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * 캘린더용 매칭 현황 조회 (월별)
 */
export async function getMatchingStatusCalendar(
  year: number,
  month: number
): Promise<Record<string, MatchingStatusItem[]>> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  const items = await getMatchingStatusList({
    startDate,
    endDate,
  })

  // 날짜별로 그룹화
  const grouped: Record<string, MatchingStatusItem[]> = {}
  for (const item of items) {
    if (!grouped[item.date]) {
      grouped[item.date] = []
    }
    grouped[item.date].push(item)
  }

  return grouped
}
