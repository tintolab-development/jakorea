/**
 * 알림 서비스 (Mock)
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import type { UUID, DateValue } from '@/types'
import type { UserRole } from '@/types/user'

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

export async function getNotifications(
  _userId?: UUID,
  userRole: UserRole = 'INDIVIDUAL'
): Promise<Notification[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const now = new Date()

  const createNotification = (
    id: string,
    type: NotificationType,
    title: string,
    message: string,
    link: string | undefined,
    read: boolean,
    hoursAgo: number
  ): Notification => ({
    id,
    type,
    title,
    message,
    link,
    read,
    createdAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
  })

  const notificationsByRole: Record<UserRole, Notification[]> = {
    ADMIN: [
      createNotification(
        'notif-admin-1',
        'system',
        '시스템 알림',
        '신규 기능이 배포되었습니다.',
        '/',
        false,
        1
      ),
      createNotification(
        'notif-admin-2',
        'matching',
        '매칭 요청',
        '봉사 프로그램 매칭 요청이 들어왔습니다.',
        '/volunteers/programs',
        false,
        4
      ),
      createNotification(
        'notif-admin-3',
        'settlement',
        '정산 승인 대기',
        '정산 승인 대기 건이 있습니다.',
        '/settlements',
        false,
        6
      ),
      createNotification(
        'notif-admin-4',
        'matching',
        '매칭 완료',
        '새로운 강사 매칭이 완료되었습니다.',
        '/instructors',
        false,
        8
      ),
      createNotification(
        'notif-admin-5',
        'system',
        '시스템 알림',
        '프로그램 신청 마감일이 다가옵니다.',
        '/programs',
        false,
        12
      ),
      createNotification(
        'notif-admin-6',
        'settlement',
        '정산 요청',
        '새로운 정산 신청이 접수되었습니다.',
        '/settlements',
        false,
        15
      ),
      createNotification(
        'notif-admin-7',
        'matching',
        '매칭 요청',
        '학교 프로그램 매칭 요청이 들어왔습니다.',
        '/programs',
        false,
        18
      ),
      createNotification(
        'notif-admin-8',
        'system',
        '시스템 알림',
        '월간 리포트가 생성되었습니다.',
        '/',
        true,
        24
      ),
      createNotification(
        'notif-admin-9',
        'settlement',
        '정산 완료',
        '정산 승인이 완료되었습니다.',
        '/settlements',
        true,
        30
      ),
      createNotification(
        'notif-admin-10',
        'matching',
        '매칭 알림',
        '봉사자 매칭 상태가 변경되었습니다.',
        '/volunteers',
        true,
        36
      ),
    ],
    INSTRUCTOR: [
      createNotification(
        'notif-inst-1',
        'schedule',
        '다가오는 일정',
        '내일 오후 2시 "JA 경제 교육" 프로그램 일정이 있습니다.',
        '/schedules/my',
        false,
        2
      ),
      createNotification(
        'notif-inst-2',
        'matching',
        '새 매칭 알림',
        '"JA 창업 캠프" 프로그램에 매칭되었습니다.',
        '/programs/my',
        false,
        5
      ),
      createNotification(
        'notif-inst-3',
        'settlement',
        '정산 완료',
        '2025년 1월 정산이 승인되었습니다.',
        '/settlements/my',
        true,
        24
      ),
    ],
    INDIVIDUAL: [
      createNotification(
        'notif-individual-1',
        'system',
        '할일',
        '마이페이지에서 확인해야 할 작업이 있습니다.',
        '/mypage',
        false,
        3
      ),
      createNotification(
        'notif-individual-2',
        'schedule',
        '일정',
        '예정된 프로그램 일정이 있습니다.',
        '/schedules/my',
        false,
        10
      ),
      createNotification(
        'notif-individual-3',
        'system',
        '개별 안내사항',
        '신청한 프로그램 관련 안내사항이 도착했습니다.',
        '/notices',
        true,
        30
      ),
    ],
    SCHOOL: [
      createNotification(
        'notif-school-1',
        'system',
        '할일',
        '학교 단위 신청 관련 확인이 필요합니다.',
        '/mypage',
        false,
        3
      ),
      createNotification(
        'notif-school-2',
        'schedule',
        '일정',
        '예정된 프로그램 일정이 있습니다.',
        '/schedules/my',
        false,
        10
      ),
    ],
  }

  const notifications = notificationsByRole[userRole] || []

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
