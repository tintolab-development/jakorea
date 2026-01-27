/**
 * 메인 헤더 컴포넌트 (콘텐츠 상단)
 * Phase: 유저 로그인 정보를 사이드바에서 헤더로 이동
 * 알림, 유저 정보, 설정, 로그아웃을 상단 헤더에 배치
 * 카테고리별 동적 타이틀 표시
 */

import { Layout, Dropdown, Button, Space, Typography, Avatar } from 'antd'
import { BellOutlined, BellFilled, UserOutlined, ExportOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useNotifications } from '@/features/dashboard/hooks/use-notifications'
import { getRoleLabel, AppBreadcrumb } from '@/shared/ui'
import { useBreadcrumb } from '@/shared/hooks'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { getAdminLevelLabel } from '@/shared/config/permissions'
import type { Notification } from '@/features/dashboard/api/notification-service'
import { timeSince } from '@/shared/utils/date'
import './main-header.css'

const { Header: AntHeader } = Layout
const { Text } = Typography

export function MainHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, checkAuth } = useAuthStore()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const { items: breadcrumbItems } = useBreadcrumb()

  // 상태 동기화 확인: user 상태 변경 시 권한 정보 업데이트 확인
  useEffect(() => {
    // 컴포넌트 마운트 시 및 주기적으로 인증 상태 확인
    const interval = setInterval(
      () => {
        checkAuth().catch(() => {
          // 에러는 조용히 처리 (이미 로그아웃 처리됨)
        })
      },
      5 * 60 * 1000
    ) // 5분마다 확인

    return () => clearInterval(interval)
  }, [checkAuth])

  // 카테고리명 동적 계산
  const categoryName = (() => {
    // 관리자 홈
    if (user?.role === 'ADMIN' && location.pathname === '/') {
      return '관리자 홈'
    }
    // 프로그램 관리 1/2/3뎁스: 3뎁스(목록·일정·수강/강의 신청 현황)는 3뎁스 라벨, 2뎁스(봉사)는 2뎁스 라벨
    if (user?.role === 'ADMIN' && location.pathname.startsWith('/programs')) {
      if (location.pathname === '/programs/education/schedule') {
        return '프로그램 일정'
      }
      if (location.pathname === '/programs/education') {
        return '프로그램 목록'
      }
      if (location.pathname === '/programs/volunteer') {
        return '봉사 프로그램'
      }
      if (location.pathname === '/programs') {
        return '프로그램 현황'
      }
    }
    if (
      user?.role === 'ADMIN' &&
      (location.pathname === '/applications' || location.pathname === '/instructor-applications')
    ) {
      return (
        getCategoryNameByPath(location.pathname, 3) ||
        (location.pathname === '/applications' ? '수강 신청 현황' : '강의 신청 현황')
      )
    }
    // 기본: 메뉴 설정에서 카테고리명 가져오기
    return getCategoryNameByPath(location.pathname, 1) || '메인 홈'
  })()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const handleViewAllNotifications = () => {
    navigate('/')
  }

  // 알림 드롭다운 메뉴
  const unreadNotifications = notifications.filter(n => !n.read).slice(0, 5)
  const notificationMenuItems =
    unreadNotifications.length > 0
      ? [
          ...unreadNotifications.map(notification => ({
            key: notification.id,
            label: (
              <div
                className="main-header-notification-item"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="main-header-notification-title">{notification.title}</div>
                <div className="main-header-notification-message">{notification.message}</div>
                <div className="main-header-notification-time">
                  {timeSince(notification.createdAt)}
                </div>
              </div>
            ),
          })),
          {
            type: 'divider' as const,
          },
          {
            key: 'view-all',
            label: (
              <Button type="link" block onClick={handleViewAllNotifications}>
                더보기
              </Button>
            ),
          },
        ]
      : [
          {
            key: 'no-notifications',
            label: (
              <div
                className="main-header-notification-item"
                style={{ textAlign: 'center', padding: '16px' }}
              >
                <Text type="secondary">알림이 없습니다</Text>
              </div>
            ),
            disabled: true,
          },
        ]

  // 세부 권한 정보 계산 (상태 동기화 확인)
  const userRoleLabel = useMemo(() => {
    if (!user) return ''

    // 관리자인 경우 adminLevel에 따른 세부 권한 표시
    if (user.role === 'ADMIN' && user.adminLevel) {
      return getAdminLevelLabel(user.adminLevel)
    }

    // 일반 역할인 경우 기본 라벨 사용
    return getRoleLabel(user.role, user.adminLevel)
  }, [user?.role, user?.adminLevel])

  if (!user) {
    return null
  }

  const userName = user.name

  return (
    <AntHeader className="main-header">
      <div className="main-header-content">
        <div className="main-header-left">
          <div className="main-header-title-wrap">
            <h1 className="main-header-title">{categoryName}</h1>
            {breadcrumbItems.length > 0 && (
              <AppBreadcrumb
                items={breadcrumbItems}
                separator=" > "
                className="main-header-breadcrumb"
              />
            )}
          </div>
        </div>
        <div className="main-header-right">
          <Space size="middle" align="center">
            {/* 알림 - 타원형 배지 스타일 */}
            <Dropdown
              menu={{ items: notificationMenuItems }}
              placement="bottomRight"
              trigger={['click']}
              overlayClassName="main-header-notification-dropdown"
            >
              <div className="main-header-notification-badge">
                {unreadCount > 0 ? (
                  <BellFilled className="main-header-notification-icon" />
                ) : (
                  <BellOutlined className="main-header-notification-icon" />
                )}
                <Text className="main-header-notification-count">{unreadCount}건</Text>
              </div>
            </Dropdown>

            {/* 유저 정보 */}
            <div className="main-header-user-info">
              <Text className="main-header-user-role">{userRoleLabel}</Text>
              <div className="main-header-user-divider" />
              <Text className="main-header-user-name" strong>
                {userName}
              </Text>
              <Avatar size={32} icon={<UserOutlined />} className="main-header-avatar" />
            </div>

            {/* 로그아웃 */}
            <Button
              type="text"
              icon={<ExportOutlined style={{ fontSize: 16 }} />}
              className="main-header-icon-button"
              onClick={handleLogout}
            />
          </Space>
        </div>
      </div>
    </AntHeader>
  )
}
