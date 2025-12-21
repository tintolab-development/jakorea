/**
 * 강의/봉사 활동 Mock 데이터
 * Phase 5.7, 5.8: 강의 상세 및 봉사 상세 화면용 샘플 데이터
 */

import type { LectureActivity, VolunteerActivity, NextRequiredAction } from '../../types/domain'
import { mockSchedules, mockPrograms } from './index'

const getDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

// 강의 활동 Mock 데이터
export const mockLectureActivities: LectureActivity[] = mockSchedules
  .filter(schedule => schedule.instructorId)
  .slice(0, 15)
  .map((schedule, index) => {
    const program = mockPrograms.find(p => p.id === schedule.programId)

    // 상태 결정 (날짜 기반)
    const scheduleDate = new Date(schedule.date)
    const now = new Date()
    let status: LectureActivity['status'] = 'LECT_01'

    if (scheduleDate < now) {
      status = 'LECT_03' // 완료
    } else if (
      scheduleDate.toDateString() === now.toDateString()
    ) {
      status = 'LECT_02' // 진행 중
    }

    // nextRequiredAction 결정
    let nextRequiredAction: NextRequiredAction
    if (status === 'LECT_01') {
      nextRequiredAction = { type: 'NONE' }
    } else if (status === 'LECT_02') {
      nextRequiredAction = {
        type: 'COMPLETE',
        targetUrl: `/lectures/${schedule.id}/complete`,
      }
    } else {
      // 완료 후 보고서 제출 필요 여부 (Mock: 랜덤)
      nextRequiredAction = Math.random() > 0.3
        ? {
            type: 'REPORT',
            targetUrl: `/reports/new?type=lecture&activityId=lect-${String(index + 1).padStart(3, '0')}`,
          }
        : { type: 'NONE' }
    }

    return {
      id: `lect-${String(index + 1).padStart(3, '0')}`,
      scheduleId: schedule.id,
      programId: schedule.programId,
      instructorId: schedule.instructorId!,
      status,
      roleDescription: `${program?.title || '프로그램'}에서 강사로 참여하여 ${program?.format === 'workshop' ? '워크샵' : program?.format === 'seminar' ? '세미나' : '강의'}를 진행합니다.`,
      nextRequiredAction,
      createdAt: getDate(30 - index),
      updatedAt: getDate(5 - index % 5),
    }
  })

// 봉사 활동 Mock 데이터
export const mockVolunteerActivities: VolunteerActivity[] = mockSchedules
  .filter(schedule => !schedule.instructorId)
  .slice(0, 15)
  .map((schedule, index) => {
    const program = mockPrograms.find(p => p.id === schedule.programId)

    // 상태 결정 (날짜 기반)
    const scheduleDate = new Date(schedule.date)
    const now = new Date()
    let status: VolunteerActivity['status'] = 'VOL_01'

    if (scheduleDate < now) {
      status = 'VOL_03' // 완료
    } else if (
      scheduleDate.toDateString() === now.toDateString()
    ) {
      status = 'VOL_02' // 진행 중
    }

    // nextRequiredAction 결정
    let nextRequiredAction: NextRequiredAction
    if (status === 'VOL_01') {
      nextRequiredAction = { type: 'NONE' }
    } else if (status === 'VOL_02') {
      nextRequiredAction = {
        type: 'COMPLETE',
        targetUrl: `/volunteers/vol-${String(index + 1).padStart(3, '0')}/complete`,
      }
    } else {
      // 완료 후 보고서 제출 필요 여부 (Mock: 랜덤)
      nextRequiredAction = Math.random() > 0.3
        ? {
            type: 'REPORT',
            targetUrl: `/reports/new?type=volunteer&activityId=vol-${String(index + 1).padStart(3, '0')}`,
          }
        : { type: 'NONE' }
    }

    return {
      id: `vol-${String(index + 1).padStart(3, '0')}`,
      scheduleId: schedule.id,
      programId: schedule.programId,
      volunteerId: `volunteer-${String(index + 1).padStart(3, '0')}`, // Mock volunteer ID
      status,
      roleDescription: `${program?.title || '프로그램'}에서 봉사자로 참여하여 교육 활동을 지원합니다.`,
      volunteerHoursInfo: {
        hours: Math.floor(Math.random() * 4) + 2, // 2-5시간
      },
      nextRequiredAction,
      createdAt: getDate(30 - index),
      updatedAt: getDate(5 - index % 5),
    }
  })

export const mockLectureActivitiesMap = new Map(
  mockLectureActivities.map(activity => [activity.id, activity])
)

export const mockVolunteerActivitiesMap = new Map(
  mockVolunteerActivities.map(activity => [activity.id, activity])
)

