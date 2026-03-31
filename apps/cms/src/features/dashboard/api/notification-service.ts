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
  /** 프로그램명 (알림 위젯 두 번째 라인) */
  programName?: string
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
    hoursAgo: number,
    programName?: string
  ): Notification => ({
    id,
    type,
    title,
    message,
    programName,
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
        1,
        'JA코리아 관리자 시스템'
      ),
      createNotification(
        'notif-admin-2',
        'matching',
        '매칭 요청',
        '신규 참여 신청자가 있습니다.',
        '/programs/volunteer',
        false,
        4,
        'HSBC/HKU Business Case Competition 2026'
      ),
      createNotification(
        'notif-admin-3',
        'settlement',
        '정산 승인 대기',
        '정산 승인 대기 건이 있습니다.',
        '/programs/education/enrollment',
        false,
        6,
        '1사1교 경제금융교육 1차'
      ),
      createNotification(
        'notif-admin-4',
        'matching',
        '매칭 완료',
        '대표 강사 김틴토님이 게시글을 작성하였습니다.',
        '/users/list?kind=instructors',
        false,
        8,
        'HSBC/HKU Business Case Competition 2026'
      ),
      createNotification(
        'notif-admin-5',
        'system',
        '시스템 알림',
        '프로그램 신청 마감일이 다가옵니다.',
        '/programs',
        false,
        12,
        '창업대회 디자인 세미나'
      ),
      createNotification(
        'notif-admin-6',
        'settlement',
        '정산 요청',
        '새로운 정산 신청이 접수되었습니다.',
        '/programs/education/enrollment',
        false,
        15,
        '그램 역사 특강 2차시'
      ),
      createNotification(
        'notif-admin-7',
        'matching',
        '매칭 요청',
        '신규 강사 권한 요청이 있습니다.',
        '/programs',
        false,
        18,
        '기타 프로그램 지리학 강의 3차시'
      ),
      createNotification(
        'notif-admin-8',
        'system',
        '시스템 알림',
        '월간 리포트가 생성되었습니다.',
        '/',
        true,
        24,
        'JA코리아 관리자 시스템'
      ),
      createNotification(
        'notif-admin-9',
        'settlement',
        '정산 완료',
        '정산 승인이 완료되었습니다.',
        '/programs/education/enrollment',
        true,
        30,
        '1사1교 경제금융교육 1차'
      ),
      createNotification(
        'notif-admin-10',
        'matching',
        '매칭 알림',
        '박틴토 담당교사님이 정보를 수정하였습니다.',
        '/programs/volunteer',
        true,
        36,
        'HSBC/HKU Business Case Competition 2026'
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
        2,
        'JA 경제 교육'
      ),
      createNotification(
        'notif-inst-2',
        'matching',
        '새 매칭 알림',
        '"JA 창업 캠프" 프로그램에 매칭되었습니다.',
        '/programs/my',
        false,
        5,
        'JA 창업 캠프'
      ),
      createNotification(
        'notif-inst-3',
        'settlement',
        '정산 완료',
        '2025년 1월 정산이 승인되었습니다.',
        '/settlements/my',
        true,
        24,
        'JA 경제 교육'
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
        3,
        '마이페이지'
      ),
      createNotification(
        'notif-individual-2',
        'schedule',
        '일정',
        '예정된 프로그램 일정이 있습니다.',
        '/schedules/my',
        false,
        10,
        '내 일정'
      ),
      createNotification(
        'notif-individual-3',
        'system',
        '개별 안내사항',
        '신청한 프로그램 관련 안내사항이 도착했습니다.',
        '/notices',
        true,
        30,
        '공지사항'
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
        3,
        '학교 신청'
      ),
      createNotification(
        'notif-school-2',
        'schedule',
        '일정',
        '예정된 프로그램 일정이 있습니다.',
        '/schedules/my',
        false,
        10,
        '내 일정'
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
