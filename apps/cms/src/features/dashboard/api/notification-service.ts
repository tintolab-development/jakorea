/**
 * 알림 서비스 (Mock)
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import type { UUID, DateValue } from '@/types'

export type NotificationType = 'schedule' | 'matching' | 'settlement' | 'system'

export interface Notification {
  id: UUID
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: DateValue
}

/**
 * 알림 목록 조회
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getNotifications(_userId?: UUID): Promise<Notification[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  // Mock 데이터 생성
  const now = new Date()
  const notifications: Notification[] = [
    {
      id: 'notif-1',
      type: 'schedule',
      title: '다가오는 일정',
      message: '내일 오후 2시 "JA 경제 교육" 프로그램 일정이 있습니다.',
      link: '/schedules/my', // 본인 일정 목록 페이지로 이동
      read: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
    },
    {
      id: 'notif-2',
      type: 'matching',
      title: '새 매칭 알림',
      message: '"JA 창업 캠프" 프로그램에 매칭되었습니다.',
      link: '/programs/my', // 본인 프로그램 목록 페이지로 이동
      read: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
    },
    {
      id: 'notif-3',
      type: 'settlement',
      title: '정산 완료',
      message: '2025년 1월 정산이 승인되었습니다.',
      link: '/settlements/my', // 본인 정산 목록 페이지로 이동
      read: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    },
    {
      id: 'notif-4',
      type: 'settlement',
      title: '정산 지급 완료',
      message: '2024년 12월 정산이 지급 완료되었습니다.',
      link: '/settlements/my', // 본인 정산 목록 페이지로 이동
      read: false,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12시간 전
    },
    {
      id: 'notif-5',
      type: 'system',
      title: '시스템 공지',
      message: '새로운 기능이 추가되었습니다.',
      link: '/dashboard', // 공지사항 페이지가 없으므로 대시보드로 이동
      read: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
    },
  ]

  return notifications.sort((a, b) => {
    // 읽지 않은 알림 우선, 그 다음 최신순
    if (a.read !== b.read) {
      return a.read ? 1 : -1
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

/**
 * 알림 읽음 처리
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function markNotificationAsRead(_notificationId?: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100))
  // Mock: 실제로는 API 호출
}

/**
 * 모든 알림 읽음 처리
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function markAllNotificationsAsRead(_userId?: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100))
  // Mock: 실제로는 API 호출
}

/**
 * 알림 삭제
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteNotification(_notificationId?: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100))
  // Mock: 실제로는 API 호출
}

