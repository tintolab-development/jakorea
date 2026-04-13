/**
 * 메인 헤더 컴포넌트 (콘텐츠 상단)
 * Phase: 유저 로그인 정보를 사이드바에서 헤더로 이동
 * 알림, 유저 정보, 설정, 로그아웃을 상단 헤더에 배치
 * 카테고리별 동적 타이틀 표시
 */

import { Layout, Button, Space, Typography, Avatar, Dropdown } from 'antd'
import { BellOutlined, BellFilled, UserOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useNotifications } from '@/features/dashboard/hooks/use-notifications'
import { getRoleLabel, AppBreadcrumb, LogoutIcon } from '@/shared/ui'
import { useBreadcrumb } from '@/shared/hooks'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { normalizeMemberListKind } from '@/shared/config/member-list-kinds'
import { getAdminLevelLabel } from '@/shared/config/permissions'
import type { Notification } from '@/features/dashboard/api/notification-service'
import { NotificationDropdown } from '@/features/dashboard/ui/notification-dropdown'
import './main-header.css'

const { Header: AntHeader } = Layout
const { Text } = Typography

/** 임시: true로 변경 시 브레드크럼 표시 */
const SHOW_BREADCRUMB = false

export function MainHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, checkAuth } = useAuthStore()
  const { notifications, unreadCount, markAsRead, removeNotification } = useNotifications()
  const { items: breadcrumbItems } = useBreadcrumb()
  const [dropdownOpen, setDropdownOpen] = useState(false)

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

  // 카테고리명 동적 계산 - 메뉴 설정과 자동 동기화 (사용자 권한 고려)
  const categoryName = useMemo(() => {
    // 대시보드 홈 특수 처리
    if (user?.role === 'ADMIN' && location.pathname === '/') {
      return '대시보드 홈'
    }

    // 관리자: 회원 목록 통합 `/users/list?kind=…`
    if (user?.role === 'ADMIN' && location.pathname === '/users/list') {
      const kind = normalizeMemberListKind(new URLSearchParams(location.search).get('kind'))
      if (kind === 'institutions') return '학교(교사) 회원 관리'
      if (kind === 'instructors') return '강사 회원 관리'
      if (kind === 'admins') return '관리자 회원 관리'
      if (kind === 'individual') return '개인 회원 관리'
      return '전체 회원 관리'
    }

    // 관리자: 강사 모집 경로 — 레이아웃 타이틀 '강의 신청 현황'
    if (
      user?.role === 'ADMIN' &&
      location.pathname === '/programs/education/instructor-recruitment'
    ) {
      return '강의 신청 현황'
    }

    // 관리자: 교육 프로그램 하위(수강자 모집/수강 신청 현황) — 레이아웃 타이틀 '수강 신청 현황'
    if (
      user?.role === 'ADMIN' &&
      (location.pathname === '/programs/education/student-recruitment' ||
        location.pathname === '/programs/education/enrollment')
    ) {
      return '수강 신청 현황'
    }

    // 관리자: 권한 승인 목록 — 콘텐츠 상단 타이틀만 '회원 권한 승인' (LNB 라벨은 menu-config '권한 승인' 유지)
    const permissionRequestsBase = '/admin/permission-requests'
    if (
      user?.role === 'ADMIN' &&
      (location.pathname === permissionRequestsBase ||
        location.pathname.startsWith(`${permissionRequestsBase}/`))
    ) {
      return '회원 권한 승인'
    }

    // 관리자: 프로그램 상세/수정 페이지 타이틀
    const programsReserved = ['my', 'favorites', 'volunteer', 'education', 'economy-education', 'new', 'satisfaction']
    if (user?.role === 'ADMIN' && location.pathname.startsWith('/programs/')) {
      const rest = location.pathname.slice('/programs/'.length)
      const segments = rest.split('/').filter(Boolean)
      const first = segments[0]
      if (first && !programsReserved.includes(first)) {
        return segments[1] === 'edit' ? '프로그램 수정' : '프로그램 상세'
      }
    }

    // 내 학습 관리 리다이렉트 경로 우선 확인 (권한별 렌더링 확실히)
    // /my-learning은 역할별로 다른 경로로 리다이렉트되지만, 헤더 타이틀은 "내 학습 관리"로 통일
    if (user?.role && user.role !== 'ADMIN') {
      const normalizedPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '')
      if (
        (user.role === 'INSTRUCTOR' && normalizedPath.startsWith('/instructor/schedule')) ||
        (user.role === 'INDIVIDUAL' && normalizedPath.startsWith('/schedules/my')) ||
        (user.role === 'SCHOOL' && normalizedPath === '/school/my-learning')
      ) {
        return '내 학습 관리'
      }
    }

    // 메뉴 설정에서 카테고리명 자동 감지 (사용자 권한별 필터링된 메뉴에서 검색)
    // 3뎁스부터 우선 확인 (가장 구체적인 경로)
    const depth3Name = getCategoryNameByPath(location.pathname, 3, user?.role, user)
    if (depth3Name) {
      return depth3Name
    }

    // 2뎁스 확인
    const depth2Name = getCategoryNameByPath(location.pathname, 2, user?.role, user)
    if (depth2Name) {
      return depth2Name
    }

    // 1뎁스 확인
    const depth1Name = getCategoryNameByPath(location.pathname, 1, user?.role, user)
    if (depth1Name) {
      return depth1Name
    }

    // 기본값
    return user?.role === 'ADMIN' ? '대시보드 홈' : '메인 홈'
  }, [location.pathname, location.search, user?.role, user])

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
      setDropdownOpen(false)
    }
  }

  const handleConfirm = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id)
      }
      await removeNotification(notification.id)
      if (notification.link) {
        navigate(notification.link)
        setDropdownOpen(false)
      }
    } catch (error) {
      console.error('알림 확인 처리 실패:', error)
    }
  }

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
            {/* 임시 비표시: 브레드크럼 (SHOW_BREADCRUMB true 시 복구) */}
            {SHOW_BREADCRUMB && breadcrumbItems.length > 0 && (
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
            {/* 알림 — 드롭다운 */}
            <Dropdown
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              trigger={['click']}
              placement="bottomRight"
              overlayStyle={{ overflow: 'visible' }}
              dropdownRender={() => (
                <div className="main-header-notification-dropdown">
                  <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onNotificationClick={handleNotificationClick}
                    onConfirm={handleConfirm}
                    onClose={() => setDropdownOpen(false)}
                  />
                </div>
              )}
            >
              <div
                className="main-header-notification-badge"
                role="button"
                tabIndex={0}
              >
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
              icon={<LogoutIcon size={20} />}
              className="main-header-icon-button"
              onClick={handleLogout}
            />
          </Space>
        </div>
      </div>
    </AntHeader>
  )
}
